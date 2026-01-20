import QuizConfig from "../models/QuizConfig.js";

export const checkStudentBlock = async (req, res, next) => {
  const { quizId } = req.params;
  const studentId = req.student?.id; // Sequelize primary key

  if (!quizId || !studentId) return next();

  try {
    const quizConfig = await QuizConfig.findByPk(quizId, {
      attributes: ["blocked"],
    });

    if (!quizConfig || !Array.isArray(quizConfig.blocked) || !quizConfig.blocked.length) {
      return next();
    }

    const now = new Date();

    // ✅ Look for block using correct key
    const blockEntry = quizConfig.blocked.find(
      (b) => b.studentId === studentId
    );

    if (!blockEntry || new Date(blockEntry.expiresAt) <= now) {
      return next(); // Not blocked or block expired
    }

    // Attach block info
    req.blocked = true;
    req.remainingBlockSeconds = Math.ceil(
      (new Date(blockEntry.expiresAt) - now) / 1000
    );

    next();
  } catch (error) {
    console.error("❌ Error checking student block:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

export default checkStudentBlock;
