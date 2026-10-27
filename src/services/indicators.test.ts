import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateSMA,
  calculateEMA,
  calculateRSI,
  calculateBollingerBands,
  calculateMACD,
  executePineScript,
} from './indicators';
import { Candle } from '../types';

test('calculateSMA computes correct moving average with null padding', () => {
  const data = [10, 20, 30, 40, 50];
  const sma3 = calculateSMA(data, 3);
  assert.equal(sma3.length, 5);
  assert.equal(sma3[0], null);
  assert.equal(sma3[1], null);
  assert.equal(sma3[2], 20); // (10+20+30)/3
  assert.equal(sma3[3], 30); // (20+30+40)/3
  assert.equal(sma3[4], 40); // (30+40+50)/3
});

test('calculateEMA responds faster than SMA and smooths series', () => {
  const data = [10, 10, 10, 20, 30, 40, 50];
  const ema3 = calculateEMA(data, 3);
  assert.equal(ema3[0], null);
  assert.equal(ema3[1], null);
  assert.equal(ema3[2], 10);
  assert.ok(ema3[3]! > 10);
});

test('calculateRSI scales between 0 and 100 correctly', () => {
  const closes = [
    44.34, 44.09, 44.15, 43.61, 44.33, 44.83, 45.10, 45.42, 45.84, 46.08,
    45.89, 46.03, 45.61, 46.28, 46.28, 46.00, 46.03, 46.41, 46.22, 45.64,
  ];
  const rsi = calculateRSI(closes, 14);
  const validValues = rsi.filter((v): v is number => v !== null);
  assert.ok(validValues.length > 0);
  for (const val of validValues) {
    assert.ok(val >= 0 && val <= 100);
  }
});

test('calculateBollingerBands returns upper, middle, and lower bands', () => {
  const data = [10, 12, 14, 16, 18, 20, 22, 24, 26, 28];
  const bb = calculateBollingerBands(data, 5, 2);
  assert.equal(bb.upper.length, 10);
  const mid = bb.middle[6]!;
  const up = bb.upper[6]!;
  const low = bb.lower[6]!;
  assert.ok(up > mid);
  assert.ok(low < mid);
});

test('calculateMACD returns macdLine, signalLine, and histogram', () => {
  const data = Array.from({ length: 40 }, (_, i) => 100 + Math.sin(i / 3) * 10);
  const macd = calculateMACD(data, 12, 26, 9);
  assert.equal(macd.macdLine.length, 40);
  assert.equal(macd.signalLine.length, 40);
  assert.equal(macd.histogram.length, 40);
});

test('executePineScript parses indicator declarations and plot directives', () => {
  const dummyCandles: Candle[] = Array.from({ length: 30 }, (_, i) => ({
    time: 1700000000 + i * 60,
    open: 100 + i,
    high: 105 + i,
    low: 95 + i,
    close: 102 + i,
    volume: 1000 + i * 50,
  }));

  const script = `
    indicator("Test Alpha", overlay=true)
    ma1 = sma(close, 5)
    plot(ma1, color="#22c55e", title="Fast SMA")
  `;

  const parsed = executePineScript(script, dummyCandles);
  assert.equal(parsed.title, 'Test Alpha');
  assert.equal(parsed.isOverlay, true);
  assert.equal(parsed.plots.length, 1);
  assert.equal(parsed.plots[0].name, 'Fast SMA');
  assert.equal(parsed.plots[0].values.length, 30);
});
