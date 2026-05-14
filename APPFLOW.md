# APPLICATION FLOW (APPFLOW)
## User Journeys & Interaction Flows

**Last Updated:** May 13, 2026  
**Version:** 1.0

---

## 1. USER JOURNEY: BASIC VOICE → OPTIMIZED PROMPT

### Flow Overview
```
User Opens App
   ↓
Sees Chat Interface with Voice Recorder
   ↓
Records Voice Message (1-2 min)
   ↓
System Shows Waveform
   ↓
User Clicks "Send"
   ↓
Backend Processes (STT → Intent → Confirmation → Optimization)
   ↓
System Shows Confirmation Modal
   ↓
User Confirms Intent
   ↓
System Shows Optimized Prompt + Token Metrics
   ↓
User Copies or Views History
```

### Detailed Steps

#### Step 1: User Records Voice
**UI State:**
```
┌─────────────────────────────────┐
│  TOTEM - Voice Prompt Engine    │
├─────────────────────────────────┤
│                                 │
│  🎤 Recording...                │
│  ▓▓▓▓▓░░░░ 0:45                 │
│  [Stop Recording] [Cancel]      │
│                                 │
│  Waveform visualization:        │
│  ∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿        │
│                                 │
└─────────────────────────────────┘
```

**System Actions:**
- Request microphone permission (if first time)
- Start Web Audio API recording
- Display real-time waveform (Wavesurfer.js)
- Show elapsed time & timer
- Allow stop/cancel at any time

**Error Handling:**
- No microphone → Show error: "Microphone not found"
- Permission denied → Show: "Please allow microphone access"
- Recording error → Show: "Recording failed, try again"

---

#### Step 2: User Uploads Audio
**UI State:**
```
┌─────────────────────────────────┐
│  TOTEM - Voice Prompt Engine    │
├─────────────────────────────────┤
│                                 │
│  ⏳ Uploading...                 │
│  ▓▓▓▓░░░░░░ 45%                 │
│                                 │
│  [Cancel Upload]                │
│                                 │
└─────────────────────────────────┘
```

**System Actions:**
- Encode audio (WAV/MP3)
- Send to backend via HTTPS
- Show upload progress

**Error Handling:**
- Network timeout → Retry with exponential backoff
- Upload fails → Show: "Upload failed. Retry?"

---

#### Step 3: System Transcribes Audio
**UI State:**
```
┌─────────────────────────────────┐
│  TOTEM - Voice Prompt Engine    │
├─────────────────────────────────┤
│                                 │
│  🔄 Transcribing...              │
│  (2-3 seconds)                  │
│                                 │
│  Chat History:                  │
│  [Previous message]             │
│                                 │
└─────────────────────────────────┘
```

**Backend Actions:**
- Call Deepgram API (prerecorded or streaming)
- Receive transcription: "Ek marketing plan bana do for gym app"
- Detect language: "hinglish"
- Get confidence: 0.98 (98%)

**Error Handling:**
- Low confidence (<60%) → Frontend shows: "Couldn't hear clearly. Record again?"

---

#### Step 4: System Extracts Intent
**UI State:**
```
┌─────────────────────────────────┐
│  TOTEM - Voice Prompt Engine    │
├─────────────────────────────────┤
│                                 │
│  Chat:                          │
│  User: [Waveform] 0:45          │
│  System: ⏳ Processing...        │
│                                 │
└─────────────────────────────────┘
```

**Backend Actions:**
- Call Gemini API for intent extraction
- Extract intent details (task, format, domain, constraints)
- Get confidence: 0.92 (92%)

---

#### Step 5: User Confirms Intent (CRITICAL STEP)
**UI State:**
```
┌─────────────────────────────────┐
│  TOTEM - Voice Prompt Engine    │
├─────────────────────────────────┤
│                                 │
│  ┌─ CONFIRMATION MODAL ────┐   │
│  │                         │   │
│  │ You want to:            │   │
│  │                         │   │
│  │ Create a marketing plan │   │
│  │ Format: Bullet points   │   │
│  │ Domain: Marketing       │   │
│  │                         │   │
│  │ [Confirm] [Clarify]     │   │
│  │         [Cancel]        │   │
│  └─────────────────────────┘   │
│                                 │
└─────────────────────────────────┘
```

**User Choices:**
1. **Confirm** → Proceed to optimization
2. **Clarify** → Re-record voice message
3. **Cancel** → Abandon & start new

**System Actions:**
- NO EXECUTION WITHOUT CONFIRMATION
- Log decision: `intent_confirmed = true`

---

#### Step 6: System Optimizes Prompt
**UI State:**
```
┌─────────────────────────────────┐
│  TOTEM - Voice Prompt Engine    │
├─────────────────────────────────┤
│                                 │
│  🤖 Optimizing...               │
│  (1-2 seconds)                  │
│                                 │
│  Chat:                          │
│  User: [Transcription]          │
│  System: Processing...          │
│                                 │
└─────────────────────────────────┘
```

**Backend Actions:**
- Call Gemini API (temperature=0)
- Optimize the prompt
- Calculate token reduction percentage
- Return final result to frontend

---

#### Step 7: Display Optimized Prompt
**UI State:**
```
┌─────────────────────────────────┐
│  TOTEM - Voice Prompt Engine    │
├─────────────────────────────────┤
│                                 │
│  Chat:                          │
│  ┌─ User Message ──────────┐   │
│  │ [Waveform] 0:45         │   │
│  │ "Ek marketing plan..."  │   │
│  └──────────────────────────┘   │
│                                 │
│  ┌─ System Optimization ───┐   │
│  │ OPTIMIZED PROMPT:       │   │
│  │ "You are a marketing... │   │
│  │  3-step plan. Bullet    │   │
│  │  points. <100 words."   │   │
│  │                         │   │
│  │ 📊 Metrics:             │   │
│  │ • Tokens: 35 → 18       │   │
│  │ • Reduction: ↓ 48.6%    │   │
│  │                         │   │
│  │ [📋 Copy] [💾 Save]     │   │
│  │ [👍 Helpful] [👎 Skip]  │   │
│  └─────────────────────────┘   │
│                                 │
└─────────────────────────────────┘
```

**User Actions:**
- Copy to clipboard (Icon: 📋)
- Save decision (Icon: 💾)
- Mark as helpful (Icon: 👍) → Improve memory
- Skip (Icon: 👎) → Don't save

---

## 2. USER JOURNEY: WITH MEMORY CONTEXT

### Flow Overview
```
User Opens App (Has Prior Chat History)
   ↓
System Retrieves Relevant Memories
   ↓
User Records Voice
   ↓
System Transcribes → Intent (Enhanced with Memory)
   ↓
System Shows: "Based on prior context..."
   ↓
User Confirms (or Rejects Memory Enhancement)
   ↓
System Optimizes (Memory-informed)
   ↓
System Suggests Memory Update
   ↓
User Confirms/Skips Update
```

### Example: Marketing Prompts with Memory

**Chat History:**
1. First message: "Marketing plan for gym app"
   - Memory created: `{task: "marketing", domain: "gym"}`
2. Second message: "Marketing plan for restaurant"
   - Memory updated: `{task: "marketing", domains: ["gym", "restaurant"]}`

**Third Message (New):**
```
User: "Plan for cafe business"

System Processing:
├─ Extract intent: {task: "marketing", domain: "cafe"}
├─ Retrieve similar memories: [cafe marketing, restaurant marketing]
├─ Enhanced intent: {task: "marketing", domain: "cafe", 
│  similar_contexts: ["restaurant", "gym"]}
└─ Show suggestion: "I remember you create marketing plans. 
                    Create one for a cafe?"

User Confirms:
├─ Proceed to optimization
├─ Use memory context in prompt
└─ Suggest memory merge: "Merge cafe + restaurant memories?"
```

---

## 3. USER JOURNEY: ANALYTICS & REVIEW

### Analytics Dashboard

**UI State:**
```
┌───────────────────────────────────────┐
│  TOTEM - Analytics Dashboard          │
├───────────────────────────────────────┤
│                                       │
│  📊 Session Summary                   │
│  ├─ Total Optimizations: 12           │
│  ├─ Avg Token Reduction: 41.2%        │
│  ├─ Intent Accuracy: 95%              │
│  └─ Memory Nodes: 8                   │
│                                       │
│  📈 Charts:                           │
│  ├─ Token Reduction Trend (Chart)     │
│  ├─ Intent Accuracy Over Time (Chart) │
│  └─ Memory Effectiveness (Chart)      │
│                                       │
│  📋 Recent Decisions:                 │
│  ├─ [10:30] Marketing plan ✓ 48%     │
│  ├─ [10:25] Social media  ✓ 35%      │
│  └─ [10:20] Blog outline  ✓ 52%      │
│                                       │
│  [📥 Export Logs] [🔄 Refresh]       │
│                                       │
└───────────────────────────────────────┘
```

**Available Actions:**
- View decision logs (JSON export)
- Analyze trends (accuracy, token reduction)
- Filter by date range
- Compare memory effectiveness

---

## 4. ERROR RECOVERY FLOWS

### Flow: Low Confidence Audio

```
User Uploads Audio
   ↓
System detects: confidence = 0.45 (45%)
   ↓
System Shows Error:
"Couldn't hear clearly. Try again?"
   ├─ [Re-record]
   └─ [Use Anyway]
   ↓
User Re-records
   ↓
Continue with new audio
```

### Flow: Intent Rejection

```
User Confirms Intent
   ↓
User Clicks "Clarify"
   ↓
Modal Closes
   ↓
System Shows: "Let me try again..."
   ↓
Show new extraction options:
├─ [Suggestion 1]
├─ [Suggestion 2]
└─ [Record Again]
   ↓
User Selects or Re-records
```

### Flow: API Rate Limit

```
User Requests Optimization
   ↓
Gemini API returns: 429 (Rate Limited)
   ↓
System Shows: "Optimization queue: position #3"
   ↓
System Retries After 5 seconds
   ↓
Success → Show optimized prompt
```

---

## 6. EDGE CASES & RECOVERY

### Case 1: User Closes Browser During Processing
**Expected Behavior:**
- Session state saved in localStorage
- User opens app again
- System shows: "Resuming previous optimization..."
- Recovery happens automatically

### Case 2: Network Disconnect
**Expected Behavior:**
- HTTP request fails or times out
- UI shows: "Connection lost. Retry?"
- User can manually retry the action
- Resume from last known state

### Case 3: User Rejects Confirmation Multiple Times
**Expected Behavior:**
- After 2 rejections: Show "Let's try a different approach"
- Offer: Re-record OR manual intent input
- Prevent infinite loops

### Case 4: Memory Merge Conflicts
**Expected Behavior:**
- Detect similarity: 2 memories are 95% similar
- Show: "Should I merge these memories?"
- User chooses: Merge / Keep Separate
- Log decision for future improvements

---

## 7. ACCESSIBILITY FEATURES

### Keyboard Navigation
```
Tab → Move between elements
Enter → Confirm/Submit
Space → Record/Pause
Escape → Cancel/Close Modal
Alt+C → Copy optimized prompt
Alt+S → Save decision
```

### Screen Reader Support
```
"Voice recorder button, press to start recording"
"Recording 45 seconds"
"Confirmation modal: Create marketing plan for gym app"
"Token reduction: 48 percent"
"Copy button: Copy optimized prompt"
```

---

## 8. MOBILE FLOW (Future)

```
User Opens App on Mobile
   ↓
Auto-detects mobile browser
   ↓
Show simplified UI:
├─ Large microphone button (full width)
├─ Simplified confirmation modal
├─ Optimized prompt in scrollable area
└─ Compact action buttons
   ↓
All flows same as desktop
```

---

**Next:** See BACKEND_SCHEMA.md for database details.
