// routes/facultyRoutes.js
import express from 'express';
import upload from '../middlewares/upload.js';
import multer from 'multer';
import { loginFaculty, registerFaculty, uploadFacultyCSV, getFacultyQuizzes} from '../controllers/facultyController.js';
const router = express.Router();
import { deleteFaculty,updateFaculty } from '../controllers/facultyController.js';
import { getAllFaculties } from '../controllers/facultyController.js';
router.post('/register', registerFaculty);
router.post('/login', loginFaculty);
router.post('/upload-csv', uploadFacultyCSV);
router.get("/getall", getAllFaculties);
// Only keep the proper route for quizzes
router.get("/:facultyId/quizzes", getFacultyQuizzes);
router.put("/update/:id", updateFaculty);
router.delete("/delete/:id", deleteFaculty);
import { unblockStudent } from '../controllers/facultyController.js';
import { getBlockedStudents } from '../controllers/facultyController.js';
import { isFacultyAuthenticated } from '../middlewares/facultyAuth.js';
router.get("/quizzes/blocked-students",isFacultyAuthenticated, getBlockedStudents);
import { getQuizResults } from '../controllers/quizController.js';
router.get("/quiz/:quizId/results", getQuizResults);
// POST unblock a student
router.post("/quizzes/:quizId/unblock-student", unblockStudent);
export default router;
