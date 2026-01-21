import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import QuizConfig from "./QuizConfig.js";

const Faculty = sequelize.define(
  "Faculty",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },

    name: {
      type: DataTypes.STRING,
      allowNull: false
    },

    email: {
      type: DataTypes.STRING,
      allowNull: false
    },

    department: {
      type: DataTypes.STRING,
      allowNull: false
    },

    phone: {
      type: DataTypes.STRING,
      allowNull: false
    },

    password: {
      type: DataTypes.STRING,
      allowNull: false
    },

    isAdmin: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },

    session: {
      type: DataTypes.STRING,
      allowNull: false
    },

    semester: {
      type: DataTypes.ENUM("even", "odd"),
      allowNull: false
    },

    subjects: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: []
    },
    
  },
  {
    tableName: "faculties",
    timestamps: true,

    indexes: [
      {
        unique: true,
        fields: ["email", "session", "semester"]
      }
    ]
  }
);

export default Faculty;
