# 🛡️ GhostWing: Zero-Upload Live Meeting & Negotiation Wingman

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Firebase AI Logic](https://img.shields.io/badge/Firebase-AI_Logic_Hybrid_Inference-orange.svg)](https://firebase.google.com)
[![Chrome Built-in AI](https://img.shields.io/badge/Chrome-Gemini_Nano_4-4285F4.svg)](https://developer.chrome.com)
[![Platform](https://img.shields.io/badge/Platform-Web_%2F_Chrome_Extension_%7C_Android-success.svg)](#cross-platform-architecture)

> **Bot-free, zero-upload negotiation copilot powered by Firebase AI Logic's Hybrid Inference SDK.**  
> Chrome Gemini Nano 4 processes live speech **100% locally** in volatile memory to track conversation state and strip PII, escalating **only anonymized, 15-word triggers** to Cloud Gemini for tactical battlecards.

---

## 🎯 The Core Problem & Our Breakthrough

Every existing AI meeting assistant (Otter, Fireflies, Zoom AI) either joins as an intrusive bot or streams continuous raw audio to cloud servers. In **M&A calls, executive HR interviews, and high-stakes enterprise sales negotiations**, recording or uploading audio violates NDAs, enterprise security policies, and client trust.

### The GhostWing Architectural Air-Gap:
1. **100% Local Sensory & State Extraction (`only_on_device`)**:  
   Audio capture, transcription, speaker attribution, and conversation state extraction occur strictly in your browser using Chrome's built-in **Gemini Nano 4**. **0 bytes of raw audio or verbatim transcripts ever leave your device.**
2. **Deterministic PII Redaction**:  
   Company names, individual names, emails, and exact financial figures are masked locally into generic semantic roles.
3. **Anonymized Cloud Escalation (`only_in_cloud`)**:  
   Only when a high-stakes objection fires (e.g., pricing pushback, competitor discount, SLA penalty), a sanitized **≤15-word trigger** queries Cloud Gemini + your private **Cloud Firestore Playbooks** to surface a tactical counter-argument in **under 800ms**.
4. **Resilient Offline Continuity (`prefer_on_device`)**:  
   If your Wi-Fi drops mid-call, GhostWing automatically switches to local tactical heuristics—your HUD never freezes or crashes.

---

## 🏗️ Hybrid Inference Architecture

```
[Browser Tab Audio + Mic]
           │
           ▼
[Web Audio API + In-Memory Volatile Ring Buffer] (Overwritten every 30s)
           │
           ▼
┌────────────────────────────────────────────────────────────────┐
│ LOCAL ENGINE: Firebase AI Logic (mode: "only_on_device")       │
│ Model: Chrome Gemini Nano 4 + Structured JSON Schema           │
│ • Calculates real-time Talk-to-Listen ratio                    │
│ • Detects objections & verbal commitments                      │
│ • Enforces local PII scrubbing & entity generalization         │
│ • Outputs sanitized 15-word query JSON                         │
└───────────────────────────────┬────────────────────────────────┘
                                │
        ┌───────────────────────┴───────────────────────┐
        ▼ (Routine turns: 0 bytes uploaded)             ▼ (High-stakes trigger detected)
[Update Local HUD]                              [Check Network & Strict Lock]
• Talk-to-Listen Gauge                                  │
• Commitments Tracker                      ┌────────────┴────────────┐
• 0 B Raw Egress Verified                  ▼ (Online)                ▼ (Offline / Airplane Mode)
                               ┌──────────────────────┐    ┌──────────────────────┐
                               │ CLOUD ENGINE         │    │ LOCAL FALLBACK       │
                               │ mode: only_in_cloud  │    │ mode: prefer_on_device│
                               │ Model: Cloud Gemini  │    │ Model: Nano 4 Local  │
                               │ + Firestore Playbook │    │ Tactical Heuristics  │
                               └──────────┬───────────┘    └──────────┬───────────┘
                                          │                           │
                                          └─────────────┬─────────────┘
                                                        ▼
                                       [Tactical Battlecard Surfaced]
                                       • Spoken-ready counter-move (<25 words)
                                       • Playbook citation & rationale
                                       • Air-Gap Egress Audit Log updated
```

---

## ⚡ 60-Second Quick Start for Judges & Evaluators

You can test the complete hybrid inference loop and offline fallback **in under 60 seconds** without even joining a video call!

### Method A: Interactive In-Browser Call Simulator (Instant)
1. Run the local development server:
   ```bash
   npm install
   npm run dev
   ```
2. Open `http://localhost:5173` in Google Chrome.
3. On the **Simulator** tab:
   * Click **Start Mock Call** (simulates an Enterprise SaaS renewal with Marcus from Acme).
   * Watch the **Talk-to-Listen Ratio** update in real time.
   * On Turn 3, watch an objection trigger an instant **Cloud Gemini Battlecard**.
   * Toggle **"Simulate Wi-Fi Drop (Airplane Mode)"** mid-call to verify seamless **Local Fallback (`prefer_on_device`)**.
   * Click the **Air-Gap Network Egress Inspector** to inspect the live audit log showing **0 B raw audio uploaded** and the exact 15-word JSON payloads.

---

### Method B: Chrome Extension Side Panel (Manifest V3)
1. Build the extension package:
   ```bash
   npm run build
   ```
2. In Google Chrome, go to `chrome://extensions`.
3. Enable **Developer mode** (top-right toggle).
4. Click **Load unpacked** and select the `dist/` directory from this repository.
5. Click the GhostWing extension icon in your browser toolbar to open the **Chrome Side Panel HUD** alongside Google Meet or Zoom Web!

---

## ⚙️ Enabling Chrome On-Device Gemini Nano 4

For the full on-device hardware experience:
1. Open a new tab and go to `chrome://flags/#prompt-api-for-gemini-nano`.
2. Set **Prompt API for Gemini Nano** to **Enabled**.
3. Relaunch Chrome.
4. Open the **Diagnostics** tab in GhostWing to verify `LanguageModel.availability()` returns `readily`!  
*(Note: If Chrome has not finished downloading model weights on your device, GhostWing gracefully provides local simulation + cloud fallback mode so you can test all features immediately).*

---

## 🔐 Firebase Ecosystem Integration

GhostWing leverages 5 core Firebase services:
1. **Firebase AI Logic (`firebase/ai`)**: Powers unified hybrid routing (`only_on_device`, `only_in_cloud`, and `prefer_on_device`).
2. **Firebase App Check**: Mandatory hackathon requirement. Uses a scoped debug token (`VITE_APPCHECK_DEBUG_TOKEN`) so judges and developers pass App Check validation without captchas.
3. **Cloud Firestore**: Stores customizable Negotiation Playbooks (`users/{uid}/playbooks`) and anonymized post-call scorecards (`users/{uid}/scorecards`) with strict security rules (`request.auth.uid == userId`).
4. **Firebase Authentication**: Supports 1-click Anonymous sign-in for seamless judge evaluation plus Google Sign-In.
5. **Firebase Remote Config**: Dynamically tunes operational thresholds (`escalation_confidence_threshold: 0.80`, `force_strict_local: false`).

---

## 📱 Cross-Platform Architecture: Web + Android

GhostWing is designed from the ground up for multi-platform synergy:
* **Web & Chrome Side Panel (`/src`)**: Desktop wingman for Google Meet, Zoom Web, and Microsoft Teams calls.
* **Android Pocket Companion (`/android`)**: In-person room companion for coffee-shop investor meetings, vendor haggling, and phone calls. Uses `com.google.firebase:firebase-ai-ondevice` for on-device Gemini Nano mic listening in Airplane Mode, syncing to the exact same Firestore Playbooks collection.

---

## 🎥 3-Minute Demo Video Script (For Judges)

1. **0:00 - 0:40 (The Problem & The Air-Gap Guarantee)**:  
   Show Google Meet call under NDA. Explain why bots like Otter are banned. Point to the GhostWing Side Panel and the **"0 B Raw Egress"** badge.
2. **0:40 - 1:30 (Local State & Talk Ratio)**:  
   Start call. Show Talk-to-Listen gauge balancing dynamically on-device. Open the **Air-Gap Network Egress Inspector** showing 0 bytes uploaded.
3. **1:30 - 2:15 (Cloud Playbook Escalation)**:  
   Counterparty demands a 28% competitor discount. Local Nano 4 detects the objection, strips the competitor name, and dispatches a 14-word sanitized JSON. Cloud Gemini returns a tailored battlecard grounded in the user's Firestore Playbook in **580ms**.
4. **2:15 - 2:45 (Airplane Mode / Offline Fallback)**:  
   Actively disconnect Wi-Fi. Trigger another objection. Show the HUD seamlessly transition to **🟡 Local Fallback (`prefer_on_device`)** with zero interruption.
5. **2:45 - 3:00 (Post-Call Scorecard & RAM Purge)**:  
   End call. Show volatile RAM buffer wiped and anonymized metrics saved to Firestore.

---

## 📄 License

This project is open-source under the [Apache License, Version 2.0](LICENSE).
