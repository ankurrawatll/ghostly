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
    <header className="sticky top-0 z-50 px-4 py-3 border-b border-white/[0.08] bg-[#07080B]/90 backdrop-blur-2xl transition-all">
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
              <span className="ref-pill text-emerald-300 border-emerald-500/30 text-[10px] py-0.5 px-2 font-semibold">
                100% Private
              </span>
            </div>
            <p className="text-[11px] text-white/40 tracking-tight hidden sm:block">
              AI Meeting Wingman • No Bots Allowed
            </p>
          </div>
        </div>

        {/* Clean, Non-Technical Privacy & AI Status */}
        <div className="flex items-center space-x-2.5 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-xs backdrop-blur-md shadow-inner">
          <div className="flex items-center space-x-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-white/80 font-medium">
              {!isOnline || strictLocalLock ? 'Offline Safe (On-Device)' : 'Private On-Device AI'}
            </span>
          </div>

          <div className="w-px h-3 bg-white/15" />

          {/* Guaranteed Zero Audio Upload Badge */}
          <span className="text-emerald-400 font-semibold flex items-center text-[11px]" title="Zero audio is ever uploaded to any cloud server">
            <Lock className="w-3 h-3 mr-1 text-emerald-400" />
            No Cloud Audio
          </span>
        </div>

        {/* Navigation & Controls */}
        <div className="flex items-center space-x-2">
          {/* Simple Tab Navigation */}
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
              Live Wingman
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
              Call Simulator
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
              Meeting Notes
            </button>
            <button
              onClick={() => setCurrentTab('diagnostics')}
              className={`p-1.5 rounded-xl transition-all ${
                currentTab === 'diagnostics'
                  ? 'bg-white/20 text-white'
                  : 'text-white/40 hover:text-white'
              }`}
              title="Settings & System Diagnostics"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
