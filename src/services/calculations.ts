import { Position } from '../types';

/**
 * Calculate new price based on percentage change
 */
export const calculateNewPrice = (
  currentPrice: number,
  percentChange: number
): number => {
  return currentPrice * (1 + percentChange / 100);
};

/**
 * Check if position would be liquidated at a given price
 */
export const isPositionLiquidated = (
  position: Position,
  newPrice: number
): boolean => {
  if (!position.liquidationPrice) return false;

  if (position.side === 'long') {
    return newPrice <= position.liquidationPrice;
  } else {
    return newPrice >= position.liquidationPrice;
  }
};

/**
 * Calculate P&L at a given price
 */
export const calculatePnL = (
  position: Position,
  newPrice: number
): number => {
  const priceDiff = newPrice - position.entryPrice;
  const multiplier = position.side === 'long' ? 1 : -1;
  return position.size * priceDiff * multiplier;
};

/**
 * Calculate distance to liquidation as a percentage
 */
export const calculateDistanceToLiquidation = (
  position: Position
): number => {
  if (!position.liquidationPrice) return Infinity;

  const distance = Math.abs(
    (position.currentPrice - position.liquidationPrice) / position.currentPrice
  );
  return distance * 100;
};

/**
 * Calculate ROE (Return on Equity) at a given price
 */
export const calculateROE = (position: Position, newPrice: number): number => {
  const pnl = calculatePnL(position, newPrice);
  const roe = (pnl / position.margin) * 100;
  return roe;
};

/**
 * Format number as currency
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

/**
 * Format number as percentage
 */
export const formatPercentage = (value: number): string => {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
};

/**
 * Generate realistic price history with volatility for chart animation
 */
export const generatePriceHistory = (
  startPrice: number,
  endPrice: number,
  steps: number = 60
): { price: number; time: number }[] => {
  const history: { price: number; time: number }[] = [];
  const totalChange = endPrice - startPrice;
  const baseStepSize = totalChange / steps;
  
  // Volatility factor (2% random variation)
  const volatility = 0.02;
  
  let currentPrice = startPrice;
  
  for (let i = 0; i <= steps; i++) {
    // Add some random variation to make it look realistic
    const randomVariation = (Math.random() - 0.5) * 2 * volatility * Math.abs(startPrice);
    
    // Calculate progress (sigmoid curve for more natural movement)
    const progress = i / steps;
    const smoothProgress = progress * progress * (3 - 2 * progress); // Smoothstep function
    
    // Calculate price with trend + randomness
    let price = startPrice + (totalChange * smoothProgress) + randomVariation;
    
    // Ensure we don't overshoot too much
    if (totalChange > 0) {
      price = Math.min(price, endPrice + Math.abs(totalChange) * 0.05);
      price = Math.max(price, startPrice - Math.abs(totalChange) * 0.05);
    } else {
      price = Math.max(price, endPrice - Math.abs(totalChange) * 0.05);
      price = Math.min(price, startPrice + Math.abs(totalChange) * 0.05);
    }
    
    // On the last step, ensure we hit the target exactly
    if (i === steps) {
      price = endPrice;
    }
    
    history.push({
      price: price,
      time: i,
    });
    
    currentPrice = price;
  }

  return history;
};