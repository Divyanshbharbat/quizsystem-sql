import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FaSignOutAlt, FaClipboardList } from "react-icons/fa";
import axios from "axios";
import logo from "../../assets/logo.png";

const HomePageStudent = () => {
  const navigate = useNavigate();

  const [student, setStudent] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedStudent = JSON.parse(localStorage.getItem("studentDetails"));
    if (!storedStudent) {
      navigate("/seeresult");
      return;
    }
    setStudent(storedStudent);
  }, [navigate]);

  useEffect(() => {
    if (!student?._id) return;

    const fetchQuizzes = async () => {
      try {
        setLoading(true);
        const res = await axios.get(
          `${import.meta.env.VITE_APP}/api/student/${student._id}/quizzes`
        );

        if (res.data?.success && Array.isArray(res.data.data)) {
          setQuizzes(res.data.data);
        } else {
          setQuizzes([]);
        }
      } catch (err) {
        console.error("Failed to fetch quizzes:", err);
        setQuizzes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchQuizzes();
  }, [student]);

  if (!student) {
    return (
      <div className="text-center mt-10 text-gray-600">
        Loading student info...
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center mt-10 text-gray-600">
        Fetching quizzes...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ===== NAVBAR ===== */}
      <nav className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src={logo}
            alt="Logo"
            className="h-9 w-9 rounded border"
          />
          <span className="text-lg font-semibold text-gray-800">
            Student Dashboard
          </span>
        </div>

        <button
          onClick={() => {
            localStorage.removeItem("studentDetails");
            navigate("/seeresult");
          }}
          className="flex items-center gap-2 text-sm px-4 py-2 rounded-md border border-red-500 text-red-600 hover:bg-red-50 transition"
        >
          <FaSignOutAlt />
          Logout
        </button>
      </nav>

      {/* ===== CONTENT ===== */}
      <div className="max-w-6xl mx-auto p-6 space-y-8">

        {/* ===== STUDENT INFO ===== */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-lg border shadow-sm p-6"
        >
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Student Information
          </h2>

          <div className="grid md:grid-cols-2 gap-3 text-sm text-gray-700">
            <p><strong>Name:</strong> {student.name}</p>
            <p><strong>Student ID:</strong> {student.studentId}</p>
            <p><strong>Email:</strong> {student.email}</p>
            <p><strong>Department:</strong> {student.department}</p>
            <p><strong>Year:</strong> {student.year}</p>
          </div>
        </motion.section>

        {/* ===== QUIZ LIST ===== */}
        <section>
          <h2 className="text-xl font-semibold mb-4 flex items-center text-gray-800">
            <FaClipboardList className="mr-2 text-blue-600" />
            Quizzes Attempted
          </h2>

          {quizzes.length === 0 ? (
            <div className="bg-white border rounded-lg p-6 text-center text-gray-500">
              No quizzes attempted yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {quizzes.map((quiz, index) => (
                <motion.div
                  key={quiz.quizId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-lg border shadow-sm p-5 hover:shadow-md transition"
                >
                  <h3 className="text-base font-semibold text-blue-700 mb-1">
                    {quiz.title || "Untitled Quiz"}
                  </h3>

                  <p className="text-xs text-gray-500 mb-2">
                    Category: {quiz.category}
                  </p>

                  <p className="text-xs text-gray-500 mb-3">
                    Submitted on:{" "}
                    {quiz.submittedAt
                      ? new Date(quiz.submittedAt).toLocaleString()
                      : "N/A"}
                  </p>

                  {quiz.subcategories?.length > 0 ? (
                    <div className="space-y-1 text-sm">
                      {quiz.subcategories.map((sub, i) => (
                        <div
                          key={i}
                          className="flex justify-between text-gray-700"
                        >
                          <span>{sub.subcategory}</span>
                          <span className="font-medium text-blue-600">
                            {sub.percentage}%
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">
                      No subcategory data available
                    </p>
                  )}

                  <div className="mt-3 pt-2 border-t text-sm font-medium text-gray-700">
                    Score: {quiz.score} / {quiz.totalQuestions} (
                    {quiz.percentage}%)
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default HomePageStudent;
