import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";

const StStudentQuizResult = () => {
  const { quizId } = useParams();
  const [results, setResults] = useState([]);
  const [quizTitle, setQuizTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [subcategories, setSubcategories] = useState([]);

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

      <div className="table-responsive">
        <table className="table table-bordered table-hover">
          <thead className="table-dark">
            <tr>
              <th>#</th>
              <th>Student</th>
              <th>Roll No</th>
              {subcategories.map((sub, i) => (
                <th key={i}>{sub}</th>
              ))}
              <th>Total Score</th>
              <th>%</th>
            </tr>
          </thead>
          <tbody>
            {results.map((student, idx) => {
              const totalQuestions = student.subcategoryScores.reduce(
                (acc, s) => acc + s.totalQuestions,
                0
              );
              const totalScore = student.totalScore;
              const percentage = Math.round((totalScore / totalQuestions) * 100);

              return (
                <tr key={student.studentId}>
                  <td>{idx + 1}</td>
                  <td>{student.name}</td>
                  <td>{student.rollNo}</td>
                  {subcategories.map((sub, i) => {
                    const subObj = student.subcategoryScores.find(
                      (s) => s.subcategory === sub
                    );
                    return <td key={i}>{subObj ? subObj.score : 0}</td>;
                  })}
                  <td>{totalScore}</td>
                  <td>{percentage}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StStudentQuizResult