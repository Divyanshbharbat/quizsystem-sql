import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import Faculty from "../models/Faculty.js";
import Quiz from "../models/Quiz.js";
import QuizConfig from "../models/QuizConfig.js";

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || "divyansh", {
    expiresIn: "30d",
  });
};

// ========================= GET FACULTY QUIZZES =========================
export const getFacultyQuizzes = async (req, res) => {
  try {
    const { facultyId } = req.params;
    if (!facultyId) {
      return res.status(400).json({ success: false, message: "Faculty ID required" });
    }

    const quizzes = await Quiz.findAll({
      where: { createdBy: facultyId },
      order: [["createdAt", "DESC"]],
    });

    res.json({ success: true, data: quizzes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ========================= REGISTER FACULTY =========================
export const registerFaculty = async (req, res) => {
  try {
    const { name, email, department, phone, isAdmin, subjects, session, semester } = req.body;

    if (!name || !email || !department || !phone || !session || !semester) {
      return res.status(400).json({
        success: false,
        message: "Name, email, department, phone, session, and semester are required",
      });
    }

    const sem = semester.trim().toLowerCase();
    if (!["even", "odd"].includes(sem)) {
      return res.status(400).json({ success: false, message: "Semester must be 'even' or 'odd'" });
    }

    // Hash phone as password
    const hashedPassword = await bcrypt.hash(phone, 10);

    const [faculty, created] = await Faculty.findOrCreate({
      where: { email: email.trim().toLowerCase(), session: session.trim(), semester: sem },
      defaults: {
        name: name.trim(),
        department: department.trim(),
        phone: phone.trim(),
        password: hashedPassword,
        isAdmin: isAdmin || false,
        subjects: Array.isArray(subjects) ? subjects : [],
        session: session.trim(),
        semester: sem,
      },
    });

    if (!created) {
      return res.status(400).json({
        success: false,
        message: `Faculty with email '${email}' already exists for session '${session}' and semester '${semester}'`,
      });
    }

    return res.json({
      success: true,
      message: "Faculty registered successfully",
      data: faculty,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

// ========================= LOGIN FACULTY =========================
export const loginFaculty = async (req, res) => {
  try {
    const { email, password, session, semester } = req.body;

    if (!session || !semester) {
      return res.status(400).json({ success: false, message: "Session and semester are required" });
    }

    const sem = semester.trim().toLowerCase();
    if (!["even", "odd"].includes(sem)) {
      return res.status(400).json({ success: false, message: "Semester must be even or odd" });
    }

    const user = await Faculty.findOne({
      where: { email: email.trim().toLowerCase(), session: session.trim(), semester: sem },
    });

    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid credentials for this session/semester" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const token = generateToken(user.id);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000,
    });

    const { password: pwd, ...userData } = user.toJSON();

    res.json({ success: true, message: "Login successful", data: userData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ========================= GET ALL FACULTIES =========================
export const getAllFaculties = async (req, res) => {
  try {
    const faculties = await Faculty.findAll({
      order: [["createdAt", "DESC"]],
    });
    res.status(200).json({ success: true, data: faculties });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

// ========================= UPLOAD FACULTY CSV =========================
export const uploadFacultyCSV = async (req, res) => {
  try {
    const { faculties } = req.body;
    if (!faculties || faculties.length === 0) {
      return res.status(400).json({ success: false, message: "Faculty array is required" });
    }

    const facultiesToInsert = [];

    for (let index = 0; index < faculties.length; index++) {
      const fac = faculties[index];
      if (!fac.session || !fac.session.trim()) {
        return res.status(400).json({ success: false, message: `Session required for faculty #${index + 1}` });
      }

      const sem = fac.semester ? fac.semester.trim().toLowerCase() : "";
      if (!["even", "odd"].includes(sem)) {
        return res.status(400).json({ success: false, message: `Semester must be even or odd for faculty #${index + 1}` });
      }

      const hashedPassword = await bcrypt.hash(fac.password || fac.phone, 10);

      facultiesToInsert.push({
        name: fac.name.trim(),
        email: fac.email.trim().toLowerCase(),
        department: fac.department.trim(),
        phone: fac.phone.trim(),
        password: hashedPassword,
        isAdmin: fac.isAdmin === true,
        subjects: fac.subjects || [],
        session: fac.session.trim(),
        semester: sem,
      });
    }

    const saved = await Faculty.bulkCreate(facultiesToInsert, { ignoreDuplicates: true });

    res.json({ success: true, message: "Faculty uploaded successfully", data: saved });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

// ========================= UPDATE FACULTY =========================
export const updateFaculty = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, department, subjects, isAdmin, session, semester } = req.body;

    const faculty = await Faculty.findByPk(id);
    if (!faculty) return res.status(404).json({ success: false, message: "Faculty not found" });

    await faculty.update({ name, email, department, subjects, isAdmin, session, semester });

    res.status(200).json({ success: true, data: faculty });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// ========================= DELETE FACULTY =========================
export const deleteFaculty = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Faculty.destroy({ where: { id } });

    if (!deleted) return res.status(404).json({ success: false, message: "Faculty not found" });

    res.status(200).json({ success: true, message: "Faculty deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// ========================= UNBLOCK STUDENT =========================
export const unblockStudent = async (req, res) => {
  try {
    const { quizId } = req.params;
    const { studentId } = req.body;

    if (!studentId) return res.status(400).json({ success: false, message: "Student ID required" });

    const quiz = await Quiz.findByPk(quizId);
    if (!quiz) return res.status(404).json({ success: false, message: "Quiz not found" });

    // Remove studentId from blocked array (JSON)
    const blocked = quiz.blocked || [];
    quiz.blocked = blocked.filter((id) => id !== studentId.toString());
    await quiz.save();

    res.json({ success: true, message: "Student unblocked successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ========================= GET BLOCKED STUDENTS =========================
export const getBlockedStudents = async (req, res) => {
  try {
    const facultyId = req.user.id; // Assuming JWT auth stores Sequelize user id in req.user.id

    if (!facultyId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // Fetch all quizzes created by this faculty
    const quizzes = await Quiz.findAll({
      where: { createdBy: facultyId },
    });

    const data = [];

    for (let quiz of quizzes) {
      const blockedStudentsIds = quiz.blocked || []; // JSON array of student IDs

      if (blockedStudentsIds.length > 0) {
        // Fetch student info
        const blockedStudents = await Student.findAll({
          where: { id: blockedStudentsIds },
          attributes: ["id", "name", "email", "studentId", "year"],
        });

        data.push({
          quizId: quiz.id,
          title: quiz.title,
          blockedStudents,
        });
      }
    }

    res.json({ success: true, data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ========================= DELETE FACULTY =========================
// export const deleteFaculty = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const deleted = await Faculty.destroy({
//       where: { id },
//     });

//     if (!deleted) {
//       return res.status(404).json({ success: false, message: "Faculty not found" });
//     }

//     res.status(200).json({ success: true, message: "Faculty deleted successfully" });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ success: false, message: "Server Error" });
//   }
// };
