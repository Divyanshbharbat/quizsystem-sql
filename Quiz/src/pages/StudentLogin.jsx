import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.jpg";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";

const StudentLogin = () => {
  const [uid, setUid] = useState("");
  const [password, setPassword] = useState("");
  const [quizId, setQuizId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isBlocked, setIsBlocked] = useState(false);
  const [isAlreadyCompleted, setIsAlreadyCompleted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  // ✅ Check if device is mobile
  useEffect(() => {
    const checkIfMobile = () => {
      // Check user agent for mobile devices
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
      
      // Also check screen width (less than 768px)
      const isSmallScreen = window.innerWidth < 768;
      
      // Set mobile flag
      const mobile = isMobileDevice || isSmallScreen;
      setIsMobile(mobile);
    };

    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  // ✅ If mobile, show message and hide everything
  if (isMobile) {
    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        backgroundColor: "#f3f4f6",
        padding: "20px",
        textAlign: "center",
        fontFamily: "system-ui, -apple-system, sans-serif"
      }}>
        <div style={{
          backgroundColor: "white",
          padding: "40px 20px",
          borderRadius: "12px",
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
          maxWidth: "400px"
        }}>
          <div style={{ fontSize: "48px", marginBottom: "20px" }}>📱</div>
          <h1 style={{ fontSize: "24px", fontWeight: "bold", color: "#1f2937", marginBottom: "12px" }}>
            Mobile Device Detected
          </h1>
          <p style={{ fontSize: "16px", color: "#6b7280", marginBottom: "20px", lineHeight: "1.6" }}>
            This quiz portal is designed for desktop browsers only. 
          </p>
          <p style={{ fontSize: "16px", color: "#6b7280", fontWeight: "bold", marginBottom: "20px" }}>
            Please open this page on a desktop or laptop computer.
          </p>
          <p style={{ fontSize: "12px", color: "#9ca3af" }}>
            If you're using a mobile device with "Desktop Mode", please disable it.
          </p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setIsAlreadyCompleted(false);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_APP}/api/student/login`,
        { uid, password, quizId },
        { withCredentials: true }
      );
      console.log("Login success:", response.data);
      
      if (response.data.success) {
        // ✅ Store student details and navigate to quiz
        localStorage.setItem(
          "studentDetails",
          JSON.stringify(response.data.data)
        );
        navigate(`/quiz/${response.data.data.quizId}`);
      } else {
        setError(response.data.message || "Login failed");
      }
    } catch (err) {
      console.log("Login error:", err.response?.data);
      const errorData = err.response?.data;
      
      // ✅ Check if student already completed quiz
      if (errorData?.data?.completed === true) {
        setIsAlreadyCompleted(true);
        setError("⚠️ You have already submitted this quiz. You cannot retake it.");
        toast.error("You have already completed this quiz");
        return;
      }
      
      // ✅ Check if student is blocked
      if (errorData?.data?.blocked === true) {
        const remainingSeconds = errorData.data.remainingSeconds || 0;
        setIsBlocked(true);
        setError(`You are blocked from this quiz. Please wait ${remainingSeconds} seconds before retrying.`);
        toast.error(`Blocked for ${remainingSeconds} more seconds`);
        return;
      }
      
      // Show specific error messages
      const msg = errorData?.message || "";
      if (msg.includes("Invalid password") || msg.includes("password")) {
        setError("Wrong password");
        toast.error("Wrong password");
      } else if (msg.includes("not found") || msg.includes("No student")) {
        setError("Wrong student ID");
        toast.error("Wrong student ID");
      } else if (msg.includes("quiz") || msg.includes("Quiz")) {
        setError("Wrong quiz ID");
        toast.error("Wrong quiz ID");
      } else {
        setError(msg || "Login failed");
        toast.error(msg || "Login failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Toaster />
      {/* Header */}
      <header className="text-center py-2">
         <div className="">
              <img src={logo} alt="Logo" className="h-20 mx-auto" />
            </div>
        <p className="text-gray-600 mt-4 font-medium">
          Student Examination Portal
        </p>
      </header>

      {/* Main Card */}
      <div className="flex flex-1 items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 overflow-hidden">
          
          {/* Left Section - Student Login */}
          <div className="p-10 bg-gray-50">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Examinee Login
            </h2>

            {/* ✅ Error Message Only */}
            {error && (
              <p className="text-sm text-center text-red-600 font-semibold mb-4">
                {error}
              </p>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* UID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  UID
                </label>
                <input
                  type="text"
                  value={uid}
                  onChange={(e) => setUid(e.target.value)}
                  placeholder="Enter UID"
                  required
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter Password"
                    required
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-600 text-lg"
                  >
                    {showPassword ? "👁️" : "👁️‍🗨️"}
                  </button>
                </div>
                <div className="mt-2 text-right">
                  <button
                    type="button"
                    onClick={() => navigate("/forgot-password")}
                    className="text-sm text-blue-600 hover:text-blue-700 hover:underline transition"
                  >
                    Forgot Password?
                  </button>
                </div>
              </div>

              {/* Quiz ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quiz ID
                </label>
                <input
                  type="text"
                  value={quizId}
                  onChange={(e) => setQuizId(e.target.value)}
                  placeholder="Enter Quiz ID"
                  required
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 rounded-lg text-white transition font-semibold ${
                  loading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {loading ? "Logging in..." : "Login"}
              </button>
            </form>
          </div>

          {/* Right Section - Result */}
          <div className="p-10 flex flex-col items-center justify-center">
            <img
              src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
              alt="Result"
              className="w-56 h-56 object-contain mb-6"
            />
            <button
              onClick={() => navigate("/seeresult")}
              className="px-8 py-3 border border-blue-600 text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition"
            >
              See Result
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-gray-500 text-sm py-4">
        © 2025 SVPCET | All Rights Reserved
      </footer>
    </div>
  );
};

export default StudentLogin;
