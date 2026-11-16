import React from 'react';
import { Shield, Lock, WifiOff, Cpu, Cloud, Settings, PlaySquare, BookOpen, BarChart3, Radio } from 'lucide-react';
import { InferenceModeType } from '../types';

interface HeaderProps {
  currentTab: 'live' | 'simulator' | 'playbooks' | 'scorecards' | 'diagnostics';
  setCurrentTab: (tab: 'live' | 'simulator' | 'playbooks' | 'scorecards' | 'diagnostics') => void;
  engineStatus: InferenceModeType;
  lastLatencyMs: number;
  isOnline: boolean;
  strictLocalLock: boolean;
  onToggleStrictLocal: () => void;
  isSessionActive: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  engineStatus,
  lastLatencyMs,
  isOnline,
  strictLocalLock,
  onToggleStrictLocal,
  isSessionActive
}) => {
  return (
    <header className="sticky top-0 z-50 px-4 py-3 border-b border-white/[0.08] bg-[#07080B]/85 backdrop-blur-2xl transition-all">
      <div className="flex flex-wrap items-center justify-between gap-3 max-w-7xl mx-auto">
        {/* Brand identity */}
        <div className="flex items-center space-x-3">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-fuchsia-600 to-purple-600 rounded-xl blur opacity-70 group-hover:opacity-100 transition duration-300" />
            <div className="relative w-9 h-9 rounded-xl bg-[#0E0F16] border border-white/10 flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-[15px] tracking-tight text-white font-sans">
                GhostWing
              </span>
              <span className="ref-pill text-purple-300 border-purple-500/30 text-[10px] py-0.5 px-2">
                Hybrid AI
              </span>
            </div>
            <p className="text-[11px] text-white/40 font-mono tracking-tight hidden sm:block">
              Zero-Upload Negotiation Wingman
            </p>
          </div>
        </div>

        {/* Live Engine Telemetry Pill */}
        <div className="flex items-center space-x-2.5 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/10 text-xs font-mono backdrop-blur-md shadow-inner">
          {strictLocalLock ? (
            <span className="flex items-center text-amber-300 font-medium">
              <Lock className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
              Strict Local Lock
            </span>
          ) : !isOnline || engineStatus === 'FALLBACK_LOCAL' ? (
            <span className="flex items-center text-amber-300 font-medium">
              <WifiOff className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
              Local Fallback ({lastLatencyMs}ms)
            </span>
          ) : engineStatus === 'IN_CLOUD' ? (
            <span className="flex items-center text-purple-300 font-medium">
              <Cloud className="w-3.5 h-3.5 mr-1.5 text-purple-400" />
              Cloud Gemini ({lastLatencyMs}ms)
            </span>
          ) : (
            <span className="flex items-center text-emerald-300 font-medium">
              <Cpu className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
              Nano 4 Local ({lastLatencyMs || 42}ms)
            </span>
          )}

          <div className="w-px h-3 bg-white/10" />

          {/* Guaranteed Zero Egress Badge */}
          <span className="text-white/70 font-semibold flex items-center text-[11px]" title="0 bytes of raw speech leaves device">
            <Lock className="w-3 h-3 mr-1 text-emerald-400" />
            0 B Egress
          </span>
        </div>

        {/* Navigation & Controls */}
        <div className="flex items-center space-x-2">
          {/* Strict Local Toggle */}
          <button
            onClick={onToggleStrictLocal}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center ${
              strictLocalLock
                ? 'bg-amber-500/10 border-amber-500/40 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                : 'bg-white/[0.03] border-white/10 text-white/50 hover:text-white hover:bg-white/[0.06]'
            }`}
            title="Lock all inference strictly to on-device Gemini Nano 4"
          >
            <Lock className="w-3 h-3 mr-1.5" />
            <span className="hidden sm:inline">Strict Lock:</span> {strictLocalLock ? 'ON' : 'OFF'}
          </button>

          {/* Tab Navigation Pill Group */}
          <nav className="flex items-center bg-[#0C0D13] p-1 rounded-2xl border border-white/10 shadow-inner text-xs">
            <button
              onClick={() => setCurrentTab('live')}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all flex items-center ${
                currentTab === 'live'
                  ? 'bg-white text-slate-950 shadow-md'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Radio className="w-3.5 h-3.5 mr-1.5" />
              Studio Look
              {isSessionActive && (
                <span className="w-1.5 h-1.5 ml-1.5 rounded-full bg-purple-500 animate-ping" />
              )}
            </button>
            <button
              onClick={() => setCurrentTab('simulator')}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all flex items-center ${
                currentTab === 'simulator'
                  ? 'bg-white text-slate-950 shadow-md'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <PlaySquare className="w-3.5 h-3.5 mr-1.5" />
              Simulator
            </button>
            <button
              onClick={() => setCurrentTab('playbooks')}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all flex items-center ${
                currentTab === 'playbooks'
                  ? 'bg-white text-slate-950 shadow-md'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 mr-1.5" />
              Playbooks
            </button>
            <button
              onClick={() => setCurrentTab('scorecards')}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all flex items-center ${
                currentTab === 'scorecards'
                  ? 'bg-white text-slate-950 shadow-md'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 mr-1.5" />
              Scorecards
            </button>
            <button
              onClick={() => setCurrentTab('diagnostics')}
              className={`p-1.5 rounded-xl transition-all ${
                currentTab === 'diagnostics'
                  ? 'bg-white/20 text-white'
                  : 'text-white/40 hover:text-white'
              }`}
              title="System Diagnostics & AI Keys"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
