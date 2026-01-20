import jwt from "jsonwebtoken";
import Student from "../models/Student.js";

export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ decoded.id MUST be students.id (PK)
    const student = await Student.findByPk(decoded.id);

    if (!student) {
      return res.status(401).json({ message: "Student not found" });
    }

    // ✅ attach full student instance
    req.student = student;

    next();
  } catch (err) {
    console.error("Auth error:", err.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
