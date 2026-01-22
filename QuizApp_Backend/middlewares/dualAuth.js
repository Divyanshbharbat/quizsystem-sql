import jwt from "jsonwebtoken";
import Student from "../models/Student.js";
import Faculty from "../models/Faculty.js";

// ✅ Authenticate both students and faculty
export const dualAuth = async (req, res, next) => {
  try {
    let token = null;

    // 1️⃣ Read token from Authorization header
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
    if (!token && req.cookies?.token) {
      token = req.cookies.token;
    }

    // 3️⃣ Token missing
    if (!token) {
      console.error("[dualAuth] No token provided");
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

    console.log("[dualAuth] Decoded token:", { id: decoded.id, email: decoded.email });

    if (!decoded?.id) {
      return res.status(401).json({
        success: false,
        message: "Invalid token payload",
      });
    }

    // 5️⃣ Try to find as student first
    let student = await Student.findByPk(decoded.id);
    if (student) {
      req.student = student;
      req.user = { id: student.id, type: "student" };
      console.log("[dualAuth] ✅ Authenticated as STUDENT:", student.studentId);
      return next();
    }

    // 6️⃣ Try to find as faculty
    let faculty = await Faculty.findByPk(decoded.id);
    if (faculty) {
      req.faculty = faculty;
      req.user = { id: faculty.id, type: "faculty" };
      console.log("[dualAuth] ✅ Authenticated as FACULTY:", faculty.name);
      return next();
    }

    // 7️⃣ User not found
    console.error("[dualAuth] ❌ User not found - ID:", decoded.id);
    return res.status(401).json({
      success: false,
      message: "Student or Faculty not found",
    });

  } catch (error) {
    console.error("[dualAuth] ❌ Auth error:", error.message);
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

export default dualAuth;
