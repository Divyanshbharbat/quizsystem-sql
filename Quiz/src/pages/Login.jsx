import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast,{Toaster} from 'react-hot-toast'
const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [session, setSession] = useState(""); // New state
  const [semester, setSemester] = useState("odd"); // Default to "odd"
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Check if session is already active
  useEffect(() => {
    const facultyDetails = localStorage.getItem("facultyDetails");
    if (facultyDetails) {
      const details = JSON.parse(facultyDetails);
      if (details.isAdmin === true) {
        navigate("/admin-dashboard");
      } else {
        navigate("/create");
      }
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (!session.trim()) {
      toast.error("Please enter session (e.g., 2025-2026)");
      setIsLoading(false);
      return;
    }

    if (!["even", "odd"].includes(semester)) {
      toast.error("Semester must be either 'even' or 'odd'");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_APP}/api/faculty/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: username, password, session, semester }),
          credentials: "include", // ensures cookies are sent
        }
      );

      const result = await response.json();

      if (response.ok && result.success) {
        const facultyDetails = result.data;
        const token = result.token;
        
        localStorage.setItem("facultyDetails", JSON.stringify(facultyDetails));
        if (token) {
          localStorage.setItem("token", token);
          console.log("[LOGIN] ✅ Token saved to localStorage");
        }
        
        // Show success message
        toast.success("Login successful");
        
        // Route based on isAdmin
        if (facultyDetails.isAdmin === true) {
          navigate("/admin-dashboard");
        } else {
          navigate("/create");
        }
      } else {
        const msg = result.message || "";
        if (msg === "wrong_password") {
          toast.error("❌ Password is incorrect");
        } else if (msg === "email_not_found") {
          toast.error("❌ Email not found");
        } else if (msg === "session_mismatch") {
          toast.error("❌ Session or Semester does not match");
        } else {
          toast.error(msg || "Login failed");
        }
      }
    } catch (error) {
      console.error("An error occurred:", error);
      toast.error(`An error occurred: ${error.message || "Please try again later."}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      <Toaster />
      {/* Top Heading */}
      <header className="text-center py-6 bg-white shadow-md">
        <h1 className="text-3xl font-bold text-blue-800">
          St. Vincent Pallotti College of Engineering & Technology
        </h1>
        <p className="text-gray-600 mt-1 text-lg font-medium">
          Admin & Faculty Quiz Login Portal
        </p>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 relative">
        {/* Left: Login Form */}
        <div className="flex-1 flex items-center justify-center p-6 md:p-10 relative z-10">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 md:p-10 relative z-10">
            <h2 className="text-2xl font-bold text-center mb-8 text-blue-700">
              Admin & Faculty Login
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  className="block text-sm font-semibold text-gray-700 mb-1"
                  htmlFor="username"
                >
                  Email
                </label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full p-3 border border-blue-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div>
                <label
                  className="block text-sm font-semibold text-gray-700 mb-1"
                  htmlFor="password"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-3 border border-blue-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-600 text-lg"
                  >
                    {showPassword ? "👁️" : "👁️‍🗨️"}
                  </button>
                </div>
              </div>

              <div>
                <label
                  className="block text-sm font-semibold text-gray-700 mb-1"
                  htmlFor="session"
                >
                  Session
                </label>
                <input
                  type="text"
                  id="session"
                  value={session}
                  onChange={(e) => setSession(e.target.value)}
                  className="w-full p-3 border border-blue-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter session (e.g., 2025-26)"
                  required
                />
              </div>

              <div>
                <label
                  className="block text-sm font-semibold text-gray-700 mb-1"
                  htmlFor="semester"
                >
                  Semester
                </label>
                <select
                  id="semester"
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  className="w-full p-3 border border-blue-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="odd">Odd</option>
                  <option value="even">Even</option>
                </select>
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

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-700 text-white font-semibold py-3 rounded-lg shadow-md hover:bg-blue-800 transition duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? "Logging in..." : "Login"}
              </button>
             
            </form>
          </div>
        </div>

        {/* Right: Image */}
        <div className="flex-1 hidden md:flex items-center justify-center -ml-16">
          <img
            src="https://img.freepik.com/free-vector/access-control-system-abstract-concept_335657-3180.jpg?semt=ais_hybrid&w=740&q=80"
            alt="Login Illustration"
            className="object-contain h-[28rem] md:h-[34rem] w-[28rem] md:w-[34rem] rounded-xl "
          />
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-gray-500 py-4 text-sm bg-white border-t">
        © 2025 St. Vincent Pallotti College of Engineering & Technology | All Rights Reserved
      </footer>
    </div>
  );
};

export default Login;
