import express from "express";
const router = express.Router();

import upload from "../middlewares/upload.js";
import { isAuthenticated } from "../middlewares/authMiddleware2.js";
import checkStudentBlock from "../middlewares/checkStudentBlock.js";
import checkStudentBlocked from "../middlewares/checkBlocked.js";

import {
  createQuizByFaculty,
  deleteQuiz,
  getQuiz,
  saveProgress,
  getQuizSubmissions,
  getQuizTitleById,
 
  getBlockStatus,
  unblockStudent,
  createQuizConfig,
  updateQuizConfig,
  deleteQuizConfig,
  getAllQuizConfigs,
  getGroupedCategories,
  getAllCategoriesAndSubcategories,
  addImageQuestion,
} from "../controllers/quizController.js";
import { blockStudent } from "../controllers/quizController.js"
import { submitQuiz } from "../controllers/quizSubmissionController.js";
import { getAllFaculties } from "../controllers/facultyController.js";


// =================== SAFE ROUTES (NO :quizId) ===================
router.get("/grouped-categories", getGroupedCategories);
router.get("/grouped-categories2", getAllCategoriesAndSubcategories);
router.get("/gettabledata", getAllQuizConfigs);
router.get("/getall", getAllFaculties);

router.post("/create", createQuizByFaculty);
router.post("/create-config", createQuizConfig);

router.put("/config/:id", updateQuizConfig);
router.delete("/config/:id", deleteQuizConfig);


// =================== IMAGE QUESTION ===================
router.post("/imagebaseqs", upload.single("image"), addImageQuestion);
router.post("/:quizId/addqs", upload.single("image"), addImageQuestion);


// =================== BLOCK SYSTEM (MUST BE BEFORE /:quizId) ===================
router.post("/:quizId/block-student", isAuthenticated, blockStudent);
router.get("/:quizId/block-status", isAuthenticated, getBlockStatus);
router.post("/:quizId/unblock-student", isAuthenticated, unblockStudent);


// =================== QUIZ OPERATIONS ===================
router.post("/:quizId/save-progress", isAuthenticated, saveProgress);
router.post("/:quizId/submit", isAuthenticated, submitQuiz);
router.get("/:quizId/submissions", isAuthenticated, getQuizSubmissions);
router.get("/title/:quizId", getQuizTitleById);


// =================== 🔥 MAIN QUIZ LOAD (LAST) ===================
router.get(
  "/:quizId",
  isAuthenticated,
  checkStudentBlocked,
  getQuiz
);


// =================== DELETE QUIZ ===================
router.delete("/:quizId", deleteQuiz);

export default router;
