import test from 'node:test';
import assert from 'node:assert/strict';
import { runBacktest } from './backtest';
import { Candle } from '../types';

test('runBacktest calculates equity curve, win rate and returns for simulated data', () => {
  // Generate oscillating trend candles
  const candles: Candle[] = [];
  let price = 50000;
  for (let i = 0; i < 100; i++) {
    const change = Math.sin(i / 5) * 800 + 50;
    price += change;
    candles.push({
      time: 1700000000 + i * 3600,
      open: price - 50,
      high: price + 100,
      low: price - 100,
      close: price,
      volume: 500 + i * 10,
    });
  }

  const result = runBacktest(candles, {
    strategyName: 'EMA Golden Cross',
    initialCapital: 10000,
    tradeSizePercent: 50,
    feePercent: 0.05,
    slippagePercent: 0.02,
    fastPeriod: 9,
    slowPeriod: 21,
  });

  assert.equal(result.initialCapital, 10000);
  assert.ok(result.equityCurve.length > 0);
  assert.ok(result.maxDrawdown >= 0);
  assert.ok(typeof result.winRate === 'number');
  assert.ok(typeof result.profitFactor === 'number');
  assert.ok(typeof result.sharpeRatio === 'number');
});
