import { Candle, SentimentSignalPoint } from '../types';

/**
 * Calculates Simple Moving Average (SMA)
 */
export function calculateSMA(data: number[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(null);
      continue;
    }
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += data[i - j];
    }
    result.push(sum / period);
  }
  return result;
}

/**
 * Calculates Exponential Moving Average (EMA)
 */
export function calculateEMA(data: number[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  if (data.length === 0) return result;

  const multiplier = 2 / (period + 1);
  let prevEMA: number | null = null;

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(null);
      continue;
    }

    if (prevEMA === null) {
      // First EMA value is SMA of first 'period' elements
      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += data[i - j];
      }
      prevEMA = sum / period;
      result.push(prevEMA);
    } else {
      const currentEMA = (data[i] - prevEMA) * multiplier + prevEMA;
      result.push(currentEMA);
      prevEMA = currentEMA;
    }
  }
  return result;
}

/**
 * Calculates Relative Strength Index (RSI)
 */
export function calculateRSI(closes: number[], period: number = 14): (number | null)[] {
  const result: (number | null)[] = [];
  if (closes.length < period + 1) {
    return closes.map(() => null);
  }

  const gains: number[] = [];
  const losses: number[] = [];

  for (let i = 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    gains.push(diff >= 0 ? diff : 0);
    losses.push(diff < 0 ? -diff : 0);
  }

  result.push(null); // for index 0 (no diff)

  let avgGain = 0;
  let avgLoss = 0;

  for (let i = 0; i < period; i++) {
    avgGain += gains[i];
    avgLoss += losses[i];
    result.push(null);
  }

  avgGain /= period;
  avgLoss /= period;

  let rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  let rsi = 100 - (100 / (1 + rs));
  result[period] = Math.max(0, Math.min(100, rsi));

  for (let i = period; i < gains.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i]) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i]) / period;

    rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    rsi = 100 - (100 / (1 + rs));
    result.push(Math.max(0, Math.min(100, rsi)));
  }

  return result;
}

/**
 * Calculates Bollinger Bands (BB)
 */
export function calculateBollingerBands(
  closes: number[],
  period: number = 20,
  stdDevMultiplier: number = 2
): {
  middle: (number | null)[];
  upper: (number | null)[];
  lower: (number | null)[];
} {
  const middle = calculateSMA(closes, period);
  const upper: (number | null)[] = [];
  const lower: (number | null)[] = [];

  for (let i = 0; i < closes.length; i++) {
    const mid = middle[i];
    if (mid === null || i < period - 1) {
      upper.push(null);
      lower.push(null);
      continue;
    }

    let varianceSum = 0;
    for (let j = 0; j < period; j++) {
      varianceSum += Math.pow(closes[i - j] - mid, 2);
    }
    const stdDev = Math.sqrt(varianceSum / period);
    upper.push(mid + stdDev * stdDevMultiplier);
    lower.push(mid - stdDev * stdDevMultiplier);
  }

  return { middle, upper, lower };
}

/**
 * Calculates MACD (12, 26, 9)
 */
export function calculateMACD(
  closes: number[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): {
  macdLine: (number | null)[];
  signalLine: (number | null)[];
  histogram: (number | null)[];
} {
  const fastEMA = calculateEMA(closes, fastPeriod);
  const slowEMA = calculateEMA(closes, slowPeriod);

  const macdLine: (number | null)[] = [];
  const validMacdValues: number[] = [];
  const validIndices: number[] = [];

  for (let i = 0; i < closes.length; i++) {
    const f = fastEMA[i];
    const s = slowEMA[i];
    if (f !== null && s !== null) {
      const val = f - s;
      macdLine.push(val);
      validMacdValues.push(val);
      validIndices.push(i);
    } else {
      macdLine.push(null);
    }
  }

  const signalLine: (number | null)[] = closes.map(() => null);
  const histogram: (number | null)[] = closes.map(() => null);

  if (validMacdValues.length >= signalPeriod) {
    const calculatedSignal = calculateEMA(validMacdValues, signalPeriod);
    for (let j = 0; j < calculatedSignal.length; j++) {
      const originalIdx = validIndices[j];
      const sig = calculatedSignal[j];
      signalLine[originalIdx] = sig;
      if (sig !== null && macdLine[originalIdx] !== null) {
        histogram[originalIdx] = (macdLine[originalIdx] as number) - sig;
      }
    }
  }

  return { macdLine, signalLine, histogram };
}

/**
 * Maps Sentiment Signals onto candlestick bars
 */
export function mapSentimentToCandles(
  candles: Candle[],
  signals: SentimentSignalPoint[]
): {
  sentimentScores: (number | null)[];
  sentimentSignals: (string | null)[];
} {
  const sentimentScores: (number | null)[] = candles.map(() => null);
  const sentimentSignals: (string | null)[] = candles.map(() => null);

  if (candles.length === 0 || signals.length === 0) {
    return { sentimentScores, sentimentSignals };
  }

  signals.forEach((sig) => {
    // Find closest candle by timestamp
    let closestIdx = 0;
    let minDiff = Infinity;
    for (let i = 0; i < candles.length; i++) {
      const diff = Math.abs(candles[i].time - sig.time);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = i;
      }
    }
    sentimentScores[closestIdx] = sig.score;
    sentimentSignals[closestIdx] = sig.signal;
  });

  return { sentimentScores, sentimentSignals };
}

/**
 * Pine Script mini-interpreter
 * Allows executing custom Pine script definitions like:
 * indicator("My Alpha", overlay=true)
 * fast = sma(close, 14)
 * slow = sma(close, 50)
 * plot(fast, color="green")
 * plot(slow, color="red")
 */
export interface PineParsedOutput {
  title: string;
  isOverlay: boolean;
  plots: {
    name: string;
    color: string;
    values: (number | null)[];
    type: 'line' | 'histogram' | 'signal';
  }[];
  signals?: {
    index: number;
    type: 'BUY' | 'SELL';
    price: number;
    label: string;
  }[];
}

export function executePineScript(script: string, candles: Candle[]): PineParsedOutput {
  const closes = candles.map((c) => c.close);
  const highs = candles.map((c) => c.high);
  const lows = candles.map((c) => c.low);

  const lines = script.split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('//'));
  const plots: PineParsedOutput['plots'] = [];
  const signals: PineParsedOutput['signals'] = [];
  let isOverlay = true;
  let title = 'Pine Indicator';

  const variables: Record<string, (number | null)[]> = {
    close: closes,
    high: highs,
    low: lows,
  };

  lines.forEach((line) => {
    // Indicator declaration: indicator("Name", overlay=true/false)
    if (line.startsWith('indicator(')) {
      const titleMatch = line.match(/indicator\s*\(\s*["']([^"']+)["']/);
      if (titleMatch) title = titleMatch[1];
      if (line.includes('overlay=false')) isOverlay = false;
      return;
    }

    // Variable assignment: name = sma(close, 20) or ema(close, 50) or rsi(close, 14)
    const assignMatch = line.match(/^([a-zA-Z0-9_]+)\s*=\s*(.+)$/);
    if (assignMatch) {
      const varName = assignMatch[1];
      const expr = assignMatch[2];

      const smaMatch = expr.match(/sma\s*\(\s*([a-zA-Z0-9_]+)\s*,\s*(\d+)\s*\)/);
      if (smaMatch) {
        const period = parseInt(smaMatch[2], 10);
        variables[varName] = calculateSMA(closes, period);
        return;
      }

      const emaMatch = expr.match(/ema\s*\(\s*([a-zA-Z0-9_]+)\s*,\s*(\d+)\s*\)/);
      if (emaMatch) {
        const period = parseInt(emaMatch[2], 10);
        variables[varName] = calculateEMA(closes, period);
        return;
      }

      const rsiMatch = expr.match(/rsi\s*\(\s*([a-zA-Z0-9_]+)\s*,\s*(\d+)\s*\)/);
      if (rsiMatch) {
        const period = parseInt(rsiMatch[2], 10);
        variables[varName] = calculateRSI(closes, period);
        isOverlay = false;
        return;
      }
    }

    // plot(variable, color="blue", title="SMA")
    const plotMatch = line.match(/plot\s*\(\s*([a-zA-Z0-9_]+)(.*)\)/);
    if (plotMatch) {
      const sourceVar = plotMatch[1];
      const optionsStr = plotMatch[2];

      const colorMatch = optionsStr.match(/color\s*=\s*["']([^"']+)["']/);
      const color = colorMatch ? colorMatch[1] : '#3b82f6';

      const titleOptMatch = optionsStr.match(/title\s*=\s*["']([^"']+)["']/);
      const plotTitle = titleOptMatch ? titleOptMatch[1] : sourceVar;

      const data = variables[sourceVar] || calculateSMA(closes, 20);
      plots.push({
        name: plotTitle,
        color,
        values: data,
        type: 'line',
      });
    }

    // strategy.entry check: crossover / crossunder
    if (line.includes('strategy.entry')) {
      // Find crossover points
      const fast = variables['fast'] || variables['ema1'] || variables['ma1'];
      const slow = variables['slow'] || variables['ema2'] || variables['ma2'];
      if (fast && slow) {
        for (let i = 1; i < candles.length; i++) {
          const fPrev = fast[i - 1];
          const fCurr = fast[i];
          const sPrev = slow[i - 1];
          const sCurr = slow[i];

          if (fPrev !== null && fCurr !== null && sPrev !== null && sCurr !== null) {
            // Golden cross: fast crosses above slow
            if (fPrev <= sPrev && fCurr > sCurr) {
              signals.push({
                index: i,
                type: 'BUY',
                price: candles[i].close,
                label: 'Pine Long Entry',
              });
            }
            // Death cross: fast crosses below slow
            else if (fPrev >= sPrev && fCurr < sCurr) {
              signals.push({
                index: i,
                type: 'SELL',
                price: candles[i].close,
                label: 'Pine Short/Exit',
              });
            }
          }
        }
      }
    }
  });

  // Default fallback if no plots parsed
  if (plots.length === 0) {
    plots.push({
      name: 'Default SMA 20',
      color: '#10b981',
      values: calculateSMA(closes, 20),
      type: 'line',
    });
  }

  return { title, isOverlay, plots, signals };
}
