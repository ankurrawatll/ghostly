import React from 'react';
import { ShieldCheck, Check, Trash2, Clock, Mic, Cpu, Cloud, Lock } from 'lucide-react';
import { AnonymizedScorecard } from '../types';

interface PostCallModalProps {
  scorecard: AnonymizedScorecard;
  onSave: () => void;
  onDiscard: () => void;
}

export const PostCallModal: React.FC<PostCallModalProps> = ({
  scorecard,
  onSave,
  onDiscard
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-surfaceBorder rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center space-x-2.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Call Ended • Memory Purged</h3>
            <p className="text-[11px] text-slate-400">
              0 bytes of raw audio or speech were uploaded. RAM buffer wiped.
            </p>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-2.5 font-mono text-xs">
          <div className="bg-surface p-2.5 rounded-xl border border-surfaceBorder">
            <span className="text-[10px] text-slate-500 block">Call Duration</span>
            <div className="text-white font-bold flex items-center mt-1">
              <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" />
              {Math.floor(scorecard.durationSeconds / 60)}m {scorecard.durationSeconds % 60}s
            </div>
          </div>

          <div className="bg-surface p-2.5 rounded-xl border border-surfaceBorder">
            <span className="text-[10px] text-slate-500 block">Final Talk Ratio</span>
            <div className="text-emerald-400 font-bold flex items-center mt-1">
              <Mic className="w-3.5 h-3.5 mr-1 text-emerald-400" />
              {Math.round(scorecard.userTalkRatio * 100)}% You
            </div>
          </div>

          <div className="bg-surface p-2.5 rounded-xl border border-surfaceBorder">
            <span className="text-[10px] text-slate-500 block">Hybrid Routing</span>
            <div className="text-sky-300 font-bold flex items-center mt-1 text-[11px]">
              <Cpu className="w-3 h-3 mr-1 text-emerald-400" />
              {scorecard.localInferencesCount} Local / <Cloud className="w-3 h-3 mx-1 text-sky-400" />
              {scorecard.cloudEscalationsCount} Cloud
            </div>
          </div>

          <div className="bg-surface p-2.5 rounded-xl border border-surfaceBorder">
            <span className="text-[10px] text-slate-500 block">Raw Data Egress</span>
            <div className="text-emerald-400 font-bold flex items-center mt-1">
              <Lock className="w-3 h-3 mr-1 text-emerald-400" />
              0 B
            </div>
          </div>
        </div>

        {/* Commitments captured */}
        {scorecard.commitmentsList.length > 0 && (
          <div className="bg-surface/50 p-3 rounded-xl border border-surfaceBorder space-y-1.5">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
              Captured Commitments ({scorecard.commitmentsList.length})
            </span>
            <ul className="text-xs text-slate-300 space-y-1 max-h-24 overflow-y-auto pr-1">
              {scorecard.commitmentsList.map((comm, idx) => (
                <li key={idx} className="flex items-start space-x-1.5 text-[11px]">
                  <span className="text-emerald-400">•</span>
                  <span>{comm}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Buttons */}
        <div className="flex items-center space-x-2 pt-2 border-t border-surfaceBorder">
          <button
            onClick={onDiscard}
            className="flex-1 py-2 px-3 bg-surface hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-medium border border-surfaceBorder flex items-center justify-center transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" />
            Discard
          </button>
          <button
            onClick={onSave}
            className="flex-1 py-2 px-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center transition-colors shadow-lg shadow-emerald-500/20"
          >
            <Check className="w-3.5 h-3.5 mr-1 font-bold" />
            Save Anonymized Scorecard
          </button>
        </div>
      </div>
    </div>
  );
};
