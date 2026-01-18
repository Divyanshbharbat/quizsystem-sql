import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "./Navbar";
import toast,{Toaster} from 'react-hot-toast'
const CreateMyQuizzes = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const facultyDetails =
    location.state?.facultyDetails ||
    JSON.parse(localStorage.getItem("facultyDetails"));

  const [quizzes, setQuizzes] = useState([]);
  const [filteredQuizzes, setFilteredQuizzes] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSession, setSelectedSession] = useState("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!facultyDetails) {
      navigate("/");
    }
  }, [facultyDetails, navigate]);
    
  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    setLoading(true);
    setError("");
    try {
   const res = await axios.get(
  `${import.meta.env.VITE_APP}/api/faculty/${facultyDetails._id}/quizzes`
);


      const data = res.data;
      if (data.success && Array.isArray(data.data)) {
        setQuizzes(data.data);
        setFilteredQuizzes(data.data);

        const uniqueSessions = [
          ...new Set(
            data.data
              .map((q) => q.session)
              .filter((s) => s !== undefined && s !== null && s !== "")
          ),
        ];
        setSessions(uniqueSessions);
      } else {
        setQuizzes([]);
        setFilteredQuizzes([]);
        setError("No quizzes found");
      }
    } catch (err) {
      console.error("fetchQuizzes error:", err);
      setError("Failed to load quizzes");
      setQuizzes([]);
      setFilteredQuizzes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuiz = async (quizId) => {
    if (!window.confirm("Are you sure you want to delete this quiz?")) return;

    try {
  const res = await axios.delete(
  `${import.meta.env.VITE_APP}/api/quizzes/${quizId}`
);

      const data = res.data;
      if (data.success) {
        const updated = quizzes.filter((q) => q._id !== quizId);
        setQuizzes(updated);
        applyFilters(updated, searchTerm, selectedSession);
        toast.success("Quiz deleted successfully!");
      } else {
        alert("Failed to delete quiz.");
      }
    } catch (err) {
      console.error("delete error:", err);
      alert("Error deleting quiz.");
    }
  };

  const applyFilters = (quizList, search, session) => {
    let filtered = quizList;

    if (session && session !== "all") {
      filtered = filtered.filter((q) => q.session === session);
    }
    if (search && search.trim() !== "") {
      filtered = filtered.filter((q) =>
        q.title.toLowerCase().includes(search.toLowerCase())
      );
    }
    setFilteredQuizzes(filtered);
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchTerm(val);
    applyFilters(quizzes, val, selectedSession);
  };

  const handleSessionChange = (e) => {
    const val = e.target.value;
    setSelectedSession(val);
    applyFilters(quizzes, searchTerm, val);
  };

  return (
    <div className="flex flex-col md:flex-row bg-gray-50 min-h-screen">
      <div className="flex-grow">
        <Toaster/>
        <Navbar
          userName={`Hey, ${facultyDetails?.name || "Faculty"}`}
          onProfileClick={() => navigate(-1)}
        />
        <main className="p-6">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">
            My Created Quizzes
          </h2>

          {/* Search & Filter */}
          <div className="mb-6 bg-white p-4 rounded-lg shadow flex flex-col md:flex-row gap-4">
            <input
              type="text"
              placeholder="Search by quiz title..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full md:w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-400 outline-none"
            />
            <select
              value={selectedSession}
              onChange={handleSessionChange}
              className="w-full md:w-1/4 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-400 outline-none"
            >
              <option value="all">All Sessions</option>
              {sessions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Loading / Error */}
          {loading && (
            <p className="text-center text-indigo-600 font-medium">
              Loading quizzes...
            </p>
          )}
          {error && !loading && (
            <p className="text-center text-red-600 font-medium">{error}</p>
          )}

          {/* Quiz Table */}
          {!loading && filteredQuizzes.length > 0 && (
            <div className="overflow-x-auto bg-white shadow rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-[#243278]   text-white">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold">
                      Quiz ID
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">
                      Session
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">
                      Questions
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">
                      Created At
                    </th>
                    <th className="px-6 py-3 text-center text-sm font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredQuizzes.map((quiz) => (
                    <tr
                      key={quiz._id}
                      className="hover:bg-gray-50 transition"
                    >
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {quiz._id}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-800">
                        {quiz.title}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {quiz.session || "N/A"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                      {Array.isArray(quiz.categories)
                        ? quiz.categories.reduce(
                            (total, cat) => total + (cat.questions?.length || 0),
                            0
                          )
                        : 0}
                    </td>

                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(quiz.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 flex justify-center space-x-2">
                        <button
                          onClick={() => navigate(`/quiz-results/${quiz._id}`)}
                          className="px-3 py-1 bg-[#243278]  hover:bg-[#2e3f98]  text-white text-sm rounded-md transition"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleDeleteQuiz(quiz._id)}
                          className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-sm rounded-md transition"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && filteredQuizzes.length === 0 && !error && (
            <p className="text-center text-gray-600 mt-8">
              You haven’t created any quizzes yet.
            </p>
          )}
        </main>
      </div>
    </div>
  );
};

export default CreateMyQuizzes;
