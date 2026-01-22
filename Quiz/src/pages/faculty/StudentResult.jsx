import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";
import toast, { Toaster } from "react-hot-toast";
import { FaArrowLeft } from "react-icons/fa";
import HalfCircleGauge from "../../components/HalfCircleGauge";

const Seeresult = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();

  const [student, setStudent] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const facultyDetails = JSON.parse(localStorage.getItem("facultyDetails"));

  // Load student details
  useEffect(() => {
    const stored = localStorage.getItem("studentDetails");
    if (stored) {
      setStudent(JSON.parse(stored));
    }
  }, []);

  // Fetch quizzes
  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_APP}/api/student/${studentId}/quizzes`,
          { withCredentials: true }
        );

        console.log("Fetched quizzes:", res.data);

        if (res.data?.success && Array.isArray(res.data.data)) {
          setQuizzes(res.data.data);
        } else {
          setError("Invalid quiz data");
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load results");
      } finally {
        setLoading(false);
      }
    };

    fetchQuizzes();
  }, [studentId]);

  if (error) return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex flex-col flex-1">
        <Navbar userName="Student Results" />
        <main className="flex-1 p-6 flex items-center justify-center">
          <p className="text-center text-red-600 text-lg">{error}</p>
        </main>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <Toaster />

      <div className="flex flex-col flex-1">
        <Navbar
          userName={student?.name || "Student Results"}
          onProfileClick={() => navigate(-1)}
        />

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl mx-auto">
            {/* Back Button */}
            <div className="mb-6">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors font-medium"
              >
                <FaArrowLeft size={16} />
                Back to Students
              </button>
            </div>

            {/* STUDENT INFO */}
            {student && (
              <div className="bg-white border border-gray-200 rounded-lg shadow-md p-6 mb-8">
                <h2 className="text-3xl font-bold mb-6 text-gray-800">Student Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">Name</p>
                    <p className="text-lg font-bold text-gray-800 mt-1">{student.name}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">Student ID</p>
                    <p className="text-lg font-bold text-gray-800 mt-1">{student.studentId}</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">Department</p>
                    <p className="text-lg font-bold text-gray-800 mt-1">{student.department}</p>
                  </div>
                  <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                    <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">Email</p>
                    <p className="text-lg font-bold text-gray-800 mt-1 break-all">{student.email}</p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                    <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">Year</p>
                    <p className="text-lg font-bold text-gray-800 mt-1">Year {student.year}</p>
                  </div>
                </div>
              </div>
            )}

            {/* QUIZ RESULTS */}
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-gray-800 mb-6">Quizzes Attempted</h2>

              {loading ? (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                  <p className="text-gray-600 text-lg">Loading quiz results...</p>
                </div>
              ) : quizzes.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                  <p className="text-gray-600 text-lg">No quizzes attempted yet</p>
                </div>
              ) : (
                quizzes.map((quiz, index) => (
                  <div
                    key={index}
                    className="bg-white border border-gray-200 rounded-lg shadow-md p-6 mb-6"
                  >
                    {/* QUIZ HEADER */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 pb-4 border-b border-gray-200">
                      <div>
                        <h3 className="text-2xl font-bold text-blue-700 mb-2">
                          {quiz.quizTitle}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Category: <span className="font-semibold">{quiz.category}</span>
                        </p>
                      </div>

                      <div className="text-right mt-4 md:mt-0">
                        <p className="text-3xl font-bold text-green-700">
                          {quiz.score} / {quiz.totalQuestions}
                        </p>
                        <p className="text-lg font-semibold text-gray-600 mt-1">
                          {quiz.percentage}%
                        </p>
                      </div>
                    </div>

                    {/* OVERALL PROGRESS */}
                    <div className="mb-6">
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-sm font-semibold text-gray-700">Overall Progress</p>
                        <p className="text-sm text-gray-600">{quiz.percentage}%</p>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-green-400 to-green-600 h-4 rounded-full transition-all duration-500"
                          style={{ width: `${quiz.percentage}%` }}
                        />
                      </div>
                    </div>

                    <p className="text-sm text-gray-500 mb-6 italic">
                      Submitted on: {new Date(quiz.submittedAt).toLocaleString()}
                    </p>

                    {/* SUBCATEGORY SCORES */}
                    {Array.isArray(quiz.subcategoryScores) && quiz.subcategoryScores.length > 0 && (
                      <div>
                        <h4 className="font-bold text-lg text-gray-800 mb-4">
                          Subcategory-wise Performance
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {quiz.subcategoryScores.map((sub, idx) => (
                            <div
                              key={idx}
                              className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-300 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow"
                            >
                              <h5 className="font-bold text-indigo-700 mb-3 text-lg">
                                {sub.subcategory}
                              </h5>

                              <div className="space-y-2 mb-4">
                                <p className="text-sm">
                                  Correct: <b className="text-green-700">{sub.score}</b> / <span className="text-gray-600">{sub.totalQuestions}</span>
                                </p>

                                <p className="text-sm font-semibold text-gray-700">
                                  {sub.percentage}%
                                </p>
                              </div>

                              <div className="w-full bg-gray-300 rounded-full h-2 overflow-hidden">
                                <div
                                  className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full transition-all duration-500"
                                  style={{ width: `${sub.percentage}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Seeresult;
