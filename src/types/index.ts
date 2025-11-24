// Hyperliquid API Response Types
export interface HyperliquidPosition {
  coin: string;
  entryPx: string;
  liquidationPx: string | null;
  leverage: {
    value: number;
    type: string;
  } | number;
  positionValue: string;
  unrealizedPnl: string;
  returnOnEquity: string;
  szi: string; // Size (negative for short)
  marginUsed?: string;
  maxLeverage?: number;
  cumFunding?: {
    allTime: string;
    sinceOpen: string;
    sinceChange: string;
  };
}

export interface HyperliquidAssetPosition {
  type: string; // "oneWay" or other types
  position: HyperliquidPosition;
}

export interface HyperliquidClearinghouseState {
  assetPositions: HyperliquidAssetPosition[];
  marginSummary: {
    accountValue: string;
    totalNtlPos: string;
    totalRawUsd: string;
    totalMarginUsed?: string;
  };
  crossMarginSummary: {
    accountValue: string;
    totalMarginUsed: string;
    totalNtlPos: string;
    totalRawUsd: string;
  };
  withdrawable: string;
  time?: number;
}

export interface AllMidsResponse {
  [key: string]: string; // e.g., { "BTC": "43250.5", "ETH": "2234.8" }
}

// Candle Data Type
export interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// Internal App Types
export interface Position {
  coin: string;
  side: 'long' | 'short';
  size: number;
  entryPrice: number;
  currentPrice: number;
  leverage: number;
  liquidationPrice: number | null;
  unrealizedPnl: number;
  positionValue: number;
  margin: number;
}

export interface SimulationState {
  isSimulating: boolean;
  simulatedPrice: number | null;
  priceChange: number;
  isLiquidated: boolean;
  simulatedPnl: number | null;
}

export interface PriceData {
  price: number;
  time: number;
}

// ==========================================
// Trading Activity Types
// ==========================================

// Open Order from Hyperliquid API
export interface OpenOrder {
  oid: number;
  coin: string;
  side: 'A' | 'B'; // 'A' = Ask (sell), 'B' = Bid (buy)
  limitPx: string;
  sz: string;
  timestamp: number;
  orderType?: string;
}

// User Fill from Hyperliquid API
export interface UserFill {
  coin: string;
  px: string;
  sz: string;
  side: 'A' | 'B'; // 'A' = Ask (sell), 'B' = Bid (buy)
  time: number;
  dir: string; // 'Open Long', 'Close Long', 'Open Short', 'Close Short', 'Buy', 'Sell'
  closedPnl: string;
  hash: string;
  oid: number;
  crossed: boolean;
  fee: string;
  feeToken: string;
  tid: number;
  startPosition: string;
}

// Ledger Update Delta types
export interface DepositDelta {
  type: 'deposit';
  usdc: string;
}

export interface WithdrawDelta {
  type: 'withdraw';
  usdc: string;
  nonce?: number;
  fee?: string;
}

export interface AccountTransferDelta {
  type: 'accountClassTransfer';
  usdc: string;
  toPerp: boolean;
}

export interface SpotTransferDelta {
  type: 'spotTransfer';
  token: string;
  amount: string;
  usdcValue: string;
  user: string;
  destination: string;
  fee: string;
  nativeTokenFee?: string;
  nonce?: number | null;
}

export interface LiquidationDelta {
  type: 'liquidation';
  coin: string;
  side: string;
  sz: string;
  px: string;
  liquidatedPnl: string;
}

export type LedgerDelta = 
  | DepositDelta 
  | WithdrawDelta 
  | AccountTransferDelta 
  | SpotTransferDelta 
  | LiquidationDelta
  | { type: string; [key: string]: any }; // Fallback for unknown types

// Ledger Update from Hyperliquid API
export interface LedgerUpdate {
  time: number;
  hash: string;
  delta: LedgerDelta;
}

// TWAP Slice Fill from Hyperliquid API
export interface TwapSliceFill {
  twapId: number;
  fill: UserFill;
}

// Trading Activity Tab type
export type TradingActivityTab = 'orders' | 'fills' | 'trades' | 'funds' | 'twap';

// ==========================================
// Component Props
// ==========================================

export interface AddressInputProps {
  onFetch: (address: string) => void;
  onClear: () => void;
  isLoading: boolean;
  error: string | null;
  savedAddress: string | null;
}

export interface PositionListProps {
  positions: Position[];
  selectedPosition: Position | null;
  onSelectPosition: (position: Position) => void;
}

export interface PositionCardProps {
  position: Position;
  isSelected: boolean;
  onClick: () => void;
}

export interface PriceChartProps {
  position: Position | null;
  simulationState: SimulationState;
  priceHistory: PriceData[];
  candleData: CandleData[];
  isLoadingCandles: boolean;
  selectedTimeframe: '24H' | '1W' | '1M' | 'All';
  onTimeframeChange: (timeframe: '24H' | '1W' | '1M' | 'All') => void;
}

export interface SimulationControlsProps {
  onSimulate: (percentChange: number) => void;
  isSimulating: boolean;
  onReset: () => void;
}

export interface PositionStatsProps {
  position: Position;
  simulationState: SimulationState;
}

export interface TradingActivityProps {
  address: string | null;
}