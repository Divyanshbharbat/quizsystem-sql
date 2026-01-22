import sequelize from "../config/db.js";

// import all models
import Student from "./Student.js";
import Faculty from "./Faculty.js";
import Quiz from "./Quiz.js";
import QuizConfig from "./QuizConfig.js";
import QuizProgress from "./QuizProgress.js";

// define associations here (if any)
// Example:
// QuizConfig.belongsTo(Faculty, { foreignKey: "createdBy" });
QuizConfig.belongsTo(Faculty, { foreignKey: "createdBy", as: "faculty" });
Faculty.hasMany(QuizConfig, { foreignKey: "createdBy", as: "quizzes" });

// Optional: QuizProgress relations
QuizProgress.belongsTo(Student, { foreignKey: "studentId" });
Student.hasMany(QuizProgress, { foreignKey: "studentId" });

// ✅ FIX: QuizProgress references QuizConfig (quiz_configs table), NOT Quiz (quizzes table)
QuizProgress.belongsTo(QuizConfig, { foreignKey: "quizId" });
QuizConfig.hasMany(QuizProgress, { foreignKey: "quizId" });

export {
  sequelize,
  Student,
  Faculty,
  Quiz,
  QuizConfig,
  QuizProgress
};
