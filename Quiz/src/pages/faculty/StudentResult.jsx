import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import HalfCircleGauge from "../../components/HalfCircleGauge";
const Seeresult = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();

  const [student, setStudent] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  if (loading) return <p className="text-center mt-10">Loading...</p>;
  if (error) return <p className="text-center text-red-600">{error}</p>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* STUDENT INFO */}
      {student && (
        <div className="bg-white border rounded-lg shadow p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">Student Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <p><b>Name:</b> {student.name}</p>
            <p><b>Student ID:</b> {student.studentId}</p>
            <p><b>Email:</b> {student.email}</p>
            <p><b>Department:</b> {student.department}</p>
            <p><b>Year:</b> {student.year}</p>
          </div>
        </div>
      )}

      {/* QUIZ RESULTS */}
      <h2 className="text-2xl font-bold mb-6">Quizzes Attempted</h2>

      {quizzes.map((quiz, index) => (
        <div
          key={index}
          className="bg-gray-50 border rounded-lg shadow p-6 mb-6"
        >
          {/* QUIZ HEADER */}
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-xl font-bold text-blue-700">
                {quiz.quizTitle}
              </h3>
              <p className="text-sm text-gray-600">
                Category: {quiz.category}
              </p>
            </div>

            <div className="text-right">
              <p className="text-lg font-bold text-green-700">
                {quiz.score} / {quiz.totalQuestions}
              </p>
              <p className="text-sm text-gray-600">
                {quiz.percentage}%
              </p>
            </div>
          </div>

          {/* OVERALL PROGRESS */}
          <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
            <div
              className="bg-green-500 h-3 rounded-full"
              style={{ width: `${quiz.percentage}%` }}
            />
          </div>

          <p className="text-sm text-gray-500 mb-4">
            Submitted on: {new Date(quiz.submittedAt).toLocaleString()}
          </p>

          {/* SUBCATEGORY SCORES */}
          <h4 className="font-semibold mb-3">
            Subcategory-wise Performance
          </h4>

          {Array.isArray(quiz.subcategoryScores) &&
          quiz.subcategoryScores.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {quiz.subcategoryScores.map((sub, idx) => (
                <div
                  key={idx}
                  className="bg-white border rounded p-4 shadow-sm"
                >
                  <h5 className="font-semibold text-indigo-700 mb-1">
                    {sub.subcategory}
                  </h5>

                  <p className="text-sm">
                    Correct: <b>{sub.score}</b> / {sub.totalQuestions}
                  </p>

                  <p className="text-sm text-gray-600 mb-2">
                    {sub.percentage}%
                  </p>

                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${sub.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic">
              No subcategory data available
            </p>
          )}
        </div>
      ))}

      <div className="text-center mt-8">
        <button
          onClick={() => navigate(-1)}
          className="px-6 py-2 bg-gray-700 text-white rounded hover:bg-gray-800"
        >
          Go Back
        </button>
      </div>
    </div>
  );
};

export default Seeresult;
