import React, { useState } from 'react';
import { Candle, BacktestMetrics } from '../types';
import { runBacktest, BacktestParams } from '../services/backtest';
import { X, Play, Download, TrendingUp, BarChart2, ShieldAlert, CheckCircle, Percent } from 'lucide-react';

interface BacktestModalProps {
  isOpen: boolean;
  onClose: () => void;
  candles: Candle[];
  initialStrategyName?: string;
  sentimentSignals?: (number | null)[];
}

export const BacktestModal: React.FC<BacktestModalProps> = ({
  isOpen,
  onClose,
  candles,
  initialStrategyName = 'EMA 9/21 Trend & Golden Cross',
  sentimentSignals,
}) => {
  const [strategyName, setStrategyName] = useState<string>(initialStrategyName);
  const [initialCapital, setInitialCapital] = useState<number>(10000);
  const [tradeSizePercent, setTradeSizePercent] = useState<number>(50);
  const [feePercent, setFeePercent] = useState<number>(0.05);
  const [slippagePercent, setSlippagePercent] = useState<number>(0.02);
  const [fastPeriod, setFastPeriod] = useState<number>(9);
  const [slowPeriod, setSlowPeriod] = useState<number>(21);

  const [metrics, setMetrics] = useState<BacktestMetrics | null>(() => {
    return runBacktest(candles, {
      strategyName: initialStrategyName,
      initialCapital: 10000,
      tradeSizePercent: 50,
      feePercent: 0.05,
      slippagePercent: 0.02,
      fastPeriod: 9,
      slowPeriod: 21,
      sentimentSignals,
    });
  });

  if (!isOpen) return null;

  const handleRun = () => {
    const res = runBacktest(candles, {
      strategyName,
      initialCapital,
      tradeSizePercent,
      feePercent,
      slippagePercent,
      fastPeriod,
      slowPeriod,
      sentimentSignals,
    });
    setMetrics(res);
  };

  const handleExportCSV = () => {
    if (!metrics || metrics.trades.length === 0) return;
    const headers = 'ID,EntryTime,ExitTime,Side,EntryPrice,ExitPrice,Amount,PnL,PnLPercent,Reason\n';
    const rows = metrics.trades
      .map(
        (t) =>
          `${t.id},${new Date(t.entryTime * 1000).toISOString()},${new Date(t.exitTime * 1000).toISOString()},${t.side},${t.entryPrice},${t.exitPrice},${t.amount},${t.pnl},${t.pnlPercent},"${t.reason}"`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backtest-report-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Equity Curve SVG calculation
  const curve = metrics?.equityCurve || [];
  let minEquity = Infinity;
  let maxEquity = -Infinity;
  curve.forEach((pt) => {
    if (pt.equity < minEquity) minEquity = pt.equity;
    if (pt.equity > maxEquity) maxEquity = pt.equity;
  });
  const eqRange = maxEquity - minEquity || 1;
  const svgWidth = 600;
  const svgHeight = 120;

  const pointsString = curve
    .map((pt, i) => {
      const x = (i / (curve.length - 1 || 1)) * svgWidth;
      const y = svgHeight - ((pt.equity - minEquity) / eqRange) * (svgHeight - 20) - 10;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const isNetProfitPositive = (metrics?.netProfit || 0) >= 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#131722] border border-[#2a2e39] rounded-xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2e39] bg-[#171b26]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
              <BarChart2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Strateji Backtest &amp; Performans Raporlama</h2>
              <p className="text-xs text-[#787b86]">
                Geçmiş mum verileriyle emir komisyonu, kayma (slippage) ve Sharpe rasyosu hesaplamaları
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              disabled={!metrics || metrics.trades.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1e222d] hover:bg-[#2a2e39] border border-[#2a2e39] rounded-lg text-xs font-semibold text-[#d1d4dc] hover:text-white disabled:opacity-40"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV İndir</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-[#2a2e39] text-[#787b86] hover:text-white rounded-lg transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Left Settings Sidebar */}
          <div className="w-full lg:w-72 bg-[#171b26] border-r border-[#2a2e39] p-4 flex flex-col gap-3 overflow-y-auto">
            <span className="text-xs font-bold text-white uppercase tracking-wider">Parametreler</span>

            <div>
              <label className="text-[11px] text-[#787b86] block mb-1">Strateji Şablonu</label>
              <select
                value={strategyName}
                onChange={(e) => setStrategyName(e.target.value)}
                className="w-full bg-[#1e222d] border border-[#2a2e39] rounded p-2 text-xs text-white focus:outline-none focus:border-purple-500"
              >
                <option value="EMA 9/21 Trend & Golden Cross">EMA 9/21 Kesişimi</option>
                <option value="Sosyal Sentiment Ağırlıklı Alpha">LLM &amp; Sentiment Destekli</option>
                <option value="RSI Mean Reversion">RSI Aşırı Alım/Satım</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] text-[#787b86] block mb-1">Başlangıç Sermayesi ($)</label>
              <input
                type="number"
                value={initialCapital}
                onChange={(e) => setInitialCapital(parseFloat(e.target.value) || 1000)}
                className="w-full bg-[#1e222d] border border-[#2a2e39] rounded p-2 text-xs text-white font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-[#787b86] block mb-1">İşlem Büyüklüğü %</label>
                <input
                  type="number"
                  value={tradeSizePercent}
                  onChange={(e) => setTradeSizePercent(parseFloat(e.target.value) || 10)}
                  className="w-full bg-[#1e222d] border border-[#2a2e39] rounded p-2 text-xs text-white font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] text-[#787b86] block mb-1">Komisyon %</label>
                <input
                  type="number"
                  step="0.01"
                  value={feePercent}
                  onChange={(e) => setFeePercent(parseFloat(e.target.value) || 0.05)}
                  className="w-full bg-[#1e222d] border border-[#2a2e39] rounded p-2 text-xs text-white font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-[#787b86] block mb-1">Hızlı Periyot</label>
                <input
                  type="number"
                  value={fastPeriod}
                  onChange={(e) => setFastPeriod(parseInt(e.target.value, 10) || 9)}
                  className="w-full bg-[#1e222d] border border-[#2a2e39] rounded p-2 text-xs text-white font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] text-[#787b86] block mb-1">Yavaş Periyot</label>
                <input
                  type="number"
                  value={slowPeriod}
                  onChange={(e) => setSlowPeriod(parseInt(e.target.value, 10) || 21)}
                  className="w-full bg-[#1e222d] border border-[#2a2e39] rounded p-2 text-xs text-white font-mono"
                />
              </div>
            </div>

            <button
              onClick={handleRun}
              className="w-full mt-auto py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-purple-600/25"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Backtest'i Çalıştır</span>
            </button>
          </div>

          {/* Right Metrics & Trades Output */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4">
            {metrics ? (
              <>
                {/* Metric Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  <div className="bg-[#171b26] p-3 rounded-lg border border-[#2a2e39]">
                    <span className="text-[10px] text-[#787b86] uppercase font-mono block">Net Kâr / Zarar</span>
                    <span
                      className={`text-sm font-bold font-mono ${
                        isNetProfitPositive ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {isNetProfitPositive ? '+' : ''}${metrics.netProfit.toLocaleString()} ({isNetProfitPositive ? '+' : ''}
                      {metrics.netProfitPercent}%)
                    </span>
                  </div>

                  <div className="bg-[#171b26] p-3 rounded-lg border border-[#2a2e39]">
                    <span className="text-[10px] text-[#787b86] uppercase font-mono block">Kazanma Oranı (Win Rate)</span>
                    <span className="text-sm font-bold font-mono text-cyan-400">
                      %{metrics.winRate} ({metrics.winningTrades}/{metrics.totalTrades})
                    </span>
                  </div>

                  <div className="bg-[#171b26] p-3 rounded-lg border border-[#2a2e39]">
                    <span className="text-[10px] text-[#787b86] uppercase font-mono block">Profit Factor</span>
                    <span className="text-sm font-bold font-mono text-amber-400">{metrics.profitFactor}</span>
                  </div>

                  <div className="bg-[#171b26] p-3 rounded-lg border border-[#2a2e39]">
                    <span className="text-[10px] text-[#787b86] uppercase font-mono block">Maksimum Drawdown</span>
                    <span className="text-sm font-bold font-mono text-rose-400">-%{metrics.maxDrawdown}</span>
                  </div>

                  <div className="bg-[#171b26] p-3 rounded-lg border border-[#2a2e39]">
                    <span className="text-[10px] text-[#787b86] uppercase font-mono block">Sharpe Rasyosu</span>
                    <span className="text-sm font-bold font-mono text-purple-400">{metrics.sharpeRatio}</span>
                  </div>

                  <div className="bg-[#171b26] p-3 rounded-lg border border-[#2a2e39]">
                    <span className="text-[10px] text-[#787b86] uppercase font-mono block">Son Bakiye</span>
                    <span className="text-sm font-bold font-mono text-white">${metrics.finalCapital.toLocaleString()}</span>
                  </div>
                </div>

                {/* Equity Curve SVG */}
                <div className="bg-[#171b26] p-4 rounded-lg border border-[#2a2e39]">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> Bakiye Gelişim Eğrisi (Equity Curve)
                    </span>
                    <span className="text-[11px] font-mono text-[#787b86]">
                      ${minEquity.toFixed(0)} - ${maxEquity.toFixed(0)}
                    </span>
                  </div>
                  <div className="w-full h-32 bg-[#0c0e14] rounded border border-[#2a2e39] relative flex items-center justify-center overflow-hidden">
                    {curve.length > 1 ? (
                      <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full preserve-3d">
                        <polyline
                          fill="none"
                          stroke={isNetProfitPositive ? '#10b981' : '#f43f5e'}
                          strokeWidth="2.5"
                          points={pointsString}
                        />
                      </svg>
                    ) : (
                      <span className="text-xs text-[#787b86]">Yeterli işlem verisi yok</span>
                    )}
                  </div>
                </div>

                {/* Detailed Trades Table */}
                <div className="bg-[#171b26] rounded-lg border border-[#2a2e39] overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-[#2a2e39] text-xs font-bold text-white">
                    İşlem Günlüğü ({metrics.trades.length} İşlem)
                  </div>
                  <div className="max-h-56 overflow-y-auto">
                    {metrics.trades.length === 0 ? (
                      <div className="p-4 text-center text-xs text-[#787b86]">
                        Belirtilen parametrelerle tetiklenen işlem olmadı.
                      </div>
                    ) : (
                      <table className="w-full text-left font-mono text-[11px]">
                        <thead className="bg-[#131722] text-[#787b86] text-[10px] uppercase sticky top-0">
                          <tr>
                            <th className="py-2 px-3">İşlem ID</th>
                            <th className="py-2 px-3">Yön</th>
                            <th className="py-2 px-3">Giriş Fiyatı</th>
                            <th className="py-2 px-3">Çıkış Fiyatı</th>
                            <th className="py-2 px-3">Net K/Z</th>
                            <th className="py-2 px-3">K/Z %</th>
                            <th className="py-2 px-3">Neden</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1e222d]">
                          {metrics.trades.map((t) => {
                            const isWin = t.pnl > 0;
                            return (
                              <tr key={t.id} className="hover:bg-white/[0.02]">
                                <td className="py-2 px-3 text-[#787b86]">{t.id}</td>
                                <td className="py-2 px-3 font-semibold text-emerald-400">{t.side}</td>
                                <td className="py-2 px-3">${t.entryPrice.toFixed(2)}</td>
                                <td className="py-2 px-3">${t.exitPrice.toFixed(2)}</td>
                                <td className={`py-2 px-3 font-bold ${isWin ? 'text-emerald-400' : 'text-rose-400'}`}>
                                  {isWin ? '+' : ''}${t.pnl.toFixed(2)}
                                </td>
                                <td className={`py-2 px-3 ${isWin ? 'text-emerald-400' : 'text-rose-400'}`}>
                                  {isWin ? '+' : ''}{t.pnlPercent.toFixed(2)}%
                                </td>
                                <td className="py-2 px-3 text-[#787b86] font-sans">{t.reason}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-[#787b86]">Lütfen bir backtest çalıştırın.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
