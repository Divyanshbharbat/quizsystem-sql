import { Sequelize } from "sequelize";

const sequelize = new Sequelize(
  "quiz_system",   // DB name
  "root",          // username
  "divyansh9850364491",      // password
  {
    host: "localhost",
    dialect: "mysql",
    logging: false
  }
);

export default sequelize;
