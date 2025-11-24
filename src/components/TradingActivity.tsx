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

// Tab configuration - clean text only
const TABS: { id: TradingActivityTab; label: string }[] = [
  { id: 'orders', label: 'Orders' },
  { id: 'fills', label: 'Fills' },
  { id: 'trades', label: 'Trades' },
  { id: 'funds', label: 'Funds' },
  { id: 'twap', label: 'TWAP' },
];

// Items per page for load more
const ITEMS_PER_PAGE = 20;

export const TradingActivity = ({ address }: TradingActivityProps) => {
  const [activeTab, setActiveTab] = useState<TradingActivityTab>('orders');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Data states
  const [openOrders, setOpenOrders] = useState<OpenOrder[]>([]);
  const [fills, setFills] = useState<UserFill[]>([]);
  const [ledgerUpdates, setLedgerUpdates] = useState<LedgerUpdate[]>([]);
  const [twapFills, setTwapFills] = useState<TwapSliceFill[]>([]);
  
  // Pagination states - track how many items to show per tab
  const [visibleCounts, setVisibleCounts] = useState<Record<TradingActivityTab, number>>({
    orders: ITEMS_PER_PAGE,
    fills: ITEMS_PER_PAGE,
    trades: ITEMS_PER_PAGE,
    funds: ITEMS_PER_PAGE,
    twap: ITEMS_PER_PAGE,
  });
  
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

  // Reset loaded tabs and pagination when address changes
  useEffect(() => {
    setLoadedTabs(new Set());
    setVisibleCounts({
      orders: ITEMS_PER_PAGE,
      fills: ITEMS_PER_PAGE,
      trades: ITEMS_PER_PAGE,
      funds: ITEMS_PER_PAGE,
      twap: ITEMS_PER_PAGE,
    });
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

  // Load more handler
  const handleLoadMore = (tab: TradingActivityTab) => {
    setVisibleCounts(prev => ({
      ...prev,
      [tab]: prev[tab] + ITEMS_PER_PAGE,
    }));
  };

  // Filter fills to get only closed trades
  const closedTrades = fills.filter(fill => 
    fill.dir.includes('Close') && parseFloat(fill.closedPnl) !== 0
  );

  // Render Load More button
  const renderLoadMore = (tab: TradingActivityTab, totalCount: number) => {
    const visibleCount = visibleCounts[tab];
    if (visibleCount >= totalCount) return null;
    
    return (
      <button
        onClick={() => handleLoadMore(tab)}
        className="w-full mt-3 py-2.5 bg-gray-900/50 hover:bg-gray-800/50 border border-gray-700/50 
                   rounded-lg text-sm text-gray-400 hover:text-white transition-colors"
      >
        Load More ({visibleCount} of {totalCount})
      </button>
    );
  };

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

  // Parse fill direction to readable format
  const formatFillDirection = (fill: UserFill): { action: string; type: string } => {
    const dir = fill.dir;
    
    if (dir === 'Open Long' || dir === 'Buy') {
      return { action: 'Opened', type: 'Long' };
    } else if (dir === 'Close Long') {
      return { action: 'Closed', type: 'Long' };
    } else if (dir === 'Open Short' || dir === 'Sell') {
      return { action: 'Opened', type: 'Short' };
    } else if (dir === 'Close Short') {
      return { action: 'Closed', type: 'Short' };
    }
    
    // Fallback
    return { 
      action: fill.side === 'B' ? 'Bought' : 'Sold', 
      type: '' 
    };
  };

  // Render Open Orders
  const renderOpenOrders = () => {
    if (isLoading && !loadedTabs.has('orders')) return renderLoading();
    if (openOrders.length === 0) {
      return renderEmptyState('No open orders', 'Your pending orders will appear here');
    }
    
    const visibleOrders = openOrders.slice(0, visibleCounts.orders);
    
    return (
      <>
        <div className="space-y-2">
          {visibleOrders.map((order) => {
            const side = order.side === 'B' ? 'Buy' : 'Sell';
            const sideColor = order.side === 'B' ? 'text-emerald-400' : 'text-red-400';
            
            return (
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
                      {side.toUpperCase()}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">{formatTimeAgo(order.timestamp)}</span>
                </div>
                <div className="text-sm text-gray-300">
                  <span className={sideColor}>{side}</span>
                  <span className="text-gray-400"> {formatNumber(order.sz, 4)} {order.coin} @ </span>
                  <span className="text-white">${formatNumber(order.limitPx)}</span>
                </div>
              </div>
            );
          })}
        </div>
        {renderLoadMore('orders', openOrders.length)}
      </>
    );
  };

  // Render Recent Fills
  const renderFills = () => {
    if (isLoading && !loadedTabs.has('fills')) return renderLoading();
    if (fills.length === 0) {
      return renderEmptyState('No recent fills', 'Your executed orders will appear here');
    }
    
    const visibleFills = fills.slice(0, visibleCounts.fills);
    
    return (
      <>
        <div className="space-y-2">
          {visibleFills.map((fill, index) => {
            const { action, type } = formatFillDirection(fill);
            const hasType = type !== '';
            
            return (
              <div 
                key={`${fill.tid}-${index}`}
                className="bg-gray-900/50 rounded-lg p-3 border border-gray-800/50"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-semibold">{fill.coin}</span>
                    {hasType && (
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                        type === 'Long'
                          ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-800/50' 
                          : 'bg-red-950/50 text-red-400 border border-red-800/50'
                      }`}>
                        {type.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">{formatTimeAgo(fill.time)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-300">
                    <span className="text-gray-400">{action} </span>
                    <span className="text-white">{formatNumber(fill.sz, 4)} {fill.coin}</span>
                    <span className="text-gray-400"> @ </span>
                    <span className="text-white">${formatNumber(fill.px)}</span>
                  </div>
                  <span className="text-xs text-gray-500 mono">
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
            );
          })}
        </div>
        {renderLoadMore('fills', fills.length)}
      </>
    );
  };

  // Render Completed Trades (closed positions)
  const renderTrades = () => {
    if (isLoading && !loadedTabs.has('trades') && !loadedTabs.has('fills')) return renderLoading();
    if (closedTrades.length === 0) {
      return renderEmptyState('No completed trades', 'Your closed positions will appear here');
    }
    
    const visibleTrades = closedTrades.slice(0, visibleCounts.trades);
    
    return (
      <>
        <div className="space-y-2">
          {visibleTrades.map((trade, index) => {
            const pnl = parseFloat(trade.closedPnl);
            const isProfit = pnl > 0;
            const isLong = trade.dir.includes('Long');
            
            return (
              <div 
                key={`${trade.tid}-${index}`}
                className="bg-gray-900/50 rounded-lg p-3 border border-gray-800/50"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-semibold">{trade.coin}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                      isLong
                        ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-800/50' 
                        : 'bg-red-950/50 text-red-400 border border-red-800/50'
                    }`}>
                      {isLong ? 'LONG' : 'SHORT'}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">{formatTimeAgo(trade.time)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-300">
                    <span className="text-gray-400">Closed </span>
                    <span className="text-white">{formatNumber(trade.sz, 4)} {trade.coin}</span>
                    <span className="text-gray-400"> @ </span>
                    <span className="text-white">${formatNumber(trade.px)}</span>
                  </div>
                  <span className={`font-bold mono ${isProfit ? 'text-emerald-400' : 'text-red-400'}`}>
                    {isProfit ? '+' : ''}${formatNumber(pnl)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        {renderLoadMore('trades', closedTrades.length)}
      </>
    );
  };

  // Render Deposits & Withdrawals
  const renderFunds = () => {
    if (isLoading && !loadedTabs.has('funds')) return renderLoading();
    if (ledgerUpdates.length === 0) {
      return renderEmptyState('No fund activity', 'Deposits and withdrawals will appear here');
    }
    
    const visibleUpdates = ledgerUpdates.slice(0, visibleCounts.funds);
    
    return (
      <>
        <div className="space-y-2">
          {visibleUpdates.map((update, index) => {
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
                isPositive = !delta.toPerp;
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
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`w-9 h-9 rounded-lg flex items-center justify-center ${
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
        {renderLoadMore('funds', ledgerUpdates.length)}
      </>
    );
  };

  // Render TWAP fills
  const renderTwap = () => {
    if (isLoading && !loadedTabs.has('twap')) return renderLoading();
    if (twapFills.length === 0) {
      return renderEmptyState('No TWAP orders', 'Your TWAP executions will appear here');
    }
    
    const visibleTwap = twapFills.slice(0, visibleCounts.twap);
    
    return (
      <>
        <div className="space-y-2">
          {visibleTwap.map((twap, index) => {
            const { fill } = twap;
            const { action, type } = formatFillDirection(fill);
            
            return (
              <div 
                key={`${twap.twapId}-${index}`}
                className="bg-gray-900/50 rounded-lg p-3 border border-gray-800/50"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-semibold">{fill.coin}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                      type === 'Long'
                        ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-800/50' 
                        : 'bg-red-950/50 text-red-400 border border-red-800/50'
                    }`}>
                      {type.toUpperCase()}
                    </span>
                    <span className="text-xs text-blue-400 bg-blue-950/50 px-1.5 py-0.5 rounded border border-blue-800/50">
                      TWAP #{twap.twapId}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">{formatTimeAgo(fill.time)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-300">
                    <span className="text-gray-400">{action} </span>
                    <span className="text-white">{formatNumber(fill.sz, 4)} {fill.coin}</span>
                    <span className="text-gray-400"> @ </span>
                    <span className="text-white">${formatNumber(fill.px)}</span>
                  </div>
                  <span className="text-xs text-gray-500 mono">
                    Fee: ${formatNumber(fill.fee)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        {renderLoadMore('twap', twapFills.length)}
      </>
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

  return (
    <div className="bg-gray-950/50 rounded-xl border border-emerald-900/20 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-emerald-900/20">
        <h3 className="text-white font-bold text-sm uppercase tracking-wider">Trading Activity</h3>
      </div>
      
      {/* Tab Bar - Clean text only, scrollable */}
      <div className="border-b border-emerald-900/20 overflow-x-auto hide-scrollbar">
        <div className="flex min-w-max">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 text-sm font-medium transition-colors relative whitespace-nowrap ${
                  isActive
                    ? 'text-emerald-400'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {tab.label}
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