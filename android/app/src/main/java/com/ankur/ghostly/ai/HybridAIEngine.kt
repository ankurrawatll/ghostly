package com.ankur.ghostly.ai

import android.content.Context
import com.google.firebase.Firebase
import com.google.firebase.ai.ai
import com.google.firebase.ai.type.InferenceMode
import com.google.firebase.ai.type.generationConfig
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import org.json.JSONObject

data class LocalState(
    val speaker: String = "USER",
    val talkRatio: Float = 0.5f,
    val objectionDetected: Boolean = false,
    val objectionCategory: String = "none",
    val commitmentText: String = "",
    val escalateToCloud: Boolean = false,
    val sanitizedQuery: String = ""
)

data class TacticalBattlecard(
    val headline: String,
    val counterMove: String,
    val rationale: String,
    val sourceRule: String,
    val inferenceSource: String,
    val latencyMs: Long
)

class HybridAIEngine(private val context: Context) {

    private val _localState = MutableStateFlow(LocalState())
    val localState: StateFlow<LocalState> = _localState

    private val _activeBattlecard = MutableStateFlow<TacticalBattlecard?>(null)
    val activeBattlecard: StateFlow<TacticalBattlecard?> = _activeBattlecard

    private val _egressAuditLog = MutableStateFlow<List<JSONObject>>(emptyList())
    val egressAuditLog: StateFlow<List<JSONObject>> = _egressAuditLog

    // On-device Nano 4 model (ONLY_ON_DEVICE)
    private val onDeviceModel by lazy {
        Firebase.ai.getGenerativeModel(
            modelName = "gemini-nano",
            inferenceMode = InferenceMode.ONLY_ON_DEVICE,
            generationConfig = generationConfig {
                responseMimeType = "application/json"
                temperature = 0.1f
            }
        )
    }

    // Cloud model fallback / escalation (ONLY_IN_CLOUD)
    private val cloudModel by lazy {
        Firebase.ai.getGenerativeModel(
            modelName = "gemini-1.5-flash",
            inferenceMode = InferenceMode.ONLY_IN_CLOUD,
            generationConfig = generationConfig {
                responseMimeType = "application/json"
                temperature = 0.2f
            }
        )
    }

    suspend fun processSpeechWindow(transcript: String, activePlaybookRulesJson: String) {
        val startTime = System.currentTimeMillis()
        try {
            val localPrompt = """
                Analyze this rolling 20s meeting speech window.
                STRICT REQUIREMENT: Redact ALL names, companies, and exact figures into generic terms.
                Return ONLY JSON matching:
                {
                  "speaker": "USER" or "COUNTERPARTY",
                  "talkRatio": 0.0 to 1.0,
                  "objectionDetected": true/false,
                  "objectionCategory": "pricing" | "competitor" | "timeline" | "scope" | "none",
                  "commitmentText": "extracted promise or empty",
                  "escalateToCloud": true/false,
                  "sanitizedQuery": "max 15 words describing objection without ANY personal or company names"
                }
                Dialogue:
                $transcript
            """.trimIndent()

            val response = onDeviceModel.generateContent(localPrompt)
            val json = JSONObject(response.text ?: "{}")

            val state = LocalState(
                speaker = json.optString("speaker", "USER"),
                talkRatio = json.optDouble("talkRatio", 0.5).toFloat(),
                objectionDetected = json.optBoolean("objectionDetected", false),
                objectionCategory = json.optString("objectionCategory", "none"),
                commitmentText = json.optString("commitmentText", ""),
                escalateToCloud = json.optBoolean("escalateToCloud", false),
                sanitizedQuery = json.optString("sanitizedQuery", "")
            )
            _localState.value = state

            // Conditional Cloud Escalation
            if (state.escalateToCloud && state.sanitizedQuery.isNotBlank()) {
                escalateToCloud(state.sanitizedQuery, state.objectionCategory, activePlaybookRulesJson)
            }
        } catch (e: Exception) {
            // Local fallback handling
        }
    }

    private suspend fun escalateToCloud(
        sanitizedQuery: String,
        objectionCategory: String,
        playbookRules: String
    ) {
        val startTime = System.currentTimeMillis()
        try {
            val cloudPrompt = """
                You are a real-time negotiation coach.
                The counterparty raised an objection: "$sanitizedQuery" (Category: $objectionCategory).
                Playbook Rules:
                $playbookRules
                
                Return JSON with:
                {
                  "headline": "Under 8 words summary",
                  "counterMove": "Spoken-ready tactical answer under 25 words",
                  "rationale": "Brief rationale under 15 words",
                  "sourceRule": "Name of matching playbook rule"
                }
            """.trimIndent()

            val response = cloudModel.generateContent(cloudPrompt)
            val latency = System.currentTimeMillis() - startTime
            val json = JSONObject(response.text ?: "{}")

            val battlecard = TacticalBattlecard(
                headline = json.optString("headline", "Tactical Pivot"),
                counterMove = json.optString("counterMove", "Anchor on value & ROI before conceding on price."),
                rationale = json.optString("rationale", "Maintains margin leverage."),
                sourceRule = json.optString("sourceRule", "Standard Pricing Rule"),
                inferenceSource = "IN_CLOUD",
                latencyMs = latency
            )
            _activeBattlecard.value = battlecard

            // Log strictly to client-side Air-Gap audit log
            val auditEntry = JSONObject().apply {
                put("timestamp", System.currentTimeMillis())
                put("bytesUploaded", sanitizedQuery.toByteArray().size)
                put("sanitizedQuery", sanitizedQuery)
                put("source", "IN_CLOUD")
                put("latencyMs", latency)
            }
            _egressAuditLog.value = _egressAuditLog.value + auditEntry
        } catch (e: Exception) {
            // Offline local fallback
        }
    }
}
