import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Seeresult = () => {
  const [uid, setUid] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_APP}/api/student/resultlogin`,
        { uid, password },
        { withCredentials: true }
      );

      if (response.data.success) {
        localStorage.setItem("studentDetails", JSON.stringify(response.data.data));
        navigate(`/result/${response.data.data.studentId}`);
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
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="text-center py-6 bg-white border-b">
        <h1 className="text-2xl font-semibold text-blue-800">
          St. Vincent Pallotti College of Engineering & Technology
        </h1>
        <p className="text-gray-600 mt-1">Student Result Portal</p>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 items-center justify-center px-6">
        <div className="bg-white w-full max-w-4xl rounded-xl shadow-sm border grid grid-cols-1 md:grid-cols-2 overflow-hidden">
          
          {/* Left: Login Form */}
          <div className="p-8 md:p-10">
            <h2 className="text-xl font-semibold text-gray-800 mb-6 text-center">
              Student Login
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  UID
                </label>
                <input
                  type="text"
                  value={uid}
                  onChange={(e) => setUid(e.target.value)}
                  placeholder="Enter your UID"
                  required
                  className="w-full px-4 py-2.5 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full px-4 py-2.5 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {error && (
                <p className="text-red-600 text-sm text-center">{error}</p>
              )}

            <div className="flex flex-row gap-4">
                 <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-700 text-white py-2.5 rounded-md font-medium hover:bg-blue-800 transition"
              >
                {loading ? "Logging in..." : "Login"}
              </button>

              <button
                onClick={() => navigate("/")}
                className="w-full border border-blue-700 text-blue-700 py-2.5 rounded-md font-medium hover:bg-blue-50 transition"
              >
                Home
              </button>
            </div>
            </form>
          </div>

          {/* Right: Image */}
          <div className="hidden md:flex items-center justify-center bg-slate-50 p-6">
            <img
              src="https://img.freepik.com/free-vector/access-control-system-abstract-concept_335657-3180.jpg?semt=ais_hybrid&w=740&q=80"
              alt="Student Login Illustration"
              className="max-h-[320px] object-contain"
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-gray-500 py-4 text-sm bg-white border-t">
        © 2025 St. Vincent Pallotti College of Engineering & Technology | All Rights Reserved
      </footer>
    </div>
  );
};

export default Seeresult;
