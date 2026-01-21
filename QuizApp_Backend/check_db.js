// Quick diagnostic script to check database content
import db from "./config/db.js";
import { Quiz, QuizConfig } from "./models/index.js";

(async () => {
  try {
    await db.authenticate();
    console.log("\n✅ Database connected\n");

    const quizzes = await Quiz.findAll();
    console.log("📋 Found " + quizzes.length + " Quiz documents\n");

    quizzes.forEach((q, idx) => {
      console.log("Quiz " + (idx + 1) + ":");
      if (!q.categories || !Array.isArray(q.categories)) {
        console.log("  ❌ Categories field missing or not array");
        return;
      }
      console.log("  Total categories: " + q.categories.length);
      q.categories.forEach(cat => {
        const qs = cat.questions || [];
        console.log("  - " + cat.category + " / " + cat.subcategory + ": " + qs.length + " questions");
        qs.forEach((q, qidx) => {
          console.log("    Q" + (qidx + 1) + ": type=" + (q.type || "text") + ", image=" + (q.image ? "✅" : "❌") + ", question='" + (q.question ? q.question.substring(0, 20) : "(empty)") + "'");
        });
      });
    });

    const quizConfigs = await QuizConfig.findAll({ attributes: ["id", "selections", "title"] });
    console.log("\n📋 Found " + quizConfigs.length + " QuizConfig documents\n");
    
    quizConfigs.forEach((qc, idx) => {
      console.log("QuizConfig " + (idx + 1) + " - " + qc.title);
      if (qc.selections) {
        console.log("  Selections: " + JSON.stringify(qc.selections, null, 2));
      }
    });

    await db.close();
    process.exit(0);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
})();
