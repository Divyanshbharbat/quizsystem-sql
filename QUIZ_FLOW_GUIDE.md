# Quiz System - Complete Flow Guide

## System Overview
This document explains how cheating detection, student blocking, and progress restoration work together in your quiz system.

---

## 1. Cheating Detection & Blocking Flow

### Detection Events (Frontend)
The frontend continuously monitors for cheating attempts:

| Event | Trigger | Action |
|-------|---------|--------|
| **Fullscreen Exit** | User presses F11 or clicks fullscreen button | Call `blockStudent()` |
| **Tab Switch** | User switches to another browser tab | Call `blockStudent()` |
| **ESC Key Press** | User presses ESC key | Call `handleCheatingDetected()` |
| **Back Button** | User clicks browser back button | Call `handleCheatingDetected()` |
| **Windows Key** | User presses Windows/Meta key | Call `handleCheatingDetected()` |
| **Alt+Left Arrow** | Keyboard shortcut for back navigation | Call `handleCheatingDetected()` |

**File:** `Quiz.jsx` (lines 600-1200)

### Block Endpoint

**Endpoint:** `POST /api/quizzes/{quizId}/block`

**Request:**
```javascript
{
  // No body required (studentId comes from JWT token)
}
```

**Response:**
```javascript
{
  success: true,
  blocked: true,
  remainingSeconds: 30,  // Block duration
  message: "Student blocked for 30 seconds"
}
```

**Backend Logic (quizController.js, lines 425-490):**
1. Get `studentId` from `req.user.id` (via JWT middleware)
2. Fetch `QuizConfig` by quiz ID
3. Add student to `blocked` array with `expiresAt = now + 30 seconds`
4. Save to database
5. Return remaining seconds

**Database:**
```javascript
quizConfig.blocked = [
  {
    studentId: 123,
    expiresAt: "2025-01-19T12:30:45.000Z"
  }
]
```

---

## 2. Block Status Monitoring (Frontend)

**Endpoint:** `GET /api/quizzes/{quizId}/block-status`

**Response:**
```javascript
{
  success: true,
  blocked: true,
  remainingSeconds: 28
}
```

**Frontend Behavior (Quiz.jsx, lines 330-365):**
1. Set `quizFrozen = true` (disable quiz interaction)
2. Show frozen overlay with countdown timer
3. Poll block status every 5 seconds
4. When `remainingSeconds <= 0`:
   - Check if user is in fullscreen: `document.fullscreenElement`
   - Check if tab is visible: `!document.hidden`
   - **If NOT in fullscreen OR tab is hidden:** Auto-submit quiz
   - **If in fullscreen AND tab is visible:** Unfreeze and continue

---

## 3. Auto-Submit on Block Expiration

**Scenario:** Block expires while user is NOT in fullscreen

**What Happens:**
1. Polling detects `remainingSeconds <= 0`
2. Checks: `if (document.hidden || !document.fullscreenElement)`
3. If true → calls `handleSubmit()` automatically
4. Quiz gets submitted with whatever answers the student selected
5. Student is navigated to `/thankyou` page

**Code Location:** `Quiz.jsx`, lines 330-365

**User Impact:**
- ✅ Prevents students from trying to answer more questions while blocked
- ✅ Preserves their current answers in the submission
- ⚠️ May submit incomplete quiz if student was blocked during the quiz

---

## 4. Progress Restoration on Re-login

### Scenario
User is taking a quiz, connection drops (power off, internet loss), they re-login.

### What Gets Saved

**Every 5 seconds + on answer selection:**
```
POST /api/quizzes/{quizId}/save-progress
{
  currentQuestionIndex: 5,
  answers: [
    { questionId: 0, selectedOption: "Option A" },
    { questionId: 1, selectedOption: "Option B" },
    ...
  ],
  timeLeft: 599  // remaining seconds
}
```

**Database Storage:**
```javascript
QuizProgress {
  studentId: 123,
  quizId: 456,
  currentQuestionIndex: 5,
  answers: [...],
  timeLeft: 599,
  completed: false,
  status: false
}
```

### On Re-login

**Step 1: Load Quiz**
```
GET /api/quizzes/{quizId}
```

**Step 2: Backend Response Includes Saved Progress**
```javascript
{
  success: true,
  data: {
    quizConfig: { /* quiz info */ },
    selectionsWithQuestions: [ /* questions with savedOption */ ],
    progress: {
      currentQuestionIndex: 5,  // ← Restored
      timeLeft: 599,             // ← Restored
      answers: [                 // ← Restored
        { questionId: 0, selectedOption: "Option A" },
        { questionId: 1, selectedOption: "Option B" }
      ]
    }
  }
}
```

**Step 3: Frontend Restores State**
```javascript
setCurrentQuestionIndex(progress.currentQuestionIndex);  // Go to Q5
setTimeLeft(progress.timeLeft);                           // Restore 599 seconds
setAnswers(progress.answers);                             // Restore answers
```

**Step 4: Quiz Questions Show Previous Selections**
- Each question displays the student's previously selected option highlighted
- Student can continue from where they left off
- Timer continues counting down from the saved time

**Code Location:**
- Backend: `quizController.js`, `getQuiz()` function, lines 652-862
- Frontend: `Quiz.jsx`, `useEffect` for loading data, lines 287-400

---

## 5. Quiz Submission Flow

### Submission Endpoint

**Endpoint:** `POST /api/quizzes/{quizId}/submit`

**Request:**
```javascript
{
  answers: [
    { questionId: 0, selectedOption: "Option A", answer: "Option A", subcategory: "Math" },
    { questionId: 1, selectedOption: "Option B", answer: "Option C", subcategory: "Math" },
    { questionId: 2, selectedOption: null, answer: "Option A", subcategory: "Science" }
  ]
}
```

**Response:**
```javascript
{
  success: true,
  message: "Quiz submitted successfully",
  totalScore: 1,  // 1 correct out of 3
  subcategoryScores: [
    { subcategory: "Math", score: 1, totalQuestions: 2, percentage: 50 },
    { subcategory: "Science", score: 0, totalQuestions: 1, percentage: 0 }
  ]
}
```

**Backend Logic (quizSubmissionController.js, lines 15-112):**
1. Get `studentId` from `req.user.id`
2. Fetch `QuizConfig`
3. Check if already submitted (prevent duplicate submissions)
4. For each answer:
   - Compare `selectedOption` with correct `answer`
   - Increment subcategory score if correct
5. Store submission in `quizConfig.completed` array
6. Delete `QuizProgress` record (clear saved state)
7. Return scores

**Database Update:**
```javascript
quizConfig.completed = [
  {
    studentId: 123,
    score: 15,
    subcategoryScores: [ /* detailed scores */ ],
    submittedAt: "2025-01-19T12:35:00.000Z"
  }
]
// QuizProgress record deleted
```

---

## 6. Complete Timeline Example

### User Journey

```
12:00:00 - User starts quiz
           └─ Quiz loaded, saved progress (if exists) restored
           
12:05:30 - User presses ESC key
           └─ blockStudent() called
           └─ Student added to blocked array with expiresAt = 12:06:00
           └─ Quiz frozen, countdown shows 30 seconds
           
12:05:35 - User in fullscreen still
           └─ Polling checks block status every 5 seconds
           └─ Shows countdown: 25 seconds remaining
           
12:06:00 - Block expires (remainingSeconds = 0)
           └─ If NOT in fullscreen:
              └─ handleSubmit() called automatically
              └─ Answers submitted with whatever user selected
              └─ QuizProgress deleted
              └─ Redirect to /thankyou
           └─ If in fullscreen:
              └─ quizFrozen = false
              └─ Toast: "Block expired. Continue carefully!"
              └─ User can continue answering
```

---

## 7. Key Improvements Made

### ✅ Fixed Issues:
1. **Answer Validation in Submission**
   - Now correctly matches `questionId` with `selectedOption`
   - Properly calculates per-subcategory scores
   - Stores detailed score breakdown

2. **Progress Restoration**
   - Returns saved answers from backend
   - Populates `selectedOption` in questions
   - User sees exactly what they selected before

3. **Block Route Alias**
   - Added `/block` as alias for `/block-student`
   - Both endpoints now work

4. **Middleware Compatibility**
   - `protect2` middleware ensures `req.user.id` exists
   - Works with all protected endpoints

### 📋 What's Working:
- ✅ Cheating detection on all events
- ✅ 30-second blocking on first cheat
- ✅ Auto-submit when block expires + not in fullscreen
- ✅ Progress saves every 5 seconds + on answer selection
- ✅ Progress restoration on page reload
- ✅ Correct answer validation on submission
- ✅ Per-subcategory score calculation

---

## 8. Testing the Flow

### Test Scenario 1: Cheating Detection
1. Start quiz
2. Press ESC key → Should see "Quiz Frozen" overlay
3. Wait for block countdown
4. See status in network tab: Block expires after 30s

### Test Scenario 2: Progress Restoration
1. Start quiz, answer a few questions
2. Close browser tab / turn off internet
3. Re-login and re-open quiz
4. Previous answers should appear highlighted

### Test Scenario 3: Auto-Submit
1. Start quiz, answer 2 questions
2. Exit fullscreen → Block triggered
3. Wait 30 seconds without fullscreen
4. Quiz auto-submits with 2 answers

### Test Scenario 4: Complete Flow
1. Start quiz, answer all questions, click Submit
2. Check browser network tab for `POST /submit`
3. Check response: `totalScore` and `subcategoryScores`
4. Should redirect to `/thankyou`

---

## 9. File Reference

### Backend Files
- **Routes:** `QuizApp_Backend/routes/quiz.js` (Line 59, 72-74)
- **Controllers:** `QuizApp_Backend/controllers/quizController.js` (Lines 425-490, 652-862)
- **Submission:** `QuizApp_Backend/controllers/quizSubmissionController.js` (Lines 15-112)
- **Middleware:** `QuizApp_Backend/middlewares/user_middleware.js` (Lines 1-41)

### Frontend Files
- **Quiz Component:** `Quiz/src/pages/student/Quiz.jsx` (Lines 287-1300)
- **Security Utils:** `Quiz/src/utils/quizsecurity.mjs` (Lines 52-150)
- **API Calls:** Axios instances in Quiz.jsx for:
  - Block: Line 261, 1086
  - Status: Line 341, 669, 738, 911
  - Save Progress: Line 448
  - Submit: Line 587

---

## 10. Environment Variables Needed

```
VITE_APP=http://localhost:3000  (backend URL)
JWT_SECRET=divyansh             (or your secret)
```

---

## Summary

Your quiz system now has:
1. **Robust cheating detection** - blocks user immediately on suspicious activity
2. **Auto-submit protection** - submits incomplete quiz if block expires while out of fullscreen
3. **Complete progress saving** - every answer and timer state is backed up
4. **Seamless restoration** - users can re-login and continue exactly where they left off
5. **Detailed scoring** - per-subcategory score breakdown

All features are integrated and working together! 🎉
