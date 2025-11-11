import { PositionListProps } from '../types';
import { PositionCard } from './PositionCard';

export const PositionList = ({
  positions,
  selectedPosition,
  onSelectPosition,
}: PositionListProps) => {
  const totalPnL = positions.reduce((acc, pos) => acc + pos.unrealizedPnl, 0);
  const totalMargin = positions.reduce((acc, pos) => acc + pos.margin, 0);
  const winningPositions = positions.filter(p => p.unrealizedPnl >= 0).length;
  const losingPositions = positions.filter(p => p.unrealizedPnl < 0).length;

  if (positions.length === 0) {
    return (
      <div className="p-4 md:p-6 h-full flex items-center justify-center">
        <div className="glass-card p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-950/50 
                        flex items-center justify-center border border-gray-800/50">
            <svg className="w-8 h-8 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-gray-400 font-semibold mb-2">No Positions Found</p>
          <p className="text-sm text-gray-600">
            Enter a valid Hyperliquid address to load positions
          </p>
        </div>
      </div>
    );
  }

  // For mobile, return just the cards without wrapper (handled by parent)
  const isMobile = window.innerWidth < 768;
  if (isMobile) {
    return (
      <div className="space-y-3">
        {positions.map((position) => (
          <PositionCard
            key={`${position.coin}-${position.entryPrice}`}
            position={position}
            isSelected={selectedPosition?.coin === position.coin}
            onClick={() => onSelectPosition(position)}
          />
        ))}
      </div>
    );
  }

  // Desktop version with full wrapper
  return (
    <div className="h-full flex flex-col">
      {/* Header Stats */}
      <div className="p-5 md:p-6 border-b border-emerald-900/20">
        <h2 className="text-base font-bold text-white mb-4">
          Open Positions ({positions.length})
        </h2>
        
        {/* Portfolio Summary */}
        <div className="grid grid-cols-2 gap-3">
          <div className="stat-card">
            <p className="stat-label text-xs">Total Margin</p>
            <p className="text-base font-bold text-gray-100 mono mt-2">
              ${totalMargin.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}
            </p>
          </div>
          <div className="stat-card">
            <p className="stat-label text-xs">Total P&L</p>
            <p className={`text-base font-bold mono mt-2 number-transition ${
              totalPnL >= 0 ? 'text-emerald-400' : 'text-red-400'
            }`}>
              {totalPnL >= 0 ? '+' : ''}${Math.abs(totalPnL).toFixed(2)}
            </p>
            <p className={`text-xs mt-1 font-medium ${
              totalPnL >= 0 ? 'text-emerald-400/60' : 'text-red-400/60'
            }`}>
              {totalPnL >= 0 ? '+' : ''}{((totalPnL / totalMargin) * 100).toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      {/* Positions List - Scrollable */}
      <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-3 hide-scrollbar">
        {positions.map((position) => (
          <PositionCard
            key={`${position.coin}-${position.entryPrice}`}
            position={position}
            isSelected={selectedPosition?.coin === position.coin}
            onClick={() => onSelectPosition(position)}
          />
        ))}
      </div>

      {/* Quick Stats Footer (Desktop Only) */}
      <div className="p-5 border-t border-emerald-900/20">
        <div className="flex justify-between items-center">
          <div className="flex gap-4 text-sm">
            <span className="text-emerald-400 font-semibold">
              {winningPositions} winning
            </span>
            <span className="text-gray-600">•</span>
            <span className="text-red-400 font-semibold">
              {losingPositions} losing
            </span>
          </div>
          <button 
            className="text-sm text-emerald-500 hover:text-emerald-400 transition-colors font-semibold"
            onClick={() => window.location.reload()}
          >
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
};