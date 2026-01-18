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

export {
  sequelize,
  Student,
  Faculty,
  Quiz,
  QuizConfig,
  QuizProgress
};
