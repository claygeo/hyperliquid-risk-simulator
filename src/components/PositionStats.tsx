import { Position, SimulationState } from '../types';

interface PositionStatsProps {
  position: Position;
  simulationState: SimulationState;
}

export const PositionStats = ({ position, simulationState }: PositionStatsProps) => {
  const isSimulating = simulationState.isSimulating;
  const currentPrice = isSimulating ? (simulationState.simulatedPrice ?? position.currentPrice) : position.currentPrice;
  const unrealizedPnl = isSimulating ? (simulationState.simulatedPnl ?? position.unrealizedPnl) : position.unrealizedPnl;
  const roi = (unrealizedPnl / position.margin) * 100;

  // Handle nullable liquidationPrice
  const liquidationPrice = position.liquidationPrice ?? 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  // Get asset name - handle both 'coin' and 'asset' fields
  const assetName = (position as any).coin || (position as any).asset || 'UNKNOWN';
  
  // Normalize side to uppercase for comparison
  const normalizedSide = position.side.toUpperCase();

  return (
    <div className="space-y-3">
      {/* P&L Panel - Most Important */}
      <div className={`glass-card p-4 border-l-4 ${
        unrealizedPnl >= 0 
          ? 'border-l-emerald-500 bg-emerald-950/20' 
          : 'border-l-red-500 bg-red-950/20'
      }`}>
        <div className="flex items-baseline justify-between">
          <div>
            <div className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-1">
              Unrealized P&L
            </div>
            <div className={`text-3xl font-bold mono ${
              unrealizedPnl >= 0 ? 'text-emerald-400' : 'text-red-400'
            }`}>
              {formatCurrency(unrealizedPnl)}
            </div>
          </div>
          <div className="text-right">
            <div className={`text-xl font-bold mono ${
              roi >= 0 ? 'text-emerald-400' : 'text-red-400'
            }`}>
              {formatPercent(roi)}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">ROI</div>
          </div>
        </div>
        {isSimulating && (
          <div className="mt-2 pt-2 border-t border-gray-800/50">
            <div className="text-xs text-gray-500 font-medium">
              Simulated Result
            </div>
          </div>
        )}
      </div>

      {/* Liquidation Risk Panel - Simplified */}
      <div className="glass-card p-4 border border-gray-800/40">
        <div className="mb-3">
          <div className="text-gray-400 text-xs font-medium uppercase tracking-wide">
            Liquidation Risk
          </div>
        </div>

        {/* Price levels - simplified grid */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div>
            <div className="text-gray-500 mb-1">Entry</div>
            <div className="font-mono font-bold text-gray-300">
              {formatCurrency(position.entryPrice)}
            </div>
          </div>
          <div>
            <div className="text-gray-500 mb-1">Current</div>
            <div className={`font-mono font-bold ${
              currentPrice > position.entryPrice 
                ? 'text-emerald-400' 
                : 'text-red-400'
            }`}>
              {formatCurrency(currentPrice)}
            </div>
          </div>
          <div>
            <div className="text-gray-500 mb-1">Liquidation</div>
            <div className="font-mono font-bold text-red-400">
              {formatCurrency(liquidationPrice)}
            </div>
          </div>
        </div>
      </div>

      {/* Position Details Panel */}
      <div className="glass-card p-4">
        <div className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-3">
          Position Details
        </div>

        {/* Asset info */}
        <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-800/50">
          <div>
            <div className="text-lg font-bold text-gray-100">
              {assetName}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                normalizedSide === 'LONG'
                  ? 'bg-emerald-950/50 text-emerald-400'
                  : 'bg-red-950/50 text-red-400'
              }`}>
                {normalizedSide}
              </span>
              <span className="text-xs font-bold text-gray-400">
                {position.leverage}X
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500">Position Value</div>
            <div className="text-lg font-bold mono text-gray-100">
              {formatCurrency(position.positionValue)}
            </div>
          </div>
        </div>

        {/* Size and Margin */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <div className="text-gray-500 mb-1">Size</div>
            <div className="font-mono font-bold text-gray-300">
              {position.size.toFixed(4)} {assetName}
            </div>
          </div>
          <div className="text-right">
            <div className="text-gray-500 mb-1">Margin</div>
            <div className="font-mono font-bold text-gray-300">
              {formatCurrency(position.margin)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};