import { Candle, BacktestMetrics, BacktestTrade } from '../types';
import { calculateEMA, calculateSMA, calculateRSI } from './indicators';

export interface BacktestParams {
  strategyName: string;
  initialCapital: number;
  tradeSizePercent: number; // e.g. 50% of capital
  feePercent: number; // e.g. 0.05%
  slippagePercent: number; // e.g. 0.02%
  fastPeriod?: number;
  slowPeriod?: number;
  rsiPeriod?: number;
  rsiOversold?: number;
  rsiOverbought?: number;
  sentimentWeight?: number;
  sentimentSignals?: (number | null)[]; // -100 to +100
}

/**
 * Runs a deterministic backtest against candlestick history
 */
export function runBacktest(
  candles: Candle[],
  params: BacktestParams
): BacktestMetrics {
  const initialCapital = params.initialCapital || 10000;
  let currentCapital = initialCapital;
  let peakCapital = initialCapital;
  let maxDrawdown = 0;

  const trades: BacktestTrade[] = [];
  const equityCurve: { time: number; equity: number }[] = [];

  if (candles.length < 30) {
    return {
      initialCapital,
      finalCapital: initialCapital,
      netProfit: 0,
      netProfitPercent: 0,
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      winRate: 0,
      profitFactor: 1,
      maxDrawdown: 0,
      sharpeRatio: 0,
      equityCurve: [{ time: candles[0]?.time || Date.now() / 1000, equity: initialCapital }],
      trades: [],
    };
  }

  const closes = candles.map((c) => c.close);
  const fast = calculateEMA(closes, params.fastPeriod || 9);
  const slow = calculateEMA(closes, params.slowPeriod || 21);
  const rsi = calculateRSI(closes, params.rsiPeriod || 14);

  let activePosition: {
    side: 'LONG' | 'SHORT';
    entryPrice: number;
    amount: number;
    entryTime: number;
    cost: number;
  } | null = null;

  const returns: number[] = [];

  for (let i = 25; i < candles.length; i++) {
    const candle = candles[i];
    const prevCandle = candles[i - 1];

    let buySignal = false;
    let sellSignal = false;

    // Strategy 1: EMA Crossover + RSI filter
    if (params.strategyName.includes('EMA') || params.strategyName.includes('Trend')) {
      const f1 = fast[i - 1];
      const f2 = fast[i];
      const s1 = slow[i - 1];
      const s2 = slow[i];

      if (f1 !== null && f2 !== null && s1 !== null && s2 !== null) {
        if (f1 <= s1 && f2 > s2) {
          buySignal = true;
        } else if (f1 >= s1 && f2 < s2) {
          sellSignal = true;
        }
      }
    } else if (params.strategyName.includes('RSI') || params.strategyName.includes('Mean Reversion')) {
      // RSI Mean Reversion
      const rPrev = rsi[i - 1];
      const rCurr = rsi[i];
      const oversold = params.rsiOversold || 30;
      const overbought = params.rsiOverbought || 70;

      if (rPrev !== null && rCurr !== null) {
        if (rPrev < oversold && rCurr >= oversold) {
          buySignal = true;
        } else if (rPrev > overbought && rCurr <= overbought) {
          sellSignal = true;
        }
      }
    } else {
      // Default: Sentiment-Enhanced Momentum
      const f1 = fast[i - 1];
      const f2 = fast[i];
      const s1 = slow[i - 1];
      const s2 = slow[i];
      const sent = params.sentimentSignals ? params.sentimentSignals[i] : null;

      if (f1 !== null && f2 !== null && s1 !== null && s2 !== null) {
        if (f1 <= s1 && f2 > s2 && (sent === null || sent >= -10)) {
          buySignal = true;
        } else if (f1 >= s1 && f2 < s2 && (sent === null || sent <= 10)) {
          sellSignal = true;
        }
      }
    }

    // Execution logic with slippage and fee simulation
    const slippageMultiplier = 1 + (params.slippagePercent || 0.02) / 100;
    const feeRate = (params.feePercent || 0.05) / 100;

    // Handle Active Long Position Exit
    if (activePosition && activePosition.side === 'LONG' && sellSignal) {
      const exitPrice = candle.close / slippageMultiplier;
      const grossPnl = (exitPrice - activePosition.entryPrice) * activePosition.amount;
      const fee = (activePosition.cost + exitPrice * activePosition.amount) * feeRate;
      const netPnl = grossPnl - fee;
      const pnlPercent = (netPnl / activePosition.cost) * 100;

      currentCapital += activePosition.cost + netPnl;
      returns.push(pnlPercent / 100);

      trades.push({
        id: `trade-${trades.length + 1}`,
        entryTime: activePosition.entryTime,
        exitTime: candle.time,
        side: 'LONG',
        entryPrice: activePosition.entryPrice,
        exitPrice,
        amount: activePosition.amount,
        pnl: netPnl,
        pnlPercent,
        reason: 'Sell / Trend Reversal Signal',
      });

      activePosition = null;
    }

    // Handle Active Short Position Exit (or flip)
    if (!activePosition && buySignal) {
      // Open Long
      const tradeSize = currentCapital * ((params.tradeSizePercent || 50) / 100);
      const executionPrice = candle.close * slippageMultiplier;
      const fee = tradeSize * feeRate;
      const effectiveCapital = tradeSize - fee;
      const amount = effectiveCapital / executionPrice;

      if (amount > 0 && effectiveCapital > 50) {
        currentCapital -= tradeSize;
        activePosition = {
          side: 'LONG',
          entryPrice: executionPrice,
          amount,
          entryTime: candle.time,
          cost: tradeSize,
        };
      }
    }

    // Update Mark-to-market Equity
    let currentEquity = currentCapital;
    if (activePosition) {
      const mtmGross = (candle.close - activePosition.entryPrice) * activePosition.amount;
      currentEquity += activePosition.cost + mtmGross;
    }

    if (currentEquity > peakCapital) {
      peakCapital = currentEquity;
    }
    const currentDrawdown = ((peakCapital - currentEquity) / peakCapital) * 100;
    if (currentDrawdown > maxDrawdown) {
      maxDrawdown = currentDrawdown;
    }

    equityCurve.push({
      time: candle.time,
      equity: Math.round(currentEquity * 100) / 100,
    });
  }

  // Close any open position at the end of backtest period
  if (activePosition) {
    const lastCandle = candles[candles.length - 1];
    const exitPrice = lastCandle.close;
    const grossPnl = (exitPrice - activePosition.entryPrice) * activePosition.amount;
    const feeRate = (params.feePercent || 0.05) / 100;
    const fee = (activePosition.cost + exitPrice * activePosition.amount) * feeRate;
    const netPnl = grossPnl - fee;
    const pnlPercent = (netPnl / activePosition.cost) * 100;
    currentCapital += activePosition.cost + netPnl;
    returns.push(pnlPercent / 100);

    trades.push({
      id: `trade-${trades.length + 1}`,
      entryTime: activePosition.entryTime,
      exitTime: lastCandle.time,
      side: 'LONG',
      entryPrice: activePosition.entryPrice,
      exitPrice,
      amount: activePosition.amount,
      pnl: netPnl,
      pnlPercent,
      reason: 'Backtest Period Ended',
    });
  }

  const finalCapital = Math.round(currentCapital * 100) / 100;
  const netProfit = Math.round((finalCapital - initialCapital) * 100) / 100;
  const netProfitPercent = Math.round((netProfit / initialCapital) * 10000) / 100;

  const winningTrades = trades.filter((t) => t.pnl > 0).length;
  const losingTrades = trades.filter((t) => t.pnl <= 0).length;
  const winRate = trades.length > 0 ? Math.round((winningTrades / trades.length) * 10000) / 100 : 0;

  const totalGains = trades.filter((t) => t.pnl > 0).reduce((acc, t) => acc + t.pnl, 0);
  const totalLosses = Math.abs(trades.filter((t) => t.pnl < 0).reduce((acc, t) => acc + t.pnl, 0));
  const profitFactor = totalLosses > 0 ? Math.round((totalGains / totalLosses) * 100) / 100 : totalGains > 0 ? 99.9 : 1.0;

  // Calculate Sharpe Ratio (annualized proxy)
  let sharpeRatio = 0;
  if (returns.length > 2) {
    const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((acc, r) => acc + Math.pow(r - meanReturn, 2), 0) / (returns.length - 1);
    const stdDev = Math.sqrt(variance);
    if (stdDev > 0) {
      sharpeRatio = Math.round((meanReturn / stdDev) * Math.sqrt(365) * 100) / 100;
    }
  }

  return {
    initialCapital,
    finalCapital,
    netProfit,
    netProfitPercent,
    totalTrades: trades.length,
    winningTrades,
    losingTrades,
    winRate,
    profitFactor,
    maxDrawdown: Math.round(maxDrawdown * 100) / 100,
    sharpeRatio,
    equityCurve,
    trades,
  };
}
