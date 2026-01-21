import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FaSignOutAlt, FaClipboardList, FaTimes } from "react-icons/fa";
import axios from "axios";
import logo from "../../assets/logo.png";
import HalfCircleGauge from "../../components/HalfCircleGauge";

const HomePageStudent = () => {
  const navigate = useNavigate();

  const [student, setStudent] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const storedStudent = JSON.parse(localStorage.getItem("studentDetails"));
    if (!storedStudent) {
      navigate("/seeresult");
      return;
    }
    setStudent(storedStudent);
  }, [navigate]);

  useEffect(() => {
    if (!student?.id) return;

    const fetchQuizzes = async () => {
      try {
        setLoading(true);
        const res = await axios.get(
          `${import.meta.env.VITE_APP}/api/student/${student.id}/quizzes`
        );
        console.log("Fetched quizzes:", res.data);
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

  // Get color based on percentage
  const getProgressColor = (percentage) => {
    if (percentage >= 70) return { bg: "#dcfce7", bar: "#22c55e", text: "#15803d" };
    if (percentage >= 40) return { bg: "#fef3c7", bar: "#eab308", text: "#b45309" };
    return { bg: "#fee2e2", bar: "#ef4444", text: "#991b1b" };
  };

  // Get progress bar color
  const getBarColor = (percentage) => {
    if (percentage >= 70) return "#22c55e";
    if (percentage >= 40) return "#eab308";
    return "#ef4444";
  };

  const openModal = (quiz) => {
    setSelectedQuiz(quiz);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setTimeout(() => setSelectedQuiz(null), 200);
  };

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
              {quizzes.map((quiz, index) => {
                const colors = getProgressColor(quiz.percentage);
                return (
                  <motion.div
                    key={quiz.quizId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => openModal(quiz)}
                    className="cursor-pointer bg-white rounded-xl border-2 border-gray-200 shadow-sm p-6 hover:shadow-lg hover:border-blue-300 transition transform hover:scale-102"
                  >
                    {/* Quiz Title */}
                    <h3 className="text-lg font-bold text-gray-800 mb-1 line-clamp-2">
                      {quiz.quizTitle || quiz.title || "Untitled Quiz"}
                    </h3>

                    <p className="text-xs text-gray-500 mb-4">
                      {new Date(quiz.submittedAt).toLocaleDateString()}
                    </p>

                    {/* Score Display */}
                    <div className="mb-4 pb-4 border-b-2 border-gray-100">
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px" }}>
                        <div>
                          <div style={{ fontSize: "13px", color: "#999", marginBottom: "4px" }}>Overall Score</div>
                          <div style={{ fontSize: "20px", fontWeight: "bold", color: "#333" }}>
                            {quiz.score}/{quiz.totalQuestions}
                          </div>
                        </div>
                        <div style={{
                          minWidth: "80px",
                          display: "flex",
                          justifyContent: "center"
                        }}>
                          <HalfCircleGauge percentage={quiz.percentage} />
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div style={{ marginBottom: "12px" }}>
                      <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "6px"
                      }}>
                        <span style={{ fontSize: "12px", fontWeight: "600", color: colors.text }}>Performance</span>
                        <span style={{ fontSize: "14px", fontWeight: "bold", color: colors.text }}>
                          {Math.round(quiz.percentage)}%
                        </span>
                      </div>
                      <div style={{
                        width: "100%",
                        height: "8px",
                        backgroundColor: colors.bg,
                        borderRadius: "4px",
                        overflow: "hidden"
                      }}>
                        <div style={{
                          width: `${quiz.percentage}%`,
                          height: "100%",
                          backgroundColor: colors.bar,
                          transition: "width 0.3s ease"
                        }} />
                      </div>
                    </div>

                    {/* Click hint */}
                    <p style={{ fontSize: "11px", color: "#bbb", textAlign: "center", marginTop: "8px" }}>
                      Click to view details
                    </p>
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* ===== MODAL ===== */}
      {showModal && selectedQuiz && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeModal}
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-hidden"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] shadow-2xl flex flex-col"
          >
            {/* Modal Header */}
            <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 flex items-center justify-between flex-shrink-0">
              <div>
                <h2 className="text-2xl font-bold">{selectedQuiz.quizTitle || selectedQuiz.title || "Quiz Results"}</h2>
                <p className="text-blue-100 text-sm mt-1">Submitted on {new Date(selectedQuiz.submittedAt).toLocaleString()}</p>
              </div>
              <button
                onClick={closeModal}
                className="text-white hover:bg-blue-800 p-2 rounded-full transition flex-shrink-0"
              >
                <FaTimes size={20} />
              </button>
            </div>

            {/* Modal Content - Scrollable */}
            <div className="p-6 space-y-6 overflow-y-auto flex-grow">

              {/* Overall Score Section */}
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6 border border-slate-200">
                <h3 className="text-sm font-semibold text-gray-600 mb-4 uppercase tracking-wide">Overall Performance</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: "13px", color: "#666", marginBottom: "8px" }}>Total Score</div>
                    <div style={{ fontSize: "28px", fontWeight: "bold", color: "#333", marginBottom: "8px" }}>
                      {selectedQuiz.score}/{selectedQuiz.totalQuestions}
                    </div>
                    <div style={{
                      fontSize: "16px",
                      fontWeight: "bold",
                      color: getProgressColor(selectedQuiz.percentage).text
                    }}>
                      {Math.round(selectedQuiz.percentage)}%
                    </div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "center" }}>
                    <HalfCircleGauge percentage={selectedQuiz.percentage} />
                  </div>
                </div>
              </div>

              {/* Category Breakdown */}
              {selectedQuiz.subcategoryScores && selectedQuiz.subcategoryScores.length > 0 ? (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">Category Breakdown</h3>
                  <div className="space-y-4">
                    {selectedQuiz.subcategoryScores.map((sub, index) => {
                      const colors = getProgressColor(sub.percentage);
                      return (
                        <div key={index} style={{
                          backgroundColor: colors.bg,
                          border: `2px solid ${colors.bar}`,
                          borderRadius: "10px",
                          padding: "16px"
                        }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                            <div>
                              <div style={{ fontSize: "16px", fontWeight: "bold", color: "#333", marginBottom: "4px" }}>
                                {sub.subcategory || "Unnamed Category"}
                              </div>
                              <div style={{ fontSize: "13px", color: "#666" }}>
                                Score: <strong>{sub.score}/{sub.totalQuestions}</strong>
                              </div>
                            </div>
                            <div style={{ fontSize: "18px", fontWeight: "bold", color: colors.text }}>
                              {Math.round(sub.percentage)}%
                            </div>
                          </div>
                          <div style={{
                            width: "100%",
                            height: "10px",
                            backgroundColor: "rgba(0,0,0,0.1)",
                            borderRadius: "5px",
                            overflow: "hidden"
                          }}>
                            <div style={{
                              width: `${sub.percentage}%`,
                              height: "100%",
                              backgroundColor: colors.bar,
                              transition: "width 0.5s ease"
                            }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <p style={{ fontSize: "13px", color: "#999", textAlign: "center" }}>
                  No category breakdown available
                </p>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  onClick={closeModal}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default HomePageStudent;
