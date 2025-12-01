import { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, IChartApi, ISeriesApi, CandlestickData, LineStyle } from 'lightweight-charts';
import { Position, SimulationState, PriceData, CandleData, PriceChartProps } from '../types';

export const PriceChart = ({ 
  position, 
  simulationState, 
  priceHistory, 
  candleData,
  isLoadingCandles,
  selectedTimeframe,
  onTimeframeChange
}: PriceChartProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const lineSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [priceChange, setPriceChange] = useState<number>(0);
  
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  // Convert milliseconds to seconds for TradingView
  const msToSeconds = (ms: number): number => {
    // If timestamp is in milliseconds (13 digits), convert to seconds
    if (ms > 10000000000) {
      return Math.floor(ms / 1000);
    }
    return Math.floor(ms);
  };

  // Format price for display
  const formatPrice = (value: number): string => {
    if (value >= 1000) {
      return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `$${value.toFixed(value < 1 ? 6 : 2)}`;
  };

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Create chart with dark theme
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#9CA3AF',
        fontFamily: 'SF Mono, Monaco, Consolas, monospace',
        fontSize: 11,
      },
      grid: {
        vertLines: { color: 'rgba(55, 65, 81, 0.3)' },
        horzLines: { color: 'rgba(55, 65, 81, 0.3)' },
      },
      crosshair: {
        mode: 1, // Normal crosshair
        vertLine: {
          width: 1,
          color: 'rgba(16, 185, 129, 0.5)',
          style: LineStyle.Dashed,
          labelBackgroundColor: '#10B981',
        },
        horzLine: {
          width: 1,
          color: 'rgba(16, 185, 129, 0.5)',
          style: LineStyle.Dashed,
          labelBackgroundColor: '#10B981',
        },
      },
      rightPriceScale: {
        borderColor: 'rgba(55, 65, 81, 0.5)',
        scaleMargins: {
          top: 0.1,
          bottom: 0.1,
        },
      },
      timeScale: {
        borderColor: 'rgba(55, 65, 81, 0.5)',
        timeVisible: true,
        secondsVisible: false,
        tickMarkFormatter: (time: number) => {
          const date = new Date(time * 1000);
          const hours = date.getHours();
          const minutes = date.getMinutes();
          
          // For longer timeframes, show date
          if (selectedTimeframe === '1M' || selectedTimeframe === 'All') {
            return `${date.getMonth() + 1}/${date.getDate()}`;
          }
          
          return `${hours}:${minutes.toString().padStart(2, '0')}`;
        },
      },
      handleScale: {
        axisPressedMouseMove: {
          time: true,
          price: true,
        },
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: true,
      },
    });

    // Set chart size
    const updateSize = () => {
      if (chartContainerRef.current) {
        const width = chartContainerRef.current.clientWidth;
        const height = isMobile ? 280 : 360;
        chart.applyOptions({ width, height });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);

    chartRef.current = chart;

    return () => {
      window.removeEventListener('resize', updateSize);
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      lineSeriesRef.current = null;
    };
  }, [isMobile, selectedTimeframe]);

  // Update chart data
  useEffect(() => {
    if (!chartRef.current || !position) return;

    const chart = chartRef.current;
    const isSimulating = simulationState.isSimulating;

    // Remove existing series
    if (candleSeriesRef.current) {
      chart.removeSeries(candleSeriesRef.current);
      candleSeriesRef.current = null;
    }
    if (lineSeriesRef.current) {
      chart.removeSeries(lineSeriesRef.current);
      lineSeriesRef.current = null;
    }

    if (isSimulating && priceHistory.length > 0) {
      // Simulation mode - show line chart
      const lineSeries = chart.addLineSeries({
        color: '#A855F7', // Purple for simulation
        lineWidth: 2,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 4,
        crosshairMarkerBackgroundColor: '#A855F7',
        priceLineVisible: true,
        priceLineColor: '#A855F7',
        lastValueVisible: true,
      });

      const lineData = priceHistory
        .map((point, index) => ({
          time: msToSeconds(point.time || Date.now() - (priceHistory.length - index) * 60000) as any,
          value: point.price,
        }))
        .sort((a, b) => (a.time as number) - (b.time as number));

      lineSeries.setData(lineData);
      lineSeriesRef.current = lineSeries;

      // Set current price from simulation
      const lastPrice = simulationState.simulatedPrice ?? position.currentPrice;
      setCurrentPrice(lastPrice);
      setPriceChange(((lastPrice - position.entryPrice) / position.entryPrice) * 100);

    } else if (candleData.length > 0) {
      // Normal mode - show candlestick chart
      const candleSeries = chart.addCandlestickSeries({
        upColor: '#10B981',
        downColor: '#EF4444',
        borderUpColor: '#10B981',
        borderDownColor: '#EF4444',
        wickUpColor: '#10B981',
        wickDownColor: '#EF4444',
        priceLineVisible: true,
        lastValueVisible: true,
      });

      // Transform and sort candle data
      const formattedCandles: CandlestickData[] = candleData
        .map(candle => ({
          time: msToSeconds(candle.time) as any,
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
        }))
        .filter(c => c.open > 0 && c.close > 0) // Filter invalid candles
        .sort((a, b) => (a.time as number) - (b.time as number));

      if (formattedCandles.length > 0) {
        candleSeries.setData(formattedCandles);
        
        // Set current price from last candle
        const lastCandle = formattedCandles[formattedCandles.length - 1];
        setCurrentPrice(lastCandle.close);
        setPriceChange(((lastCandle.close - position.entryPrice) / position.entryPrice) * 100);
      }

      candleSeriesRef.current = candleSeries;

      // Add entry price line
      candleSeries.createPriceLine({
        price: position.entryPrice,
        color: '#3B82F6',
        lineWidth: 2,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: 'Entry',
      });

      // Add liquidation price line
      if (position.liquidationPrice && position.liquidationPrice > 0) {
        candleSeries.createPriceLine({
          price: position.liquidationPrice,
          color: '#EF4444',
          lineWidth: 2,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: 'Liq',
        });
      }
    }

    // Fit content to view
    chart.timeScale().fitContent();

  }, [candleData, priceHistory, position, simulationState]);

  // Loading state
  if (isLoadingCandles) {
    return (
      <div className="glass-card p-6 h-[300px] md:h-[400px] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto mb-3" />
          <div className="text-emerald-400 text-sm font-medium">Loading chart...</div>
        </div>
      </div>
    );
  }

  // No position state
  if (!position) {
    return (
      <div className="glass-card p-6 h-[300px] md:h-[400px] flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-600 text-sm">No chart data available</div>
          <div className="text-gray-700 text-xs mt-1">Enter an address to view price history</div>
        </div>
      </div>
    );
  }

  const displayPrice = simulationState.isSimulating 
    ? (simulationState.simulatedPrice ?? position.currentPrice) 
    : currentPrice || position.currentPrice;
  
  const displayChange = simulationState.isSimulating
    ? ((displayPrice - position.entryPrice) / position.entryPrice) * 100
    : priceChange;

  const normalizedSide = position.side.toUpperCase();
  const isProfit = normalizedSide === 'LONG' ? displayChange > 0 : displayChange < 0;

  const timeframes: Array<'24H' | '1W' | '1M' | 'All'> = ['24H', '1W', '1M', 'All'];

  return (
    <div className="glass-card p-3 md:p-4">
      {/* Chart header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-gray-400 text-xs font-medium uppercase tracking-wide">
            {simulationState.isSimulating ? 'Simulated Price' : 'Price Chart'}
          </h3>
          <div className="text-gray-100 text-lg font-bold font-mono mt-0.5">
            {formatPrice(displayPrice)}
            {simulationState.isSimulating && (
              <span className="text-xs text-purple-400 ml-2 font-normal">(Simulated)</span>
            )}
          </div>
        </div>
        
        {/* Timeframe Selector */}
        {!simulationState.isSimulating && (
          <div className="flex gap-0.5 bg-gray-950/50 rounded-md p-0.5 border border-gray-800/50">
            {timeframes.map((tf) => (
              <button
                key={tf}
                onClick={() => onTimeframeChange(tf)}
                disabled={isLoadingCandles}
                className={`px-2 py-1 text-xs font-bold rounded transition-all ${
                  selectedTimeframe === tf
                    ? 'bg-emerald-600 text-white'
                    : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {tf}
              </button>
            ))}
          </div>
        )}
        
        {/* Price change display */}
        <div className="text-right">
          <div className={`text-sm font-bold font-mono ${isProfit ? 'text-emerald-400' : 'text-red-400'}`}>
            {displayChange >= 0 ? '+' : ''}{displayChange.toFixed(2)}%
          </div>
          <div className="text-xs text-gray-500">Change</div>
        </div>
      </div>

      {/* TradingView Chart Container */}
      <div 
        ref={chartContainerRef} 
        className="w-full"
        style={{ height: isMobile ? 280 : 360 }}
      />

      {/* Legend */}
      <div className="mt-3">
        <div className="flex items-center justify-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 bg-blue-500"></div>
            <span className="text-gray-500">Entry: {formatPrice(position.entryPrice)}</span>
          </div>
          {position.liquidationPrice && position.liquidationPrice > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 bg-red-500"></div>
              <span className="text-gray-500">Liq: {formatPrice(position.liquidationPrice)}</span>
            </div>
          )}
          {simulationState.isSimulating && (
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 bg-purple-500"></div>
              <span className="text-gray-500">Simulated</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};