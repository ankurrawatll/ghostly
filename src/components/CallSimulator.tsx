import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Wifi, WifiOff, Volume2, Mic, ArrowRight, ShieldCheck, Send, Sparkles } from 'lucide-react';
import { MOCK_SCENARIOS } from '../data/mockScenarios';
import { CallScenario, Playbook, TacticalBattlecard, EgressAuditEntry } from '../types';
import { hybridRouter } from '../firebase/aiLogic';

interface CallSimulatorProps {
  activePlaybook: Playbook;
  onUpdateState: (
    speaker: 'USER' | 'COUNTERPARTY',
    text: string,
    talkRatio: number,
    battlecard?: TacticalBattlecard,
    auditEntry?: EgressAuditEntry
  ) => void;
  onEndCall: (durationSec: number) => void;
}

export const CallSimulator: React.FC<CallSimulatorProps> = ({
  activePlaybook,
  onUpdateState,
  onEndCall
}) => {
  const [selectedScenario, setSelectedScenario] = useState<CallScenario>(MOCK_SCENARIOS[0]);
  const [currentTurnIndex, setCurrentTurnIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [simulatedOffline, setSimulatedOffline] = useState<boolean>(false);
  const [callDuration, setCallDuration] = useState<number>(0);
  const [talkRatio, setTalkRatio] = useState<number>(0.5);

  // Custom interactive testing
  const [customInput, setCustomInput] = useState<string>('');
  const [customSpeaker, setCustomSpeaker] = useState<'USER' | 'COUNTERPARTY'>('COUNTERPARTY');
  const [customHistory, setCustomHistory] = useState<Array<{ id: string; speaker: 'USER' | 'COUNTERPARTY'; text: string }>>([]);
  const [isListeningCustom, setIsListeningCustom] = useState<boolean>(false);

  const timerRef = useRef<number | null>(null);

  // Call duration counter
  useEffect(() => {
    let interval: number | null = null;
    if (isPlaying) {
      interval = window.setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying]);

  // Handle stepping turns
  const processTurn = async (turnIndex: number) => {
    const turn = selectedScenario.turns[turnIndex];
    if (!turn) return;

    const result = await hybridRouter.processLocalWindow(
      turn.text,
      turn.speaker,
      activePlaybook,
      talkRatio
    );

    setTalkRatio(result.localState.talkRatio);
    onUpdateState(
      turn.speaker,
      turn.text,
      result.localState.talkRatio,
      result.battlecard,
      result.auditEntry
    );
  };

  // Play / Pause auto advancing turns
  useEffect(() => {
    if (!isPlaying) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    if (currentTurnIndex < selectedScenario.turns.length) {
      const turn = selectedScenario.turns[currentTurnIndex];
      processTurn(currentTurnIndex);

      timerRef.current = window.setTimeout(() => {
        if (currentTurnIndex + 1 < selectedScenario.turns.length) {
          setCurrentTurnIndex(prev => prev + 1);
        } else {
          setIsPlaying(false);
        }
      }, (turn.durationSec || 4) * 1000);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPlaying, currentTurnIndex, selectedScenario]);

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentTurnIndex(0);
    setCallDuration(0);
    setTalkRatio(0.5);
    setCustomHistory([]);
  };

  const handleManualNextTurn = () => {
    if (currentTurnIndex + 1 < selectedScenario.turns.length) {
      const next = currentTurnIndex + 1;
      setCurrentTurnIndex(next);
      processTurn(next);
    }
  };

  const toggleSimulatedOffline = () => {
    const nextState = !simulatedOffline;
    setSimulatedOffline(nextState);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event(nextState ? 'offline' : 'online'));
    }
  };

  // Submit custom live sentence (typed or spoken) to prove it's NOT mock
  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInput.trim()) return;

    const text = customInput.trim();
    setCustomInput('');

    setCustomHistory(prev => [...prev, { id: `custom-${Date.now()}`, speaker: customSpeaker, text }]);

    const result = await hybridRouter.processLocalWindow(
      text,
      customSpeaker,
      activePlaybook,
      talkRatio
    );

    setTalkRatio(result.localState.talkRatio);
    onUpdateState(
      customSpeaker,
      text,
      result.localState.talkRatio,
      result.battlecard,
      result.auditEntry
    );
  };

  // Live mic speech recognition for custom test input
  const toggleCustomMic = () => {
    const anyWindow = window as any;
    const SpeechRecognition = anyWindow.SpeechRecognition || anyWindow.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Web Speech API is not supported in this browser. Please type your objection.');
      return;
    }

    if (isListeningCustom) {
      setIsListeningCustom(false);
      return;
    }

    try {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      setIsListeningCustom(true);
      rec.onresult = (evt: any) => {
        const text = evt.results[0][0].transcript;
        setCustomInput(text);
        setIsListeningCustom(false);
      };
      rec.onerror = () => setIsListeningCustom(false);
      rec.onend = () => setIsListeningCustom(false);
      rec.start();
    } catch (e) {
      setIsListeningCustom(false);
    }
  };

  return (
    <div className="bg-card border border-surfaceBorder rounded-xl p-4 shadow-sm space-y-4">
      {/* Top Controller Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-surfaceBorder pb-3">
        <div>
          <span className="text-[10px] uppercase font-semibold tracking-wider text-emerald-400">
            Interactive Hybrid AI Sandbox
          </span>
          <h3 className="text-sm font-bold text-white flex items-center">
            {selectedScenario.title}
          </h3>
        </div>

        {/* Scenario Switcher */}
        <div className="flex items-center space-x-2">
          <select
            value={selectedScenario.id}
            onChange={(e) => {
              const sc = MOCK_SCENARIOS.find(s => s.id === e.target.value);
              if (sc) {
                setSelectedScenario(sc);
                handleReset();
              }
            }}
            className="bg-surface border border-surfaceBorder text-xs rounded-lg px-2.5 py-1 text-slate-200 focus:outline-none focus:border-emerald-500 font-medium"
          >
            {MOCK_SCENARIOS.map(sc => (
              <option key={sc.id} value={sc.id}>{sc.title} ({sc.category})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Simulator Playback & Airplane Mode Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-surface/60 p-2.5 rounded-lg border border-surfaceBorder">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center shadow-sm transition-all ${
              isPlaying
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 font-bold'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 mr-1" />
                Pause Call
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 mr-1 fill-current" />
                {currentTurnIndex === 0 ? 'Start Mock Call' : 'Resume'}
              </>
            )}
          </button>

          <button
            onClick={handleManualNextTurn}
            disabled={currentTurnIndex >= selectedScenario.turns.length - 1}
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-surface hover:bg-slate-800 text-slate-300 border border-surfaceBorder disabled:opacity-40 flex items-center transition-colors"
          >
            <span>Next Turn</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </button>

          <button
            onClick={handleReset}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Reset to beginning"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <span className="text-xs font-mono text-slate-400 ml-2">
            Turn {currentTurnIndex + 1} of {selectedScenario.turns.length} • {Math.floor(callDuration / 60)}:{(callDuration % 60).toString().padStart(2, '0')}
          </span>
        </div>

        {/* Airplane Mode Toggle for Hackathon Video Demo */}
        <button
          onClick={toggleSimulatedOffline}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center transition-all ${
            simulatedOffline
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse font-semibold'
              : 'bg-surface border-surfaceBorder text-slate-400 hover:text-slate-200'
          }`}
          title="Toggles Airplane Mode to prove prefer_on_device offline continuity"
        >
          {simulatedOffline ? (
            <>
              <WifiOff className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
              <span>Airplane Mode: <strong>ON</strong> (Local Fallback)</span>
            </>
          ) : (
            <>
              <Wifi className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
              <span>Simulate Wi-Fi Drop (Airplane Mode)</span>
            </>
          )}
        </button>
      </div>

      {/* Simulated Video Call Stream View */}
      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
        {selectedScenario.turns.slice(0, currentTurnIndex + 1).map((turn, i) => {
          const isUser = turn.speaker === 'USER';
          const isLatest = i === currentTurnIndex && customHistory.length === 0;

          return (
            <div
              key={turn.id}
              className={`p-2.5 rounded-lg border transition-all ${
                isLatest
                  ? isUser
                    ? 'bg-emerald-500/10 border-emerald-500/40'
                    : 'bg-sky-500/10 border-sky-500/40'
                  : 'bg-surface/40 border-surfaceBorder/60 opacity-80'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] font-semibold mb-1">
                <span className={`flex items-center ${isUser ? 'text-emerald-400' : 'text-sky-400'}`}>
                  {isUser ? <Mic className="w-3 h-3 mr-1" /> : <Volume2 className="w-3 h-3 mr-1" />}
                  {isUser ? 'You (Sales Rep / Founder)' : 'Counterparty (Client / Investor)'}
                </span>
                {turn.expectedObjection && (
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    High-Stakes Trigger: {turn.expectedObjection}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-100 leading-relaxed font-sans">
                "{turn.text}"
              </p>
            </div>
          );
        })}

        {/* Any custom utterances submitted */}
        {customHistory.map((item) => (
          <div
            key={item.id}
            className={`p-2.5 rounded-lg border ${
              item.speaker === 'USER'
                ? 'bg-emerald-500/10 border-emerald-500/40'
                : 'bg-sky-500/10 border-sky-500/40'
            }`}
          >
            <div className="flex items-center justify-between text-[11px] font-semibold mb-1">
              <span className={`flex items-center ${item.speaker === 'USER' ? 'text-emerald-400' : 'text-sky-400'}`}>
                {item.speaker === 'USER' ? <Mic className="w-3 h-3 mr-1" /> : <Volume2 className="w-3 h-3 mr-1" />}
                {item.speaker === 'USER' ? 'You (Live Input)' : 'Counterparty (Live Input)'}
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                ✨ Live Dynamic Turn
              </span>
            </div>
            <p className="text-xs text-slate-100 leading-relaxed">
              "{item.text}"
            </p>
          </div>
        ))}
      </div>

      {/* LIVE INTERACTIVE OBJECTION PLAYGROUND (Proves it is not static mock!) */}
      <div className="bg-surface/90 border border-surfaceBorder rounded-xl p-3 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-white flex items-center">
            <Sparkles className="w-3.5 h-3.5 mr-1 text-sky-400" />
            Live Dialogue Playground (Test ANY Real Objection)
          </span>
          <div className="flex items-center space-x-1.5 text-[11px]">
            <button
              type="button"
              onClick={() => setCustomSpeaker('COUNTERPARTY')}
              className={`px-2 py-0.5 rounded border transition-colors ${
                customSpeaker === 'COUNTERPARTY'
                  ? 'bg-sky-500/20 text-sky-300 border-sky-500/40 font-semibold'
                  : 'text-slate-400 border-surfaceBorder'
              }`}
            >
              Them Speaking
            </button>
            <button
              type="button"
              onClick={() => setCustomSpeaker('USER')}
              className={`px-2 py-0.5 rounded border transition-colors ${
                customSpeaker === 'USER'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-semibold'
                  : 'text-slate-400 border-surfaceBorder'
              }`}
            >
              You Speaking
            </button>
          </div>
        </div>

        <form onSubmit={handleCustomSubmit} className="flex items-center space-x-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder='Type or speak anything (e.g. "We have zero budget for this license", "Competitor is 40% cheaper")...'
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              className="w-full bg-background border border-surfaceBorder rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500 pr-8"
            />
            <button
              type="button"
              onClick={toggleCustomMic}
              className={`absolute right-2 top-1.5 p-1 rounded text-xs transition-colors ${
                isListeningCustom ? 'text-rose-400 animate-pulse' : 'text-slate-400 hover:text-white'
              }`}
              title="Click to speak your objection via microphone"
            >
              <Mic className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="submit"
            disabled={!customInput.trim()}
            className="px-3 py-1.5 bg-sky-500 hover:bg-sky-400 disabled:opacity-40 text-slate-950 font-bold rounded-lg text-xs flex items-center transition-colors shadow-sm"
          >
            <span>Analyze</span>
            <Send className="w-3 h-3 ml-1" />
          </button>
        </form>
        <p className="text-[10px] text-slate-500">
          Try typing a custom pricing or competitor objection. The hybrid engine will strip PII locally and query Cloud Gemini + your Firestore Playbook in real time.
        </p>
      </div>

      {/* Simulator Footer */}
      <div className="flex items-center justify-between pt-1 border-t border-surfaceBorder text-xs text-slate-400">
        <span className="flex items-center text-[11px]">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 mr-1" />
          Zero raw audio saved. Volatile RAM ring buffer auto-clears.
        </span>

        <button
          onClick={() => onEndCall(callDuration)}
          className="text-rose-400 hover:text-rose-300 font-medium text-xs transition-colors"
        >
          End Call & Save Anonymized Scorecard
        </button>
      </div>
    </div>
  );
};
