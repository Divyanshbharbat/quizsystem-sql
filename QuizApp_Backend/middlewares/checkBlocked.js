import QuizConfig from "../models/QuizConfig.js";

/**
 * Middleware to check if student is currently blocked from a quiz
 * If blocked, returns 403 with remaining block time
 * If not blocked, proceeds to next middleware
 */
export const checkStudentBlocked = async (req, res, next) => {
  const { quizId } = req.params;
  const studentId = req.user?.id;

  if (!quizId || !studentId) {
    return next(); // Skip check if required params missing
  }

  try {
    const quizConfig = await QuizConfig.findByPk(quizId);

    if (!quizConfig) {
      return next(); // Quiz not found, let controller handle it
    }

    const now = Date.now();
    let blocked = quizConfig.blocked || [];

    if (!Array.isArray(blocked)) {
      blocked = [];
    }

    // Check if student has an active block
    const activeBlock = blocked.find(b => {
      if (!b || !b.expiresAt) return false;
      const expiry = new Date(b.expiresAt).getTime();
      return expiry > now && Number(b.studentId) === Number(studentId);
    });

    if (activeBlock) {
      const remainingSeconds = Math.ceil(
        (new Date(activeBlock.expiresAt).getTime() - now) / 1000
      );

      console.log(
        `[BLOCK CHECK] Student ${studentId} is BLOCKED for ${remainingSeconds}s`
      );

      return res.status(403).json({
        success: false,
        blocked: true,
        message: `You are blocked from this quiz. Please wait ${remainingSeconds} seconds.`,
        remainingSeconds: Math.max(0, remainingSeconds),
        expiresAt: new Date(activeBlock.expiresAt).getTime(),
      });
    }

    // Student is not blocked, proceed
    next();
  } catch (error) {
    console.error("[BLOCK CHECK] Error:", error);
    next(); // Don't block if there's an error checking
  }
};

export default checkStudentBlocked;
