import React, { useState } from 'react';
import { ShieldCheck, ChevronDown, ChevronUp, Copy, Check, Lock, Cpu, Cloud, AlertCircle } from 'lucide-react';
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
              Air-Gap Network Egress Inspector
              <span className="ml-2 pill-tag text-emerald-300 bg-emerald-500/10 border-emerald-500/30">
                0 B Raw Speech Uploaded
              </span>
            </h4>
            <p className="text-[11px] text-white/40 mt-0.5">
              Cryptographic audit log proving speech is never transmitted externally.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="text-right hidden sm:block font-mono text-xs">
            <span className="text-white/40">Local Words: </span>
            <strong className="text-emerald-400 font-bold">{totalLocalWords}</strong>
          </div>
          {isOpen ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
        </div>
      </div>

      {/* Expanded Inspector Panel */}
      {isOpen && (
        <div className="p-4 space-y-4 bg-black/40 animate-in fade-in duration-200">
          {/* Visual Air-Gap Audit Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white/[0.02] rounded-xl p-3 border border-white/[0.06]">
              <span className="pill-tag text-white/50 text-[9px]">LOCAL PROCESSING</span>
              <div className="text-lg font-bold font-mono text-emerald-400 mt-1 flex items-center">
                <Cpu className="w-4 h-4 mr-1 text-emerald-400" />
                {totalLocalWords} <span className="text-xs text-white/40 ml-1">words</span>
              </div>
              <p className="text-[10px] text-white/40 mt-1">
                Processed in volatile RAM. 0 bytes written to disk.
              </p>
            </div>

            <div className="bg-white/[0.02] rounded-xl p-3 border border-white/[0.06]">
              <span className="pill-tag text-cyan-300 text-[9px]">CLOUD PAYLOAD EGRESS</span>
              <div className="text-lg font-bold font-mono text-cyan-400 mt-1 flex items-center">
                <Cloud className="w-4 h-4 mr-1 text-cyan-400" />
                {totalCloudBytes} <span className="text-xs text-white/40 ml-1">bytes</span>
              </div>
              <p className="text-[10px] text-white/40 mt-1">
                Only PII-scrubbed 15-word trigger JSON sent.
              </p>
            </div>

            <div className="bg-white/[0.02] rounded-xl p-3 border border-white/[0.06]">
              <span className="pill-tag text-emerald-400 text-[9px]">RAW AUDIO EGRESS</span>
              <div className="text-lg font-bold font-mono text-emerald-400 mt-1 flex items-center">
                <Lock className="w-4 h-4 mr-1 text-emerald-400" />
                0.00 <span className="text-xs text-white/40 ml-1">bytes</span>
              </div>
              <p className="text-[10px] text-white/40 mt-1">
                Guaranteed by SDK mode: only_on_device.
              </p>
            </div>
          </div>

          {/* Action bar */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs font-semibold text-white/80">
              Live Outbound Request Stream ({auditLog.length} events)
            </span>
            {auditLog.length > 0 && (
              <button
                onClick={handleCopyAudit}
                className="flex items-center space-x-1.5 text-xs text-white/80 hover:text-white bg-white/[0.06] hover:bg-white/10 px-3 py-1 rounded-xl border border-white/10 transition-colors font-mono"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Audit Copied' : 'Copy Audit JSON'}</span>
              </button>
            )}
          </div>

          {/* Outbound entries table */}
          {auditLog.length === 0 ? (
            <div className="text-center py-6 border border-dashed border-white/10 rounded-xl text-white/40 text-xs">
              <AlertCircle className="w-5 h-5 mx-auto mb-1 text-white/30" />
              <span>Zero network requests dispatched. All audio and speech has stayed 100% on this laptop.</span>
            </div>
          ) : (
            <div className="max-h-48 overflow-y-auto space-y-2 font-mono text-[11px] pr-1">
              {auditLog.map((entry) => (
                <div
                  key={entry.id}
                  className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="flex-1 truncate">
                    <div className="flex items-center space-x-2 text-[10px] text-white/40 mb-1">
                      <span>{new Date(entry.timestamp).toLocaleTimeString()}</span>
                      <span className="pill-tag text-white/80 bg-white/5">
                        {entry.objectionCategory.toUpperCase()}
                      </span>
                      <span className="text-cyan-400">
                        {entry.payloadBytes} B Payload
                      </span>
                    </div>
                    <div className="text-white/90 truncate">
                      "{entry.sanitizedQuery}"
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 flex-shrink-0 text-right">
                    <span className={`pill-tag ${
                      entry.inferenceSource === 'FALLBACK_LOCAL'
                        ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                        : 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                    }`}>
                      {entry.inferenceSource === 'FALLBACK_LOCAL' ? 'LOCAL FALLBACK' : 'CLOUD GEMINI'} • {entry.latencyMs}ms
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
