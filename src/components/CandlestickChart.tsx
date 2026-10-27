import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Candle, IndicatorConfig, SentimentSignalPoint } from '../types';
import { ZoomIn, ZoomOut, RefreshCw, Layers, TrendingUp, Sparkles } from 'lucide-react';

interface CandlestickChartProps {
  candles: Candle[];
  symbol: string;
  timeframe: string;
  onTimeframeChange: (tf: string) => void;
  indicators: IndicatorConfig[];
  sentimentSignals: SentimentSignalPoint[];
  showSentimentOverlay: boolean;
  replayIndex: number | null; // null if live
  onBarClick?: (candleIndex: number) => void;
}

export const CandlestickChart: React.FC<CandlestickChartProps> = ({
  candles,
  symbol,
  timeframe,
  onTimeframeChange,
  indicators,
  sentimentSignals,
  showSentimentOverlay,
  replayIndex,
  onBarClick,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Visible window state for zooming & panning
  const [visibleCount, setVisibleCount] = useState<number>(70);
  const [offsetRight, setOffsetRight] = useState<number>(0);
  const [crosshair, setCrosshair] = useState<{ x: number; y: number; candle: Candle | null } | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStartX, setDragStartX] = useState<number>(0);
  const [dragStartOffset, setDragStartOffset] = useState<number>(0);
  const [subpaneType, setSubpaneType] = useState<'NONE' | 'RSI' | 'MACD'>('RSI');

  // Filter candles if replay is active
  const effectiveCandles = useMemo(() => {
    if (replayIndex !== null && replayIndex < candles.length) {
      return candles.slice(0, replayIndex + 1);
    }
    return candles;
  }, [candles, replayIndex]);

  // Compute slice to render
  const totalAvailable = effectiveCandles.length;
  const endIndex = Math.max(0, totalAvailable - offsetRight);
  const startIndex = Math.max(0, endIndex - visibleCount);
  const visibleCandles = effectiveCandles.slice(startIndex, endIndex);

  // Resize handler
  useEffect(() => {
    const handleResize = () => {
      if (!canvasRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvasRef.current.width = Math.floor(rect.width * dpr);
      canvasRef.current.height = Math.floor(rect.height * dpr);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Main Canvas Render Loop with requestAnimationFrame
  useEffect(() => {
    let animId: number;
    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas || visibleCandles.length === 0) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;
      if (width <= 0 || height <= 0) return;

    ctx.save();
    ctx.scale(dpr, dpr);

    // Dark sleek background
    ctx.fillStyle = '#131722';
    ctx.fillRect(0, 0, width, height);

    // Layout configuration
    const paddingRight = 65; // Price scale width
    const paddingBottom = 26; // Time scale height
    const subpaneHeight = subpaneType === 'NONE' ? 0 : Math.min(130, height * 0.25);
    const mainChartHeight = height - paddingBottom - subpaneHeight - 10;
    const mainChartWidth = width - paddingRight;

    // Determine min/max price for visible window
    let minPrice = Infinity;
    let maxPrice = -Infinity;
    let maxVolume = 0;

    visibleCandles.forEach((c) => {
      if (c.low < minPrice) minPrice = c.low;
      if (c.high > maxPrice) maxPrice = c.high;
      if (c.volume > maxVolume) maxVolume = c.volume;
    });

    // Add padding to price range
    const priceRange = maxPrice - minPrice || 1;
    const priceMargin = priceRange * 0.08;
    const renderMinPrice = minPrice - priceMargin;
    const renderMaxPrice = maxPrice + priceMargin;
    const renderPriceRange = renderMaxPrice - renderMinPrice;

    // Helper functions for coordinates
    const getX = (indexInSlice: number) => {
      const candleWidth = mainChartWidth / visibleCandles.length;
      return indexInSlice * candleWidth + candleWidth / 2;
    };

    const getY = (price: number) => {
      return mainChartHeight - ((price - renderMinPrice) / renderPriceRange) * mainChartHeight;
    };

    const candleWidth = Math.max(2, (mainChartWidth / visibleCandles.length) * 0.72);

    // 1. Grid Lines & Price scale
    ctx.strokeStyle = '#1e222d';
    ctx.lineWidth = 1;

    // Horizontal grid & price labels
    const priceStepCount = 6;
    for (let i = 0; i <= priceStepCount; i++) {
      const p = renderMinPrice + (renderPriceRange / priceStepCount) * i;
      const y = getY(p);

      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(mainChartWidth, y);
      ctx.stroke();

      // Right axis price label
      ctx.fillStyle = '#787b86';
      ctx.font = '10px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(p >= 100 ? p.toFixed(2) : p.toFixed(4), mainChartWidth + 6, y + 3);
    }

    // Vertical grid & time labels
    const timeStep = Math.max(1, Math.floor(visibleCandles.length / 7));
    for (let i = 0; i < visibleCandles.length; i += timeStep) {
      const x = getX(i);
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height - paddingBottom);
      ctx.stroke();

      const date = new Date(visibleCandles[i].time * 1000);
      const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      ctx.fillStyle = '#787b86';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(timeStr, x, height - 8);
    }

    // 2. Volume Histogram (at the bottom of main chart)
    const volumeMaxHeight = mainChartHeight * 0.22;
    visibleCandles.forEach((c, i) => {
      const x = getX(i);
      const volH = (c.volume / (maxVolume || 1)) * volumeMaxHeight;
      const isBull = c.close >= c.open;
      ctx.fillStyle = isBull ? 'rgba(34, 197, 94, 0.22)' : 'rgba(239, 68, 68, 0.22)';
      ctx.fillRect(x - candleWidth / 2, mainChartHeight - volH, candleWidth, volH);
    });

    // 3. Render Candlesticks
    visibleCandles.forEach((c, i) => {
      const x = getX(i);
      const isBull = c.close >= c.open;
      const color = isBull ? '#22c55e' : '#ef4444';

      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = 1.2;

      // Upper and lower wick
      const yHigh = getY(c.high);
      const yLow = getY(c.low);
      ctx.beginPath();
      ctx.moveTo(x, yHigh);
      ctx.lineTo(x, yLow);
      ctx.stroke();

      // Candle body
      const yOpen = getY(c.open);
      const yClose = getY(c.close);
      const bodyTop = Math.min(yOpen, yClose);
      const bodyHeight = Math.max(1.5, Math.abs(yClose - yOpen));

      ctx.fillRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight);
    });

    // 4. Render Active Overlay Indicators (SMA, EMA, Bollinger, Pine Scripts)
    indicators.forEach((ind) => {
      if (!ind.visible || !ind.values) return;

      // Extract values for visible window
      const fullSlice = ind.values.slice(startIndex, endIndex);

      ctx.strokeStyle = ind.color || '#3b82f6';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      let hasStarted = false;

      fullSlice.forEach((val, i) => {
        if (val === null || isNaN(val)) return;
        const x = getX(i);
        const y = getY(val);

        if (!hasStarted) {
          ctx.moveTo(x, y);
          hasStarted = true;
        } else {
          ctx.lineTo(x, y);
        }
      });
      if (hasStarted) ctx.stroke();

      // If Bollinger Bands, render upper & lower bands
      if (ind.type === 'BB' && ind.secondaryValues) {
        const upper = ind.secondaryValues['upper']?.slice(startIndex, endIndex);
        const lower = ind.secondaryValues['lower']?.slice(startIndex, endIndex);

        if (upper && lower) {
          ctx.strokeStyle = 'rgba(59, 130, 246, 0.45)';
          ctx.lineWidth = 1;

          // Upper
          ctx.beginPath();
          upper.forEach((val, i) => {
            if (val === null) return;
            const x = getX(i);
            const y = getY(val);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          });
          ctx.stroke();

          // Lower
          ctx.beginPath();
          lower.forEach((val, i) => {
            if (val === null) return;
            const x = getX(i);
            const y = getY(val);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          });
          ctx.stroke();
        }
      }
    });

    // 5. Render AI Sentiment Signals on Candlestick Chart (if enabled)
    if (showSentimentOverlay && sentimentSignals.length > 0) {
      visibleCandles.forEach((c, i) => {
        // Find if any sentiment signal matches candle timestamp closely
        const matchingSignal = sentimentSignals.find(
          (s) => Math.abs(s.time - c.time) < 60 * 30 // within 30 min window
        );

        if (matchingSignal) {
          const x = getX(i);
          const isBull = matchingSignal.score >= 0;
          const y = isBull ? getY(c.low) + 18 : getY(c.high) - 18;

          // Glow bubble
          ctx.fillStyle = isBull ? 'rgba(34, 197, 94, 0.9)' : 'rgba(239, 68, 68, 0.9)';
          ctx.beginPath();
          ctx.arc(x, y, 7, 0, Math.PI * 2);
          ctx.fill();

          // AI text icon
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 8px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('AI', x, y + 2.5);
        }
      });
    }

    // 6. Subpane Rendering (RSI / MACD)
    if (subpaneType !== 'NONE' && subpaneHeight > 0) {
      const subpaneTop = height - paddingBottom - subpaneHeight;

      // Divider line
      ctx.strokeStyle = '#2a2e39';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, subpaneTop);
      ctx.lineTo(width, subpaneTop);
      ctx.stroke();

      // Subpane title
      ctx.fillStyle = '#787b86';
      ctx.font = '10px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(subpaneType === 'RSI' ? 'RSI (14)' : 'MACD (12, 26, 9)', 10, subpaneTop + 14);

      if (subpaneType === 'RSI') {
        const rsiInd = indicators.find((ind) => ind.type === 'RSI');
        const rsiValues = rsiInd?.values?.slice(startIndex, endIndex);

        // 70 and 30 reference lines
        const y70 = subpaneTop + subpaneHeight * 0.3;
        const y30 = subpaneTop + subpaneHeight * 0.7;

        ctx.strokeStyle = 'rgba(239, 68, 68, 0.3)';
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(0, y70);
        ctx.lineTo(mainChartWidth, y70);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(34, 197, 94, 0.3)';
        ctx.beginPath();
        ctx.moveTo(0, y30);
        ctx.lineTo(mainChartWidth, y30);
        ctx.stroke();
        ctx.setLineDash([]);

        // RSI plot line
        if (rsiValues) {
          ctx.strokeStyle = '#a855f7';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          let rsiStarted = false;
          rsiValues.forEach((val, i) => {
            if (val === null) return;
            const x = getX(i);
            const y = subpaneTop + subpaneHeight - (val / 100) * subpaneHeight;
            if (!rsiStarted) {
              ctx.moveTo(x, y);
              rsiStarted = true;
            } else {
              ctx.lineTo(x, y);
            }
          });
          if (rsiStarted) ctx.stroke();
        }
      }
    }

    // 7. Replay Marker Line (if bar replay is currently active)
    if (replayIndex !== null) {
      const activeX = getX(visibleCandles.length - 1);
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.8;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(activeX, 0);
      ctx.lineTo(activeX, height - paddingBottom);
      ctx.stroke();
      ctx.setLineDash([]);

      // Badge
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(activeX - 25, 6, 50, 16);
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('REPLAY', activeX, 17);
    }

    // 8. Crosshair & Dynamic Values Tooltip
    if (crosshair && crosshair.x <= mainChartWidth && crosshair.y <= height - paddingBottom) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);

      // Vertical line
      ctx.beginPath();
      ctx.moveTo(crosshair.x, 0);
      ctx.lineTo(crosshair.x, height - paddingBottom);
      ctx.stroke();

      // Horizontal line
      ctx.beginPath();
      ctx.moveTo(0, crosshair.y);
      ctx.lineTo(mainChartWidth, crosshair.y);
      ctx.stroke();
      ctx.setLineDash([]);

      // Floating price tag on right axis
      const hoveredPrice = renderMaxPrice - (crosshair.y / mainChartHeight) * renderPriceRange;
      ctx.fillStyle = '#2962ff';
      ctx.fillRect(mainChartWidth, crosshair.y - 10, paddingRight, 20);
      ctx.fillStyle = '#ffffff';
      ctx.font = '10px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(hoveredPrice.toFixed(2), mainChartWidth + 4, crosshair.y + 3);
      }

      ctx.restore();
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [
    visibleCandles,
    indicators,
    sentimentSignals,
    showSentimentOverlay,
    crosshair,
    subpaneType,
    replayIndex,
    startIndex,
    endIndex,
  ]);

  // Mouse Interactions (Pan & Zoom)
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStartX(e.clientX);
    setDragStartOffset(offsetRight);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const candleWidth = (canvas.width / (window.devicePixelRatio || 1) - 65) / visibleCandles.length;
    const candleIndex = Math.min(visibleCandles.length - 1, Math.max(0, Math.floor(x / candleWidth)));
    const hoveredCandle = visibleCandles[candleIndex] || null;

    setCrosshair({ x, y, candle: hoveredCandle });

    if (isDragging) {
      const deltaX = e.clientX - dragStartX;
      const candleShift = Math.round(deltaX / 10);
      const newOffset = Math.max(0, Math.min(totalAvailable - visibleCount, dragStartOffset + candleShift));
      setOffsetRight(newOffset);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      // Zoom in
      setVisibleCount((prev) => Math.max(25, prev - 5));
    } else {
      // Zoom out
      setVisibleCount((prev) => Math.min(250, prev + 5));
    }
  };

  const handleResetZoom = () => {
    setVisibleCount(70);
    setOffsetRight(0);
  };

  const activeCandle = crosshair?.candle || visibleCandles[visibleCandles.length - 1];

  return (
    <div className="flex-1 flex flex-col bg-[#131722] overflow-hidden relative select-none">
      {/* Top Chart Toolbar: Timeframes, Indicator list, Subpane selector */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#171b26] border-b border-[#2a2e39] text-xs">
        <div className="flex items-center gap-1">
          {['1m', '5m', '15m', '1h', '4h', '1D'].map((tf) => (
            <button
              key={tf}
              onClick={() => onTimeframeChange(tf)}
              className={`px-2 py-0.5 rounded font-mono font-bold transition-all ${
                timeframe === tf
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'text-[#787b86] hover:text-white hover:bg-[#1e222d]'
              }`}
            >
              {tf}
            </button>
          ))}

          <div className="h-4 w-px bg-[#2a2e39] mx-2" />

          {/* Subpane selector */}
          <div className="flex items-center gap-1 text-[11px] text-[#787b86]">
            <span>Alt Panel:</span>
            {(['RSI', 'MACD', 'NONE'] as const).map((pane) => (
              <button
                key={pane}
                onClick={() => setSubpaneType(pane)}
                className={`px-1.5 py-0.5 rounded ${
                  subpaneType === pane ? 'bg-[#2a2e39] text-white font-semibold' : 'hover:text-white'
                }`}
              >
                {pane}
              </button>
            ))}
          </div>
        </div>

        {/* OHLCV Live HUD */}
        {activeCandle && (
          <div className="hidden md:flex items-center gap-3 font-mono text-[11px]">
            <span className="text-[#787b86]">
              A: <strong className="text-white">${activeCandle.open}</strong>
            </span>
            <span className="text-[#787b86]">
              Y: <strong className="text-white">${activeCandle.high}</strong>
            </span>
            <span className="text-[#787b86]">
              D: <strong className="text-white">${activeCandle.low}</strong>
            </span>
            <span className="text-[#787b86]">
              K: <strong className={activeCandle.close >= activeCandle.open ? 'text-emerald-400' : 'text-rose-400'}>
                ${activeCandle.close}
              </strong>
            </span>
            <span className="text-[#787b86]">
              Hacim: <strong className="text-white">{activeCandle.volume.toLocaleString()}</strong>
            </span>
          </div>
        )}

        {/* Zoom Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setVisibleCount((prev) => Math.max(25, prev - 10))}
            className="p-1 hover:bg-[#2a2e39] rounded text-[#787b86] hover:text-white"
            title="Yakınlaştır"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setVisibleCount((prev) => Math.min(250, prev + 10))}
            className="p-1 hover:bg-[#2a2e39] rounded text-[#787b86] hover:text-white"
            title="Uzaklaştır"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleResetZoom}
            className="p-1 hover:bg-[#2a2e39] rounded text-[#787b86] hover:text-white"
            title="Görünümü Sıfırla"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Canvas Chart Area */}
      <div ref={containerRef} className="flex-1 w-full h-full relative cursor-crosshair">
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          className="w-full h-full block"
        />

        {/* Active Indicators Overlay Tag Pills */}
        <div className="absolute top-2 left-3 flex flex-wrap gap-2 pointer-events-none">
          {indicators
            .filter((i) => i.visible)
            .map((ind) => (
              <div
                key={ind.id}
                className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-[#171b26]/90 border border-[#2a2e39] text-white shadow"
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ind.color }} />
                <span>{ind.name}</span>
              </div>
            ))}
          {showSentimentOverlay && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 shadow">
              <Sparkles className="w-2.5 h-2.5 text-emerald-400" />
              <span>AI Duygu Sinyalleri Aktif</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
