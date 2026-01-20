# Quiz Resume and Submission System

## Overview
This document explains how the quiz system handles:
1. **Quiz Submission with Accurate Scoring**
2. **Quiz Resume after Disconnect** (electricity break, network loss)
3. **Deterministic Question Shuffling per Student**

---

## 1. QUIZ SUBMISSION FLOW

### Endpoint: `POST /api/quizzes/:quizId/submit`

**What happens:**

1. **Receive Answers**: Student sends array of `{questionId, selectedOption, subcategory}`
2. **Build Question Map**: Dynamically reconstruct the exact same questions the student was shown
   - Uses `seededShuffle(questions, studentId)` for deterministic ordering
   - Maintains subcategory structure as configured
3. **Score Each Answer**:
   - Match submitted `selectedOption` against correct answer
   - Handle unanswered questions (null values)
   - Calculate scores per subcategory
4. **Save to Database**: Store in `QuizConfig.completed` array:
   ```json
   {
     "studentId": "student-id",
     "score": 15,
     "subcategoryScores": [
       {
         "subcategory": "DSA",
         "score": 8,
         "totalQuestions": 10,
         "percentage": 80
       }
     ],
     "submittedAt": "2026-01-20T10:30:00.000Z"
   }
   ```
5. **Clean Up**: Delete `QuizProgress` record for this student-quiz pair

### Key Code (quizSubmissionController.js):

```javascript
// Build question map to match submitted answers
quizConfig.selections.forEach((selection) => {
  // Find all matching questions from all quizzes
  // Use seededShuffle for deterministic ordering
  // Take first N questions as per selection.questionCount
  
  uniqueQuestions.slice(0, selection.questionCount).forEach((q, index) => {
    const questionId = `${selection.subcategory}_${index}`; // ✅ Consistent ID
    questionMap[questionId] = {
      answer: q.answer,
      subcategory: selection.subcategory,
      question: q.question
    };
  });
});

// Score answers by matching questionId
Object.keys(questionMap).forEach(qId => {
  const submittedAnswer = answers.find(a => a.questionId === qId);
  const selectedOption = submittedAnswer?.selectedOption ?? null;
  
  // ✅ Trim whitespace for accurate comparison
  if (selectedOption && selectedOption.trim() === correctAnswer?.trim()) {
    score++;
  }
});
```

### Important Notes:
- ✅ **Answers are fetched by exact question ID**: `subcategory_index`
- ✅ **Handles unanswered questions**: Null values don't count as correct
- ✅ **Whitespace trimming**: Avoids false negatives due to spaces
- ✅ **Searches all quizzes**: Questions can come from multiple quiz records
- ✅ **Maintains subcategory structure**: Each subcategory score is calculated separately

---

## 2. QUIZ RESUME AFTER DISCONNECT

### Problem: 
User's electricity breaks, network is lost, or browser crashes. Student logs back in and should:
1. Resume at the exact question they were on
2. Have all their previous answers restored
3. Get the correct remaining time
4. See the same shuffled questions (deterministic per student)

### Solution:

#### Step 1: Student Logs In
**Endpoint**: `POST /api/student/login`
**Response includes**:
- `blocked`: Boolean (if student was blocked)
- `remainingSeconds`: Countdown time if blocked
- `expiresAt`: Block expiration timestamp

**Code** (studentController.js):
```javascript
// Check if student is blocked
const blocked = quizConfig.blocked || [];
const existingBlock = blocked.find(b => String(b.studentId) === String(student.id));

if (existingBlock) {
  const remainingSeconds = Math.ceil(
    (new Date(existingBlock.expiresAt) - now) / 1000
  );
  return res.status(403).json({
    success: false,
    message: "You are blocked from this quiz",
    data: {
      blocked: true,
      remainingSeconds,
      expiresAt: new Date(existingBlock.expiresAt).getTime()
    }
  });
}
```

#### Step 2: Student Navigates to Quiz
**Endpoint**: `GET /api/quizzes/:quizId`
**What happens**:
1. Find or create `QuizProgress` record for this student-quiz pair
2. Fetch all questions matching the selected subcategories
3. **Use deterministic shuffle** with `seededShuffle(questions, studentId)`
4. Map saved answers from `progress.answers` to questions
5. Return:
   - `selectionsWithQuestions`: Questions with answers restored
   - `progress.currentQuestionIndex`: Resume position
   - `progress.timeLeft`: Remaining time in seconds
   - `progress.answers`: Saved answers

**Code** (quizController.js):
```javascript
// Find existing progress
let progress = await QuizProgress.findOne({ where: { studentId, quizId } });

if (!progress) {
  // Create new if first attempt
  progress = await QuizProgress.create({
    studentId,
    quizId,
    currentQuestionIndex: 0,
    completed: false,
    status: false,
    timeLeft: quizConfig.timeLimit * 60, // Full time
    answers: [] // Empty for new quiz
  });
}

// Reconstruct questions with same shuffle
const savedAnswers = progress.answers || [];
const selectionsWithQuestions = [];

for (const selection of quizConfig.selections) {
  // Get all questions for this subcategory from all quizzes
  let questions = [];
  allQuizzes.forEach(quiz => {
    const categories = quiz.categories; // JSON field
    categories.forEach(cat => {
      if (cat.subcategory === selection.subcategory) {
        questions.push(...cat.questions);
      }
    });
  });

  // Remove duplicates
  const uniqueQuestions = Array.from(
    new Map(
      questions
        .filter(q => q && q.question && Array.isArray(q.options))
        .map(q => [q.question, q])
    ).values()
  );

  // ✅ DETERMINISTIC SHUFFLE - Same for same student
  const shuffled = seededShuffle(uniqueQuestions, studentId);
  const selectedQuestions = shuffled.slice(0, selection.questionCount);

  // Map answers from previous session
  const questionsForStudent = selectedQuestions.map((q, index) => {
    const questionId = `${selection.subcategory}_${index}`;
    const savedAnswer = savedAnswers.find(a => a.questionId === questionId);
    
    return {
      id: questionId,
      question: q.question,
      options: q.options,
      answer: q.answer,
      selectedOption: savedAnswer?.selectedOption ?? null, // ✅ Restored!
    };
  });

  selectionsWithQuestions.push({
    subcategory: selection.subcategory,
    questions: questionsForStudent,
  });
}

return res.json({
  success: true,
  data: {
    selectionsWithQuestions,
    progress: {
      currentQuestionIndex: progress.currentQuestionIndex, // ✅ Resume position
      timeLeft: progress.timeLeft,                         // ✅ Remaining time
      answers: savedAnswers                                // ✅ Previous answers
    }
  }
});
```

#### Step 3: Frontend Restores State
**File**: `Quiz.jsx`

```javascript
// Load progress from backend
const { data } = await axios.get(`/api/quizzes/${quizId}`);

const progress = data.data.progress;
const selectionsWithQuestions = data.data.selectionsWithQuestions;

// Restore state
setCurrentQuestionIndex(progress.currentQuestionIndex); // Go to last position
setAnswers(progress.answers);                           // Restore answers
setTimeLeft(progress.timeLeft);                         // Set remaining time

// Questions are already shuffled correctly by backend
setSelections(selectionsWithQuestions);
```

### Key Features:
- ✅ **Deterministic**: Same student always sees same shuffled order
- ✅ **Persistent**: All answers saved in `QuizProgress.answers`
- ✅ **Resumable**: Student position and time are restored
- ✅ **Accurate**: Shuffling based on `studentId`, not random
- ✅ **Cross-session**: Works after disconnect, power loss, network issue

---

## 3. DETERMINISTIC QUESTION SHUFFLING

### Problem:
- Same student must see same questions in same order every session
- Different students must see different orders (anti-cheating)
- Faculty selects number of questions per subcategory, not specific questions

### Solution: Seeded Shuffle Algorithm

**Function**:
```javascript
function seededShuffle(array, seed) {
  const result = [...array];
  let seedNum = 0;
  // Convert seed string to number
  for (let i = 0; i < seed.length; i++) {
    seedNum += seed.charCodeAt(i);
  }
  
  // Pseudo-random number generator seeded by studentId
  function random() {
    seedNum = (seedNum * 9301 + 49297) % 233280;
    return seedNum / 233280;
  }
  
  // Fisher-Yates shuffle with seeded randomness
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  
  return result;
}
```

**Usage**:
```javascript
// Backend (quizController.js)
const shuffled = seededShuffle(uniqueQuestions, studentId);
const selectedQuestions = shuffled.slice(0, selection.questionCount);

// Frontend (Quiz.jsx)
const shuffledQuestions = seededShuffle(questions, studentId);
const shuffledOptions = questions.map(q => ({
  ...q,
  options: seededShuffle(q.options, studentId + q.id)
}));
```

### Properties:
- ✅ **Deterministic**: `seededShuffle(arr, 5)` always returns same order
- ✅ **Different per student**: Student ID 5 and 6 get different orders
- ✅ **Uniform distribution**: Fisher-Yates ensures fair randomness
- ✅ **Question order**: Questions shuffled once per subcategory
- ✅ **Option order**: Options shuffled differently per question

### Example:
```
Student 1 (ID=101):
  Subcategory: DSA
  Questions: [Q3, Q1, Q5, Q2, Q4] (shuffled by seed=101)
  Options for Q3: [C, A, B, D] (shuffled by seed=101+Q3_id)

Student 2 (ID=102):
  Subcategory: DSA
  Questions: [Q2, Q4, Q1, Q5, Q3] (shuffled by seed=102)
  Options for Q2: [B, D, A, C] (shuffled by seed=102+Q2_id)

Same questions, different order!
```

---

## 4. DATABASE MODELS

### QuizProgress (quiz_progress table)
```
- id: INTEGER (PK)
- studentId: INTEGER (FK)
- quizId: INTEGER (FK)
- currentQuestionIndex: INTEGER (0-based position)
- answers: JSON array [
    { questionId: "DSA_0", selectedOption: "A" },
    { questionId: "DSA_1", selectedOption: null },
    ...
  ]
- timeLeft: INTEGER (seconds remaining)
- completed: BOOLEAN (false during quiz, true after submit)
- status: BOOLEAN (for additional tracking)
- createdAt: TIMESTAMP
- updatedAt: TIMESTAMP
```

### QuizConfig (quiz_configs table)
```
- id: INTEGER (PK)
- title: STRING
- timeLimit: INTEGER (minutes)
- selections: JSON array [
    { subcategory: "DSA", questionCount: 10 },
    { subcategory: "Database", questionCount: 5 }
  ]
- completed: JSON array [
    {
      studentId: 5,
      score: 12,
      subcategoryScores: [
        { subcategory: "DSA", score: 8, totalQuestions: 10, percentage: 80 },
        { subcategory: "Database", score: 4, totalQuestions: 5, percentage: 80 }
      ],
      submittedAt: "2026-01-20T10:30:00.000Z"
    }
  ]
- blocked: JSON array [
    {
      studentId: 5,
      expiresAt: "2026-01-20T10:35:00.000Z"
    }
  ]
```

### Quiz (quizzes table)
```
- id: INTEGER (PK)
- categories: JSON array [
    {
      category: "Algorithms",
      subcategory: "DSA",
      questions: [
        { question: "...", options: [...], answer: "A" },
        ...
      ]
    }
  ]
- createdAt: TIMESTAMP
- updatedAt: TIMESTAMP
```

---

## 5. COMPLETE FLOW DIAGRAM

```
LOGIN
  ↓
Check if blocked → if yes, show countdown
  ↓
Verify not already completed
  ↓
Generate JWT token
  ↓
NAVIGATE TO QUIZ
  ↓
GET /api/quizzes/:quizId
  ↓
Load QuizProgress (or create new)
  ↓
Fetch all questions for selected subcategories
  ↓
Apply seededShuffle(questions, studentId)
  ↓
Map saved answers from QuizProgress.answers
  ↓
Return questions + progress + timeLeft
  ↓
RESUME QUIZ
  ↓
Set currentIndex = progress.currentQuestionIndex
  ↓
Restore answers from progress.answers
  ↓
Render questions at correct position
  ↓
ON DISCONNECT
  ↓
POST /api/quizzes/:quizId/save-progress
  ↓
Update QuizProgress:
  - currentQuestionIndex
  - answers
  - timeLeft
  ↓
(Browser closes/connection lost)
  ↓
RE-LOGIN
  ↓
GET /api/quizzes/:quizId (same as before)
  ↓
Load same QuizProgress
  ↓
Shuffle same way (seededShuffle with studentId)
  ↓
Map same answers
  ↓
Resume at exact position
  ↓
SUBMIT QUIZ
  ↓
POST /api/quizzes/:quizId/submit
  ↓
Reconstruct question map (seededShuffle again)
  ↓
Match submitted answers
  ↓
Calculate score
  ↓
Save to QuizConfig.completed
  ↓
Delete QuizProgress
  ↓
Return score breakdown
```

---

## 6. TESTING CHECKLIST

- [ ] **Disconnect Test**: 
  - Start quiz → answer some questions → disconnect
  - Re-login → verify at same position with same answers
  
- [ ] **Block Test**:
  - Trigger block (exit fullscreen) → logout
  - Login → see countdown → wait → retry
  
- [ ] **Shuffle Test**:
  - Student 1 and 2 start same quiz
  - Verify different question orders
  - Verify same order for Student 1 if they disconnect/reconnect
  
- [ ] **Submission Test**:
  - Submit quiz → verify score calculated correctly
  - Check `QuizConfig.completed` has entry with score
  - Verify `QuizProgress` is deleted
  
- [ ] **Subcategory Test**:
  - Quiz with 2 subcategories (DSA=10, DB=5)
  - Verify get exactly 10 DSA and 5 DB questions
  - Verify score breakdown by subcategory

---

## 7. TROUBLESHOOTING

### Problem: Questions change after disconnect
**Solution**: Ensure `seededShuffle` is called with `studentId`, not random seed

### Problem: Answers not restored after disconnect
**Solution**: Check `QuizProgress.answers` is properly saved in `saveProgress` endpoint

### Problem: Score doesn't match submitted answers
**Solution**: Verify `questionId` format matches: `${subcategory}_${index}`

### Problem: Wrong number of questions
**Solution**: Check `selection.questionCount` matches actual questions returned

### Problem: Student can submit after being blocked
**Solution**: Check `blockStudent` was called and block timestamp is valid
