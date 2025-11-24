import { useState, useCallback } from 'react';
import { Position, HyperliquidClearinghouseState } from '../types';
import { fetchUserPositions, fetchAllPrices, transformPositions } from '../services/hyperliquid';

interface UseHyperliquidReturn {
  positions: Position[];
  isLoading: boolean;
  error: string | null;
  fetchPositions: (address: string) => Promise<void>;
  accountData: HyperliquidClearinghouseState | null;
}

export const useHyperliquid = (): UseHyperliquidReturn => {
  const [positions, setPositions] = useState<Position[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accountData, setAccountData] = useState<HyperliquidClearinghouseState | null>(null);

  const fetchPositions = useCallback(async (address: string) => {
    if (!address) {
      setError('Please enter a valid address');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch clearinghouse state and prices in parallel
      const [clearinghouseState, prices] = await Promise.all([
        fetchUserPositions(address),
        fetchAllPrices(),
      ]);

      // Store the raw account data for Portfolio Summary
      setAccountData(clearinghouseState);

      // Transform to our internal Position format
      const transformedPositions = transformPositions(clearinghouseState, prices);
      
      if (transformedPositions.length === 0) {
        setError('No open positions found for this address');
        setPositions([]);
      } else {
        setPositions(transformedPositions);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch positions';
      setError(errorMessage);
      setPositions([]);
      setAccountData(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    positions,
    isLoading,
    error,
    fetchPositions,
    accountData,
  };
};

export default useHyperliquid;