import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  RotateCw, 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  Copy, 
  Check, 
  ArrowRight,
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
    name: 'Enterprise SaaS Renewal',
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
    name: 'Series A Term Sheet',
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
    name: 'Executive Offer Negotiation',
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
  const [step, setStep] = useState(0); // 0: Objection, 1: Nano Detection, 2: Battlecard, 3: Rep Counter, 4: Commitment
  const [progress, setProgress] = useState(0);
  const [copied, setCopied] = useState(false);

  const scenario = DEMO_SCENARIOS[activeScenarioIdx];

  // Auto-play timer for animation
  useEffect(() => {
    if (!isPlaying) return;

    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          // Advance step
          setStep(s => {
            if (s >= 4) {
              // Loop to next scenario or restart
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
    <div className="relative rounded-2xl bg-[#0C0D14] border border-white/15 overflow-hidden shadow-2xl transition-all duration-300">
      {/* 1. MAC OS WINDOW HEADER (Iconic traffic light buttons + title) */}
      <div className="px-4 py-3 bg-[#141520] border-b border-white/10 flex items-center justify-between select-none">
        {/* Left: macOS Traffic Lights */}
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E] hover:opacity-80 transition cursor-pointer" />
          <div className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123] hover:opacity-80 transition cursor-pointer" />
          <div className="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29] hover:opacity-80 transition cursor-pointer" />
          <span className="text-[11px] font-mono text-white/40 ml-2 hidden sm:inline">
            GhostWing-Simulation.app
          </span>
        </div>

        {/* Center: Live Demo Badge */}
        <div className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-[10px] font-mono text-purple-300">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping" />
          <span>Interactive Simulation</span>
        </div>

        {/* Right: Window Controls (Play/Pause & Reset) */}
        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-1 rounded-md text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            title={isPlaying ? 'Pause Demo' : 'Play Demo'}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={handleRestart}
            className="p-1 rounded-md text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            title="Restart Scenario"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. SCENARIO SELECTOR TABS */}
      <div className="px-4 py-2 bg-[#0E0F18] border-b border-white/[0.06] flex items-center justify-between text-xs overflow-x-auto">
        <div className="flex items-center space-x-2">
          {DEMO_SCENARIOS.map((sc, idx) => (
            <button
              key={sc.id}
              onClick={() => handleSelectScenario(idx)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                activeScenarioIdx === idx
                  ? 'bg-white text-slate-950 font-bold shadow-sm'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
            >
              {sc.name}
            </button>
          ))}
        </div>
        <span className="text-[10px] font-mono text-emerald-400 hidden sm:inline">
          🔒 0 B Raw Upload
        </span>
      </div>

      {/* 3. STEP PROGRESS BAR */}
      <div className="w-full h-1 bg-white/5 relative">
        <div 
          className="h-full bg-gradient-to-r from-purple-500 to-fuchsia-500 transition-all duration-150 ease-out"
          style={{ width: `${((step * 20) + (progress * 0.2))}%` }}
        />
      </div>

      {/* 4. ANIMATED SIMULATION STAGE */}
      <div className="p-4 sm:p-5 space-y-4 min-h-[360px] flex flex-col justify-between">
        
        {/* TOP: Client Speaking Objection */}
        <div className="space-y-3">
          {/* Client Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-fuchsia-600 to-purple-600 flex items-center justify-center font-bold text-xs text-white shadow-md">
                {scenario.clientAvatar}
              </div>
              <div>
                <p className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>{scenario.clientName}</span>
                  <span className="text-[10px] text-white/40 font-normal">({scenario.clientRole})</span>
                </p>
                <p className="text-[10px] text-purple-400 font-mono flex items-center gap-1">
                  <Volume2 className="w-3 h-3 animate-pulse" />
                  Speaking on Google Meet...
                </p>
              </div>
            </div>

            <span className="px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[10px] font-mono">
              High-Stakes Trigger
            </span>
          </div>

          {/* Client Spoken Dialogue Bubble */}
          <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-500/20 text-xs text-purple-100 leading-relaxed shadow-inner">
            "{scenario.clientObjection}"
          </div>
        </div>

        {/* MIDDLE: On-Device Nano 4 Trigger Badge (Animates on Step >= 1) */}
        {step >= 1 && (
          <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 text-[11px] font-mono animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center space-x-2 text-emerald-400">
              <Cpu className="w-3.5 h-3.5" />
              <span>Nano 4 On-Device VAD ({scenario.nanoDetectionMs}ms)</span>
            </div>
            <div className="flex items-center space-x-1.5 text-white/50 text-[10px]">
              <Lock className="w-3 h-3 text-emerald-400" />
              <span>PII Scrubbed • 0 B Egress</span>
            </div>
          </div>
        )}

        {/* TACTICAL BATTLECARD SLIDE-IN (Animates on Step >= 2) */}
        {step >= 2 && (
          <div className="relative group rounded-xl bg-[#131422] border border-purple-500/30 p-4 space-y-2.5 shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center justify-between text-[10px]">
              <span className="font-bold uppercase tracking-wider text-fuchsia-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                {scenario.tacticalHeadline}
              </span>
              <span className="text-white/40 font-mono">Battlecard Armed</span>
            </div>

            <p className="text-xs font-bold text-white leading-snug">
              "{scenario.recommendedResponse}"
            </p>

            <div className="flex items-center justify-between pt-1 border-t border-white/[0.06]">
              <span className="text-[10px] text-white/40 font-mono">
                Trigger: {scenario.objectionCategory}
              </span>
              <button
                onClick={handleCopy}
                className="px-2.5 py-1 rounded-lg bg-white text-slate-950 font-bold text-[10px] flex items-center gap-1 hover:bg-neutral-200 transition-all cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-600 stroke-[3]" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 & 4: Rep Response & Deal Closed (Animates on Step >= 3) */}
        {step >= 3 && (
          <div className="space-y-2 pt-1 animate-in fade-in duration-300">
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-white/80 leading-relaxed">
              <span className="text-emerald-400 font-bold block text-[10px] font-mono mb-0.5">
                {scenario.repName} (Speaking):
              </span>
              "{scenario.repCounter}"
            </div>

            {step >= 4 && (
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-[11px] animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center space-x-1.5 text-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span className="font-semibold">{scenario.extractedCommitment}</span>
                </div>
                <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full">
                  {scenario.protectedValue}
                </span>
              </div>
            )}
          </div>
        )}

        {/* FOOTER CONTROLS: STEP INDICATOR */}
        <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[10px] text-white/40 font-mono">
          <span>Stage {step + 1} of 5</span>
          <div className="flex items-center space-x-1">
            {[0, 1, 2, 3, 4].map(i => (
              <button
                key={i}
                onClick={() => { setStep(i); setProgress(0); }}
                className={`w-2 h-2 rounded-full transition-all ${
                  step === i ? 'bg-purple-400 w-4' : step > i ? 'bg-emerald-400' : 'bg-white/20'
                }`}
              />
            ))}
          </div>
          <span>Next: {step === 4 ? 'Looping' : 'Auto-Advancing'}</span>
        </div>
      </div>
    </div>
  );
};
