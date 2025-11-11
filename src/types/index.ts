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

// Component Props
export interface AddressInputProps {
  onFetch: (address: string) => void;
  isLoading: boolean;
  error: string | null;
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
  position: Position;
  simulationState: SimulationState;
  priceHistory: PriceData[];
  candleData: CandleData[];
  isLoadingCandles: boolean;
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