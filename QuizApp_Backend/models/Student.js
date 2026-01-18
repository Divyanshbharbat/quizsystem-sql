// models/User.js
import { Schema, model } from 'mongoose';
import bcrypt from 'bcryptjs';

const StudentSchema = new Schema({
  name: { type: String, required: true },
  studentId: { type: String, required: true, unique: true },
  department: { type: String, required: true },
  year: { type: Number, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },

  // ✅ Add OTP fields
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
}, {
  timestamps: true,
});

// Hash the password before saving the user
StudentSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password for login
StudentSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const Student = model('Student', StudentSchema);
export default Student;
