import { request } from "express";
import Quiz from "../models/Quiz.js";
import QuizSubmission from "../models/QuizSubmission.js";
import Student from "../models/Student.js";
import nodemailer from "nodemailer";


import QuizProgress from "../models/QuizProgress.js";

// Dynamic category-wise distribution


import QuizConfig from "../models/QuizConfig.js";



export const submitQuiz = async (req, res) => {
  const { quizId } = req.params;
  const studentId = req.user._id.toString();
  const { answers } = req.body; // [{ questionId, answer }, ...]

  try {
    // 1️⃣ Fetch quiz configuration
    const quizConfig = await QuizConfig.findById(quizId);
    if (!quizConfig) {
      return res.status(404).json({ success: false, message: "Quiz not found" });
    }

    // 2️⃣ Check if student already submitted
    const alreadyCompleted = quizConfig.completed.some(
      entry => entry.student.toString() === studentId
    );
    if (alreadyCompleted) {
      return res.status(403).json({ success: false, message: "Quiz already submitted" });
    }

    // 3️⃣ Calculate scores
    let totalScore = 0;
    const subcategoryScores = [];

    for (const selection of quizConfig.selections) {
      const allQuestions = [];

      const quizzes = await Quiz.find({
        "categories.category": quizConfig.category,
        "categories.subcategory": selection.subcategory
      });

      quizzes.forEach(quiz => {
        quiz.categories?.forEach(cat => {
          if (cat.category === quizConfig.category && cat.subcategory === selection.subcategory) {
            if (Array.isArray(cat.questions)) allQuestions.push(...cat.questions);
          }
        });
      });

      const answersForSubcategory = answers.filter(a =>
        allQuestions.some(q => q._id.toString() === a.questionId)
      );

      let subScore = 0;
      answersForSubcategory.forEach(a => {
        const question = allQuestions.find(q => q._id.toString() === a.questionId);
        if (question && question.answer === a.answer) subScore++;
      });

      totalScore += subScore;

      subcategoryScores.push({
        subcategory: selection.subcategory,
        score: subScore,
        totalQuestions: selection.questionCount,
        percentage: selection.questionCount > 0 ? (subScore / selection.questionCount) * 100 : 0,
      });
    }

    // 4️⃣ Update QuizConfig.completed
    quizConfig.completed.push({
      student: studentId,
      score: totalScore,
      subcategoryScores,
      submittedAt: new Date()
    });
    await quizConfig.save();

    // 5️⃣ Delete QuizProgress (no longer needed)
    await QuizProgress.deleteOne({ student: studentId, quiz: quizId });

    res.json({
      success: true,
      message: "Quiz submitted successfully",
      totalScore,
      subcategoryScores
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
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
