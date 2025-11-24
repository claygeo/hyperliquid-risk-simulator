import axios from 'axios';
import {
  HyperliquidClearinghouseState,
  AllMidsResponse,
  Position,
  CandleData,
  OpenOrder,
  UserFill,
  LedgerUpdate,
  TwapSliceFill,
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
 * Fetch user's open orders
 */
export const fetchOpenOrders = async (address: string): Promise<OpenOrder[]> => {
  try {
    const response = await axios.post(HYPERLIQUID_API_URL, {
      type: 'openOrders',
      user: address,
    });

    return response.data.map((order: any) => ({
      oid: order.oid,
      coin: order.coin,
      side: order.side, // 'A' = Ask (sell), 'B' = Bid (buy)
      limitPx: order.limitPx,
      sz: order.sz,
      timestamp: order.timestamp,
      orderType: order.orderType || 'Limit',
    }));
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        `Failed to fetch open orders: ${error.response?.data?.message || error.message}`
      );
    }
    throw new Error('Failed to fetch open orders');
  }
};

/**
 * Fetch user's recent fills (up to 2000)
 */
export const fetchUserFills = async (address: string): Promise<UserFill[]> => {
  try {
    const response = await axios.post(HYPERLIQUID_API_URL, {
      type: 'userFills',
      user: address,
      aggregateByTime: true,
    });

    return response.data.map((fill: any) => ({
      coin: fill.coin,
      px: fill.px,
      sz: fill.sz,
      side: fill.side, // 'A' = Ask (sell), 'B' = Bid (buy)
      time: fill.time,
      dir: fill.dir, // 'Open Long', 'Close Long', 'Open Short', 'Close Short'
      closedPnl: fill.closedPnl,
      hash: fill.hash,
      oid: fill.oid,
      crossed: fill.crossed,
      fee: fill.fee,
      feeToken: fill.feeToken || 'USDC',
      tid: fill.tid,
      startPosition: fill.startPosition,
    }));
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        `Failed to fetch user fills: ${error.response?.data?.message || error.message}`
      );
    }
    throw new Error('Failed to fetch user fills');
  }
};

/**
 * Fetch user's non-funding ledger updates (deposits, withdrawals, transfers, liquidations)
 * Default: last 90 days
 */
export const fetchUserLedgerUpdates = async (
  address: string,
  startTime?: number,
  endTime?: number
): Promise<LedgerUpdate[]> => {
  try {
    const now = Date.now();
    const defaultStartTime = now - 90 * 24 * 60 * 60 * 1000; // 90 days ago

    const response = await axios.post(HYPERLIQUID_API_URL, {
      type: 'userNonFundingLedgerUpdates',
      user: address,
      startTime: startTime || defaultStartTime,
      endTime: endTime || now,
    });

    return response.data.map((update: any) => ({
      time: update.time,
      hash: update.hash,
      delta: update.delta,
    }));
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        `Failed to fetch ledger updates: ${error.response?.data?.message || error.message}`
      );
    }
    throw new Error('Failed to fetch ledger updates');
  }
};

/**
 * Fetch user's TWAP slice fills (up to 2000)
 */
export const fetchTwapFills = async (address: string): Promise<TwapSliceFill[]> => {
  try {
    const response = await axios.post(HYPERLIQUID_API_URL, {
      type: 'userTwapSliceFills',
      user: address,
    });

    return response.data.map((item: any) => ({
      twapId: item.twapId,
      fill: {
        coin: item.fill.coin,
        px: item.fill.px,
        sz: item.fill.sz,
        side: item.fill.side,
        time: item.fill.time,
        dir: item.fill.dir,
        closedPnl: item.fill.closedPnl,
        hash: item.fill.hash,
        oid: item.fill.oid,
        crossed: item.fill.crossed,
        fee: item.fill.fee,
        feeToken: item.fill.feeToken || 'USDC',
        tid: item.fill.tid,
        startPosition: item.fill.startPosition,
      },
    }));
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        `Failed to fetch TWAP fills: ${error.response?.data?.message || error.message}`
      );
    }
    throw new Error('Failed to fetch TWAP fills');
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