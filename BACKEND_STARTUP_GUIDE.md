# 🚀 Backend Server Startup Guide

## Quick Start

### Step 1: Open Terminal in Backend Directory
```powershell
cd D:\mysql1quiz\svpcetquizsystem\QuizApp_Backend
```

### Step 2: Start the Server
```powershell
npm start
```

### Expected Output
You should see something like:
```
✅ Default faculty already exists
Server running on port 3000 🚀
```

### Step 3: Verify Server is Running
Open another terminal:
```powershell
curl http://localhost:3000/health
```

You should get:
```json
{
  "success": true,
  "message": "Server is running 🚀"
}
```

---

## Common Issues & Solutions

### Issue 1: Port 3000 Already in Use
**Error:** `Error: listen EADDRINUSE :::3000`

**Solution:**
```powershell
# Kill the process using port 3000
netstat -ano | findstr :3000
# Get the PID from output, then:
taskkill /PID <PID> /F

# Or change port in index.js
# Find: const PORT = process.env.PORT || 3000;
# Change to: const PORT = process.env.PORT || 3001;
```

### Issue 2: Database Connection Error
**Error:** `Error: connect ECONNREFUSED`

**Solution:**
1. Make sure MySQL is running
2. Check credentials in `.env` file
3. Verify database name is correct

### Issue 3: Module Not Found
**Error:** `Cannot find module`

**Solution:**
```powershell
# Reinstall dependencies
npm install
npm start
```

### Issue 4: Syntax Error in Code
**Error:** `SyntaxError: Unexpected token`

**Solution:**
1. Check console for file and line number
2. Fix the syntax error in that file
3. Restart server: `npm start`

---

## Environment Variables

Create a `.env` file in `QuizApp_Backend/` directory:

```
PORT=3000
JWT_SECRET=divyansh
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=quiz_system
NODE_ENV=development
```

---

## Routes Available (After Server Starts)

### Student Routes
- `POST /api/student/login` - Student login
- `GET /api/student/me` - Get current student
- `POST /api/student/logout` - Student logout

### Quiz Routes
- `GET /api/quizzes/:quizId` - **Get quiz (CRITICAL)**
- `POST /api/quizzes/:quizId/submit` - **Submit quiz (CRITICAL)**
- `POST /api/quizzes/:quizId/save-progress` - Save progress
- `POST /api/quizzes/:quizId/block` - Block student
- `POST /api/quizzes/:quizId/block-student` - Block student (alias)
- `GET /api/quizzes/:quizId/block-status` - Check block status

### Health Check
- `GET /health` - Verify server is running

---

## Testing Endpoints (Once Server is Running)

### Test Health Check
```powershell
curl http://localhost:3000/health
```

### Test Get Quiz (with token)
```powershell
curl -X GET http://localhost:3000/api/quizzes/1 `
  -H "Cookie: token=YOUR_JWT_TOKEN" `
  -H "Content-Type: application/json"
```

### Test Submit Quiz (with token)
```powershell
curl -X POST http://localhost:3000/api/quizzes/1/submit `
  -H "Cookie: token=YOUR_JWT_TOKEN" `
  -H "Content-Type: application/json" `
  -d '{
    "answers": [
      {"questionId": 0, "answer": "Option A", "subcategory": "Math"},
      {"questionId": 1, "answer": "Option B", "subcategory": "Math"}
    ]
  }'
```

---

## Debugging Mode

### Enable More Logging
1. Open `index.js`
2. Add before `app.listen()`:
```javascript
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});
```

### Watch Logs in Real-time
```powershell
npm start
# Keep this window open to see all logs
```

### Check Database
```powershell
# If using MySQL CLI
mysql -u root -p quiz_system
mysql> SELECT * FROM students LIMIT 1;
```

---

## Running Backend & Frontend Together

### Terminal 1: Backend
```powershell
cd D:\mysql1quiz\svpcetquizsystem\QuizApp_Backend
npm start
```

### Terminal 2: Frontend
```powershell
cd D:\mysql1quiz\svpcetquizsystem\Quiz
npm run dev
```

---

## Verify Backend is Ready

After starting the server, you should see:

```
ℹ️ Default faculty already exists
✅ Sequelize connected to database
Server running on port 3000 🚀
```

**Then:**
1. Open `http://localhost:5173` (frontend)
2. Student should be able to access quiz
3. Answers should save automatically
4. Submit should work without 404 error

---

## Common Backend Issues in This System

### Issue: Submit Returns 404
**Cause:** Backend server not running or not restarted with latest code

**Solution:**
1. Stop current server (Ctrl+C)
2. Run: `npm start`
3. Wait for "Server running on port 3000 🚀"
4. Try quiz submission again

### Issue: Answers Not Saving
**Cause:** Progress endpoint failing or database not accepting data

**Solution:**
1. Check backend logs for errors
2. Verify database connection
3. Check `QuizProgress` table exists

### Issue: Block Not Working
**Cause:** Block endpoint not responding

**Solution:**
1. Check `/block` route is registered
2. Verify `req.user.id` is set correctly
3. Check `QuizConfig` table has `blocked` column

---

## File Structure Reference

```
QuizApp_Backend/
├── index.js                 ← MAIN SERVER FILE
├── package.json
├── .env                     ← ENVIRONMENT VARIABLES (create this)
├── config/
│   └── db.js
├── controllers/
│   ├── quizController.js    ← GET QUIZ, BLOCK
│   └── quizSubmissionController.js  ← SUBMIT
├── models/
│   ├── index.js
│   ├── Student.js
│   ├── QuizProgress.js
│   └── QuizConfig.js
├── middlewares/
│   ├── authMiddleware2.js
│   └── user_middleware.js   ← protect2 middleware
└── routes/
    └── quiz.js              ← SUBMIT ROUTE
```

---

## Next Steps After Server Starts

1. ✅ Verify server responds to `http://localhost:3000/health`
2. ✅ Open frontend `http://localhost:5173`
3. ✅ Login as student
4. ✅ Click on a quiz
5. ✅ Answer a question
6. ✅ Check browser Network tab - `POST save-progress` should succeed
7. ✅ Answer all questions
8. ✅ Click Submit
9. ✅ Check browser Network tab - `POST submit` should return 200 (not 404)
10. ✅ You should be redirected to `/thankyou`

---

## If Still Getting 404 on Submit

### Debug Steps:

1. **Check route is registered:**
```powershell
# In backend console output, you should see something like:
# Registered: POST /api/quizzes/:quizId/submit
```

2. **Check middleware is working:**
   - Frontend includes JWT token in cookies ✓
   - Token is valid and not expired ✓

3. **Check endpoint structure:**
   - quizId parameter is correct (number, not string) ✓
   - Endpoint matches: `POST /api/quizzes/{number}/submit` ✓

4. **Enable request logging:**
```javascript
// Add to index.js before routes:
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});
```

5. **Verify backend actually restarted:**
   - Stop server (Ctrl+C)
   - Start server: `npm start`
   - Look for console output
   - Try request again

---

## Important Notes

⚠️ **Every time you modify backend code:**
1. Stop the server (Ctrl+C)
2. Run `npm start` again
3. Wait for "Server running on port 3000 🚀"
4. Try the request again

⚠️ **JWT Token expires:**
- If you get 401 errors, re-login in the app
- This gets a fresh token

⚠️ **Database must be running:**
- Check MySQL/MariaDB is started before running backend

---

**Created:** January 19, 2026  
**Status:** Ready for backend startup
