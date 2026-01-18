import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import logo from "../assets/logo.jpg";
import studentImg from "../assets/stu.png";
import { FiEye, FiEyeOff } from "react-icons/fi";

const Home = () => {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);

  // ===== STRICT MOBILE DETECTION =====
  useEffect(() => {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const mobile = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
      userAgent.toLowerCase()
    );
    setIsMobile(mobile); // true if mobile/tablet
  }, []);

  // ===== ADMIN LOGIN STATES =====
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [session, setSession] = useState("");
  const [semester, setSemester] = useState("odd");
  const [showPassword, setShowPassword] = useState(false);

  const handleAdminSubmit = async (e) => {
    e.preventDefault();

    if (!session.trim()) {
      toast.error("Please enter session (e.g., 2025-2026)");
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_APP}/api/faculty/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: username,
            password,
            session,
            semester,
          }),
          credentials: "include",
        }
      );

      const result = await response.json();

      if (response.ok && result.success) {
        localStorage.setItem("facultyDetails", JSON.stringify(result.data));
        navigate("/create");
      } else {
        toast.error(result.message || "Invalid credentials");
      }
    } catch (error) {
      toast.error("Server error. Please try again.");
    }
  };

  // ================= SHOW MOBILE WARNING =================
  if (isMobile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 text-center p-6">
        <h1 className="text-xl md:text-2xl font-bold text-red-600">
          ⚠️ This website is only accessible on a desktop or laptop.
        </h1>
        <p className="mt-3 text-gray-600">
          Mobile devices, even in desktop mode, are not supported.
          Please open this site on a computer or laptop.
        </p>
      </div>
    );
  }

  // ================= MAIN DESKTOP HOME =================
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center px-4">
      <Toaster />

      {/* Logo */}
      <div className="mb-5">
        <img src={logo} alt="Logo" className="h-20 mx-auto" />
      </div>

      {/* Main Card */}
      <div className="bg-white w-full max-w-4xl rounded-xl shadow-md border border-[#E2E8F0] grid grid-cols-1 md:grid-cols-2 overflow-hidden">

        {/* ================= ADMIN LOGIN ================= */}
        <div className="bg-[#F1F5F9] p-6 border-b md:border-b-0 md:border-r border-[#CBD5E1] flex flex-col justify-center">
          <h2 className="text-xl font-semibold text-[#282828] text-center mb-6">
            Admin Login
          </h2>

          <form onSubmit={handleAdminSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-2.5 border border-[#CBD5E1] rounded-lg focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
                placeholder="admin@college.edu"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-2.5 pr-10 border border-[#CBD5E1] rounded-lg focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
                  placeholder="********"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-3 flex items-center text-slate-500 hover:text-[#2563EB] transition"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Academic Session
              </label>
              <input
                type="text"
                value={session}
                onChange={(e) => setSession(e.target.value)}
                className="w-full p-2.5 border border-[#CBD5E1] rounded-lg focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
                placeholder="2025-2026"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Semester
              </label>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="w-full p-2.5 border border-[#CBD5E1] rounded-lg focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
              >
                <option value="odd">Odd Semester</option>
                <option value="even">Even Semester</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full border-1 border-[#2563EB] text-[#456dff] py-2.5 rounded-lg hover:text-white hover:bg-[#006eff] transition"
            >
              Login as Admin
            </button>
          </form>
        </div>

        {/* ================= STUDENT PORTAL ================= */}
        <div className="p-6 flex flex-col justify-between items-center bg-white">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-[#334155] mb-2">
              Student Portal
            </h2>
            <p className="text-sm text-slate-600">
              Access your academic information
            </p>
          </div>

          <img
            src={studentImg}
            alt="Student"
            className="max-h-56 object-contain my-6"
          />

          <button
            onClick={() => navigate("/student-login")}
            className="w-full border border-[#2563EB] text-[#1E40AF] py-2.5 rounded-lg hover:bg-[#EFF6FF] transition"
          >
            Student Login
          </button>
        </div>
      </div>

      {/* Footer */}
      <p className="mt-5 text-xs text-[#64748B] text-center">
        © 2025 SVPCET | All Rights Reserved
      </p>
    </div>
  );
};

export default Home;
