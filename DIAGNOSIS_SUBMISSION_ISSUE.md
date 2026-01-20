# Quiz Submission Issue - Root Cause Analysis

## Problem
Results are not being saved to the database after quiz submission.

## Root Causes Identified

### Issue 1: Answer Format Mismatch 🔴 CRITICAL

**Quiz.jsx (Line 703-719):** What frontend sends:
```javascript
const enrichedAnswers = questions.map(question => {
  return {
    questionId: question.id,           // ❌ Number ID (e.g., "DSA_0")
    answer: existingAnswer?.selectedOption,  // ❌ Wrong field name!
    subcategory: question.subcategory
  };
});
```

**quizSubmissionController.js (Line 135):** What backend expects:
```javascript
const submittedAnswer = answers.find(a => {
  const aQId = a.questionId;
  return aQId === qId;  // ❌ Looks for questionId
});

const selectedOption = submittedAnswer?.selectedOption ?? null;  // ❌ Looks for selectedOption
```

**THE MISMATCH:**
- Frontend sends: `{ questionId, answer, subcategory }`
- Backend expects: `{ questionId, selectedOption, subcategory }`
- **RESULT**: `selectedOption` is always `undefined` → All answers score as wrong!

---

### Issue 2: Question ID Format Inconsistency 🔴 CRITICAL

**QuizController.js (Line 826):** How questions are shuffled:
```javascript
const shuffled = seededShuffle(uniqueQuestions, studentId);
const selectedQuestions = shuffled.slice(0, selection.questionCount);

const questionsForStudent = selectedQuestions.map((q, index) => {
  const questionId = `${selection.subcategory}_${index}`;  // ✅ "DSA_0", "DSA_1"
  return {
    id: questionId,  // ✅ Sent as STRING
    question: q.question,
    options: q.options,
    answer: q.answer,
    selectedOption: savedAnswer?.selectedOption ?? null,
  };
});
```

**Quiz.jsx (Line 709):** What's saved:
```javascript
const existingAnswer = answers.find(a => a.questionId === question.id);
return {
  questionId: question.id,  // Frontend receives "DSA_0" as STRING
  answer: existingAnswer?.selectedOption,  // ❌ Wrong field!
  subcategory: question.subcategory
};
```

**quizSubmissionController.js (Line 99):** What's used for scoring:
```javascript
uniqueQuestions.slice(0, selection.questionCount).forEach((q, index) => {
  const questionId = `${selection.subcategory}_${index}`;  // ✅ "DSA_0", "DSA_1"
  questionMap[questionId] = { ... };
});

// Then tries to match:
const submittedAnswer = answers.find(a => a.questionId === qId);  // ✅ STRING match
```

**THE ISSUE:**
- Frontend sends: `questionId` as STRING ("DSA_0") with field name "answer" ❌
- Backend expects: `questionId` as STRING ("DSA_0") with field name "selectedOption" ❌

---

### Issue 3: Answers Stored in Progress Use Different Field Name 🔴 CRITICAL

**Quiz.jsx (Line 530-545):** How answers are stored in progress:
```javascript
const handleOptionClick = (option) => {
  const qId = questions[currentQuestionIndex]?.id;
  
  const updatedAnswers = [...answers];
  const idx = updatedAnswers.findIndex((a) => a.questionId === qId);
  
  if (idx !== -1) 
    updatedAnswers[idx].selectedOption = option;  // ✅ Uses "selectedOption"
  else 
    updatedAnswers.push({ questionId: qId, selectedOption: option });  // ✅ Uses "selectedOption"
  
  setAnswers(updatedAnswers);
};
```

**Quiz.jsx (Line 710):** But submit transforms it:
```javascript
const enrichedAnswers = questions.map(question => {
  const existingAnswer = answers.find(a => a.questionId === question.id);
  return {
    questionId: question.id,
    answer: existingAnswer?.selectedOption,  // ❌ Renames to "answer"!
    subcategory: question.subcategory
  };
});
```

**THE ISSUE:**
- Progress stores answers with `selectedOption` field ✅
- Submit function renames it to `answer` ❌
- Backend expects `selectedOption` ❌
- **RESULT**: Backend gets `{ questionId, answer, subcategory }` but looks for `selectedOption` = undefined

---

## Solution

Fix the field name in Quiz.jsx handleSubmit function:

```javascript
// BEFORE (WRONG):
const enrichedAnswers = questions.map(question => {
  const existingAnswer = answers.find(a => a.questionId === question.id);
  return {
    questionId: question.id,
    answer: existingAnswer?.selectedOption,  // ❌ WRONG FIELD NAME!
    subcategory: question.subcategory
  };
});

// AFTER (CORRECT):
const enrichedAnswers = questions.map(question => {
  const existingAnswer = answers.find(a => a.questionId === question.id);
  return {
    questionId: question.id,
    selectedOption: existingAnswer?.selectedOption,  // ✅ CORRECT FIELD NAME!
    subcategory: question.subcategory
  };
});
```

---

## Why Results Are Not Saved

1. Frontend sends: `{ questionId, answer, subcategory }`
2. Backend looks for: `submittedAnswer?.selectedOption`
3. `selectedOption` doesn't exist → it's `undefined`
4. Comparison: `undefined === correctAnswer` → Always FALSE
5. No questions match → Score = 0
6. Database saves a 0-score entry (or might not save at all)

---

## Testing the Fix

1. Make the change above in Quiz.jsx
2. Start a quiz
3. Answer all questions
4. Submit
5. Check database:
   ```sql
   SELECT * FROM quiz_configs WHERE id = YOUR_QUIZ_ID;
   ```
6. Look at the `completed` JSON field - should now show actual score!

---

## Complete Call Chain (for reference)

```
1. handleOptionClick (Quiz.jsx:530)
   → Stores: { questionId: "DSA_0", selectedOption: "A" }

2. handleSubmit (Quiz.jsx:703)
   → Transforms to: { questionId: "DSA_0", answer: "A", subcategory: "DSA" }
   → ❌ SHOULD BE: { questionId: "DSA_0", selectedOption: "A", subcategory: "DSA" }

3. POST /api/quizzes/:quizId/submit (backend)
   → Receives answers array
   → Builds questionMap: { "DSA_0": { answer: "A", subcategory: "DSA", ... } }

4. Scoring (quizSubmissionController.js:135):
   → const submittedAnswer = answers.find(a => a.questionId === qId);
   → const selectedOption = submittedAnswer?.selectedOption ?? null;  // ❌ UNDEFINED!

5. Score Comparison (quizSubmissionController.js:145):
   → if (selectedOption && selectedOption.trim() === correctAnswer?.trim())
   → ❌ undefined && undefined.trim() → FALSE → Score 0

6. Database:
   → Saves with score: 0, subcategoryScores: [{ score: 0, totalQuestions: N, percentage: 0 }]
   → OR might not save at all if validation fails
```

---

## All Affected Areas

### 1. **Quiz.jsx** (MUST FIX)
- **Line 709-720**: Change `answer` to `selectedOption` in handleSubmit

### 2. **quizSubmissionController.js** (Already correct)
- **Line 135-145**: Already looking for `selectedOption` ✅
- **Line 110**: Already building map correctly ✅

### 3. **Database** (No changes needed)
- QuizConfig.completed structure is correct ✅

---

## Prevention for Future

When passing data through API:
1. **Define Interface Clearly**:
   ```typescript
   interface Answer {
     questionId: string;        // "DSA_0"
     selectedOption: string;    // "A" or null
     subcategory?: string;      // "DSA" (optional, can be derived from questionId)
   }
   ```

2. **Frontend and Backend should use SAME field names**
3. **Add Type Validation** on both sides:
   ```javascript
   // Frontend
   if (!answer.selectedOption) console.warn("Missing selectedOption!");
   
   // Backend
   if (!submittedAnswer.selectedOption) console.warn("Missing selectedOption!");
   ```

4. **Log at every stage**:
   - What Quiz.jsx sends
   - What Backend receives
   - What is scored
