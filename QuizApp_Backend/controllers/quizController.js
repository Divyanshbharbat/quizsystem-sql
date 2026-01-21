import Quiz from "../models/Quiz.js";
import QuizProgress from "../models/QuizProgress.js";

import Student from "../models/Student.js";
import Papa from "papaparse";
import cloudinary from "../config/cloudinary.js";
import multer from "multer";
import QuizConfig from "../models/QuizConfig.js";
const storage = multer.memoryStorage();
export const upload = multer({ storage });

// ---------------- Add image-based question to existing quiz ----------------
export const addImageQuestion = async (req, res) => {
  try {
    const { category, subcategory, description, options, answer } = req.body;

    if (!category || !subcategory)
      return res.status(400).json({ success: false, message: "Category & Subcategory required" });

    if (!req.file)
      return res.status(400).json({ success: false, message: "Image is required" });

    const parsedOptions = typeof options === "string" ? JSON.parse(options) : options;
    if (!Array.isArray(parsedOptions) || parsedOptions.length < 2)
      return res.status(400).json({ success: false, message: "At least 2 options required" });

    if (!parsedOptions.includes(answer))
      return res.status(400).json({ success: false, message: "Answer must be one of the options" });

    // Upload image to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "quiz_images" },
        (error, result) => (error ? reject(error) : resolve(result))
      );
      stream.end(req.file.buffer);
    });

    // Fetch the first quiz (assume single document for now)
    let quiz = await Quiz.findOne();
    if (!quiz) quiz = await Quiz.create({ categories: [] });

    // Check if category exists
    let catIndex = quiz.categories.findIndex(
      (c) => c.category === category && c.subcategory === subcategory
    );

    if (catIndex === -1) {
      quiz.categories.push({ category, subcategory, questions: [] });
      catIndex = quiz.categories.length - 1;
    }

    // Add question
    quiz.categories[catIndex].questions.push({
      question: "",
      image: uploadResult.secure_url,
      description: description || "",
      options: parsedOptions,
      answer,
      type: "image",
    });

    await quiz.save();

    res.status(201).json({
      success: true,
      message: "Image question added successfully",
      data: quiz,
    });
  } catch (err) {
    console.error("Error adding image question:", err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

// ---------------- Create quiz with a single image-based question ----------------
export const createQuizWithImageQuestion = async (req, res) => {
  try {
    const {
      title,
      duration,
      subject,
      category,
      options,
      answer,
      facultyId,
      description,
      limit,
      session,
    } = req.body;

    if (!title || !duration || !subject || !category || !options || !answer || !facultyId || !limit || !session)
      return res.status(400).json({ success: false, message: "All fields are required" });

    let parsedOptions = typeof options === "string" ? JSON.parse(options) : options;
    if (!Array.isArray(parsedOptions) || parsedOptions.length < 2)
      return res.status(400).json({ success: false, message: "At least 2 options are required" });

    if (!parsedOptions.includes(answer))
      return res.status(400).json({ success: false, message: "Answer must be one of the options" });

    if (!req.file)
      return res.status(400).json({ success: false, message: "Image is required" });

    // Upload image
    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "quiz_images" },
        (error, result) => (error ? reject(error) : resolve(result))
      );
      stream.end(req.file.buffer);
    });

    // Create new quiz
    const quiz = await Quiz.create({
      title,
      subject,
      duration,
      limit,
      session,
      createdBy: facultyId,
      categories: [
        {
          category,
          subcategory: "General",
          questions: [
            {
              question: "",
              image: uploadResult.secure_url,
              description: description || "",
              options: parsedOptions,
              answer,
              type: "image",
            },
          ],
        },
      ],
    });

    res.status(201).json({ success: true, message: "Quiz created with image question", data: quiz });
  } catch (err) {
    console.error("Error in createQuizWithImageQuestion:", err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

// ---------------- Create quiz (general) ----------------
export const createQuiz = async (req, res) => {
  try {
    const { categories } = req.body;

    if (!categories || !Array.isArray(categories) || categories.length === 0)
      return res.status(400).json({ success: false, message: "Categories are required" });

    const isValid = categories.every(cat =>
      cat.category &&
      cat.subcategory &&
      Array.isArray(cat.questions) &&
      cat.questions.length > 0 &&
      cat.questions.every(q => q.question && Array.isArray(q.options) && q.options.length >= 2 && q.answer && q.options.includes(q.answer))
    );

    if (!isValid) return res.status(400).json({ success: false, message: "Invalid category or question format" });

    const quiz = await Quiz.create({ categories });

    res.status(201).json({ success: true, message: "Questions added successfully", data: quiz });
  } catch (err) {
    console.error("Create Quiz Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ---------------- Get grouped categories ----------------
export const getGroupedCategories = async (req, res) => {
  try {
    const quizzes = await Quiz.findAll({ attributes: ["categories"] });
    const grouped = {};

    quizzes.forEach((quiz) => {
      quiz.categories.forEach((cat) => {
        if (!grouped[cat.category]) grouped[cat.category] = new Set();
        grouped[cat.category].add(cat.subcategory);
      });
    });

    const result = Object.keys(grouped).map(category => ({
      category,
      subcategories: Array.from(grouped[category]),
    }));

    res.status(200).json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ---------------- Create Quiz via CSV ----------------
export const createQuizByFaculty = async (req, res) => {
  try {
    const { csvData, facultyId, session } = req.body;
    if (!csvData) return res.status(400).json({ success: false, message: "CSV data is required" });

    const parsed = Papa.parse(csvData, { header: true, skipEmptyLines: true });
    if (!parsed.data?.length) return res.status(400).json({ success: false, message: "CSV is empty or invalid" });

    const categoriesMap = {};

    parsed.data.forEach((row) => {
      const category = row.Category || row.category;
      const subcategory = row.Subcategory || row.subcategory || "General";
      const question = row.Question || row.question;
      const optionsRaw = row.Options || row.options;
      const answer = row.Answer || row.answer;

      if (!category || !subcategory || !question || !optionsRaw || !answer) return;
      const options = optionsRaw.split(",").map(o => o.trim());
      if (!options.includes(answer.trim())) return;

      const key = `${category}::${subcategory}`;
      if (!categoriesMap[key]) categoriesMap[key] = { category, subcategory, questions: [] };

      categoriesMap[key].questions.push({ question: question.trim(), options, answer: answer.trim() });
    });

    const categories = Object.values(categoriesMap);

    const quiz = await Quiz.create({ categories, createdBy: facultyId, session });
    res.status(201).json({ success: true, message: "Quiz created successfully from CSV", data: quiz });
  } catch (err) {
    console.error("CSV Quiz creation error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ---------------- Utility: Seeded shuffle ----------------
export function seededShuffle(array, seed) {
  const result = [...array];
  let seedNum = 0;
  for (let i = 0; i < seed.length; i++) seedNum += seed.charCodeAt(i);

  function random() {
    seedNum = (seedNum * 9301 + 49297) % 233280;
    return seedNum / 233280;
  }

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}







export const getAllQuizConfigs = async (req, res) => {
  try {
    const { facultyId } = req.query;

    if (!facultyId) return res.status(400).json({ success: false, message: "facultyId is required" });

    const faculty = await Faculty.findByPk(facultyId);
    if (!faculty) return res.status(404).json({ success: false, message: "Faculty not found" });

    const filter = faculty.isAdmin ? {} : { createdBy: facultyId };

    const quizConfigs = await QuizConfig.findAll({
      where: filter,
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: Faculty,
          attributes: ["id", "name", "department"],
          as: "faculty",
        },
      ],
    });

    const quizzes = await Quiz.findAll();

    const result = [];

    quizConfigs.forEach((config) => {
      quizzes.forEach((quiz) => {
        quiz.categories.forEach((cat) => {
          if (cat.category === config.category) {
            const selected = config.selections.find((s) => s.subcategory === cat.subcategory);
            result.push({
              quizConfigId: config.id,
              title: config.title,
              category: cat.category,
              subcategory: cat.subcategory,
              totalQuestionsAvailable: cat.questions.length,
              selectedQuestions: selected ? selected.questionCount : 0,
              createdAt: config.createdAt,
              createdBy: config.createdBy,
              createdByDetails: config.faculty ? {
                id: config.faculty.id,
                name: config.faculty.name,
                department: config.faculty.department,
              } : null,
            });
          }
        });
      });
    });

    res.json({ success: true, isAdmin: faculty.isAdmin, data: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------- Get quiz results ----------------
export const getQuizResults = async (req, res) => {
  try {
    const { quizId } = req.params;
    const quiz = await QuizConfig.findByPk(quizId);

    if (!quiz) return res.status(404).json({ success: false, message: "Quiz not found" });

    const results = quiz.completed.map((entry) => ({
      studentId: entry.student,
      name: entry.name,
      rollNo: entry.rollNo,
      totalScore: entry.score,
      subcategoryScores: entry.subcategoryScores,
    }));

    res.json({ success: true, quizTitle: quiz.title, results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ---------------- Delete a quiz config ----------------
export const deleteQuizConfig = async (req, res) => {
  try {
    const { id } = req.params;
    const { facultyId } = req.body;

    if (!facultyId) return res.status(400).json({ success: false, message: "facultyId is required" });

    const quizConfig = await QuizConfig.findOne({ where: { id, createdBy: facultyId } });
    if (!quizConfig) return res.status(404).json({ success: false, message: "Quiz configuration not found or unauthorized" });

    await quizConfig.destroy();

    res.json({ success: true, message: "Quiz configuration deleted successfully", data: quizConfig });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------- Update quiz config ----------------
export const updateQuizConfig = async (req, res) => {
  try {
    const { id } = req.params;
    const { selections, facultyId } = req.body;

    if (!facultyId) return res.status(400).json({ success: false, message: "facultyId is required" });

    const quizConfig = await QuizConfig.findOne({ where: { id, createdBy: facultyId } });
    if (!quizConfig) return res.status(404).json({ success: false, message: "Quiz configuration not found or unauthorized" });

    quizConfig.selections = selections;
    await quizConfig.save();

    res.json({ success: true, message: "Quiz configuration updated successfully", data: quizConfig });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------- Get all categories and subcategories ----------------
export const getAllCategoriesAndSubcategories = async (req, res) => {
  try {
    const quizzes = await Quiz.findAll();
    const grouped = {};

    quizzes.forEach((quiz) => {
      quiz.categories.forEach((cat) => {
        if (!grouped[cat.category]) grouped[cat.category] = {};
        if (!grouped[cat.category][cat.subcategory]) grouped[cat.category][cat.subcategory] = 0;
        grouped[cat.category][cat.subcategory] += cat.questions.length;
      });
    });

    const data = Object.entries(grouped).flatMap(([category, subcats]) =>
      Object.entries(subcats).map(([subcategory, totalQuestionsAvailable]) => ({
        category,
        subcategory,
        totalQuestionsAvailable,
      }))
    );

    data.sort((a, b) => a.category.localeCompare(b.category) || a.subcategory.localeCompare(b.subcategory));

    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ---------------- Unblock student ----------------
export const unblockStudent = async (req, res) => {
  const { quizId } = req.params;
  const { studentId } = req.body;

  if (!studentId) return res.status(400).json({ success: false, message: "Student ID required" });

  try {
    const quiz = await Quiz.findByPk(quizId);
    if (!quiz) return res.status(404).json({ success: false, message: "Quiz not found" });

    quiz.blocked = quiz.blocked.filter((b) => b.studentId !== studentId);
    await quiz.save();

    res.json({ success: true, message: "Student unblocked successfully", blocked: quiz.blocked });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------- Block student ----------------
// ✅ Block student ----------------
// NEW: blockStudent



export const blockStudent = async (req, res) => {
  const { quizId } = req.params;
  const studentId = req.user?.id;

  console.log("\n╔════════════════════════════════════════╗");
  console.log("║     [BLOCK STUDENT] REQUEST START       ║");
  console.log("╚════════════════════════════════════════╝");
  console.log("📌 StudentID:", studentId);
  console.log("📌 QuizID:", quizId);

  if (!quizId || !studentId) {
    console.error("❌ MISSING REQUIRED FIELDS");
    return res.status(400).json({ success: false, message: "Quiz ID and Student ID required" });
  }

  try {
    // STEP 1: Fetch quiz
    console.log("\n[1] Fetching quiz config...");
    const quizConfig = await QuizConfig.findByPk(quizId);

    if (!quizConfig) {
      console.error("❌ Quiz not found");
      return res.status(404).json({ success: false, message: "Quiz not found" });
    }
    console.log("✅ Quiz found");

    // STEP 2: Get current blocked array
    console.log("\n[2] Getting current blocked array...");
    let blocked = quizConfig.blocked;
    console.log("   Raw value type:", typeof blocked);
    console.log("   Is array:", Array.isArray(blocked));
    console.log("   Value:", blocked);

    // Ensure it's always an array
    if (!Array.isArray(blocked)) {
      blocked = [];
      console.log("   ⚠️ NOT an array, reset to []");
    }

    console.log("   Final blocked array length:", blocked.length);

    const now = new Date();

    // STEP 3: Clean expired blocks
    console.log("\n[3] Cleaning expired blocks...");
    const beforeClean = blocked.length;
    blocked = blocked.filter(b => {
      if (!b || !b.expiresAt) return false;
      return new Date(b.expiresAt) > now;
    });
    const expiredCount = beforeClean - blocked.length;
    console.log("   Removed:", expiredCount, "expired blocks");
    console.log("   Remaining:", blocked.length, "active blocks");

    // STEP 4: Check if already blocked
    console.log("\n[4] Checking if student already blocked...");
    const existing = blocked.find(b => Number(b.studentId) === Number(studentId));
    if (existing) {
      const remainingSeconds = Math.ceil((new Date(existing.expiresAt) - now) / 1000);
      console.log("   ⚠️ Already blocked with", remainingSeconds, "seconds remaining");
      return res.json({
        success: true,
        alreadyBlocked: true,
        remainingSeconds: Math.max(0, remainingSeconds),
        expiresAt: new Date(existing.expiresAt).getTime(),
      });
    }
    console.log("   ✅ Not blocked yet, creating new block...");

    // STEP 5: Create new block
    console.log("\n[5] Creating new block entry...");
    const BLOCK_DURATION = 30;
    const expiresAt = new Date(now.getTime() + BLOCK_DURATION * 1000);

    const newBlock = {
      studentId: Number(studentId),
      expiresAt: expiresAt.toISOString()
    };

    console.log("   New block:", JSON.stringify(newBlock));
    blocked.push(newBlock);
    console.log("   Array length after push:", blocked.length);

    // STEP 6: Save to database using INSTANCE method (not update)
    console.log("\n[6] Saving to database...");
    quizConfig.blocked = blocked;  // ✅ This triggers the model setter
    const saveResult = await quizConfig.save();
    console.log("   ✅ Save result - updatedAt:", saveResult.updatedAt);

    // STEP 7: Verify save - CRITICAL: Wait and check multiple times
    console.log("\n[7] Verifying save...");
    let verifyQuiz = await QuizConfig.findByPk(quizId);
    let verifyBlocked = verifyQuiz.blocked;
    
    console.log("   Verified blocked type:", typeof verifyBlocked);
    console.log("   Verified blocked isArray:", Array.isArray(verifyBlocked));
    console.log("   Verified blocked length:", verifyBlocked?.length || 0);
    console.log("   Verified blocked content:", JSON.stringify(verifyBlocked));

    // STEP 8: Confirm block exists - if not, retry
    console.log("\n[8] Final confirmation...");
    let blockConfirmed = Array.isArray(verifyBlocked) && 
                         verifyBlocked.some(b => Number(b.studentId) === Number(studentId));

    if (!blockConfirmed) {
      console.warn("   ⚠️ Block not confirmed on first check, retrying...");
      // Wait a tiny bit and check again
      await new Promise(resolve => setTimeout(resolve, 100));
      verifyQuiz = await QuizConfig.findByPk(quizId);
      verifyBlocked = verifyQuiz.blocked;
      blockConfirmed = Array.isArray(verifyBlocked) && 
                       verifyBlocked.some(b => Number(b.studentId) === Number(studentId));
      console.log("   Retry result:", blockConfirmed);
    }

    if (blockConfirmed) {
      console.log("   ✅✅✅ BLOCK SUCCESSFULLY SAVED AND VERIFIED ✅✅✅");
    } else {
      console.error("   ❌❌❌ BLOCK NOT IN DATABASE - FAILED ❌❌❌");
    }

    console.log("\n╔════════════════════════════════════════╗");
    console.log("║      [BLOCK STUDENT] SUCCESS            ║");
    console.log("╚════════════════════════════════════════╝\n");

    return res.json({
      success: true,
      blocked: true,
      remainingSeconds: BLOCK_DURATION,
      expiresAt: expiresAt.getTime(),
      message: `Student blocked for ${BLOCK_DURATION} seconds`
    });

  } catch (err) {
    console.error("\n❌❌❌ [BLOCK STUDENT] EXCEPTION ❌❌❌");
    console.error("Error message:", err.message);
    console.error("Error stack:", err.stack);
    console.log("╚════════════════════════════════════════╝\n");
    
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: err.message
    });
  }
};



// Export all controllers
export default {

 
  blockStudent, // <- make sure it’s included here if using default export
};


// ✅ Get block status ----------------
export const getBlockStatus = async (req, res) => {
  const { quizId } = req.params;
  const studentId = Number(req.user?.id);

  if (!studentId || isNaN(studentId)) {
    console.error("[GET_BLOCK_STATUS] Invalid studentId:", req.user?.id);
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  try {
    const quizConfig = await QuizConfig.findByPk(quizId);
    if (!quizConfig) {
      return res.status(404).json({ success: false, message: "Quiz not found" });
    }

    const now = new Date();
    let blocked = quizConfig.blocked || [];

    // ✅ Remove expired blocks and persist cleanup
    const activeBlocks = blocked.filter(b => {
      if (!b.expiresAt) return false;
      return new Date(b.expiresAt) > now;
    });

    // Save cleanup if any blocks expired
    if (activeBlocks.length !== blocked.length) {
      await quizConfig.update({ blocked: activeBlocks });
      console.log(`[GET_BLOCK_STATUS] Cleaned expired blocks for quiz ${quizId}`);
    }

    // ✅ Find this student's block (consistent field name)
    const block = activeBlocks.find(b => Number(b.studentId) === studentId);

    if (!block) {
      console.log(`[GET_BLOCK_STATUS] Student ${studentId} is NOT blocked`);
      return res.json({ 
        success: true, 
        blocked: false, 
        remainingSeconds: 0,
        expiresAt: 0
      });
    }

    const remainingSeconds = Math.ceil(
      (new Date(block.expiresAt).getTime() - now.getTime()) / 1000
    );

    console.log(`[GET_BLOCK_STATUS] Student ${studentId} is BLOCKED for ${remainingSeconds}s`);

    return res.json({
      success: true,
      blocked: true,
      remainingSeconds: Math.max(0, remainingSeconds),
      expiresAt: new Date(block.expiresAt).getTime()
    });

  } catch (err) {
    console.error("[GET_BLOCK_STATUS] Error:", err);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};





//here

import { Op } from "sequelize";

import Faculty from "../models/Faculty.js";
import crypto from "crypto";

const generateQuestionId = (subcategory, question) => {
  return crypto
    .createHash("sha256")
    .update(subcategory + question)
    .digest("hex");
};

export const getQuiz = async (req, res) => {
  const { quizId } = req.params;
  const studentId = req.user?.id;

  if (!studentId) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  try {
    const quizConfig = await QuizConfig.findByPk(quizId, {
      include: {
        model: Faculty,
        as: "faculty",
        attributes: ["id", "name", "email", "department"],
      },
    });

    if (!quizConfig) {
      return res.status(404).json({ success: false, message: "QuizConfig not found" });
    }

    // ================= FETCH / CREATE PROGRESS =================
    let progress = await QuizProgress.findOne({
      where: { studentId, quizId },
    });

    if (!progress) {
      progress = await QuizProgress.create({
        studentId,
        quizId,
        currentQuestionIndex: 0,
        completed: false,
        timeLeft: quizConfig.timeLimit * 60,
        answers: [],
        questionMap: {},
      });
    }

    // ================= BLOCK CHECK =================
    const now = Date.now();
    console.log("\n📋 [GET QUIZ] BLOCK CHECK START");
    console.log("   StudentID:", studentId, "| QuizID:", quizId);
    
    let blocked = quizConfig.blocked;
    console.log("   Blocked type:", typeof blocked);
    console.log("   Is array:", Array.isArray(blocked));
    console.log("   Raw blocked:", blocked);

    if (!Array.isArray(blocked)) {
      blocked = [];
      console.log("   ⚠️ Not array, reset to []");
    }

    // Remove expired blocks (do NOT save yet, just filter)
    const activeBlocks = blocked.filter(b => {
      if (!b || !b.expiresAt) return false;
      const expiry = new Date(b.expiresAt).getTime();
      return expiry > now;
    });

    console.log("   Active blocks after filter:", activeBlocks.length);
    console.log("   Active blocks content:", JSON.stringify(activeBlocks));

    // Check if this student is blocked
    const block = activeBlocks.find(b => Number(b.studentId) === Number(studentId));
    console.log("   Block found for student:", block ? "YES ✅" : "NO ❌");

    if (block) {
      console.log("   Block expiresAt:", block.expiresAt);
      console.log("   Current time:", new Date(now).toISOString());
      
      const remainingSeconds = Math.ceil((new Date(block.expiresAt).getTime() - now) / 1000);
      console.log("   Remaining seconds:", remainingSeconds);
      console.log("📋 [GET QUIZ] BLOCK CHECK END - STUDENT BLOCKED\n");

      const savedAnswers = progress.answers || [];
      let selectionsWithQuestions = [];

      if (progress.questionMap && Object.keys(progress.questionMap).length > 0) {
        quizConfig.selections.forEach(sel => {
          const questions = Object.entries(progress.questionMap)
            .filter(([_, q]) => q.subcategory === sel.subcategory)
            .map(([id, q]) => ({
              id,
              question: q.question,
              options: q.options,
              selectedOption:
                savedAnswers.find(a => a.questionId === id)?.selectedOption ?? null,
            }));

          selectionsWithQuestions.push({
            subcategory: sel.subcategory,
            questions,
          });
        });
      }

      return res.json({
        success: true,
        blocked: true,
        remainingSeconds,
        expiresAt: new Date(block.expiresAt).getTime(),
        data: {
          quizConfig,
          selectionsWithQuestions,
          progress: {
            currentQuestionIndex: progress.currentQuestionIndex,
            timeLeft: progress.timeLeft,
            completed: progress.completed,
            answers: savedAnswers,
          },
          serverTime: now,
        },
      });
    }

    // ================= ALREADY COMPLETED =================
    if (progress.completed === true) {
      console.log("📋 [GET QUIZ] BLOCK CHECK END - STUDENT ALREADY COMPLETED\n");
      return res.json({
        success: true,
        isCompleted: true,
        message: "You have already completed this quiz",
        data: {
          quizConfig,
          selectionsWithQuestions: [],
          progress: {
            currentQuestionIndex: 0,
            timeLeft: 0,
            completed: true,
            answers: [],
          },
          serverTime: now,
        },
      });
    }

    const savedAnswers = progress.answers || [];

    // ================= REUSE LOCKED QUESTIONS =================
    if (progress.questionMap && Object.keys(progress.questionMap).length > 0) {
      const selectionsWithQuestions = [];

      quizConfig.selections.forEach(sel => {
        const questions = Object.entries(progress.questionMap)
          .filter(([_, q]) => q.subcategory === sel.subcategory)
          .map(([id, q]) => ({
            id,
            question: q.question,
            options: q.options,
            selectedOption:
              savedAnswers.find(a => a.questionId === id)?.selectedOption ?? null,
          }));

        selectionsWithQuestions.push({
          subcategory: sel.subcategory,
          questions,
        });
      });

      return res.json({
        success: true,
        blocked: false,
        remainingSeconds: 0,
        data: {
          quizConfig,
          selectionsWithQuestions,
          progress: {
            currentQuestionIndex: progress.currentQuestionIndex,
            timeLeft: progress.timeLeft,
            completed: progress.completed,
            answers: savedAnswers,
          },
          serverTime: now,
        },
      });
    }

    // ================= GENERATE QUESTIONS (FIRST TIME ONLY) =================
    const allQuizzes = await Quiz.findAll();
    const selectionsWithQuestions = {};
    const questionMap = {};

    for (const selection of quizConfig.selections) {
      let pool = [];

      allQuizzes.forEach(qz => {
        const categories = Array.isArray(qz.categories)
          ? qz.categories
          : JSON.parse(qz.categories);

        categories.forEach(cat => {
          if (cat.subcategory === selection.subcategory) {
            pool.push(...cat.questions);
          }
        });
      });

      // Deduplicate
      pool = Array.from(
        new Map(pool.map(q => [q.question + JSON.stringify(q.options), q])).values()
      );

      // Seeded shuffle → same questions after refresh
      const shuffled = seededShuffle(pool, `${quizId}_${studentId}`);
      const selected = shuffled.slice(0, selection.questionCount);

      selectionsWithQuestions[selection.subcategory] = selected.map(q => {
        const id = generateQuestionId(selection.subcategory, q.question);

        questionMap[id] = {
          subcategory: selection.subcategory,
          question: q.question,
          options: q.options,
          answer: q.answer,
        };

        return {
          id,
          question: q.question,
          options: q.options,
          selectedOption: null,
        };
      });
    }

    // ================= SAVE QUESTION MAP =================
    progress.questionMap = questionMap;
    await progress.save();

    console.log("📋 [GET QUIZ] BLOCK CHECK END - STUDENT NOT BLOCKED\n");

    return res.json({
      success: true,
      blocked: false,
      remainingSeconds: 0,
      data: {
        quizConfig,
        selectionsWithQuestions: Object.entries(selectionsWithQuestions).map(
          ([subcategory, questions]) => ({ subcategory, questions })
        ),
        progress: {
          currentQuestionIndex: progress.currentQuestionIndex,
          timeLeft: progress.timeLeft,
          completed: progress.completed,
          answers: savedAnswers,
        },
        serverTime: now,
      },
    });

  } catch (err) {
    console.error("[ERROR] getQuiz:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};



// ================= SAVE PROGRESS =================
export const saveProgress = async (req, res) => {
  const studentId = req.user?.id; // ✅ Keep as is (from auth middleware)
  const quizId = req.params.quizId; // ✅ Keep as STRING (UUID format)
  const { currentQuestionIndex, answers, timeLeft } = req.body;

  // ✅ Validate inputs
  if (!studentId || isNaN(parseInt(studentId, 10))) {
    console.error("[SAVE_PROGRESS] Invalid studentId:", studentId);
    return res.status(401).json({ success: false, message: "Unauthorized - Invalid student ID" });
  }

  if (!quizId || typeof quizId !== "string" || quizId.trim().length === 0) {
    console.error("[SAVE_PROGRESS] Invalid quizId:", quizId);
    return res.status(400).json({ success: false, message: "Bad request - Invalid quiz ID" });
  }

  if (typeof currentQuestionIndex !== "number" || currentQuestionIndex < 0) {
    console.error("[SAVE_PROGRESS] Invalid currentQuestionIndex:", currentQuestionIndex);
    return res.status(400).json({ success: false, message: "Bad request - Invalid question index" });
  }

  if (!Array.isArray(answers)) {
    console.error("[SAVE_PROGRESS] Invalid answers format:", answers);
    return res.status(400).json({ success: false, message: "Bad request - Answers must be an array" });
  }

  if (typeof timeLeft !== "number" || timeLeft < 0) {
    console.error("[SAVE_PROGRESS] Invalid timeLeft:", timeLeft);
    return res.status(400).json({ success: false, message: "Bad request - Invalid time left" });
  }

  try {
    let progress = await QuizProgress.findOne({
      where: { studentId: parseInt(studentId, 10), quizId }
    });

    const formattedAnswers = answers.map(ans => ({
      questionId: ans.questionId, // Use the full questionId sent by frontend (subcategory_index)
      selectedOption: ans.selectedOption ?? null
    }));

    if (!progress) {
      progress = await QuizProgress.create({
        studentId: parseInt(studentId, 10),
        quizId: quizId.trim(), // ✅ Ensure string is trimmed
        currentQuestionIndex,
        answers: formattedAnswers,
        timeLeft: Math.max(0, Math.floor(timeLeft))
      });
      console.log(`[SAVE_PROGRESS] Created new progress for student ${studentId}, quiz ${quizId}`);
    } else {
      progress.currentQuestionIndex = currentQuestionIndex;
      progress.answers = formattedAnswers;
      progress.timeLeft = Math.max(0, Math.floor(timeLeft));
      await progress.save();
      console.log(`[SAVE_PROGRESS] Updated progress for student ${studentId}, quiz ${quizId}`);
    }

    return res.json({
      success: true,
      message: "Progress saved successfully",
      data: {
        currentQuestionIndex: progress.currentQuestionIndex,
        timeLeft: progress.timeLeft
      }
    });

  } catch (err) {
    console.error("[SAVE_PROGRESS] Database error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message
    });
  }
};



// ---------------- GET QUIZ SUBMISSIONS ----------------
export const getQuizSubmissions = async (req, res) => {
  const { quizId } = req.params;
  try {
    const quiz = await Quiz.findByPk(quizId);
    if (!quiz) return res.status(404).json({ success: false, message: "Quiz not found" });

    const submissions = await QuizSubmission.findAll({
      where: { quizConfigId: quizId },
      include: { model: Student, attributes: ["id", "name", "studentId"] },
    });

    const submissionsWithScore = submissions.map(sub => {
      const correctAnswers = {};
      (quiz.questions || []).forEach(q => { correctAnswers[q.id] = q.answer; });

      const answersWithScore = (sub.answers || []).map(a => ({
        questionId: a.questionId,
        selectedOption: a.selectedOption,
        score: correctAnswers[a.questionId] === a.selectedOption ? 1 : 0,
      }));

      const totalScore = answersWithScore.reduce((sum, a) => sum + a.score, 0);

      return { id: sub.id, student: sub.Student, submittedAt: sub.createdAt, answers: answersWithScore, totalScore };
    });

    res.json({ success: true, data: submissionsWithScore });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ---------------- DELETE INACTIVE PROGRESS ----------------
export const deleteInactiveProgress = async () => {
  try {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    await QuizProgress.destroy({
      where: { completed: false, updatedAt: { [Op.lt]: thirtyMinutesAgo } },
    });
  } catch (err) {
    console.error(err);
  }
};

// ---------------- CREATE QUIZ CONFIG ----------------
export const createQuizConfig = async (req, res) => {
  console.log(req.body);

  const { title, category, timeLimit, selections, facultyId } = req.body;

  console.log("📦 Request Body:", req.body);

  if (!facultyId) {
    console.log("❌ facultyId missing");
    return res.status(400).json({
      success: false,
      message: "facultyId is required"
    });
  }

  try {
    console.log("⏳ Creating quiz config in DB...");

    // Generate unique SHA-based ID
    const shaInput = `${title}-${category}-${facultyId}-${Date.now()}-${Math.random()}`;
    const shaId = crypto.createHash('sha256').update(shaInput).digest('hex').substring(0, 12);

    const quiz = await QuizConfig.create({
      id: shaId,
      title,
      category,
      timeLimit,
      selections,
      facultyId,
      createdBy: facultyId
    });

    console.log("✅ QuizConfig created successfully with SHA ID:", shaId);

    return res.status(201).json({
      success: true,
      data: quiz,
      message: "Quiz configuration created successfully"
    });

  } catch (err) {
    console.error("🔥 Error while creating quiz config:");
    console.error(err);

    return res.status(500).json({
      success: false,
      message: "Failed to create quiz config",
      error: err.message
    });
  }
};


// ---------------- DELETE QUIZ ----------------
export const deleteQuiz = async (req, res) => {
  try {
    const deleted = await QuizConfig.destroy({ where: { id: req.params.quizId } });
    if (!deleted) return res.status(404).json({ success: false, message: "Quiz not found" });
    res.json({ success: true, message: "Quiz deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ---------------- GET QUIZ TITLE ----------------
export const getQuizTitleById = async (req, res) => {
  try {
    const quiz = await QuizConfig.findByPk(req.params.quizId, { attributes: ["title"] });
    if (!quiz) return res.status(404).json({ success: false, message: "Quiz not found" });
    res.json({ success: true, data: { quiz } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error while fetching quiz title" });
  }
};
