import express from 'express';
import {
  registerStudent,
  loginStudent,
  getStudentByStudentID,
  getYearDeptStudents,
  uploadStudentsCSV,
  updateStudent,
  deleteStudent,
  getStudentMe,
  getStudentQuizzes,
  getQuizResult,
  getStudentSubmissions,
  getStudentByName,
  resultLoginStudent,
  forgotPassword,resetPassword,verifyOtp,
  updateStudentPassword,
  getStudentWithPassword,
  changeStudentPassword,
  promoteStudentsToNextYear
} from '../controllers/studentController.js';
import Student from '../models/Student.js';
import { protect } from '../middlewares/authMiddleware.js'; // protect routes if needed


const router = express.Router();

// Student registration and login
router.post('/register', registerStudent);
router.post('/login', loginStudent);
router.post('/resultlogin', resultLoginStudent);
router.post('/forgot-password', forgotPassword);
router.post("/reset-password/:token", resetPassword);
router.post("/verify-otp", verifyOtp);
router.post("/change-password", changeStudentPassword);

// Student profile & info routes
router.get('/me', getStudentMe);
router.get('/studentId/:studentId', getStudentByStudentID);
router.get('/id/:id', getStudentByStudentID);
router.get('/info', getStudentByName);

// Student list filtered by year and department
router.get('/', getYearDeptStudents);

// Upload student CSV data
router.post('/upload-csv', uploadStudentsCSV);

// Update and delete student records
router.put('/:studentId', updateStudent);
router.put('/update/:studentId', updateStudent);  // ✅ Add this route for frontend compatibility
router.delete('/:id', deleteStudent);
router.delete('/delete/:studentId', deleteStudent);

// ADMIN ONLY: Update password and get student with password
router.put('/admin/password/:studentId', updateStudentPassword);
router.get('/admin/password/:studentId', getStudentWithPassword);

// ADMIN ONLY: Bulk promote students to next year
router.post('/admin/promote-year', promoteStudentsToNextYear);

// Get quizzes and submissions for a student
router.get('/:studentId/quizzes', getStudentQuizzes);
router.get('/submissions/:id', getStudentSubmissions);


router.post('/quiz/esc-attempt/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const student = await Student.findOne({ studentId });

    if (!student) return res.status(404).json({ message: 'Student not found' });

    student.escAttempts += 1;

    // If 3 or more, block student
    if (student.escAttempts >= 3) {
      await blockStudent(studentId); // Call your blocking function
      student.escAttempts = 3; // keep it capped
    }

    await student.save();

    res.json({ escAttempts: student.escAttempts, blocked: student.escAttempts >= 3 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});
export default router;
