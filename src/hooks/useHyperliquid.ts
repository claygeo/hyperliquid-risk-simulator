import { useState, useCallback } from 'react';
import { Position } from '../types';
import {
  fetchUserPositions,
  fetchAllPrices,
  transformPositions,
} from '../services/hyperliquid';

interface UseHyperliquidReturn {
  positions: Position[];
  isLoading: boolean;
  error: string | null;
  fetchPositions: (address: string) => Promise<void>;
  clearError: () => void;
}

export const useHyperliquid = (): UseHyperliquidReturn => {
  const [positions, setPositions] = useState<Position[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPositions = useCallback(async (address: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Validate address format
      if (!address.startsWith('0x') || address.length !== 42) {
        throw new Error('Invalid Ethereum address format');
      }

      // Fetch positions and prices in parallel
      const [clearinghouseState, prices] = await Promise.all([
        fetchUserPositions(address),
        fetchAllPrices(),
      ]);

      // Transform to internal format
      const transformedPositions = transformPositions(
        clearinghouseState,
        prices
      );

      if (transformedPositions.length === 0) {
        setError('No open positions found for this address');
        setPositions([]);
      } else {
        setPositions(transformedPositions);
      }
    } catch (err) {
      console.error('Error fetching positions:', err);
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch positions';
      setError(errorMessage);
      setPositions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    positions,
    isLoading,
    error,
    fetchPositions,
    clearError,
  };
};