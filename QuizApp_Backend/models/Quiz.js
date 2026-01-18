import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Quiz = sequelize.define(
  "Quiz",
  {
    categories: {
      type: DataTypes.JSON,
      allowNull: false,
      validate: {
        answerMustBeInOptions(value) {
          value.forEach(cat => {
            cat.questions.forEach(q => {
              if (!q.options.includes(q.answer)) {
                throw new Error(
                  `${q.answer} is not present in options!`
                );
              }
            });
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
