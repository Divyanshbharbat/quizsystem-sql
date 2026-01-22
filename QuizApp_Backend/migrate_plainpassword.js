import Student from "./models/Student.js";
import sequelize from "./config/db.js";

async function migratePasswords() {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connected");

    // Get all students without plainPassword or with NULL plainPassword
    const students = await Student.findAll({
      where: {
        [sequelize.Sequelize.Op.or]: [
          { plainPassword: null },
          { plainPassword: "" }
        ]
      }
    });

    console.log(`🔍 Found ${students.length} students needing plainPassword update`);

    let updated = 0;
    for (const student of students) {
      await student.update({ plainPassword: student.studentId });
      updated++;
      console.log(`✅ Updated ${student.studentId} - plainPassword set to: ${student.studentId}`);
    }

    console.log(`\n✅ Migration complete! Updated ${updated} students`);
    process.exit(0);
  } catch (err) {
    console.error("❌ Migration failed:", err.message);
    process.exit(1);
  }
}

migratePasswords();
