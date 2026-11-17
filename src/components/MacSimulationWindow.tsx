import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  RotateCw, 
  Sparkles, 
  Copy, 
  Check, 
  Cpu, 
  Lock, 
  Volume2, 
  CheckCircle2 
} from 'lucide-react';

interface SimulationScenario {
  id: string;
  name: string;
  tag: string;
  clientName: string;
  clientRole: string;
  clientAvatar: string;
  repName: string;
  clientObjection: string;
  objectionCategory: string;
  nanoDetectionMs: number;
  tacticalHeadline: string;
  recommendedResponse: string;
  repCounter: string;
  clientConclusion: string;
  extractedCommitment: string;
  protectedValue: string;
}

const DEMO_SCENARIOS: SimulationScenario[] = [
  {
    id: 'saas-pricing',
    name: 'Sales Call',
    tag: 'Sales',
    clientName: 'Sarah Jenkins',
    clientRole: 'VP of Procurement',
    clientAvatar: 'SJ',
    repName: 'Alex (You)',
    clientObjection: 'To be candid, Acme Cloud offered us 28% off if we migrate this month. We cannot justify your current seat price.',
    objectionCategory: 'Competitor Discount Claim',
    nanoDetectionMs: 38,
    tacticalHeadline: 'Anchor on Uptime & Migration Cost',
    recommendedResponse: 'Anchor on verified 99.99% uptime and zero onboarding fees. Offer 10% multi-year lock instead of cash discount.',
    repCounter: 'I completely understand budget scrutiny. However, migrating means rebuilding custom integrations and retraining 200 engineers.',
    clientConclusion: 'That is a fair point. If you can lock in 10% over a 3-year term, we will sign by Friday.',
    extractedCommitment: 'Client will sign 3-year agreement by Friday',
    protectedValue: '$42,000 ARR Gross Margin'
  },
  {
    id: 'term-sheet',
    name: 'Investor Pitch',
    tag: 'Fundraising',
    clientName: 'Marcus Vance',
    clientRole: 'Lead Partner, Sequoia Seed',
    clientAvatar: 'MV',
    repName: 'Founder (You)',
    clientObjection: 'We love the product velocity, but we require 2 board seats and a 20% unallocated option pool pre-money.',
    objectionCategory: 'Cap Table Dilution & Governance',
    nanoDetectionMs: 44,
    tacticalHeadline: 'Founder Voting Control Defense',
    recommendedResponse: 'Counter with 2 Founder seats, 1 Lead Investor seat, 1 Independent. Tie option pool expansion to post-money key hires.',
    repCounter: 'We want institutional alignment, but preserving executive velocity is critical. Let us counter with 1 Lead seat and an Independent industry advisor.',
    clientConclusion: 'Understood. We can agree to 1 Board seat plus 1 Observer, with option pool set post-close.',
    extractedCommitment: '1 Lead seat + 1 Observer; option pool post-money',
    protectedValue: '8% Founder Equity Retained'
  },
  {
    id: 'exec-comp',
    name: 'Salary Offer',
    tag: 'Recruiting',
    clientName: 'Elena Rostova',
    clientRole: 'VP Engineering Candidate',
    clientAvatar: 'ER',
    repName: 'Hiring Manager (You)',
    clientObjection: 'I have a competing offer at Meta for $285k base. Your current base offer of $230k is significantly below my target.',
    objectionCategory: 'Base Salary Ceiling',
    nanoDetectionMs: 41,
    tacticalHeadline: 'Milestone Sign-On & Equity Acceleration',
    recommendedResponse: 'Maintain $230k base to preserve internal team parity. Bridge with $45k milestone sign-on bonus and double-trigger vesting.',
    repCounter: 'We maintain strict internal tier parity on base salary, but we can structure a $45k Year-1 milestone bonus and accelerated equity refresh.',
    clientConclusion: 'That bridges the cash gap cleanly. If we finalize the milestone criteria, I am ready to sign.',
    extractedCommitment: '$45k Year-1 milestone bonus added to offer letter',
    protectedValue: 'Internal Pay Equity Preserved'
  }
];

export const MacSimulationWindow: React.FC = () => {
  const [activeScenarioIdx, setActiveScenarioIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [copied, setCopied] = useState(false);

  const scenario = DEMO_SCENARIOS[activeScenarioIdx];

  useEffect(() => {
    if (!isPlaying) return;

    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          setStep(s => {
            if (s >= 4) {
              setActiveScenarioIdx(idx => (idx + 1) % DEMO_SCENARIOS.length);
              return 0;
            }
            return s + 1;
          });
          return 0;
        }
        return prev + 5;
      });
    }, 120);

    return () => clearInterval(timer);
  }, [isPlaying]);

  const handleCopy = () => {
    navigator.clipboard.writeText(scenario.recommendedResponse);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRestart = () => {
    setStep(0);
    setProgress(0);
  };

  const handleSelectScenario = (idx: number) => {
    setActiveScenarioIdx(idx);
    setStep(0);
    setProgress(0);
  };

  return (
    <div className="relative group">
      {/* 1. RADIANT OUTER BACKLIGHT GLOW (Separates the window cleanly from background) */}
      <div className="absolute -inset-1.5 bg-gradient-to-r from-purple-500/35 via-fuchsia-500/40 to-indigo-500/35 rounded-[26px] blur-xl opacity-80 group-hover:opacity-100 transition duration-500 pointer-events-none" />

      {/* 2. FLOATING MAC WINDOW BODY WITH LIGHTER FROSTED GLASS TINT */}
      <div className="relative rounded-[22px] bg-gradient-to-b from-[#1C1E2D]/95 via-[#161726]/95 to-[#10111D]/98 border border-white/25 ring-1 ring-purple-400/25 overflow-hidden shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85),0_0_35px_rgba(168,85,247,0.3)] backdrop-blur-2xl transition-all duration-300">
        
        {/* Top Edge Specular Highlight Line */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />

        {/* 3. MACOS TITLEBAR (Lighter brushed titanium header with traffic lights) */}
        <div className="px-4 py-3 bg-gradient-to-b from-white/15 to-white/5 border-b border-white/15 flex items-center justify-between select-none backdrop-blur-md">
          {/* Left: macOS Traffic Lights */}
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E] shadow-sm hover:opacity-80 transition cursor-pointer" />
            <div className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123] shadow-sm hover:opacity-80 transition cursor-pointer" />
            <div className="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29] shadow-sm hover:opacity-80 transition cursor-pointer" />
            <span className="text-[12px] font-semibold text-white/80 ml-2 hidden sm:inline tracking-tight font-sans">
              GhostWing-Live-Demo.app
            </span>
          </div>

          {/* Center: Live Demo Status Pill */}
          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/40 text-[10px] font-bold font-mono text-purple-200 shadow-inner">
            <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-400 animate-ping" />
            <span>Interactive Simulation</span>
          </div>

          {/* Right: Window Controls (Play/Pause & Reset) */}
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/15 transition-all"
              title={isPlaying ? 'Pause Demo' : 'Play Demo'}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={handleRestart}
              className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/15 transition-all"
              title="Restart Scenario"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 4. SCENARIO SELECTOR TABS (Lighter Frosted Segmented Control) */}
        <div className="px-4 py-2.5 bg-black/25 border-b border-white/10 flex items-center justify-between text-xs overflow-x-auto">
          <div className="flex items-center space-x-2">
            {DEMO_SCENARIOS.map((sc, idx) => (
              <button
                key={sc.id}
                onClick={() => handleSelectScenario(idx)}
                className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  activeScenarioIdx === idx
                    ? 'bg-white text-slate-950 shadow-md scale-[1.02]'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                {sc.name}
              </button>
            ))}
          </div>
          <span className="text-[10px] font-mono text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full hidden sm:inline">
            🔒 0 B Raw Upload
          </span>
        </div>

        {/* 5. STEP PROGRESS BAR */}
        <div className="w-full h-1 bg-white/10 relative">
          <div 
            className="h-full bg-gradient-to-r from-fuchsia-500 via-purple-400 to-indigo-400 transition-all duration-150 ease-out shadow-[0_0_10px_rgba(217,70,239,0.8)]"
            style={{ width: `${((step * 20) + (progress * 0.2))}%` }}
          />
        </div>

        {/* 6. ANIMATED SIMULATION STAGE WITH LIGHTER ELEVATED TINT */}
        <div className="p-4 sm:p-5 space-y-4 min-h-[360px] flex flex-col justify-between">
          
          {/* TOP: Client Speaking Objection */}
          <div className="space-y-3">
            {/* Client Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-fuchsia-500 to-purple-600 flex items-center justify-center font-bold text-xs text-white shadow-md ring-1 ring-white/30">
                  {scenario.clientAvatar}
                </div>
                <div>
                  <p className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>{scenario.clientName}</span>
                    <span className="text-[10px] text-white/50 font-normal">({scenario.clientRole})</span>
                  </p>
                  <p className="text-[10px] text-purple-300 font-mono flex items-center gap-1">
                    <Volume2 className="w-3 h-3 text-fuchsia-400 animate-pulse" />
                    Speaking on Google Meet...
                  </p>
                </div>
              </div>

              <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-200 text-[10px] font-mono font-bold">
                High-Stakes Trigger
              </span>
            </div>

            {/* Client Spoken Dialogue Bubble (Lighter violet tint) */}
            <div className="p-3.5 rounded-xl bg-[#221636]/80 border border-purple-400/35 text-xs text-purple-100 leading-relaxed shadow-lg backdrop-blur-md">
              "{scenario.clientObjection}"
            </div>
          </div>

          {/* MIDDLE: On-Device Nano 4 Trigger Badge (Animates on Step >= 1) */}
          {step >= 1 && (
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-[11px] font-mono shadow-md animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center space-x-2 text-emerald-300 font-bold">
                <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                <span>Instant On-Device AI ({scenario.nanoDetectionMs}ms)</span>
              </div>
              <div className="flex items-center space-x-1.5 text-emerald-200/80 text-[10px]">
                <Lock className="w-3 h-3 text-emerald-400" />
                <span>Private • 0 Audio Uploaded</span>
              </div>
            </div>
          )}

          {/* TACTICAL BATTLECARD SLIDE-IN (Animates on Step >= 2 with vivid highlight) */}
          {step >= 2 && (
            <div className="relative group rounded-xl bg-gradient-to-br from-[#27163D] via-[#1E1330] to-[#181124] border border-fuchsia-400/50 p-4 space-y-2.5 shadow-[0_10px_30px_rgba(217,70,239,0.25)] animate-in fade-in slide-in-from-bottom-2 duration-300 ring-1 ring-fuchsia-400/30">
              <div className="flex items-center justify-between text-[10px]">
                <span className="font-extrabold uppercase tracking-wider text-fuchsia-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-fuchsia-400" />
                  {scenario.tacticalHeadline}
                </span>
                <span className="text-white/60 font-mono bg-white/10 px-2 py-0.5 rounded-full">
                  Battlecard Armed
                </span>
              </div>

              <p className="text-xs font-bold text-white leading-snug">
                "{scenario.recommendedResponse}"
              </p>

              <div className="flex items-center justify-between pt-1 border-t border-white/10">
                <span className="text-[10px] text-white/50 font-mono">
                  Trigger: {scenario.objectionCategory}
                </span>
                <button
                  onClick={handleCopy}
                  className="px-3 py-1 rounded-lg bg-white hover:bg-neutral-100 text-slate-950 font-bold text-[11px] flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-600 stroke-[3]" /> : <Copy className="w-3 h-3 text-black" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3 & 4: Rep Response & Deal Closed (Animates on Step >= 3) */}
          {step >= 3 && (
            <div className="space-y-2 pt-1 animate-in fade-in duration-300">
              <div className="p-3 rounded-xl bg-white/[0.08] border border-white/20 text-xs text-white leading-relaxed shadow-sm">
                <span className="text-emerald-400 font-bold block text-[10px] font-mono mb-0.5">
                  {scenario.repName} (Speaking):
                </span>
                "{scenario.repCounter}"
              </div>

              {step >= 4 && (
                <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-between text-[11px] animate-in fade-in zoom-in-95 duration-200 shadow-md">
                  <div className="flex items-center space-x-1.5 text-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    <span className="font-semibold">{scenario.extractedCommitment}</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-emerald-300 bg-emerald-500/30 px-2 py-0.5 rounded-full border border-emerald-400/40">
                    {scenario.protectedValue}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* FOOTER CONTROLS: STEP INDICATOR */}
          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-white/50 font-mono">
            <span>Stage {step + 1} of 5</span>
            <div className="flex items-center space-x-1.5">
              {[0, 1, 2, 3, 4].map(i => (
                <button
                  key={i}
                  onClick={() => { setStep(i); setProgress(0); }}
                  className={`h-2 rounded-full transition-all ${
                    step === i ? 'bg-fuchsia-400 w-4 shadow-[0_0_8px_rgba(232,0,255,0.7)]' : step > i ? 'bg-emerald-400 w-2' : 'bg-white/20 w-2'
                  }`}
                />
              ))}
            </div>
            <span>Next: {step === 4 ? 'Looping' : 'Auto-Advancing'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
