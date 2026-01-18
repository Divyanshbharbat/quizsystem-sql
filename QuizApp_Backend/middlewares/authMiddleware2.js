import jwt from "jsonwebtoken";
import Student from "../models/Student.js";

export const isAuthenticated = async (req, res, next) => {
  try {
 
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];
   
    if (!token) {
      return res.status(401).json({ success: false, message: "Not logged in" });
    }

 
   
const decoded = jwt.verify(token, 'divyansh');


const student = await Student.findById(decoded.id); // Pass ID directly


if (!student) {
  return res.status(401).json({ success: false, message: "Student not found" });
}

    req.user = student;

    next();
  } catch (err) {
    console.error(err);
    res.status(401).json({ success: false, message: "Unauthorized" });
  }
};
