# Complete Block System Flowchart

## 1. ESC PRESSED DURING QUIZ

```
Student in Quiz
      ↓
   Presses ESC
      ↓
Quiz.jsx ESC Handler (line 938-1030)
      ↓
Calls blockStudent(quizId) → POST /api/quizzes/{quizId}/block-student
      ↓
Backend: blockStudent Controller
  ├─ Fetch QuizConfig
  ├─ Read blocked array
  ├─ Clean expired blocks
  ├─ Create new block {studentId, expiresAt}
  ├─ Save to database ✅
  ├─ Verify save (with retry)
  └─ Return {expiresAt (ms), remainingSeconds}
      ↓
Frontend: blockStudent() returns response
      ↓
Quiz.jsx sets:
  ├─ quizFrozen = true
  ├─ blockCountdown = remainingSeconds
  └─ window._blockExpiresAt = expiresAt
      ↓
Countdown Timer Loop (every 1s)
  └─ Calculate: timeRemaining = Math.ceil((expiresAt - now) / 1000)
      ↓
Render: Block Screen Shows ⏸️ "X seconds" ← ✅ FIXED
```

---

## 2. STUDENT REFRESHES PAGE DURING BLOCK

```
Student Refreshes Page
      ↓
Quiz.jsx load data useEffect
      ↓
GET /api/quizzes/{quizId}
      ↓
Middleware: checkStudentBlocked intercepts ← route: quiz.js line 72-75
  ├─ Query QuizConfig for quizId
  ├─ Find active block for studentId
  ├─ Check: expiresAt > now
  └─ If YES: Return 403 {blocked: true, expiresAt, remainingSeconds}
      ↓
Frontend: Catch 403 error (Quiz.jsx line 526-587)
      ↓
Quiz.jsx sets:
  ├─ quizFrozen = true
  ├─ blockCountdown = remainingSeconds
  └─ progressLoaded = true ← ✅ CRITICAL FIX
      ↓
Countdown Timer Loop (every 1s)
      ↓
Render: Block Screen Shows ⏸️ "X seconds" ← ✅ WORKS ON REFRESH
```

---

## 3. STUDENT RE-LOGS IN WHILE BLOCKED ← ✅ NEW FIX

```
Student at Login Page
      ↓
Enters: UID, Password, Quiz ID
      ↓
POST /api/student/login
      ↓
Backend: loginStudent Controller (studentController.js line 147-168)
  ├─ Validate UID & Password
  ├─ Query QuizConfig for quizId
  ├─ Find active block for studentId
  ├─ Check: expiresAt > now
  └─ If YES: Return 403 {blocked: true, expiresAt, remainingSeconds}
      ↓
Frontend: Catch 403 error (StudentLogin.jsx line 125-132) ← ✅ UPDATED
      ↓
StudentLogin.jsx:
  ├─ Store blockData in localStorage {quizId, expiresAt, remainingSeconds}
  ├─ Show toast: "Blocked for X seconds"
  └─ Navigate to /blocked-wait/{quizId} ← ✅ NEW
      ↓
BlockedWait.jsx Component (NEW FILE) ← ✅ NEW
  ├─ Read blockData from localStorage
  ├─ Calculate countdown from expiresAt
  ├─ Update every 1 second
  └─ Display:
      ├─ Large countdown timer: "99s"
      ├─ Progress bar (visual indicator)
      ├─ Block reason explanation
      └─ "Do not close this window"
      ↓
Countdown reaches 0
      ↓
BlockedWait.jsx:
  ├─ Clear blockData from localStorage
  ├─ Show: "Block expired! Redirecting..."
  └─ Navigate to /login (after 2s delay)
      ↓
Student can now re-login and access quiz
```

---

## 4. FULLSCREEN EXIT DETECTION

```
Student exits fullscreen
      ↓
Quiz.jsx fullscreenchange Event (line 753-815)
      ↓
Calls blockStudent(quizId) → Same as ESC block
      ↓
30-second block applied
      ↓
Block Screen Shows ⏸️
```

---

## Database Persistence

```
QuizConfig.blocked Array Structure:

{
  id: "quiz-123",
  blocked: [
    {
      studentId: 42,
      expiresAt: "2025-01-21T15:30:45.000Z"  ← ISO timestamp
    },
    {
      studentId: 51,
      expiresAt: "2025-01-21T15:35:00.000Z"
    }
  ]
}

When checking:
  ├─ Current time: Date.now() (milliseconds)
  ├─ Expiry: new Date(expiresAt).getTime() (milliseconds)
  ├─ If expiry > now: Block is ACTIVE
  └─ If expiry <= now: Block is EXPIRED (filtered out)
```

---

## State Diagram: Block Lifecycle

```
                    ┌─────────────────┐
                    │   QUIZ RUNNING  │
                    └────────┬────────┘
                             │
                        ESC / Fullscreen Exit
                             ↓
                    ┌─────────────────┐
                    │    BLOCKED      │
                    │   (30 seconds)  │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
    Refresh        Re-Login        Page Open
    (quiz.jsx)     (login.jsx)     (Any page)
        │              │                │
        ↓              ↓                ↓
   403 returned   403 returned      No access
   Block screen   BlockedWait       (redirect)
        │              │                │
        └────────────────┼───────────────┘
                        │
                Countdown reaches 0
                        │
                        ↓
              ┌──────────────────────┐
              │   BLOCK EXPIRED      │
              │  Can attempt quiz    │
              └──────────────────────┘
```

---

## Files Involved

### Backend
- `QuizApp_Backend/routes/quiz.js` - Routes with middleware
- `QuizApp_Backend/middlewares/checkStudentBlock.js` - OLD (not used)
- `QuizApp_Backend/middlewares/checkBlocked.js` - ACTIVE middleware
- `QuizApp_Backend/controllers/quizController.js` - blockStudent, getQuiz
- `QuizApp_Backend/controllers/studentController.js` - loginStudent

### Frontend
- `Quiz/src/pages/StudentLogin.jsx` - UPDATED: Block redirect logic
- `Quiz/src/pages/student/Quiz.jsx` - UPDATED: Block screen priority
- `Quiz/src/pages/student/BlockedWait.jsx` - NEW: Block waiting page
- `Quiz/src/App.jsx` - UPDATED: BlockedWait route

### Key Points

✅ **Block Data Persists**: Stored in QuizConfig.blocked[] array with exact expiresAt timestamp
✅ **Middleware Intercepts**: checkStudentBlocked.js catches ALL quiz GET requests
✅ **Multiple Entry Points**:
  - Direct quiz access → 403 → Block screen
  - Refresh during block → 403 → Block screen
  - Re-login during block → 403 → BlockedWait page
✅ **No Bypass Possible**: Each route checks database before proceeding
✅ **Countdown Accurate**: Based on server-side expiresAt, immune to client clock manipulation
