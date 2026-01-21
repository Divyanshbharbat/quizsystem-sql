import { sequelize, Quiz } from "./models/index.js";

const debugQuiz = async () => {
  try {
    console.log("🔍 Connecting to database...");
    await sequelize.authenticate();
    console.log("✅ Connected to database");

    console.log("\n📊 Querying all Quiz documents...");
    const allQuizzes = await Quiz.findAll();
    console.log(`Found ${allQuizzes.length} Quiz document(s)\n`);

    allQuizzes.forEach((quiz, idx) => {
      console.log(`\n=== Quiz #${idx + 1} (ID: ${quiz.id}) ===`);
      console.log("Raw categories field:", JSON.stringify(quiz.categories, null, 2));
      
      if (Array.isArray(quiz.categories)) {
        console.log(`✅ Categories is an array with ${quiz.categories.length} items`);
        quiz.categories.forEach((cat, catIdx) => {
          console.log(`\n  Category ${catIdx + 1}:`);
          console.log(`    - category: "${cat.category}"`);
          console.log(`    - subcategory: "${cat.subcategory}"`);
          console.log(`    - questions count: ${Array.isArray(cat.questions) ? cat.questions.length : 'NOT_AN_ARRAY'}`);
          if (Array.isArray(cat.questions) && cat.questions.length > 0) {
            cat.questions.forEach((q, qIdx) => {
              console.log(`      Question ${qIdx + 1}: ${q.type === 'image' ? '🖼️ Image' : '📝 Text'} - ${q.question || q.image || 'NO_CONTENT'}`);
            });
          }
        });
      } else {
        console.log(`❌ Categories is NOT an array: ${typeof quiz.categories}`);
      }
    });

    if (allQuizzes.length === 0) {
      console.log("\n⚠️ No Quiz documents found in database!");
      console.log("Upload an image-based question first.");
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

debugQuiz();
