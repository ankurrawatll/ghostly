import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Mic,
  Monitor,
  Play,
  Pause,
  Copy,
  Check,
  AppWindow,
  Smartphone,
  X,
  Zap,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Send
} from 'lucide-react';
import { Playbook, TacticalBattlecard, EgressAuditEntry } from '../types';
import { hybridRouter, volatileBuffer } from '../firebase/aiLogic';
import { FloatingMiniHud } from './FloatingMiniHud';
import { useDocumentPip } from '../hooks/useDocumentPip';

interface HeroStudioViewProps {
  playbooks: Playbook[];
  activePlaybook: Playbook;
  onSelectPlaybook: (id: string) => void;
  onEndCall: (durationSec: number) => void;
}

interface TranscriptTurn {
  id: string;
  speaker: 'USER' | 'COUNTERPARTY';
  text: string;
  timestamp: number;
}

export const HeroStudioView: React.FC<HeroStudioViewProps> = ({
  playbooks,
  activePlaybook,
  onSelectPlaybook,
  onEndCall
}) => {
  // Session states
  const [isCapturing, setIsCapturing] = useState(false);
  const [hasMic, setHasMic] = useState(false);
  const [hasTab, setHasTab] = useState(false);
  const [sessionSeconds, setSessionSeconds] = useState(0);

  // Audio level meters
  const [micLevel, setMicLevel] = useState(0);
  const [tabLevel, setTabLevel] = useState(0);

  // Picture-in-Picture & Desk Stand Mode states
  const { isPipActive, pipContainer, openPip, closePip } = useDocumentPip();
  const [isDeskMode, setIsDeskMode] = useState(false);
  const wakeLockRef = useRef<any>(null);

  // Real conversation telemetry
  const [talkRatio, setTalkRatio] = useState(0.5);
  const [speaker, setSpeaker] = useState<'USER' | 'COUNTERPARTY'>('USER');
  const [copied, setCopied] = useState(false);
  const [activeBattlecard, setActiveBattlecard] = useState<TacticalBattlecard | null>(null);
  const [transcriptStream, setTranscriptStream] = useState<TranscriptTurn[]>([]);
  const [auditLog, setAuditLog] = useState<EgressAuditEntry[]>([]);
  const [totalLocalWords, setTotalLocalWords] = useState<number>(0);

  // Test objection input field
  const [manualObjection, setManualObjection] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Audio stream and analysis references
  const micStreamRef = useRef<MediaStream | null>(null);
  const tabStreamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);

  // Session elapsed timer
  useEffect(() => {
    let interval: number | null = null;
    if (isCapturing) {
      interval = window.setInterval(() => setSessionSeconds(p => p + 1), 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isCapturing]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAllMedia();
      if (wakeLockRef.current) {
        try { wakeLockRef.current.release(); } catch (_) {}
      }
    };
  }, []);

  // Desk Companion Screen Wake Lock
  useEffect(() => {
    if (isDeskMode && typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
      (navigator as any).wakeLock.request('screen').then((lock: any) => {
        wakeLockRef.current = lock;
      }).catch(() => {});
    } else if (!isDeskMode && wakeLockRef.current) {
      try {
        wakeLockRef.current.release();
      } catch (_) {}
      wakeLockRef.current = null;
    }
  }, [isDeskMode]);

  const stopAllMedia = () => {
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(t => t.stop());
    }
    if (tabStreamRef.current) {
      tabStreamRef.current.getTracks().forEach(t => t.stop());
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close().catch(() => { });
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (_) { }
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
  };

  const handleCopyResponse = () => {
    if (!activeBattlecard) return;
    navigator.clipboard.writeText(activeBattlecard.counterMove);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 1. Connect User Microphone
  const connectMicrophone = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      setHasMic(true);
      setupAudioMeters();
      initSpeechRecognition();
    } catch (e) {
      alert('Microphone access blocked. Please grant microphone permissions in Chrome.');
    }
  };

  // 2. Connect Google Meet / Zoom Tab Audio via getDisplayMedia
  const connectTabAudio = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: 'browser' } as any,
        audio: true
      });
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0) {
        alert('Notice: You must check "Also share tab audio" in the Chrome tab picker to capture Google Meet audio!');
        stream.getTracks().forEach(t => t.stop());
        return;
      }
      tabStreamRef.current = stream;
      setHasTab(true);
      setupAudioMeters();
      audioTracks[0].onended = () => setHasTab(false);
    } catch (e) {
      console.debug('Tab capture cancelled:', e);
    }
  };

  // Start Meeting Wingman Session
  const toggleSession = () => {
    if (isCapturing) {
      setIsCapturing(false);
      onEndCall(sessionSeconds);
      setSessionSeconds(0);
    } else {
      setIsCapturing(true);
      if (!hasMic) connectMicrophone();
    }
  };

  // Setup Web Audio Analysers for Sound Meter
  const setupAudioMeters = () => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new AudioCtx();
    }
    const ctx = audioCtxRef.current;

    let micAnalyser: AnalyserNode | null = null;
    if (micStreamRef.current) {
      const src = ctx.createMediaStreamSource(micStreamRef.current);
      micAnalyser = ctx.createAnalyser();
      micAnalyser.fftSize = 64;
      src.connect(micAnalyser);
    }

    let tabAnalyser: AnalyserNode | null = null;
    if (tabStreamRef.current) {
      const src = ctx.createMediaStreamSource(tabStreamRef.current);
      tabAnalyser = ctx.createAnalyser();
      tabAnalyser.fftSize = 64;
      src.connect(tabAnalyser);
    }

    const check = () => {
      if (micAnalyser) {
        const d = new Uint8Array(micAnalyser.frequencyBinCount);
        micAnalyser.getByteFrequencyData(d);
        const sum = d.reduce((a, b) => a + b, 0);
        setMicLevel(Math.min(100, Math.round((sum / d.length) * 2.2)));
      }
      if (tabAnalyser) {
        const d = new Uint8Array(tabAnalyser.frequencyBinCount);
        tabAnalyser.getByteFrequencyData(d);
        const sum = d.reduce((a, b) => a + b, 0);
        setTabLevel(Math.min(100, Math.round((sum / d.length) * 2.2)));
      }
      animFrameRef.current = requestAnimationFrame(check);
    };
    check();
  };

  // Speech Recognition for Local Real-Time Transcription
  const initSpeechRecognition = () => {
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) return;
    try {
      const rec = new SpeechRec();
      rec.continuous = true;
      rec.interimResults = false;
      rec.lang = 'en-US';
      rec.onresult = (evt: any) => {
        const text = evt.results[evt.results.length - 1][0].transcript.trim();
        if (text) {
          handleIncomingDialogue(text, 'USER');
        }
      };
      rec.start();
      recognitionRef.current = rec;
    } catch (_) { }
  };

  const handleIncomingDialogue = async (text: string, spk: 'USER' | 'COUNTERPARTY') => {
    setSpeaker(spk);
    setTranscriptStream(prev => [
      ...prev.slice(-9),
      { id: `turn-${Date.now()}`, speaker: spk, text, timestamp: Date.now() }
    ]);

    const result = await hybridRouter.processLocalWindow(
      text,
      spk,
      activePlaybook,
      talkRatio
    );

    setTalkRatio(result.localState.talkRatio);
    setTotalLocalWords(volatileBuffer.getWordCount());

    if (result.battlecard) {
      setActiveBattlecard(result.battlecard);
    }
    if (result.auditEntry) {
      setAuditLog(prev => [result.auditEntry!, ...prev]);
    }
  };

  const handleManualTestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualObjection.trim()) return;
    setIsAnalyzing(true);
    await handleIncomingDialogue(manualObjection.trim(), 'COUNTERPARTY');
    setIsAnalyzing(false);
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const userPercent = Math.round(talkRatio * 100);
  const themPercent = 100 - userPercent;

  return (
    <div className="relative z-10 space-y-10 max-w-4xl mx-auto px-4 py-4">
      {/* 1. CLEAN HERO TITLE */}
      <div className="text-center space-y-2 pt-2">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>100% Private On-Device Wingman • 0 Bytes Uploaded</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Live Meeting Wingman
        </h1>
        <p className="text-sm text-white/50 max-w-xl mx-auto">
          Delivers tactical objection battlecards directly over Google Meet & Zoom without switching tabs.
        </p>
      </div>

      {/* 2. MAIN COCKPIT CARD */}
      <div className="relative rounded-3xl bg-[#0B0C12] border border-white/10 p-6 sm:p-8 space-y-6 shadow-2xl overflow-hidden">
        {/* Ambient glow behind card */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-40 bg-purple-600/20 blur-3xl pointer-events-none" />

        {/* Audio Input Selectors */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Channel 1: Microphone */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${hasMic ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-white/5 border-white/10 text-white/40'}`}>
                <Mic className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Your Microphone</p>
                <p className="text-[11px] text-white/40">{hasMic ? `Input Level: ${micLevel}%` : 'Connect voice mic'}</p>
              </div>
            </div>
            {!hasMic ? (
              <button
                onClick={connectMicrophone}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-all cursor-pointer"
              >
                Connect
              </button>
            ) : (
              <span className="text-xs text-emerald-400 font-semibold px-2 py-1 bg-emerald-500/10 rounded-lg">
                Ready
              </span>
            )}
          </div>

          {/* Channel 2: Google Meet Tab Audio */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${hasTab ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' : 'bg-white/5 border-white/10 text-white/40'}`}>
                <Monitor className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Google Meet / Zoom</p>
                <p className="text-[11px] text-white/40">{hasTab ? `Tab Audio: ${tabLevel}%` : 'Pick meeting tab'}</p>
              </div>
            </div>
            {!hasTab ? (
              <button
                onClick={connectTabAudio}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-all cursor-pointer"
              >
                Pick Tab
              </button>
            ) : (
              <span className="text-xs text-cyan-400 font-semibold px-2 py-1 bg-cyan-500/10 rounded-lg">
                Ready
              </span>
            )}
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/10">
          <div className="flex flex-wrap items-center gap-3">
            {/* Big Main Button */}
            <button
              onClick={toggleSession}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all shadow-lg cursor-pointer ${
                isCapturing
                  ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/20'
                  : 'bg-white hover:bg-slate-100 text-black shadow-white/10'
              }`}
            >
              {isCapturing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isCapturing ? `End Meeting (${formatTime(sessionSeconds)})` : 'Start Meeting Wingman'}</span>
            </button>

            {/* Float Mini-HUD Button */}
            <button
              onClick={() => isPipActive ? closePip() : openPip()}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all border shadow-md cursor-pointer ${
                isPipActive
                  ? 'bg-purple-600 text-white border-purple-400 shadow-purple-500/30'
                  : 'bg-white/5 hover:bg-white/10 text-purple-300 border-purple-500/30'
              }`}
              title="Pop out an always-on-top floating teleprompter directly beneath your webcam"
            >
              <AppWindow className="w-4 h-4 text-purple-300" />
              <span>{isPipActive ? '🪟 Mini-HUD Floating' : '🪟 Float Mini-HUD (Webcam)'}</span>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsDeskMode(!isDeskMode)}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-white/70 border border-white/10 flex items-center transition-all cursor-pointer"
              title="Phone on Desk Companion mode"
            >
              <Smartphone className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
              <span>Phone Stand</span>
            </button>
          </div>
        </div>

        {/* Live Talk Ratio Bar */}
        <div className="relative z-10 p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/60 font-medium">Talk-to-Listen Balance</span>
            <span className="font-mono text-xs font-semibold text-white/80">
              You: <strong className="text-emerald-400">{userPercent}%</strong> • Them: <strong className="text-purple-400">{themPercent}%</strong>
            </span>
          </div>
          <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden flex">
            <div
              className="bg-gradient-to-r from-emerald-400 to-teal-400 transition-all duration-300"
              style={{ width: `${userPercent}%` }}
            />
            <div
              className="bg-gradient-to-r from-purple-500 to-fuchsia-500 transition-all duration-300"
              style={{ width: `${themPercent}%` }}
            />
          </div>
        </div>

        {/* Active Tactical Battlecard (Surfaces when objection is detected) */}
        {activeBattlecard ? (
          <div className="relative z-10 rounded-2xl bg-gradient-to-b from-[#1E1730] to-[#120F1F] border border-purple-500/40 p-5 space-y-3 shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center text-xs font-bold text-fuchsia-300 bg-fuchsia-500/20 border border-fuchsia-500/30 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                <Zap className="w-3 h-3 mr-1 text-fuchsia-400" />
                {activeBattlecard.headline}
              </span>
              <span className="text-[11px] font-mono text-purple-300/60">
                {activeBattlecard.latencyMs}ms local
              </span>
            </div>

            <div className="space-y-1">
              <p className="text-[11px] font-semibold text-white/40 uppercase tracking-wider">
                Say this in your call:
              </p>
              <p className="text-base sm:text-lg font-bold text-white leading-relaxed select-all">
                "{activeBattlecard.counterMove}"
              </p>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-white/[0.08]">
              <span className="text-xs text-white/50">
                💡 {activeBattlecard.rationale}
              </span>
              <button
                onClick={handleCopyResponse}
                className="px-3 py-1.5 rounded-xl bg-white text-black hover:bg-slate-100 text-xs font-bold flex items-center space-x-1.5 transition-all shadow-md cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-black" />}
                <span>{copied ? 'Copied' : 'Copy Response'}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="relative z-10 p-5 rounded-2xl bg-white/[0.02] border border-white/10 text-center space-y-2">
            <div className="w-8 h-8 rounded-full bg-purple-500/10 border border-purple-500/20 mx-auto flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-purple-400" />
            </div>
            <p className="text-xs font-semibold text-white">Tactical Battlecard Slot</p>
            <p className="text-[11px] text-white/40 max-w-md mx-auto leading-relaxed">
              When client mentions pricing, competitor discounts, or contract terms, tactical counters appear here in under 50ms.
            </p>
          </div>
        )}

        {/* Quick Objection Tester Bar */}
        <div className="relative z-10 pt-2 border-t border-white/10 space-y-2">
          <form onSubmit={handleManualTestSubmit} className="flex gap-2">
            <input
              type="text"
              value={manualObjection}
              onChange={(e) => setManualObjection(e.target.value)}
              placeholder='Test an objection (e.g. "Acme is 30% cheaper", "We need 2 board seats")...'
              className="flex-1 bg-black/50 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-purple-500 transition-all"
            />
            <button
              type="submit"
              disabled={isAnalyzing || !manualObjection.trim()}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer"
            >
              <span>{isAnalyzing ? 'Analyzing...' : 'Test Counter'}</span>
              <Send className="w-3 h-3" />
            </button>
          </form>

          {/* Quick Clickable Test Pills */}
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-white/40">
            <span className="mr-1">Quick test:</span>
            <button
              type="button"
              onClick={() => handleIncomingDialogue('Acme Cloud offered us a 30% discount if we switch', 'COUNTERPARTY')}
              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-all cursor-pointer"
            >
              ⚡ 30% Discount
            </button>
            <button
              type="button"
              onClick={() => handleIncomingDialogue('We require 2 board seats and a 20% option pool pre-money', 'COUNTERPARTY')}
              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-all cursor-pointer"
            >
              ⚡ 2 Board Seats
            </button>
            <button
              type="button"
              onClick={() => handleIncomingDialogue('Can you match a 250k base salary with immediate equity vesting?', 'COUNTERPARTY')}
              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-all cursor-pointer"
            >
              ⚡ Salary Ceiling
            </button>
          </div>
        </div>
      </div>

      {/* 3. MEETING STRATEGIES (4 CLEAN PLAYBOOK CARDS) */}
      <div className="space-y-4 pt-4 border-t border-white/[0.08]">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Armed Strategy: <span className="text-purple-400">{activePlaybook.title}</span>
            </h2>
            <p className="text-xs text-white/40">
              Click a strategy to ground your wingman in custom battlecards and walk-away guardrails.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {playbooks.map((playbook) => {
            const isActive = playbook.id === activePlaybook.id;
            return (
              <div
                key={playbook.id}
                onClick={() => onSelectPlaybook(playbook.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isActive
                    ? 'bg-purple-950/20 border-purple-500 shadow-lg shadow-purple-950/50'
                    : 'bg-[#0B0C12] border-white/10 hover:border-white/20'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">
                      {playbook.scenarioType}
                    </span>
                    {isActive && (
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <h3 className="text-xs font-bold text-white">{playbook.title}</h3>
                  <p className="text-[11px] text-white/50 line-clamp-2 leading-relaxed">
                    {playbook.description}
                  </p>
                </div>
                <div className="pt-3 mt-3 border-t border-white/[0.06] text-[10px] text-white/40 flex items-center justify-between">
                  <span>{playbook.rules.length} Battlecards</span>
                  <span className={isActive ? 'text-purple-400 font-bold' : 'text-white/60'}>
                    {isActive ? 'Armed' : 'Select →'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Picture-in-Picture Mini-HUD Portal (Always-On-Top on Desktop over Google Meet) */}
      {pipContainer && createPortal(
        <FloatingMiniHud
          activeBattlecard={activeBattlecard}
          talkRatio={talkRatio}
          speaker={speaker}
          latestTurnText={transcriptStream[transcriptStream.length - 1]?.text}
          isCapturing={isCapturing}
          onSimulateObjection={(objText) => handleIncomingDialogue(objText, 'COUNTERPARTY')}
          onClose={closePip}
        />,
        pipContainer
      )}

      {/* Desk Companion Mode (Phone on Desk Stand View) */}
      {isDeskMode && (
        <div className="fixed inset-0 z-50 bg-[#07080B] flex flex-col p-6 sm:p-10 font-sans selection:bg-purple-500/30 overflow-y-auto">
          {/* Top Bar with Screen Wake Lock Indicator */}
          <div className="relative z-10 flex items-center justify-between pb-4 border-b border-white/10 mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_12px_#34D399]" />
              <div>
                <h1 className="text-lg font-bold text-white flex items-center">
                  GhostWing Desk Companion
                  <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Screen Awake ON
                  </span>
                </h1>
                <p className="text-xs text-white/50">High-visibility teleprompter propped on your desk next to your laptop</p>
              </div>
            </div>

            <button
              onClick={() => setIsDeskMode(false)}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/15 flex items-center space-x-1.5 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span>Exit Desk Stand</span>
            </button>
          </div>

          {/* Big Live Talk Ratio Gauge */}
          <div className="relative z-10 p-5 rounded-2xl bg-white/[0.03] border border-white/10 mb-6 max-w-4xl mx-auto w-full space-y-2">
            <div className="flex items-center justify-between text-sm text-white/70">
              <span className="font-semibold">Live Meeting Balance</span>
              <span className="font-mono text-emerald-400 font-bold">
                You: {Math.round(talkRatio * 100)}% • Them: {100 - Math.round(talkRatio * 100)}%
              </span>
            </div>
            <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden flex">
              <div
                className="bg-gradient-to-r from-emerald-400 to-teal-400 transition-all duration-300"
                style={{ width: `${Math.round(talkRatio * 100)}%` }}
              />
              <div
                className="bg-gradient-to-r from-purple-500 to-fuchsia-500 transition-all duration-300"
                style={{ width: `${100 - Math.round(talkRatio * 100)}%` }}
              />
            </div>
          </div>

          {/* Large High-Contrast Tactical Battlecard */}
          <div className="relative z-10 flex-1 max-w-4xl mx-auto w-full flex flex-col justify-center">
            {activeBattlecard ? (
              <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-b from-[#1C152B] to-[#100D1C] border border-purple-500/40 shadow-2xl space-y-6">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center text-xs font-bold text-fuchsia-300 bg-fuchsia-500/20 border border-fuchsia-500/30 px-3 py-1 rounded-full uppercase tracking-wider">
                    <Zap className="w-3.5 h-3.5 mr-1.5 text-fuchsia-400" />
                    {activeBattlecard.headline}
                  </span>
                  <span className="text-xs font-mono text-purple-300/70">
                    {activeBattlecard.latencyMs}ms local
                  </span>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-bold text-white/40 uppercase tracking-widest">
                    Say this right now:
                  </p>
                  <p className="text-2xl sm:text-3xl font-bold text-white leading-tight">
                    "{activeBattlecard.counterMove}"
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-black/40 border border-white/10 text-sm text-purple-200/90 leading-relaxed">
                  💡 <strong>Strategic Rationale:</strong> {activeBattlecard.rationale}
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(activeBattlecard.counterMove);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="btn-white text-sm py-3 px-6 shadow-xl cursor-pointer"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-black" />}
                    <span>{copied ? 'Copied to Clipboard!' : 'Copy Spoken Counter'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center rounded-3xl bg-white/[0.02] border border-white/10 space-y-4">
                <div className="w-16 h-16 rounded-full bg-purple-500/10 border border-purple-500/20 mx-auto flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-purple-400 animate-pulse" />
                </div>
                <h3 className="text-xl font-bold text-white">Desk Stand Armed & Listening</h3>
                <p className="text-sm text-white/50 max-w-md mx-auto leading-relaxed">
                  Leave your phone propped up on your desk stand during your call. When an objection is pushed, high-contrast battlecards appear here.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
