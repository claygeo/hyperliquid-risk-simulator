import { useState, useEffect, useRef, useCallback } from 'react';
import { AllMidsResponse } from '../types';

const WS_URL = 'wss://api.hyperliquid.xyz/ws';

interface UseWebSocketOptions {
  enabled?: boolean;
  onPriceUpdate?: (prices: AllMidsResponse) => void;
  throttleMs?: number; // Throttle updates to prevent UI flicker
}

interface UseWebSocketReturn {
  prices: AllMidsResponse;
  isConnected: boolean;
  error: string | null;
  reconnect: () => void;
}

export const useWebSocket = ({
  enabled = true,
  onPriceUpdate,
  throttleMs = 2000, // Default: update UI every 2 seconds max
}: UseWebSocketOptions = {}): UseWebSocketReturn => {
  const [prices, setPrices] = useState<AllMidsResponse>({});
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateRef = useRef<number>(0);
  const pendingPricesRef = useRef<AllMidsResponse | null>(null);
  const throttleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const mountedRef = useRef(true);

  // Throttled price update to prevent UI flicker
  const updatePrices = useCallback((newPrices: AllMidsResponse) => {
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateRef.current;
    
    if (timeSinceLastUpdate >= throttleMs) {
      // Enough time has passed, update immediately
      lastUpdateRef.current = now;
      setPrices(newPrices);
      onPriceUpdate?.(newPrices);
    } else {
      // Store pending update and schedule
      pendingPricesRef.current = newPrices;
      
      if (!throttleTimeoutRef.current) {
        throttleTimeoutRef.current = setTimeout(() => {
          if (pendingPricesRef.current && mountedRef.current) {
            lastUpdateRef.current = Date.now();
            setPrices(pendingPricesRef.current);
            onPriceUpdate?.(pendingPricesRef.current);
            pendingPricesRef.current = null;
          }
          throttleTimeoutRef.current = null;
        }, throttleMs - timeSinceLastUpdate);
      }
    }
  }, [throttleMs, onPriceUpdate]);

  const connect = useCallback(() => {
    if (!enabled || wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      // Clean up existing connection
      if (wsRef.current) {
        wsRef.current.close();
      }

      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!mountedRef.current) return;
        
        setIsConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0;
        
        // Subscribe to all mid prices
        ws.send(JSON.stringify({
          method: 'subscribe',
          subscription: { type: 'allMids' }
        }));
      };

      ws.onmessage = (event) => {
        if (!mountedRef.current) return;
        
        try {
          const data = JSON.parse(event.data);
          
          // Handle allMids subscription data
          if (data.channel === 'allMids' && data.data?.mids) {
            updatePrices(data.data.mids);
          }
        } catch (e) {
          console.error('WebSocket message parse error:', e);
        }
      };

      ws.onerror = () => {
        if (!mountedRef.current) return;
        setError('WebSocket connection error');
      };

      ws.onclose = () => {
        if (!mountedRef.current) return;
        
        setIsConnected(false);
        
        // Attempt reconnection with exponential backoff
        if (reconnectAttemptsRef.current < maxReconnectAttempts && enabled) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
          reconnectAttemptsRef.current++;
          
          reconnectTimeoutRef.current = setTimeout(() => {
            if (mountedRef.current) {
              connect();
            }
          }, delay);
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          setError('Connection lost. Pull to refresh.');
        }
      };
    } catch (e) {
      setError('Failed to connect to WebSocket');
    }
  }, [enabled, updatePrices]);

  const reconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0;
    setError(null);
    connect();
  }, [connect]);

  // Connect on mount
  useEffect(() => {
    mountedRef.current = true;
    
    if (enabled) {
      connect();
    }
    
    return () => {
      mountedRef.current = false;
      
      // Clean up
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (throttleTimeoutRef.current) {
        clearTimeout(throttleTimeoutRef.current);
      }
    };
  }, [enabled, connect]);

  return {
    prices,
    isConnected,
    error,
    reconnect,
  };
};

export default useWebSocket;