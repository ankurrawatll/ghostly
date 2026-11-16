import React, { useState, useEffect } from 'react';
import { Cpu, CheckCircle2, AlertCircle, Copy, Check, RefreshCw, Key, Sparkles } from 'lucide-react';
import { checkChromeNanoAvailability, hybridRouter } from '../firebase/aiLogic';

export const NanoDiagnostics: React.FC = () => {
  const [status, setStatus] = useState<'checking' | 'readily' | 'after-download' | 'no'>('checking');
  const [copiedFlag, setCopiedFlag] = useState(false);
  const [customKey, setCustomKey] = useState('');
  const [savedKey, setSavedKey] = useState(false);

  const runCheck = async () => {
    setStatus('checking');
    const result = await checkChromeNanoAvailability();
    setStatus(result);
  };

  useEffect(() => {
    runCheck();
    setCustomKey(hybridRouter.getCustomApiKey());
  }, []);

  const flagUrl = 'chrome://flags/#prompt-api-for-gemini-nano';

  const copyFlag = () => {
    navigator.clipboard.writeText(flagUrl);
    setCopiedFlag(true);
    setTimeout(() => setCopiedFlag(false), 2000);
  };

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    hybridRouter.setCustomApiKey(customKey);
    setSavedKey(true);
    setTimeout(() => setSavedKey(false), 2000);
  };

  return (
    <div className="bg-card border border-surfaceBorder rounded-xl p-4 shadow-sm space-y-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between border-b border-surfaceBorder pb-3">
        <div>
          <span className="text-[10px] uppercase font-semibold tracking-wider text-emerald-400">
            Chrome On-Device AI Readiness
          </span>
          <h3 className="text-sm font-bold text-white flex items-center">
            <Cpu className="w-4 h-4 mr-1.5 text-emerald-400" />
            Gemini Nano 4 Diagnostics & AI Keys
          </h3>
        </div>

        <button
          onClick={runCheck}
          className="text-xs text-slate-400 hover:text-white flex items-center bg-surface px-2.5 py-1 rounded border border-surfaceBorder transition-colors"
        >
          <RefreshCw className={`w-3 h-3 mr-1 ${status === 'checking' ? 'animate-spin' : ''}`} />
          Recheck Status
        </button>
      </div>

      {/* Status Box */}
      <div className={`p-4 rounded-xl border flex items-start space-x-3 ${
        status === 'readily'
          ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
          : status === 'after-download'
          ? 'bg-sky-500/10 border-sky-500/40 text-sky-300'
          : status === 'checking'
          ? 'bg-slate-800 border-slate-700 text-slate-300'
          : 'bg-amber-500/10 border-amber-500/40 text-amber-300'
      }`}>
        {status === 'readily' ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
        ) : (
          <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        )}
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-white">
            {status === 'readily' && '🟢 Gemini Nano 4 Ready for Zero-Upload Inference'}
            {status === 'after-download' && '📥 Model Weights Downloading in Chrome in Background'}
            {status === 'no' && '🟡 Chrome Prompt API Not Active Yet (Using Hybrid Fallback)'}
            {status === 'checking' && 'Inspecting Chrome Prompt API Availability...'}
          </h4>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            {status === 'readily' && 'Your browser supports local on-device inference via the Chrome Prompt API. All rolling transcript state parsing will execute 100% on your laptop GPU/NPU for zero cloud cost and 0 bytes raw data egress.'}
            {status === 'after-download' && 'Chrome has queued the Gemini Nano 4 weights for download. Keep Chrome open on Wi-Fi for 5-10 minutes. In the meantime, GhostWing automatically uses resilient local heuristics + cloud fallback.'}
            {status === 'no' && 'Your current Chrome version or flags do not expose window.ai.prompt yet. GhostWing automatically runs in Hybrid Simulator & Cloud Fallback mode so all features work seamlessly!'}
            {status === 'checking' && 'Testing LanguageModel.availability() and window.ai capabilities...'}
          </p>
        </div>
      </div>

      {/* Chrome Flags Instructions */}
      <div className="bg-surface/80 rounded-xl p-3.5 border border-surfaceBorder space-y-2">
        <h4 className="text-xs font-bold text-slate-200">How to Enable Gemini Nano 4 in Chrome (v138+):</h4>
        <ol className="text-xs text-slate-400 space-y-1.5 list-decimal list-inside">
          <li>
            Open a new tab and navigate to:
            <div className="flex items-center space-x-2 mt-1 mb-1 font-mono text-[11px] bg-background p-1.5 rounded border border-surfaceBorder text-sky-400">
              <span className="truncate">{flagUrl}</span>
              <button
                onClick={copyFlag}
                className="ml-auto text-slate-400 hover:text-white flex items-center px-1.5 py-0.5 rounded bg-surface border border-surfaceBorder text-[10px]"
              >
                {copiedFlag ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span className="ml-1">{copiedFlag ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </li>
          <li>Set <strong className="text-white">Prompt API for Gemini Nano</strong> to <span className="text-emerald-400 font-semibold">Enabled</span>.</li>
          <li>Relaunch Google Chrome and return to GhostWing.</li>
        </ol>
      </div>

      {/* Optional Custom Gemini API Key */}
      <div className="bg-surface/80 rounded-xl p-3.5 border border-surfaceBorder space-y-2.5">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-200 flex items-center">
            <Key className="w-3.5 h-3.5 mr-1 text-sky-400" />
            Direct Google AI Studio Key (Optional Direct Fallback)
          </h4>
          <span className="text-[10px] text-slate-400">Stored locally in browser only</span>
        </div>
        <p className="text-[11px] text-slate-400">
          GhostWing uses Firebase Vertex AI and Chrome Gemini Nano by default. You can also paste an API key from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-sky-400 hover:underline">Google AI Studio</a> to ensure direct, unthrottled cloud LLM calls during judging.
        </p>
        <form onSubmit={handleSaveKey} className="flex items-center space-x-2">
          <input
            type="password"
            placeholder="AIzaSy..."
            value={customKey}
            onChange={(e) => setCustomKey(e.target.value)}
            className="flex-1 bg-background border border-surfaceBorder rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500 font-mono"
          />
          <button
            type="submit"
            className="px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-lg text-xs flex items-center transition-colors"
          >
            {savedKey ? <Check className="w-3.5 h-3.5 mr-1 text-slate-950" /> : <Sparkles className="w-3.5 h-3.5 mr-1 text-slate-950" />}
            {savedKey ? 'Saved' : 'Save Key'}
          </button>
        </form>
      </div>
    </div>
  );
};
