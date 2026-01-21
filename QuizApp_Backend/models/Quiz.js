import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Quiz = sequelize.define(
  "Quiz",
  {
    categories: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
      validate: {
        answerMustBeInOptions(value) {
          if (!value || !Array.isArray(value)) return;
          value.forEach(cat => {
            if (cat.questions && Array.isArray(cat.questions)) {
              cat.questions.forEach(q => {
                if (q.options && q.answer && !q.options.includes(q.answer)) {
                  throw new Error(
                    `${q.answer} is not present in options!`
                  );
                }
              });
            }
          });
        }
      }
    }
  },
  {
    tableName: "quizzes",
    timestamps: true
  }
);

export default Quiz;
