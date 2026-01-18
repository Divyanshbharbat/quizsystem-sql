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

dotenv.config();

console.log("JWT_SECRET from env:", process.env.JWT_SECRET);

const app = express();

/* =======================
   Middleware
======================= */
app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.json());

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
      isAdmin: false,

      // ✅ REQUIRED FIELDS (ADD THESE)
      session: "2024-25",
      semester: "even"
    }
  });

  if (created) console.log("✅ Default faculty created");
  else console.log("ℹ️ Default faculty already exists");
};


/* =======================
   Database Connection
======================= */
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ MySQL connected");

    await sequelize.sync({ alter: true });
    console.log("✅ All tables synced");

    await seedFaculty();
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
