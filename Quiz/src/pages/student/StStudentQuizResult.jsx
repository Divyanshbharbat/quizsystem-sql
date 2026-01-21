import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";

const StStudentQuizResult = () => {
  const { quizId } = useParams();
  const [results, setResults] = useState([]);
  const [quizTitle, setQuizTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [subcategories, setSubcategories] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // =========================
  // FETCH RESULTS
  // =========================
  useEffect(() => {
    if (!quizId) return;

    const fetchResults = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_APP}/api/faculty/quiz/${quizId}/results`,
          { withCredentials: true }
        );

        if (res.data.success) {
          setResults(res.data.results);
          setQuizTitle(res.data.quizTitle);

          // Extract unique subcategories dynamically
          const allSubs = new Set();
          res.data.results.forEach((student) =>
            student.subcategoryScores.forEach((sub) => allSubs.add(sub.subcategory))
          );
          setSubcategories([...allSubs]);
        }
      } catch (err) {
        console.error("Error fetching results", err);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [quizId]);

  // =========================
  // DOWNLOAD CSV
  // =========================
  const downloadCSV = () => {
    if (!results.length) return;

    const headers = ["Student Name", "Roll No", ...subcategories, "Total Score", "Percentage"];
    const rows = results.map((student) => {
      const subScores = subcategories.map((sub) => {
        const subObj = student.subcategoryScores.find((s) => s.subcategory === sub);
        return subObj ? subObj.score : 0;
      });
      return [
        student.name,
        student.rollNo,
        ...subScores,
        student.totalScore,
        Math.round(
          (student.totalScore /
            student.subcategoryScores.reduce((acc, s) => acc + s.totalQuestions, 0)) *
            100
        ),
      ];
    });

    const csvContent =
      [headers, ...rows]
        .map((row) => row.map((cell) => `"${cell}"`).join(","))
        .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${quizTitle || "quiz-results"}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  // =========================
  // UI STATES
  // =========================
  if (loading) return <div className="text-center mt-5">Loading results...</div>;
  if (!results.length)
    return (
      <div className="text-center mt-5 text-danger">
        No results found.
      </div>
    );

  // =========================
  // RENDER
  // =========================
  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>{quizTitle} – Results</h2>
        <button className="btn btn-success" onClick={downloadCSV}>
          Download CSV
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {results.map((student, idx) => {
          const totalQuestions = student.subcategoryScores.reduce(
            (acc, s) => acc + s.totalQuestions,
            0
          );
          const totalScore = student.totalScore;
          const percentage = Math.round((totalScore / totalQuestions) * 100);
          const isExpanded = selectedStudent?.studentId === student.studentId;

          return (
            <div
              key={student.studentId}
              onClick={() => {
                if (isExpanded) {
                  setSelectedStudent(null);
                } else {
                  setSelectedStudent({ ...student, percentage });
                }
              }}
              className="bg-white rounded-lg border border-gray-200 cursor-pointer transition-all duration-300 hover:shadow-lg overflow-hidden"
            >
              {/* Title Section - Always Visible */}
              <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-800 truncate">{student.name}</h3>
                <p className="text-xs text-gray-600 mt-1">
                  {isExpanded ? "Click to collapse" : "Click to view details"}
                </p>
              </div>

              {/* Expanded Details Section */}
              {isExpanded && (
                <div className="p-4 space-y-4">
                  {/* Score Summary */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-semibold text-gray-700">Overall Score</span>
                      <span className="text-2xl font-bold text-blue-600">{percentage}%</span>
                    </div>
                    <p className="text-xs text-gray-600">
                      {totalScore} / {totalQuestions} points
                    </p>
                  </div>

                  {/* Percentage Indicator Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      style={{
                        width: `${percentage}%`,
                        backgroundColor:
                          percentage >= 70 ? "#10b981" : percentage >= 40 ? "#f59e0b" : "#ef4444",
                      }}
                      className="h-full transition-all duration-500"
                    ></div>
                  </div>

                  {/* Subcategory Breakdown */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">
                      Subcategory Performance
                    </h4>
                    {student.subcategoryScores.map((sub, subIdx) => {
                      const subPercentage = Math.round(
                        (sub.score / sub.totalQuestions) * 100
                      );
                      return (
                        <div key={subIdx} className="bg-gray-50 p-2 rounded">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-semibold text-gray-700">
                              {sub.subcategory}
                            </span>
                            <span className="text-xs font-bold text-blue-600">
                              {sub.score}/{sub.totalQuestions}
                            </span>
                          </div>
                          <div className="w-full bg-gray-300 rounded-full h-1.5 overflow-hidden">
                            <div
                              style={{
                                width: `${subPercentage}%`,
                                backgroundColor:
                                  subPercentage >= 70
                                    ? "#10b981"
                                    : subPercentage >= 40
                                    ? "#f59e0b"
                                    : "#ef4444",
                              }}
                              className="h-full transition-all duration-500"
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
};

export default StStudentQuizResult;