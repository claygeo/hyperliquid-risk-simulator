import { useState, useEffect } from 'react';
import { AddressInput } from './components/AddressInput';
import { PositionList } from './components/PositionList';
import { PriceChart } from './components/PriceChart';
import { SimulationControls } from './components/SimulationControls';
import { PositionStats } from './components/PositionStats';
import { useHyperliquid } from './hooks/useHyperliquid';
import { Position, SimulationState, PriceData, CandleData } from './types';
import {
  calculateNewPrice,
  isPositionLiquidated,
  calculatePnL,
  generatePriceHistory,
} from './services/calculations';
import { fetchCandleData } from './services/hyperliquid';

function App() {
  const { positions, isLoading, error, fetchPositions } = useHyperliquid();
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
  const [isMobile, setIsMobile] = useState(false);
  const [showPositions, setShowPositions] = useState(false);
  const [showControls, setShowControls] = useState(false);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auto-select first position on mobile
  useEffect(() => {
    if (isMobile && positions.length > 0 && !selectedPosition) {
      handleSelectPosition(positions[0]);
    }
  }, [positions, isMobile]);

  // Handle fetching positions
  const handleFetchPositions = async (address: string) => {
    await fetchPositions(address);
    setSelectedPosition(null);
    resetSimulation();
    setCandleData([]);
    if (isMobile && positions.length > 0) {
      setShowPositions(true);
    }
  };

  // Handle position selection
  const handleSelectPosition = (position: Position) => {
    setSelectedPosition(position);
    resetSimulation();
    loadCandleData(position.coin);
    if (isMobile) {
      setShowPositions(false);
      setShowControls(false);
    }
  };

  // Load candle data for a coin
  const loadCandleData = async (coin: string) => {
    setIsLoadingCandles(true);
    try {
      const candles = await fetchCandleData(coin, '15m', 24);
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
          <AddressInput
            onFetch={handleFetchPositions}
            isLoading={isLoading}
            error={error}
          />
        </div>

        {/* Mobile Content */}
        <div className="relative pb-24" style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom))' }}>
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
                      <div className={`text-sm font-bold mono ${
                        selectedPosition.unrealizedPnl >= 0 ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        {selectedPosition.unrealizedPnl >= 0 ? '+' : ''}
                        ${Math.abs(selectedPosition.unrealizedPnl).toFixed(2)}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowPositions(true)}
                    className="text-gray-500 hover:text-emerald-400 p-2 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Chart */}
              <div className="px-4 py-5">
                <PriceChart
                  position={selectedPosition}
                  simulationState={simulationState}
                  priceHistory={priceHistory}
                  candleData={candleData}
                  isLoadingCandles={isLoadingCandles}
                />
              </div>

              {/* Stats Grid */}
              <div className="px-4 pb-5">
                <PositionStats
                  position={selectedPosition}
                  simulationState={simulationState}
                />
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
          <div className="fixed bottom-0 left-0 right-0 z-40" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
            <div className="bg-black/95 backdrop-blur-xl border-t border-emerald-900/30">
              <div className="grid grid-cols-2 h-16">
                <button
                  onClick={() => setShowPositions(!showPositions)}
                  className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                    showPositions ? 'text-emerald-400' : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span className="text-xs font-semibold">Positions</span>
                </button>
                <button
                  onClick={() => setShowControls(!showControls)}
                  className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                    showControls ? 'text-emerald-400' : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span className="text-xs font-semibold">Simulate</span>
                </button>
              </div>
            </div>
          </div>
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
                  positions={positions}
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
      </div>
    );
  }

  // Desktop Layout
  return (
    <div className="h-screen terminal-bg flex flex-col overflow-hidden">
      {/* Desktop Header */}
      <div className="bg-black/80 backdrop-blur-xl border-b border-emerald-900/30">
        <AddressInput
          onFetch={handleFetchPositions}
          isLoading={isLoading}
          error={error}
        />
      </div>

      {/* Desktop Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-96 bg-gray-950/50 backdrop-blur-sm border-r border-emerald-900/20 overflow-y-auto">
          <PositionList
            positions={positions}
            selectedPosition={selectedPosition}
            onSelectPosition={handleSelectPosition}
          />
        </div>

        {/* Main Area */}
        <div className="flex-1 overflow-hidden">
          {selectedPosition ? (
            <div className="h-full flex flex-col p-6 gap-6">
              <div className="flex-1 min-h-0">
                <PriceChart
                  position={selectedPosition}
                  simulationState={simulationState}
                  priceHistory={priceHistory}
                  candleData={candleData}
                  isLoadingCandles={isLoadingCandles}
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