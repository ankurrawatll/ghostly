import React, { useState } from 'react';
import { Sparkles, Pin, X, Check, Copy, ShieldAlert, Cpu, Cloud, Zap } from 'lucide-react';
import { TacticalBattlecard } from '../types';

interface ActiveBattlecardProps {
  battlecard: TacticalBattlecard | null;
  onDismiss: () => void;
  onPin: (id: string) => void;
}

export const ActiveBattlecard: React.FC<ActiveBattlecardProps> = ({
  battlecard,
  onDismiss,
  onPin
}) => {
  const [copied, setCopied] = useState(false);

  if (!battlecard) {
    return (
      <div className="relative group overflow-hidden rounded-2xl glass-panel p-6 text-center border-dashed border-white/10">
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
        <div className="w-10 h-10 rounded-2xl bg-white/[0.03] border border-white/10 mx-auto flex items-center justify-center mb-3">
          <Sparkles className="w-4 h-4 text-white/40 group-hover:text-plasma-violet transition-colors" />
        </div>
        <p className="text-xs font-semibold text-white/80 tracking-tight">Tactical Battlecard Slot</p>
        <p className="text-[11px] text-white/40 mt-1 max-w-xs mx-auto leading-relaxed">
          Listening on-device... When the counterparty raises a pricing, competitor, or contract objection, a real-time battlecard will illuminate here.
        </p>
      </div>
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(battlecard.counterMove);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isLocal = battlecard.inferenceSource === 'FALLBACK_LOCAL' || battlecard.inferenceSource === 'ON_DEVICE';

  return (
    <div className={`relative overflow-hidden rounded-2xl glass-panel border transition-all duration-300 animate-in fade-in zoom-in-95 ${
      isLocal 
        ? 'border-amber-500/30 shadow-[0_0_35px_-5px_rgba(245,158,11,0.2)]' 
        : 'border-plasma-violet/40 shadow-glow-violet'
    }`}>
      {/* Ambient gradient top aura (inspired by Bright Spark & Purple Haze) */}
      <div className={`h-1.5 w-full bg-gradient-to-r ${
        isLocal 
          ? 'from-amber-400 via-orange-500 to-amber-600' 
          : 'from-plasma-violet via-plasma-fuchsia to-plasma-cyan'
      }`} />

      <div className="p-4 space-y-3">
        {/* Header bar */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="pill-tag bg-white/10 text-white font-bold border-white/20">
              {isLocal ? 'PRO • LOCAL' : 'PRO • CLOUD AI'}
            </span>
            <h4 className="text-xs uppercase tracking-wider font-extrabold text-white flex items-center">
              {isLocal ? <Cpu className="w-3.5 h-3.5 mr-1 text-amber-400" /> : <Zap className="w-3.5 h-3.5 mr-1 text-plasma-violet" />}
              {battlecard.headline}
            </h4>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="pill-tag text-white/80 font-mono">
              {battlecard.latencyMs}ms
            </span>

            <button
              onClick={() => onPin(battlecard.id)}
              className={`p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors ${
                battlecard.isPinned ? 'text-amber-400 bg-amber-500/10' : ''
              }`}
              title="Pin this card"
            >
              <Pin className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onDismiss}
              className="p-1.5 rounded-lg text-white/40 hover:text-rose-400 hover:bg-white/10 transition-colors"
              title="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Spoken-ready counter move with glowing typography */}
        <div className="relative rounded-xl p-3.5 bg-black/40 border border-white/[0.08] backdrop-blur-xl">
          <span className="text-[10px] uppercase font-mono tracking-wider font-semibold text-white/40 block mb-1">
            Recommended Response:
          </span>
          <p className="text-sm font-semibold text-emerald-300 leading-snug">
            "{battlecard.counterMove}"
          </p>
        </div>

        {/* Rationale and rule citation */}
        <div className="flex items-center justify-between text-[11px] text-white/50 pt-1 border-t border-white/[0.06]">
          <div className="flex items-center space-x-1.5 truncate mr-2">
            <ShieldAlert className="w-3.5 h-3.5 text-white/40 flex-shrink-0" />
            <span className="truncate">
              Rule: <strong className="text-white/80">{battlecard.sourceRule}</strong>
            </span>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center space-x-1 text-white/80 hover:text-white bg-white/[0.06] hover:bg-white/10 px-2.5 py-1 rounded-lg border border-white/10 text-[11px] font-semibold transition-all flex-shrink-0"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
