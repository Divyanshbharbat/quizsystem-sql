# Complete Testing Guide - Password, Security, and Timing

## 🔐 PASSWORD CHANGE TESTING

### Test 1: Forgot Password (Email Reset)

**Steps:**
1. Open Login page
2. Click "Forgot Password"
3. Enter student email
4. Check email inbox for OTP
5. Enter OTP in the form
6. Enter new password (e.g., "NewPass@123")
7. Click "Reset Password"

**Expected Results:**
- ✅ See message: "Password reset successful"
- ✅ Backend logs show:
  ```
  [RESET_PASSWORD] Hashing password before update...
  [RESET_PASSWORD] Password hashed, hash starts with: $2b$10$...
  [RESET_PASSWORD] Password saved to database
  ```
- ✅ Password field in database starts with `$2b$10$` (NOT double-hashed)
- ✅ Try old password → Login fails
- ✅ Try new password → Login succeeds ✅

**Database Check:**
```sql
SELECT studentId, password FROM students WHERE email='student@email.com';
-- Should show: password starting with $2b$10$ (single hash)
```

---

### Test 2: Admin Changes Student Password

**Steps:**
1. Login as admin/faculty
2. Go to student management
3. Select a student
4. Click "Change Password"
5. Enter new password (e.g., "AdminSet@123")
6. Submit

**Expected Results:**
- ✅ See message: "Student password updated successfully"
- ✅ Backend logs show:
  ```
  [UPDATE_STUDENT_PASSWORD] Hashing password before update...
  [UPDATE_STUDENT_PASSWORD] Password hashed, hash starts with: $2b$10$...
  [UPDATE_STUDENT_PASSWORD] Password updated in database for student: 12345
  ```
- ✅ New password appears in database
- ✅ Student can login with new password immediately

---

### Test 3: Student Self-Service Password Change

**Steps:**
1. Login as student
2. Go to Profile/Settings
3. Click "Change Password"
4. Enter old password (current password)
5. Enter new password
6. Confirm new password
7. Click "Change"

**Expected Results:**
- ✅ Old password verification: ✓
- ✅ Backend logs show:
  ```
  [CHANGE_PASSWORD] Verifying old password for student: 12345
  [CHANGE_PASSWORD] Old password verified successfully, hashing new password...
  [CHANGE_PASSWORD] Password hashed, hash starts with: $2b$10$...
  [CHANGE_PASSWORD] Password updated in database for student: 12345
  ```
- ✅ See message: "Password changed successfully"
- ✅ Logout and login with new password → Success ✅

**Wrong Old Password:**
- ✅ Should show: "Incorrect old password"
- ✅ Backend logs show:
  ```
  [CHANGE_PASSWORD] Verifying old password for student: 12345
  [CHANGE_PASSWORD] Old password verification FAILED
  ```

---

## 🚫 SECURITY FEATURES TESTING

### Test 4: Block Copy (Ctrl+C)

**Steps:**
1. Start a quiz
2. Select any question text
3. Press Ctrl+C (or Cmd+C on Mac)

**Expected Results:**
- ✅ Toast appears: "🚫 Copying text is disabled during quiz!"
- ✅ Nothing copied to clipboard
- ✅ Try to paste elsewhere: nothing pastes

---

### Test 5: Block Right-Click

**Steps:**
1. Start a quiz
2. Right-click on question text

**Expected Results:**
- ✅ No context menu appears
- ✅ Toast appears: "🚫 Right-click is disabled during quiz!"
- ✅ Try right-click in different areas: consistently blocked

---

### Test 6: Block Developer Tools (F12)

**Steps:**
1. Start a quiz
2. Press F12 key

**Expected Results:**
- ✅ Developer tools don't open
- ✅ Toast appears: "🚫 Developer tools are disabled during quiz!"

**Alternative DevTools:**
- ✅ Try Ctrl+Shift+I → Still blocked
- ✅ Try Ctrl+Shift+J → Still blocked

---

## ⏱️ BLOCK AND TIMING TESTING

### Test 7: Block Timing - At 3:50

**Steps:**
1. Start quiz with 3:50 (3 minutes 50 seconds)
2. Observe timer counting down
3. At approximately 3:50, press ESC key

**Expected Results:**
- ✅ Toast: "🚫 BLOCKED FOR PRESSING ESC!"
- ✅ Block screen appears showing: "⏸️ Quiz Blocked"
- ✅ Countdown shows: 30s remaining (or close)
- ✅ Message shows all the things that trigger auto-submit

**Backend Logs:**
```
[ESC KEY] ⏳ Sending block request to backend...
[ESC KEY] ✅ Backend confirmed block: {expiresAt, remainingSeconds}
[ESC KEY] Block confirmed - 30s remaining
```

---

### Test 8: Timer Running During Block (Penalty Applied)

**Steps:**
1. Block at 3:50
2. Wait 10 seconds on block screen
3. Observe timer (should now show ~3:40)
4. Wait 20 more seconds

**Expected Results:**
- ✅ After 10 seconds: timer shows ~3:40
- ✅ After 30 seconds total: timer shows ~3:20
- ✅ Block screen countdown shows remaining time
- ✅ Backend auto-save every 5 seconds:
  ```
  [SAVE_PROGRESS] Updated progress for student 12345, quiz quiz123
  ```
- ✅ Time is persisting (saving to database)

---

### Test 9: Auto-Submit When NOT Fullscreen After Block

**Steps:**
1. Block at 3:50
2. Exit fullscreen during block (press F11 or Escape)
3. Wait for block to expire
4. Observe

**Expected Results:**
- ✅ BlockedWait message shows: "📋 After timer expires: If you are NOT in fullscreen → Quiz will AUTO-SUBMIT"
- ✅ After 30 seconds: Toast shows "Block expired and screen is not fullscreen. Auto-submitting quiz..."
- ✅ Quiz auto-submits with current timeLeft (~3:20)
- ✅ Redirected to thank you page
- ✅ Submission saved with reduced time

**Check Database:**
```sql
SELECT * FROM quiz_configs WHERE id='quiz123' 
AND JSON_CONTAINS(completed, JSON_OBJECT('studentId', 12345));
-- Should show student in completed[] with their submission
```

---

### Test 10: Auto-Submit When Tab Switches

**Steps:**
1. Start quiz
2. During quiz (not blocked), switch to another tab

**Expected Results:**
- ✅ Toast: "You switched tabs! Quiz auto-submitting..."
- ✅ Quiz immediately auto-submits
- ✅ Get redirected to thank you page
- ✅ Submission saved

---

### Test 11: Auto-Submit During Block When Tab Switches

**Steps:**
1. Block at 3:50
2. On BlockedWait screen, switch to another tab

**Expected Results:**
- ✅ Toast: "You switched tabs! Quiz auto-submitting..."
- ✅ Quiz immediately auto-submits
- ✅ Get redirected to thank you page
- ✅ Submission saved with current timeLeft

---

### Test 12: Resume Quiz After Block (Fullscreen)

**Steps:**
1. Block at 3:50
2. Stay in fullscreen mode
3. Wait for block to expire

**Expected Results:**
- ✅ BlockedWait shows: "📋 If you stay in fullscreen → Resume quiz with 30 second penalty applied"
- ✅ After 30 seconds: Toast shows "Block expired! Continuing quiz (you lost 30 seconds during block)..."
- ✅ Redirected back to quiz
- ✅ Timer shows 3:20 (30 second penalty applied)
- ✅ Message shows: "You were blocked. 30 seconds have been deducted from your time."
- ✅ Can continue quiz normally

**Database Check:**
```sql
SELECT timeLeft FROM quiz_progresses WHERE studentId=12345 AND quizId='quiz123';
-- Should show: 190 (3:20 = 200 - 30 = 190 seconds)
```

---

### Test 13: Re-Login During Block

**Steps:**
1. Student starts quiz
2. Block student (press ESC)
3. Close browser or go to home page
4. Immediately log back in
5. Try to access the blocked quiz

**Expected Results:**
- ✅ Backend returns 403 with block data
- ✅ Redirected to BlockedWait screen
- ✅ Shows remaining time on countdown
- ✅ Shows all auto-submit conditions clearly
- ✅ Timer counts down correctly
- ✅ After expiry, behaves as expected (auto-submit or resume)

**Backend Logs:**
```
[GET QUIZ] 403 Blocked response received
[QUIZ LOAD ERROR] Student BLOCKED: isBlocked=true, remainingSeconds=20
```

---

### Test 14: Refresh During Block

**Steps:**
1. Student is blocked (on block screen with 20 seconds remaining)
2. Refresh the page (F5 or Ctrl+R)

**Expected Results:**
- ✅ Page reloads
- ✅ Redirected to BlockedWait again
- ✅ Timer shows approximately same remaining time (~20 seconds)
- ✅ Countdown continues correctly
- ✅ Server is providing correct expiresAt time

**Backend Logs:**
```
[GET_BLOCK_STATUS] Student 12345 is BLOCKED for 20s
[GET QUIZ] 403 Blocked response received
```

---

## 📊 COMPREHENSIVE END-TO-END TEST

### Master Test Scenario (All Features)

1. **Setup:** Student logs in, starts 5-minute quiz

2. **Minute 1:** 
   - ✅ Copy blocking works
   - ✅ Right-click blocking works
   - ✅ F12 blocking works

3. **Minute 2-3:** 
   - ✅ Auto-save every 5 seconds works
   - ✅ Time updates on backend

4. **Minute 3:50:** 
   - ✅ Press ESC
   - ✅ Block screen shows
   - ✅ Penalty message clear
   - ✅ Auto-submit conditions listed

5. **Minute 3:55:** 
   - ✅ Switch tab
   - ✅ Auto-submit triggered
   - ✅ Redirected to thank you

6. **Database Check:**
   - ✅ Student in completed[] array
   - ✅ Submission saved with timeLeft
   - ✅ Password hash shows single encryption

---

## 🐛 TROUBLESHOOTING

### Password Login Still Fails After Change

**Check:**
```
Backend logs should show:
[RESET_PASSWORD] Password hashed, hash starts with: $2b$10$
[RESET_PASSWORD] Password field now starts with: $2b$10$

NOT:
$2b$10$$2b$10$... (double hash)
```

**If seeing double hash:**
- Clear browser cache
- Restart backend server
- Verify Student.js beforeUpdate hook has the `$2` check

---

### Time Not Showing Penalty After Block

**Check:**
```
1. Verify saveProgress is being called during block:
   [SAVE_PROGRESS] Updated progress for student 12345, quiz quiz123
   
2. Verify timeLeft is reducing:
   [QUIZ LOAD] TimeLeft from backend: 210 (not 230)
   
3. Check database:
   SELECT timeLeft FROM quiz_progresses WHERE studentId=12345;
   Should be less than original timeLimit * 60
```

---

### Auto-Submit Not Working

**Check Logs:**
```
[TAB_SWITCH] Tab hidden detected
[AUTO_SUBMIT] Starting auto-submit for quiz: quiz123
[AUTO_SUBMIT] Got progress, submitting with: {answersCount, timeLeft}
[AUTO_SUBMIT] Submit response: {success: true, score: X}
```

If not showing:
- Check that visibilitychange event is listening
- Verify quiz not already completed
- Check browser console for errors

---

## ✅ FINAL VERIFICATION CHECKLIST

Before deployment, verify:

- [ ] Password change works with single hash (not double)
- [ ] Admin can change student password and it appears in DB
- [ ] Copy (Ctrl+C) is blocked
- [ ] Right-click is blocked
- [ ] F12 is blocked
- [ ] Block screen shows clear auto-submit messages
- [ ] Timer continues during block
- [ ] Block timing shows 30 second penalty
- [ ] Auto-submit works on NOT fullscreen
- [ ] Auto-submit works on tab switch
- [ ] Can resume quiz if fullscreen
- [ ] Re-login during block shows BlockedWait
- [ ] Refresh during block shows correct remaining time
- [ ] All submissions saved to database
- [ ] All logging appears in backend console

