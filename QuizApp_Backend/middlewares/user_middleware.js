import jwt from "jsonwebtoken";
import Student from "../models/Student.js";

const protect2 = async (req, res, next) => {
  try {
    // Get token from cookies
    const token = req.cookies.token;
  
    if (!token) {
      return res.status(401).json({ message: "Not authorized, no token" });
    }

    // Verify token
    const decoded = jwt.verify(token, "divyansh");

    // Attach student info to req.user
    req.user = await Student.findById(decoded.id).select("-password");
    
    if (!req.user) {
      return res.status(401).json({ message: "User not found" });
    }

    next();
  } catch (error) {
    console.error("Auth error:", error.message);
    res.status(401).json({ message: "Not authorized, token failed" });
  }
};

export default protect2;
