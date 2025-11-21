import { Position } from '../types';

interface PositionCardProps {
  position: Position;
  isSelected: boolean;
  onClick: () => void;
}

export const PositionCard = ({ position, isSelected, onClick }: PositionCardProps) => {
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
  
  // Normalize side to uppercase
  const normalizedSide = position.side.toUpperCase();

  // Calculate ROI
  const roi = (position.unrealizedPnl / position.margin) * 100;

  // Handle nullable liquidationPrice
  const liquidationPrice = position.liquidationPrice ?? 0;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left transition-all duration-200 rounded-lg p-4 ${
        isSelected
          ? 'bg-emerald-950/30 border-2 border-emerald-500/50'
          : 'bg-gray-950/40 border border-gray-800/40 hover:border-gray-700/60 hover:bg-gray-950/60'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {/* Asset Icon */}
          <div className="w-10 h-10 rounded-md bg-gradient-to-br from-emerald-700 to-green-900 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm mono">
              {assetName.slice(0, 2)}
            </span>
          </div>
          
          {/* Asset Info */}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-white font-bold text-base">{assetName}</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                normalizedSide === 'LONG'
                  ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-800/50'
                  : 'bg-red-950/50 text-red-400 border border-red-800/50'
              }`}>
                {position.leverage}X {normalizedSide}
              </span>
            </div>
          </div>
        </div>

        {/* ROI Badge */}
        <div className={`text-right ${
          position.unrealizedPnl >= 0 ? 'text-emerald-400' : 'text-red-400'
        }`}>
          <div className="text-base font-bold mono">
            {formatPercent(roi)}
          </div>
        </div>
      </div>

      {/* Price Grid - Tighter 2-column */}
      <div className="grid grid-cols-2 gap-3 mb-3 text-xs">
        <div>
          <div className="text-gray-500 mb-0.5">Entry</div>
          <div className="font-mono font-semibold text-gray-300 text-sm">
            {formatCurrency(position.entryPrice)}
          </div>
        </div>
        <div>
          <div className="text-gray-500 mb-0.5">Current</div>
          <div className={`font-mono font-semibold text-sm ${
            position.unrealizedPnl >= 0 ? 'text-emerald-400' : 'text-red-400'
          }`}>
            {formatCurrency(position.currentPrice)}
          </div>
        </div>
      </div>

      {/* Liquidation - Tighter */}
      <div className="flex items-center justify-between text-xs pb-3 mb-3 border-b border-gray-800/50">
        <span className="text-gray-500">Liquidation</span>
        <span className="font-mono text-gray-300 font-semibold">{formatCurrency(liquidationPrice)}</span>
      </div>

      {/* P&L - Own row, centered, prominent */}
      <div className="text-center">
        <div className="text-gray-500 text-xs mb-1">P&L</div>
        <div className={`font-mono font-bold text-lg ${
          position.unrealizedPnl >= 0 ? 'text-emerald-400' : 'text-red-400'
        }`}>
          {position.unrealizedPnl >= 0 ? '+' : ''}{formatCurrency(position.unrealizedPnl)}
        </div>
      </div>
    </button>
  );
};