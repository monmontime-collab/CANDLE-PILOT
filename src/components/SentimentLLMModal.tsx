import React, { useState } from 'react';
import { SentimentItem } from '../types';
import {
  calculateAggregateSentiment,
  generateLLMMarketAnalysis,
  LLMAnalysisReport,
} from '../services/sentiment';
import {
  X,
  BrainCircuit,
  TrendingUp,
  Sparkles,
  Layers,
  MessageSquare,
  Twitter,
  Newspaper,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';

interface SentimentLLMModalProps {
  isOpen: boolean;
  onClose: () => void;
  sentimentItems: SentimentItem[];
  symbol: string;
  currentPrice: number;
  showSentimentOverlay: boolean;
  onToggleSentimentOverlay: () => void;
}

export const SentimentLLMModal: React.FC<SentimentLLMModalProps> = ({
  isOpen,
  onClose,
  sentimentItems,
  symbol,
  currentPrice,
  showSentimentOverlay,
  onToggleSentimentOverlay,
}) => {
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [report, setReport] = useState<LLMAnalysisReport | null>(null);

  const aggregate = calculateAggregateSentiment(sentimentItems);

  if (!isOpen) return null;

  const handleGenerateLLM = async () => {
    setIsGenerating(true);
    try {
      const res = await generateLLMMarketAnalysis(symbol, currentPrice, sentimentItems);
      setReport(res);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#131722] border border-[#2a2e39] rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2e39] bg-[#171b26]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <BrainCircuit className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                DeepInfra LLM &amp; Sosyal Sentiment Analiz Radarı
              </h2>
              <p className="text-xs text-[#787b86]">
                Reddit, Twitter (X) ve kripto haber akışlarından anlık duygu puanlama &amp; grafik entegrasyonu
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 hover:bg-[#2a2e39] text-[#787b86] hover:text-white rounded-lg transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 p-6 overflow-y-auto space-y-5">
          {/* Top Controls: Chart Overlay Toggle & Trigger LLM button */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg bg-[#171b26] border border-[#2a2e39]">
            <div className="flex items-center gap-2">
              <button
                onClick={onToggleSentimentOverlay}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  showSentimentOverlay
                    ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20'
                    : 'bg-[#1e222d] text-[#d1d4dc] hover:text-white border border-[#2a2e39]'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>
                  {showSentimentOverlay
                    ? '✓ AI Sinyalleri Grafikte Aktif'
                    : 'AI Duygu Sinyallerini Grafiğe Yansıt'}
                </span>
              </button>
              <span className="text-[11px] text-[#787b86] hidden sm:inline">
                (Mum çubuklarının üzerine LLM alım/satım işaretleri ve güven rozetleri çizer)
              </span>
            </div>

            <button
              onClick={handleGenerateLLM}
              disabled={isGenerating}
              className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black text-xs font-bold transition-all shadow-md shadow-emerald-500/20 disabled:opacity-50"
            >
              {isGenerating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span>{isGenerating ? 'DeepInfra Çözümlüyor...' : 'DeepInfra Raporu Oluştur'}</span>
            </button>
          </div>

          {/* Sentiment Meter & Distribution */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#171b26] p-4 rounded-lg border border-[#2a2e39] flex flex-col justify-between">
              <span className="text-xs text-[#787b86] font-semibold uppercase tracking-wider">Korku &amp; Açgözlülük / Duygu Endeksi</span>
              <div className="my-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold font-mono text-emerald-400">{aggregate.score > 0 ? `+${aggregate.score}` : aggregate.score}</span>
                <span className="text-xs font-bold text-white bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 rounded">
                  {aggregate.label}
                </span>
              </div>
              <div className="w-full bg-[#1e222d] h-2 rounded-full overflow-hidden flex">
                <div style={{ width: `${aggregate.bullishPercent}%` }} className="bg-emerald-500 h-full" />
                <div style={{ width: `${aggregate.neutralPercent}%` }} className="bg-amber-500 h-full" />
                <div style={{ width: `${aggregate.bearishPercent}%` }} className="bg-rose-500 h-full" />
              </div>
              <div className="flex justify-between text-[10px] text-[#787b86] font-mono mt-2">
                <span className="text-emerald-400">%{aggregate.bullishPercent} Boğa</span>
                <span className="text-amber-400">%{aggregate.neutralPercent} Nötr</span>
                <span className="text-rose-400">%{aggregate.bearishPercent} Ayı</span>
              </div>
            </div>

            <div className="md:col-span-2 bg-[#171b26] p-4 rounded-lg border border-[#2a2e39]">
              <span className="text-xs text-[#787b86] font-semibold uppercase tracking-wider block mb-2">
                Son Sosyal Medya &amp; Haber Beslemeleri (Canlı Akış)
              </span>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {sentimentItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-2 rounded bg-[#1e222d] border border-[#2a2e39] text-xs flex items-start gap-2.5"
                  >
                    <div className="mt-0.5">
                      {item.source === 'REDDIT' ? (
                        <MessageSquare className="w-3.5 h-3.5 text-orange-400" />
                      ) : item.source === 'TWITTER' ? (
                        <Twitter className="w-3.5 h-3.5 text-sky-400" />
                      ) : (
                        <Newspaper className="w-3.5 h-3.5 text-purple-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="font-bold text-white truncate">{item.title}</span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded font-mono ${
                            item.sentiment === 'BULLISH'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : item.sentiment === 'BEARISH'
                              ? 'bg-rose-500/20 text-rose-400'
                              : 'bg-amber-500/20 text-amber-400'
                          }`}
                        >
                          {item.sentiment}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#787b86] line-clamp-2">{item.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* DeepInfra LLM Synthesis Report */}
          {report && (
            <div className="bg-[#171b26] p-5 rounded-lg border border-emerald-500/30 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#2a2e39]">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-bold text-white">DeepInfra LLM Piyasa Analiz Raporu</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#787b86]">Model Güven Oranı:</span>
                  <span className="text-xs font-bold text-emerald-400 font-mono">%{report.confidence}</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                    Öneri: {report.recommendedAction}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-[#787b86] uppercase tracking-wider mb-1">Yönetici Özeti</h4>
                <p className="text-xs text-[#d1d4dc] leading-relaxed bg-[#131722] p-3 rounded border border-[#2a2e39]">
                  {report.executiveSummary}
                </p>
              </div>

              <div>
                <h4 className="text-xs font-bold text-[#787b86] uppercase tracking-wider mb-1">
                  Öne Çıkan Katalizörler
                </h4>
                <ul className="space-y-1 text-xs text-[#d1d4dc]">
                  {report.keyDrivers.map((driver, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{driver}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-xs font-bold text-[#787b86] uppercase tracking-wider mb-1">Teknik Görünüm</h4>
                <p className="text-xs text-[#787b86] font-mono bg-[#131722] p-3 rounded border border-[#2a2e39]">
                  {report.technicalOutlook}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
