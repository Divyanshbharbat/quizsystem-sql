// middleware/protect2.js
import jwt from "jsonwebtoken";
import Student from "../models/Student.js";

const protect2 = async (req, res, next) => {
  try {
    // Get token from cookies
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({ message: "Not authorized, no token" });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "divyansh");

    // Find student by primary key (Sequelize)
    const student = await Student.findByPk(decoded.id, {
      attributes: { exclude: ["password"] }, // exclude password
    });

    if (!student) {
      return res.status(401).json({ message: "User not found" });
    }

    // Attach student to request - set both req.user and req.user.id for compatibility
    req.user = student;
    // Ensure req.user.id exists for controllers expecting it
    if (!req.user.id) {
      req.user.id = student.id;
    }

    next();
  } catch (error) {
    console.error("Auth error:", error.message);
    res.status(401).json({ message: "Not authorized, token failed" });
  }
};

export default protect2;
