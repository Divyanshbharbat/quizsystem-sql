import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const QuizProgress = sequelize.define(
  "QuizProgress",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },

    studentId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    quizId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    currentQuestionIndex: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },

    answers: {
      type: DataTypes.JSON, // ✅ REQUIRED
      allowNull: false,
      defaultValue: []
    },

    timeLeft: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    completed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },

    status: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  },
  {
    tableName: "quiz_progress",
    timestamps: true,
    indexes: [
      {
        unique: true,
        name: "uniq_student_quiz", // ✅ IMPORTANT: named index
        fields: ["studentId", "quizId"]
      }
    ]
  }
);

export default QuizProgress;
