import React, { useEffect, useState, useMemo } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import * as XLSX from "xlsx";
import { FaArrowLeft } from "react-icons/fa";

const QuizResults = () => {
  const { quizId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // If we got a single submission via state
  const singleStudentMode = !!location.state?.submission;

  const [quizTitle, setQuizTitle] = useState(location.state?.quizTitle || "");
  const [submissions, setSubmissions] = useState(
    location.state?.submission ? [location.state.submission] : []
  );
  const [loading, setLoading] = useState(!singleStudentMode);

  useEffect(() => {
    // If we already have data (single student mode), skip fetching
    if (singleStudentMode) {
      setLoading(false);
      return;
    }

    const loadResults = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_APP}/api/quizzes/config/${quizId}`,
          { withCredentials: true }
        );

        if (!res.data.success) {
          setLoading(false);
          return;
        }

        // Ensure we have an array of submissions
        const submissionsData = res.data.data.completed || [];

        // Get quiz title from first submission if available
        const quizTitleFromData =
          submissionsData.length > 0
            ? submissionsData[0].quiz?.title || res.data.data.title || ""
            : res.data.data.title || "";

        setQuizTitle(quizTitleFromData);
        setSubmissions(submissionsData);
        setLoading(false);
      } catch (err) {
        console.error("Error loading results:", err);
        setLoading(false);
      }
    };

    loadResults();
  }, [quizId, singleStudentMode]);

  // Collect all unique subcategories across all submissions
  const allSubcategories = useMemo(() => {
    const set = new Set();
    submissions.forEach((sub) => {
      sub.subcategoryScores?.forEach((sc) => set.add(sc.subcategory));
    });
    return Array.from(set);
  }, [submissions]);

  // Excel download
  const handleDownloadExcel = () => {
    if (!submissions.length) return;

    const data = submissions.map((sub) => {
      const student = sub.studentId || {};
      const row = {
        "Quiz Title": sub.quiz?.title || quizTitle,
        "Student Name": student.name || "-",
        "Student ID": student.id || "-",
        Department: student.department || "-",
        Year: student.year || "-",
        Score: sub.score,
        Percentage: sub.percentage,
      };

      allSubcategories.forEach((subcat) => {
        const sc = sub.subcategoryScores?.find(
          (s) => s.subcategory === subcat
        );
        row[subcat] = sc ? `${sc.score} / ${sc.totalQuestions}` : "0 / 0";
      });

      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Results");
    XLSX.writeFile(workbook, `${quizTitle}_Results.xlsx`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-xl font-semibold">
        Loading results...
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-5">
        <div className="flex items-center gap-4">
          {singleStudentMode && (
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded transition text-gray-800 font-medium"
            >
              <FaArrowLeft /> Back
            </button>
          )}
          <h2 className="text-2xl font-bold">
            📊 {quizTitle} – {singleStudentMode ? "Student Result" : "Results"}
          </h2>
        </div>

        {!singleStudentMode && (
          <button
            onClick={handleDownloadExcel}
            className="bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700"
          >
            Download Excel
          </button>
        )}
      </div>

      {submissions.length === 0 ? (
        <p className="text-center text-gray-600">No submissions found</p>
      ) : singleStudentMode ? (
        <div className="bg-white rounded-lg shadow-lg p-6">
          {submissions.map((sub, idx) => {
            const student = sub.studentId || {};
            return (
              <div key={idx} className="space-y-6">
                {/* Student Header */}
                <div className="bg-gradient-to-r from-blue-100 to-indigo-100 rounded-lg p-4 border-l-4 border-blue-600">
                  <h3 className="text-2xl font-bold text-gray-800">
                    {student.name || "Unknown Student"}
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm">
                    <div>
                      <span className="font-semibold text-gray-700">
                        Student ID:
                      </span>
                      <p className="text-gray-600">{student.id || "-"}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">
                        Department:
                      </span>
                      <p className="text-gray-600">{student.department || "-"}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Year:</span>
                      <p className="text-gray-600">{student.year || "-"}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Email:</span>
                      <p className="text-gray-600">{student.email || "-"}</p>
                    </div>
                  </div>
                </div>

                {/* Overall Score */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-6 border-2 border-green-300">
                  <h4 className="text-xl font-bold text-gray-800 mb-4">
                    Overall Performance
                  </h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white rounded-lg p-4 text-center shadow">
                      <p className="text-gray-600 text-sm font-semibold uppercase">
                        Total Score
                      </p>
                      <p className="text-3xl font-bold text-green-600 mt-2">
                        {sub.score}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        of {sub.totalMarks || sub.quiz?.totalMarks || 100}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-4 text-center shadow">
                      <p className="text-gray-600 text-sm font-semibold uppercase">
                        Percentage
                      </p>
                      <p className="text-3xl font-bold text-blue-600 mt-2">
                        {sub.percentage || 0}%
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-4 text-center shadow">
                      <p className="text-gray-600 text-sm font-semibold uppercase">
                        Submitted
                      </p>
                      <p className="text-sm text-gray-600 mt-2">
                        {new Date(sub.submittedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Subcategory Scores */}
                {sub.subcategoryScores && sub.subcategoryScores.length > 0 ? (
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-6 border-2 border-blue-300">
                    <h4 className="text-xl font-bold text-gray-800 mb-4">
                      Category-wise Performance
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {sub.subcategoryScores.map((sc, scIdx) => (
                        <div
                          key={scIdx}
                          className="bg-white rounded-lg p-4 shadow hover:shadow-md transition"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <h5 className="font-bold text-gray-800 text-lg">
                              {sc.subcategory}
                            </h5>
                            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-bold">
                              {((sc.score / sc.totalQuestions) * 100).toFixed(1)}%
                            </span>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Score:</span>
                              <span className="font-semibold text-gray-800">
                                {sc.score} / {sc.totalQuestions}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                              <div
                                className="bg-gradient-to-r from-blue-500 to-cyan-500 h-full transition-all duration-500"
                                style={{
                                  width: `${(sc.score / sc.totalQuestions) * 100}%`,
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-gray-600 py-6 bg-gray-50 rounded">
                    No category-wise breakdown available
                  </p>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="overflow-x-auto shadow border rounded">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-3 py-2">Name</th>
                <th className="border px-3 py-2">Student ID</th>
                <th className="border px-3 py-2">Department</th>
                <th className="border px-3 py-2">Year</th>
                {allSubcategories.map((sub, idx) => (
                  <th key={idx} className="border px-3 py-2">
                    {sub}
                  </th>
                ))}
                <th className="border px-3 py-2">Total</th>
                <th className="border px-3 py-2">%</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((sub, idx) => {
                const student = sub.studentId || {};
                return (
                  <tr key={idx} className="text-center hover:bg-blue-50">
                    <td className="border px-3 py-2">{student.name}</td>
                    <td className="border px-3 py-2">{student.id}</td>
                    <td className="border px-3 py-2">{student.department}</td>
                    <td className="border px-3 py-2">{student.year}</td>
                    {allSubcategories.map((subcat, i) => {
                      const sc = sub.subcategoryScores?.find(
                        (s) => s.subcategory === subcat
                      );
                      return (
                        <td key={i} className="border px-3 py-2 font-semibold">
                          {sc ? `${sc.score} / ${sc.totalQuestions}` : "0 / 0"}
                        </td>
                      );
                    })}
                    <td className="border px-3 py-2 font-bold text-blue-600">
                      {sub.score}
                    </td>
                    <td className="border px-3 py-2 font-semibold">
                      {sub.percentage}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default QuizResults;
