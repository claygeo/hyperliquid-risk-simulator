import { useState, useEffect } from 'react';
import {
  TradingActivityTab,
  TradingActivityProps,
  OpenOrder,
  UserFill,
  LedgerUpdate,
  TwapSliceFill,
} from '../types';
import {
  fetchOpenOrders,
  fetchUserFills,
  fetchUserLedgerUpdates,
  fetchTwapFills,
} from '../services/hyperliquid';

// Format number with commas
const formatNumber = (value: string | number, decimals: number = 2): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '0';
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

// Format time ago
const formatTimeAgo = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
};

// Tab configuration
const TABS: { id: TradingActivityTab; label: string; icon: JSX.Element }[] = [
  {
    id: 'orders',
    label: 'Orders',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    id: 'fills',
    label: 'Fills',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
          d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    id: 'trades',
    label: 'Trades',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
          d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    ),
  },
  {
    id: 'funds',
    label: 'Funds',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    id: 'twap',
    label: 'TWAP',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

export const TradingActivity = ({ address }: TradingActivityProps) => {
  const [activeTab, setActiveTab] = useState<TradingActivityTab>('orders');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Data states
  const [openOrders, setOpenOrders] = useState<OpenOrder[]>([]);
  const [fills, setFills] = useState<UserFill[]>([]);
  const [ledgerUpdates, setLedgerUpdates] = useState<LedgerUpdate[]>([]);
  const [twapFills, setTwapFills] = useState<TwapSliceFill[]>([]);
  
  // Track which tabs have been loaded
  const [loadedTabs, setLoadedTabs] = useState<Set<TradingActivityTab>>(new Set());

  // Load data when tab changes or address changes
  useEffect(() => {
    if (!address) {
      // Clear all data when no address
      setOpenOrders([]);
      setFills([]);
      setLedgerUpdates([]);
      setTwapFills([]);
      setLoadedTabs(new Set());
      return;
    }
    
    // Load data for active tab if not already loaded
    if (!loadedTabs.has(activeTab)) {
      loadTabData(activeTab);
    }
  }, [activeTab, address]);

  // Reset loaded tabs when address changes
  useEffect(() => {
    setLoadedTabs(new Set());
  }, [address]);

  const loadTabData = async (tab: TradingActivityTab) => {
    if (!address) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      switch (tab) {
        case 'orders':
          const orders = await fetchOpenOrders(address);
          setOpenOrders(orders);
          break;
        case 'fills':
          const userFills = await fetchUserFills(address);
          setFills(userFills);
          break;
        case 'trades':
          // Trades are derived from fills - filter for closed positions
          if (!loadedTabs.has('fills')) {
            const allFills = await fetchUserFills(address);
            setFills(allFills);
            setLoadedTabs(prev => new Set(prev).add('fills'));
          }
          break;
        case 'funds':
          const ledger = await fetchUserLedgerUpdates(address);
          setLedgerUpdates(ledger);
          break;
        case 'twap':
          const twap = await fetchTwapFills(address);
          setTwapFills(twap);
          break;
      }
      
      setLoadedTabs(prev => new Set(prev).add(tab));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter fills to get only closed trades
  const closedTrades = fills.filter(fill => 
    fill.dir.includes('Close') && parseFloat(fill.closedPnl) !== 0
  );

  // Render empty state
  const renderEmptyState = (message: string, subMessage: string) => (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="w-16 h-16 mb-4 rounded-xl bg-gray-900/50 flex items-center justify-center border border-gray-800">
        <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
      </div>
      <p className="text-gray-400 font-medium mb-1">{message}</p>
      <p className="text-gray-600 text-sm text-center">{subMessage}</p>
    </div>
  );

  // Render loading state
  const renderLoading = () => (
    <div className="flex items-center justify-center py-16">
      <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
    </div>
  );

  // Render Open Orders
  const renderOpenOrders = () => {
    if (isLoading && !loadedTabs.has('orders')) return renderLoading();
    if (openOrders.length === 0) {
      return renderEmptyState('No open orders', 'Your pending orders will appear here');
    }
    
    return (
      <div className="space-y-2">
        {openOrders.map((order) => (
          <div 
            key={order.oid}
            className="bg-gray-900/50 rounded-lg p-3 border border-gray-800/50"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-white font-semibold">{order.coin}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                  order.side === 'B' 
                    ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-800/50' 
                    : 'bg-red-950/50 text-red-400 border border-red-800/50'
                }`}>
                  {order.side === 'B' ? 'BUY' : 'SELL'}
                </span>
                <span className="text-xs text-gray-500">{order.orderType || 'LIMIT'}</span>
              </div>
              <span className="text-xs text-gray-500">{formatTimeAgo(order.timestamp)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">
                ${formatNumber(order.limitPx)} × {formatNumber(order.sz, 4)}
              </span>
              <span className="text-gray-500 mono text-xs">
                ${formatNumber(parseFloat(order.limitPx) * parseFloat(order.sz))}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Render Recent Fills
  const renderFills = () => {
    if (isLoading && !loadedTabs.has('fills')) return renderLoading();
    if (fills.length === 0) {
      return renderEmptyState('No recent fills', 'Your executed orders will appear here');
    }
    
    // Show last 50 fills
    const recentFills = fills.slice(0, 50);
    
    return (
      <div className="space-y-2">
        {recentFills.map((fill, index) => (
          <div 
            key={`${fill.tid}-${index}`}
            className="bg-gray-900/50 rounded-lg p-3 border border-gray-800/50"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-white font-semibold">{fill.coin}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                  fill.side === 'B' 
                    ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-800/50' 
                    : 'bg-red-950/50 text-red-400 border border-red-800/50'
                }`}>
                  {fill.side === 'B' ? 'BUY' : 'SELL'}
                </span>
                <span className="text-xs text-gray-500">{fill.dir}</span>
              </div>
              <span className="text-xs text-gray-500">{formatTimeAgo(fill.time)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">
                ${formatNumber(fill.px)} × {formatNumber(fill.sz, 4)}
              </span>
              <span className="text-gray-500 mono text-xs">
                Fee: ${formatNumber(fill.fee)}
              </span>
            </div>
            {parseFloat(fill.closedPnl) !== 0 && (
              <div className={`mt-2 text-sm font-medium ${
                parseFloat(fill.closedPnl) > 0 ? 'text-emerald-400' : 'text-red-400'
              }`}>
                P&L: {parseFloat(fill.closedPnl) > 0 ? '+' : ''}${formatNumber(fill.closedPnl)}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  // Render Completed Trades (closed positions)
  const renderTrades = () => {
    if (isLoading && !loadedTabs.has('trades') && !loadedTabs.has('fills')) return renderLoading();
    if (closedTrades.length === 0) {
      return renderEmptyState('No completed trades', 'Your closed positions will appear here');
    }
    
    return (
      <div className="space-y-2">
        {closedTrades.slice(0, 50).map((trade, index) => {
          const pnl = parseFloat(trade.closedPnl);
          const isProfit = pnl > 0;
          
          return (
            <div 
              key={`${trade.tid}-${index}`}
              className="bg-gray-900/50 rounded-lg p-3 border border-gray-800/50"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-white font-semibold">{trade.coin}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                    trade.dir.includes('Long')
                      ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-800/50' 
                      : 'bg-red-950/50 text-red-400 border border-red-800/50'
                  }`}>
                    {trade.dir}
                  </span>
                </div>
                <span className="text-xs text-gray-500">{formatTimeAgo(trade.time)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">
                  Exit @ ${formatNumber(trade.px)}
                </span>
                <span className={`font-bold mono ${isProfit ? 'text-emerald-400' : 'text-red-400'}`}>
                  {isProfit ? '+' : ''}${formatNumber(pnl)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Render Deposits & Withdrawals
  const renderFunds = () => {
    if (isLoading && !loadedTabs.has('funds')) return renderLoading();
    if (ledgerUpdates.length === 0) {
      return renderEmptyState('No fund activity', 'Deposits and withdrawals will appear here');
    }
    
    return (
      <div className="space-y-2">
        {ledgerUpdates.slice(0, 50).map((update, index) => {
          const { delta } = update;
          let type = delta.type;
          let amount = '0';
          let isPositive = false;
          let description = '';
          
          switch (delta.type) {
            case 'deposit':
              amount = delta.usdc;
              isPositive = true;
              description = 'Deposit';
              break;
            case 'withdraw':
              amount = delta.usdc;
              isPositive = false;
              description = 'Withdrawal';
              break;
            case 'accountClassTransfer':
              amount = delta.usdc;
              isPositive = !delta.toPerp; // toPerp = moving to perp (out of spot)
              description = delta.toPerp ? 'Transfer to Perp' : 'Transfer to Spot';
              break;
            case 'spotTransfer':
              amount = delta.usdcValue || delta.amount;
              isPositive = delta.destination !== delta.user;
              description = `${delta.token} Transfer`;
              break;
            case 'liquidation':
              amount = delta.liquidatedPnl;
              isPositive = parseFloat(delta.liquidatedPnl) > 0;
              description = `${delta.coin} Liquidation`;
              type = 'liquidation';
              break;
            default:
              description = type;
          }
          
          const numAmount = Math.abs(parseFloat(amount));
          
          return (
            <div 
              key={`${update.hash}-${index}`}
              className="bg-gray-900/50 rounded-lg p-3 border border-gray-800/50"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    type === 'deposit' ? 'bg-emerald-950/50 text-emerald-400' :
                    type === 'withdraw' ? 'bg-red-950/50 text-red-400' :
                    type === 'liquidation' ? 'bg-orange-950/50 text-orange-400' :
                    'bg-blue-950/50 text-blue-400'
                  }`}>
                    {type === 'deposit' ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                    ) : type === 'withdraw' ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                      </svg>
                    ) : type === 'liquidation' ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                    )}
                  </span>
                  <div>
                    <span className="text-white font-medium text-sm">{description}</span>
                    <p className="text-xs text-gray-500">{formatTimeAgo(update.time)}</p>
                  </div>
                </div>
                <span className={`font-bold mono ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                  {isPositive ? '+' : '-'}${formatNumber(numAmount)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Render TWAP fills
  const renderTwap = () => {
    if (isLoading && !loadedTabs.has('twap')) return renderLoading();
    if (twapFills.length === 0) {
      return renderEmptyState('No TWAP orders', 'Your TWAP executions will appear here');
    }
    
    return (
      <div className="space-y-2">
        {twapFills.slice(0, 50).map((twap, index) => {
          const { fill } = twap;
          
          return (
            <div 
              key={`${twap.twapId}-${index}`}
              className="bg-gray-900/50 rounded-lg p-3 border border-gray-800/50"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-white font-semibold">{fill.coin}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                    fill.side === 'B' 
                      ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-800/50' 
                      : 'bg-red-950/50 text-red-400 border border-red-800/50'
                  }`}>
                    {fill.side === 'B' ? 'BUY' : 'SELL'}
                  </span>
                  <span className="text-xs text-blue-400 bg-blue-950/50 px-1.5 py-0.5 rounded border border-blue-800/50">
                    TWAP #{twap.twapId}
                  </span>
                </div>
                <span className="text-xs text-gray-500">{formatTimeAgo(fill.time)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">
                  ${formatNumber(fill.px)} × {formatNumber(fill.sz, 4)}
                </span>
                <span className="text-gray-500 mono text-xs">
                  Fee: ${formatNumber(fill.fee)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Render active tab content
  const renderTabContent = () => {
    if (!address) {
      return renderEmptyState('No address connected', 'Enter an address to view trading activity');
    }
    
    if (error) {
      return (
        <div className="flex flex-col items-center justify-center py-12 px-4">
          <div className="w-16 h-16 mb-4 rounded-xl bg-red-950/30 flex items-center justify-center border border-red-800/50">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-red-400 font-medium mb-1">Error loading data</p>
          <p className="text-gray-600 text-sm text-center">{error}</p>
          <button
            onClick={() => loadTabData(activeTab)}
            className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Retry
          </button>
        </div>
      );
    }
    
    switch (activeTab) {
      case 'orders':
        return renderOpenOrders();
      case 'fills':
        return renderFills();
      case 'trades':
        return renderTrades();
      case 'funds':
        return renderFunds();
      case 'twap':
        return renderTwap();
      default:
        return null;
    }
  };

  // Get count for tab badge
  const getTabCount = (tab: TradingActivityTab): number | null => {
    if (!loadedTabs.has(tab) && tab !== 'trades') return null;
    
    switch (tab) {
      case 'orders':
        return openOrders.length || null;
      case 'fills':
        return fills.length > 0 ? Math.min(fills.length, 50) : null;
      case 'trades':
        return closedTrades.length > 0 ? Math.min(closedTrades.length, 50) : null;
      case 'funds':
        return ledgerUpdates.length > 0 ? Math.min(ledgerUpdates.length, 50) : null;
      case 'twap':
        return twapFills.length || null;
      default:
        return null;
    }
  };

  return (
    <div className="bg-gray-950/50 rounded-xl border border-emerald-900/20 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-emerald-900/20">
        <h3 className="text-white font-bold text-sm uppercase tracking-wider">Trading Activity</h3>
      </div>
      
      {/* Tab Bar - Scrollable */}
      <div className="border-b border-emerald-900/20 overflow-x-auto hide-scrollbar">
        <div className="flex min-w-max">
          {TABS.map((tab) => {
            const count = getTabCount(tab.id);
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors relative whitespace-nowrap ${
                  isActive
                    ? 'text-emerald-400'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {count !== null && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                    isActive ? 'bg-emerald-900/50 text-emerald-400' : 'bg-gray-800 text-gray-500'
                  }`}>
                    {count}
                  </span>
                )}
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />
                )}
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Tab Content */}
      <div className="p-4 max-h-96 overflow-y-auto hide-scrollbar">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default TradingActivity;