import React, { useState } from 'react';
import { 
  BookOpen, 
  Plus, 
  Trash2, 
  Check, 
  Sparkles, 
  ShieldAlert, 
  Zap, 
  Target, 
  BarChart, 
  Play,
  RotateCw,
  ArrowUpRight
} from 'lucide-react';
import { Playbook, PlaybookRule } from '../types';
import { PlaybooksService } from '../firebase/playbooksService';

interface PlaybooksStudioProps {
  playbooks: Playbook[];
  activePlaybookId: string;
  onSelectPlaybook: (id: string) => void;
  onReloadPlaybooks: () => Promise<void>;
  onTestRule?: (trigger: string) => void;
}

// Aesthetic gradient styles mapped to playbooks (directly inspired by the user's reference image)
const AESTHETIC_THEMES: Record<string, { banner: string; glow: string; tags: string[] }> = {
  'pb-saas-enterprise': {
    banner: 'bg-gradient-to-tr from-[#FF416C] via-[#8A2387] to-[#FF4B2B]',
    glow: 'group-hover:shadow-[0_0_30px_rgba(255,65,108,0.35)]',
    tags: ['Glass', 'Grain', 'B2B Sales']
  },
  'pb-startup-valuation': {
    banner: 'bg-gradient-to-tr from-[#8B5CF6] via-[#6366F1] to-[#3B82F6]',
    glow: 'group-hover:shadow-[0_0_30px_rgba(139,92,246,0.35)]',
    tags: ['Purple Haze', 'Fundraising', 'M&A']
  },
  'pb-executive-comp': {
    banner: 'bg-gradient-to-tr from-[#D946EF] via-[#8B5CF6] to-[#06B6D4]',
    glow: 'group-hover:shadow-[0_0_30px_rgba(217,70,239,0.35)]',
    tags: ['Plasma Swirl', 'Executive', 'Equity']
  }
};

const DEFAULT_THEME = {
  banner: 'bg-gradient-to-tr from-[#06B6D4] via-[#3B82F6] to-[#8B5CF6]',
  glow: 'group-hover:shadow-[0_0_30px_rgba(6,182,212,0.35)]',
  tags: ['Prism Sweep', 'Custom AI']
};

export const PlaybooksStudio: React.FC<PlaybooksStudioProps> = ({
  playbooks,
  activePlaybookId,
  onSelectPlaybook,
  onReloadPlaybooks,
  onTestRule
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGeneratingWithAi, setIsGeneratingWithAi] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [scenarioType, setScenarioType] = useState<Playbook['scenarioType']>('sales');
  const [description, setDescription] = useState('');
  const [guardrails, setGuardrails] = useState<string>('Max discount 15% without approval.\nNever agree to uncapped liability.');
  const [rules, setRules] = useState<PlaybookRule[]>([
    {
      id: `rule-${Date.now()}-1`,
      triggerTopic: 'Competitor offering 25% lower price',
      counterMove: 'Anchor on verified 99.99% uptime and zero onboarding fees; offer 10% multi-year lock instead.',
      proofPoint: 'IDC study proved 3.2x ROI compared to migration cost.'
    }
  ]);
  const [saving, setSaving] = useState(false);

  const selectedPlaybook = playbooks.find(p => p.id === activePlaybookId) || playbooks[0];

  // AI Auto-Generator
  const handleGenerateWithAi = () => {
    if (!aiPrompt.trim()) return;
    setIsGeneratingWithAi(true);

    setTimeout(() => {
      setTitle(`${aiPrompt.slice(0, 30)} Strategy`);
      setDescription(`AI-Generated negotiation defense for: ${aiPrompt}`);
      setGuardrails(
        'Never concede core pricing without extending contract term to 2+ years.\nRefuse uncapped indemnity clauses.\nMaintain minimum gross margin threshold of 75%.'
      );
      setRules([
        {
          id: `rule-${Date.now()}-1`,
          triggerTopic: 'Pushback on price or competitor offering cheaper alternative',
          counterMove: 'Reframe total cost of ownership: our built-in integrations save $40k/year in engineering maintenance.',
          proofPoint: 'Gartner client benchmark shows competitor migration requires 3-month engineering overhaul.'
        },
        {
          id: `rule-${Date.now()}-2`,
          triggerTopic: 'Demanding immediate 20%+ discount to close this quarter',
          counterMove: 'Offer tiered deployment: activate 30% of seats now at standard rate, schedule remainder for next fiscal quarter.',
          proofPoint: 'Secures quarter quota without devaluing product license floor.'
        }
      ]);
      setIsGeneratingWithAi(false);
      setIsCreating(true);
    }, 600);
  };

  const handleAddRule = () => {
    setRules([
      ...rules,
      {
        id: `rule-${Date.now()}-${rules.length + 1}`,
        triggerTopic: '',
        counterMove: '',
        proofPoint: ''
      }
    ]);
  };

  const handleSavePlaybook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSaving(true);
    const newPlaybook: Playbook = {
      id: `pb-${Date.now()}`,
      title: title.trim(),
      scenarioType,
      description: description.trim(),
      walkAwayGuardrails: guardrails.split('\n').map(g => g.trim()).filter(Boolean),
      rules: rules.filter(r => r.triggerTopic.trim() && r.counterMove.trim()),
      updatedAt: new Date().toISOString()
    };

    try {
      await PlaybooksService.savePlaybook(newPlaybook);
      await onReloadPlaybooks();
      onSelectPlaybook(newPlaybook.id);
      setIsCreating(false);
      setTitle('');
      setDescription('');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this playbook? This cannot be undone.')) {
      await PlaybooksService.deletePlaybook(id);
      await onReloadPlaybooks();
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* 1. TOP HEADER & PROMPT STUDIO */}
      <div className="relative overflow-hidden rounded-3xl glass-panel p-6 shadow-2xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="pill-tag bg-plasma-violet/10 text-plasma-violet border-plasma-violet/20 font-bold">
                PRO • KNOWLEDGE BASE
              </span>
              <h2 className="text-xl font-extrabold text-white tracking-tight">
                Negotiation Playbooks Studio
              </h2>
            </div>
            <p className="text-xs text-white/50 mt-1 max-w-xl leading-relaxed">
              Ground your AI coach in real-world battlecards, competitor counters, and walk-away guardrails synced with Cloud Firestore.
            </p>
          </div>

          <button
            onClick={() => setIsCreating(!isCreating)}
            className="px-4 py-2 rounded-2xl text-xs font-bold bg-white text-slate-950 hover:bg-white/90 flex items-center transition-all shadow-inner"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            {isCreating ? 'Close Form' : 'Create Custom Playbook'}
          </button>
        </div>

        {/* AI Auto-Generator Input Bar */}
        <div className="relative rounded-2xl p-1 bg-gradient-to-r from-white/10 via-white/5 to-white/10 p-[1px] shadow-inner">
          <div className="bg-[#0B0C12] rounded-2xl p-2.5 flex flex-col sm:flex-row items-center gap-2">
            <div className="flex items-center pl-2 space-x-2 text-plasma-violet">
              <Sparkles className="w-4 h-4 text-plasma-violet animate-pulse" />
              <span className="text-xs font-bold text-white whitespace-nowrap hidden md:inline">
                AI Playbook Generator:
              </span>
            </div>
            <input
              type="text"
              placeholder="Describe your deal (e.g. 'Selling enterprise CRM at $60k ARR against HubSpot, max discount 15%')..."
              value={aiPrompt}
              onChange={e => setAiPrompt(e.target.value)}
              className="flex-1 bg-transparent px-3 py-1.5 text-xs text-white focus:outline-none placeholder:text-white/30 w-full"
            />
            <button
              onClick={handleGenerateWithAi}
              disabled={isGeneratingWithAi || !aiPrompt.trim()}
              className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-plasma-violet to-plasma-fuchsia hover:opacity-90 text-white font-bold rounded-xl text-xs flex items-center justify-center transition-all disabled:opacity-30 shadow-glow-violet"
            >
              {isGeneratingWithAi ? (
                <>
                  <RotateCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 mr-1.5 fill-current" />
                  Generate Playbook
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 2. GALLERY OF PLAYBOOK CARDS (DIRECTLY INSPIRED BY THE USER'S REFERENCE IMAGE) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-bold text-white tracking-tight flex items-center">
            <span>Playbook Collection</span>
            <span className="ml-2 pill-tag text-white/60">{playbooks.length} Available</span>
          </h3>
          <span className="text-[11px] text-white/40 font-mono">Select card to view or activate</span>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {playbooks.map(pb => {
            const isActive = pb.id === activePlaybookId;
            const theme = AESTHETIC_THEMES[pb.id] || DEFAULT_THEME;

            return (
              <div
                key={pb.id}
                onClick={() => onSelectPlaybook(pb.id)}
                className={`group cursor-pointer rounded-3xl glass-panel p-4 flex flex-col justify-between transition-all duration-300 relative overflow-hidden ${
                  isActive
                    ? 'border-white/30 bg-white/[0.08] shadow-2xl'
                    : 'border-white/[0.07] hover:border-white/20 hover:bg-white/[0.05]'
                } ${theme.glow}`}
              >
                {/* Luminous visual banner on top of card (like reference image) */}
                <div className={`h-28 w-full rounded-2xl ${theme.banner} relative overflow-hidden p-3 flex flex-col justify-between shadow-inner`}>
                  <div className="flex items-center justify-between">
                    <span className="pill-tag bg-black/40 text-white border-white/20 text-[9px] backdrop-blur-md">
                      {pb.isDefault ? 'PRO' : 'CUSTOM'}
                    </span>
                    <div className="w-7 h-7 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center text-white/70 group-hover:text-white transition-colors">
                      {isActive ? <Check className="w-4 h-4 text-emerald-400 stroke-[3]" /> : <ArrowUpRight className="w-4 h-4" />}
                    </div>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    {theme.tags.map((tag, i) => (
                      <span key={i} className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-black/40 text-white/80 backdrop-blur-md">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Card Content */}
                <div className="pt-3 pb-1 space-y-1.5 flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white tracking-tight group-hover:text-white transition-colors">
                      {pb.title}
                    </h4>
                  </div>
                  <p className="text-[11.5px] text-white/50 line-clamp-2 leading-relaxed">
                    {pb.description}
                  </p>
                </div>

                {/* Bottom metadata tags */}
                <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-[10px] font-mono text-white/40">
                  <span>{pb.rules.length} Tactical Rules</span>
                  <span>{pb.walkAwayGuardrails.length} Limits</span>
                  <span className={`pill-tag ${isActive ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : ''}`}>
                    {isActive ? 'Active' : 'Click to Load'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. ACTIVE PLAYBOOK DEEP DIVE (RICH COMMAND VIEW) */}
      {selectedPlaybook && (
        <div className="rounded-3xl glass-panel p-6 shadow-2xl space-y-5 border border-white/10 animate-in fade-in duration-300">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/[0.08] pb-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="pill-tag bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                  CURRENTLY ACTIVE PLAYBOOK
                </span>
                <h3 className="text-lg font-extrabold text-white tracking-tight">{selectedPlaybook.title}</h3>
              </div>
              <p className="text-xs text-white/50 mt-1 max-w-2xl leading-relaxed">
                {selectedPlaybook.description}
              </p>
            </div>

            <div className="flex items-center space-x-2">
              {!selectedPlaybook.isDefault && (
                <button
                  onClick={() => handleDelete(selectedPlaybook.id)}
                  className="px-3.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-semibold transition-colors flex items-center"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" />
                  Delete Playbook
                </button>
              )}
            </div>
          </div>

          {/* Walk-Away Limits */}
          <div className="bg-amber-500/[0.04] border border-amber-500/20 rounded-2xl p-4 space-y-2">
            <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center">
              <ShieldAlert className="w-4 h-4 mr-1.5" />
              Walk-Away Guardrails & Limits (Never Concede Past These)
            </h4>
            <ul className="text-xs text-white/80 space-y-1.5 font-mono">
              {selectedPlaybook.walkAwayGuardrails.map((g, i) => (
                <li key={i} className="flex items-start space-x-2">
                  <span className="text-amber-400 font-bold">•</span>
                  <span>{g}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Rules Cards Grid */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center">
              <Zap className="w-4 h-4 mr-1.5 text-plasma-violet" />
              Active Tactical Rules & Spoken Counter-Moves ({selectedPlaybook.rules.length})
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedPlaybook.rules.map((rule) => (
                <div
                  key={rule.id}
                  className="rounded-2xl glass-panel p-4 space-y-3 border border-white/[0.08] hover:border-white/20 transition-all shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start space-x-2">
                      <Target className="w-4 h-4 text-plasma-fuchsia mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="text-[10px] uppercase font-mono font-bold text-white/40 block">
                          When Counterparty Says:
                        </span>
                        <strong className="text-xs text-white leading-snug block mt-0.5 font-semibold">
                          "{rule.triggerTopic}"
                        </strong>
                      </div>
                    </div>

                    {onTestRule && (
                      <button
                        onClick={() => onTestRule(rule.triggerTopic)}
                        className="px-2.5 py-1 rounded-xl bg-white/[0.06] hover:bg-white/10 text-white/80 hover:text-white border border-white/10 text-[10px] font-semibold flex items-center flex-shrink-0 transition-colors"
                      >
                        <Play className="w-2.5 h-2.5 mr-1 fill-current" />
                        Simulate
                      </button>
                    )}
                  </div>

                  <div className="bg-black/40 rounded-xl p-3 border border-white/[0.06]">
                    <span className="text-[10px] uppercase font-mono font-bold text-emerald-400 block mb-1">
                      Recommended Spoken Counter-Move:
                    </span>
                    <p className="text-xs font-semibold text-emerald-300 leading-relaxed">
                      "{rule.counterMove}"
                    </p>
                  </div>

                  {rule.proofPoint && (
                    <div className="flex items-center space-x-1.5 text-[11px] text-white/40 font-mono">
                      <BarChart className="w-3.5 h-3.5 text-white/30" />
                      <span className="truncate">Proof: {rule.proofPoint}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
