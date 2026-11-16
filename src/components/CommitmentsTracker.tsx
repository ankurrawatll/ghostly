import React, { useState } from 'react';
import { CheckSquare, Copy, Check, ListChecks } from 'lucide-react';

interface CommitmentsTrackerProps {
  commitments: string[];
}

export const CommitmentsTracker: React.FC<CommitmentsTrackerProps> = ({ commitments }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyAll = () => {
    if (commitments.length === 0) return;
    navigator.clipboard.writeText(commitments.map((c, i) => `${i + 1}. ${c}`).join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-card border border-surfaceBorder rounded-xl p-3.5 shadow-sm">
      <div className="flex items-center justify-between text-xs mb-2.5">
        <span className="text-slate-400 font-medium flex items-center">
          <ListChecks className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
          Extracted Commitments & Promises
          <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px] text-slate-300">
            {commitments.length}
          </span>
        </span>

        {commitments.length > 0 && (
          <button
            onClick={handleCopyAll}
            className="flex items-center space-x-1 text-slate-400 hover:text-white text-[11px] transition-colors"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'Copied' : 'Copy All'}</span>
          </button>
        )}
      </div>

      {commitments.length === 0 ? (
        <p className="text-[11px] text-slate-500 italic py-2">
          No commitments detected yet. Promises made by either party ("I will send", "we will review") are captured here automatically.
        </p>
      ) : (
        <ul className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
          {commitments.map((item, idx) => (
            <li
              key={idx}
              className="text-xs bg-surface/60 border border-surfaceBorder/80 rounded-lg p-2 text-slate-200 flex items-start space-x-2"
            >
              <CheckSquare className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
              <span className="leading-snug text-[11.5px]">{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
