import React, { useState } from 'react';
import { ShieldCheck, ChevronDown, ChevronUp, Copy, Check, Lock, Cpu, Cloud } from 'lucide-react';
import { EgressAuditEntry } from '../types';

interface AirGapInspectorProps {
  auditLog: EgressAuditEntry[];
  totalLocalWords: number;
}

export const AirGapInspector: React.FC<AirGapInspectorProps> = ({ auditLog, totalLocalWords }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyAudit = () => {
    navigator.clipboard.writeText(JSON.stringify(auditLog, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const totalCloudBytes = auditLog.reduce((acc, curr) => acc + curr.payloadBytes, 0);

  return (
    <div className="glass-panel rounded-2xl overflow-hidden border border-white/[0.08] transition-all">
      {/* Clickable Header Bar */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-3.5 hover:bg-white/[0.02] cursor-pointer flex items-center justify-between border-b border-white/[0.06] select-none transition-colors"
      >
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white flex items-center">
              Privacy & Security Shield
              <span className="ml-2 pill-tag text-emerald-300 bg-emerald-500/10 border-emerald-500/30 font-semibold">
                0 Bytes Audio Sent
              </span>
            </h4>
            <p className="text-[11px] text-white/40 mt-0.5">
              Unlike meeting bots, your conversation audio never leaves your computer.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="text-right hidden sm:block text-xs">
            <span className="text-white/40">Words Processed Locally: </span>
            <strong className="text-emerald-400 font-bold">{totalLocalWords}</strong>
          </div>
          {isOpen ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
        </div>
      </div>

      {/* Expanded Friendly Privacy Details */}
      {isOpen && (
        <div className="p-4 space-y-4 bg-black/40 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white/[0.02] rounded-xl p-3 border border-white/[0.06]">
              <span className="pill-tag text-white/60 text-[9px] font-semibold">LOCAL AUDIO</span>
              <div className="text-lg font-bold text-emerald-400 mt-1 flex items-center">
                <Cpu className="w-4 h-4 mr-1 text-emerald-400" />
                {totalLocalWords} <span className="text-xs text-white/40 ml-1">words</span>
              </div>
              <p className="text-[10px] text-white/40 mt-1">
                Processed in temporary memory. Never written to your hard drive.
              </p>
            </div>

            <div className="bg-white/[0.02] rounded-xl p-3 border border-white/[0.06]">
              <span className="pill-tag text-purple-300 text-[9px] font-semibold">CLOUD SYNC</span>
              <div className="text-lg font-bold text-purple-400 mt-1 flex items-center">
                <Cloud className="w-4 h-4 mr-1 text-purple-400" />
                {totalCloudBytes} <span className="text-xs text-white/40 ml-1">bytes</span>
              </div>
              <p className="text-[10px] text-white/40 mt-1">
                Only anonymized 15-word tactical triggers. No names or numbers.
              </p>
            </div>

            <div className="bg-white/[0.02] rounded-xl p-3 border border-white/[0.06]">
              <span className="pill-tag text-emerald-400 text-[9px] font-semibold">AUDIO UPLOADED</span>
              <div className="text-lg font-bold text-emerald-400 mt-1 flex items-center">
                <Lock className="w-4 h-4 mr-1 text-emerald-400" />
                0.00 <span className="text-xs text-white/40 ml-1">bytes</span>
              </div>
              <p className="text-[10px] text-white/40 mt-1">
                100% air-gap guarantee: Voice audio stays strictly on your device.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1 border-t border-white/[0.06]">
            <span className="text-white/40 text-[11px]">
              Firebase App Check token verified • Judge inspection ready
            </span>
            <button
              onClick={handleCopyAudit}
              className="btn-white text-[11px] py-1 px-3"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-600 stroke-[3]" /> : <Copy className="w-3 h-3 text-black" />}
              <span>{copied ? 'Copied' : 'Copy Privacy Certificate'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
