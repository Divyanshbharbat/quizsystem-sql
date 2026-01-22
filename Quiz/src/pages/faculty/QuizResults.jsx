import React, { useEffect, useState, useMemo } from "react";
import { useParams, useLocation } from "react-router-dom";
import axios from "axios";
import * as XLSX from "xlsx";

const QuizResults = () => {
  const { quizId } = useParams();
  const location = useLocation();

  const [quizTitle, setQuizTitle] = useState(location.state?.quizTitle || "");
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

        const quizConfig = res.data.data;

        setQuizTitle(quizConfig.title || "");
        setSubmissions(quizConfig.completed || []);
        setLoading(false);
      } catch (err) {
        console.error("Error loading results:", err);
        setLoading(false);
      }
    };

    loadResults();
  }, [quizId]);

  /* 🔹 Collect all unique subcategories */
  const allSubcategories = useMemo(() => {
    const set = new Set();
    submissions.forEach(sub => {
      sub.subcategoryScores?.forEach(sc => {
        set.add(sc.subcategory);
      });
    });
    return Array.from(set);
  }, [submissions]);

  const handleDownloadExcel = () => {
    if (!submissions.length) return;

    const data = submissions.map(sub => {
      const student = sub.studentId || {};

      const row = {
        "Quiz Title": quizTitle,
        "Student Name": student.name || "-",
        "Student ID": student.studentId || "-",
        Department: student.department || "-",
        Year: student.year || "-",
        Score: sub.score,
        Percentage: sub.percentage
      };

      allSubcategories.forEach(subcat => {
        const sc = sub.subcategoryScores?.find(
          s => s.subcategory === subcat
        );
        row[subcat] = sc
          ? `${sc.score} / ${sc.totalQuestions}`
          : "0 / 0";
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
        <h2 className="text-2xl font-bold">
          📊 {quizTitle} – Results
        </h2>

        <button
          onClick={handleDownloadExcel}
          className="bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700"
        >
          Download Excel
        </button>
      </div>

      {submissions.length === 0 ? (
        <p className="text-center text-gray-600">
          No submissions found
        </p>
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
                  <tr
                    key={idx}
                    className="text-center hover:bg-blue-50"
                  >
                    <td className="border px-3 py-2">
                      {student.name}
                    </td>
                    <td className="border px-3 py-2">
                      {student.studentId}
                    </td>
                    <td className="border px-3 py-2">
                      {student.department}
                    </td>
                    <td className="border px-3 py-2">
                      {student.year}
                    </td>

                    {allSubcategories.map((subcat, i) => {
                      const sc = sub.subcategoryScores?.find(
                        s => s.subcategory === subcat
                      );

                      return (
                        <td
                          key={i}
                          className="border px-3 py-2 font-semibold"
                        >
                          {sc
                            ? `${sc.score} / ${sc.totalQuestions}`
                            : "0 / 0"}
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
