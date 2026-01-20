import jwt from "jsonwebtoken";
import Student from "../models/Student.js";

export const isAuthenticated = async (req, res, next) => {
  try {
    let token;

    // 1️⃣ Check Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    // 2️⃣ Fallback to cookie
    if (!token && req.cookies?.studenttoken) {
      token = req.cookies.studenttoken;
    }

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    // 3️⃣ Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "divyansh"
    );

    // 4️⃣ Find student by PRIMARY KEY (MySQL safe)
    const student = await Student.findByPk(decoded.id);

    if (!student) {
      return res.status(401).json({ message: "Student not found" });
    }

    // 5️⃣ Attach student to request (Mongo + MySQL compatibility)
    req.student = student;
    req.user = { id: student.id };

    next();
  } catch (error) {
    console.error("Auth error:", error.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
