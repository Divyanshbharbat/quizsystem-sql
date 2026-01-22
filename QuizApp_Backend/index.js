import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import bodyParser from "body-parser";
import bcrypt from "bcryptjs";

// ✅ Import sequelize & models from models/index.js
import { sequelize, Faculty } from "./models/index.js";

// Routes
import quizRoutes from "./routes/quiz.js";
import studentRoutes from "./routes/studentRoutes.js";
import facultyRoutes from "./routes/facultyRoutes.js";

// Controllers
import { deleteInactiveProgress } from "./controllers/quizController.js";
import { Student } from "./models/index.js";

dotenv.config();

console.log("JWT_SECRET from env:", process.env.JWT_SECRET);

const app = express();

/* =======================
   Middleware
======================= */
// ✅ INCREASED: Support for image base64 data in requests
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());
app.use(bodyParser.json({ limit: '50mb' }));

/* =======================
   CORS Configuration
======================= */
const allowedOrigins = [
  "http://localhost:5173",
  "https://svpcetquizsystem.netlify.app"
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

/* =======================
   Health Check
======================= */
app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Server is running 🚀"
  });
});

/* =======================
   Routes
======================= */
app.use("/api/faculty", facultyRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/quizzes", quizRoutes);

/* =======================
   Seed Faculty
======================= */
const seedFaculty = async () => {
  const hashedPassword = await bcrypt.hash("9876514816", 10);

  const [faculty, created] = await Faculty.findOrCreate({
    where: { email: "divyansh6669@college.com" },
    defaults: {
      name: "Divyansh",
      department: "CIVIL",
      phone: "9876514816",
      password: hashedPassword,
      plainPassword: "9876514816",  // ✅ Store plain text for admin view
      isAdmin: true,

      // ✅ REQUIRED FIELDS (ADD THESE)
      session: "2024-25",
      semester: "even"
    }
  });

  if (created) console.log("✅ Default faculty created");
  else console.log("ℹ️ Default faculty already exists");
};

/* =======================
   Seed Students
======================= */
const seedStudents = async () => {
  const testStudents = [
    {
      name: "Test Student 1",
      studentId: "STU001",
      department: "CIVIL",
      year: 2,
      email: "student1@svpcet.edu",
      phone: "9876543210"
    },
    {
      name: "Test Student 2",
      studentId: "STU002",
      department: "CIVIL",
      year: 2,
      email: "student2@svpcet.edu",
      phone: "9876543211"
    },
    {
      name: "Test Student 3",
      studentId: "STU003",
      department: "CIVIL",
      year: 2,
      email: "student3@svpcet.edu",
      phone: "9876543212"
    }
  ];

  for (const studentData of testStudents) {
    console.log(`\n=== SEEDING STUDENT: ${studentData.studentId} ===`);
    console.log("Plain password:", studentData.studentId);
    
    const hashedPassword = await bcrypt.hash(studentData.studentId, 10);
    console.log("Hashed password (first 20 chars):", hashedPassword.substring(0, 20));
    console.log("Hash starts with $2:", hashedPassword.startsWith("$2"));
    
    const [student, created] = await Student.findOrCreate({
      where: { email: studentData.email },
      defaults: {
        ...studentData,
        password: hashedPassword,
        plainPassword: studentData.studentId
      }
    });

    if (created) {
      console.log(`✅ Created: ${studentData.studentId}`);
      console.log("Password in DB (first 20 chars):", student.password.substring(0, 20));
      
      // ✅ Verify by comparing immediately
      const testCompare = await bcrypt.compare(studentData.studentId, student.password);
      console.log("Immediate test - bcrypt.compare result:", testCompare);
    } else {
      console.log(`ℹ️ Already exists: ${studentData.studentId}`);
    }
  }
};



/* =======================
   Database Connection
======================= */
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ MySQL connected");

    // ✅ CHANGED: Removed force: true to keep data persistent across restarts
    // This will create tables if they don't exist, but won't delete existing data
    await sequelize.sync();
    console.log("✅ All tables synced (data preserved)");

    await seedFaculty();
    await seedStudents();
  } catch (error) {
    console.error("❌ Database error:", error);
  }
};

connectDB();

/* =======================
   Cleanup Job
======================= */
setInterval(() => {
  deleteInactiveProgress();
}, 5 * 60 * 1000);

/* =======================
   Start Server
======================= */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
