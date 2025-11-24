import { useState, useEffect, useRef, useCallback } from 'react';
import { AddressInput } from './components/AddressInput';
import { PositionList } from './components/PositionList';
import { PriceChart } from './components/PriceChart';
import { SimulationControls } from './components/SimulationControls';
import { PositionStats } from './components/PositionStats';
import { TradingActivity } from './components/TradingActivity';
import { PortfolioSummary } from './components/PortfolioSummary';
import { useHyperliquid } from './hooks/useHyperliquid';
import { useWebSocket } from './hooks/useWebSocket';
import { Position, SimulationState, PriceData, CandleData } from './types';
import {
  calculateNewPrice,
  isPositionLiquidated,
  calculatePnL,
  generatePriceHistory,
} from './services/calculations';
import { fetchCandleData } from './services/hyperliquid';

// Timeframe configuration
const TIMEFRAME_CONFIG = {
  '24H': { interval: '15m', hours: 24 },
  '1W': { interval: '1h', hours: 168 },
  '1M': { interval: '4h', hours: 720 },
  'All': { interval: '1d', hours: 2160 }, // 90 days
} as const;

function App() {
  const { positions, isLoading, error, fetchPositions, accountData } = useHyperliquid();
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [simulationState, setSimulationState] = useState<SimulationState>({
    isSimulating: false,
    simulatedPrice: null,
    priceChange: 0,
    isLiquidated: false,
    simulatedPnl: null,
  });
  const [priceHistory, setPriceHistory] = useState<PriceData[]>([]);
  const [candleData, setCandleData] = useState<CandleData[]>([]);
  const [isLoadingCandles, setIsLoadingCandles] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'24H' | '1W' | '1M' | 'All'>('24H');
  const [isMobile, setIsMobile] = useState(false);
  const [showPositions, setShowPositions] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [showActivity, setShowActivity] = useState(false);
  const [savedAddress, setSavedAddress] = useState<string | null>(null);
  
  // Live positions with WebSocket price updates
  const [livePositions, setLivePositions] = useState<Position[]>([]);
  
  // Pull-to-refresh state
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const pullStartY = useRef(0);
  const contentRef = useRef<HTMLDivElement>(null);
  
  // WebSocket for real-time prices
  const { prices: livePrices, isConnected: wsConnected } = useWebSocket({
    enabled: !!savedAddress && positions.length > 0,
    throttleMs: 2000, // Update UI every 2 seconds max
  });

  // Update positions with live prices
  useEffect(() => {
    if (Object.keys(livePrices).length === 0) {
      setLivePositions(positions);
      return;
    }
    
    const updated = positions.map(pos => {
      const livePrice = livePrices[pos.coin];
      if (!livePrice) return pos;
      
      const currentPrice = parseFloat(livePrice);
      const priceDiff = currentPrice - pos.entryPrice;
      const pnlMultiplier = pos.side === 'long' ? 1 : -1;
      const unrealizedPnl = priceDiff * pos.size * pnlMultiplier;
      
      return {
        ...pos,
        currentPrice,
        unrealizedPnl,
      };
    });
    
    setLivePositions(updated);
    
    // Update selected position if it exists
    if (selectedPosition) {
      const updatedSelected = updated.find(p => p.coin === selectedPosition.coin);
      if (updatedSelected) {
        setSelectedPosition(updatedSelected);
      }
    }
  }, [livePrices, positions]);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load saved address on mount
  useEffect(() => {
    const saved = localStorage.getItem('hyperliquid_address');
    if (saved) {
      setSavedAddress(saved);
      fetchPositions(saved);
    }
  }, []);

  // Auto-select first position on mobile
  useEffect(() => {
    if (isMobile && positions.length > 0 && !selectedPosition) {
      handleSelectPosition(positions[0]);
    }
  }, [positions, isMobile]);

  // Refetch candles when timeframe changes
  useEffect(() => {
    if (selectedPosition) {
      loadCandleData(selectedPosition.coin, selectedTimeframe);
    }
  }, [selectedTimeframe]);

  // Pull-to-refresh touch handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (contentRef.current && contentRef.current.scrollTop === 0) {
      pullStartY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling || isRefreshing) return;
    
    const currentY = e.touches[0].clientY;
    const diff = currentY - pullStartY.current;
    
    if (diff > 0 && contentRef.current?.scrollTop === 0) {
      // Apply resistance - the further you pull, the harder it gets
      const resistance = Math.min(diff * 0.4, 80);
      setPullDistance(resistance);
    }
  }, [isPulling, isRefreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (pullDistance > 60 && savedAddress && !isRefreshing) {
      // Trigger refresh
      setIsRefreshing(true);
      setPullDistance(40); // Keep spinner visible
      
      try {
        await fetchPositions(savedAddress);
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
    setIsPulling(false);
  }, [pullDistance, savedAddress, isRefreshing, fetchPositions]);

  // Handle fetching positions
  const handleFetchPositions = async (address: string) => {
    localStorage.setItem('hyperliquid_address', address);
    setSavedAddress(address);
    
    await fetchPositions(address);
    setSelectedPosition(null);
    resetSimulation();
    setCandleData([]);
    if (isMobile && positions.length > 0) {
      setShowPositions(true);
    }
  };

  // Handle clearing saved address
  const handleClearAddress = () => {
    localStorage.removeItem('hyperliquid_address');
    setSavedAddress(null);
  };

  // Handle position selection
  const handleSelectPosition = (position: Position) => {
    // Find the live version of this position
    const liveVersion = livePositions.find(p => p.coin === position.coin) || position;
    setSelectedPosition(liveVersion);
    resetSimulation();
    loadCandleData(liveVersion.coin, selectedTimeframe);
    if (isMobile) {
      setShowPositions(false);
      setShowControls(false);
      setShowActivity(false);
    }
  };

  // Load candle data for a coin with selected timeframe
  const loadCandleData = async (coin: string, timeframe: '24H' | '1W' | '1M' | 'All' = '24H') => {
    setIsLoadingCandles(true);
    try {
      const config = TIMEFRAME_CONFIG[timeframe];
      const candles = await fetchCandleData(coin, config.interval, config.hours);
      setCandleData(candles);
    } catch (error) {
      console.error('Failed to load candle data:', error);
      setCandleData([]);
    } finally {
      setIsLoadingCandles(false);
    }
  };

  // Handle simulation
  const handleSimulate = (percentChange: number) => {
    if (!selectedPosition) return;

    const newPrice = calculateNewPrice(selectedPosition.currentPrice, percentChange);
    const isLiquidated = isPositionLiquidated(selectedPosition, newPrice);
    const simulatedPnl = calculatePnL(selectedPosition, newPrice);

    const history = generatePriceHistory(
      selectedPosition.currentPrice,
      newPrice,
      60
    );

    setPriceHistory(history);
    setSimulationState({
      isSimulating: true,
      simulatedPrice: newPrice,
      priceChange: percentChange,
      isLiquidated,
      simulatedPnl,
    });

    if (isMobile) {
      setShowControls(false);
    }
  };

  // Reset simulation
  const resetSimulation = () => {
    setSimulationState({
      isSimulating: false,
      simulatedPrice: null,
      priceChange: 0,
      isLiquidated: false,
      simulatedPnl: null,
    });
    setPriceHistory([]);
  };

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="min-h-screen terminal-bg">
        {/* Header */}
        <div className="sticky top-0 z-50 backdrop-blur-xl bg-black/80 border-b border-emerald-900/30">
          <div className="flex items-center gap-2 px-4 py-2">
            <div className="flex-1">
              <AddressInput
                onFetch={handleFetchPositions}
                onClear={handleClearAddress}
                isLoading={isLoading}
                error={error}
                savedAddress={savedAddress}
              />
            </div>
            {/* Portfolio Summary Icon */}
            <PortfolioSummary
              positions={livePositions}
              accountValue={accountData?.marginSummary?.accountValue || null}
              withdrawable={accountData?.withdrawable || null}
              isConnected={wsConnected}
            />
          </div>
        </div>

        {/* Pull-to-refresh indicator */}
        <div 
          className="flex justify-center overflow-hidden transition-all duration-200"
          style={{ height: pullDistance }}
        >
          <div className={`flex items-center justify-center ${isRefreshing ? 'animate-spin' : ''}`}>
            <svg 
              className="w-6 h-6 text-emerald-500" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              style={{ 
                transform: `rotate(${pullDistance * 3}deg)`,
                opacity: pullDistance / 60 
              }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
        </div>

        {/* Mobile Content with pull-to-refresh */}
        <div 
          ref={contentRef}
          className="relative pb-24"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {selectedPosition ? (
            <>
              {/* Position Info Card */}
              <div className="px-4 py-3.5 bg-gradient-to-r from-gray-950/70 to-black/50 backdrop-blur-sm border-b border-emerald-900/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-emerald-700 to-green-900 flex items-center justify-center shadow-lg">
                      <span className="text-white font-bold mono">
                        {selectedPosition.coin.slice(0, 2)}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-white font-bold text-base">{selectedPosition.coin}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-lg font-bold mono ${
                          selectedPosition.side === 'long' 
                            ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-800/50' 
                            : 'bg-red-950/50 text-red-400 border border-red-800/50'
                        }`}>
                          {selectedPosition.leverage}X {selectedPosition.side.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 text-sm mono">
                          ${selectedPosition.currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        {wsConnected && (
                          <span className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                            <span className="text-xs text-emerald-500">Live</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold mono ${
                      selectedPosition.unrealizedPnl >= 0 ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {selectedPosition.unrealizedPnl >= 0 ? '+' : ''}
                      ${selectedPosition.unrealizedPnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className={`text-xs ${
                      selectedPosition.unrealizedPnl >= 0 ? 'text-emerald-500' : 'text-red-500'
                    }`}>
                      {((selectedPosition.unrealizedPnl / selectedPosition.margin) * 100).toFixed(2)}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Chart */}
              <div className="px-4 pt-4">
                <PriceChart
                  position={selectedPosition}
                  simulationState={simulationState}
                  priceHistory={priceHistory}
                  candleData={candleData}
                  isLoadingCandles={isLoadingCandles}
                  selectedTimeframe={selectedTimeframe}
                  onTimeframeChange={setSelectedTimeframe}
                />
              </div>

              {/* Stats Grid */}
              <div className="px-4 pb-4">
                <PositionStats
                  position={selectedPosition}
                  simulationState={simulationState}
                />
              </div>

              {/* Trading Activity */}
              <div className="px-4 pb-5">
                <TradingActivity address={savedAddress} />
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center min-h-[65vh] px-8">
              <div className="w-24 h-24 mb-6 rounded-2xl bg-gradient-to-br from-emerald-900/20 to-green-950/20 
                            flex items-center justify-center animate-pulse border border-emerald-900/30">
                <svg className="w-12 h-12 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <p className="text-xl text-white mb-2 font-bold">Start Risk Analysis</p>
              <p className="text-gray-500 text-center">
                Enter your Hyperliquid address above to analyze your positions
              </p>
            </div>
          )}
        </div>

        {/* Bottom Navigation */}
        {selectedPosition && (
          <nav 
            className="fixed inset-x-0 bottom-0 z-50"
            style={{ 
              transform: 'translate3d(0, 0, 0)',
              WebkitTransform: 'translate3d(0, 0, 0)',
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
            }}
          >
            <div 
              className="bg-black/95 backdrop-blur-xl border-t border-emerald-900/30 shadow-2xl"
              style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            >
              <div className="grid grid-cols-3 h-16">
                <button
                  onClick={() => setShowPositions(!showPositions)}
                  className={`flex flex-col items-center justify-center gap-1 transition-colors active:scale-95 ${
                    showPositions ? 'text-emerald-400' : 'text-gray-500'
                  }`}
                >
                  <span className="text-xs font-semibold">Positions</span>
                </button>
                <button
                  onClick={() => setShowControls(!showControls)}
                  className={`flex flex-col items-center justify-center gap-1 transition-colors active:scale-95 ${
                    showControls ? 'text-emerald-400' : 'text-gray-500'
                  }`}
                >
                  <span className="text-xs font-semibold">Simulate</span>
                </button>
                <button
                  onClick={() => setShowActivity(!showActivity)}
                  className={`flex flex-col items-center justify-center gap-1 transition-colors active:scale-95 ${
                    showActivity ? 'text-emerald-400' : 'text-gray-500'
                  }`}
                >
                  <span className="text-xs font-semibold">Activity</span>
                </button>
              </div>
            </div>
          </nav>
        )}

        {/* Mobile Positions Sheet */}
        {showPositions && (
          <div className="fixed inset-0 z-50 flex items-end">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
                 onClick={() => setShowPositions(false)} />
            <div className="relative w-full glass-sheet rounded-t-3xl 
                          animate-slide-up overflow-hidden" 
                 style={{ maxHeight: '75vh' }}>
              <div className="drag-handle" onClick={() => setShowPositions(false)} />
              <div className="px-4 pb-2">
                <h3 className="text-white font-bold text-lg">Your Positions</h3>
              </div>
              <div className="overflow-y-auto px-4 pb-8 hide-scrollbar" 
                   style={{ maxHeight: 'calc(75vh - 100px)' }}>
                <PositionList
                  positions={livePositions}
                  selectedPosition={selectedPosition}
                  onSelectPosition={handleSelectPosition}
                />
              </div>
            </div>
          </div>
        )}

        {/* Mobile Controls Sheet */}
        {showControls && (
          <div className="fixed inset-0 z-50 flex items-end">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
                 onClick={() => setShowControls(false)} />
            <div className="relative w-full glass-sheet rounded-t-3xl animate-slide-up"
                 style={{ maxHeight: '65vh' }}>
              <div className="drag-handle" onClick={() => setShowControls(false)} />
              <div className="px-4 pb-6 overflow-y-auto hide-scrollbar"
                   style={{ maxHeight: 'calc(65vh - 20px)' }}>
                <SimulationControls
                  onSimulate={handleSimulate}
                  isSimulating={simulationState.isSimulating}
                  onReset={resetSimulation}
                />
              </div>
            </div>
          </div>
        )}

        {/* Mobile Activity Sheet */}
        {showActivity && (
          <div className="fixed inset-0 z-50 flex items-end">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
                 onClick={() => setShowActivity(false)} />
            <div className="relative w-full glass-sheet rounded-t-3xl animate-slide-up"
                 style={{ maxHeight: '80vh' }}>
              <div className="drag-handle" onClick={() => setShowActivity(false)} />
              <div className="px-4 pb-8 overflow-y-auto hide-scrollbar"
                   style={{ maxHeight: 'calc(80vh - 20px)' }}>
                <TradingActivity address={savedAddress} />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Desktop Layout
  return (
    <div className="h-screen terminal-bg flex flex-col overflow-hidden">
      {/* Desktop Header */}
      <div className="bg-black/80 backdrop-blur-xl border-b border-emerald-900/30">
        <div className="flex items-center gap-4 px-4 py-2">
          <div className="flex-1">
            <AddressInput
              onFetch={handleFetchPositions}
              onClear={handleClearAddress}
              isLoading={isLoading}
              error={error}
              savedAddress={savedAddress}
            />
          </div>
          {/* Portfolio Summary Icon */}
          <PortfolioSummary
            positions={livePositions}
            accountValue={accountData?.marginSummary?.accountValue || null}
            withdrawable={accountData?.withdrawable || null}
            isConnected={wsConnected}
          />
        </div>
      </div>

      {/* Desktop Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-96 bg-gray-950/50 backdrop-blur-sm border-r border-emerald-900/20 overflow-y-auto">
          <PositionList
            positions={livePositions}
            selectedPosition={selectedPosition}
            onSelectPosition={handleSelectPosition}
          />
          
          {/* Trading Activity in Sidebar - Desktop */}
          {savedAddress && (
            <div className="p-4 border-t border-emerald-900/20">
              <TradingActivity address={savedAddress} />
            </div>
          )}
        </div>

        {/* Main Area */}
        <div className="flex-1 overflow-hidden">
          {selectedPosition ? (
            <div className="h-full flex flex-col p-6 gap-6">
              {/* Live indicator */}
              {wsConnected && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-emerald-400">Live prices</span>
                </div>
              )}
              
              <div className="flex-1 min-h-0">
                <PriceChart
                  position={selectedPosition}
                  simulationState={simulationState}
                  priceHistory={priceHistory}
                  candleData={candleData}
                  isLoadingCandles={isLoadingCandles}
                  selectedTimeframe={selectedTimeframe}
                  onTimeframeChange={setSelectedTimeframe}
                />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <SimulationControls
                  onSimulate={handleSimulate}
                  isSimulating={simulationState.isSimulating}
                  onReset={resetSimulation}
                />
                <PositionStats
                  position={selectedPosition}
                  simulationState={simulationState}
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-32 h-32 mx-auto mb-8 rounded-2xl bg-gradient-to-br from-emerald-900/20 to-green-950/20 
                              flex items-center justify-center animate-pulse border border-emerald-900/30">
                  <svg className="w-16 h-16 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <p className="text-2xl text-white mb-3 font-bold">No Position Selected</p>
                <p className="text-gray-500 text-lg">
                  {positions.length > 0
                    ? 'Select a position from the sidebar to begin analysis'
                    : 'Enter your Hyperliquid address above to get started'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;