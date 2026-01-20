# 🎯 Simple Block & Auto-Submit Explanation

## What Happens When User Cheats

### Example: User Presses ESC Key

```
12:05:30 - User presses ESC
           ↓
           Quiz.jsx detects ESC in handleKeyDown()
           ↓
           Calls handleCheatingDetected()
           ↓
           Sends POST to /api/quizzes/{quizId}/block
           ↓
           Backend:
           - Gets studentId from JWT token
           - Creates block entry: { studentId, expiresAt: now + 30s }
           - Saves to database
           - Returns: { blocked: true, remainingSeconds: 30 }
           ↓
           Frontend receives response:
           - setQuizFrozen(true)  → disable all quiz interaction
           - showFrozenOverlay()  → show "Quiz Frozen" modal
           - startCountdown(30)   → show timer counting down
           ↓

12:05:35 - Frontend polls every 5 seconds:
           GET /api/quizzes/{quizId}/block-status
           ↓
           Backend returns: { blocked: true, remainingSeconds: 25 }
           ↓
           Frontend updates timer display: "25 seconds"
           
12:05:40 - Student is still blocked, timer: "20 seconds"

12:05:45 - Student is still blocked, timer: "15 seconds"

12:05:50 - Student is still blocked, timer: "10 seconds"

12:05:55 - Student is still blocked, timer: "5 seconds"

12:06:00 - Block expires! remainingSeconds = 0
           ↓
           Frontend checks:
           - Is tab visible? Check: !document.hidden
           - Is fullscreen active? Check: document.fullscreenElement
           
           If EITHER is false (not in tab OR not fullscreen):
           ↓
           AUTOMATICALLY CALL: handleSubmit()
           ↓
           POST /api/quizzes/{quizId}/submit with current answers
           ↓
           Backend scores the quiz
           ↓
           Frontend redirects to /thankyou
           
           If BOTH are true (in tab AND fullscreen):
           ↓
           Just unfreeze: setQuizFrozen(false)
           ↓
           Show toast: "Block expired, continue carefully!"
           ↓
           User can resume answering
```

---

## Visual Timeline

```
Quiz Start (12:00:00)
│
├─ User answers Q1, Q2
│
├─ Answers saved every 5 seconds
│  Database: answers: [Q1: A, Q2: B]
│
├─ (12:05:30) User presses ESC ⚠️
│
├─ BLOCK ACTIVATED
│  └─ Show frozen overlay
│  └─ Timer: 30 seconds
│
├─ Poll every 5 seconds
│  └─ Time 1: 25 seconds remaining ✓
│  └─ Time 2: 20 seconds remaining ✓
│  └─ Time 3: 15 seconds remaining ✓
│  └─ Time 4: 10 seconds remaining ✓
│  └─ Time 5: 5 seconds remaining ✓
│  └─ Time 6: 0 seconds remaining ← Block expires!
│
├─ Check Status (Auto-submit if out of fullscreen)
│  └─ If ✗ fullscreen or ✗ visible tab → AUTO-SUBMIT
│  └─ If ✓ fullscreen and ✓ visible tab → UNFREEZE
│
└─ End
```

---

## The Three Outcomes

### Outcome 1: Block Expires, User Still in Quiz (Fullscreen + Tab Visible)
```
Block timer reaches 0 ✓
└─ Check: fullscreen? YES ✓
└─ Check: visible tab? YES ✓
└─ Action: UNFREEZE
└─ Show: "Block expired. Continue carefully!"
└─ User: Can resume answering
```

### Outcome 2: Block Expires, User NOT in Fullscreen
```
Block timer reaches 0 ✓
└─ Check: fullscreen? NO ✗
└─ Action: AUTO-SUBMIT
└─ Call: handleSubmit()
└─ Behavior: Submits current answers, redirects to thank you
```

### Outcome 3: Block Expires, User Switched Tabs
```
Block timer reaches 0 ✓
└─ Check: visible tab? NO ✗
└─ Action: AUTO-SUBMIT
└─ Call: handleSubmit()
└─ Behavior: Submits current answers, redirects to thank you
```

---

## What About Network Loss?

### Scenario: User Closes Quiz During Block

```
User in block (10 seconds remaining)
↓
User closes browser/turns off internet
↓
Quiz page unloads
↓
beforeunload event triggered
↓
Final save-progress called (in background via keepalive)
↓
Current answers + timeLeft saved to database
↓
Session ends
```

### Later: User Re-opens Quiz

```
User logs back in
↓
Opens quiz again
↓
GET /api/quizzes/{quizId}
↓
Backend checks:
  - Is student blocked? YES
  - Remaining seconds? 5 seconds
↓
Response includes:
  - blocked: true
  - remainingSeconds: 5
  - previous answers (restored)
  - previous question index (restored)
  - previous timeLeft (restored)
↓
Frontend shows:
  - Quiz frozen overlay (block still active)
  - Timer showing 5 seconds
  - Previous answers highlighted
↓
After block expires → auto-submit or unfreeze (same as before)
```

---

## Database State During Block

### When Block is Active

```javascript
// quizConfig.blocked array looks like this:
blocked: [
  {
    studentId: 123,
    expiresAt: "2025-01-19T12:06:00.000Z"
  }
]

// Current time: 2025-01-19T12:05:30.000Z
// Remaining: 30 seconds
```

### Checking Block Status

```javascript
// Backend logic in getBlockStatus():
const now = new Date();
const block = quizConfig.blocked.find(b => b.studentId === 123);

if (block && block.expiresAt > now) {
  // Block is ACTIVE
  const remainingSeconds = Math.ceil((block.expiresAt - now) / 1000);
  return { blocked: true, remainingSeconds };
} else {
  // Block is EXPIRED or doesn't exist
  return { blocked: false, remainingSeconds: 0 };
}
```

### After Block Expires

```javascript
// Backend automatically removes expired blocks:
quizConfig.blocked = quizConfig.blocked.filter(
  b => new Date(b.expiresAt) > now
);

// So if student re-opens quiz after block expires:
blocked: []  // Empty array
```

---

## Progress Saving During Block

### What Gets Saved?

Even while FROZEN, if user:
- Selected answer before being blocked
- Made changes before closing quiz

All answers are saved in QuizProgress:

```javascript
QuizProgress {
  studentId: 123,
  quizId: 456,
  answers: [
    { questionId: 0, selectedOption: "Option A" },
    { questionId: 1, selectedOption: "Option B" }
  ],
  currentQuestionIndex: 1,  // Last question viewed
  timeLeft: 599,             // Time remaining when blocked
  completed: false
}
```

### When Is This Saved?

1. **Every 5 seconds** (auto-save interval)
2. **On answer selection** (immediate, before block)
3. **On quiz unload** (if connection drops)

So even if block is triggered mid-answer, the answer selection that triggered the block is already saved!

---

## The Complete Auto-Submit Logic

```javascript
// Location: Quiz.jsx, lines 330-365

if (blockExpires && blockCountdown <= 0) {
  // Block time is up
  
  if (document.hidden || !document.fullscreenElement) {
    // CONDITION: (NOT visible) OR (NOT fullscreen)
    // This means: "Exit fullscreen" OR "Switch tabs"
    
    console.log("Auto-submitting quiz...");
    handleSubmit();
    // ↓ Sends POST /submit with current answers
    // ↓ Quiz gets scored
    // ↓ Redirect to /thankyou
    
  } else {
    // CONDITION: (visible) AND (fullscreen)
    // This means: "Still watching quiz in fullscreen"
    
    console.log("Unfreezing quiz...");
    setQuizFrozen(false);
    toast.success("Block expired. Continue carefully!");
    // ↓ Quiz becomes interactive again
    // ↓ User can continue answering
  }
}
```

---

## Real-World Examples

### Example 1: Caught Red-Handed
```
Student in fullscreen, answering questions
↓
Student loses patience, presses ESC to exit fullscreen
↓
BLOCKED for 30 seconds (ESC detected)
↓
Student realizes mistake, re-enters fullscreen quickly
↓
Countdown: 25, 20, 15, 10, 5, 0 seconds
↓
Block expires, fullscreen is active → UNFREEZE
↓
"Block expired. Continue carefully!" - Student continues quiz
```

### Example 2: Attempted Escape
```
Student in quiz, answers 2 out of 5 questions
↓
Student clicks back button to try to leave quiz
↓
BLOCKED for 30 seconds (back button detected)
↓
Tries to exit fullscreen to "close the quiz"
↓
Countdown: 25, 20, 15, 10, 5, 0 seconds
↓
Block expires, fullscreen is NOT active → AUTO-SUBMIT
↓
Quiz submitted with 2 answers (that's all they got!)
↓
Redirected to /thankyou
```

### Example 3: Network Failure During Block
```
Student blocked (20 seconds remaining)
↓
Power goes out / WiFi drops
↓
Browser closes, unsaved progress is sent via keepalive
↓
Student re-opens quiz 2 minutes later
↓
Block has expired by now (only 20 seconds was needed)
↓
GET /api/quizzes/{quizId} returns:
  - blocked: false (block expired)
  - answers: [Q1: A, Q2: B] (saved before power failure)
  - currentQuestionIndex: 1
  - timeLeft: restored
↓
Quiz loads normally, student continues from Q2
```

---

## Summary

| Event | What Happens | Endpoint |
|-------|--------------|----------|
| **User cheats** | Block triggered | `POST /block` |
| **Block active** | Quiz frozen, timer shows | Polling `GET /block-status` |
| **Block expires + NOT fullscreen** | Auto-submit quiz | `POST /submit` |
| **Block expires + IN fullscreen** | Unfreeze, continue | `setQuizFrozen(false)` |
| **Answer selected** | Saved to database | `POST /save-progress` |
| **Re-login** | Progress restored | `GET /quiz/{id}` |
| **Quiz complete** | Submitted | `POST /submit` |

---

**Key Points to Remember:**
- ✅ Block duration is **server-side** (frontend can't cheat it)
- ✅ Auto-submit **checks fullscreen** (can't bypass by minimizing)
- ✅ Answers **auto-save** (can't lose progress on network failure)
- ✅ Progress **restores on reload** (continue exactly where you left off)
- ✅ Scoring is **server-side** (frontend can't change answers before submit)

🎯 **Result:** Secure quiz system that protects student integrity while preserving their work!
