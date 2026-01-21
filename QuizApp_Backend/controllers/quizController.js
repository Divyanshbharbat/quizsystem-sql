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
export const blockStudent = async (req, res) => {
  const { quizId } = req.params;
  const studentId = req.user?.id;

  if (!quizId || !studentId) {
    return res.status(400).json({ success: false, message: "Quiz ID and Student ID required" });
  }

  try {
    const quizConfig = await QuizConfig.findByPk(quizId);
    if (!quizConfig) {
      return res.status(404).json({ success: false, message: "Quiz not found" });
    }

    const now = new Date();

    let blocked = Array.isArray(quizConfig.blocked) ? quizConfig.blocked : [];

    // ✅ Remove expired blocks and persist cleanup
    blocked = blocked.filter(b => new Date(b.expiresAt) > now);

    const existing = blocked.find(
      b => String(b.studentId) === String(studentId)
    );

    if (existing) {
      const remainingSeconds = Math.ceil(
        (new Date(existing.expiresAt) - now) / 1000
      );

      return res.json({
        success: true,
        alreadyBlocked: true,
        remainingSeconds,
        expiresAt: new Date(existing.expiresAt).getTime()
      });
    }

    const BLOCK_DURATION = 30;
    const expiresAt = new Date(now.getTime() + BLOCK_DURATION * 1000);

    blocked.push({
      studentId,
      expiresAt: expiresAt.toISOString() // ✅ JSON safe
    });

    // ✅ Save the cleaned blocked array to database
    await quizConfig.update({ blocked });

    res.json({
      success: true,
      blocked: true,
      remainingSeconds: BLOCK_DURATION,
      expiresAt: expiresAt.getTime()
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};




// ---------------- Get block status ----------------
export const getBlockStatus = async (req, res) => {
  const { quizId } = req.params;
  const studentId = req.user?.id;

  if (!quizId || !studentId) {
    return res.status(400).json({ success: false, message: "Quiz ID and Student ID required" });
  }

  try {
    const quizConfig = await QuizConfig.findByPk(quizId);
    if (!quizConfig) {
      return res.status(404).json({ success: false, message: "Quiz not found" });
    }

    const now = new Date();

    let blocked = Array.isArray(quizConfig.blocked) ? quizConfig.blocked : [];

    blocked = blocked.filter(b => new Date(b.expiresAt) > now);

    // ✅ persist cleanup
    await quizConfig.update({ blocked });

    const existing = blocked.find(
      b => String(b.studentId) === String(studentId)
    );

    if (existing) {
      return res.json({
        success: true,
        blocked: true,
        remainingSeconds: Math.ceil(
          (new Date(existing.expiresAt) - now) / 1000
        ),
        expiresAt: new Date(existing.expiresAt).getTime()
      });
    }

    res.json({ success: true, blocked: false, remainingSeconds: 0 });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};




//here

import { Op } from "sequelize";

import Faculty from "../models/Faculty.js";

// ---------------- GET QUIZ ----------------
// export const getQuiz = async (req, res) => {
//   const { quizId } = req.params;
//  const studentId = req.student?.studentId; // matches middleware

// console.log("Fetching quiz:", { quizId, studentId });
//   if (!studentId) return res.status(401).json({ success: false, message: "Unauthorized" });

//   try {
//     const quizConfig = await QuizConfig.findByPk(quizId, {
//       include: { model: Faculty, attributes: ["id", "name"] },
//     });

//     if (!quizConfig) return res.status(404).json({ success: false, message: "QuizConfig not found" });

//     const now = new Date();

//     // Ensure blocked array exists
//     quizConfig.blocked = quizConfig.blocked || [];

//     // Remove expired blocks
//     quizConfig.blocked = quizConfig.blocked.filter(block => block.expiresAt && new Date(block.expiresAt) > now);

//     const existingBlock = quizConfig.blocked.find(block => block.student === studentId);
//     let blocked = false;
//     let remainingSeconds = 0;

//     if (existingBlock) {
//       blocked = true;
//       remainingSeconds = Math.ceil((new Date(existingBlock.expiresAt) - now) / 1000);
//     }

//     // Find or create progress
//     let progress = await QuizProgress.findOne({ where: { studentId, quizConfigId: quizId } });
//     if (!progress) {
//       progress = await QuizProgress.create({
//         studentId,
//         quizConfigId: quizId,
//         currentQuestionIndex: 0,
//         answers: JSON.stringify([]),
//         completed: false,
//         status: false,
//         timeLeft: quizConfig.timeLimit * 60,
//       });
//     }

//     // Fetch questions (adapted for Sequelize JSON field)
//     const selectionsWithQuestions = await Promise.all(
//       quizConfig.selections.map(async (selection) => {
//         const allQuizzes = await Quiz.findAll({
//           where: {
//             category: quizConfig.category,
//             subcategory: selection.subcategory,
//           },
//         });

//         let questions = [];
//         allQuizzes.forEach((quiz) => {
//           if (Array.isArray(quiz.questions)) questions.push(...quiz.questions);
//         });

//         const uniqueQuestions = Array.from(
//           new Map(
//             questions
//               .filter(q => q && q.id && q.question && Array.isArray(q.options))
//               .map(q => [q.id.toString(), q])
//           ).values()
//         );

//         const shuffled = seededShuffle(uniqueQuestions, studentId);
//         const selectedQuestions = shuffled.slice(0, selection.questionCount);

//         const answers = JSON.parse(progress.answers || "[]");

//         const questionsForStudent = selectedQuestions.map((q) => {
//           const savedOption = answers.find(a => a.questionId === q.id)?.selectedOption ?? null;
//           return {
//             id: q.id,
//             question: q.question,
//             options: q.options,
//             selectedOption: savedOption,
//           };
//         });

//         return {
//           subcategory: selection.subcategory,
//           questions: questionsForStudent,
//         };
//       })
//     );

//     return res.json({
//       success: true,
//       message: "Quiz fetched successfully",
//       blocked,
//       remainingSeconds,
//       data: {
//         quizConfig,
//         progress: {
//           currentQuestionIndex: progress.currentQuestionIndex,
//           timeLeft: progress.timeLeft,
//           answers: JSON.parse(progress.answers || "[]"),
//         },
//         serverTime: Date.now(),
//       },
//     });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ success: false, message: error.message });
//   }
// };


// Helper: shuffle questions consistently per student




/**
 * Seeded shuffle function: always returns the same shuffled order for a given seed
 */


// ================= GET QUIZ =================
// export const getQuiz = async (req, res) => {
//   const { quizId } = req.params;
//   const studentId = req.user?.id;

//   if (!studentId) {
//     return res.status(401).json({ success: false, message: "Unauthorized" });
//   }

 

//   try {
//     // Fetch quiz config with faculty
//     const quizConfig = await QuizConfig.findByPk(quizId, {
//       include: {
//         model: Faculty,
//         as: "faculty",
//         attributes: ["id", "name", "email", "department"],
//       },
//     });

//     if (!quizConfig) {
//       return res.status(404).json({ success: false, message: "QuizConfig not found" });
//     }

//     // Ensure blocked array exists
//     quizConfig.blocked = quizConfig.blocked || [];

//     // Remove expired blocks
//     const now = new Date();
//     quizConfig.blocked = quizConfig.blocked.filter(
//       (block) => block.expiresAt && new Date(block.expiresAt) > now
//     );

//     await quizConfig.update({ blocked: quizConfig.blocked });

//     // Check if student is blocked
//     const existingBlock = quizConfig.blocked.find((b) => b.studentId === studentId);
//     if (existingBlock) {
//       const remainingSeconds = Math.ceil(
//         (new Date(existingBlock.expiresAt) - now) / 1000
//       );

     

//       return res.json({
//         success: true,
//         message: "Quiz fetched successfully",
//         blocked: true,
//         remainingSeconds,
//         data: {
//           quizConfig: {
//             id: quizConfig.id,
//             title: quizConfig.title,
//             category: quizConfig.category,
//             timeLimit: quizConfig.timeLimit,
//             selections: quizConfig.selections,
//             createdBy: quizConfig.faculty,
//           },
//           selectionsWithQuestions: [],
//           progress: {
//             currentQuestionIndex: 0,
//             timeLeft: 0,
//             completed: false,
//             answers: [],
//           },
//           serverTime: Date.now(),
//         },
//       });
//     }

//     // Find or create progress
//     let progress = await QuizProgress.findOne({ where: { studentId, quizId } });
//     if (!progress) {
//       try {
//         progress = await QuizProgress.create({
//           studentId,
//           quizId,
//           currentQuestionIndex: 0,
//           completed: false,
//           status: false,
//           timeLeft: quizConfig.timeLimit * 60,
//           answers: [],
//         });
//         console.log(`[DEBUG] Created new progress for student ${studentId}`);
//       } catch (createErr) {
//         // If it fails due to duplicate, fetch the existing record
//         if (createErr.name === 'SequelizeUniqueConstraintError') {
//           console.log(`[DEBUG] Progress already exists, fetching existing record for student ${studentId}`);
//           progress = await QuizProgress.findOne({ where: { studentId, quizId } });
//           if (!progress) {
//             throw new Error(`[CRITICAL] Failed to fetch existing progress for student ${studentId}`);
//           }
//         } else {
//           throw createErr;
//         }
//       }
//     } else {
//       console.log(`[DEBUG] Existing progress found:`, progress.answers);
//     }

//     // Safety check
//     if (!progress) {
//       return res.status(500).json({ success: false, message: "Failed to initialize quiz progress" });
//     }

//     const savedAnswers = progress.answers || [];
//     const selectionsWithQuestions = [];

    

//     const allQuizzes = await Quiz.findAll();
   

//     allQuizzes.forEach((quiz, idx) => {
//       console.log(`[DEBUG] Quiz ${idx}:`, {
//         id: quiz.id,
//         categoriesCount: quiz.categories?.length || 0,
//         categories: quiz.categories?.map(c => ({
//           category: c.category,
//           subcategory: c.subcategory,
//           questionCount: c.questions?.length || 0
//         }))
//       });
//     });

//     for (const selection of quizConfig.selections) {
//       let questions = [];

     

//       allQuizzes.forEach((quiz, quizIdx) => {
//         let categories = [];
//         try {
//           categories = Array.isArray(quiz.categories) ? quiz.categories : JSON.parse(quiz.categories);
//         } catch (err) {
//           console.error(`[ERROR] Invalid categories JSON for quiz ${quiz.id}:`, err.message);
//           return;
//         }

       

//         categories.forEach((cat, catIdx) => {
//           console.log(`[DEBUG]     Category ${catIdx}: "${cat.category}" / "${cat.subcategory}"`);
//           console.log(`[DEBUG]       Comparing "${cat.subcategory}" === "${selection.subcategory}" ? ${cat.subcategory === selection.subcategory}`);
//           console.log(`[DEBUG]       Questions array is array? ${Array.isArray(cat.questions)}`);
//           console.log(`[DEBUG]       Questions length: ${cat.questions?.length || 0}`);

//           if (cat.subcategory === selection.subcategory && Array.isArray(cat.questions)) {
//             console.log(`[DEBUG]   ✅ MATCH! Adding ${cat.questions.length} questions`);
//             questions.push(...cat.questions);
//           }
//         });
//       });

   

//       // Remove duplicate questions by text
//       const uniqueQuestions = Array.from(
//         new Map(
//           questions
//             .filter((q) => {
//               const isValid = q && q.question && Array.isArray(q.options);
//               if (!isValid) console.log(`[DEBUG]   Filtered out question:`, q);
//               return isValid;
//             })
//             .map((q) => [q.question, q])
//         ).values()
//       );

     

//       // Shuffle
//       const shuffled = seededShuffle(uniqueQuestions, studentId);

//       const selectedQuestions = shuffled.slice(0, selection.questionCount);


//       // Map saved answers - use a consistent question ID based on question text
//       const questionsForStudent = selectedQuestions.map((q, index) => {
//         // Create a consistent ID based on question text hash
//         const questionId = `${selection.subcategory}_${index}`;
//         const savedAnswer = savedAnswers.find((a) => a.questionId === questionId);
        
//         return {
//           id: questionId,
//           question: q.question,
//           options: q.options,
//           answer: q.answer,
//           selectedOption: savedAnswer?.selectedOption ?? null,
//         };
//       });

//       console.log(`[DEBUG] Final questions for student in "${selection.subcategory}": ${questionsForStudent.length}`);
      
//       // 🔴 LOG WHAT WE'RE SENDING TO FRONTEND
//       console.log(`[DEBUG] Sending ${selection.subcategory} questions to student ${studentId}:`);
//       questionsForStudent.forEach((q, idx) => {
//         console.log(`[DEBUG]   Q${idx} (ID: ${q.id}): "${q.question}"`);
//         console.log(`[DEBUG]     Options: ${JSON.stringify(q.options)}`);
//         console.log(`[DEBUG]     Correct Answer: "${q.answer}"`);
//         console.log(`[DEBUG]     Student's saved answer: "${q.selectedOption}"`);
//       });

//       selectionsWithQuestions.push({
//         subcategory: selection.subcategory,
//         questions: questionsForStudent,
//       });
//     }

 

//     // 🔴 Store the questionMap in progress for consistent scoring
//     const questionMapForStorage = {};
//     selectionsWithQuestions.forEach(selection => {
//       selection.questions.forEach(q => {
//         questionMapForStorage[q.id] = {
//           question: q.question,
//           options: q.options,
//           answer: q.answer
//         };
//       });
//     });

//     // Update progress with the questionMap
//     progress.questionMap = questionMapForStorage;
//     await progress.save();
//     console.log(`[DEBUG] Stored questionMap with ${Object.keys(questionMapForStorage).length} questions in QuizProgress`);

//     return res.json({
//       success: true,
//       message: "Quiz fetched successfully",
//       blocked: false,
//       remainingSeconds: 0,
//       data: {
//         quizConfig: {
//           id: quizConfig.id,
//           title: quizConfig.title,
//           category: quizConfig.category,
//           timeLimit: quizConfig.timeLimit,
//           selections: quizConfig.selections,
//           createdBy: quizConfig.faculty,
//         },
//         selectionsWithQuestions,
//         progress: {
//           currentQuestionIndex: progress.currentQuestionIndex,
//           timeLeft: progress.timeLeft,
//           completed: progress.completed,
//           answers: savedAnswers,
//         },
//         serverTime: Date.now(),
//       },
//     });
//   } catch (err) {
//     console.error("[ERROR] getQuiz error:", err);
//     return res.status(500).json({ success: false, message: err.message });
//   }
// };
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

    // ================= PROGRESS (FETCH EARLY) =================
    let progress = await QuizProgress.findOne({ where: { studentId, quizId } });

    if (!progress) {
      progress = await QuizProgress.create({
        studentId,
        quizId,
        currentQuestionIndex: 0,
        completed: false,
        status: false,
        timeLeft: quizConfig.timeLimit * 60,
        answers: [],
        questionMap: {},
      });
    }

    // ================= CHECK IF ALREADY COMPLETED =================
    if (progress.completed === true) {
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
          serverTime: Date.now(),
        },
      });
    }

    // ================= BLOCK CHECK =================
    quizConfig.blocked = quizConfig.blocked || [];
    const now = new Date();

    quizConfig.blocked = quizConfig.blocked.filter(
      b => b.expiresAt && new Date(b.expiresAt) > now
    );
    await quizConfig.update({ blocked: quizConfig.blocked });

    const block = quizConfig.blocked.find(b => b.studentId === studentId);
    if (block) {
      const remainingSeconds = Math.ceil(
        (new Date(block.expiresAt) - now) / 1000
      );
      const savedAnswers = progress.answers || [];
      
      // ✅ If student has questions stored, show them even while blocked (for re-login scenario)
      let selectionsWithQuestions = [];
      if (progress.questionMap && Object.keys(progress.questionMap).length > 0) {
        quizConfig.selections.forEach(sel => {
          const qs = Object.entries(progress.questionMap)
            .filter(([id, q]) => q.subcategory === sel.subcategory)
            .map(([id, q]) => ({
              id,
              question: q.question,
              options: q.options,
              selectedOption:
                savedAnswers.find(a => a.questionId === id)?.selectedOption ?? null,
            }));

          selectionsWithQuestions.push({
            subcategory: sel.subcategory,
            questions: qs,
          });
        });
      }

      return res.json({
        success: true,
        blocked: true,
        remainingSeconds: remainingSeconds,
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
          serverTime: Date.now(),
        },
      });
    }

    const savedAnswers = progress.answers || [];

    // ================= REUSE QUESTIONS (CRITICAL FIX) =================
    if (progress.questionMap && Object.keys(progress.questionMap).length > 0) {
      const selectionsWithQuestions = [];

      quizConfig.selections.forEach(sel => {
        const qs = Object.entries(progress.questionMap)
          .filter(([id, q]) => q.subcategory === sel.subcategory)
          .map(([id, q]) => ({
            id,
            question: q.question,
            options: q.options,
            selectedOption:
              savedAnswers.find(a => a.questionId === id)?.selectedOption ?? null,
          }));

        selectionsWithQuestions.push({
          subcategory: sel.subcategory,
          questions: qs,
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
          serverTime: Date.now(),
        },
      });
    }

    // ================= GENERATE QUESTIONS (ONCE) =================
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

      // 🔥 STRONG SEED (quizId + studentId)
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

    // ================= SAVE LOCKED QUESTIONS =================
    progress.questionMap = questionMap;
    await progress.save();

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
        serverTime: Date.now(),
      },
    });

  } catch (err) {
    console.error("[ERROR] getQuiz:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};


// ================= SAVE PROGRESS =================
export const saveProgress = async (req, res) => {
  const studentId = parseInt(req.user?.id, 10); // ✅ convert to integer
  const quizId = parseInt(req.params.quizId, 10);  // ✅ convert to integer
  const { currentQuestionIndex, answers, timeLeft } = req.body;

  if (!studentId) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  try {
    let progress = await QuizProgress.findOne({
      where: { studentId, quizId }
    });

    const formattedAnswers = Array.isArray(answers)
      ? answers.map(ans => ({
          questionId: ans.questionId, // Use the full questionId sent by frontend (subcategory_index)
          selectedOption: ans.selectedOption ?? null
        }))
      : [];

    if (!progress) {
      progress = await QuizProgress.create({
        studentId,
        quizId,
        currentQuestionIndex: typeof currentQuestionIndex === "number" ? currentQuestionIndex : 0,
        answers: formattedAnswers,
        timeLeft: Math.max(0, timeLeft)
      });
    } else {
      if (typeof currentQuestionIndex === "number") {
        progress.currentQuestionIndex = currentQuestionIndex;
      }
      progress.answers = formattedAnswers;
      progress.timeLeft = Math.max(0, timeLeft);
      await progress.save();
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
    console.error("Save progress error:", err);
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

    const quiz = await QuizConfig.create({
      title,
      category,
      timeLimit,
      selections,
      facultyId,
      createdBy: facultyId
    });

    console.log("✅ QuizConfig created successfully:", quiz.id || quiz);

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
