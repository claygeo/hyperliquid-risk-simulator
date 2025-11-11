import axios from 'axios';
import {
  HyperliquidClearinghouseState,
  AllMidsResponse,
  Position,
  CandleData,
} from '../types';

const HYPERLIQUID_API_URL = 'https://api.hyperliquid.xyz/info';

/**
 * Fetch user's open positions from Hyperliquid
 */
export const fetchUserPositions = async (
  address: string
): Promise<HyperliquidClearinghouseState> => {
  try {
    const response = await axios.post(HYPERLIQUID_API_URL, {
      type: 'clearinghouseState',
      user: address,
    });

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        `Failed to fetch positions: ${error.response?.data?.message || error.message}`
      );
    }
    throw new Error('Failed to fetch positions');
  }
};

/**
 * Fetch current mark prices for all assets
 */
export const fetchAllPrices = async (): Promise<AllMidsResponse> => {
  try {
    const response = await axios.post(HYPERLIQUID_API_URL, {
      type: 'allMids',
    });

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        `Failed to fetch prices: ${error.response?.data?.message || error.message}`
      );
    }
    throw new Error('Failed to fetch prices');
  }
};

/**
 * Fetch candlestick data for a specific coin
 */
export const fetchCandleData = async (
  coin: string,
  interval: string = '15m',
  lookbackHours: number = 24
): Promise<CandleData[]> => {
  try {
    const endTime = Date.now();
    const startTime = endTime - lookbackHours * 60 * 60 * 1000;

    const response = await axios.post(HYPERLIQUID_API_URL, {
      type: 'candleSnapshot',
      req: {
        coin: coin,
        interval: interval,
        startTime: startTime,
        endTime: endTime,
      },
    });

    // Transform API response to our format
    return response.data.map((candle: any) => ({
      time: candle.t,
      open: parseFloat(candle.o),
      high: parseFloat(candle.h),
      low: parseFloat(candle.l),
      close: parseFloat(candle.c),
      volume: parseFloat(candle.v),
    }));
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        `Failed to fetch candle data: ${error.response?.data?.message || error.message}`
      );
    }
    throw new Error('Failed to fetch candle data');
  }
};

/**
 * Transform Hyperliquid API response to internal Position format
 */
export const transformPositions = (
  clearinghouseState: HyperliquidClearinghouseState,
  prices: AllMidsResponse
): Position[] => {
  return clearinghouseState.assetPositions
    .map((item) => {
      // The position data is nested inside a "position" property
      const pos = item.position || item;
      
      const size = parseFloat(pos.szi);
      
      // Filter out closed positions
      if (size === 0) return null;
      
      const entryPrice = parseFloat(pos.entryPx);
      const currentPrice = parseFloat(prices[pos.coin] || '0');
      const liquidationPrice = pos.liquidationPx
        ? parseFloat(pos.liquidationPx)
        : null;
      const positionValue = parseFloat(pos.positionValue);
      const unrealizedPnl = parseFloat(pos.unrealizedPnl);

      // Handle leverage - it might be a number or an object with a value property
      let leverage: number;
      if (typeof pos.leverage === 'number') {
        leverage = pos.leverage;
      } else if (pos.leverage && typeof pos.leverage === 'object' && 'value' in pos.leverage) {
        leverage = pos.leverage.value;
      } else {
        // Fallback: calculate leverage from position value and margin
        leverage = Math.abs(positionValue) / (Math.abs(positionValue) / 10);
      }

      return {
        coin: pos.coin,
        side: size > 0 ? 'long' : 'short',
        size: Math.abs(size),
        entryPrice,
        currentPrice,
        leverage,
        liquidationPrice,
        unrealizedPnl,
        positionValue: Math.abs(positionValue),
        margin: Math.abs(positionValue) / leverage,
      };
    })
    .filter((pos): pos is Position => pos !== null);
};