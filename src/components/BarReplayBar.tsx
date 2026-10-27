import React from 'react';
import { Play, Pause, StepForward, RotateCcw, X, FastForward, Clock } from 'lucide-react';

interface BarReplayBarProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  onStepForward: () => void;
  onReset: () => void;
  onExitReplay: () => void;
  currentBarIndex: number;
  totalBars: number;
  speed: number;
  onChangeSpeed: (speed: number) => void;
  currentBarDate?: string;
}

export const BarReplayBar: React.FC<BarReplayBarProps> = ({
  isPlaying,
  onTogglePlay,
  onStepForward,
  onReset,
  onExitReplay,
  currentBarIndex,
  totalBars,
  speed,
  onChangeSpeed,
  currentBarDate,
}) => {
  return (
    <div className="bg-[#171b26] border-b border-amber-500/40 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs select-none shadow-lg shadow-amber-950/20">
      {/* Title & Info */}
      <div className="flex items-center gap-2.5">
        <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
        <span className="font-bold text-amber-300 uppercase tracking-wider text-[11px] flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" /> Bar Replay Simülasyonu
        </span>
        <span className="text-[#787b86] font-mono text-[11px]">
          Mum: <strong className="text-white">{currentBarIndex + 1}</strong> / {totalBars}
        </span>
        {currentBarDate && (
          <span className="hidden sm:inline-block bg-[#1e222d] px-2 py-0.5 rounded text-[10px] font-mono text-amber-200 border border-[#2a2e39]">
            {currentBarDate}
          </span>
        )}
      </div>

      {/* Playback Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={onReset}
          className="p-1.5 rounded bg-[#1e222d] hover:bg-[#2a2e39] text-[#d1d4dc] hover:text-white border border-[#2a2e39]"
          title="Başa Dön"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onTogglePlay}
          className={`flex items-center gap-1 px-3 py-1.5 rounded font-bold transition-all ${
            isPlaying
              ? 'bg-amber-500 hover:bg-amber-400 text-black'
              : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-md shadow-emerald-500/20'
          }`}
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5 fill-black" /> : <Play className="w-3.5 h-3.5 fill-black" />}
          <span>{isPlaying ? 'Durdur' : 'Oynat'}</span>
        </button>

        <button
          onClick={onStepForward}
          disabled={isPlaying}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-[#1e222d] hover:bg-[#2a2e39] text-white border border-[#2a2e39] disabled:opacity-40"
          title="1 Mum İleri Adım"
        >
          <StepForward className="w-3.5 h-3.5" />
          <span className="hidden md:inline text-[11px]">+1 Mum</span>
        </button>

        {/* Speed Selector */}
        <div className="flex items-center gap-1 ml-1 bg-[#1e222d] p-0.5 rounded border border-[#2a2e39]">
          <FastForward className="w-3 h-3 text-[#787b86] ml-1" />
          {[0.5, 1, 2, 5].map((s) => (
            <button
              key={s}
              onClick={() => onChangeSpeed(s)}
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                speed === s ? 'bg-amber-500 text-black' : 'text-[#787b86] hover:text-white'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      {/* Exit Button */}
      <button
        onClick={onExitReplay}
        className="flex items-center gap-1 text-[#787b86] hover:text-rose-400 bg-[#1e222d] hover:bg-rose-500/10 border border-[#2a2e39] hover:border-rose-500/30 px-2 py-1 rounded transition-all"
        title="Replay Modundan Çık"
      >
        <X className="w-3.5 h-3.5" />
        <span>Canlıya Dön</span>
      </button>
    </div>
  );
};
