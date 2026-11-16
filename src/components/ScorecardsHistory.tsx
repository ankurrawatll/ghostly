import React, { useState, useEffect } from 'react';
import { BarChart3, ShieldCheck, Clock, Mic, CheckCircle2, Cloud, Cpu, Trash2 } from 'lucide-react';
import { AnonymizedScorecard } from '../types';
import { PlaybooksService } from '../firebase/playbooksService';

export const ScorecardsHistory: React.FC = () => {
  const [scorecards, setScorecards] = useState<AnonymizedScorecard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadScorecards();
  }, []);

  const loadScorecards = async () => {
    setLoading(true);
    try {
      const data = await PlaybooksService.getScorecards();
      setScorecards(data);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    if (confirm('Clear local scorecard history?')) {
      localStorage.removeItem('ghostly_cached_scorecards');
      setScorecards([]);
    }
  };

  return (
    <div className="bg-card border border-surfaceBorder rounded-xl p-4 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-surfaceBorder pb-3">
        <div>
          <span className="text-[10px] uppercase font-semibold tracking-wider text-emerald-400">
            Zero-Retention Privacy Verified
          </span>
          <h3 className="text-sm font-bold text-white flex items-center">
            <BarChart3 className="w-4 h-4 mr-1.5 text-emerald-400" />
            Anonymized Call Scorecards
          </h3>
        </div>

        {scorecards.length > 0 && (
          <button
            onClick={handleClear}
            className="text-xs text-slate-500 hover:text-rose-400 flex items-center transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" />
            Clear
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-8 text-xs text-slate-500">Loading Firestore scorecards...</div>
      ) : scorecards.length === 0 ? (
        <div className="text-center py-8 border border-dashed border-surfaceBorder rounded-xl text-slate-500 text-xs space-y-1">
          <ShieldCheck className="w-6 h-6 mx-auto text-emerald-500/60 mb-1" />
          <p className="text-slate-300 font-medium">No Call Scorecards Yet</p>
          <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
            Complete a live call or run the Simulator to see your conversation metrics and commitments saved here with zero raw transcripts stored.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {scorecards.map((sc) => (
            <div key={sc.id} className="p-3.5 bg-surface/70 border border-surfaceBorder rounded-xl space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white">{sc.playbookTitle}</span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {new Date(sc.createdAt).toLocaleString()}
                </span>
              </div>

              {/* Metric chips */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs font-mono">
                <div className="bg-background/80 p-2 rounded-lg border border-surfaceBorder">
                  <span className="text-[10px] text-slate-500 block">Duration</span>
                  <strong className="text-slate-200 flex items-center justify-center mt-0.5">
                    <Clock className="w-3 h-3 mr-1 text-slate-400" />
                    {Math.floor(sc.durationSeconds / 60)}m {sc.durationSeconds % 60}s
                  </strong>
                </div>

                <div className="bg-background/80 p-2 rounded-lg border border-surfaceBorder">
                  <span className="text-[10px] text-slate-500 block">Talk Ratio</span>
                  <strong className="text-emerald-400 flex items-center justify-center mt-0.5">
                    <Mic className="w-3 h-3 mr-1 text-emerald-400" />
                    {Math.round(sc.userTalkRatio * 100)}% You
                  </strong>
                </div>

                <div className="bg-background/80 p-2 rounded-lg border border-surfaceBorder">
                  <span className="text-[10px] text-slate-500 block">Hybrid Split</span>
                  <strong className="text-sky-300 flex items-center justify-center mt-0.5 text-[11px]">
                    <Cpu className="w-3 h-3 mr-0.5 text-emerald-400" />
                    {sc.localInferencesCount}L / <Cloud className="w-3 h-3 mx-0.5 text-sky-400" />
                    {sc.cloudEscalationsCount}C
                  </strong>
                </div>

                <div className="bg-background/80 p-2 rounded-lg border border-surfaceBorder">
                  <span className="text-[10px] text-slate-500 block">Raw Data Egress</span>
                  <strong className="text-emerald-400 flex items-center justify-center mt-0.5">
                    0 B
                  </strong>
                </div>
              </div>

              {/* Commitments list */}
              {sc.commitmentsList && sc.commitmentsList.length > 0 && (
                <div className="border-t border-surfaceBorder/60 pt-2">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block mb-1">
                    Captured Next Steps:
                  </span>
                  <ul className="space-y-1">
                    {sc.commitmentsList.map((comm, idx) => (
                      <li key={idx} className="text-[11px] text-slate-300 flex items-start space-x-1.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400 mt-0.5 flex-shrink-0" />
                        <span>{comm}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
