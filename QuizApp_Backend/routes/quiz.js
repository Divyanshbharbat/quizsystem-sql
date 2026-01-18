import express from 'express';
import { 
    createQuiz, 
    deleteQuiz,
    getQuiz, 
   
 
   saveProgress,
    createQuizByFaculty,getQuizSubmissions,
    getQuizTitleById,
    blockStudent,
    getBlockStatus
} from '../controllers/quizController.js';
import { getAllCategoriesAndSubcategories } from '../controllers/quizController.js';

import { submitQuiz } from '../controllers/quizSubmissionController.js';
import { createQuizWithImageQuestion } from '../controllers/quizController.js';
// import { protect } from '../middlewares/user_middleware.js';
import protect2  from '../middlewares/user_middleware.js';
import { isAuthenticated } from '../middlewares/authMiddleware2.js';
const router = express.Router();
router.get("/grouped-categories2", getAllCategoriesAndSubcategories);
import { addImageQuestion } from '../controllers/quizController.js';
router.post("/imagebaseqs",  upload.single("image"),addImageQuestion)
import { getAllQuizConfigs } from '../controllers/quizController.js';
router.get("/gettabledata", getAllQuizConfigs);
import { updateQuizConfig } from '../controllers/quizController.js';
router.put("/config/:id", updateQuizConfig);
import { deleteQuizConfig } from '../controllers/quizController.js';
router.delete("/config/:id", deleteQuizConfig);

import { getGroupedCategories } from '../controllers/quizController.js';
router.get("/grouped-categories", getGroupedCategories);
import { getAllFaculties } from '../controllers/facultyController.js';
import upload from '../middlewares/upload.js';
router.post("/:quizId/addqs",upload.single("image"), addImageQuestion);

router.get("/:quizId/submissions", getQuizSubmissions);
// Save progress for a quiz
router.post("/:quizId/save-progress", isAuthenticated, saveProgress);

// Route to create a quiz
router.post('/create', createQuizByFaculty);
router.get("/getall", getAllFaculties);
import checkStudentBlock from '../middlewares/checkStudentBlock.js';
// Get a specific quiz by ID
router.get(
  "/:quizId",
  isAuthenticated,
  checkStudentBlock,
  getQuiz
);
router.delete('/:quizId', deleteQuiz);
router.get('/title/:quizId',getQuizTitleById)

// Get block status for a quiz
router.get('/:quizId/block-status', isAuthenticated, getBlockStatus);

// Submit a quiz
router.post('/:quizId/submit', protect2, submitQuiz);
import { createQuizConfig } from '../controllers/quizController.js';
router.post("/create-config", createQuizConfig);


// Get category-wise answer distribution for a specific quiz and student

router.post("/upload",createQuizByFaculty)
import { unblockStudent } from '../controllers/quizController.js';
router.post("/:quizId/unblock-student", unblockStudent);
router.post("/:quizId/block-student",isAuthenticated ,blockStudent);

export default router;
