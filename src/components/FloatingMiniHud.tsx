import React, { useState } from 'react';
import {
  Copy,
  Check,
  ShieldCheck,
  X,
  Volume2,
  Sparkles,
  Zap,
  ArrowUpRight,
  Maximize2
} from 'lucide-react';
import { TacticalBattlecard } from '../types';

interface FloatingMiniHudProps {
  activeBattlecard: TacticalBattlecard | null;
  talkRatio: number;
  speaker: 'USER' | 'COUNTERPARTY';
  latestTurnText?: string;
  isCapturing: boolean;
  onSimulateObjection?: (objectionText: string) => void;
  onClose: () => void;
}

export const FloatingMiniHud: React.FC<FloatingMiniHudProps> = ({
  activeBattlecard,
  talkRatio,
  speaker,
  latestTurnText,
  isCapturing,
  onSimulateObjection,
  onClose
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const userPercent = Math.round(talkRatio * 100);
  const themPercent = 100 - userPercent;

  // Gauge state: balanced is 40%-60%
  const isBalanced = userPercent >= 38 && userPercent <= 62;
  const isDominating = userPercent > 62;

  return (
    <div className="min-h-screen bg-[#07080B] text-slate-100 flex flex-col font-sans p-3 selection:bg-purple-500/30 selection:text-white">
      {/* Ambient Top Glow Flare */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-gradient-to-b from-purple-600/30 via-fuchsia-600/10 to-transparent pointer-events-none" />

      {/* Top Header Bar */}
      <header className="relative z-10 flex items-center justify-between pb-2.5 mb-2.5 border-b border-white/10">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34D399]" />
          <span className="text-xs font-bold tracking-tight text-white flex items-center">
            GhostWing <span className="ml-1 text-[10px] text-purple-300 font-normal">HUD</span>
          </span>
          <span className="text-[9px] font-mono uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded">
            0 B Egress
          </span>
        </div>

        <div className="flex items-center space-x-1.5">
          <span className="text-[10px] text-white/40">
            {isCapturing ? '🟢 Live' : '⚪ Standby'}
          </span>
          <button
            onClick={onClose}
            className="w-5 h-5 rounded-md bg-white/5 hover:bg-white/10 text-white/50 hover:text-white flex items-center justify-center transition-all"
            title="Close Floating HUD"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="relative z-10 flex-1 flex flex-col space-y-3">
        {/* Compact Talk-to-Listen Gauge */}
        <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-1.5 shadow-sm">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-white/60 font-medium">Talk Ratio</span>
            <span
              className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${
                isBalanced
                  ? 'text-emerald-400 bg-emerald-500/10'
                  : isDominating
                  ? 'text-amber-400 bg-amber-500/10'
                  : 'text-cyan-400 bg-cyan-500/10'
              }`}
            >
              {isBalanced ? 'Balanced' : isDominating ? 'You are dominating' : 'Listen more'}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden flex">
            <div
              className="bg-gradient-to-r from-emerald-400 to-teal-400 transition-all duration-300"
              style={{ width: `${userPercent}%` }}
            />
            <div
              className="bg-gradient-to-r from-purple-500 to-fuchsia-500 transition-all duration-300"
              style={{ width: `${themPercent}%` }}
            />
          </div>

          <div className="flex justify-between text-[10px] text-white/50 font-mono">
            <span>You: {userPercent}%</span>
            <span>Them: {themPercent}%</span>
          </div>
        </div>

        {/* Active Battlecard Card */}
        {activeBattlecard ? (
          <div className="rounded-xl bg-gradient-to-b from-[#1C152B] to-[#120F1F] border border-purple-500/30 p-3 space-y-2.5 shadow-lg shadow-purple-950/40 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center text-[10px] font-bold text-fuchsia-300 bg-fuchsia-500/15 border border-fuchsia-500/25 px-2 py-0.5 rounded-full uppercase tracking-wider">
                <Zap className="w-2.5 h-2.5 mr-1 text-fuchsia-400" />
                {activeBattlecard.headline}
              </span>
              <span className="text-[10px] font-mono text-purple-300/60">
                {activeBattlecard.latencyMs}ms local
              </span>
            </div>

            {/* Big readable teleprompter speech counter */}
            <div className="space-y-1">
              <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">
                Say this right now:
              </p>
              <div className="p-2.5 rounded-lg bg-black/50 border border-white/10">
                <p className="text-xs sm:text-sm font-medium text-white leading-relaxed select-all">
                  "{activeBattlecard.counterMove}"
                </p>
              </div>
            </div>

            {/* Quick Copy Button */}
            <button
              onClick={() => handleCopy(activeBattlecard.counterMove)}
              className="w-full py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 transition-all bg-white text-black hover:bg-slate-100 shadow-md active:scale-[0.98]"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-black" />
                  <span>Copy Spoken Response</span>
                </>
              )}
            </button>

            {/* Rationale note */}
            {activeBattlecard.rationale && (
              <p className="text-[10px] text-white/50 leading-normal border-t border-white/[0.06] pt-1.5">
                💡 {activeBattlecard.rationale}
              </p>
            )}
          </div>
        ) : (
          /* Idle / Listening State */
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 text-center space-y-2">
            <div className="w-8 h-8 rounded-full bg-purple-500/10 border border-purple-500/20 mx-auto flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
            </div>
            <p className="text-xs font-semibold text-white">Listening for Objections...</p>
            <p className="text-[11px] text-white/40 leading-relaxed">
              When client mentions price, competitor discounts, or contract terms, tactical counters appear instantly here.
            </p>
          </div>
        )}

        {/* Live Conversation Subtitle (Last Turn) */}
        {latestTurnText && (
          <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 space-y-1">
            <div className="flex items-center justify-between text-[10px] text-white/40">
              <span className="font-semibold text-fuchsia-300">Last Spoken Words</span>
              <span className="font-mono text-[9px]">RAM buffer</span>
            </div>
            <p className="text-[11px] text-white/80 line-clamp-2 leading-relaxed italic">
              "{latestTurnText}"
            </p>
          </div>
        )}

        {/* Quick Test / Objection Triggers (For testing right now) */}
        {onSimulateObjection && (
          <div className="pt-2 border-t border-white/10 space-y-1.5">
            <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">
              Quick Test Triggers:
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => onSimulateObjection('Acme Cloud offered us a 30% discount if we switch')}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] text-left text-white/80 transition-all truncate"
                title="Test 30% discount objection"
              >
                ⚡ 30% Competitor
              </button>
              <button
                onClick={() => onSimulateObjection('We require 2 board seats and 20% option pool')}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] text-left text-white/80 transition-all truncate"
                title="Test Board Seats objection"
              >
                ⚡ 2 Board Seats
              </button>
              <button
                onClick={() => onSimulateObjection('We require unlimited liability and 100% SLA cash credits')}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] text-left text-white/80 transition-all truncate"
                title="Test SLA liability objection"
              >
                ⚡ SLA Liability
              </button>
              <button
                onClick={() => onSimulateObjection('Can you match a 250k base salary with immediate equity?')}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] text-left text-white/80 transition-all truncate"
                title="Test Salary objection"
              >
                ⚡ Salary Ceiling
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <footer className="relative z-10 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-white/40">
        <span className="flex items-center">
          <ShieldCheck className="w-3 h-3 mr-1 text-emerald-400" />
          Camera Eye-Contact Mode
        </span>
        <span className="text-[9px]">Keep under camera</span>
      </footer>
    </div>
  );
};
