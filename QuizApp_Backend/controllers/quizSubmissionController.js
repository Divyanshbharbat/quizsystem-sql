import { request } from "express";
import Quiz from "../models/Quiz.js";
import QuizSubmission from "../models/QuizSubmission.js";
import Student from "../models/Student.js";
import nodemailer from "nodemailer";
import QuizProgress from "../models/QuizProgress.js";
import QuizConfig from "../models/QuizConfig.js";

// ================= SEEDED SHUFFLE (Deterministic) =================
// Ensures same student always gets same question order across sessions
function seededShuffle(array, seed) {
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


export const submitQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;
    const studentId = req.user.id; // from isAuthenticated middleware
    let { answers } = req.body; // [{ questionId, selectedOption, subcategory }]
console.log(`[SUBMIT] Received submission for quiz ${quizId} from student ${studentId}`+answers);
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
    const alreadyCompleted = completed.some(entry => String(entry.studentId) === String(studentId));
    if (alreadyCompleted) {
      return res.status(403).json({ success: false, message: "Quiz already submitted" });
    }

    // 3️⃣ Fetch QuizProgress to get the stored questionMap
    const progress = await QuizProgress.findOne({
      where: { studentId, quizId }
    });

    if (!progress || !progress.questionMap) {
      console.error(`[SUBMIT] ❌ No QuizProgress found or questionMap missing for student ${studentId}, quiz ${quizId}`);
      return res.status(400).json({ 
        success: false, 
        message: "Quiz progress not found. Cannot score quiz that wasn't started." 
      });
    }

    let totalScore = 0;
    const subcategoryScores = {};

    // 🔴 USE THE STORED questionMap instead of rebuilding it!
    const questionMap = progress.questionMap;
    
    console.log(`[SUBMIT] Using stored questionMap with ${Object.keys(questionMap).length} questions from QuizProgress`);
    console.log(`[SUBMIT] Stored Question Map:`, JSON.stringify(questionMap, null, 2));

    // ✅ Score each submitted answer (handle null/unanswered)
    Object.keys(questionMap).forEach(qId => {
      const questionData = questionMap[qId];
      const correctAnswer = questionData.answer;
      const question = questionData.question;
      
      // Extract subcategory from questionId (format: "subcategory_index")
      const subcategoryMatch = qId.match(/^(.+?)_\d+$/);
      const subcategory = subcategoryMatch ? subcategoryMatch[1] : "Unknown";

      if (!subcategoryScores[subcategory]) {
        subcategoryScores[subcategory] = { correct: 0, total: 0 };
      }
      subcategoryScores[subcategory].total++;

      // ✅ FIX: Match answers properly
      const submittedAnswer = answers.find(a => {
        const aQId = a.questionId;
        return aQId === qId;
      });
      
      const selectedOption = submittedAnswer?.selectedOption ?? null;

      // 🔴 DEBUG: Show exact comparison
      console.log(`[SUBMIT] ======================================`);
      console.log(`[SUBMIT] Q ID: "${qId}"`);
      console.log(`[SUBMIT] Subcategory: "${subcategory}"`);
      console.log(`[SUBMIT] Question: "${question}"`);
      console.log(`[SUBMIT] Expected Answer: "${correctAnswer}"`);
      console.log(`[SUBMIT] Student Selected: "${selectedOption}"`);
      console.log(`[SUBMIT] Match: ${selectedOption === correctAnswer}`);
      
      // Show character-by-character if they don't match
      if (selectedOption !== correctAnswer) {
        console.log(`[SUBMIT]   Expected bytes: [${correctAnswer?.split('').map(c => c.charCodeAt(0)).join(', ')}]`);
        console.log(`[SUBMIT]   Got bytes:      [${selectedOption?.split('').map(c => c.charCodeAt(0)).join(', ')}]`);
      }

      if (selectedOption && selectedOption.trim() === correctAnswer?.trim()) {
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
    const newSubmission = {
      studentId,
      student: studentId,
      score: totalScore,
      subcategoryScores: formattedScores,
      submittedAt: new Date()
    };

    console.log(`[SUBMIT] Creating new submission entry:`, JSON.stringify(newSubmission, null, 2));
    completed.push(newSubmission);

    console.log(`[SUBMIT] Completed array BEFORE update:`, JSON.stringify(completed, null, 2));

    // 🔴 FIX: Use .update() instead of .save() for JSON field changes
    try {
      await QuizConfig.update(
        { completed: completed },  // Use .update() method instead of .save()
        { where: { id: quizId } }
      );
      console.log(`[SUBMIT] ✅ Database UPDATE executed successfully`);
    } catch (updateError) {
      console.error(`[SUBMIT] ❌ UPDATE FAILED! Error:`, updateError.message);
      console.error(`[SUBMIT] Full error:`, updateError);
      throw updateError;
    }

    console.log(`[SUBMIT] Quiz marked as completed for student ${studentId}`);

    // 5️⃣ Delete progress
    await QuizProgress.destroy({ where: { studentId, quizId } });
    console.log(`[SUBMIT] Progress deleted for student ${studentId}`);

    return res.json({
      success: true,
      message: "Quiz submitted successfully",
      totalScore,
      totalQuestions: Object.keys(questionMap).length,
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
