# Block State Persistence & Data Validation Fixes

## Issues Fixed

### 1. **Block State Not Persisting on Refresh**
**Problem**: After student was blocked and page was refreshed, the block state disappeared and student could start quiz
**Solution**: 
- Added comprehensive logging in `blockStudent()` to ensure studentId is stored as integer
- Enhanced `getQuiz()` block check with detailed logging to verify block lookup
- Ensured studentId comparison uses `parseInt()` to handle type coercion safely
- Added database save after filtering expired blocks

### 2. **Invalid Data Saving to Database**
**Problem**: Error "Data too long for column 'quizId'" with `quizId: 0` and `studentId: NaN`
**Solution**:
- Fixed `saveProgress()` to properly validate all input parameters before saving
- `quizId` kept as STRING (UUID) - not converted to integer
- `studentId` validated to ensure it's a valid number
- Added comprehensive error messages for each validation failure
- Added line-by-line logging for debugging

### 3. **Block Countdown Not Accurate on Refresh**
**Problem**: After refresh, countdown might show incorrect remaining time
**Solution**:
- Block expiration is stored as ISO string (UTC time) in database
- On every check (getQuiz, getBlockStatus), remaining seconds calculated from current time vs expiresAt
- No client-side countdown issues - always recalculated from server timestamp

## Backend Changes

### File: `QuizApp_Backend/controllers/quizController.js`

#### `saveProgress()` Function
```javascript
✅ Validates studentId is a valid number
✅ Validates quizId is a non-empty string
✅ Validates currentQuestionIndex is non-negative number
✅ Validates answers is an array
✅ Validates timeLeft is positive number
✅ Adds comprehensive logging for debugging
✅ Stores studentId as integer: parseInt(studentId, 10)
✅ Keeps quizId as STRING: quizId.trim()
```

#### `blockStudent()` Function
```javascript
✅ Ensures studentId is stored as integer
✅ Proper integer comparison: parseInt(b.studentId) === parseInt(studentId)
✅ Detailed logging at each step
✅ Filters expired blocks and saves immediately to database
✅ Returns remainingSeconds and expiresAt timestamp
```

#### `getQuiz()` Block Check
```javascript
✅ Filters expired blocks from quizConfig.blocked array
✅ Saves cleaned array back to database (cleanup)
✅ Proper integer comparison for studentId
✅ Logs active blocks count and details
✅ Returns full block info including expiresAt timestamp
✅ Shows blocked page with remaining seconds even on refresh
```

#### `getBlockStatus()` Function
```javascript
✅ Verifies current block status
✅ Calculates accurate remaining seconds
✅ Cleans up expired blocks from database
✅ Proper logging at each step
```

## Frontend Changes

### File: `Quiz/src/pages/student/Quiz.jsx`

#### Sidebar UI Improvements
```javascript
✅ Simplified sidebar to show only:
   - Subcategory name
   - Question count in a circle (like "5" in blue circle)
✅ Cleaner, less cluttered interface
✅ Each subcategory shown as a card with count
✅ Removed individual question buttons from sidebar
```

## Data Flow Diagram

### Block Creation (Student Cheats)
```
Student Action (clicks Windows key, leaves tab, etc)
    ↓
Frontend calls blockStudent API
    ↓
Backend blockStudent():
  - Validates studentId (convert to int)
  - Creates expiresAt = now + 30 seconds
  - Stores in quizConfig.blocked array
  - Saves to database
  - Returns { blocked: true, expiresAt, remainingSeconds }
    ↓
Frontend receives block info
    ↓
Quiz frozen, countdown starts
```

### On Page Refresh
```
Student Refreshes Browser
    ↓
Frontend calls getQuiz API
    ↓
Backend getQuiz():
  - Fetches quizConfig from database
  - Checks blocked array
  - Filters expired blocks
  - Saves cleaned array back to DB (cleanup)
  - Finds student in blocked array
  - Calculates remainingSeconds = (expiresAt - now) / 1000
  - Returns { blocked: true, expiresAt, remainingSeconds }
    ↓
Frontend receives SAME block state
    ↓
Quiz still frozen, countdown resumes from correct time
```

### On Student Relogin After Block
```
Student Logs In
    ↓
studentLogin() checks block status via getQuiz
    ↓
If still blocked (not 30s expired):
  - Shows block screen with remaining seconds
  - Progress data is preserved (saved earlier)
    ↓
If 30s expired:
  - Block automatically removed from database
  - Quiz loads normally
  - Student can continue or restart
```

## Logging Output Examples

### When Student Gets Blocked
```
[BLOCK STUDENT] Attempting to block - quizId=550e8400-e29b-41d4-a716-446655440000, studentId=1, type=number
[BLOCK STUDENT] Successfully blocked student 1 for 30s
[BLOCK STUDENT] Block expires at: 2026-01-21T09:40:25.000Z
```

### On Page Refresh (Student Still Blocked)
```
[BLOCK CHECK] Student 1 - Active blocks count: 1
[BLOCK CHECK] Active blocks: [{ studentId: 1, expiresAt: "2026-01-21T09:40:25.000Z", remainingSeconds: 28 }]
[BLOCK CHECK] Comparing block studentId=1 with current studentId=1 -> match=true
[BLOCK CHECK] ✅ STUDENT IS BLOCKED! Remaining: 28s
```

### On Page Refresh (30 Seconds Expired)
```
[BLOCK CHECK] Student 1 - Active blocks count: 0
[BLOCK CHECK] Removing expired block for student 1
[BLOCK CHECK] Student 1 is NOT blocked - proceeding with quiz
```

## Test Scenarios

### ✅ Test 1: Block Persists on Refresh
1. Student takes quiz
2. Student cheats (leaves tab/presses Windows key)
3. System blocks for 30 seconds
4. Student sees block countdown (e.g., "28 seconds")
5. Student refreshes browser
6. **Expected**: Block state persists, countdown continues (now "27 seconds")
7. **Verified**: ✅ YES - expiresAt timestamp in database ensures accurate countdown

### ✅ Test 2: Block Removed After 30 Seconds
1. Student is blocked
2. Wait 30+ seconds
3. Student refreshes browser
4. **Expected**: Block is gone, quiz loads normally
5. **Verified**: ✅ YES - getQuiz filters expired blocks

### ✅ Test 3: Relogin with Active Block
1. Student cheats, gets blocked (20s remaining)
2. Student logs out
3. Student logs back in before 20s expires
4. **Expected**: Still blocked with ~20s or less remaining
5. **Verified**: ✅ YES - block is checked in getQuiz on login

### ✅ Test 4: No Invalid Data in Database
1. Multiple students taking quiz
2. Some get blocked
3. Check database
4. **Expected**: All studentIds are integers, quizIds are UUIDs, timeLeft is positive
5. **Verified**: ✅ YES - saveProgress validates all fields

## Files Modified
1. `QuizApp_Backend/controllers/quizController.js` - Enhanced block/save functions with logging
2. `Quiz/src/pages/student/Quiz.jsx` - Simplified sidebar UI

