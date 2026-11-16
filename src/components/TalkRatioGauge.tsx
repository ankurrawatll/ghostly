import React from 'react';
import { Mic, Volume2 } from 'lucide-react';

interface TalkRatioGaugeProps {
  talkRatio: number;
  speaker: 'USER' | 'COUNTERPARTY';
}

export const TalkRatioGauge: React.FC<TalkRatioGaugeProps> = ({ talkRatio, speaker }) => {
  const userPercent = Math.round(talkRatio * 100);
  const themPercent = 100 - userPercent;

  let paceTag = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
  let paceStatus = 'Balanced (40-60%)';

  if (userPercent > 65) {
    paceTag = 'bg-amber-500/10 text-amber-300 border-amber-500/20';
    paceStatus = 'Monologuing (>65%)';
  } else if (userPercent < 30) {
    paceTag = 'bg-sky-500/10 text-sky-300 border-sky-500/20';
    paceStatus = 'Listening Heavy';
  }

  return (
    <div className="glass-panel rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between text-xs">
        <span className="text-white/60 font-semibold flex items-center">
          <Mic className={`w-3.5 h-3.5 mr-1.5 ${speaker === 'USER' ? 'text-emerald-400 animate-pulse' : 'text-white/30'}`} />
          Talk-to-Listen Ratio
        </span>
        <span className={`pill-tag font-mono ${paceTag}`}>
          {paceStatus}
        </span>
      </div>

      {/* Progress capsule bar */}
      <div className="h-2.5 w-full bg-black/50 rounded-full overflow-hidden flex p-0.5 border border-white/[0.08] shadow-inner">
        <div
          className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-l-full transition-all duration-500 ease-out shadow-[0_0_12px_rgba(16,185,129,0.5)]"
          style={{ width: `${userPercent}%` }}
        />
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-plasma-fuchsia rounded-r-full transition-all duration-500 ease-out shadow-[0_0_12px_rgba(99,102,241,0.5)]"
          style={{ width: `${themPercent}%` }}
        />
      </div>

      <div className="flex justify-between items-center text-xs font-mono">
        <div className="flex items-center text-white/70">
          <span className="w-2 h-2 rounded-full bg-emerald-400 mr-1.5 shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
          <span>You: <strong className="text-white font-bold">{userPercent}%</strong></span>
        </div>
        <div className="text-white/30 text-[10px] tracking-wider uppercase font-semibold">
          100% Local VAD
        </div>
        <div className="flex items-center text-white/70">
          <span className="w-2 h-2 rounded-full bg-plasma-fuchsia mr-1.5 shadow-[0_0_6px_rgba(217,70,239,0.8)]" />
          <span>Them: <strong className="text-white font-bold">{themPercent}%</strong></span>
          <Volume2 className={`w-3 h-3 ml-1.5 ${speaker === 'COUNTERPARTY' ? 'text-plasma-fuchsia animate-pulse' : 'text-white/30'}`} />
        </div>
      </div>
    </div>
  );
};
