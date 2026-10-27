import React, { useState } from 'react';
import { IndicatorConfig } from '../types';
import { X, Play, Plus, Trash2, Eye, EyeOff, Sparkles, BookOpen } from 'lucide-react';

interface PineEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddIndicatorFromScript: (script: string) => void;
  onSendToBacktest: (script: string, name: string) => void;
  indicators: IndicatorConfig[];
  onToggleIndicator: (id: string) => void;
  onRemoveIndicator: (id: string) => void;
}

const TEMPLATES = [
  {
    name: 'EMA 9/21 Trend & Golden Cross',
    script: `//@version=5
indicator("EMA 9/21 Kesişimi", overlay=true)
fast = ema(close, 9)
slow = ema(close, 21)
plot(fast, color="#10b981", title="Hızlı EMA 9")
plot(slow, color="#3b82f6", title="Yavaş EMA 21")
strategy.entry("Long", strategy.long, when=crossover(fast, slow))`,
  },
  {
    name: 'Sosyal Sentiment Ağırlıklı Alpha',
    script: `//@version=5
indicator("LLM Duygu Destekli Momentum", overlay=true)
maFast = sma(close, 14)
maSlow = sma(close, 50)
plot(maFast, color="#06b6d4", title="Momentum MA")
plot(maSlow, color="#8b5cf6", title="Ana Trend MA")
// AI Sentiment Score Filtresi
strategy.entry("AI_Long", strategy.long, when=crossover(maFast, maSlow))`,
  },
  {
    name: 'RSI Reversal Stratejisi',
    script: `//@version=5
indicator("RSI Aşırı Satım / Alım", overlay=false)
rsiVal = rsi(close, 14)
plot(rsiVal, color="#a855f7", title="RSI (14)")`,
  },
  {
    name: 'Bollinger Bantları Volatilite Sıkışması',
    script: `//@version=5
indicator("Bollinger Bantları Alpha", overlay=true)
bbMiddle = sma(close, 20)
plot(bbMiddle, color="#f59e0b", title="Orta Bant SMA 20")`,
  },
];

export const PineEditorModal: React.FC<PineEditorModalProps> = ({
  isOpen,
  onClose,
  onAddIndicatorFromScript,
  onSendToBacktest,
  indicators,
  onToggleIndicator,
  onRemoveIndicator,
}) => {
  const [code, setCode] = useState<string>(TEMPLATES[0].script);
  const [strategyTitle, setStrategyTitle] = useState<string>('EMA 9/21 Stratejisi');
  const [activeTab, setActiveTab] = useState<'EDITOR' | 'ACTIVE_INDICATORS'>('EDITOR');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleApplyToChart = () => {
    onAddIndicatorFromScript(code);
    setFeedbackMsg('İndikatör başarıyla derlendi ve canlı grafiğe eklendi!');
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const handleRunBacktest = () => {
    onSendToBacktest(code, strategyTitle);
    onClose();
  };

  const handleSelectTemplate = (template: typeof TEMPLATES[0]) => {
    setCode(template.script);
    setStrategyTitle(template.name);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#131722] border border-[#2a2e39] rounded-xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#2a2e39] bg-[#171b26]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Pine Editör &amp; Algoritmik Strateji Stüdyosu
              </h2>
              <p className="text-xs text-[#787b86]">
                Pine Script v5 uyumlu indikatör yazın, sınırsız gösterge derleyin ve grafiğe ekleyin
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-[#1e222d] p-1 rounded-lg border border-[#2a2e39]">
              <button
                onClick={() => setActiveTab('EDITOR')}
                className={`px-3 py-1 text-xs font-semibold rounded ${
                  activeTab === 'EDITOR' ? 'bg-[#2a2e39] text-cyan-400' : 'text-[#787b86] hover:text-white'
                }`}
              >
                Kod Editörü
              </button>
              <button
                onClick={() => setActiveTab('ACTIVE_INDICATORS')}
                className={`px-3 py-1 text-xs font-semibold rounded flex items-center gap-1.5 ${
                  activeTab === 'ACTIVE_INDICATORS' ? 'bg-[#2a2e39] text-cyan-400' : 'text-[#787b86] hover:text-white'
                }`}
              >
                <span>Aktif Göstergeler</span>
                <span className="text-[10px] px-1 bg-cyan-500/20 text-cyan-300 rounded font-mono">
                  {indicators.length}
                </span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 hover:bg-[#2a2e39] text-[#787b86] hover:text-white rounded-lg transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'EDITOR' ? (
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Sidebar with presets */}
            <div className="w-full md:w-64 bg-[#171b26] border-r border-[#2a2e39] p-3 flex flex-col gap-2">
              <span className="text-[11px] font-bold text-[#787b86] uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" /> Hazır Şablonlar
              </span>
              <div className="space-y-1 overflow-y-auto">
                {TEMPLATES.map((t) => (
                  <button
                    key={t.name}
                    onClick={() => handleSelectTemplate(t)}
                    className="w-full text-left p-2 rounded-lg bg-[#1e222d] hover:bg-[#2a2e39] text-xs font-medium text-[#d1d4dc] hover:text-white border border-transparent hover:border-cyan-500/30 transition-all"
                  >
                    {t.name}
                  </button>
                ))}
              </div>

              <div className="mt-auto p-2.5 rounded-lg bg-[#1e222d]/60 border border-[#2a2e39] text-[11px] text-[#787b86] leading-relaxed">
                <strong className="text-white block mb-1">Pine Script İpuçları:</strong>
                • <code className="text-cyan-300">sma(close, period)</code> veya <code className="text-cyan-300">ema(...)</code>
                <br />• <code className="text-cyan-300">rsi(close, 14)</code>
                <br />• <code className="text-cyan-300">plot(var, color="#...")</code>
              </div>
            </div>

            {/* Code Editor Body */}
            <div className="flex-1 flex flex-col p-4 bg-[#131722] overflow-hidden">
              {feedbackMsg && (
                <div className="mb-2 p-2 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold">
                  {feedbackMsg}
                </div>
              )}

              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                spellCheck={false}
                className="flex-1 w-full p-3 font-mono text-xs bg-[#0c0e14] border border-[#2a2e39] rounded-lg text-emerald-300 focus:outline-none focus:border-cyan-500 resize-none leading-relaxed selection:bg-cyan-500/30"
              />

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 mt-1">
                <span className="text-[11px] text-[#787b86] font-mono">
                  Sınırsız gösterge desteği aktif
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={handleRunBacktest}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#1e222d] hover:bg-[#2a2e39] border border-purple-500/40 text-purple-300 hover:text-purple-200 text-xs font-bold transition-all"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Stratejiyi Backtest Et</span>
                  </button>
                  <button
                    onClick={handleApplyToChart}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold transition-all shadow-md shadow-cyan-500/20"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Grafiğe Gösterge Olarak Ekle</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Active Indicators Management Tab */
          <div className="flex-1 p-6 overflow-y-auto">
            <h3 className="text-sm font-bold text-white mb-3">Grafikteki Aktif Göstergeler</h3>
            {indicators.length === 0 ? (
              <p className="text-xs text-[#787b86]">Henüz eklenmiş bir gösterge bulunmuyor.</p>
            ) : (
              <div className="space-y-2">
                {indicators.map((ind) => (
                  <div
                    key={ind.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-[#171b26] border border-[#2a2e39]"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: ind.color }} />
                      <div>
                        <span className="font-bold text-white text-xs block">{ind.name}</span>
                        <span className="text-[10px] text-[#787b86] font-mono uppercase">{ind.type}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onToggleIndicator(ind.id)}
                        className="p-1.5 hover:bg-[#2a2e39] text-[#787b86] hover:text-white rounded"
                        title={ind.visible ? 'Gizle' : 'Göster'}
                      >
                        {ind.visible ? <Eye className="w-4 h-4 text-emerald-400" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => onRemoveIndicator(ind.id)}
                        className="p-1.5 hover:bg-rose-500/20 text-[#787b86] hover:text-rose-400 rounded"
                        title="Kaldır"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
