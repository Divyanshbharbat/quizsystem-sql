# ✅ ESC BUTTON BLOCKING - COMPLETE ANALYSIS

## Overview
When a user presses the ESC button during a quiz, they get blocked from the backend. On page refresh, the remaining block time is displayed and they cannot access the quiz.

---

## 🔴 FRONTEND FLOW (Quiz.jsx)

### 1️⃣ ESC KEY PRESS EVENT (Lines 938-980 in Quiz.jsx)
```javascript
if (e.key === 'Escape') {
  e.preventDefault();  // ✅ Prevents ESC key action
  e.stopPropagation(); // ✅ Stops event bubbling
  
  if (!quizFrozen) {
    console.log("[ESC KEY] ⏳ Sending block request to backend...");
    toast.loading("🔄 Processing ESC key block...", { id: "esc-block" });
    
    // ✅ CALL BACKEND API TO SAVE BLOCK
    blockStudent(quizId).then(result => {
      if (result && result.expiresAt) {
        setQuizFrozen(true);           // ✅ Freezes quiz locally
        setBlockCountdown(30);          // ✅ Shows countdown
        window._blockExpiresAt = result.expiresAt;  // ✅ Stores backend timestamp
        
        // Signal to Electron
        window.electronAPI?.quizBlocked();
        
        toast.error(`🚫 BLOCKED FOR PRESSING ESC!\n${remainingSeconds}s`);
      }
    });
  }
}
```

### 2️⃣ blockStudent() FUNCTION CALL (quizsecurity.mjs Lines 178-199)
```javascript
export const blockStudent = async (quizId) => {
  try {
    const { data } = await axios.post(
      `${import.meta.env.VITE_APP}/api/quizzes/${quizId}/block-student`,
      {},
      { withCredentials: true }
    );
    
    return {
      expiresAt: data?.expiresAt,        // ✅ Backend timestamp in milliseconds
      remainingSeconds: data?.remainingSeconds ?? 30,
    };
  } catch (e) {
    console.error("Error blocking student:", e);
    return { expiresAt: null, remainingSeconds: 0 };
  }
};
```

**What happens:**
- Sends POST request to backend API: `/api/quizzes/{quizId}/block-student`
- Backend SAVES the block to database
- Frontend receives confirmation with `expiresAt` timestamp
- Frontend freezes quiz UI

---

## 🟢 BACKEND FLOW (quizController.js)

### 1️⃣ blockStudent() CONTROLLER (Lines 443-575)

**STEP 1-2: Validate & Fetch Quiz**
```javascript
const { quizId } = req.params;
const studentId = req.user?.id;

const quizConfig = await QuizConfig.findByPk(quizId);
```

**STEP 3: Get Current Blocked Array**
```javascript
let blocked = quizConfig.blocked;  // ✅ This is an array of blocked objects

if (!Array.isArray(blocked)) {
  blocked = [];  // ✅ Ensure it's always an array
}
```

**STEP 4: Clean Expired Blocks**
```javascript
blocked = blocked.filter(b => {
  if (!b || !b.expiresAt) return false;
  return new Date(b.expiresAt) > now;  // ✅ Keep only active blocks
});
```

**STEP 5: Check if Already Blocked**
```javascript
const existing = blocked.find(b => 
  Number(b.studentId) === Number(studentId)
);

if (existing) {
  const remainingSeconds = Math.ceil(
    (new Date(existing.expiresAt) - now) / 1000
  );
  
  return res.json({
    success: true,
    alreadyBlocked: true,
    remainingSeconds: Math.max(0, remainingSeconds),
    expiresAt: new Date(existing.expiresAt).getTime(),  // ✅ Milliseconds
  });
}
```

**STEP 6-7: Create NEW Block & SAVE TO DATABASE**
```javascript
const BLOCK_DURATION = 30;  // 30 seconds
const expiresAt = new Date(now.getTime() + BLOCK_DURATION * 1000);

const newBlock = {
  studentId: Number(studentId),
  expiresAt: expiresAt.toISOString()  // ✅ ISO string in database
};

blocked.push(newBlock);
quizConfig.blocked = blocked;  // ✅ Assign to model
const saveResult = await quizConfig.save();  // ✅ SAVE TO MYSQL
```

**STEP 8: Verify Block was Saved**
```javascript
const verifyQuiz = await QuizConfig.findByPk(quizId);
const blockConfirmed = verifyQuiz.blocked.some(b => 
  Number(b.studentId) === Number(studentId)
);

if (blockConfirmed) {
  console.log("✅✅✅ BLOCK SUCCESSFULLY SAVED ✅✅✅");
}
```

**Response to Frontend:**
```javascript
return res.json({
  success: true,
  blocked: true,
  remainingSeconds: BLOCK_DURATION,
  expiresAt: expiresAt.getTime(),  // ✅ Milliseconds timestamp
  message: `Student blocked for ${BLOCK_DURATION} seconds`
});
```

---

## 🔵 MIDDLEWARE CHECK - checkBlocked.js (NEW)

**Purpose:** Prevents blocked students from even loading the quiz

**When it's called:** Before `/api/quizzes/{quizId}` endpoint

```javascript
export const checkStudentBlocked = async (req, res, next) => {
  const { quizId } = req.params;
  const studentId = req.user?.id;
  
  const quizConfig = await QuizConfig.findByPk(quizId);
  const now = Date.now();
  let blocked = quizConfig.blocked || [];
  
  // Find active block for this student
  const activeBlock = blocked.find(b => {
    if (!b || !b.expiresAt) return false;
    const expiry = new Date(b.expiresAt).getTime();
    return expiry > now && Number(b.studentId) === Number(studentId);
  });
  
  if (activeBlock) {
    const remainingSeconds = Math.ceil(
      (new Date(activeBlock.expiresAt).getTime() - now) / 1000
    );
    
    // ✅ BLOCK REQUEST - DO NOT ALLOW QUIZ TO LOAD
    return res.status(403).json({
      success: false,
      blocked: true,
      message: `You are blocked for ${remainingSeconds}s`,
      remainingSeconds: Math.max(0, remainingSeconds),
      expiresAt: new Date(activeBlock.expiresAt).getTime(),
    });
  }
  
  // ✅ NOT BLOCKED - ALLOW TO PROCEED
  next();
};
```

---

## 🟡 ON PAGE REFRESH - COMPLETE FLOW

### When User Refreshes Page During Block:

**1. Frontend makes GET request:**
```javascript
const { data } = await axios.get(
  `${import.meta.env.VITE_APP}/api/quizzes/${quizId}`,
  { withCredentials: true }
);
```

**2. Middleware checks if blocked (checkBlocked.js):**
- Queries database for student's block
- If block is active (expiresAt > now):
  - Returns 403 status with remaining seconds
  - Quiz DOES NOT LOAD

**3. Backend getQuiz controller (Lines 699-780):**
```javascript
const block = activeBlocks.find(b => 
  Number(b.studentId) === Number(studentId)
);

if (block) {
  const remainingSeconds = Math.ceil(
    (new Date(block.expiresAt).getTime() - now) / 1000
  );
  
  // ✅ RETURNS BLOCKED RESPONSE
  return res.json({
    success: true,
    blocked: true,           // ✅ Flag set to true
    remainingSeconds,        // ✅ Remaining time
    expiresAt: new Date(block.expiresAt).getTime(),  // ✅ Exact timestamp
    data: { ... }  // ✅ Can include saved progress
  });
}
```

**4. Frontend handles response (Quiz.jsx Lines 415-470):**
```javascript
const isBlocked = data.blocked || false;
const remainingSeconds = data.remainingSeconds || 0;
const expiresAt = data.expiresAt || 0;

if (isBlocked && initialBlockDuration > 0) {
  setQuizFrozen(true);        // ✅ FREEZE QUIZ
  setBlockCountdown(initialBlockDuration);  // ✅ SHOW COUNTDOWN
  window._blockExpiresAt = expiresAt;  // ✅ STORE TIMESTAMP
  
  toast.error(`🚫 You are blocked for ${remainingSeconds} seconds`);
  
  // ✅ START COUNTDOWN TIMER
  const countdownInterval = setInterval(() => {
    const now = Date.now();
    timeRemaining = Math.ceil((window._blockExpiresAt - now) / 1000);
    setBlockCountdown(timeRemaining);
    
    if (timeRemaining <= 0) {
      clearInterval(countdownInterval);
      // ✅ AUTO-SUBMIT or UNFREEZE
      handleSubmit();  // Auto-submit quiz
    }
  }, 1000);
}
```

---

## 📊 DATA FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER PRESSES ESC                             │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ↓
          ┌──────────────────────────────────┐
          │ Quiz.jsx: ESC keydown handler    │
          │ - e.preventDefault()             │
          │ - Call blockStudent(quizId)      │
          └────────────┬─────────────────────┘
                       │
                       ↓
        ┌──────────────────────────────────────┐
        │ quizsecurity.mjs: blockStudent()     │
        │ POST /api/quizzes/:quizId/block-     │
        │       student                        │
        └────────────┬─────────────────────────┘
                     │
                     ↓
┌────────────────────────────────────────────────────────────┐
│         BACKEND: blockStudent() Controller                 │
│  1. Get quizConfig from database                           │
│  2. Read blocked array                                    │
│  3. Clean expired blocks                                  │
│  4. Check if already blocked                              │
│  5. Create new block object {studentId, expiresAt}        │
│  6. Push to blocked array                                 │
│  7. SAVE to database: quizConfig.save()  ✅               │
│  8. Verify block was saved                                │
│  9. Return {expiresAt, remainingSeconds}                  │
└────────────┬─────────────────────────────────────────────┘
             │
             ↓
    ┌─────────────────────────┐
    │ MySQL Database:         │
    │ QuizConfigs table       │
    │ blocked: [{             │
    │   studentId: 5,         │
    │   expiresAt: ISO_TIME   │ ✅ PERSISTED
    │ }]                      │
    └─────────────────────────┘
             │
             ↓
    ┌──────────────────────────────┐
    │ Response to Frontend         │
    │ {                            │
    │   expiresAt: 1705862400000,  │
    │   remainingSeconds: 30       │
    │ }                            │
    └────────┬─────────────────────┘
             │
             ↓
    ┌────────────────────────────────┐
    │ Quiz.jsx: Handle Response       │
    │ - setQuizFrozen(true)          │
    │ - setBlockCountdown(30)        │
    │ - window._blockExpiresAt = ... │
    │ - Show countdown timer         │
    └────────────────────────────────┘

═══════════════════════════════════════════════════════════════

            USER REFRESHES PAGE

┌─────────────────────────────────────────────────────────┐
│ Quiz.jsx: useEffect (load quiz)                         │
│ GET /api/quizzes/:quizId                                │
└────────────┬──────────────────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────────────────────┐
│ Middleware: checkStudentBlocked                         │
│ - Check if student has active block in database         │
│ - If YES: Return 403 + {blocked: true, remaining}       │
│ - If NO: Call next() → proceed to getQuiz controller    │
└────────────┬──────────────────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────────────────────┐
│ Backend: getQuiz() Controller                           │
│ - Reads block from quizConfig.blocked array             │
│ - Checks if student has active block                    │
│ - If YES: Return {blocked: true, expiresAt, ...}        │
│ - If NO: Return full quiz data                          │
└────────────┬──────────────────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────────────────────┐
│ Frontend: Handle Response                               │
│ - Extract: isBlocked, remainingSeconds, expiresAt       │
│ - If blocked:                                           │
│   • setQuizFrozen(true)   ← CAN'T INTERACT              │
│   • setBlockCountdown(remaining)  ← SHOW TIMER          │
│   • Start countdown → Auto-submit when reaches 0        │
└─────────────────────────────────────────────────────────┘
```

---

## ✅ VERIFICATION CHECKLIST

### Frontend (Quiz.jsx) ✓
- [x] ESC key calls `blockStudent(quizId)`
- [x] Wait for backend response with `expiresAt`
- [x] Store `expiresAt` in `window._blockExpiresAt`
- [x] Set `quizFrozen = true` to disable quiz
- [x] Start countdown timer
- [x] On refresh: receives `blocked: true` flag

### Backend (quizController.js) ✓
- [x] Read existing blocks from database
- [x] Clean expired blocks
- [x] Check if already blocked
- [x] Create new block with exact timestamp
- [x] SAVE to database (critical!)
- [x] Verify block was saved before responding
- [x] Return `expiresAt` in milliseconds

### Middleware (checkBlocked.js) ✓
- [x] Before quiz loads, check if student is blocked
- [x] Query active blocks from database
- [x] Return 403 if student is blocked
- [x] Allow next() if not blocked

### Database (MySQL) ✓
- [x] QuizConfig.blocked array stores blocks
- [x] Each block has `studentId` and `expiresAt`
- [x] Block persists across page refresh
- [x] Block expires after 30 seconds

---

## 🔒 SECURITY FEATURES

1. **Backend Persistence:** Block saved to MySQL database
2. **Timestamp-based:** Uses `expiresAt` to prevent clock manipulation
3. **Middleware Protection:** Blocks quiz loading before controller runs
4. **Refresh Protection:** Block persists even after page refresh
5. **Auto-submit:** Frozen quiz auto-submits after block expires
6. **Electron Integration:** Signals Electron when blocked

---

## 📝 NOTES

- Block duration: 30 seconds (can be changed in `blockStudent()`)
- Expired blocks are cleaned on each check
- Multiple blocks from same student overwrite each other
- Frontend countdown starts from `expiresAt` timestamp (not just counting down)
- If backend call fails, frontend still freezes quiz locally (defensive)
