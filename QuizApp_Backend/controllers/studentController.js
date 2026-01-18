import Student from "../models/Student.js";
import Faculty from "../models/Faculty.js";
import QuizConfig from "../models/QuizConfig.js";
import QuizSubmission from "../models/QuizSubmission.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { transporter } from "./mailer.js"; // nodemailer transporter

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
    const studentExists = await Student.findOne({
      where: { [Op.or]: [{ email }, { studentId }] },
    });

    if (studentExists)
      return res.status(400).json({
        success: false,
        message: "Student already registered with this email or studentId",
      });

    // Hash default password as studentId
    const hashedPassword = await bcrypt.hash(studentId, 10);

    const student = await Student.create({
      name,
      studentId,
      department,
      year,
      email,
      phone,
      password: hashedPassword,
    });

    const studentData = student.toJSON();
    delete studentData.password;

    res.status(201).json({
      success: true,
      message: "Student registered successfully",
      data: studentData,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

// ---------------- LOGIN STUDENT ----------------
export const loginStudent = async (req, res) => {
  const { uid, password, quizId } = req.body;
  if (!uid || !password || !quizId)
    return res.status(400).json({ success: false, message: "UID, password, and quizId required" });

  try {
    const student = await Student.findOne({ where: { studentId: uid } });
    if (!student) return res.status(401).json({ success: false, message: "Invalid UID or password" });

    const isMatch = await bcrypt.compare(password, student.password);
    if (!isMatch) return res.status(401).json({ success: false, message: "Invalid UID or password" });

    const quiz = await QuizConfig.findByPk(quizId, { include: Faculty });
    if (!quiz) return res.status(404).json({ success: false, message: "Quiz not found" });

    // Check if student already submitted (stored in QuizSubmission table)
    const alreadyCompleted = await QuizSubmission.findOne({
      where: { quizConfigId: quizId, studentId: student.id },
    });
    if (alreadyCompleted)
      return res.status(403).json({
        success: false,
        message: "You have already submitted this quiz",
        data: { quizId, completed: true },
      });

    const token = generateToken(student);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 30 * 24 * 60 * 60 * 1000,
      sameSite: "lax",
    });

    res.status(200).json({
      success: true,
      message: "Student logged in successfully",
      data: { student, quizId, completed: false },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
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

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;

    await user.save();

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
    if (department) where.department = department;

    const students = await Student.findAll({ where });

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
    const { name, studentId, department, year, email, phone } = req.body;

    const student = await Student.findByPk(req.params.studentId);
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });

    await student.update({
      name: name || student.name,
      studentId: studentId || student.studentId,
      department: department || student.department,
      year: year || student.year,
      email: email || student.email,
      phone: phone || student.phone,
    });

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
    const deleted = await Student.destroy({ where: { id: req.params.id } });
    if (!deleted) return res.status(404).json({ success: false, message: "Student not found" });

    res.json({ success: true, message: "Student deleted successfully" });
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
    const token = req.cookies?.token;
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

    const submissions = await QuizSubmission.findAll({
      where: { studentId },
      include: [{ model: QuizConfig, attributes: ["title", "category", "timeLimit"] }],
      order: [["createdAt", "DESC"]],
    });

    const result = submissions.map((sub) => {
      const totalQuestions = sub.subcategoryScores?.reduce((acc, s) => acc + s.totalQuestions, 0) || 0;
      const totalScore = sub.score || 0;
      const percentage = totalQuestions > 0 ? Math.round((totalScore / totalQuestions) * 100) : 0;

      return {
        quizId: sub.quizConfigId,
        title: sub.QuizConfig.title,
        category: sub.QuizConfig.category,
        timeLimit: sub.QuizConfig.timeLimit,
        submittedAt: sub.submittedAt,
        score: totalScore,
        totalQuestions,
        percentage,
        subcategories: sub.subcategoryScores || [],
      };
    });

    res.json({ success: true, data: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

// ---------------- GET QUIZ RESULT ----------------
export const getQuizResult = async (req, res) => {
  try {
    const { submissionId } = req.params;

    const submission = await QuizSubmission.findByPk(submissionId, {
      include: [{ model: Quiz, attributes: ["title", "categories"] }],
    });
    if (!submission) return res.status(404).json({ success: false, message: "Submission not found" });

    const quiz = submission.Quiz;
    if (!quiz) return res.status(404).json({ success: false, message: "Quiz not found" });

    let score = 0;
    const sections = quiz.categories.map((cat) => {
      let secScore = 0;
      cat.questions.forEach((q) => {
        const ans = submission.answers.find((a) => a.questionId === q.id);
        if (ans) {
          if (ans.selectedOption === "Maybe") secScore += 0.5;
          else if (ans.selectedOption === q.correctAnswer) secScore += 1;
        }
      });
      score += secScore;
      return { name: cat.name, score: secScore, total: cat.questions.length };
    });

    const totalQuestions = quiz.categories.flatMap((c) => c.questions).length;

    res.json({ success: true, data: { quiz: { title: quiz.title }, score, totalQuestions, sections, submittedAt: submission.createdAt } });
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

    const submissions = await QuizSubmission.findAll({
      where: { studentId: id },
      include: [{ model: Quiz, attributes: ["title", "totalMarks", "createdAt"] }],
      order: [["createdAt", "DESC"]],
    });

    res.json({ success: true, count: submissions.length, submissions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};