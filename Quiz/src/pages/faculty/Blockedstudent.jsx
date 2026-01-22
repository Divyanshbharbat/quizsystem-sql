import React, { useEffect, useState } from "react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";

const BlockedStudent = () => {
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
        toast.error("Failed to fetch blocked students.");
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
            ? {
                ...q,
                blockedStudents: q.blockedStudents.filter(
                  (s) => s.id !== studentId
                ),
              }
            : q
        )
      );

      toast.success("Student successfully unfrozen!");
    } catch (e) {
      console.error(e);
      toast.error("Failed to unblock student.");
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg font-semibold">Loading blocked students...</p>
      </div>
    );

  if (quizzes.length === 0)
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg font-semibold">No blocked students found.</p>
      </div>
    );

  const facultyDetails = (() => {
    try {
      return JSON.parse(localStorage.getItem("facultyDetails")) || {};
    } catch {
      return {};
    }
  })();

  return (
    <div className="bg-gray-50 min-h-screen">
      <Navbar userName={facultyDetails?.name || "Faculty"} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <aside className="hidden md:block md:col-span-1">
            <Sidebar />
          </aside>

          <section className="col-span-1 md:col-span-3">
            <Toaster position="top-right" reverseOrder={false} />
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Blocked Students</h1>
                <p className="text-sm text-gray-500 mt-1">Manage and unfreeze students blocked from quizzes.</p>
              </div>
            </div>

            <div className="space-y-4">
              {quizzes.map((quiz) => (
                <div key={quiz.quizId} className="bg-white rounded-lg shadow p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-700">{quiz.title}</h2>
                      <p className="text-sm text-gray-500 mt-1">Quiz ID: {quiz.quizId}</p>
                    </div>
                    <div className="text-sm text-gray-500">{quiz.blockedStudents.length} frozen</div>
                  </div>

                  {quiz.blockedStudents.length === 0 ? (
                    <p className="text-gray-500 mt-3">No blocked students in this quiz.</p>
                  ) : (
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                      {quiz.blockedStudents.map((student) => (
                        <li key={student.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-gray-50 rounded-md p-3">
                          <div>
                            <p className="font-semibold text-gray-800">{student.name} <span className="text-sm text-gray-500">({student.studentId})</span></p>
                            <p className="text-sm text-gray-500">{student.email} • Year {student.year}</p>
                          </div>
                          <div className="flex-shrink-0">
                            <button
                              onClick={() => handleUnblock(quiz.quizId, student.id)}
                              className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition"
                            >
                              Unfreeze
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default BlockedStudent;
