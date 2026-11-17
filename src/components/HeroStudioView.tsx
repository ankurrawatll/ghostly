import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Mic,
  Monitor,
  Wifi,
  WifiOff,
  ShieldCheck,
  Play,
  Pause,
  Radio,
  Check,
  Copy,
  Lock,
  Sparkles,
  AppWindow,
  Smartphone,
  X,
  Zap
} from 'lucide-react';
import { Playbook, TacticalBattlecard, EgressAuditEntry } from '../types';
import { hybridRouter, volatileBuffer } from '../firebase/aiLogic';
import { AirGapInspector } from './AirGapInspector';
import { MacSimulationWindow } from './MacSimulationWindow';
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
  const [simulatedOffline, setSimulatedOffline] = useState(false);

  // Audio level meters
  const [micLevel, setMicLevel] = useState(0);
  const [tabLevel, setTabLevel] = useState(0);

  // Picture-in-Picture & Desk Stand Mode states
  const { isPipActive, isSupported: isPipSupported, pipContainer, openPip, closePip } = useDocumentPip();
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

  const toggleAirplaneMode = () => {
    const next = !simulatedOffline;
    setSimulatedOffline(next);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event(next ? 'offline' : 'online'));
    }
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="relative z-10 space-y-12 max-w-7xl mx-auto px-2 sm:px-4 py-3">
      {/* 1. TOP SECTION: LIVE MEETING HUB (LEFT) + INTERACTIVE DEMO (RIGHT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">

        {/* LEFT COLUMN: LIVE MEETING SOUND HUB & PRIVATE TRANSCRIPT */}
        <div className="lg:col-span-6 space-y-5">
          {/* Main Visualizer Container */}
          <div className="relative group">
            <div className="absolute -inset-1.5 bg-gradient-to-r from-purple-600/30 via-fuchsia-600/35 to-indigo-600/30 rounded-[32px] blur-2xl opacity-60 group-hover:opacity-90 transition duration-700 pointer-events-none" />

            <div className="relative rounded-[28px] bg-[#0A0B10] border border-white/10 overflow-hidden shadow-2xl p-6 space-y-5">

              {/* Vertical fluted glass overlay */}
              <div className="absolute inset-0 fluted-glass-overlay pointer-events-none opacity-60" />
              <div className="absolute inset-0 film-grain pointer-events-none opacity-30" />

              {/* Reactive radiant audio bloom */}
              <div
                className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[70px] pointer-events-none transition-transform duration-200"
                style={{
                  width: '300px',
                  height: '300px',
                  background: 'radial-gradient(circle, rgba(232,0,255,0.35) 0%, rgba(147,51,234,0.25) 45%, rgba(67,24,160,0.12) 75%, transparent 100%)',
                  transform: `translate(-50%, -50%) scale(${1 + (micLevel + tabLevel) / 100 * 0.4})`
                }}
              />

              {/* Friendly Non-Technical Status Pills */}
              <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center space-x-2">
                  <span className="ref-pill text-white bg-black/60 border-white/20 font-bold">
                    {isCapturing ? '● LISTENING LIVE' : 'READY TO JOIN'}
                  </span>
                  <span className="ref-pill text-emerald-400 bg-emerald-500/10 border-emerald-500/30 font-semibold">
                    100% PRIVATE
                  </span>
                  <span className="ref-pill text-purple-300 bg-purple-500/20 border-purple-500/30 text-[10px]">
                    NO CLOUD AUDIO
                  </span>
                </div>

                {isCapturing && (
                  <div className="text-xs font-mono text-white/80 bg-black/60 px-3 py-1 rounded-full border border-white/10">
                    ⏱️ {formatTime(sessionSeconds)}
                  </div>
                )}
              </div>

              {/* Center Audio Reactive Soundwave */}
              <div className="relative z-10 py-3 flex flex-col items-center justify-center">
                <div className="flex items-center justify-center space-x-2 h-20">
                  {[30, 55, 80, 95, 70, 100, 85, 60, 90, 75, 45, 65, 85, 40].map((h, i) => (
                    <div
                      key={i}
                      className="w-2.5 rounded-full bg-gradient-to-t from-fuchsia-500 via-purple-300 to-white transition-all duration-100 shadow-[0_0_12px_rgba(217,70,239,0.7)]"
                      style={{
                        height: `${Math.max(12, (h * ((micLevel + tabLevel) || (isCapturing ? 20 : 12))) / 100 * 1.6)}px`,
                        opacity: 0.6 + (i % 3) * 0.15
                      }}
                    />
                  ))}
                </div>
                <p className="text-[11px] text-white/50 mt-2">
                  {isCapturing
                    ? `Active Voice Input: Mic (${micLevel}%) • Meeting Audio (${tabLevel}%)`
                    : 'Sound wave standby • Connect your mic or select your Google Meet tab'}
                </p>
              </div>

              {/* Simple Audio Connectors */}
              <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {/* Channel 1: Microphone */}
                <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center">
                      <Mic className={`w-4 h-4 ${hasMic ? 'text-emerald-400' : 'text-white/40'}`} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Your Microphone</p>
                      <p className="text-[11px] text-white/40">Your voice</p>
                    </div>
                  </div>
                  {!hasMic ? (
                    <button
                      onClick={connectMicrophone}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-all"
                    >
                      Connect
                    </button>
                  ) : (
                    <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg font-semibold">
                      Connected
                    </span>
                  )}
                </div>

                {/* Channel 2: Google Meet / Zoom Tab Audio */}
                <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center">
                      <Monitor className={`w-4 h-4 ${hasTab ? 'text-cyan-400' : 'text-white/40'}`} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Google Meet / Zoom</p>
                      <p className="text-[11px] text-white/40">Meeting audio</p>
                    </div>
                  </div>
                  {!hasTab ? (
                    <button
                      onClick={connectTabAudio}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-all"
                    >
                      Pick Tab
                    </button>
                  ) : (
                    <span className="text-xs text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded-lg font-semibold">
                      Connected
                    </span>
                  )}
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/10">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={toggleSession}
                    className="btn-white text-xs cursor-pointer shadow-lg"
                  >
                    {isCapturing ? <Pause className="w-4 h-4 text-black" /> : <Play className="w-4 h-4 text-black" />}
                    <span>{isCapturing ? 'End Meeting & Get Summary' : 'Start Meeting Wingman'}</span>
                  </button>

                  {/* Float Mini-HUD (Webcam Teleprompter) */}
                  <button
                    onClick={() => isPipActive ? closePip() : openPip()}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center transition-all border shadow-md ${
                      isPipActive
                        ? 'bg-purple-600 text-white border-purple-400 shadow-purple-500/30'
                        : 'bg-purple-950/40 hover:bg-purple-900/50 text-purple-200 border-purple-500/30'
                    }`}
                    title="Pop out an always-on-top floating teleprompter directly beneath your laptop camera"
                  >
                    <AppWindow className="w-3.5 h-3.5 mr-1.5 text-purple-300" />
                    <span>{isPipActive ? '🪟 Mini-HUD Floating' : '🪟 Float Mini-HUD (Webcam)'}</span>
                  </button>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setIsDeskMode(!isDeskMode)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center transition-all border ${
                      isDeskMode
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                    }`}
                    title="Toggle high-contrast companion display for phone/tablet placed on desk"
                  >
                    <Smartphone className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                    <span>{isDeskMode ? 'Desk Stand: ON' : 'Phone on Desk Mode'}</span>
                  </button>

                  <button
                    onClick={toggleAirplaneMode}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center transition-all border ${
                      simulatedOffline
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                        : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                    }`}
                    title="Test offline AI on your laptop"
                  >
                    {simulatedOffline ? <WifiOff className="w-3.5 h-3.5 mr-1 text-amber-400" /> : <Wifi className="w-3.5 h-3.5 mr-1" />}
                    {simulatedOffline ? 'Offline: ON' : 'Test Offline AI'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Live In-Memory Conversation Stream */}
          <div className="rounded-2xl bg-[#0B0C12] border border-white/10 p-4 space-y-3 shadow-xl">
            <div className="flex items-center justify-between text-xs text-white/50 border-b border-white/[0.06] pb-2">
              <span className="flex items-center font-medium">
                <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
                Live Conversation Subtitles
              </span>
              <span className="text-[11px] text-white/40">Auto-deleted when meeting ends</span>
            </div>

            {transcriptStream.length === 0 ? (
              <div className="py-8 text-center space-y-2 select-none">
                <div className="w-9 h-9 rounded-full bg-white/[0.04] border border-white/10 mx-auto flex items-center justify-center">
                  <Radio className="w-4 h-4 text-purple-400" />
                </div>
                <p className="text-xs font-semibold text-white/80">Ready for your call</p>
                <p className="text-[11px] text-white/40 max-w-sm mx-auto leading-relaxed">
                  Your spoken words will appear here in real time during the call. Everything stays inside your computer's temporary memory and disappears the moment you hang up.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {transcriptStream.map((turn) => {
                  const isUser = turn.speaker === 'USER';
                  return (
                    <div
                      key={turn.id}
                      className={`p-2.5 rounded-xl text-xs leading-relaxed transition-all ${isUser
                        ? 'bg-white/[0.04] border border-white/[0.08] text-white/90 ml-6'
                        : 'bg-purple-950/20 border border-purple-500/20 text-purple-200 mr-6'
                        }`}
                    >
                      <div className="flex items-center justify-between text-[10px] text-white/40 mb-1">
                        <span className={isUser ? 'text-emerald-400 font-bold' : 'text-fuchsia-400 font-bold'}>
                          {isUser ? 'You' : 'Client / Counterparty'}
                        </span>
                      </div>
                      <p>{turn.text}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Active Live Battlecard (Surfaces live during real call) */}
          {activeBattlecard && (
            <div className="rounded-2xl bg-[#0E0F16] border border-purple-500/40 p-4 space-y-3 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between">
                <span className="ref-pill text-purple-300 bg-purple-500/20 border-purple-500/30 text-[10px] font-bold">
                  RECOMMENDED RESPONSE
                </span>
                <span className="text-xs text-white/50">
                  {activeBattlecard.latencyMs}ms instant
                </span>
              </div>
              <p className="text-sm font-bold text-white leading-relaxed">
                "{activeBattlecard.counterMove}"
              </p>
              <div className="flex items-center justify-between pt-1 border-t border-white/[0.06]">
                <span className="text-[11px] text-white/40">
                  Strategy: {activeBattlecard.sourceRule}
                </span>
                <button
                  onClick={handleCopyResponse}
                  className="btn-white text-xs"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-600 stroke-[3]" /> : <Copy className="w-3 h-3 text-black" />}
                  <span>{copied ? 'Copied' : 'Copy What to Say'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: MAC-STYLE INTERACTIVE SIMULATION (ELEVATED & GLOWING) */}
        <div className="lg:col-span-6 space-y-5">
          {/* Animated Mac Window */}
          <MacSimulationWindow />

          {/* Privacy & Security Shield */}
          <AirGapInspector auditLog={auditLog} totalLocalWords={totalLocalWords} />
        </div>
      </div>

      {/* 2. BOTTOM SECTION: MEETING STRATEGIES & PLAYBOOKS */}
      <div className="space-y-6 pt-6 border-t border-white/[0.08]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              <span>Meeting Strategies & Playbooks</span>
              <span className="ref-pill text-purple-300 border-purple-500/30 text-[10px]">
                Ready to Arm
              </span>
            </h2>
            <p className="text-xs text-white/50 mt-1">
              Select a strategy to equip your wingman with objection counters and negotiation guardrails for your call.
            </p>
          </div>

          <span className="text-xs text-white/40">
            Active Strategy: <strong className="text-white">{activePlaybook.title}</strong>
          </span>
        </div>

        {/* 4 Clean Playbook Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {playbooks.map((playbook) => {
            const isActive = playbook.id === activePlaybook.id;

            const theme = playbook.scenarioType === 'sales'
              ? { bg: 'from-rose-600 via-orange-600 to-amber-500', tag: 'Sales Call' }
              : playbook.scenarioType === 'fundraising'
                ? { bg: 'from-violet-600 via-indigo-600 to-blue-500', tag: 'Investor Pitch' }
                : playbook.scenarioType === 'recruiting'
                  ? { bg: 'from-cyan-500 via-blue-600 to-purple-600', tag: 'Salary & Comp' }
                  : { bg: 'from-fuchsia-600 via-pink-600 to-rose-600', tag: 'Legal & Risk' };

            return (
              <div
                key={playbook.id}
                onClick={() => onSelectPlaybook(playbook.id)}
                className={`ref-card p-4 flex flex-col justify-between cursor-pointer group transition-all ${isActive
                  ? 'border-purple-500/80 bg-white/[0.08] shadow-[0_0_30px_rgba(168,85,247,0.3)] ring-1 ring-purple-500/50'
                  : ''
                  }`}
              >
                <div>
                  <div className={`h-24 w-full rounded-2xl relative overflow-hidden p-3 flex flex-col justify-between bg-gradient-to-br ${theme.bg}`}>
                    <div className="absolute inset-0 fluted-bars-fine opacity-40" />
                    <div className="absolute inset-0 film-grain opacity-40" />

                    <div className="relative z-10 flex items-center justify-between">
                      <span className="ref-pill bg-black/60 text-white border-white/20 text-[9px] font-bold">
                        {theme.tag}
                      </span>
                      {isActive && (
                        <span className="ref-pill bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[9px] font-bold">
                          ACTIVE
                        </span>
                      )}
                    </div>

                    <div className="relative z-10 flex items-center justify-between text-[11px] text-white/90">
                      <span>{playbook.rules.length} Tactical Moves</span>
                      <span>{playbook.walkAwayGuardrails.length} Guardrails</span>
                    </div>
                  </div>

                  <div className="pt-3.5 pb-2 space-y-1">
                    <h3 className="text-base font-bold text-white tracking-tight group-hover:text-purple-300 transition-colors">
                      {playbook.title}
                    </h3>
                    <p className="text-xs text-white/50 line-clamp-2 leading-relaxed">
                      {playbook.description}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px]">
                  <span className="text-white/40 truncate max-w-[170px]">
                    "{playbook.rules[0]?.triggerTopic || 'Pricing defense'}"
                  </span>
                  <span className={`font-semibold ${isActive ? 'text-purple-400' : 'text-white/60 group-hover:text-white'}`}>
                    {isActive ? 'Armed' : 'Select Strategy →'}
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
          {/* Ambient Lighting */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-80 bg-gradient-to-b from-purple-600/30 via-fuchsia-600/10 to-transparent pointer-events-none" />

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
                    Say this right now (readable from desk):
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
                  Leave your phone propped up on your desk stand during your call. When Marcus Vance or an enterprise lead pushes an objection, giant high-contrast battlecards will illuminate here.
                </p>

                {/* Quick Simulated Triggers */}
                <div className="pt-6 border-t border-white/10 flex flex-wrap justify-center gap-2">
                  <button
                    onClick={() => handleIncomingDialogue('Acme Cloud offered us a 30% discount if we switch', 'COUNTERPARTY')}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white border border-white/15 cursor-pointer"
                  >
                    ⚡ Test 30% Competitor Discount
                  </button>
                  <button
                    onClick={() => handleIncomingDialogue('We require 2 board seats and 20% option pool', 'COUNTERPARTY')}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white border border-white/15 cursor-pointer"
                  >
                    ⚡ Test Board Seats Objection
                  </button>
                  <button
                    onClick={() => handleIncomingDialogue('We require unlimited liability and 100% SLA cash credits', 'COUNTERPARTY')}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white border border-white/15 cursor-pointer"
                  >
                    ⚡ Test SLA Liability
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
