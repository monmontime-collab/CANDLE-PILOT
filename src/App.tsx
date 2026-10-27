import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Candle,
  Position,
  Order,
  OrderSide,
  OrderType,
  IndicatorConfig,
  SentimentItem,
  SentimentSignalPoint,
  UserSession,
  RealtimeNotification,
} from './types';
import {
  SUPPORTED_SYMBOLS,
  fetchBinanceKlines,
  generateOrderBook,
  OrderBookData,
  PublicTrade,
} from './services/binance';
import {
  calculateSMA,
  calculateEMA,
  calculateRSI,
  calculateBollingerBands,
  executePineScript,
} from './services/indicators';
import { INITIAL_SENTIMENT_FEED } from './services/sentiment';
import { Header } from './components/Header';
import { CandlestickChart } from './components/CandlestickChart';
import { TradingViewWidget } from './components/TradingViewWidget';
import { BarReplayBar } from './components/BarReplayBar';
import { OrderBookPanel } from './components/OrderBookPanel';
import { OrderEntryPanel } from './components/OrderEntryPanel';
import { PositionsOrdersTable } from './components/PositionsOrdersTable';
import { PineEditorModal } from './components/PineEditorModal';
import { BacktestModal } from './components/BacktestModal';
import { SentimentLLMModal } from './components/SentimentLLMModal';
import { DevOpsModal } from './components/DevOpsModal';
import { AuthModal } from './components/AuthModal';
import { NotificationToast } from './components/NotificationToast';

export default function App() {
  // Market & Data States
  const [currentSymbol, setCurrentSymbol] = useState<string>('BTCUSDT');
  const [timeframe, setTimeframe] = useState<string>('15m');
  const [candles, setCandles] = useState<Candle[]>([]);
  const [tickerPrice, setTickerPrice] = useState<number>(67800);
  const [orderBook, setOrderBook] = useState<OrderBookData>({ bids: [], asks: [] });
  const [recentTrades, setRecentTrades] = useState<PublicTrade[]>([]);
  const [isWsConnected, setIsWsConnected] = useState<boolean>(true);
  const [latencyMs, setLatencyMs] = useState<number>(14);
  const [chartMode, setChartMode] = useState<'canvas' | 'tradingview'>('canvas');

  // Indicators & Pine Script Engine
  const [indicators, setIndicators] = useState<IndicatorConfig[]>([]);
  const [showSentimentOverlay, setShowSentimentOverlay] = useState<boolean>(true);

  // Sentiment & LLM Data
  const [sentimentItems, setSentimentItems] = useState<SentimentItem[]>(INITIAL_SENTIMENT_FEED);
  const [sentimentSignals, setSentimentSignals] = useState<SentimentSignalPoint[]>([]);

  // Bar Replay State
  const [isReplayActive, setIsReplayActive] = useState<boolean>(false);
  const [replayIndex, setReplayIndex] = useState<number | null>(null);
  const [isReplayPlaying, setIsReplayPlaying] = useState<boolean>(false);
  const [replaySpeed, setReplaySpeed] = useState<number>(1);

  // Trading, Orders & Positions
  const [availableBalance, setAvailableBalance] = useState<number>(25000);
  const [positions, setPositions] = useState<Position[]>([
    {
      id: 'pos-1',
      symbol: 'BTCUSDT',
      side: 'LONG',
      entryPrice: 67250,
      amount: 0.15,
      leverage: 10,
      markPrice: 67800,
      pnl: 82.5,
      pnlPercent: 8.18,
      liquidationPrice: 61100,
      openedAt: Date.now() - 3600 * 1000 * 4,
    },
  ]);
  const [orders, setOrders] = useState<Order[]>([
    {
      id: 'ord-1',
      symbol: 'BTCUSDT',
      side: 'BUY',
      type: 'LIMIT',
      price: 66500,
      amount: 0.25,
      filled: 0,
      status: 'OPEN',
      createdAt: Date.now() - 1800 * 1000,
    },
  ]);
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([
    {
      id: 'notif-1',
      time: Date.now() - 60000,
      type: 'SYSTEM',
      title: 'Go Mikroservis Ağı Hazır',
      message: 'Binance canlı WebSocket bağlantısı ve GORM veritabanı senkronize edildi.',
      level: 'info',
    },
  ]);

  // Auth User Session (JWT)
  const [userSession, setUserSession] = useState<UserSession>({
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMDQ5MiIsInVzZXJuYW1lIjoiQWxnb1RyYWRlcl9Qcm8iLCJyb2xlIjoiUFJPX1RSQURFUiJ9.demo_signature',
    username: 'AlgoTrader_Pro',
    email: 'trader@cryptopulse.io',
    role: 'PRO_TRADER',
    isAuthenticated: true,
  });

  // Modals Visibility
  const [isPineEditorOpen, setIsPineEditorOpen] = useState<boolean>(false);
  const [isBacktestOpen, setIsBacktestOpen] = useState<boolean>(false);
  const [isSentimentLLMOpen, setIsSentimentLLMOpen] = useState<boolean>(false);
  const [isDevOpsOpen, setIsDevOpsOpen] = useState<boolean>(false);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);

  // Helper to append notification
  const addNotification = useCallback((n: Omit<RealtimeNotification, 'id' | 'time'>) => {
    const newNotif: RealtimeNotification = {
      ...n,
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      time: Date.now(),
    };
    setNotifications((prev) => [newNotif, ...prev.slice(0, 49)]);
  }, []);

  // 1. Initial Load of Candles & Market Data
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      const data = await fetchBinanceKlines(currentSymbol, timeframe, 160);
      if (!isMounted || data.length === 0) return;

      setCandles(data);
      const lastPrice = data[data.length - 1].close;
      setTickerPrice(lastPrice);
      setOrderBook(generateOrderBook(lastPrice));

      // Recompute standard indicators
      const closes = data.map((c) => c.close);
      const defaultIndicators: IndicatorConfig[] = [
        {
          id: 'ind-sma-20',
          name: 'SMA (20)',
          type: 'SMA',
          color: '#22c55e',
          visible: true,
          params: { period: 20 },
          values: calculateSMA(closes, 20),
        },
        {
          id: 'ind-ema-50',
          name: 'EMA (50)',
          type: 'EMA',
          color: '#3b82f6',
          visible: true,
          params: { period: 50 },
          values: calculateEMA(closes, 50),
        },
        {
          id: 'ind-rsi-14',
          name: 'RSI (14)',
          type: 'RSI',
          color: '#a855f7',
          visible: true,
          params: { period: 14 },
          values: calculateRSI(closes, 14),
        },
        {
          id: 'ind-bb-20',
          name: 'Bollinger Bands (20, 2)',
          type: 'BB',
          color: '#f59e0b',
          visible: true,
          params: { period: 20, mult: 2 },
          values: calculateBollingerBands(closes, 20, 2).middle,
          secondaryValues: {
            upper: calculateBollingerBands(closes, 20, 2).upper,
            lower: calculateBollingerBands(closes, 20, 2).lower,
          },
        },
      ];
      setIndicators(defaultIndicators);

      // Generate sentiment signal points on candle timeline
      const samplePoints: SentimentSignalPoint[] = [
        {
          time: data[Math.max(0, data.length - 35)].time,
          score: 82,
          signal: 'STRONG_BUY',
          commentary: 'Reddit ETF net inflow breakout & Whale Accumulation',
          priceAtTime: data[Math.max(0, data.length - 35)].close,
        },
        {
          time: data[Math.max(0, data.length - 12)].time,
          score: 75,
          signal: 'BUY',
          commentary: 'Twitter Sentiment Spike + 50 EMA Support Bounce',
          priceAtTime: data[Math.max(0, data.length - 12)].close,
        },
      ];
      setSentimentSignals(samplePoints);
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [currentSymbol, timeframe]);

  // 2. Real-time Live Ticker Tick Generator / WebSocket Simulation
  useEffect(() => {
    if (isReplayActive || isPineEditorOpen || isBacktestOpen || isSentimentLLMOpen || isDevOpsOpen || isAuthOpen) return;

    const interval = setInterval(() => {
      // Simulate low-latency price fluctuation
      const deltaPercent = (Math.random() - 0.495) * 0.0018;
      setTickerPrice((prev) => {
        const nextPrice = Math.round((prev * (1 + deltaPercent)) * 100) / 100;

        // Update candle array in real time
        setCandles((cList) => {
          if (cList.length === 0) return cList;
          const updated = [...cList];
          const lastCandle = { ...updated[updated.length - 1] };
          lastCandle.close = nextPrice;
          if (nextPrice > lastCandle.high) lastCandle.high = nextPrice;
          if (nextPrice < lastCandle.low) lastCandle.low = nextPrice;
          lastCandle.volume += Math.round(Math.random() * 5 + 1);
          updated[updated.length - 1] = lastCandle;
          return updated;
        });

        // Update Order Book & Trades
        setOrderBook(generateOrderBook(nextPrice));

        // Add public trade
        const isBuy = Math.random() > 0.48;
        const newTrade: PublicTrade = {
          id: `t-${Date.now()}`,
          time: Date.now(),
          price: nextPrice,
          amount: +(Math.random() * 1.5 + 0.05).toFixed(3),
          side: isBuy ? 'BUY' : 'SELL',
        };
        setRecentTrades((prev) => [newTrade, ...prev.slice(0, 30)]);

        // Update Open Positions Mark Price & PnL
        setPositions((posList) =>
          posList.map((pos) => {
            const priceDiff = pos.side === 'LONG' ? nextPrice - pos.entryPrice : pos.entryPrice - nextPrice;
            const grossPnl = priceDiff * pos.amount;
            const cost = (pos.entryPrice * pos.amount) / pos.leverage;
            const pnlPercent = (grossPnl / cost) * 100;
            return {
              ...pos,
              markPrice: nextPrice,
              pnl: Math.round(grossPnl * 100) / 100,
              pnlPercent: Math.round(pnlPercent * 100) / 100,
            };
          })
        );

        // Check if any open limit order triggered
        setOrders((orderList) =>
          orderList.map((ord) => {
            if (ord.status === 'OPEN') {
              if (
                (ord.side === 'BUY' && nextPrice <= ord.price) ||
                (ord.side === 'SELL' && nextPrice >= ord.price)
              ) {
                addNotification({
                  type: 'ORDER_FILLED',
                  title: 'Limit Emri Gerçekleşti',
                  message: `${ord.symbol} ${ord.side} emri $${ord.price} seviyesinden eşleşti.`,
                  level: 'success',
                });
                return { ...ord, status: 'FILLED', filled: ord.amount };
              }
            }
            return ord;
          })
        );

        return nextPrice;
      });

      // Fluctuate latency jitter (10ms - 22ms)
      setLatencyMs(Math.floor(Math.random() * 12 + 10));
    }, 1200);

    return () => clearInterval(interval);
  }, [isReplayActive, addNotification]);

  // 3. Bar Replay Simulation Engine
  const handleToggleReplay = () => {
    if (isReplayActive) {
      // Exit replay mode
      setIsReplayActive(false);
      setReplayIndex(null);
      setIsReplayPlaying(false);
      addNotification({
        type: 'SYSTEM',
        title: 'Canlı Piyasa Akışına Dönüldü',
        message: 'Bar replay simülasyonu sonlandırıldı, anlık Binance akışı aktif.',
        level: 'info',
      });
    } else {
      // Enter replay mode at bar 60
      const initialIdx = Math.max(30, candles.length - 50);
      setIsReplayActive(true);
      setReplayIndex(initialIdx);
      setIsReplayPlaying(false);
      if (candles[initialIdx]) {
        setTickerPrice(candles[initialIdx].close);
      }
      addNotification({
        type: 'SYSTEM',
        title: 'Bar Replay Modu Aktif',
        message: 'Grafik geçmişe sarıldı. Mumları adım adım oynatıp simüle işlem yapabilirsiniz.',
        level: 'warning',
      });
    }
  };

  const handleStepForwardReplay = useCallback(() => {
    if (replayIndex === null || replayIndex >= candles.length - 1) return;
    const nextIdx = replayIndex + 1;
    setReplayIndex(nextIdx);
    const activeCandle = candles[nextIdx];
    if (activeCandle) {
      setTickerPrice(activeCandle.close);
      setOrderBook(generateOrderBook(activeCandle.close));
    }
  }, [replayIndex, candles]);

  // Replay playback timer
  useEffect(() => {
    if (!isReplayActive || !isReplayPlaying || replayIndex === null) return;

    const timer = setInterval(() => {
      setReplayIndex((prev) => {
        if (prev === null || prev >= candles.length - 1) {
          setIsReplayPlaying(false);
          return prev;
        }
        const next = prev + 1;
        if (candles[next]) {
          setTickerPrice(candles[next].close);
          setOrderBook(generateOrderBook(candles[next].close));
        }
        return next;
      });
    }, Math.max(100, 1000 / replaySpeed));

    return () => clearInterval(timer);
  }, [isReplayActive, isReplayPlaying, replaySpeed, candles]);

  // 4. Order Execution Handler
  const handlePlaceOrder = (newOrderReq: {
    side: OrderSide;
    type: OrderType;
    price: number;
    amount: number;
    leverage: number;
  }) => {
    const isMarket = newOrderReq.type === 'MARKET';
    const execPrice = isMarket ? tickerPrice : newOrderReq.price;
    const cost = (execPrice * newOrderReq.amount) / newOrderReq.leverage;

    if (cost > availableBalance) {
      addNotification({
        type: 'SYSTEM',
        title: 'Yetersiz Teminat',
        message: `Gereken marjin ($${cost.toFixed(2)}) kullanılabilir bakiyenizden ($${availableBalance.toFixed(2)}) fazla.`,
        level: 'error',
      });
      return;
    }

    setAvailableBalance((b) => b - cost);

    if (isMarket) {
      // Execute immediately into open position
      const newPos: Position = {
        id: `pos-${Date.now()}`,
        symbol: currentSymbol,
        side: newOrderReq.side === 'BUY' ? 'LONG' : 'SHORT',
        entryPrice: execPrice,
        amount: newOrderReq.amount,
        leverage: newOrderReq.leverage,
        markPrice: execPrice,
        pnl: 0,
        pnlPercent: 0,
        liquidationPrice:
          newOrderReq.side === 'BUY'
            ? execPrice * (1 - 0.9 / newOrderReq.leverage)
            : execPrice * (1 + 0.9 / newOrderReq.leverage),
        openedAt: Date.now(),
      };

      setPositions((prev) => [newPos, ...prev]);
      addNotification({
        type: 'ORDER_FILLED',
        title: `${newOrderReq.side === 'BUY' ? 'LONG' : 'SHORT'} Pozisyon Açıldı`,
        message: `${currentSymbol} ${newOrderReq.amount} adet @ $${execPrice} (${newOrderReq.leverage}x Kaldıraç)`,
        level: 'success',
      });
    } else {
      // Create Pending Limit / Stop Order
      const newOrder: Order = {
        id: `ord-${Date.now()}`,
        symbol: currentSymbol,
        side: newOrderReq.side,
        type: newOrderReq.type,
        price: newOrderReq.price,
        amount: newOrderReq.amount,
        filled: 0,
        status: 'OPEN',
        createdAt: Date.now(),
      };
      setOrders((prev) => [newOrder, ...prev]);
      addNotification({
        type: 'ORDER_FILLED',
        title: `${newOrderReq.type} Emri İletildi`,
        message: `${newOrderReq.side} ${newOrderReq.amount} ${currentSymbol} @ $${newOrderReq.price}`,
        level: 'info',
      });
    }
  };

  // Close Position Action
  const handleClosePosition = (positionId: string) => {
    const pos = positions.find((p) => p.id === positionId);
    if (!pos) return;

    const cost = (pos.entryPrice * pos.amount) / pos.leverage;
    const returnAmount = cost + pos.pnl;
    setAvailableBalance((b) => Math.max(0, b + returnAmount));
    setPositions((prev) => prev.filter((p) => p.id !== positionId));

    // Add to past orders
    const historyOrder: Order = {
      id: `close-${Date.now()}`,
      symbol: pos.symbol,
      side: pos.side === 'LONG' ? 'SELL' : 'BUY',
      type: 'MARKET',
      price: pos.markPrice,
      amount: pos.amount,
      filled: pos.amount,
      status: 'FILLED',
      createdAt: Date.now(),
      pnl: pos.pnl,
    };
    setOrders((prev) => [historyOrder, ...prev]);

    addNotification({
      type: 'ORDER_FILLED',
      title: 'Pozisyon Kapatıldı',
      message: `${pos.symbol} pozisyonu ${pos.pnl >= 0 ? '+' : ''}$${pos.pnl.toFixed(2)} K/Z ile sonlandırıldı.`,
      level: pos.pnl >= 0 ? 'success' : 'warning',
    });
  };

  // Cancel Pending Order
  const handleCancelOrder = (orderId: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: 'CANCELLED' } : o))
    );
    addNotification({
      type: 'ORDER_FILLED',
      title: 'Emir İptal Edildi',
      message: `Emir #${orderId} kullanıcı tarafından iptal edildi.`,
      level: 'info',
    });
  };

  // 5. Pine Script Indicator Compiler Handler
  const handleAddIndicatorFromPine = (script: string) => {
    const parsed = executePineScript(script, candles);
    parsed.plots.forEach((plot, i) => {
      const newInd: IndicatorConfig = {
        id: `pine-${Date.now()}-${i}`,
        name: plot.name,
        type: 'PINE_CUSTOM',
        color: plot.color,
        visible: true,
        params: {},
        script,
        values: plot.values,
      };
      setIndicators((prev) => [...prev, newInd]);
    });

    addNotification({
      type: 'PINE_ALERT',
      title: 'Pine Script Göstergesi Derlendi',
      message: `"${parsed.title}" grafiğe başarıyla eklendi.`,
      level: 'success',
    });
  };

  const handleToggleIndicator = (id: string) => {
    setIndicators((prev) =>
      prev.map((ind) => (ind.id === id ? { ...ind, visible: !ind.visible } : ind))
    );
  };

  const handleRemoveIndicator = (id: string) => {
    setIndicators((prev) => prev.filter((ind) => ind.id !== id));
  };

  // Ticker summary data
  const high24h = Math.round(tickerPrice * 1.042 * 100) / 100;
  const low24h = Math.round(tickerPrice * 0.965 * 100) / 100;
  const volume24h = Math.round(tickerPrice * 18.5);

  const tickerData = {
    symbol: currentSymbol,
    price: tickerPrice,
    change24h: 1420.5,
    change24hPercent: 2.14,
    high24h,
    low24h,
    volume24h,
  };

  const currentBarDate =
    replayIndex !== null && candles[replayIndex]
      ? new Date(candles[replayIndex].time * 1000).toLocaleString()
      : undefined;

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0c0e14] text-[#d1d4dc] font-sans overflow-hidden">
      {/* 1. Header Toolbar */}
      <Header
        currentSymbol={currentSymbol}
        onSelectSymbol={setCurrentSymbol}
        ticker={tickerData}
        latencyMs={latencyMs}
        isWsConnected={isWsConnected}
        isReplayActive={isReplayActive}
        onToggleReplay={handleToggleReplay}
        onOpenPineEditor={() => setIsPineEditorOpen(true)}
        onOpenBacktest={() => setIsBacktestOpen(true)}
        onOpenSentimentLLM={() => setIsSentimentLLMOpen(true)}
        onOpenDevOps={() => setIsDevOpsOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        userSession={userSession}
        chartMode={chartMode}
        onToggleChartMode={() =>
          setChartMode((m) => (m === 'canvas' ? 'tradingview' : 'canvas'))
        }
      />

      {/* 2. Bar Replay Active Controller Bar */}
      {isReplayActive && (
        <BarReplayBar
          isPlaying={isReplayPlaying}
          onTogglePlay={() => setIsReplayPlaying((p) => !p)}
          onStepForward={handleStepForwardReplay}
          onReset={() => {
            setReplayIndex(30);
            setIsReplayPlaying(false);
          }}
          onExitReplay={handleToggleReplay}
          currentBarIndex={replayIndex ?? 0}
          totalBars={candles.length}
          speed={replaySpeed}
          onChangeSpeed={setReplaySpeed}
          currentBarDate={currentBarDate}
        />
      )}

      {/* 3. Main Center Workspace */}
      <div className="flex-1 flex flex-row overflow-hidden relative">
        {/* Left / Center Chart Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {chartMode === 'canvas' ? (
            <CandlestickChart
              candles={candles}
              symbol={currentSymbol}
              timeframe={timeframe}
              onTimeframeChange={setTimeframe}
              indicators={indicators}
              sentimentSignals={sentimentSignals}
              showSentimentOverlay={showSentimentOverlay}
              replayIndex={replayIndex}
            />
          ) : (
            <TradingViewWidget symbol={currentSymbol} />
          )}

          {/* Bottom Tabs: Positions, Orders, Stream */}
          <PositionsOrdersTable
            positions={positions}
            orders={orders}
            notifications={notifications}
            onClosePosition={handleClosePosition}
            onCancelOrder={handleCancelOrder}
          />
        </div>

        {/* Order Book Depth Panel */}
        <div className="hidden lg:flex">
          <OrderBookPanel
            orderBook={orderBook}
            trades={recentTrades}
            currentPrice={tickerPrice}
            onPriceClick={(p) => setTickerPrice(p)}
          />
        </div>

        {/* Order Execution Panel */}
        <div className="hidden sm:flex">
          <OrderEntryPanel
            currentPrice={tickerPrice}
            availableBalance={availableBalance}
            symbol={currentSymbol}
            onPlaceOrder={handlePlaceOrder}
          />
        </div>
      </div>

      {/* Real-time Toast Notifications */}
      <NotificationToast
        notifications={notifications}
        onDismiss={(id) =>
          setNotifications((prev) => prev.filter((n) => n.id !== id))
        }
      />

      {/* Modals */}
      <PineEditorModal
        isOpen={isPineEditorOpen}
        onClose={() => setIsPineEditorOpen(false)}
        onAddIndicatorFromScript={handleAddIndicatorFromPine}
        onSendToBacktest={(script, name) => {
          setIsBacktestOpen(true);
        }}
        indicators={indicators}
        onToggleIndicator={handleToggleIndicator}
        onRemoveIndicator={handleRemoveIndicator}
      />

      <BacktestModal
        isOpen={isBacktestOpen}
        onClose={() => setIsBacktestOpen(false)}
        candles={candles}
        sentimentSignals={sentimentSignals.map((s) => s.score)}
      />

      <SentimentLLMModal
        isOpen={isSentimentLLMOpen}
        onClose={() => setIsSentimentLLMOpen(false)}
        sentimentItems={sentimentItems}
        symbol={currentSymbol}
        currentPrice={tickerPrice}
        showSentimentOverlay={showSentimentOverlay}
        onToggleSentimentOverlay={() => setShowSentimentOverlay((p) => !p)}
      />

      <DevOpsModal
        isOpen={isDevOpsOpen}
        onClose={() => setIsDevOpsOpen(false)}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        userSession={userSession}
        onLogin={setUserSession}
        onLogout={() =>
          setUserSession({
            token: '',
            username: 'Misafir',
            email: '',
            role: 'TRADER',
            isAuthenticated: false,
          })
        }
      />
    </div>
  );
}
