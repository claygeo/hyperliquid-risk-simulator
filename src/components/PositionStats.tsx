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

  // Calculate distance to liquidation
  const distanceToLiq = liquidationPrice > 0 ? Math.abs((liquidationPrice - currentPrice) / currentPrice) * 100 : 100;
  
  // Calculate progress toward liquidation (0% = at entry, 100% = at liquidation)
  const priceRange = liquidationPrice - position.entryPrice;
  const currentDistance = currentPrice - position.entryPrice;
  const liquidationProgress = priceRange !== 0 ? (currentDistance / priceRange) * 100 : 0;

  // Risk level determination
  const isHighRisk = distanceToLiq < 5;
  const isMediumRisk = distanceToLiq >= 5 && distanceToLiq < 10;

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
            <div className="text-xs text-purple-400 font-medium">
              ⚡ Simulated Result
            </div>
          </div>
        )}
      </div>

      {/* Risk Panel */}
      <div className={`glass-card p-4 ${
        isHighRisk 
          ? 'liquidation-warning border-red-900/60' 
          : isMediumRisk 
          ? 'border-orange-900/40' 
          : 'border-gray-800/40'
      }`}>
        <div className="flex items-center justify-between mb-3">
          <div className="text-gray-400 text-xs font-medium uppercase tracking-wide">
            Liquidation Risk
          </div>
          <div className={`text-xs font-bold px-2 py-1 rounded ${
            isHighRisk
              ? 'bg-red-950/50 text-red-400 border border-red-900/50'
              : isMediumRisk
              ? 'bg-orange-950/50 text-orange-400 border border-orange-900/50'
              : 'bg-gray-900/50 text-gray-400 border border-gray-800/50'
          }`}>
            {isHighRisk ? 'HIGH RISK' : isMediumRisk ? 'MODERATE' : 'SAFE'}
          </div>
        </div>

        {/* Distance to liquidation - no progress bar */}
        <div className="mb-3 text-center">
          <div className="text-2xl font-bold mono text-gray-300">
            {distanceToLiq.toFixed(2)}%
          </div>
          <div className="text-xs text-gray-500 mt-1">to liquidation</div>
        </div>

        {/* Price levels */}
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

        {isHighRisk && (
          <div className="mt-3 pt-3 border-t border-red-900/30">
            <div className="flex items-center gap-2 text-xs text-red-400">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">Position is close to liquidation</span>
            </div>
          </div>
        )}
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