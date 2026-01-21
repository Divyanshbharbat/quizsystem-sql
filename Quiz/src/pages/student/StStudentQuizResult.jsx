import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import HalfCircleGauge from "../../components/HalfCircleGauge";

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

          return (
            <div
              key={student.studentId}
              onClick={() => setSelectedStudent({ ...student, percentage })}
              style={{
                cursor: "pointer",
                border: "1px solid #e0e0e0",
                borderRadius: "8px",
                padding: "16px",
                backgroundColor: "white",
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                transition: "all 0.3s ease",
                transform: "scale(1)",
                minHeight: "80px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.02)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.1)";
              }}
            >
              <div style={{ textAlign: "center", width: "100%" }}>
                <h3 style={{ margin: "0", fontSize: "16px", fontWeight: "bold", color: "#333" }}>
                  {student.name}
                </h3>
                <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#999" }}>
                  Click to view details
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ======================= DETAIL MODAL ======================= */}
      {selectedStudent && (
        <div 
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1000,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
          onClick={() => setSelectedStudent(null)}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "8px",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
              padding: "24px",
              maxWidth: "600px",
              width: "100%",
              maxHeight: "80vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: "20px",
              paddingBottom: "12px",
              borderBottom: "1px solid #e0e0e0"
            }}>
              <div>
                <h3 style={{ margin: "0 0 8px 0", fontSize: "20px", fontWeight: "bold" }}>
                  {selectedStudent.name}
                </h3>
                <p style={{ margin: 0, fontSize: "13px", color: "#999" }}>
                  Roll No: {selectedStudent.rollNo}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "24px",
                  cursor: "pointer",
                  color: "#999",
                  padding: "0",
                  width: "30px",
                  height: "30px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                ✕
              </button>
            </div>

            {/* Half Circle Gauge */}
            <div style={{ textAlign: "center", marginBottom: "24px" }}>
              <HalfCircleGauge percentage={selectedStudent.percentage} />
            </div>

            {/* Score Details */}
            <div style={{ marginBottom: "20px" }}>
              <h5 style={{ marginBottom: "12px", fontSize: "16px", fontWeight: "bold" }}>
                Subcategory Performance
              </h5>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "12px" }}>
                {selectedStudent.subcategoryScores.map((sub, idx) => {
                  const subPercentage = Math.round(
                    (sub.score / sub.totalQuestions) * 100
                  );
                  return (
                    <div key={idx} style={{
                      border: "1px solid #e0e0e0",
                      borderRadius: "6px",
                      backgroundColor: "#f5f5f5",
                      padding: "12px"
                    }}>
                      <p style={{ fontWeight: "bold", marginBottom: "8px", margin: "0 0 8px 0" }}>
                        {sub.subcategory}
                      </p>
                      <p style={{ marginBottom: "8px", margin: "0 0 8px 0" }}>
                        <strong>Score:</strong> {sub.score} / {sub.totalQuestions}
                      </p>
                      <div style={{
                        backgroundColor: "#ddd",
                        borderRadius: "4px",
                        height: "20px",
                        overflow: "hidden",
                        marginTop: "8px"
                      }}>
                        <div style={{
                          height: "100%",
                          width: `${subPercentage}%`,
                          backgroundColor: subPercentage >= 70
                            ? "#28a745"
                            : subPercentage >= 40
                            ? "#ffc107"
                            : "#dc3545",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "white",
                          fontSize: "12px",
                          fontWeight: "bold",
                          transition: "width 1s ease"
                        }}>
                          {subPercentage > 5 && `${subPercentage}%`}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Overall Summary */}
            <div style={{
              backgroundColor: "#f5f5f5",
              padding: "12px",
              borderRadius: "6px",
              marginBottom: "16px"
            }}>
              <p style={{ marginBottom: "8px", margin: "0 0 8px 0" }}>
                <strong>Total Score:</strong> {selectedStudent.totalScore} /{" "}
                {selectedStudent.subcategoryScores.reduce(
                  (acc, s) => acc + s.totalQuestions,
                  0
                )}
              </p>
              <p style={{ margin: 0 }}>
                <strong>Overall Percentage:</strong> {selectedStudent.percentage}%
              </p>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={() => setSelectedStudent(null)}
              style={{
                width: "100%",
                padding: "10px",
                backgroundColor: "#6c757d",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "bold"
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StStudentQuizResult;