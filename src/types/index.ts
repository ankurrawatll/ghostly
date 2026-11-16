export type InferenceModeType = 'ON_DEVICE' | 'IN_CLOUD' | 'FALLBACK_LOCAL';

export interface LocalState {
  speaker: 'USER' | 'COUNTERPARTY';
  talkRatio: number; // 0.0 to 1.0 (User share)
  objectionDetected: boolean;
  objectionCategory: 'pricing' | 'competitor' | 'timeline' | 'scope' | 'legal' | 'none';
  commitmentText?: string;
  escalateToCloud: boolean;
  sanitizedQuery: string;
  confidence: number;
  timestamp: number;
}

export interface TacticalBattlecard {
  id: string;
  headline: string;
  counterMove: string;
  rationale: string;
  sourceRule: string;
  sourceRuleId?: string;
  inferenceSource: InferenceModeType;
  latencyMs: number;
  timestamp: number;
  isPinned?: boolean;
}

export interface PlaybookRule {
  id: string;
  triggerTopic: string;
  counterMove: string;
  proofPoint?: string;
}

export interface Playbook {
  id: string;
  title: string;
  scenarioType: 'sales' | 'fundraising' | 'recruiting' | 'vendor' | 'custom';
  description?: string;
  walkAwayGuardrails: string[];
  rules: PlaybookRule[];
  updatedAt: string;
  isDefault?: boolean;
}

export interface EgressAuditEntry {
  id: string;
  timestamp: number;
  payloadBytes: number;
  sanitizedQuery: string;
  objectionCategory: string;
  inferenceSource: InferenceModeType;
  latencyMs: number;
  rawSpeechBytesUploaded: 0; // Mathematically 0
  status: 'SUCCESS' | 'OFFLINE_FALLBACK' | 'ERROR';
}

export interface AnonymizedScorecard {
  id: string;
  sessionId: string;
  playbookTitle: string;
  durationSeconds: number;
  userTalkRatio: number;
  localInferencesCount: number;
  cloudEscalationsCount: number;
  rawBytesUploaded: 0;
  commitmentsCount: number;
  commitmentsList: string[];
  objectionCategories: Record<string, number>;
  createdAt: string;
}

export interface SimulationTurn {
  id: string;
  speaker: 'USER' | 'COUNTERPARTY';
  text: string;
  durationSec: number;
  expectedObjection?: string;
}

export interface CallScenario {
  id: string;
  title: string;
  category: 'Enterprise SaaS' | 'Startup Valuation' | 'Executive Comp';
  description: string;
  recommendedPlaybookId: string;
  turns: SimulationTurn[];
}
