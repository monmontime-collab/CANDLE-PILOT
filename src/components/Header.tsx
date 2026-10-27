import React from 'react';
import {
  TrendingUp,
  Activity,
  Code2,
  BarChart3,
  BrainCircuit,
  Boxes,
  User,
  History,
  Radio,
  Download,
} from 'lucide-react';
import { SUPPORTED_SYMBOLS, TickerData } from '../services/binance';
import { downloadFullProjectZip } from '../services/devopsData';
import { UserSession } from '../types';

interface HeaderProps {
  currentSymbol: string;
  onSelectSymbol: (symbol: string) => void;
  ticker: TickerData | null;
  latencyMs: number;
  isWsConnected: boolean;
  isReplayActive: boolean;
  onToggleReplay: () => void;
  onOpenPineEditor: () => void;
  onOpenBacktest: () => void;
  onOpenSentimentLLM: () => void;
  onOpenDevOps: () => void;
  onOpenAuth: () => void;
  userSession: UserSession;
  chartMode: 'canvas' | 'tradingview';
  onToggleChartMode: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentSymbol,
  onSelectSymbol,
  ticker,
  latencyMs,
  isWsConnected,
  isReplayActive,
  onToggleReplay,
  onOpenPineEditor,
  onOpenBacktest,
  onOpenSentimentLLM,
  onOpenDevOps,
  onOpenAuth,
  userSession,
  chartMode,
  onToggleChartMode,
}) => {
  const isPositive = (ticker?.change24hPercent || 0) >= 0;

  return (
    <header className="bg-[#131722] border-b border-[#2a2e39] text-[#d1d4dc] px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 select-none">
      {/* Brand & Symbol Selector */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center text-black font-black shadow-md shadow-emerald-500/20">
            <TrendingUp className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold tracking-tight text-white text-base">CryptoPulse</span>
              <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/30">
                PRO v2.4
              </span>
            </div>
            <p className="text-[10px] text-[#787b86] font-mono leading-none">Binance &amp; Pine Engine</p>
          </div>
        </div>

        <div className="h-6 w-px bg-[#2a2e39] hidden sm:block" />

        {/* Pair selector dropdown */}
        <div className="flex items-center gap-2">
          <select
            aria-label="İşlem Çifti Seçimi"
            value={currentSymbol}
            onChange={(e) => onSelectSymbol(e.target.value)}
            className="bg-[#1e222d] border border-[#2a2e39] text-white font-bold text-sm rounded-md px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            {SUPPORTED_SYMBOLS.map((s) => (
              <option key={s.symbol} value={s.symbol}>
                {s.name} ({s.symbol.replace('USDT', '/USDT')})
              </option>
            ))}
          </select>

          {/* Current Price & 24h Stats */}
          {ticker && (
            <div className="flex items-center gap-3 text-xs ml-1">
              <div>
                <span className={`text-base font-bold font-mono ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                  ${ticker.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                </span>
                <span className={`ml-1.5 text-xs font-semibold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {isPositive ? '+' : ''}{ticker.change24hPercent.toFixed(2)}%
                </span>
              </div>

              <div className="hidden xl:flex items-center gap-3 text-[11px] text-[#787b86] font-mono pl-2 border-l border-[#2a2e39]">
                <div>
                  <span className="block text-[9px] uppercase tracking-wider text-[#50535e]">24h Yüksek</span>
                  <span className="text-slate-300 font-medium">${ticker.high24h.toLocaleString()}</span>
                </div>
                <div>
                  <span className="block text-[9px] uppercase tracking-wider text-[#50535e]">24h Düşük</span>
                  <span className="text-slate-300 font-medium">${ticker.low24h.toLocaleString()}</span>
                </div>
                <div>
                  <span className="block text-[9px] uppercase tracking-wider text-[#50535e]">24h Hacim</span>
                  <span className="text-slate-300 font-medium">{ticker.volume24h.toLocaleString()} USDT</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Center / Action Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Chart View Toggle: Interactive Engine vs TV Widget */}
        <button
          onClick={onToggleChartMode}
          title="Grafik Motorunu Değiştir (Canvas İndikatör / TradingView)"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
            chartMode === 'canvas'
              ? 'bg-[#1e222d] text-emerald-400 border border-emerald-500/40'
              : 'bg-[#1e222d] text-[#b2b5be] hover:text-white border border-[#2a2e39]'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span className="hidden md:inline">{chartMode === 'canvas' ? 'Canvas (Pine+AI)' : 'TradingView'}</span>
        </button>

        {/* Bar Replay Mode Toggle */}
        <button
          onClick={onToggleReplay}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            isReplayActive
              ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20 font-bold'
              : 'bg-[#1e222d] hover:bg-[#2a2e39] text-amber-300 border border-amber-500/30'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>{isReplayActive ? 'Replay Aktif' : 'Bar Replay'}</span>
        </button>

        {/* Pine Script & Strategy Editor */}
        <button
          onClick={onOpenPineEditor}
          className="flex items-center gap-1.5 bg-[#1e222d] hover:bg-[#2a2e39] border border-[#2a2e39] hover:border-cyan-500/50 text-cyan-300 px-3 py-1.5 rounded-md text-xs font-semibold transition-all"
        >
          <Code2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Pine Editör</span>
        </button>

        {/* Strategy Backtest Report */}
        <button
          onClick={onOpenBacktest}
          className="flex items-center gap-1.5 bg-[#1e222d] hover:bg-[#2a2e39] border border-[#2a2e39] hover:border-purple-500/50 text-purple-300 px-3 py-1.5 rounded-md text-xs font-semibold transition-all"
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Backtest</span>
        </button>

        {/* Sentiment & DeepInfra LLM Radar */}
        <button
          onClick={onOpenSentimentLLM}
          className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-950 to-teal-900 border border-emerald-500/40 text-emerald-300 hover:text-emerald-200 px-3 py-1.5 rounded-md text-xs font-semibold transition-all shadow-sm"
        >
          <BrainCircuit className="w-3.5 h-3.5 text-emerald-400" />
          <span>LLM &amp; Sentiment</span>
        </button>

        {/* DevOps & Go Microservices Architecture Hub */}
        <button
          onClick={onOpenDevOps}
          className="flex items-center gap-1.5 bg-[#1e222d] hover:bg-[#2a2e39] border border-[#2a2e39] hover:border-blue-500/50 text-blue-300 px-3 py-1.5 rounded-md text-xs font-semibold transition-all"
        >
          <Boxes className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Go &amp; Docker Kurulum</span>
        </button>

        {/* Direct 1-Click ZIP Download Button */}
        <button
          onClick={downloadFullProjectZip}
          title="Go Mikroservisleri, Multi-Arch Dockerfile ve docker-compose.yml Paketini Bilgisayara İndir (.ZIP)"
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-md text-xs font-bold transition-all shadow-md shadow-blue-600/25 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Docker &amp; Kod İndir (.ZIP)</span>
        </button>
      </div>

      {/* Latency, WebSocket & Auth Profile */}
      <div className="flex items-center gap-3">
        {/* HFT Latency Badge */}
        <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono px-2 py-1 bg-[#1e222d] rounded border border-[#2a2e39]">
          <span className={`w-2 h-2 rounded-full ${isWsConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
          <Radio className="w-3 h-3 text-[#787b86]" />
          <span className="text-slate-300">{latencyMs}ms</span>
        </div>

        {/* JWT Auth Button */}
        <button
          onClick={onOpenAuth}
          className="flex items-center gap-2 bg-[#1e222d] hover:bg-[#2a2e39] border border-[#2a2e39] hover:border-slate-500 px-3 py-1.5 rounded-md text-xs font-medium text-white transition-all"
        >
          <User className="w-3.5 h-3.5 text-emerald-400" />
          <span>{userSession.isAuthenticated ? userSession.username : 'Giriş / JWT'}</span>
          {userSession.isAuthenticated && (
            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1 rounded">
              {userSession.role === 'ADMIN' ? 'Admin' : 'Pro'}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};
