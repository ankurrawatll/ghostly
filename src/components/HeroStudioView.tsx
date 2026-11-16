import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Monitor, 
  Volume2, 
  Wifi, 
  WifiOff, 
  ShieldCheck, 
  Lock, 
  Cpu, 
  Cloud, 
  Zap, 
  Copy, 
  Check, 
  Send, 
  RotateCw, 
  Play, 
  Pause, 
  Sparkles, 
  BookOpen, 
  CheckCircle2, 
  AlertCircle,
  ArrowUpRight
} from 'lucide-react';
import { Playbook, TacticalBattlecard, EgressAuditEntry } from '../types';
import { hybridRouter, volatileBuffer } from '../firebase/aiLogic';
import { AirGapInspector } from './AirGapInspector';
import { TalkRatioGauge } from './TalkRatioGauge';
import { CommitmentsTracker } from './CommitmentsTracker';

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

  // Conversation telemetry
  const [talkRatio, setTalkRatio] = useState(0.5);
  const [speaker, setSpeaker] = useState<'USER' | 'COUNTERPARTY'>('USER');
  const [copied, setCopied] = useState(false);
  const [customObjection, setCustomObjection] = useState('');
  const [commitments, setCommitments] = useState<string[]>([]);
  const [auditLog, setAuditLog] = useState<EgressAuditEntry[]>([]);
  const [totalLocalWords, setTotalLocalWords] = useState<number>(0);

  // Live in-memory dialogue stream
  const [transcriptStream, setTranscriptStream] = useState<TranscriptTurn[]>([
    {
      id: 't-init-1',
      speaker: 'COUNTERPARTY',
      text: 'Glad to connect. We love your product, but our CFO asked us to scrutinize all vendor licenses this quarter.',
      timestamp: Date.now() - 25000
    },
    {
      id: 't-init-2',
      speaker: 'COUNTERPARTY',
      text: 'To be candid, Acme Cloud offered us a 28% discount if we migrate to their suite this month. Can you match that pricing?',
      timestamp: Date.now() - 15000
    },
    {
      id: 't-init-3',
      speaker: 'USER',
      text: 'I completely understand budget pressures. However, migrating means rebuilding custom integrations and retraining 200 engineers.',
      timestamp: Date.now() - 5000
    }
  ]);

  // Active Battlecard state
  const [activeBattlecard, setActiveBattlecard] = useState<TacticalBattlecard>({
    id: 'bc-hero-init',
    headline: 'Competitor Discount Defense',
    counterMove: 'Anchor on verified 99.99% uptime and zero-cost onboarding. Offer 10% multi-year lock instead of cash discount.',
    rationale: 'IDC client study proves 3.2x ROI compared to migration cost. Protects contract gross margin without cash concession.',
    sourceRule: 'Competitor offering 20-30% lower pricing',
    inferenceSource: 'ON_DEVICE',
    latencyMs: 42,
    timestamp: Date.now()
  });

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
    };
  }, []);

  const stopAllMedia = () => {
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(t => t.stop());
    }
    if (tabStreamRef.current) {
      tabStreamRef.current.getTracks().forEach(t => t.stop());
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close().catch(() => {});
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (_) {}
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
  };

  const handleCopyResponse = () => {
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

  // Start Live Zero-Upload Session
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

  // Setup Web Audio Analysers for Real Audio Reactivity
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

  // Web Speech API for Local On-Device Transcription
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

  // Process incoming speech through on-device hybrid inference
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

    // Commitment tracking
    const lower = text.toLowerCase();
    if (spk === 'COUNTERPARTY' && (lower.includes('will send') || lower.includes('agree') || lower.includes('review') || lower.includes('sign'))) {
      const c = `Counterparty: ${text.slice(0, 80)}`;
      setCommitments(prev => prev.includes(c) ? prev : [c, ...prev]);
    } else if (spk === 'USER' && (lower.includes('will send') || lower.includes('commit') || lower.includes('follow up'))) {
      const c = `You: ${text.slice(0, 80)}`;
      setCommitments(prev => prev.includes(c) ? prev : [c, ...prev]);
    }
  };

  const handleCustomObjectionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customObjection.trim()) return;
    const txt = customObjection.trim();
    setCustomObjection('');
    handleIncomingDialogue(txt, 'COUNTERPARTY');
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
      {/* 1. TOP HERO: LIVE NEGOTIATION COCKPIT (DUAL-CHANNEL AUDIO + TACTICAL BATTLECARD HUD) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        
        {/* LEFT COLUMN: OPTICAL FLUTED GLASS AUDIO RADAR & IN-MEMORY SPEECH STREAM */}
        <div className="lg:col-span-7 space-y-5">
          {/* Main Visualizer Container */}
          <div className="relative group">
            {/* Luminous Glow aura behind the card */}
            <div className="absolute -inset-1.5 bg-gradient-to-r from-purple-600/30 via-fuchsia-600/35 to-indigo-600/30 rounded-[32px] blur-2xl opacity-60 group-hover:opacity-90 transition duration-700 pointer-events-none" />

            <div className="relative rounded-[28px] bg-[#0A0B10] border border-white/10 overflow-hidden shadow-2xl p-6 space-y-5">
              
              {/* Vertical optical fluted glass overlay */}
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

              {/* Header inside Cockpit */}
              <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center space-x-2">
                  <span className="ref-pill text-white bg-black/60 border-white/20 font-bold">
                    {isCapturing ? 'SESSION ACTIVE' : 'RADAR STANDBY'}
                  </span>
                  <span className="ref-pill text-emerald-400 bg-emerald-500/10 border-emerald-500/30 font-mono">
                    0 B EGRESS
                  </span>
                  <span className="ref-pill text-purple-300 bg-purple-500/20 border-purple-500/30 text-[10px]">
                    VOLATILE RAM
                  </span>
                </div>

                {isCapturing && (
                  <div className="text-xs font-mono text-white/80 bg-black/60 px-3 py-1 rounded-full border border-white/10">
                    ⏱️ {formatTime(sessionSeconds)}
                  </div>
                )}
              </div>

              {/* Center Audio Reactive Radar Waveform */}
              <div className="relative z-10 py-3 flex flex-col items-center justify-center">
                <div className="flex items-center justify-center space-x-2 h-20">
                  {[30, 55, 80, 95, 70, 100, 85, 60, 90, 75, 45, 65, 85, 40].map((h, i) => (
                    <div
                      key={i}
                      className="w-2.5 rounded-full bg-gradient-to-t from-fuchsia-500 via-purple-300 to-white transition-all duration-100 shadow-[0_0_12px_rgba(217,70,239,0.7)]"
                      style={{
                        height: `${Math.max(12, (h * ((micLevel + tabLevel) || 15)) / 100 * 1.6)}px`,
                        opacity: 0.6 + (i % 3) * 0.15
                      }}
                    />
                  ))}
                </div>
                <p className="text-[11px] text-white/40 font-mono mt-2">
                  Dual-Channel Audio: {hasMic ? `Mic (${micLevel}%)` : 'Mic Off'} • {hasTab ? `Meet Tab (${tabLevel}%)` : 'Tab Off'}
                </p>
              </div>

              {/* Dual-Channel Hardware Connectors */}
              <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {/* Channel 1: Microphone */}
                <div className="p-3 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center">
                      <Mic className={`w-4 h-4 ${hasMic ? 'text-emerald-400' : 'text-white/40'}`} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Your Microphone</p>
                      <p className="text-[10px] text-white/40 font-mono">Talk-to-Listen Input</p>
                    </div>
                  </div>
                  {!hasMic ? (
                    <button
                      onClick={connectMicrophone}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-all"
                    >
                      Connect
                    </button>
                  ) : (
                    <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg">
                      Active
                    </span>
                  )}
                </div>

                {/* Channel 2: Google Meet / Zoom Tab Audio */}
                <div className="p-3 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center">
                      <Monitor className={`w-4 h-4 ${hasTab ? 'text-cyan-400' : 'text-white/40'}`} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Google Meet / Zoom</p>
                      <p className="text-[10px] text-white/40 font-mono">Counterparty Audio</p>
                    </div>
                  </div>
                  {!hasTab ? (
                    <button
                      onClick={connectTabAudio}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-all"
                    >
                      Pick Tab
                    </button>
                  ) : (
                    <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded-lg">
                      Capturing
                    </span>
                  )}
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/10">
                <button
                  onClick={toggleSession}
                  className="btn-white text-xs cursor-pointer shadow-lg"
                >
                  {isCapturing ? <Pause className="w-4 h-4 text-black" /> : <Play className="w-4 h-4 text-black" />}
                  <span>{isCapturing ? 'End Meeting & Purge RAM' : 'Start Zero-Upload Session'}</span>
                </button>

                <button
                  onClick={toggleAirplaneMode}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center transition-all border ${
                    simulatedOffline
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                      : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                  }`}
                  title="Test offline on-device fallback"
                >
                  {simulatedOffline ? <WifiOff className="w-3.5 h-3.5 mr-1 text-amber-400" /> : <Wifi className="w-3.5 h-3.5 mr-1" />}
                  {simulatedOffline ? 'Airplane Mode: ON' : 'Simulate Airplane Mode'}
                </button>
              </div>
            </div>
          </div>

          {/* Real-time In-Memory Dialogue Stream (Purged on End) */}
          <div className="rounded-2xl bg-[#0B0C12] border border-white/10 p-4 space-y-3 shadow-xl">
            <div className="flex items-center justify-between text-xs text-white/50 border-b border-white/[0.06] pb-2 font-mono">
              <span className="flex items-center">
                <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
                Live In-Memory Speech Stream
              </span>
              <span className="text-[11px] text-white/40">Volatile Ring Buffer • 0 B to Disk</span>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {transcriptStream.map((turn) => {
                const isUser = turn.speaker === 'USER';
                return (
                  <div
                    key={turn.id}
                    className={`p-2.5 rounded-xl text-xs leading-relaxed transition-all ${
                      isUser
                        ? 'bg-white/[0.04] border border-white/[0.08] text-white/90 ml-6'
                        : 'bg-purple-950/20 border border-purple-500/20 text-purple-200 mr-6'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] text-white/40 font-mono mb-1">
                      <span className={isUser ? 'text-emerald-400 font-bold' : 'text-fuchsia-400 font-bold'}>
                        {isUser ? 'You (Sales / Founder)' : 'Counterparty (Client / Lead)'}
                      </span>
                    </div>
                    <p>{turn.text}</p>
                  </div>
                );
              })}
            </div>

            {/* Quick Objection Injection Bar for instant testing */}
            <form onSubmit={handleCustomObjectionSubmit} className="pt-2 flex items-center space-x-2">
              <input
                type="text"
                placeholder="Simulate counterparty objection (e.g. 'We need a 30% discount to sign today')..."
                value={customObjection}
                onChange={e => setCustomObjection(e.target.value)}
                className="flex-1 bg-[#12131C] border border-white/10 rounded-xl px-4 py-2 text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500 shadow-inner"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 text-white font-bold rounded-xl text-xs flex items-center transition-all shadow-md shadow-purple-600/30"
              >
                <Send className="w-3.5 h-3.5 mr-1" />
                Simulate
              </button>
            </form>
          </div>
        </div>

        {/* RIGHT COLUMN: TACTICAL WINGMAN HUD */}
        <div className="lg:col-span-5 space-y-5">
          {/* Talk Ratio Gauge */}
          <TalkRatioGauge talkRatio={talkRatio} speaker={speaker} />

          {/* Active Tactical Battlecard */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-fuchsia-600/30 via-purple-600/30 to-indigo-600/30 rounded-3xl blur-xl opacity-60 pointer-events-none" />

            <div className="relative rounded-2xl bg-[#0E0F16] border border-white/10 p-5 space-y-4 shadow-2xl backdrop-blur-2xl">
              {/* Header Badges */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="ref-pill text-white bg-white/10 border-white/20 font-bold text-[10px]">
                    TACTICAL COUNTER
                  </span>
                  <span className="ref-pill text-purple-300 bg-purple-500/20 border-purple-500/30 text-[10px]">
                    {activeBattlecard.inferenceSource === 'FALLBACK_LOCAL' ? 'NANO 4 (OFFLINE)' : 'HYBRID AI'}
                  </span>
                </div>
                <span className="text-xs font-mono text-white/50">
                  {activeBattlecard.latencyMs}ms latency
                </span>
              </div>

              {/* Battlecard Headline */}
              <div>
                <h3 className="text-xl font-extrabold text-white tracking-tight">
                  {activeBattlecard.headline}
                </h3>
                <p className="text-xs text-white/50 mt-1">
                  Trigger: <strong className="text-white/80">{activeBattlecard.sourceRule}</strong>
                </p>
              </div>

              {/* Recommended Response Box */}
              <div className="p-4 rounded-xl bg-black/50 border border-white/10 space-y-1.5 shadow-inner">
                <span className="text-[10px] uppercase font-mono tracking-wider font-semibold text-emerald-400 block">
                  Say this right now:
                </span>
                <p className="text-base font-bold text-white leading-snug tracking-tight">
                  "{activeBattlecard.counterMove}"
                </p>
              </div>

              {/* Rationale description */}
              <p className="text-xs text-zinc-400 leading-relaxed">
                {activeBattlecard.rationale}
              </p>

              {/* Action Button: White Copy Button */}
              <div className="pt-1 flex items-center justify-between">
                <button
                  onClick={handleCopyResponse}
                  className="btn-white text-xs cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" /> : <Copy className="w-3.5 h-3.5 text-black" />}
                  <span>{copied ? 'Copied Response' : 'Copy Spoken Counter'}</span>
                </button>

                <button
                  onClick={() => handleIncomingDialogue(activeBattlecard.sourceRule, 'COUNTERPARTY')}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 transition-all flex items-center"
                >
                  <RotateCw className="w-3 h-3 mr-1" />
                  Regenerate
                </button>
              </div>
            </div>
          </div>

          {/* Extracted Commitments Tracker */}
          <CommitmentsTracker commitments={commitments} />

          {/* Air-Gap Network Egress Inspector */}
          <AirGapInspector auditLog={auditLog} totalLocalWords={totalLocalWords} />
        </div>
      </div>

      {/* 2. BOTTOM SECTION: ACTIVE NEGOTIATION PLAYBOOKS (CLOUD FIRESTORE KNOWLEDGE BASE) */}
      <div className="space-y-6 pt-6 border-t border-white/[0.08]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              <span>Negotiation Playbooks</span>
              <span className="ref-pill text-purple-300 border-purple-500/30 text-[10px]">
                Cloud Firestore
              </span>
            </h2>
            <p className="text-xs text-white/50 mt-1">
              Select a playbook to ground your on-device wingman in battlecards, competitor counters, and walk-away guardrails.
            </p>
          </div>

          <span className="text-xs text-white/40 font-mono">
            Active: <strong className="text-white">{activePlaybook.title}</strong>
          </span>
        </div>

        {/* 4 Luxury Playbook Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {playbooks.map((playbook) => {
            const isActive = playbook.id === activePlaybook.id;

            // Visual themes for playbooks
            const theme = playbook.scenarioType === 'sales'
              ? { bg: 'from-rose-600 via-orange-600 to-amber-500', tag: 'Enterprise Sales' }
              : playbook.scenarioType === 'fundraising'
              ? { bg: 'from-violet-600 via-indigo-600 to-blue-500', tag: 'Venture & Equity' }
              : playbook.scenarioType === 'recruiting'
              ? { bg: 'from-cyan-500 via-blue-600 to-purple-600', tag: 'Exec Recruiting' }
              : { bg: 'from-fuchsia-600 via-pink-600 to-rose-600', tag: 'Legal & Risk' };

            return (
              <div
                key={playbook.id}
                onClick={() => onSelectPlaybook(playbook.id)}
                className={`ref-card p-4 flex flex-col justify-between cursor-pointer group transition-all ${
                  isActive
                    ? 'border-purple-500/80 bg-white/[0.08] shadow-[0_0_30px_rgba(168,85,247,0.3)] ring-1 ring-purple-500/50'
                    : ''
                }`}
              >
                <div>
                  {/* Frosted gradient preview header */}
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

                    <div className="relative z-10 flex items-center justify-between text-[11px] text-white/90 font-mono">
                      <span>{playbook.rules.length} Tactical Rules</span>
                      <span>{playbook.walkAwayGuardrails.length} Guardrails</span>
                    </div>
                  </div>

                  {/* Playbook Title & Description */}
                  <div className="pt-3.5 pb-2 space-y-1">
                    <h3 className="text-base font-bold text-white tracking-tight group-hover:text-purple-300 transition-colors">
                      {playbook.title}
                    </h3>
                    <p className="text-xs text-white/50 line-clamp-2 leading-relaxed">
                      {playbook.description}
                    </p>
                  </div>
                </div>

                {/* Bottom rule preview */}
                <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px]">
                  <span className="text-white/40 truncate max-w-[170px]">
                    "{playbook.rules[0]?.triggerTopic || 'Pricing defense'}"
                  </span>
                  <span className={`font-semibold ${isActive ? 'text-purple-400' : 'text-white/60 group-hover:text-white'}`}>
                    {isActive ? 'Armed' : 'Arm →'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
