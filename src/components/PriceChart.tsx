import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  ComposedChart
} from 'recharts';
import { Position, SimulationState, PriceData, CandleData } from '../types';

interface PriceChartProps {
  position: Position | null;
  simulationState: SimulationState;
  priceHistory: PriceData[];
  candleData: CandleData[];
  isLoadingCandles: boolean;
}

export const PriceChart = ({ 
  position, 
  simulationState, 
  priceHistory, 
  candleData,
  isLoadingCandles 
}: PriceChartProps) => {
  
  // Show loading state
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

  // Show empty state if no position
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
  
  // Use simulation data if simulating, otherwise use candle data
  const isSimulating = simulationState.isSimulating;
  const currentPrice = isSimulating ? simulationState.simulatedPrice! : position.currentPrice;
  const entryPrice = position.entryPrice;
  const liquidationPrice = position.liquidationPrice;

  // Prepare chart data
  let chartData: Array<{ timestamp: number; price: number; displayTime: string }> = [];

  if (isSimulating && priceHistory.length > 0) {
    // Use simulation price history
    chartData = priceHistory.map(point => ({
      timestamp: point.timestamp,
      price: point.price,
      displayTime: formatTime(point.timestamp)
    }));
  } else if (candleData.length > 0) {
    // Use actual candle data - be very defensive
    console.log('Sample candle data:', candleData[0]); // Debug
    
    chartData = candleData.map(candle => {
      // Try to get timestamp from various possible fields
      const ts = candle.timestamp || candle.time || candle.t || Date.now();
      const price = candle.close || candle.c || 0;
      
      return {
        timestamp: ts,
        price: price,
        displayTime: formatTime(ts)
      };
    }).filter(d => d.price > 0); // Filter out any invalid data
    
    console.log('Formatted chart data sample:', chartData[0]); // Debug
  } else {
    // Fallback: show current price as a single point
    chartData = [{
      timestamp: Date.now(),
      price: position.currentPrice,
      displayTime: 'Now'
    }];
  }

  // Calculate Y-axis domain with padding
  const prices = chartData.map(d => d.price);
  const allPrices = [...prices, entryPrice, liquidationPrice, currentPrice];
  const minPrice = Math.min(...allPrices);
  const maxPrice = Math.max(...allPrices);
  const padding = (maxPrice - minPrice) * 0.1;
  const yDomain = [minPrice - padding, maxPrice + padding];

  // Determine price trend
  const priceChange = currentPrice - entryPrice;
  const isProfit = position.side === 'LONG' ? priceChange > 0 : priceChange < 0;
  const lineColor = isProfit ? '#10b981' : '#ef4444';
  const gradientColor = isProfit ? 'emerald' : 'red';

  function formatTime(timestamp: number | string): string {
    try {
      // Convert to number if string
      let ts = typeof timestamp === 'string' ? parseFloat(timestamp) : timestamp;
      
      // If timestamp seems too small, it's likely in seconds - convert to ms
      if (ts < 10000000000) {
        ts = ts * 1000;
      }
      
      const date = new Date(ts);
      
      // Validate date
      if (!date || isNaN(date.getTime())) {
        return '--:--';
      }
      
      const hours = date.getHours();
      const minutes = date.getMinutes();
      
      // Final validation
      if (isNaN(hours) || isNaN(minutes)) {
        return '--:--';
      }
      
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
          <div className="text-gray-400 text-xs mb-1 font-mono">{data.displayTime}</div>
          <div className="text-gray-100 text-sm font-bold font-mono">{formatPrice(data.price)}</div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass-card p-3 md:p-4">
      {/* Chart header - compact */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-gray-400 text-xs font-medium uppercase tracking-wide">
            {isSimulating ? 'Simulated Price' : '24H Price Chart'}
          </h3>
          <div className="text-gray-100 text-lg font-bold font-mono mt-0.5">
            {formatPrice(currentPrice)}
            {isSimulating && (
              <span className="text-xs text-purple-400 ml-2 font-normal">(Simulated)</span>
            )}
          </div>
        </div>
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
          <defs>
            <linearGradient id={`area-${gradientColor}`} x1="0" y1="0" x2="0" y2="1">
              <stop 
                offset="5%" 
                stopColor={lineColor} 
                stopOpacity={0.3}
              />
              <stop 
                offset="95%" 
                stopColor={lineColor} 
                stopOpacity={0}
              />
            </linearGradient>
          </defs>

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

          {/* Price area */}
          <Area
            type="monotone"
            dataKey="price"
            stroke="none"
            fill={`url(#area-${gradientColor})`}
          />

          {/* Price line */}
          <Line
            type="monotone"
            dataKey="price"
            stroke={lineColor}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: lineColor, strokeWidth: 0 }}
          />

          {/* Entry price line */}
          <ReferenceLine
            y={entryPrice}
            stroke="#3B82F6"
            strokeWidth={1.5}
            strokeDasharray="4 4"
            label={{
              value: `Entry: ${formatPrice(entryPrice)}`,
              position: 'insideTopRight',
              fill: '#3B82F6',
              fontSize: 10,
              fontWeight: 600,
              fontFamily: 'SF Mono, Monaco, Consolas, monospace'
            }}
          />

          {/* Liquidation price line */}
          <ReferenceLine
            y={liquidationPrice}
            stroke="#EF4444"
            strokeWidth={1.5}
            strokeDasharray="4 4"
            label={{
              value: `Liq: ${formatPrice(liquidationPrice)}`,
              position: 'insideBottomRight',
              fill: '#EF4444',
              fontSize: 10,
              fontWeight: 600,
              fontFamily: 'SF Mono, Monaco, Consolas, monospace'
            }}
          />

          {/* Simulated price line */}
          {isSimulating && (
            <ReferenceLine
              y={currentPrice}
              stroke="#A855F7"
              strokeWidth={1.5}
              strokeDasharray="2 2"
              label={{
                value: `Sim: ${formatPrice(currentPrice)}`,
                position: 'insideTopLeft',
                fill: '#A855F7',
                fontSize: 10,
                fontWeight: 600,
                fontFamily: 'SF Mono, Monaco, Consolas, monospace'
              }}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>

      {/* Chart legend - compact */}
      <div className="flex items-center justify-center gap-4 mt-3 text-xs">
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
    </div>
  );
};