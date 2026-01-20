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
  const [blockedCountdown, setBlockedCountdown] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);

  const navigate = useNavigate();

  // Handle countdown for blocked student
  useEffect(() => {
    if (!isBlocked || blockedCountdown <= 0) return;

    const timer = setInterval(() => {
      setBlockedCountdown(prev => {
        const newValue = prev - 1;
        if (newValue <= 0) {
          setIsBlocked(false);
          setError("Block expired. Please try logging in again.");
          clearInterval(timer);
          return 0;
        }
        return newValue;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isBlocked, blockedCountdown]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setIsBlocked(false);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_APP}/api/student/login`,
        { uid, password, quizId },
        { withCredentials: true }
      );
console.log(response.data);
      if (response.data.success) {
        // ✅ Check if student is blocked
        if (response.data.data.blocked && response.data.data.remainingSeconds > 0) {
          setIsBlocked(true);
          setBlockedCountdown(response.data.data.remainingSeconds);
          const expiresAt = response.data.data.expiresAt;
          
          // Store block info in window for Quiz component later
          window._studentBlockInfo = {
            blocked: true,
            remainingSeconds: response.data.data.remainingSeconds,
            expiresAt: expiresAt
          };
          
          setError(`You are blocked from this quiz. Please wait ${response.data.data.remainingSeconds} seconds before retrying.`);
          toast.error(`Block remaining: ${response.data.data.remainingSeconds}s`);
          return;
        }

        localStorage.setItem(
          "studentDetails",
          JSON.stringify(response.data.data)
        );
        navigate(`/quiz/${response.data.data.quizId}`);
      } else {
        // ✅ Handle blocked status in error response
        if (response.data.data?.blocked && response.data.data?.remainingSeconds > 0) {
          setIsBlocked(true);
          setBlockedCountdown(response.data.data.remainingSeconds);
          const expiresAt = response.data.data.expiresAt;
          
          window._studentBlockInfo = {
            blocked: true,
            remainingSeconds: response.data.data.remainingSeconds,
            expiresAt: expiresAt
          };
          
          setError(response.data.message || `Blocked. Retry in ${response.data.data.remainingSeconds}s`);
          toast.error(`Block remaining: ${response.data.data.remainingSeconds}s`);
        } else {
          setError(response.data.message);
        }
      }
    } catch (err) {
      // ✅ Handle blocked status in error response
      const blockData = err.response?.data?.data;
      if (err.response?.status === 403 && blockData?.blocked && blockData?.remainingSeconds > 0) {
        setIsBlocked(true);
        setBlockedCountdown(blockData.remainingSeconds);
        const expiresAt = blockData.expiresAt;
        
        window._studentBlockInfo = {
          blocked: true,
          remainingSeconds: blockData.remainingSeconds,
          expiresAt: expiresAt
        };
        
        setError(err.response?.data?.message || `Blocked. Retry in ${blockData.remainingSeconds}s`);
        toast.error(`Block remaining: ${blockData.remainingSeconds}s`);
      } else {
        setError(err.response?.data?.message || "Server error");
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

            {/* ✅ Block Status Display */}
            {isBlocked && (
              <div className="mb-6 p-4 bg-red-100 border-l-4 border-red-600 rounded">
                <p className="text-red-700 font-semibold">
                  🚫 You are currently blocked
                </p>
                <p className="text-red-600 text-sm mt-2">
                  Time remaining: <span className="font-bold text-lg">{blockedCountdown}s</span>
                </p>
                <p className="text-red-600 text-xs mt-1">
                  Please wait before attempting to login again.
                </p>
              </div>
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
                  disabled={isBlocked}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-gray-200 disabled:cursor-not-allowed"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter Password"
                  required
                  disabled={isBlocked}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-gray-200 disabled:cursor-not-allowed"
                />
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
                  disabled={isBlocked}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-gray-200 disabled:cursor-not-allowed"
                />
              </div>

              {error && (
                <p className={`text-sm text-center ${isBlocked ? 'text-orange-600 font-semibold' : 'text-red-600'}`}>
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading || isBlocked}
                className={`w-full py-3 rounded-lg text-white transition font-semibold ${
                  isBlocked
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {loading ? "Logging in..." : isBlocked ? `Wait ${blockedCountdown}s...` : "Login"}
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
