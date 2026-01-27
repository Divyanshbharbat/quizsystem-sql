import Student from "../models/Student.js";
import Faculty from "../models/Faculty.js";
import QuizConfig from "../models/QuizConfig.js";
import QuizProgress from "../models/QuizProgress.js";
import Quiz from "../models/Quiz.js";

import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { transporter } from "./mailer.js"; // nodemailer transporter
import { Op } from "sequelize";
// ---------------- GENERATE JWT TOKEN ----------------
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      name: user.name,
      studentId: user.studentId,
      department: user.department,
    },
    process.env.JWT_SECRET || "divyansh",
    { expiresIn: "30d" }
  );
};

// ---------------- REGISTER STUDENT ----------------
export const registerStudent = async (req, res) => {
  const { name, studentId, department, year, email, phone } = req.body;

  try {
    // ✅ Check for duplicate email
    const emailExists = await Student.findOne({
      where: { email },
    });

    if (emailExists) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
        errorField: "email", // Specific field indicator
      });
    }

    // ✅ Check for duplicate studentId
    const studentIdExists = await Student.findOne({
      where: { studentId },
    });

    if (studentIdExists) {
      return res.status(400).json({
        success: false,
        message: "Student ID already exists",
        errorField: "studentId",
      });
    }

    // ✅ Check for duplicate phone (if provided)
    if (phone) {
      const phoneExists = await Student.findOne({
        where: { phone },
      });

      if (phoneExists) {
        return res.status(400).json({
          success: false,
          message: "Phone number already registered",
          errorField: "phone",
        });
      }
    }

// ✅ Hash password for secure storage and keep plain text for admin view
    // Use studentId as default password if none provided, otherwise use email as default
    const passwordToHash = studentId; // ✅ DEFAULT PASSWORD = STUDENT ID
    const hashedPassword = await bcrypt.hash(passwordToHash, 10);
    
    const student = await Student.create({
      name,
      studentId,
      department,
      year,
      email,
      phone,
      password: hashedPassword,  // ✅ Hash for login security (hashed studentId)
      plainPassword: passwordToHash,  // ✅ Plain text for admin view (studentId) - STUDENTS LOGIN WITH THIS
    });

    const studentData = student.toJSON();
    delete studentData.password;
    delete studentData.plainPassword;

    res.status(201).json({
      success: true,
      message: "Student registered successfully",
      data: studentData,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};


// ---------------- LOGIN STUDENT ----------------
export const loginStudent = async (req, res) => {
  const { uid, password, quizId } = req.body;
  console.log("=== LOGIN ATTEMPT ===");
  console.log("UID entered:", uid);
  console.log("UID type:", typeof uid);
  console.log("UID length:", uid?.length);
  console.log("UID trimmed:", uid?.trim());
  console.log("QuizId:", quizId);
  
  // ------------------ Validate input ------------------
  if (!uid || !password || !quizId) {
    return res.status(400).json({
      success: false,
      message: "UID, password, and quizId are required",
    });
  }

  try {
    // ✅ DEBUGGING: Fetch ALL students to see what's in database
    const allStudents = await Student.findAll({
      attributes: ["id", "studentId", "name", "email", "plainPassword"]
    });
    console.log("=== ALL STUDENTS IN DATABASE ===");
    allStudents.forEach(s => {
      console.log(`- StudentId: "${s.studentId}" (type: ${typeof s.studentId}, length: ${s.studentId?.length}), Name: ${s.name}`);
    });
    
    // ------------------ Find student ------------------
    console.log("\n=== SEARCHING FOR STUDENT ===");
    console.log("Looking for studentId:", uid);
    const student = await Student.findOne({ where: { studentId: uid } });
    
    if (!student) {
      console.log("❌ NO STUDENT FOUND with studentId:", uid);
      
      // Try with trimmed version
      const trimmedUid = uid.trim();
      console.log("Trying with trimmed UID:", trimmedUid);
      const studentTrimmed = await Student.findOne({ where: { studentId: trimmedUid } });
      
      if (studentTrimmed) {
        console.log("⚠️ FOUND AFTER TRIM! Issue: UID has leading/trailing whitespace");
        return res.status(401).json({ 
          success: false, 
          message: "Invalid UID (has whitespace). Try: '" + trimmedUid + "'",
          errorField: "uid",
        });
      }
      
      return res.status(401).json({ 
        success: false, 
        message: "Invalid UID. Student not found in database. Available IDs: " + allStudents.map(s => s.studentId).join(", "),
        errorField: "uid",
      });
    }
    
    console.log("✅ STUDENT FOUND:", student.studentId);
    console.log("Password entered by user:", password);
    console.log("Hashed password in DB starts with:", student.password.substring(0, 15));

    // ------------------ Check password ------------------
    const isMatch = await student.matchPassword(password);
    console.log("Password match result:", isMatch);
    
    if (!isMatch) {
      console.log("❌ Password mismatch! Expected password to be: " + student.plainPassword);
      return res.status(401).json({ 
        success: false, 
        message: "Invalid UID or password. Default password is your Student ID (" + student.studentId + ")",
        errorField: "password", // ✅ Specific field
      });
    }
    console.log("✅ Password matched successfully for student:", student.studentId);

    // ------------------ Fetch quiz with Faculty ------------------
    const quiz = await QuizConfig.findByPk(quizId, {
      include: {
        model: Faculty,
        as: "faculty", // must match the association defined in models/index.js
        attributes: ["id", "name", "email", "department"],
      },
    });
console.log("Fetched quiz:", quiz);
    if (!quiz) {
      return res.status(404).json({ success: false, message: "Quiz not found" });
    }

    // ✅ CHECK IF STUDENT IS BLOCKED
    const now = new Date();
    let blocked = Array.isArray(quiz.blocked) ? quiz.blocked : [];
    
    // Remove expired blocks
    blocked = blocked.filter(b => b.expiresAt && new Date(b.expiresAt) > now);
    
    const existingBlock = blocked.find(b => String(b.studentId) === String(student.id));
    if (existingBlock) {
      const remainingSeconds = Math.ceil(
        (new Date(existingBlock.expiresAt) - now) / 1000
      );
      const expiresAt = new Date(existingBlock.expiresAt).getTime();
      
      console.log(`[LOGIN] Student ${student.id} is blocked for ${remainingSeconds} more seconds`);

      return res.status(403).json({
        success: false,
        message: "You are blocked from this quiz. Please wait before retrying.",
        data: {
          quizId,
          blocked: true,
          remainingSeconds,
          expiresAt,
          student: {
            id: student.id,
            name: student.name,
            studentId: student.studentId,
          },
        },
      });
    }

    // ------------------ Check if student already completed ------------------
    const alreadyCompleted = (quiz.completed || []).some(
      (entry) => String(entry.studentId) === String(student.id)
    );

    if (alreadyCompleted) {
      return res.status(403).json({
        success: false,
        message: "You have already submitted this quiz",
        data: { quizId, completed: true },
      });
    }

    // ------------------ Generate token ------------------
    const token = generateToken(student);

    // ------------------ Set cookie ------------------
    res.cookie("studenttoken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      sameSite: "lax",
    });

    // ------------------ Return success ------------------
    res.status(200).json({
      success: true,
      message: "Student logged in successfully",
      data: {
        student: {
          id: student.id,
          name: student.name,
          studentId: student.studentId,
          year: student.year,
          department: student.department,
          email: student.email,
          phone: student.phone,
        },
        quizId,
        completed: false,
        blocked: false,
        faculty: quiz.faculty, // include faculty info if needed
      },
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};

// ---------------- RESULT LOGIN STUDENT ----------------
export const resultLoginStudent = async (req, res) => {
  const { uid, password } = req.body;
  if (!uid || !password)
    return res.status(400).json({ success: false, message: "UID and password required" });

  try {
    const student = await Student.findOne({ where: { studentId: uid } });
    if (!student) return res.status(401).json({ success: false, message: "Invalid UID or password" });

    const isMatch = await bcrypt.compare(password, student.password);
    if (!isMatch) return res.status(401).json({ success: false, message: "Invalid UID or password" });

    const token = generateToken(student);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 30 * 24 * 60 * 60 * 1000,
      sameSite: "lax",
    });

    const studentData = student.toJSON();
    delete studentData.password;

    res.status(200).json({
      success: true,
      message: "Student logged in successfully for result view",
      data: studentData,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

// ---------------- FORGOT PASSWORD ----------------
export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email required" });

  try {
    let user = await Student.findOne({ where: { email } });
    let userType = "student";

    if (!user) {
      user = await Faculty.findOne({ where: { email } });
      userType = "faculty";
    }

    if (!user) return res.status(400).json({ message: "Email not registered" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 min

    user.resetPasswordToken = otp;
    user.resetPasswordExpires = otpExpiry;
    await user.save();

    await transporter.sendMail({
      from: `"Quiz System" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Password Reset OTP",
      text: `Your OTP is ${otp}. Valid for 15 minutes.`,
    });

    res.json({ success: true, message: `OTP sent to ${userType} email` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ---------------- VERIFY OTP ----------------
export const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  try {
    let user = await Student.findOne({
      where: {
        email,
        resetPasswordToken: otp,
        resetPasswordExpires: { [Op.gt]: new Date() },
      },
    });

    if (!user) {
      user = await Faculty.findOne({
        where: {
          email,
          resetPasswordToken: otp,
          resetPasswordExpires: { [Op.gt]: new Date() },
        },
      });
    }

    if (!user) return res.status(400).json({ message: "Invalid or expired OTP" });

    res.json({ success: true, message: "OTP verified", token: otp });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ---------------- RESET PASSWORD ----------------
export const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;
  if (!token || !password) return res.status(400).json({ message: "Token and password required" });

  try {
    let user = await Student.findOne({
      where: { resetPasswordToken: token, resetPasswordExpires: { [Op.gt]: new Date() } },
    });

    if (!user) {
      user = await Faculty.findOne({
        where: { resetPasswordToken: token, resetPasswordExpires: { [Op.gt]: new Date() } },
      });
    }

    if (!user) return res.status(400).json({ message: "Invalid or expired token" });

    console.log("[RESET_PASSWORD] Hashing password before update...");
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("[RESET_PASSWORD] Password hashed, hash starts with:", hashedPassword.substring(0, 10));
    
    // ✅ Directly set hashed password (controller handles hashing, not the model)
    user.password = hashedPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;

    await user.save();
    
    console.log("[RESET_PASSWORD] Password saved to database");
    console.log("[RESET_PASSWORD] Password field now starts with:", user.password.substring(0, 10));

    res.json({ success: true, message: "Password reset successful" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
//here

// ---------------- GET STUDENTS BY YEAR & DEPT ----------------
export const getYearDeptStudents = async (req, res) => {
  try {
    const { year, department } = req.query;

    const where = {};
    if (year) where.year = year;
    // Only filter by department if it's not the wildcard
    if (department && department !== "*") {
      where.department = department;
    }

    const students = await Student.findAll({ 
      where,
      attributes: { exclude: ["password"] }
    });

    if (students.length === 0)
      return res.json({ success: false, message: "No students found" });

    res.json({ success: true, message: "Students retrieved successfully", data: students });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

// ---------------- UPLOAD STUDENTS CSV ----------------
export const uploadStudentsCSV = async (req, res) => {
  try {
    const { csvData } = req.body;
    if (!csvData) return res.status(400).json({ success: false, message: "CSV data is required" });

    const parsed = Papa.parse(csvData, { header: true, skipEmptyLines: true });
    if (parsed.errors.length > 0)
      return res.status(400).json({ success: false, message: "CSV parsing error", errors: parsed.errors });

    const validStudents = parsed.data.filter(
      (s) => s.name && s.studentId && s.email && s.password && s.department && s.year
    );

    if (validStudents.length === 0)
      return res.status(400).json({ success: false, message: "No valid student data found" });

    const studentsToInsert = await Promise.all(
      validStudents.map(async (stu) => ({
        name: stu.name.trim(),
        studentId: stu.studentId.trim(),
        department: stu.department.trim(),
        year: Number(stu.year),
        email: stu.email.trim(),
        password: await bcrypt.hash(stu.password, 10),
        plainPassword: stu.studentId.trim(),  // ✅ Set plainPassword for admin view
        phone: stu.phone ? stu.phone.trim() : "0000000000",
      }))
    );

    const saved = await Student.bulkCreate(studentsToInsert, { ignoreDuplicates: true });

    res.json({ success: true, message: "Students uploaded successfully", data: saved });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

// ---------------- UPDATE STUDENT ----------------
export const updateStudent = async (req, res) => {
  try {
    const { name, studentId, department, year, email, phone, password } = req.body;

    const student = await Student.findByPk(req.params.studentId);
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });

    // ✅ Check for duplicate email (if email is being changed)
    if (email && email !== student.email) {
      const emailExists = await Student.findOne({
        where: { email, id: { [Op.ne]: student.id } },
      });
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: "Email already registered",
          errorField: "email",
        });
      }
    }

    // ✅ Check for duplicate phone (if phone is being changed)
    if (phone && phone !== student.phone) {
      const phoneExists = await Student.findOne({
        where: { phone, id: { [Op.ne]: student.id } },
      });
      if (phoneExists) {
        return res.status(400).json({
          success: false,
          message: "Phone number already registered",
          errorField: "phone",
        });
      }
    }

    // ✅ Check for duplicate studentId (if studentId is being changed)
    if (studentId && studentId !== student.studentId) {
      const studentIdExists = await Student.findOne({
        where: { studentId, id: { [Op.ne]: student.id } },
      });
      if (studentIdExists) {
        return res.status(400).json({
          success: false,
          message: "Student ID already exists",
          errorField: "studentId",
        });
      }
    }

    const updateData = {
      name: name || student.name,
      studentId: studentId || student.studentId,
      department: department || student.department,
      year: year || student.year,
      email: email || student.email,
      phone: phone || student.phone,
    };

    // ✅ Hash password for secure storage, but also keep plain text for admin view
    if (password) {
      updateData.password = await bcrypt.hash(password.trim(), 10);
      updateData.plainPassword = password.trim();
    }

    await student.update(updateData);

    // ✅ Clear all workers/background tasks
    if (global.gc) global.gc();
    if (global._workers) {
      Object.values(global._workers).forEach(w => {
        try { w.terminate?.(); } catch (e) {}
      });
      global._workers = {};
    }

    const data = student.toJSON();
    delete data.password;
    res.json({ success: true, message: "Student updated successfully", data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

// ---------------- DELETE STUDENT ----------------
export const deleteStudent = async (req, res) => {
  try {
    // Support both :id and :studentId parameter names
    const id = req.params.id || req.params.studentId;

    if (!id) {
      return res.status(400).json({ success: false, message: "Student ID is required" });
    }

    const student = await Student.findByPk(id);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    // Remove student from completed arrays in all quizzes
    const quizzes = await QuizConfig.findAll();
    for (const quiz of quizzes) {
      if (quiz.completed && Array.isArray(quiz.completed)) {
        quiz.completed = quiz.completed.filter(sub => sub.student !== student.name && sub.studentId !== id);
        await quiz.save();
      }
    }

    // Delete associated quiz progress
    await QuizProgress.destroy({ where: { studentId: id } });

    // Delete the student
    const deleted = await Student.destroy({ where: { id } });

    // ✅ Clear all workers/background tasks
    if (global.gc) global.gc();
    if (global._workers) {
      Object.values(global._workers).forEach(w => {
        try { w.terminate?.(); } catch (e) {}
      });
      global._workers = {};
    }

    res.json({ success: true, message: "Student deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

// ============ ADMIN ONLY: UPDATE STUDENT PASSWORD ============
export const updateStudentPassword = async (req, res) => {
  try {
    const { password } = req.body;
    
    if (!password || password.trim() === "") {
      return res.status(400).json({ success: false, message: "Password is required" });
    }

    const student = await Student.findByPk(req.params.studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    // ✅ Hash password for secure storage
    console.log("[UPDATE_STUDENT_PASSWORD] Hashing password before update...");
    const hashedPassword = await bcrypt.hash(password.trim(), 10);
    
    // ✅ Store both hashed (for login) and plain text (for admin view)
    await student.update({ 
      password: hashedPassword,
      plainPassword: password.trim()
    });
    
    console.log("[UPDATE_STUDENT_PASSWORD] Password updated in database for student:", req.params.studentId);

    // ✅ Clear all workers/background tasks
    if (global.gc) global.gc();
    if (global._workers) {
      Object.values(global._workers).forEach(w => {
        try { w.terminate?.(); } catch (e) {}
      });
      global._workers = {};
    }

    const data = student.toJSON();
    data.password = data.plainPassword; // Show plain text to admin
    res.json({ success: true, message: "Student password updated successfully", data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

// ============ ADMIN ONLY: GET STUDENT WITH PASSWORD ============
export const getStudentWithPassword = async (req, res) => {
  try {
    const student = await Student.findByPk(req.params.studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    // ✅ Return data with plain password for admin view
    const data = student.toJSON();
    // ✅ Map plainPassword to password field for consistent frontend handling
    data.password = data.plainPassword || data.studentId || ""; // Fallback to studentId if plainPassword is null
    console.log(`[GET_STUDENT_PASSWORD] Returning student ${student.id} with password: ${data.password}`);
    res.json({ success: true, data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

// ============ STUDENT SELF-SERVICE: CHANGE OWN PASSWORD ============
export const changeStudentPassword = async (req, res) => {
  try {
    const { studentId, oldPassword, newPassword } = req.body;
    
    if (!studentId || !oldPassword || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        message: "Student ID, old password, and new password are required" 
      });
    }

    const student = await Student.findByPk(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    // Verify old password
    console.log("[CHANGE_PASSWORD] Verifying old password for student:", studentId);
    const isPasswordValid = await bcrypt.compare(oldPassword, student.password);
    if (!isPasswordValid) {
      console.log("[CHANGE_PASSWORD] Old password verification FAILED");
      return res.status(401).json({ success: false, message: "wrong_password" });
    }

    console.log("[CHANGE_PASSWORD] Old password verified successfully, hashing new password...");
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    console.log("[CHANGE_PASSWORD] New password hashed, hash starts with:", hashedPassword.substring(0, 10));
    
    await student.update({ password: hashedPassword });
    
    console.log("[CHANGE_PASSWORD] Password updated in database for student:", studentId);
    console.log("[CHANGE_PASSWORD] Verifying - password field now starts with:", student.password.substring(0, 10));

    // ✅ Clear all workers/background tasks
    if (global.gc) global.gc();
    if (global._workers) {
      Object.values(global._workers).forEach(w => {
        try { w.terminate?.(); } catch (e) {}
      });
      global._workers = {};
    }

    const data = student.toJSON();
    delete data.password;
    res.json({ success: true, message: "Password changed successfully", data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

// ---------------- GET STUDENT BY STUDENT ID ----------------
export const getStudentByStudentID = async (req, res) => {
  try {
    const student = await Student.findOne({
      where: { studentId: req.params.id },
      attributes: { exclude: ["password"] },
    });
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });

    res.json({ success: true, message: "Student fetched successfully", data: student });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

// ---------------- GET LOGGED-IN STUDENT ----------------
export const getStudentMe = async (req, res) => {
  try {
    const token = req.cookies?.studenttoken;
    console.log("getbyme token:", token);
    if (!token) return res.status(401).json({ success: false, message: "No token provided" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "divyansh");

    const student = await Student.findByPk(decoded.id, { attributes: { exclude: ["password"] } });
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });

    res.json({ success: true, student, tokenData: decoded });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

// ---------------- GET STUDENT BY NAME ----------------
export const getStudentByName = async (req, res) => {
  try {
    const { name } = req.query;
    if (!name) return res.status(400).json({ success: false, message: "Name is required" });

    const student = await Student.findOne({ where: { name } });
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });

    res.json({ success: true, data: { department: student.department, year: student.year } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

// ---------------- GET STUDENT QUIZZES ----------------
export const getStudentQuizzes = async (req, res) => {
  try {
    const { studentId } = req.params;

    console.log(`[GET_QUIZZES] Fetching quizzes for student ID: ${studentId}`);

    // Get all QuizConfigs and filter by student's completed submissions
    const allQuizConfigs = await QuizConfig.findAll();

    const studentResults = [];

    allQuizConfigs.forEach((quizConfig) => {
      const completed = quizConfig.completed || [];
      
      // ✅ FIX: Check both c.studentId.id (database ID) and c.studentId (string ID)
      const studentSubmission = completed.find((c) => {
        // Handle nested studentId object structure (id, name, studentId, etc.)
        if (c.studentId && typeof c.studentId === 'object') {
          return String(c.studentId.id) === String(studentId);
        }
        // Handle simple string/number studentId
        return String(c.student) === String(studentId) || String(c.studentId) === String(studentId);
      });

      if (studentSubmission) {
        console.log(`[GET_QUIZZES] Found submission for quiz ${quizConfig.id}`);
        
        const totalQuestions = studentSubmission.subcategoryScores?.reduce((acc, s) => acc + s.totalQuestions, 0) || 0;
        const totalScore = studentSubmission.score || 0;
        const percentage = totalQuestions > 0 ? Math.round((totalScore / totalQuestions) * 100) : 0;

        studentResults.push({
          quizId: quizConfig.id,
          quizTitle: quizConfig.title,
          category: quizConfig.category,
          timeLimit: quizConfig.timeLimit,
          score: totalScore,
          totalQuestions,
          percentage,
          subcategoryScores: studentSubmission.subcategoryScores || [],
          submittedAt: studentSubmission.submittedAt,
        });
      } else {
        console.log(`[GET_QUIZZES] No submission found for quiz ${quizConfig.id}`);
      }
    });

    // Sort by submission date (newest first)
    studentResults.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
    
    console.log(`[GET_QUIZZES] Total quizzes found for student ${studentId}: ${studentResults.length}`);
    console.log("Student quizzes fetched:", studentResults);

    res.json({
      success: true,
      data: studentResults,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

// ================  MORE FUNCTIONS ================

// ---------------- GET QUIZ RESULT ----------------
export const getQuizResult = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { studentId, quizId } = req.query;

    // Fetch the quiz config
    const quiz = await QuizConfig.findByPk(quizId);
    if (!quiz) return res.status(404).json({ success: false, message: "Quiz not found" });

    // Find the submission in the completed array
    if (!quiz.completed || !Array.isArray(quiz.completed)) {
      return res.status(404).json({ success: false, message: "No submissions found" });
    }

    // ✅ FIX: Handle nested studentId object structure
    const submission = quiz.completed.find(sub => {
      if (sub.studentId && typeof sub.studentId === 'object') {
        return String(sub.studentId.id) === String(studentId);
      }
      return sub.studentId === parseInt(studentId) || (sub.id && sub.id === submissionId);
    });
    
    if (!submission) {
      return res.status(404).json({ success: false, message: "Submission not found" });
    }

    res.json({
      success: true,
      data: {
        quiz: { title: quiz.title, id: quiz.id },
        score: submission.score,
        totalMarks: submission.totalMarks || 100,
        percentage: submission.percentage,
        subcategoryScores: submission.subcategoryScores,
        submittedAt: submission.submittedAt,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

// ---------------- GET STUDENT SUBMISSIONS ----------------
export const getStudentSubmissions = async (req, res) => {
  try {
    const { id } = req.params;

    const student = await Student.findByPk(id);
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });

    // ✅ Fetch all quiz configs and get submissions from the completed array
    const quizzes = await QuizConfig.findAll();
    const submissions = [];

    quizzes.forEach(quiz => {
      if (quiz.completed && Array.isArray(quiz.completed)) {
        // ✅ FIX: Handle nested studentId object structure
        const studentSubmissions = quiz.completed.filter(sub => {
          if (sub.studentId && typeof sub.studentId === 'object') {
            return String(sub.studentId.id) === String(id);
          }
          return String(sub.studentId) === String(id) || 
                 String(sub.student) === String(id) ||
                 sub.student === student.name;
        });
        
        studentSubmissions.forEach(sub => {
          submissions.push({
            id: sub.id || Math.random(),
            studentId: id,
            quizId: quiz.id,
            quiz: {
              id: quiz.id,
              title: quiz.title,
              totalMarks: 100,
              createdAt: quiz.createdAt,
            },
            ...sub,
          });
        });
      }
    });

    // Sort by submission date (most recent first)
    submissions.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

    res.json({ success: true, count: submissions.length, submissions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

// ============ BULK PROMOTE STUDENTS TO NEXT YEAR ============
export const promoteStudentsToNextYear = async (req, res) => {
  try {
    const { currentYear, department, excludeStudentIds } = req.body;

    if (!currentYear || !department) {
      return res.status(400).json({ 
        success: false, 
        message: "Current year and department are required" 
      });
    }

    // Find students in current year and department (excluding failed/exempted ones)
    const studentsToPromote = await Student.findAll({
      where: {
        year: currentYear,
        department: department,
        id: {
          [Op.notIn]: excludeStudentIds || []
        }
      }
    });

    if (studentsToPromote.length === 0) {
      return res.json({ 
        success: true, 
        message: "No students to promote",
        promoted: 0,
        data: []
      });
    }

    // Update all students: increment year and update studentId with new pattern
    const promotedStudents = [];
    
    for (const student of studentsToPromote) {
      // Extract year from studentId and increment it
      // Example: 23CS001 -> 24CS002 (assuming year in first 2 digits, dept in next 2, then roll)
      const rollMatch = student.studentId.match(/(\d{2})([A-Z]+)(\d+)/);
      
      let newStudentId = student.studentId;
      if (rollMatch) {
        const year = parseInt(rollMatch[1]) + 1;
        const dept = rollMatch[2];
        const roll = parseInt(rollMatch[3]);
        // Keep the same roll number, just increment year
        newStudentId = `${year.toString().padStart(2, '0')}${dept}${roll.toString().padStart(3, '0')}`;
      }

      // Update student
      await student.update({
        year: currentYear + 1,
        studentId: newStudentId,
        password: newStudentId // Reset password to new studentId
      });

      promotedStudents.push({
        id: student.id,
        oldStudentId: student.studentId,
        newStudentId: newStudentId,
        name: student.name
      });
    }

    // ✅ Clear all workers/background tasks
    if (global.gc) global.gc();
    if (global._workers) {
      Object.values(global._workers).forEach(w => {
        try { w.terminate?.(); } catch (e) {}
      });
      global._workers = {};
    }

    res.json({ 
      success: true, 
      message: `${promotedStudents.length} students promoted to next year`,
      promoted: promotedStudents.length,
      data: promotedStudents
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};