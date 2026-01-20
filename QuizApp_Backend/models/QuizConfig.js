import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const QuizConfig = sequelize.define(
  "QuizConfig",
  {
    // ================= BASIC INFO =================
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },

    timeLimit: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    subject: {
      type: DataTypes.STRING,
      allowNull: true
    },

    session: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "2026-2027"
    },

    category: {
      type: DataTypes.STRING,
      allowNull: false
    },

    // ================= QUIZ STRUCTURE =================
    selections: {
      type: DataTypes.JSON,
      allowNull: false
      /*
        [
          {
            subcategory: String,
            questionCount: Number
          }
        ]
      */
    },

    // ================= CREATED BY =================
    createdBy: {
      // Mongo ObjectId → stored as STRING in MySQL
      type: DataTypes.INTEGER,
      allowNull: false
    },

    // ================= COMPLETED QUIZ DATA =================
    completed: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: []
      /*
        [
          {
            student: String,
            score: Number,
            subcategoryScores: [
              {
                subcategory: String,
                score: Number,
                totalQuestions: Number,
                percentage: Number
              }
            ],
            submittedAt: Date
          }
        ]
      */
    },

    // ================= TIME-BASED BLOCKING =================
    blocked: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: []
      /*
        [
          {
            student: String,
            expiresAt: Date
          }
        ]
      */
    }
  },
  {
    tableName: "quiz_configs",
    timestamps: true
  }
);

export default QuizConfig;
