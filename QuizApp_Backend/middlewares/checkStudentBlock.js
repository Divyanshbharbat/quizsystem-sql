import QuizConfig from "../models/QuizConfig.js";

export const checkStudentBlock = async (req, res, next) => {
  const { quizId } = req.params;
  const studentId = req.user?._id?.toString();
  if (!quizId || !studentId) return next();

  try {
    const quizConfig = await QuizConfig.findById(quizId).select("blocked");
    if (!quizConfig || !quizConfig.blocked?.length) return next();

    const now = new Date();
    const blockEntry = quizConfig.blocked.find(
      b => b.student.toString() === studentId
    );

    if (!blockEntry || blockEntry.expiresAt <= now) {
      return next(); // Not blocked or block expired
    }

    // Attach block info to request
    req.blocked = true;
    req.remainingBlockSeconds = Math.ceil((blockEntry.expiresAt - now) / 1000);

    next();
  } catch (error) {
    console.error("❌ Error checking student block:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export default checkStudentBlock;
