export interface Candle {
  time: number; // Unix timestamp in seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type OrderSide = 'BUY' | 'SELL';
export type OrderType = 'LIMIT' | 'MARKET' | 'STOP_LIMIT';
export type OrderStatus = 'OPEN' | 'FILLED' | 'CANCELLED';

export interface Order {
  id: string;
  symbol: string;
  side: OrderSide;
  type: OrderType;
  price: number;
  stopPrice?: number;
  amount: number;
  filled: number;
  status: OrderStatus;
  createdAt: number;
  pnl?: number;
}

export interface Position {
  id: string;
  symbol: string;
  side: 'LONG' | 'SHORT';
  entryPrice: number;
  amount: number;
  leverage: number;
  markPrice: number;
  pnl: number;
  pnlPercent: number;
  liquidationPrice: number;
  openedAt: number;
}

export interface IndicatorConfig {
  id: string;
  name: string;
  type: 'SMA' | 'EMA' | 'RSI' | 'MACD' | 'BB' | 'PINE_CUSTOM' | 'SENTIMENT';
  color: string;
  visible: boolean;
  params: Record<string, number | string>;
  script?: string;
  values?: (number | null)[];
  secondaryValues?: Record<string, (number | null)[]>; // For MACD signal/hist, BB upper/lower
}

export interface SentimentItem {
  id: string;
  source: 'REDDIT' | 'TWITTER' | 'NEWS';
  author: string;
  title: string;
  content: string;
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  score: number; // -1.0 to +1.0
  timestamp: number;
  symbol: string;
}

export interface SentimentSignalPoint {
  time: number;
  score: number; // -100 to +100
  signal: 'STRONG_BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG_SELL';
  commentary: string;
  priceAtTime: number;
}

export interface BacktestTrade {
  id: string;
  entryTime: number;
  exitTime: number;
  side: 'LONG' | 'SHORT';
  entryPrice: number;
  exitPrice: number;
  amount: number;
  pnl: number;
  pnlPercent: number;
  reason: string;
}

export interface BacktestMetrics {
  initialCapital: number;
  finalCapital: number;
  netProfit: number;
  netProfitPercent: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number; // 0 to 100
  profitFactor: number;
  maxDrawdown: number; // 0 to 100
  sharpeRatio: number;
  equityCurve: { time: number; equity: number }[];
  trades: BacktestTrade[];
}

export interface UserSession {
  token: string;
  username: string;
  email: string;
  role: 'ADMIN' | 'PRO_TRADER' | 'TRADER';
  isAuthenticated: boolean;
}

export interface RealtimeNotification {
  id: string;
  time: number;
  type: 'ORDER_FILLED' | 'STOP_TRIGGERED' | 'AI_SIGNAL' | 'PINE_ALERT' | 'SYSTEM';
  title: string;
  message: string;
  level: 'info' | 'success' | 'warning' | 'error';
}
