# Quick Reference Guide - All Features

## 1️⃣ Image Upload Loader

**Location:** `Quiz/src/pages/faculty/CreateQuiz.jsx`

**What it does:**
- Shows spinning loader while uploading image-based questions
- Displays "Uploading..." text
- Button disabled during upload

**How to use:**
```
1. Open CreateQuiz.jsx
2. Select image and fill form
3. Click "Create Quiz Question"
4. See: Spinner + "Uploading..." + Disabled button
5. After upload: Success message
```

**Code:**
```javascript
const [uploadingImage, setUploadingImage] = useState(false);

// In upload handler
setUploadingImage(true);
toast.loading("Uploading image-based question...");
// ... upload ...
setUploadingImage(false);
toast.success("✅ Image quiz created successfully!");
```

---

## 2️⃣ Category Refresh Button

**Location:** `Quiz/src/pages/faculty/Createquiz2.jsx`

**What it does:**
- Refreshes categories from backend
- Shows newly uploaded image-based questions

**How to use:**
```
1. Upload image questions in CreateQuiz.jsx
2. Go to Createquiz2.jsx
3. Click "🔄 Refresh Categories" button
4. New categories appear in dropdown
```

**Code:**
```javascript
// Button in form header
<button
  type="button"
  onClick={() => {
    const res = await axios.get(
      `${import.meta.env.VITE_APP}/api/quizzes/grouped-categories2`
    );
    setQuizConfigsForForm(res.data?.data || []);
    alert("✅ Categories refreshed!");
  }}
>
  🔄 Refresh Categories
</button>
```

---

## 3️⃣ Year Filter with Empty State

**Location:** `Quiz/src/pages/faculty/Addstudent.jsx`

**What it does:**
- Clicks year button → Shows only those students
- No students → Shows friendly "No Students Found" message
- Shows student count: "4th Year Students (3)"

**How to use:**
```
1. Go to Addstudent.jsx
2. Click year button (1st, 2nd, 3rd, or 4th Year)
3. See: List of students OR "No Students Found" message
4. Students shown with count in header
```

**UI:**
```
✅ With students:
   4th Year Students (5)
   [Table with 5 students]

❌ Without students:
   👤
   No Students Found
   No students registered for Year 4 in CIVIL department.
   You can add students using the "Add Student" form above.
```

**Code:**
```javascript
{students.length > 0 ? (
  <table>
    {/* Students table */}
  </table>
) : (
  <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-8 text-center">
    <div className="text-4xl mb-3">👤</div>
    <h3>No Students Found</h3>
    <p>No students registered for Year {selectedYear}...</p>
  </div>
)}
```

---

## 4️⃣ Block Timing System

**Location:** `Quiz/src/pages/student/Quiz.jsx`, `BlockedWait.jsx`

**What it does:**
- Block at 3:50 → Timer continues running
- After 30 seconds → Shows 3:20 (penalty applied)
- Penalty persists to database
- Auto-save every 5 seconds during block

**How it works:**

**Timeline:**
```
3:50 → Block triggered (ESC pressed)
3:50 → saveProgress() called, timeLeft saved
3:45 → saveProgress() called, timeLeft saved
3:40 → saveProgress() called, timeLeft saved
3:35 → saveProgress() called, timeLeft saved
3:30 → saveProgress() called, timeLeft saved
3:25 → saveProgress() called, timeLeft saved
3:20 → Block expires, saveProgress() called

After block expires:
- If NOT fullscreen → Auto-submit with 3:20
- If fullscreen → Resume quiz with 3:20
- If tab switched → Auto-submit with current time
```

**Database:**
```sql
-- After block, database shows:
SELECT timeLeft FROM quiz_progresses 
WHERE studentId=123 AND quizId='quiz-456';
-- Result: 190 (seconds) = 3 minutes 10 seconds
-- (Original 210 seconds - 20 seconds penalty = 190 seconds)
```

**Logging:**
```javascript
[QUIZ LOAD] TimeLeft from backend: 190 seconds
[QUIZ LOAD] Time penalty applied: 20 seconds

[FULLSCREEN BLOCK EXPIRED] Current timeLeft: 190 seconds
[FULLSCREEN BLOCK EXPIRED] Time penalty applied: ~30 seconds

[RESUME] Student has 190 seconds remaining (30s penalty applied)

[AUTO-SUBMIT] Current timeLeft: 190 seconds (penalty applied)
```

---

## 📋 Testing Checklist

- [ ] **Upload Loader:** Spinner shows during image upload
- [ ] **Category Refresh:** New categories appear after clicking refresh
- [ ] **Year Filter:** Shows students when year clicked
- [ ] **Empty State:** Shows message when no students for that year
- [ ] **Block Timing:** Timer shows 3:20 after 30-second block at 3:50
- [ ] **Database Save:** timeLeft correctly stored in database
- [ ] **Auto-Submit:** Works on NOT fullscreen
- [ ] **Tab Switch:** Auto-submits when tab switched during block
- [ ] **Fullscreen Resume:** Can resume quiz with reduced time

---

## 🔍 Debugging

### Issue: Upload button not showing spinner

**Check:**
```javascript
// Make sure uploadingImage state is being set
console.log("uploadingImage:", uploadingImage);

// Check if button has proper class
// Should show: bg-gray-400 when uploading
```

### Issue: Categories not appearing after refresh

**Check:**
```javascript
// Verify backend returns categories
// Check browser console:
console.log("[CREATE_QUIZ2] Fetched categories:", categories);

// If empty, verify:
// 1. Image questions were actually uploaded
// 2. Backend endpoint returns data
// 3. Click refresh button again
```

### Issue: Year filter shows nothing

**Check:**
```javascript
// Verify students are being fetched
console.log("Students for year:", students);

// If empty:
// 1. Add students first using "Add Student" form
// 2. Check student year matches clicked year
// 3. Verify department matches faculty department
```

### Issue: Block time not showing penalty

**Check:**
```javascript
// Backend logs (npm start in QuizApp_Backend):
[SAVE_PROGRESS] Updated progress for student 12345

// Browser logs:
[TIMER] Timer ticking, prev timeLeft: 190

// After block expires:
[FULLSCREEN BLOCK EXPIRED] Current timeLeft: 190 seconds
```

---

## 🆘 Need Help?

1. **Check console logs** in both browser DevTools and backend terminal
2. **Look for error messages** with timestamps
3. **Verify database** using MySQL query tools
4. **Clear browser cache** (Ctrl+Shift+Delete) and refresh
5. **Restart backend** if changes not taking effect

---

## 🎯 Key Points

✅ **Upload Loader:** Provides user feedback during long operations
✅ **Category Refresh:** One-click to sync new questions
✅ **Year Filter:** Clear filtering with helpful empty state
✅ **Block Timing:** Automatic penalty that persists
✅ **All Fully Logged:** Easy debugging with comprehensive logs

