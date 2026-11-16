import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Monitor, 
  Radio, 
  ShieldCheck, 
  Volume2, 
  AlertCircle, 
  Sparkles, 
  CheckCircle2, 
  Layers,
  Activity
} from 'lucide-react';
import { Playbook, TacticalBattlecard, EgressAuditEntry } from '../types';
import { hybridRouter, volatileBuffer } from '../firebase/aiLogic';
import { TalkRatioGauge } from './TalkRatioGauge';
import { ActiveBattlecard } from './ActiveBattlecard';
import { CommitmentsTracker } from './CommitmentsTracker';
import { AirGapInspector } from './AirGapInspector';

interface LiveMeetingCaptureProps {
  activePlaybook: Playbook;
  playbooks: Playbook[];
  onSelectPlaybook: (id: string) => void;
  onEndCall: (durationSec: number) => void;
}

interface TranscriptBubble {
  id: string;
  speaker: 'USER' | 'COUNTERPARTY';
  text: string;
  timestamp: number;
  objectionTag?: string;
}

export const LiveMeetingCapture: React.FC<LiveMeetingCaptureProps> = ({
  activePlaybook,
  playbooks,
  onSelectPlaybook,
  onEndCall
}) => {
  // Session states
  const [isCapturing, setIsCapturing] = useState(false);
  const [hasMic, setHasMic] = useState(false);
  const [hasTabAudio, setHasTabAudio] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<number>(0);
  const [sessionSeconds, setSessionSeconds] = useState<number>(0);

  // Live audio meters
  const [micLevel, setMicLevel] = useState<number>(0);
  const [tabLevel, setTabLevel] = useState<number>(0);

  // Conversation telemetry
  const [talkRatio, setTalkRatio] = useState<number>(0.5);
  const [speaker, setSpeaker] = useState<'USER' | 'COUNTERPARTY'>('USER');
  const [activeBattlecard, setActiveBattlecard] = useState<TacticalBattlecard | null>(null);
  const [commitments, setCommitments] = useState<string[]>([]);
  const [auditLog, setAuditLog] = useState<EgressAuditEntry[]>([]);
  const [totalLocalWords, setTotalLocalWords] = useState<number>(0);
  const [transcriptFeed, setTranscriptFeed] = useState<TranscriptBubble[]>([]);

  // Manual fast-test objection injection
  const [quickTestText, setQuickTestText] = useState('');

  // Audio Context and Stream References
  const audioCtxRef = useRef<AudioContext | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const tabStreamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);
  const animFrameRef = useRef<number | null>(null);

  // Timer
  useEffect(() => {
    let interval: number | null = null;
    if (isCapturing) {
      interval = window.setInterval(() => {
        setSessionSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isCapturing]);

  // Clean up streams on unmount
  useEffect(() => {
    return () => {
      stopCapture();
    };
  }, []);

  // 1. Connect Microphone
  const connectMicrophone = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      setHasMic(true);
      setupAudioMeters();
      initSpeechRecognition();
    } catch (err) {
      alert('Could not access microphone. Please grant permission in browser settings.');
    }
  };

  // 2. Connect Google Meet / Zoom Tab Audio
  const connectTabAudio = async () => {
    try {
      // In Chrome, getDisplayMedia with audio: true captures Google Meet / Zoom tab audio
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: 'browser' } as any,
        audio: true
      });

      // Verify user checked "Share tab audio"
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0) {
        alert('Notice: You must check "Also share tab audio" in the Chrome tab picker to capture Google Meet audio!');
        stream.getTracks().forEach(t => t.stop());
        return;
      }

      tabStreamRef.current = stream;
      setHasTabAudio(true);
      setupAudioMeters();

      // Listen for tab stream end (e.g. user clicks "Stop sharing")
      audioTracks[0].onended = () => {
        setHasTabAudio(false);
      };
    } catch (err) {
      console.log('Tab capture cancelled or not allowed:', err);
    }
  };

  // Setup Web Audio API Level Meters
  const setupAudioMeters = () => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new AudioCtx();
    }
    const ctx = audioCtxRef.current;

    // Mic analyser
    let micAnalyser: AnalyserNode | null = null;
    if (micStreamRef.current && micStreamRef.current.getAudioTracks().length > 0) {
      const micSource = ctx.createMediaStreamSource(micStreamRef.current);
      micAnalyser = ctx.createAnalyser();
      micAnalyser.fftSize = 64;
      micSource.connect(micAnalyser);
    }

    // Tab analyser
    let tabAnalyser: AnalyserNode | null = null;
    if (tabStreamRef.current && tabStreamRef.current.getAudioTracks().length > 0) {
      const tabSource = ctx.createMediaStreamSource(tabStreamRef.current);
      tabAnalyser = ctx.createAnalyser();
      tabAnalyser.fftSize = 64;
      tabSource.connect(tabAnalyser);
    }

    const checkLevels = () => {
      if (micAnalyser) {
        const data = new Uint8Array(micAnalyser.frequencyBinCount);
        micAnalyser.getByteFrequencyData(data);
        const sum = data.reduce((a, b) => a + b, 0);
        setMicLevel(Math.min(100, Math.round(sum / data.length * 1.5)));
      }
      if (tabAnalyser) {
        const data = new Uint8Array(tabAnalyser.frequencyBinCount);
        tabAnalyser.getByteFrequencyData(data);
        const sum = data.reduce((a, b) => a + b, 0);
        setTabLevel(Math.min(100, Math.round(sum / data.length * 1.5)));
      }
      animFrameRef.current = requestAnimationFrame(checkLevels);
    };

    checkLevels();
  };

  // Real-time browser speech recognition
  const initSpeechRecognition = () => {
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      console.warn('SpeechRecognition API not available in this browser');
      return;
    }

    try {
      const recognition = new SpeechRec();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = async (event: any) => {
        const results = event.results;
        const latest = results[results.length - 1];
        if (latest.isFinal) {
          const text = latest[0].transcript.trim();
          if (text) {
            handleIncomingSpeech(text, 'USER');
          }
        }
      };

      recognition.onerror = (e: any) => {
        console.debug('Speech recognition event:', e.error);
        if (isCapturing && e.error !== 'aborted') {
          try { recognition.start(); } catch (_) {}
        }
      };

      recognition.onend = () => {
        if (isCapturing) {
          try { recognition.start(); } catch (_) {}
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (e) {
      console.warn('Recognition init note:', e);
    }
  };

  // Process incoming speech through Hybrid AI
  const handleIncomingSpeech = async (text: string, spk: 'USER' | 'COUNTERPARTY') => {
    setSpeaker(spk);

    const result = await hybridRouter.processLocalWindow(
      text,
      spk,
      activePlaybook,
      talkRatio
    );

    setTalkRatio(result.localState.talkRatio);
    setTotalLocalWords(volatileBuffer.getWordCount());

    // Add to visual transcript bubble list
    const newBubble: TranscriptBubble = {
      id: `bubble-${Date.now()}`,
      speaker: spk,
      text,
      timestamp: Date.now(),
      objectionTag: result.localState.objectionDetected ? result.localState.objectionCategory : undefined
    };
    setTranscriptFeed(prev => [...prev.slice(-15), newBubble]);

    // Handle battlecard
    if (result.battlecard) {
      setActiveBattlecard(result.battlecard);
    }

    // Handle audit log
    if (result.auditEntry) {
      setAuditLog(prev => [result.auditEntry!, ...prev]);
    }

    // Extract commitments
    if (result.localState.commitmentText) {
      setCommitments(prev => [result.localState.commitmentText!, ...prev]);
    }
  };

  const startSession = async () => {
    setIsCapturing(true);
    setSessionStartTime(Date.now());
    setSessionSeconds(0);
    volatileBuffer.purge();
    setTranscriptFeed([]);
    setActiveBattlecard(null);
    setAuditLog([]);
    setCommitments([]);

    // If mic not connected yet, connect it now
    if (!hasMic) {
      await connectMicrophone();
    }
  };

  const stopCapture = () => {
    setIsCapturing(false);
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (_) {}
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(t => t.stop());
      micStreamRef.current = null;
    }
    if (tabStreamRef.current) {
      tabStreamRef.current.getTracks().forEach(t => t.stop());
      tabStreamRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    setHasMic(false);
    setHasTabAudio(false);
    setMicLevel(0);
    setTabLevel(0);
  };

  const handleEndSession = () => {
    stopCapture();
    onEndCall(sessionSeconds);
  };

  // Quick test: simulate an objection right in the live session
  const handleQuickTestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTestText.trim()) return;
    const text = quickTestText.trim();
    setQuickTestText('');
    handleIncomingSpeech(text, 'COUNTERPARTY');
  };

  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      {/* 1. TOP HARDWARE & MEETING CONNECTION BAR */}
      <div className="bg-card border border-surfaceBorder rounded-2xl p-4 sm:p-5 shadow-lg space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-surfaceBorder pb-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <h2 className="text-base font-bold text-white">Live Meeting Audio Hub</h2>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                Google Meet & Zoom Compatible
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Connect your meeting tab and microphone. Speech is transcribed and processed <strong>100% locally</strong> in volatile RAM.
            </p>
          </div>

          {/* Active Playbook Selector */}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">Active Playbook:</span>
            <select
              value={activePlaybook.id}
              onChange={(e) => onSelectPlaybook(e.target.value)}
              className="bg-surface border border-surfaceBorder text-xs rounded-xl px-3 py-1.5 text-slate-100 font-semibold focus:outline-none focus:border-emerald-500"
            >
              {playbooks.map(pb => (
                <option key={pb.id} value={pb.id}>{pb.title}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 2. AUDIO CHANNELS CONNECTION CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {/* Channel A: Your Microphone */}
          <div className={`p-4 rounded-xl border transition-all ${
            hasMic 
              ? 'bg-emerald-500/10 border-emerald-500/40 shadow-sm' 
              : 'bg-surface/50 border-surfaceBorder'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  hasMic ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                }`}>
                  <Mic className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Channel 1: Your Microphone</h4>
                  <p className="text-[10px] text-slate-400">Captures your speech for talk-to-listen ratio</p>
                </div>
              </div>

              {!hasMic ? (
                <button
                  onClick={connectMicrophone}
                  className="px-3 py-1.5 bg-surface hover:bg-slate-800 text-slate-200 border border-surfaceBorder rounded-lg text-xs font-semibold flex items-center transition-colors"
                >
                  Connect Mic
                </button>
              ) : (
                <span className="text-[11px] font-mono text-emerald-400 flex items-center">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  Active
                </span>
              )}
            </div>

            {/* Live Audio Visualizer Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-mono text-slate-400">
                <span>Mic Input Level</span>
                <span>{micLevel}%</span>
              </div>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-400 transition-all duration-75 rounded-full"
                  style={{ width: `${micLevel}%` }}
                />
              </div>
            </div>
          </div>

          {/* Channel B: Google Meet / Zoom Tab Audio */}
          <div className={`p-4 rounded-xl border transition-all ${
            hasTabAudio 
              ? 'bg-sky-500/10 border-sky-500/40 shadow-sm' 
              : 'bg-surface/50 border-surfaceBorder'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  hasTabAudio ? 'bg-sky-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                }`}>
                  <Monitor className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Channel 2: Google Meet / Zoom Tab</h4>
                  <p className="text-[10px] text-slate-400">Captures client/counterparty audio directly</p>
                </div>
              </div>

              {!hasTabAudio ? (
                <button
                  onClick={connectTabAudio}
                  className="px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-lg text-xs flex items-center transition-colors shadow-sm"
                >
                  <Volume2 className="w-3.5 h-3.5 mr-1" />
                  Pick Meeting Tab
                </button>
              ) : (
                <span className="text-[11px] font-mono text-sky-400 flex items-center">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  Capturing Tab
                </span>
              )}
            </div>

            {/* Live Tab Audio Visualizer Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-mono text-slate-400">
                <span>Meeting Tab Audio Level</span>
                <span>{tabLevel}%</span>
              </div>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-sky-400 transition-all duration-75 rounded-full"
                  style={{ width: `${tabLevel}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 3. SESSION MASTER CONTROLLER */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex items-center space-x-2 text-xs font-mono text-slate-400">
            {isCapturing ? (
              <span className="flex items-center text-emerald-400 font-semibold">
                <Activity className="w-4 h-4 mr-1.5 animate-spin" />
                Session Active: {Math.floor(sessionSeconds / 60)}:{(sessionSeconds % 60).toString().padStart(2, '0')}
              </span>
            ) : (
              <span className="text-slate-500">Ready to start meeting session</span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {!isCapturing ? (
              <button
                onClick={startSession}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center shadow-lg shadow-emerald-500/20 transition-all"
              >
                <Radio className="w-4 h-4 mr-1.5 animate-pulse" />
                Start Live Zero-Upload Session
              </button>
            ) : (
              <button
                onClick={handleEndSession}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-rose-500 hover:bg-rose-400 text-white flex items-center shadow-lg shadow-rose-500/20 transition-all"
              >
                <MicOff className="w-4 h-4 mr-1.5" />
                End Session & Purge RAM
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4. MAIN LIVE SPLIT: HUD ON RIGHT, LIVE TRANSCRIPT + QUICK TEST ON LEFT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column (8 cols): Real-Time Speech Bubbles & Test Trigger */}
        <div className="lg:col-span-7 space-y-4">
          {/* Live Rolling Speech Feed */}
          <div className="bg-card border border-surfaceBorder rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-surfaceBorder pb-2.5">
              <h3 className="text-xs font-bold text-white flex items-center">
                <Layers className="w-4 h-4 mr-1.5 text-emerald-400" />
                Live In-Memory Speech Stream (Purged on End)
              </h3>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                0 B Written to Disk
              </span>
            </div>

            {/* Bubble list */}
            <div className="space-y-2.5 min-h-[220px] max-h-[300px] overflow-y-auto pr-1">
              {transcriptFeed.length === 0 ? (
                <div className="text-center py-12 text-slate-500 space-y-2">
                  <Mic className="w-8 h-8 mx-auto text-slate-600 opacity-50" />
                  <p className="text-xs text-slate-400">
                    {isCapturing ? 'Listening... Speak into your mic or play meeting tab audio.' : 'Click "Start Live Zero-Upload Session" above to begin.'}
                  </p>
                  <p className="text-[11px] text-slate-600 max-w-sm mx-auto">
                    Your words will stream here in real time. Gemini Nano analyzes dialogue locally every 5 seconds.
                  </p>
                </div>
              ) : (
                transcriptFeed.map(b => (
                  <div
                    key={b.id}
                    className={`p-3 rounded-xl border text-xs transition-all ${
                      b.speaker === 'USER'
                        ? 'bg-emerald-500/10 border-emerald-500/30 mr-8'
                        : 'bg-sky-500/10 border-sky-500/30 ml-8'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-semibold mb-1">
                      <span className={b.speaker === 'USER' ? 'text-emerald-400' : 'text-sky-400'}>
                        {b.speaker === 'USER' ? '🎙️ You (Microphone)' : '🎧 Counterparty (Google Meet / Zoom Tab)'}
                      </span>
                      {b.objectionTag && (
                        <span className="text-[9px] uppercase font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                          🚨 Objection Detected: {b.objectionTag}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-100 font-sans leading-relaxed">
                      "{b.text}"
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Quick Test Bar (If you want to immediately test how AI handles an objection without waiting) */}
            <form onSubmit={handleQuickTestSubmit} className="pt-2 border-t border-surfaceBorder flex items-center space-x-2">
              <input
                type="text"
                placeholder='Simulate counterparty saying an objection (e.g. "Acme is 30% cheaper", "Your SLA penalty is too low")...'
                value={quickTestText}
                onChange={e => setQuickTestText(e.target.value)}
                className="flex-1 bg-surface border border-surfaceBorder rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 placeholder:text-slate-500"
              />
              <button
                type="submit"
                className="px-3.5 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-xl text-xs flex items-center transition-colors shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1 text-slate-950" />
                Simulate
              </button>
            </form>
          </div>

          <AirGapInspector auditLog={auditLog} totalLocalWords={totalLocalWords} />
        </div>

        {/* Right Column (5 cols): Tactical HUD Widgets */}
        <div className="lg:col-span-5 space-y-4">
          <TalkRatioGauge talkRatio={talkRatio} speaker={speaker} />
          
          <ActiveBattlecard
            battlecard={activeBattlecard}
            onDismiss={() => setActiveBattlecard(null)}
            onPin={(id) => {
              if (activeBattlecard && activeBattlecard.id === id) {
                setActiveBattlecard({ ...activeBattlecard, isPinned: !activeBattlecard.isPinned });
              }
            }}
          />

          <CommitmentsTracker commitments={commitments} />
        </div>
      </div>
    </div>
  );
};
