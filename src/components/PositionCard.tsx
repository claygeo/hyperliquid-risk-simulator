import { PositionCardProps } from '../types';
import { formatCurrency, formatPercentage } from '../services/calculations';

export const PositionCard = ({
  position,
  isSelected,
  onClick,
}: PositionCardProps) => {
  const pnlColor = position.unrealizedPnl >= 0 ? 'text-emerald-400' : 'text-red-400';
  const pnlBgColor = position.unrealizedPnl >= 0 ? 'bg-emerald-950/30' : 'bg-red-950/30';

  return (
    <button
      onClick={onClick}
      className={`w-full text-left transition-all duration-300 position-card ${
        isSelected
          ? 'glass-card ring-2 ring-emerald-500/50 scale-[0.99]'
          : 'glass-card hover:ring-1 hover:ring-emerald-900/50 hover:scale-[0.99]'
      }`}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {/* Coin Icon */}
            <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-emerald-700 to-green-900 
                          flex items-center justify-center shadow-lg">
              <span className="text-white font-bold mono">
                {position.coin.slice(0, 2)}
              </span>
            </div>
            
            {/* Coin Name & Side */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-white font-bold text-lg">
                  {position.coin}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-lg font-bold mono ${
                  position.side === 'long'
                    ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-800/50'
                    : 'bg-red-950/50 text-red-400 border border-red-800/50'
                }`}>
                  {position.leverage}X {position.side.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* PnL Badge */}
          <div className={`px-3 py-1.5 rounded-lg ${pnlBgColor} backdrop-blur-sm border ${
            position.unrealizedPnl >= 0 ? 'border-emerald-800/50' : 'border-red-800/50'
          }`}>
            <span className={`${pnlColor} font-bold text-sm mono`}>
              {position.unrealizedPnl >= 0 ? '+' : ''}
              {formatPercentage((position.unrealizedPnl / position.margin) * 100)}
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="text-center">
            <p className="text-gray-500 text-xs mb-1.5 font-medium">Entry</p>
            <p className="text-gray-300 font-semibold text-sm mono">
              {formatCurrency(position.entryPrice)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-gray-500 text-xs mb-1.5 font-medium">Current</p>
            <p className="text-white font-semibold text-sm mono price-live">
              {formatCurrency(position.currentPrice)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-gray-500 text-xs mb-1.5 font-medium">P&L</p>
            <p className={`${pnlColor} font-semibold text-sm mono`}>
              {position.unrealizedPnl >= 0 ? '+' : ''}${Math.abs(position.unrealizedPnl).toFixed(2)}
            </p>
          </div>
        </div>

        {/* Risk Bar */}
        <div className="mt-4">
          <div className="h-1.5 bg-gray-950 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${
                position.side === 'long' 
                  ? 'bg-gradient-to-r from-red-600 via-yellow-500 to-emerald-500' 
                  : 'bg-gradient-to-r from-emerald-500 via-yellow-500 to-red-600'
              }`}
              style={{
                width: `${Math.min(100, Math.max(0, 
                  position.side === 'long' 
                    ? ((position.currentPrice - position.liquidationPrice!) / 
                       (position.entryPrice - position.liquidationPrice!)) * 100
                    : ((position.liquidationPrice! - position.currentPrice) / 
                       (position.liquidationPrice! - position.entryPrice)) * 100
                ))}%`
              }}
            />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-xs text-red-400 font-semibold">Liquidation</span>
            <span className="text-xs text-gray-600 mono">
              ${position.liquidationPrice?.toFixed(2) || '0.00'}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
};