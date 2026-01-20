import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.jpg";
import axios from "axios";

const StudentLogin = () => {
  const [uid, setUid] = useState("");
  const [password, setPassword] = useState("");
  const [quizId, setQuizId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_APP}/api/student/login`,
        { uid, password, quizId },
        { withCredentials: true }
      );
console.log(response.data);
      if (response.data.success) {
        localStorage.setItem(
          "studentDetails",
          JSON.stringify(response.data.data)
        );
        navigate(`/quiz/${response.data.data.quizId}`);
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
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
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter Password"
                  required
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {error && (
                <p className="text-red-600 text-sm text-center">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition font-semibold"
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
