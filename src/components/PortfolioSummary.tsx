import { useState, useRef, useEffect } from 'react';
import { Position } from '../types';

interface PortfolioSummaryProps {
  positions: Position[];
  accountValue: string | null;
  withdrawable: string | null;
  isConnected: boolean; // WebSocket connection status
}

// Format number with commas
const formatNumber = (value: string | number, decimals: number = 2): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '0.00';
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

// Format large numbers with abbreviation
const formatLargeNumber = (value: number): string => {
  if (Math.abs(value) >= 1000000000) {
    return `$${(value / 1000000000).toFixed(2)}B`;
  }
  if (Math.abs(value) >= 1000000) {
    return `$${(value / 1000000).toFixed(2)}M`;
  }
  if (Math.abs(value) >= 1000) {
    return `$${(value / 1000).toFixed(2)}K`;
  }
  return `$${formatNumber(value)}`;
};

export const PortfolioSummary = ({ 
  positions, 
  accountValue, 
  withdrawable,
  isConnected 
}: PortfolioSummaryProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Calculate portfolio stats
  const totalPnl = positions.reduce((sum, pos) => sum + pos.unrealizedPnl, 0);
  const totalMarginUsed = positions.reduce((sum, pos) => sum + pos.margin, 0);
  const totalPositionValue = positions.reduce((sum, pos) => sum + pos.positionValue, 0);
  const accountVal = accountValue ? parseFloat(accountValue) : 0;
  const availableBalance = withdrawable ? parseFloat(withdrawable) : 0;
  
  // Calculate total ROI
  const totalRoi = totalMarginUsed > 0 ? (totalPnl / totalMarginUsed) * 100 : 0;

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popupRef.current && 
        buttonRef.current &&
        !popupRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  return (
    <div className="relative">
      {/* User Icon Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
          isOpen 
            ? 'bg-emerald-600 text-white' 
            : 'bg-gray-800/80 text-gray-400 hover:bg-gray-700 hover:text-white'
        }`}
        aria-label="Portfolio Summary"
      >
        {/* User Icon */}
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        
        {/* Live indicator dot */}
        {isConnected && (
          <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-black">
            <span className="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-75" />
          </span>
        )}
      </button>

      {/* Popup */}
      {isOpen && (
        <>
          {/* Backdrop for mobile */}
          <div 
            className="fixed inset-0 bg-black/50 z-40 md:hidden" 
            onClick={() => setIsOpen(false)} 
          />
          
          {/* Popup Card */}
          <div
            ref={popupRef}
            className="absolute right-0 top-12 z-50 w-80 bg-gray-900 border border-emerald-900/30 
                       rounded-xl shadow-2xl overflow-hidden animate-fade-in"
            style={{
              animation: 'fadeIn 0.15s ease-out',
            }}
          >
            {/* Header */}
            <div className="px-4 py-3 bg-gradient-to-r from-emerald-900/30 to-transparent border-b border-emerald-900/20">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-bold text-sm uppercase tracking-wider">Portfolio Summary</h3>
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-red-500'}`} />
                  <span className={`text-xs ${isConnected ? 'text-emerald-400' : 'text-red-400'}`}>
                    {isConnected ? 'Live' : 'Offline'}
                  </span>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              {positions.length === 0 ? (
                <div className="text-center py-6">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-800 flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-sm">No positions loaded</p>
                  <p className="text-gray-600 text-xs">Enter an address to view portfolio</p>
                </div>
              ) : (
                <>
                  {/* Account Value */}
                  <div className="bg-gray-800/50 rounded-lg p-3">
                    <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Account Value</div>
                    <div className="text-2xl font-bold text-white mono">
                      {formatLargeNumber(accountVal)}
                    </div>
                  </div>

                  {/* P&L Row */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-800/50 rounded-lg p-3">
                      <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Unrealized P&L</div>
                      <div className={`text-lg font-bold mono ${totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {totalPnl >= 0 ? '+' : ''}{formatLargeNumber(totalPnl)}
                      </div>
                      <div className={`text-xs ${totalPnl >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                        {totalRoi >= 0 ? '+' : ''}{totalRoi.toFixed(2)}% ROI
                      </div>
                    </div>
                    
                    <div className="bg-gray-800/50 rounded-lg p-3">
                      <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Available</div>
                      <div className="text-lg font-bold text-white mono">
                        {formatLargeNumber(availableBalance)}
                      </div>
                      <div className="text-xs text-gray-500">
                        Withdrawable
                      </div>
                    </div>
                  </div>

                  {/* Stats Row */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center p-2 bg-gray-800/30 rounded-lg">
                      <div className="text-lg font-bold text-white">{positions.length}</div>
                      <div className="text-xs text-gray-500">Positions</div>
                    </div>
                    <div className="text-center p-2 bg-gray-800/30 rounded-lg">
                      <div className="text-sm font-bold text-white mono">{formatLargeNumber(totalMarginUsed)}</div>
                      <div className="text-xs text-gray-500">Margin</div>
                    </div>
                    <div className="text-center p-2 bg-gray-800/30 rounded-lg">
                      <div className="text-sm font-bold text-white mono">{formatLargeNumber(totalPositionValue)}</div>
                      <div className="text-xs text-gray-500">Exposure</div>
                    </div>
                  </div>

                  {/* Position List Preview */}
                  <div className="border-t border-gray-800 pt-3">
                    <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Open Positions</div>
                    <div className="space-y-1.5 max-h-32 overflow-y-auto hide-scrollbar">
                      {positions.map((pos) => (
                        <div 
                          key={pos.coin}
                          className="flex items-center justify-between py-1.5 px-2 bg-gray-800/30 rounded"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-white font-medium text-sm">{pos.coin}</span>
                            <span className={`text-xs px-1 py-0.5 rounded ${
                              pos.side === 'long' 
                                ? 'bg-emerald-950/50 text-emerald-400' 
                                : 'bg-red-950/50 text-red-400'
                            }`}>
                              {pos.leverage}x
                            </span>
                          </div>
                          <span className={`text-sm font-medium mono ${
                            pos.unrealizedPnl >= 0 ? 'text-emerald-400' : 'text-red-400'
                          }`}>
                            {pos.unrealizedPnl >= 0 ? '+' : ''}${formatNumber(pos.unrealizedPnl)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}

      {/* CSS for animation */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fadeIn 0.15s ease-out;
        }
      `}</style>
    </div>
  );
};

export default PortfolioSummary;