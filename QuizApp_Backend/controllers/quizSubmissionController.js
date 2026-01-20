import { request } from "express";
import Quiz from "../models/Quiz.js";
import QuizSubmission from "../models/QuizSubmission.js";
import Student from "../models/Student.js";
import nodemailer from "nodemailer";


import QuizProgress from "../models/QuizProgress.js";

// Dynamic category-wise distribution


import QuizConfig from "../models/QuizConfig.js";


export const submitQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;
    const studentId = req.user.id; // from isAuthenticated middleware
    let { answers } = req.body; // [{ questionId, selectedOption, subcategory }]

    if (!Array.isArray(answers)) answers = [];

    console.log(`[SUBMIT] Student ${studentId} submitting quiz ${quizId}`);
    console.log(`[SUBMIT] Received ${answers.length} answers`);
    console.log(`[SUBMIT] Sample answers:`, answers.slice(0, 3));

    // 1️⃣ Fetch QuizConfig
    const quizConfig = await QuizConfig.findByPk(quizId);
    if (!quizConfig) {
      return res.status(404).json({ success: false, message: "Quiz not found" });
    }

    const completed = quizConfig.completed || [];

    // 2️⃣ Check if student already submitted
    const alreadyCompleted = completed.some(entry => entry.studentId === studentId);
    if (alreadyCompleted) {
      return res.status(403).json({ success: false, message: "Quiz already submitted" });
    }

    // 3️⃣ Fetch Quiz questions
    const quiz = await Quiz.findByPk(quizId);
    if (!quiz) {
      return res.status(404).json({ success: false, message: "Quiz questions not found" });
    }

    let totalScore = 0;
    const subcategoryScores = {};

    // Build question map for quick scoring
    // Format: { "subcategory_index": { answer, subcategory } }
    const questionMap = {};
    const categories = Array.isArray(quiz.categories) ? quiz.categories : [];

    // For each selection in quizConfig, find matching questions
    quizConfig.selections.forEach((selection) => {
      let selectionQuestions = [];
      
      // Find all questions matching this subcategory from all quizzes
      categories.forEach((cat) => {
        if (cat.subcategory === selection.subcategory && Array.isArray(cat.questions)) {
          selectionQuestions.push(...cat.questions);
        }
      });

      // Remove duplicates by question text
      const uniqueQuestions = Array.from(
        new Map(
          selectionQuestions
            .filter((q) => q && q.question && Array.isArray(q.options))
            .map((q) => [q.question, q])
        ).values()
      );

      // Map each question with its ID format (subcategory_index)
      uniqueQuestions.slice(0, selection.questionCount).forEach((q, index) => {
        const questionId = `${selection.subcategory}_${index}`;
        questionMap[questionId] = {
          answer: q.answer,
          subcategory: selection.subcategory
        };
      });
    });

    console.log(`[SUBMIT] Built questionMap with ${Object.keys(questionMap).length} questions`);

    // ✅ Score each submitted answer (handle null/unanswered)
    Object.keys(questionMap).forEach(qId => {
      const { answer: correctAnswer, subcategory } = questionMap[qId];

      if (!subcategoryScores[subcategory]) {
        subcategoryScores[subcategory] = { correct: 0, total: 0 };
      }
      subcategoryScores[subcategory].total++;

      const submittedAnswer = answers.find(a => a.questionId === qId);
      const selectedOption = submittedAnswer?.selectedOption ?? null;

      if (selectedOption === correctAnswer) {
        subcategoryScores[subcategory].correct++;
        totalScore++;
      }
    });

    // Format subcategory scores for storage
    const formattedScores = Object.entries(subcategoryScores).map(([subcategory, scores]) => ({
      subcategory,
      score: scores.correct,
      totalQuestions: scores.total,
      percentage: scores.total > 0 ? (scores.correct / scores.total) * 100 : 0
    }));

    console.log(`[SUBMIT] Total Score: ${totalScore}/${Object.keys(questionMap).length}`);
    console.log(`[SUBMIT] Subcategory Scores:`, formattedScores);

    // 4️⃣ Save submission to QuizConfig.completed (JSON)
    completed.push({
      studentId,
      score: totalScore,
      subcategoryScores: formattedScores,
      submittedAt: new Date()
    });

    quizConfig.completed = completed;
    await quizConfig.save();

    console.log(`[SUBMIT] Quiz marked as completed for student ${studentId}`);

    // 5️⃣ Delete progress
    await QuizProgress.destroy({ where: { studentId, quizId } });
    console.log(`[SUBMIT] Progress deleted for student ${studentId}`);

    return res.json({
      success: true,
      message: "Quiz submitted successfully",
      totalScore,
      subcategoryScores: formattedScores
    });

  } catch (error) {
    console.error("[SUBMIT] Quiz submission error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};








export const getCategoryDistribution = async (req, res) => {
  const { quizId, studentId } = req.params;

  try {
    const quiz = await Quiz.findById(quizId);
    if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });

    const submission = await QuizSubmission.findOne({ quizId, studentId });
    if (!submission) return res.status(404).json({ success: false, message: 'Submission not found' });

    const questionCategoryMap = {};
    const questionOptionsMap = {};

    quiz.categories.forEach(cat => {
      cat.questions.forEach(q => {
        questionCategoryMap[q._id.toString()] = cat.category;
        questionOptionsMap[q._id.toString()] = q.options || [];
      });
    });

    const categoryDistribution = {};

    submission.answers.forEach(answer => {
      const questionId = answer.questionId.toString();
      const category = questionCategoryMap[questionId] || 'Uncategorized';
      const selectedOption = answer.selectedOption;

      if (!categoryDistribution[category]) {
        // initialize dynamic options
        categoryDistribution[category] = {};
        questionOptionsMap[questionId].forEach(opt => {
          categoryDistribution[category][opt] = 0;
        });
      }

      if (categoryDistribution[category][selectedOption] !== undefined) {
        categoryDistribution[category][selectedOption] += 1;
      }
    });

    return res.json({ success: true, data: categoryDistribution });

  } catch (err) {
    console.error('Error getting category distribution:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
