# 🦅 GhostWing: Project Report & PRD
**Product Name:** GhostWing (formerly Ghostly)  
**Hackathon:** #BuildHybridAI 2026 (Google & Devpost — $30,000 Prize Pool)  
**Public Repository:** [https://github.com/ankurrawatll/ghostly](https://github.com/ankurrawatll/ghostly)  
**License:** Apache 2.0 (Open Source)

---

## 1. What This Hackathon Is

The **#BuildHybridAI 2026 Hackathon** is an official Google-managed competition on Devpost offering **$30,000 in cash prizes** ($10,000 Grand Prize, $3,000 Best Web/Chrome App, $3,000 Best Android App).

### What Google Wants You to Build:
Google launched a new technology called **Firebase AI Logic (Hybrid Inference SDK)**. 
Instead of sending every single word up to expensive cloud servers, your app must be **hybrid**:
1. **On-Device First**: Run fast, free, private AI locally on the user's laptop or phone (using **Gemini Nano 4** inside Google Chrome or Android).
2. **Cloud Escalation**: Only send small, high-stakes tasks to the cloud (Cloud Gemini 2.0 Flash) when deep strategic reasoning is needed or when the device goes offline.
3. **App Check Verification**: All cloud requests must be authenticated using Firebase App Check.

---

## 2. Why We Are Doing This (The "Why")

### The Problem With Tools Like Fireflies.ai:
Tools like Fireflies.ai, Otter.ai, and Fathom are popular, but they have major flaws:
1. **Creepy Meeting Bots**: They send a bot called `"Fireflies Notetaker"` into the meeting. Clients get suspicious, IT security blocks them, and executives ban them from sensitive investor or compensation calls.
2. **Privacy Nightmare**: 100% of your confidential audio (contracts, numbers, personal salaries) is sent to third-party cloud servers. One data breach exposes everything.
3. **Too Late to Help**: Fireflies only gives you notes **after** the meeting is over. If the client hit you with an objection during the call and you panicked, post-call notes can't win back the deal.

### The Solution — GhostWing:
GhostWing is a **100% private, bot-free negotiation wingman** that runs quietly in your browser:
- **No Bot**: It listens directly to your Google Meet or Zoom tab without anyone else knowing.
- **Zero Cloud Egress (Air-Gapped)**: Raw audio never leaves your computer's temporary memory (RAM). Zero bytes of speech are uploaded to any server.
- **Real-Time Live Coaching**: When the client says, *"Competitor X offered us 30% discount"*, an instant battlecard lights up on your screen telling you exactly how to defend your price.
- **Works Offline**: If your internet drops mid-call, on-device Gemini Nano 4 keeps coaching you seamlessly.

---

## 3. How a Regular Human Uses It (The User Journey)

1. **Step 1: Join your meeting**: Open Google Meet or Zoom in Chrome as you normally do.
2. **Step 2: Open GhostWing**: Open GhostWing in another tab or put it side-by-side.
3. **Step 3: Connect Audio**: Click **"Connect Mic"** and click **"Pick Google Meet Tab"** (tick the box *"Also share tab audio"*).
4. **Step 4: Speak with confidence**:
   - GhostWing shows a **Talk-to-Listen gauge** so you don't talk too much (keeps you in the 40–60% golden range).
   - Whenever the other person objects to pricing, terms, or valuation, GhostWing analyzes it locally and pops up a bold quote: *"Say this in your call: Anchor on 99.99% uptime..."* with a 1-click **Copy** button.
   - Any promise either person makes (*"I will send the revised contract by Friday"*) is automatically logged into the **Commitments Tracker**.
5. **Step 5: End Meeting**: Click **"End Meeting & Purge RAM"**. You get a clean post-call scorecard and all raw voice data is permanently wiped from memory.

---

## 4. What Has Actually Been Done So Far (Status Report)

| Component | Technical Implementation | Status |
| :--- | :--- | :---: |
| **Hybrid Inference Router** | `src/firebase/aiLogic.ts`<br>• Chrome Prompt API (Gemini Nano 4 on-device, ~42ms)<br>• Firebase Vertex AI (Cloud Gemini 2.0 Flash fallback)<br>• PII sanitizer (scrubs names, emails, card numbers before cloud) | ✅ **DONE** |
| **App Check Security** | `src/firebase/config.ts`<br>• App Check configured with debug token (`E6A8E701...`) for judge evaluation without friction | ✅ **DONE** |
| **Dual-Channel Audio Hub** | `src/components/HeroStudioView.tsx`<br>• User Mic (`getUserMedia`)<br>• Google Meet Tab (`getDisplayMedia` tab capture)<br>• Real-time Web Audio API frequency visualizer | ✅ **DONE** |
| **Luxury Design Overhaul** | `src/index.css`<br>• Top radiant magenta/violet ambient light bloom<br>• Fluted optical glass sound radar<br>• Refined dark glass cards and crisp white pill buttons | ✅ **DONE** |
| **Interactive Call Simulator** | `src/components/CallSimulator.tsx`<br>• 3 interactive scenarios (SaaS Renewal, Seed Term Sheet, Exec Comp)<br>• One-click **Airplane Mode** toggle to prove offline fallback to judges | ✅ **DONE** |
| **Playbooks Studio (Firestore)** | `src/components/PlaybooksStudio.tsx`<br>• Cloud Firestore knowledge base with custom AI rule generator and 4 default playbooks | ✅ **DONE** |
| **Air-Gap Network Egress Inspector** | `src/components/AirGapInspector.tsx`<br>• Live audit log proving **0 Bytes raw speech uploaded** to external servers | ✅ **DONE** |
| **Chrome MV3 Extension** | `dist/manifest.json`, `dist/sidepanel.html`<br>• Manifest V3 side panel extension built ready to load unpacked | ✅ **DONE** |
| **Android Companion App** | `android/`<br>• Kotlin + Jetpack Compose app skeleton configured with `com.google.firebase:firebase-ai-ondevice` | ✅ **DONE** |
| **GitHub Repository & License** | [github.com/ankurrawatll/ghostly](https://github.com/ankurrawatll/ghostly)<br>• Apache 2.0 license at root<br>• Completely scrubbed of credentials, keys, and private service configs | ✅ **DONE** |

---

## 5. What Remains to Cross the Finish Line & Win

To turn this solid technical foundation into an undisputed Hackathon Grand Prize winner:

1. **The "Non-Coder" 3-Step Welcome Header**:
   - Add a clean, welcoming 1-2-3 guide at the top of the screen so anyone landing on the site immediately knows: *1. Connect Mic → 2. Pick Meet Tab → 3. Start Call*.
2. **The "Private Fireflies" Post-Call One-Pager (Exportable Summary)**:
   - When the user clicks "End Call", pop up a beautiful, clean modal with:
     - 📝 **Executive Meeting Summary** (3 AI-generated bullet points)
     - 🎯 **Action Items & Promises** (Who agreed to do what)
     - 📊 **Talk-to-Listen Ratio** (Score and feedback)
     - 🛡️ **Air-Gap Privacy Badge** (Official certification: 0 bytes uploaded)
     - One-click **Copy to Clipboard** or **Save to Firestore**.
3. **3-Minute Demo Video Recording**:
   - Devpost requires a demo video under 3 minutes uploaded to YouTube.
   - We already have the 3-minute script ready in `README.md`.
4. **Deploy to Firebase Hosting**:
   - Deploy the build to `ghostly-957aa.web.app` so judges can test it live in their own browser.
