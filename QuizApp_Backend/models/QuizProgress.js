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
      type: DataTypes.INTEGER, // FK → students.id
      allowNull: false
    },

    quizId: {
      type: DataTypes.INTEGER, // FK → quizzes.id
      allowNull: false
    },

    currentQuestionIndex: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },

    timeLeft: {
      type: DataTypes.INTEGER, // seconds
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
        fields: ["studentId", "quizId"] // same as MongoDB compound index
      }
    ]
  }
);

export default QuizProgress;
