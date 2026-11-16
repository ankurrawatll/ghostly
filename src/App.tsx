import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { HeroStudioView } from './components/HeroStudioView';
import { CallSimulator } from './components/CallSimulator';
import { PlaybooksStudio } from './components/PlaybooksStudio';
import { ScorecardsHistory } from './components/ScorecardsHistory';
import { NanoDiagnostics } from './components/NanoDiagnostics';
import { PostCallModal } from './components/PostCallModal';
import { TalkRatioGauge } from './components/TalkRatioGauge';
import { ActiveBattlecard } from './components/ActiveBattlecard';
import { CommitmentsTracker } from './components/CommitmentsTracker';
import { AirGapInspector } from './components/AirGapInspector';
import { Playbook, TacticalBattlecard, EgressAuditEntry, AnonymizedScorecard, InferenceModeType } from './types';
import { DEFAULT_PLAYBOOKS } from './data/defaultPlaybooks';
import { PlaybooksService } from './firebase/playbooksService';
import { hybridRouter, volatileBuffer } from './firebase/aiLogic';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<'live' | 'simulator' | 'playbooks' | 'scorecards' | 'diagnostics'>('live');
  const [playbooks, setPlaybooks] = useState<Playbook[]>(DEFAULT_PLAYBOOKS);
  const [activePlaybookId, setActivePlaybookId] = useState<string>(DEFAULT_PLAYBOOKS[0].id);
  const [isSessionActive, setIsSessionActive] = useState<boolean>(false);

  // Live telemetry state for simulator
  const [speaker, setSpeaker] = useState<'USER' | 'COUNTERPARTY'>('USER');
  const [talkRatio, setTalkRatio] = useState<number>(0.5);
  const [activeBattlecard, setActiveBattlecard] = useState<TacticalBattlecard | null>(null);
  const [commitments, setCommitments] = useState<string[]>([]);
  const [auditLog, setAuditLog] = useState<EgressAuditEntry[]>([]);
  const [totalLocalWords, setTotalLocalWords] = useState<number>(0);

  // Engine telemetry
  const [engineStatus, setEngineStatus] = useState<InferenceModeType>('ON_DEVICE');
  const [lastLatencyMs, setLastLatencyMs] = useState<number>(45);
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [strictLocalLock, setStrictLocalLock] = useState<boolean>(false);

  // Modal and summary
  const [showPostCallModal, setShowPostCallModal] = useState<boolean>(false);
  const [completedScorecard, setCompletedScorecard] = useState<AnonymizedScorecard | null>(null);

  useEffect(() => {
    loadPlaybooks();

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadPlaybooks = async () => {
    const list = await PlaybooksService.getPlaybooks();
    setPlaybooks(list);
    if (list.length > 0 && !list.find(p => p.id === activePlaybookId)) {
      setActivePlaybookId(list[0].id);
    }
  };

  const activePlaybook = playbooks.find(p => p.id === activePlaybookId) || playbooks[0] || DEFAULT_PLAYBOOKS[0];

  const handleToggleStrictLocal = () => {
    const next = !strictLocalLock;
    setStrictLocalLock(next);
    hybridRouter.setStrictLocalLock(next);
    if (next) {
      setEngineStatus('ON_DEVICE');
    }
  };

  const handleUpdateSimulatorState = (
    spk: 'USER' | 'COUNTERPARTY',
    text: string,
    ratio: number,
    battlecard?: TacticalBattlecard,
    auditEntry?: EgressAuditEntry
  ) => {
    setSpeaker(spk);
    setTalkRatio(ratio);
    setTotalLocalWords(volatileBuffer.getWordCount());

    if (battlecard) {
      setActiveBattlecard(battlecard);
      setEngineStatus(battlecard.inferenceSource);
      setLastLatencyMs(battlecard.latencyMs);
    }

    if (auditEntry) {
      setAuditLog(prev => [auditEntry, ...prev]);
    }

    const lower = text.toLowerCase();
    if (spk === 'COUNTERPARTY' && (lower.includes('will sign') || lower.includes('send') || lower.includes('review') || lower.includes('agree'))) {
      const comm = `Counterparty: ${text.slice(0, 80)}`;
      setCommitments(prev => prev.includes(comm) ? prev : [comm, ...prev]);
    } else if (spk === 'USER' && (lower.includes('will follow up') || lower.includes('happy to provide') || lower.includes('will send'))) {
      const comm = `You: ${text.slice(0, 80)}`;
      setCommitments(prev => prev.includes(comm) ? prev : [comm, ...prev]);
    }
  };

  const handleEndCall = (durationSeconds: number) => {
    const scorecard: AnonymizedScorecard = {
      id: `sc-${Date.now()}`,
      sessionId: `sess-${Date.now()}`,
      playbookTitle: activePlaybook.title,
      durationSeconds: Math.max(15, durationSeconds),
      userTalkRatio: talkRatio,
      localInferencesCount: Math.max(1, Math.round(totalLocalWords / 25)),
      cloudEscalationsCount: auditLog.filter(a => a.inferenceSource === 'IN_CLOUD').length,
      rawBytesUploaded: 0,
      commitmentsCount: commitments.length,
      commitmentsList: commitments,
      objectionCategories: { pricing: 1, competitor: 1 },
      createdAt: new Date().toISOString()
    };

    setCompletedScorecard(scorecard);
    setShowPostCallModal(true);
    setIsSessionActive(false);
    volatileBuffer.purge();
  };

  const handleSaveScorecard = async () => {
    if (completedScorecard) {
      await PlaybooksService.saveScorecard(completedScorecard);
    }
    setShowPostCallModal(false);
    setCurrentTab('scorecards');
  };

  const handleDiscardScorecard = () => {
    setShowPostCallModal(false);
    setCompletedScorecard(null);
  };

  return (
    <div className="relative min-h-screen bg-[#07080B] text-slate-100 flex flex-col font-sans selection:bg-purple-500/30 selection:text-white">
      {/* Radiant Ambient Light Flare (Directly matching Image 2 top light bloom!) */}
      <div className="ambient-flare" />

      {/* Glass Header */}
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        engineStatus={engineStatus}
        lastLatencyMs={lastLatencyMs}
        isOnline={isOnline}
        strictLocalLock={strictLocalLock}
        onToggleStrictLocal={handleToggleStrictLocal}
        isSessionActive={isSessionActive}
      />

      {/* Main Workspace Area */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-8">
        {/* TAB 1: LUXURY HERO STUDIO & LIVE GOOGLE MEET RADAR (Matches Image 2) */}
        {currentTab === 'live' && (
          <HeroStudioView
            playbooks={playbooks}
            activePlaybook={activePlaybook}
            onSelectPlaybook={setActivePlaybookId}
            onEndCall={handleEndCall}
          />
        )}

        {/* TAB 2: INTERACTIVE CALL SIMULATOR */}
        {currentTab === 'simulator' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-7 space-y-4">
              <CallSimulator
                activePlaybook={activePlaybook}
                onUpdateState={handleUpdateSimulatorState}
                onEndCall={handleEndCall}
              />
            </div>

            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center justify-between text-xs text-white/50 font-semibold px-1">
                <span>Tactical Wingman HUD ({activePlaybook.title})</span>
                <span className="text-emerald-400 font-mono text-[11px]">0 B Uploaded</span>
              </div>
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
              <AirGapInspector auditLog={auditLog} totalLocalWords={totalLocalWords} />
            </div>
          </div>
        )}

        {/* TAB 3: PLAYBOOK COMMAND CENTER */}
        {currentTab === 'playbooks' && (
          <PlaybooksStudio
            playbooks={playbooks}
            activePlaybookId={activePlaybookId}
            onSelectPlaybook={setActivePlaybookId}
            onReloadPlaybooks={loadPlaybooks}
            onTestRule={(triggerTopic) => {
              setCurrentTab('live');
            }}
          />
        )}

        {/* TAB 4: SCORECARDS HISTORY & PRIVACY PROOF */}
        {currentTab === 'scorecards' && (
          <ScorecardsHistory />
        )}

        {/* TAB 5: NANO 4 DIAGNOSTICS & AI KEYS */}
        {currentTab === 'diagnostics' && (
          <NanoDiagnostics />
        )}
      </main>

      {/* Post Call Anonymized Scorecard Modal */}
      {showPostCallModal && completedScorecard && (
        <PostCallModal
          scorecard={completedScorecard}
          onSave={handleSaveScorecard}
          onDiscard={handleDiscardScorecard}
        />
      )}
    </div>
  );
};
