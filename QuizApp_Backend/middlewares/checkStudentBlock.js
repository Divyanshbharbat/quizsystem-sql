// middlewares/checkStudentBlock.js
import QuizConfig from "../models/QuizConfig.js";

const checkStudentBlock = async (req, res, next) => {
  const { quizId } = req.params;
  const studentId = req.user?.id;

  try {
    const quizConfig = await QuizConfig.findByPk(quizId);
    if (!quizConfig) return res.status(404).json({ success: false, message: "Quiz not found" });

    const now = new Date();
    let blocked = Array.isArray(quizConfig.blocked) ? quizConfig.blocked : [];
    blocked = blocked.filter(b => b.expiresAt && new Date(b.expiresAt) > now);

    const existing = blocked.find(b => Number(b.student) === Number(studentId));
    if (existing) {
      const remainingSeconds = Math.ceil((new Date(existing.expiresAt) - now) / 1000);
      return res.status(403).json({
        success: false,
        message: `You are blocked from this quiz. Try again in ${remainingSeconds}s.`,
        remainingSeconds
      });
    }

    next();
  } catch (err) {
    console.error("[CHECK BLOCK ERROR]", err);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export default checkStudentBlock;
