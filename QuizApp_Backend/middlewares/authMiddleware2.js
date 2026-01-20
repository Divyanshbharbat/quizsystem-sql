import jwt from "jsonwebtoken";
import Student from "../models/Student.js";

export const isAuthenticated = async (req, res, next) => {
  try {
    let token = null;

    // 1️⃣ Read token from Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    // 2️⃣ Fallback to cookie (optional)
    if (!token && req.cookies?.studenttoken) {
      token = req.cookies.studenttoken;
    }

    // 3️⃣ Token missing
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication token missing",
      });
    }

    // 4️⃣ Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "divyansh"
    );

    // ❗ IMPORTANT: decoded.id MUST be students.id (AUTO INCREMENT PK)
    if (!decoded?.id) {
      return res.status(401).json({
        success: false,
        message: "Invalid token payload",
      });
    }

    // 5️⃣ Fetch student using PRIMARY KEY
    const student = await Student.findByPk(decoded.id);

    if (!student) {
      return res.status(401).json({
        success: false,
        message: "Student not found",
      });
    }

    // 6️⃣ Attach to request (THIS is what controllers should use)
    req.student = student;              // full student object
    req.user = { id: student.id };      // SAFE numeric ID only

    next();
  } catch (error) {
    console.error("Auth error:", error.message);

    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};
