import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const QuizConfig = sequelize.define(
  "QuizConfig",
  {
    // ================= PRIMARY KEY =================
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false
    },

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
      defaultValue: [], // ✅ Ensure it defaults to empty array, never null
      get() {
        // ✅ Ensure blocked is always an array, never null
        const value = this.getDataValue('blocked');
        // Handle all possible formats
        if (!value) return [];
        if (Array.isArray(value)) return value;
        if (typeof value === 'string') {
          try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed : [];
          } catch (e) {
            console.warn('[QuizConfig] Could not parse blocked JSON:', value);
            return [];
          }
        }
        return [];
      },
      set(value) {
        // ✅ Always ensure we store as JSON string
        if (!value) {
          this.setDataValue('blocked', JSON.stringify([]));
        } else if (Array.isArray(value)) {
          this.setDataValue('blocked', JSON.stringify(value));
        } else if (typeof value === 'string') {
          // Already a string, but validate it's valid JSON
          try {
            JSON.parse(value);
            this.setDataValue('blocked', value);
          } catch (e) {
            this.setDataValue('blocked', JSON.stringify([]));
          }
        } else {
          this.setDataValue('blocked', JSON.stringify([]));
        }
      }
      /*
        [
          {
            studentId: Number,
            expiresAt: String (ISO date)
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
