import React, { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";

const BlockedStudentPage = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlockedStudents = async () => {
      try {
   const { data } = await axios.get(
  `${import.meta.env.VITE_APP}/api/faculty/quizzes/blocked-students`,
  { withCredentials: true }
);


      
        if (data.success) setQuizzes(data.data);
      } catch (e) {
        console.error(e);
        toast.error("Failed to fetch blocked students");
      } finally {
        setLoading(false);
      }
    };

    fetchBlockedStudents();
  }, []);

  const handleUnblock = async (quizId, studentId) => {
    try {
   await axios.post(
  `${import.meta.env.VITE_APP}/api/faculty/quizzes/${quizId}/unblock-student`,
  { studentId },
  { withCredentials: true }
);



      setQuizzes((prev) =>
        prev.map((q) =>
          q.quizId === quizId
            ? { ...q, blockedStudents: q.blockedStudents.filter((s) => s.id !== studentId) }
            : q
        )
      );

      toast.success("Student unfrozen successfully");
    } catch (e) {
      console.error(e);
      toast.error("Failed to unblock student");
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Toaster  />

      {/* Sidebar */}
      <Sidebar />

      <div className="flex-1 flex p-3 flex-col">
        {/* Navbar */}
        <Navbar title="Faculty Management" />

        {/* Main content */}
        <main className="p-6">
          <h1 className="text-2xl font-bold mb-4">Blocked Students</h1>

          {loading && <p>Loading blocked students...</p>}
          {!loading && quizzes.length === 0 && (
            <p className="text-gray-600">No blocked students found.</p>
          )}

          {!loading && quizzes.length > 0 && (
            <div className="space-y-6">
              {quizzes.map((quiz) => (
                <div
                  key={quiz.quizId}
                  className="bg-white rounded-lg shadow-md p-6 border border-gray-200"
                >
                  <h2 className="text-xl font-semibold mb-4">{quiz.title}</h2>

                  {quiz.blockedStudents.length === 0 ? (
                    <p className="text-gray-600">No blocked students for this quiz.</p>
                  ) : (
                    <ul className="space-y-3">
                      {quiz.blockedStudents.map((student) => (
                        <li
                          key={student.id}
                          className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-200"
                        >
                          <div>
                            <p className="font-medium">{student.name} ({student.studentId})</p>
                            <p className="text-sm text-gray-500">
                              {student.email} - Year {student.year}
                            </p>
                          </div>
                          <button
                            onClick={() => handleUnblock(quiz.quizId, student.id)}
                            className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700 transition"
                          >
                            Unfreeze
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default BlockedStudentPage;
