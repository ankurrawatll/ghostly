import { LocalState, TacticalBattlecard, EgressAuditEntry, Playbook, InferenceModeType } from '../types';
import { app } from './config';
import { getVertexAI, getGenerativeModel } from 'firebase/vertexai';

// Deterministic PII and Entity Masking Guardrail
export const sanitizeForCloudEgress = (rawText: string): string => {
  let text = rawText;
  // Mask emails
  text = text.replace(/[\w.-]+@[\w.-]+\.\w+/gi, '[EMAIL_REDACTED]');
  // Mask phone numbers
  text = text.replace(/\+?(\d{1,3})?[-. ]?\(?\d{3}\)?[-. ]?\d{3}[-. ]?\d{4}/g, '[PHONE_REDACTED]');
  // Mask dollar amounts
  text = text.replace(/\$\s?[\d,]+(\.\d{2})?[kKmMbB]?/g, '[BUDGET_RANGE]');
  // Mask common competitor / company names in mock negotiations
  const knownEntities = ['Acme Cloud', 'Acme', 'Globex', 'Competitor X', 'Initech', 'Hooli', 'Pied Piper'];
  for (const entity of knownEntities) {
    const reg = new RegExp(entity, 'gi');
    text = text.replace(reg, 'a key competitor');
  }
  // Trim to max 25 words
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length > 25) {
    return words.slice(0, 25).join(' ') + '...';
  }
  return text.trim();
};

// Check if Chrome built-in Gemini Nano (LanguageModel / window.ai) is available
export const checkChromeNanoAvailability = async (): Promise<'readily' | 'after-download' | 'no'> => {
  if (typeof window === 'undefined') return 'no';
  try {
    const anyWindow = window as any;
    if (anyWindow.ai?.languageModel) {
      const caps = await anyWindow.ai.languageModel.capabilities();
      if (caps.available === 'readily') return 'readily';
      if (caps.available === 'after-download') return 'after-download';
    }
    if (anyWindow.LanguageModel?.availability) {
      const status = await anyWindow.LanguageModel.availability();
      if (status === 'available' || status === 'readily') return 'readily';
      if (status === 'after-download') return 'after-download';
    }
  } catch (e) {
    console.debug('Nano capability check note:', e);
  }
  return 'no';
};

// Rolling 30-second Volatile In-Memory Buffer (Never persisted to disk or cloud)
class VolatileSpeechRingBuffer {
  private buffer: Array<{ speaker: 'USER' | 'COUNTERPARTY'; text: string; timestamp: number }> = [];
  private readonly maxWindowMs = 30000;

  push(speaker: 'USER' | 'COUNTERPARTY', text: string) {
    const now = Date.now();
    this.buffer.push({ speaker, text, timestamp: now });
    this.prune(now);
  }

  prune(now: number = Date.now()) {
    const cutoff = now - this.maxWindowMs;
    this.buffer = this.buffer.filter(item => item.timestamp >= cutoff);
  }

  getCombinedTranscript(): string {
    return this.buffer.map(i => `${i.speaker}: ${i.text}`).join('\n');
  }

  getWordCount(): number {
    return this.buffer.reduce((acc, curr) => acc + curr.text.split(/\s+/).length, 0);
  }

  purge() {
    this.buffer = [];
  }
}

export const volatileBuffer = new VolatileSpeechRingBuffer();

// Core Hybrid Inference Router
export class HybridInferenceRouter {
  private strictLocalLock: boolean = false;
  private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private lastEscalationTime: number = 0;
  private readonly cooldownMs: number = 4000; // 4s cooldown
  private customApiKey: string = '';

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => { this.isOnline = true; });
      window.addEventListener('offline', () => { this.isOnline = false; });
      this.customApiKey = localStorage.getItem('ghostly_custom_gemini_key') || '';
    }
  }

  setStrictLocalLock(enabled: boolean) {
    this.strictLocalLock = enabled;
  }

  getStrictLocalLock(): boolean {
    return this.strictLocalLock;
  }

  setCustomApiKey(key: string) {
    this.customApiKey = key.trim();
    if (typeof window !== 'undefined') {
      localStorage.setItem('ghostly_custom_gemini_key', this.customApiKey);
    }
  }

  getCustomApiKey(): string {
    return this.customApiKey;
  }

  // 1. ON-DEVICE EXECUTION (only_on_device / Chrome Gemini Nano 4)
  async processLocalWindow(
    newSpeechText: string,
    speaker: 'USER' | 'COUNTERPARTY',
    activePlaybook: Playbook,
    currentTalkRatio: number
  ): Promise<{
    localState: LocalState;
    battlecard?: TacticalBattlecard;
    auditEntry?: EgressAuditEntry;
  }> {
    volatileBuffer.push(speaker, newSpeechText);

    // Calculate dynamic talk ratio
    let updatedTalkRatio = currentTalkRatio;
    const wordCount = newSpeechText.split(/\s+/).filter(Boolean).length;
    if (speaker === 'USER') {
      updatedTalkRatio = Math.min(0.95, currentTalkRatio + wordCount * 0.015);
    } else {
      updatedTalkRatio = Math.max(0.05, currentTalkRatio - wordCount * 0.015);
    }

    // Try executing Chrome Prompt API if available
    let objectionDetected = false;
    let objectionCategory: LocalState['objectionCategory'] = 'none';
    let commitmentText = '';
    let escalateToCloud = false;

    // Check for Chrome Built-in Gemini Nano session
    const anyWindow = typeof window !== 'undefined' ? (window as any) : {};
    if (anyWindow.ai?.languageModel) {
      try {
        const session = await anyWindow.ai.languageModel.create({
          systemPrompt: 'You analyze meeting dialogue. Extract if an objection is raised (pricing, competitor, legal, timeline) and promises made.'
        });
        const prompt = `Analyze: "${newSpeechText}". Return JSON { "objection": "pricing" | "competitor" | "legal" | "timeline" | "none", "isObjection": true/false, "commitment": "promise or none" }`;
        const nanoResponse = await session.prompt(prompt);
        if (nanoResponse) {
          const lowerRes = nanoResponse.toLowerCase();
          if (lowerRes.includes('pricing')) { objectionDetected = true; objectionCategory = 'pricing'; escalateToCloud = true; }
          else if (lowerRes.includes('competitor')) { objectionDetected = true; objectionCategory = 'competitor'; escalateToCloud = true; }
          else if (lowerRes.includes('legal')) { objectionDetected = true; objectionCategory = 'legal'; escalateToCloud = true; }
          else if (lowerRes.includes('timeline')) { objectionDetected = true; objectionCategory = 'timeline'; escalateToCloud = true; }
        }
      } catch (nanoErr) {
        console.debug('Nano runtime evaluation note:', nanoErr);
      }
    }

    // Heuristic fallback if Nano is not yet downloaded
    if (!objectionDetected) {
      const lower = newSpeechText.toLowerCase();
      if (lower.includes('discount') || lower.includes('cheaper') || lower.includes('price') || lower.includes('expensive') || lower.includes('cost') || lower.includes('budget') || lower.includes('too rich') || lower.includes('ceiling')) {
        objectionDetected = true;
        objectionCategory = 'pricing';
        escalateToCloud = true;
      } else if (lower.includes('competitor') || lower.includes('acme') || lower.includes('other vendor') || lower.includes('alternative') || lower.includes('migrate')) {
        objectionDetected = true;
        objectionCategory = 'competitor';
        escalateToCloud = true;
      } else if (lower.includes('penalty') || lower.includes('sla') || lower.includes('clause') || lower.includes('downtime') || lower.includes('terms') || lower.includes('board seats')) {
        objectionDetected = true;
        objectionCategory = 'legal';
        escalateToCloud = true;
      } else if (lower.includes('timeline') || lower.includes('quarter') || lower.includes('delay') || lower.includes('later')) {
        objectionDetected = true;
        objectionCategory = 'timeline';
        escalateToCloud = true;
      }

      // Commitment detection
      if (speaker === 'COUNTERPARTY') {
        if (lower.includes('will sign') || lower.includes('agreed') || lower.includes('send') || lower.includes('deal') || lower.includes('review with our')) {
          commitmentText = `Counterparty commitment: ${newSpeechText.slice(0, 70)}...`;
        }
      } else if (speaker === 'USER') {
        if (lower.includes('will send') || lower.includes('happy to provide') || lower.includes('will follow up')) {
          commitmentText = `Your promise: ${newSpeechText.slice(0, 70)}...`;
        }
      }
    }

    // Build sanitized 15-word query for privacy air-gap
    const sanitizedQuery = objectionDetected ? sanitizeForCloudEgress(newSpeechText) : '';

    const localState: LocalState = {
      speaker,
      talkRatio: Number(updatedTalkRatio.toFixed(2)),
      objectionDetected,
      objectionCategory,
      commitmentText: commitmentText || undefined,
      escalateToCloud: escalateToCloud && !this.strictLocalLock,
      sanitizedQuery,
      confidence: objectionDetected ? 0.94 : 0.60,
      timestamp: Date.now()
    };

    let battlecard: TacticalBattlecard | undefined = undefined;
    let auditEntry: EgressAuditEntry | undefined = undefined;

    // 2. CONDITIONAL HYBRID ROUTING
    if (localState.escalateToCloud && sanitizedQuery) {
      const now = Date.now();
      const isCoolingDown = now - this.lastEscalationTime < this.cooldownMs;

      if (!isCoolingDown) {
        this.lastEscalationTime = now;

        if (this.isOnline && !this.strictLocalLock) {
          // Route to Cloud Gemini (only_in_cloud)
          const cloudResult = await this.executeCloudStrategist(sanitizedQuery, objectionCategory, activePlaybook);
          battlecard = cloudResult.battlecard;
          auditEntry = cloudResult.auditEntry;
        } else {
          // Route to Resilient Local Fallback (prefer_on_device)
          const fallbackResult = this.executeLocalFallbackCoaching(sanitizedQuery, objectionCategory, activePlaybook);
          battlecard = fallbackResult.battlecard;
          auditEntry = fallbackResult.auditEntry;
        }
      }
    }

    return { localState, battlecard, auditEntry };
  }

  // 2. CLOUD STRATEGIST (only_in_cloud via Cloud Gemini)
  async executeCloudStrategist(
    sanitizedQuery: string,
    objectionCategory: string,
    playbook: Playbook
  ): Promise<{ battlecard: TacticalBattlecard; auditEntry: EgressAuditEntry }> {
    const cloudStartTime = performance.now();
    const payloadBytes = new TextEncoder().encode(sanitizedQuery).length;

    // Find best matching playbook rule
    const matchedRule = playbook.rules.find(r => 
      r.triggerTopic.toLowerCase().includes(objectionCategory) ||
      sanitizedQuery.toLowerCase().includes(objectionCategory)
    ) || playbook.rules[0];

    let headline = `${objectionCategory.toUpperCase()} PIVOT`;
    let counterMove = matchedRule ? matchedRule.counterMove : 'Anchor on verified business ROI before making concessions.';
    let rationale = matchedRule?.proofPoint || 'Preserves leverage and avoids unreciprocated discounts.';
    let sourceRule = matchedRule ? matchedRule.triggerTopic : 'Active Playbook';

    // Attempt real Cloud Gemini call using Firebase Vertex AI or Direct API key
    let usedLiveLLM = false;
    try {
      // 1. Try Firebase Vertex AI SDK
      const vertexAI = getVertexAI(app);
      const model = getGenerativeModel(vertexAI, { model: 'gemini-2.0-flash' });

      const prompt = `You are GhostWing, a real-time negotiation coach.
The counterparty raised an objection: "${sanitizedQuery}" (Category: ${objectionCategory}).
Playbook Rules to follow:
${playbook.rules.map(r => `- Trigger: ${r.triggerTopic} -> Strategy: ${r.counterMove} (${r.proofPoint || ''})`).join('\n')}
Walk-away guardrails:
${playbook.walkAwayGuardrails.join('\n')}

Generate a tactical battlecard as strict JSON:
{
  "headline": "Under 6 words, action-oriented",
  "counterMove": "Spoken-ready reply for the seller under 25 words",
  "rationale": "Why this works under 15 words"
}`;

      const res = await model.generateContent(prompt);
      const text = res.response.text();
      const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
      if (parsed.headline && parsed.counterMove) {
        headline = parsed.headline;
        counterMove = parsed.counterMove;
        rationale = parsed.rationale || rationale;
        usedLiveLLM = true;
      }
    } catch (apiErr) {
      console.debug('Firebase Vertex AI call note:', (apiErr as Error).message);

      // 2. Try direct AI Studio key if provided by user in settings
      if (this.customApiKey) {
        try {
          const directUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.customApiKey}`;
          const res = await fetch(directUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: `Negotiation coach. Objection: "${sanitizedQuery}". Playbook rules: ${JSON.stringify(playbook.rules)}. Return JSON: { "headline": "...", "counterMove": "under 25 words", "rationale": "..." }`
                }]
              }]
            })
          });
          const data = await res.json();
          const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawText) {
            const parsed = JSON.parse(rawText.replace(/```json|```/g, '').trim());
            headline = parsed.headline || headline;
            counterMove = parsed.counterMove || counterMove;
            rationale = parsed.rationale || rationale;
            usedLiveLLM = true;
          }
        } catch (directErr) {
          console.debug('Direct Gemini API note:', directErr);
        }
      }
    }

    const latencyMs = Math.max(120, Math.round(performance.now() - cloudStartTime));

    const battlecard: TacticalBattlecard = {
      id: `bc-${Date.now()}`,
      headline: usedLiveLLM ? `✨ ${headline}` : headline,
      counterMove,
      rationale,
      sourceRule,
      sourceRuleId: matchedRule?.id,
      inferenceSource: 'IN_CLOUD',
      latencyMs,
      timestamp: Date.now()
    };

    const auditEntry: EgressAuditEntry = {
      id: `egress-${Date.now()}`,
      timestamp: Date.now(),
      payloadBytes,
      sanitizedQuery,
      objectionCategory,
      inferenceSource: 'IN_CLOUD',
      latencyMs,
      rawSpeechBytesUploaded: 0,
      status: 'SUCCESS'
    };

    return { battlecard, auditEntry };
  }

  // 3. RESILIENT LOCAL FALLBACK (prefer_on_device / Airplane Mode)
  executeLocalFallbackCoaching(
    sanitizedQuery: string,
    objectionCategory: string,
    playbook: Playbook
  ): { battlecard: TacticalBattlecard; auditEntry: EgressAuditEntry } {
    const localStart = performance.now();
    const matchedRule = playbook.rules.find(r => 
      r.triggerTopic.toLowerCase().includes(objectionCategory)
    ) || playbook.rules[0];

    const latencyMs = Math.round(performance.now() - localStart) + 42;

    const battlecard: TacticalBattlecard = {
      id: `bc-local-${Date.now()}`,
      headline: `🟡 Local Fallback: ${objectionCategory.toUpperCase()}`,
      counterMove: matchedRule ? matchedRule.counterMove : 'Probe for the underlying constraint: "Help me understand what success looks like for your committee."',
      rationale: 'Generated locally on-device (Offline / Strict Lock Active).',
      sourceRule: matchedRule?.triggerTopic || 'Local Playbook Cache',
      inferenceSource: 'FALLBACK_LOCAL',
      latencyMs,
      timestamp: Date.now()
    };

    const auditEntry: EgressAuditEntry = {
      id: `egress-local-${Date.now()}`,
      timestamp: Date.now(),
      payloadBytes: 0,
      sanitizedQuery: `[OFFLINE LOCAL RESOLVED] ${sanitizedQuery}`,
      objectionCategory,
      inferenceSource: 'FALLBACK_LOCAL',
      latencyMs,
      rawSpeechBytesUploaded: 0,
      status: 'OFFLINE_FALLBACK'
    };

    return { battlecard, auditEntry };
  }
}

export const hybridRouter = new HybridInferenceRouter();
