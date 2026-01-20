import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaArrowLeft } from 'react-icons/fa';
import axios from 'axios';

const StudentResult = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { student } = location.state || {};

  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  if (!student) {
    return <div className="text-center text-red-600">No student data available.</div>;
  }

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
       console.log("Fetching quizzes for Student ID:", student.id);
const response = await axios.get(
  `${import.meta.env.VITE_APP}/api/student/${student.id}/quizzes`
);


        console.log("API Response:", response.data);

        if (response.data.success) {
          setQuizzes(response.data.data); // Expecting array of attempted quizzes
        } else {
          console.error("Failed to fetch quizzes:", response.data.message);
        }
      } catch (error) {
        console.error(
          "Error fetching student quizzes:",
          error.response?.data || error.message
        );
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [student]);

  if (loading) {
    return <div className="text-center">Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-8 bg-white rounded-lg shadow-lg mt-10 space-y-8">
      {/* Student Details */}
      <section className="bg-[#f8fafc] p-6 rounded-lg shadow-sm border">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Student Information</h2>
        <p className="text-gray-700"><strong>Name:</strong> {student.name}</p>
        <p className="text-gray-700"><strong>Student ID:</strong> {student.studentId}</p>
        <p className="text-gray-700"><strong>Email:</strong> {student.email}</p>
        <p className="text-gray-700"><strong>Department:</strong> {student.department}</p>
        <p className="text-gray-700"><strong>Year:</strong> {student.year}</p>
      </section>

      {/* Quizzes List */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-center text-gray-700">
          Quizzes Attempted
        </h2>
        {quizzes.length === 0 ? (
          <div className="text-center text-gray-600">No quizzes attempted yet.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {quizzes.map((quiz, index) => (
              <motion.div
                key={quiz.id}
                className="p-6 bg-gray-50 rounded-lg shadow-md flex flex-col justify-between"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <h3 className="text-lg font-bold text-gray-800 mb-2">
                  {quiz.quizId?.title || "Untitled Quiz"}
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Submitted on: {new Date(quiz.submittedAt).toLocaleString()}
                </p>

               <button
  onClick={() =>
    navigate("/student-quiz-result", {
      state: { student, quizId: quiz.id, attemptId: quiz.id } // pass attemptId properly from backend
    })
  }
  className="py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600 transition ease-in-out"
>
  View Result
</button>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Back Button */}
      <div className="flex justify-center mt-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center py-3 px-6 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition ease-in-out"
        >
          <FaArrowLeft className="mr-2" />
          Back
        </button>
      </div>
    </div>
  );
};

export default StudentResult;
