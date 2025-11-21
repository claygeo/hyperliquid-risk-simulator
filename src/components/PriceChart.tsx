import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ComposedChart,
  Line
} from 'recharts';
import { Position, SimulationState, PriceData, CandleData } from '../types';

interface PriceChartProps {
  position: Position | null;
  simulationState: SimulationState;
  priceHistory: PriceData[];
  candleData: CandleData[];
  isLoadingCandles: boolean;
  selectedTimeframe: '24H' | '1W' | '1M' | 'All';
  onTimeframeChange: (timeframe: '24H' | '1W' | '1M' | 'All') => void;
}

export const PriceChart = ({ 
  position, 
  simulationState, 
  priceHistory, 
  candleData,
  isLoadingCandles,
  selectedTimeframe,
  onTimeframeChange
}: PriceChartProps) => {
  
  if (isLoadingCandles) {
    return (
      <div className="glass-card p-6 h-[300px] md:h-[400px] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse">
            <div className="text-emerald-400 text-sm font-medium">Loading chart data...</div>
          </div>
        </div>
      </div>
    );
  }

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

  const isMobile = window.innerWidth < 768;
  
  const isSimulating = simulationState.isSimulating;
  const currentPrice = isSimulating ? (simulationState.simulatedPrice ?? position.currentPrice) : position.currentPrice;
  const entryPrice = position.entryPrice;
  const liquidationPrice = position.liquidationPrice ?? 0;

  // Prepare chart data with OHLC
  let chartData: Array<{ 
    timestamp: number; 
    high: number;
    low: number;
    close: number;
    displayTime: string;
  }> = [];

  if (isSimulating && priceHistory.length > 0) {
    chartData = priceHistory.map(point => {
      const ts = (point as any).timestamp ?? Date.now();
      const price = (point as any).price ?? 0;
      return {
        timestamp: ts,
        high: price,
        low: price,
        close: price,
        displayTime: formatTime(ts)
      };
    });
  } else if (candleData.length > 0) {
    chartData = candleData.map(candle => {
      const ts = (candle as any).time || Date.now();
      return {
        timestamp: ts,
        high: candle.high,
        low: candle.low,
        close: candle.close,
        displayTime: formatTime(ts)
      };
    }).filter(d => d.close > 0);
  } else {
    chartData = [{
      timestamp: Date.now(),
      high: position.currentPrice,
      low: position.currentPrice,
      close: position.currentPrice,
      displayTime: 'Now'
    }];
  }

  // Calculate Y-axis domain
  const allPrices = chartData.flatMap(d => [d.high, d.low]);
  allPrices.push(entryPrice, currentPrice);
  if (liquidationPrice > 0) allPrices.push(liquidationPrice);
  
  const minPrice = Math.min(...allPrices);
  const maxPrice = Math.max(...allPrices);
  const padding = (maxPrice - minPrice) * 0.1;
  const yDomain = [minPrice - padding, maxPrice + padding];

  const normalizedSide = position.side.toUpperCase();
  const priceChange = currentPrice - entryPrice;
  const isProfit = normalizedSide === 'LONG' ? priceChange > 0 : priceChange < 0;

  function formatTime(timestamp: number | string): string {
    try {
      let ts = typeof timestamp === 'string' ? parseFloat(timestamp) : timestamp;
      if (ts < 10000000000) ts = ts * 1000;
      
      const date = new Date(ts);
      if (!date || isNaN(date.getTime())) return '--:--';
      
      const hours = date.getHours();
      const minutes = date.getMinutes();
      if (isNaN(hours) || isNaN(minutes)) return '--:--';
      
      return `${hours}:${minutes.toString().padStart(2, '0')}`;
    } catch (e) {
      return '--:--';
    }
  }

  function formatPrice(value: number): string {
    return `$${value.toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`;
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload[0]) {
      const data = payload[0].payload;
      
      return (
        <div className="bg-gray-950/95 backdrop-blur-md border border-gray-800/60 rounded-md p-3 shadow-xl">
          <div className="text-gray-400 text-xs mb-1.5 font-mono">{data.displayTime}</div>
          <div className="space-y-1 text-xs font-mono">
            <div className="flex justify-between gap-4">
              <span className="text-gray-500">High:</span>
              <span className="text-emerald-400">{formatPrice(data.high)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-500">Low:</span>
              <span className="text-red-400">{formatPrice(data.low)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-500">Close:</span>
              <span className="text-gray-100 font-bold">{formatPrice(data.close)}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const timeframes: Array<'24H' | '1W' | '1M' | 'All'> = ['24H', '1W', '1M', 'All'];

  return (
    <div className="glass-card p-3 md:p-4">
      {/* Chart header with timeframe selector */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-gray-400 text-xs font-medium uppercase tracking-wide">
            {isSimulating ? 'Simulated Price' : 'Price Chart'}
          </h3>
          <div className="text-gray-100 text-lg font-bold font-mono mt-0.5">
            {formatPrice(currentPrice)}
            {isSimulating && (
              <span className="text-xs text-purple-400 ml-2 font-normal">(Simulated)</span>
            )}
          </div>
        </div>
        
        {/* Timeframe Selector */}
        {!isSimulating && (
          <div className="flex gap-1 bg-gray-950/50 rounded-lg p-1 border border-gray-800/50">
            {timeframes.map((tf) => (
              <button
                key={tf}
                onClick={() => onTimeframeChange(tf)}
                disabled={isLoadingCandles}
                className={`px-2.5 py-1 text-xs font-bold rounded transition-all ${
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
        
        {/* Price change display (moved from below chart) */}
        <div className="text-right">
          <div className={`text-sm font-bold font-mono ${isProfit ? 'text-emerald-400' : 'text-red-400'}`}>
            {isProfit ? '+' : ''}{((currentPrice - entryPrice) / entryPrice * 100).toFixed(2)}%
          </div>
          <div className="text-xs text-gray-500">Change</div>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={isMobile ? 280 : 360}>
        <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <XAxis
            dataKey="displayTime"
            stroke="#4B5563"
            strokeWidth={1}
            tick={{ fill: '#9CA3AF', fontSize: 10 }}
            tickLine={false}
            axisLine={{ stroke: '#374151', strokeWidth: 1 }}
            interval={isMobile ? Math.floor(chartData.length / 4) : Math.floor(chartData.length / 8)}
            angle={-35}
            textAnchor="end"
            height={50}
          />

          <YAxis
            domain={yDomain}
            stroke="#4B5563"
            strokeWidth={1}
            tick={{ fill: '#9CA3AF', fontSize: 10 }}
            tickLine={false}
            axisLine={{ stroke: '#374151', strokeWidth: 1 }}
            tickFormatter={(value) => `$${(value / 1000).toFixed(1)}k`}
            width={50}
          />

          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#374151', strokeWidth: 1 }} />

          {/* High line (wicks) */}
          <Line
            type="monotone"
            dataKey="high"
            stroke="#10b981"
            strokeWidth={0.5}
            dot={false}
            opacity={0.3}
          />

          {/* Low line (wicks) */}
          <Line
            type="monotone"
            dataKey="low"
            stroke="#ef4444"
            strokeWidth={0.5}
            dot={false}
            opacity={0.3}
          />

          {/* Close price line (main) */}
          <Line
            type="monotone"
            dataKey="close"
            stroke={isSimulating ? '#A855F7' : '#3B82F6'}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: isSimulating ? '#A855F7' : '#3B82F6', strokeWidth: 0 }}
          />

          {/* Entry price line */}
          <ReferenceLine
            y={entryPrice}
            stroke="#3B82F6"
            strokeWidth={1.5}
            strokeDasharray="4 4"
            label={{
              value: `Entry: ${formatPrice(entryPrice)}`,
              position: 'insideTopLeft',
              fill: '#3B82F6',
              fontSize: 10,
              fontWeight: 600,
              fontFamily: 'SF Mono, Monaco, Consolas, monospace'
            }}
          />

          {/* Liquidation price line */}
          {liquidationPrice > 0 && (
            <ReferenceLine
              y={liquidationPrice}
              stroke="#EF4444"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              label={{
                value: `Liq: ${formatPrice(liquidationPrice)}`,
                position: 'insideTopRight',
                fill: '#EF4444',
                fontSize: 10,
                fontWeight: 600,
                fontFamily: 'SF Mono, Monaco, Consolas, monospace'
              }}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="mt-3">
        <div className="flex items-center justify-center gap-4 text-xs mb-2">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 bg-blue-500"></div>
            <span className="text-gray-500">Entry</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 bg-red-500"></div>
            <span className="text-gray-500">Liquidation</span>
          </div>
          {isSimulating && (
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 bg-purple-500"></div>
              <span className="text-gray-500">Simulated</span>
            </div>
          )}
        </div>
        
        {!isSimulating && (
          <div className="text-center text-xs text-gray-600">
            Chart shows close prices with high/low wicks
          </div>
        )}
      </div>
    </div>
  );
};