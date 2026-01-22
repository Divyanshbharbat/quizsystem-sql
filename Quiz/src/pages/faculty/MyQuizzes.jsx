import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";
import toast, { Toaster } from "react-hot-toast";

const MyQuizzes = () => {
  const navigate = useNavigate();
  const facultyDetails = JSON.parse(localStorage.getItem("facultyDetails"));

  const [quizConfigsForTable, setQuizConfigsForTable] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedFaculty, setSelectedFaculty] = useState("");
  const [loading, setLoading] = useState(true);

  // Fetch all quizzes for current faculty - ONLY on mount
  useEffect(() => {
    if (!facultyDetails?.id) {
      navigate("/");
      return;
    }
    fetchTableData();
  }, []); // Empty dependency array - run only once

  const fetchTableData = async () => {
    if (!facultyDetails?.id) {
      toast.error("Faculty details not found");
      return;
    }
    try {
      setLoading(true);
      console.log("[MyQuizzes] Fetching data for faculty:", facultyDetails.id);
      const res = await axios.get(
        `${import.meta.env.VITE_APP}/api/quizzes/gettabledata`,
        { params: { facultyId: facultyDetails.id } }
      );
      console.log("[MyQuizzes] Response:", res.data);
      if (res.data?.data) {
        setQuizConfigsForTable(res.data.data);
      } else {
        setQuizConfigsForTable([]);
      }
    } catch (err) {
      console.error("[MyQuizzes] Error:", err);
      toast.error("Failed to load quizzes: " + err.message);
      setQuizConfigsForTable([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (quiz) => {
    navigate("/create", { state: { editQuiz: quiz } });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this quiz?")) return;
    try {
      await axios.delete(
        `${import.meta.env.VITE_APP}/api/quizzes/config/${id}`,
        { data: { facultyId: facultyDetails.id } }
      );
      toast.success("Quiz deleted successfully");
      fetchTableData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete quiz");
    }
  };

  const handleSeeResult = (id) => navigate(`/quiz-results/${id}`);

  /* ================= DATE FILTER ================= */
  const availableDates = [
    ...new Set(
      quizConfigsForTable.map((q) =>
        new Date(q.createdAt).toISOString().split("T")[0]
      )
    ),
  ];

  const availableDepartments = [
    ...new Set(quizConfigsForTable.map((q) => q.createdByDetails?.department).filter(Boolean)),
  ].sort();

  const availableFaculty = [
    ...new Set(quizConfigsForTable.map((q) => q.createdByDetails?.name).filter(Boolean)),
  ].sort();

  const filteredTableData = quizConfigsForTable.filter((q) => {
    const dateMatch = !selectedDate || new Date(q.createdAt).toISOString().split("T")[0] === selectedDate;
    const departmentMatch = !selectedDepartment || q.createdByDetails?.department === selectedDepartment;
    const facultyMatch = !selectedFaculty || q.createdByDetails?.name === selectedFaculty;
    return dateMatch && departmentMatch && facultyMatch;
  });

  const groupedQuizConfigs = filteredTableData.reduce((acc, item) => {
    if (!acc[item.quizConfigId]) {
      acc[item.quizConfigId] = {
        quizConfigId: item.quizConfigId,
        title: item.title,
        category: item.category,
        createdAt: item.createdAt,
        createdBy: item.createdByDetails,
        subcategories: [],
      };
    }

    acc[item.quizConfigId].subcategories.push({
      name: item.subcategory,
      available: item.totalQuestionsAvailable,
      selected: item.selectedQuestions,
    });

    return acc;
  }, {});

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Toaster />
      <Sidebar />
      
      <div className="flex flex-col flex-1 h-screen overflow-hidden">
        <Navbar userName={facultyDetails?.name || "My Quizzes"} />

        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Fixed Filter Section */}
          <div className="bg-white border-b border-gray-200 p-6 bg-gradient-to-r from-blue-600 to-blue-800 text-white flex-shrink-0">
            <h3 className="text-xl font-bold mb-4">My Quiz Configurations</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-blue-100 mb-2">Filter by Date</label>
                <select
                  className="w-full px-4 py-2 rounded-lg text-gray-800 border border-blue-300 focus:outline-none focus:ring-2 focus:ring-white"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                >
                  <option value="">All Dates</option>
                  {availableDates.map((d) => (
                    <option key={d} value={d}>
                      {new Date(d).toDateString()}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-blue-100 mb-2">Filter by Department</label>
                <select
                  className="w-full px-4 py-2 rounded-lg text-gray-800 border border-blue-300 focus:outline-none focus:ring-2 focus:ring-white"
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                >
                  <option value="">All Departments</option>
                  {availableDepartments.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-blue-100 mb-2">Filter by Faculty</label>
                <select
                  className="w-full px-4 py-2 rounded-lg text-gray-800 border border-blue-300 focus:outline-none focus:ring-2 focus:ring-white"
                  value={selectedFaculty}
                  onChange={(e) => setSelectedFaculty(e.target.value)}
                >
                  <option value="">All Faculty</option>
                  {availableFaculty.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Scrollable Table Section */}
          <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
            {/* ================= TABLE ================= */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-100 border-b border-gray-300">
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">#</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Title</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Category</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Date & Time</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Subcategories</th>
                      <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-8 text-center">
                          <span className="text-gray-500">Loading quizzes...</span>
                        </td>
                      </tr>
                    ) : Object.values(groupedQuizConfigs).length > 0 ? (
                      Object.values(groupedQuizConfigs).map((quiz, i) => (
                        <tr key={quiz.quizConfigId} className="border-b border-gray-200 hover:bg-blue-50 transition-colors">
                          <td className="px-6 py-4 text-sm text-gray-700 font-medium">{quiz.quizConfigId}</td>
                          <td className="px-6 py-4 text-sm font-semibold text-gray-800">{quiz.title}</td>
                          <td className="px-6 py-4 text-sm">
                            <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold">
                              {quiz.category}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">{new Date(quiz.createdAt).toLocaleString()}</td>
                          <td className="px-6 py-4 text-sm">
                            <div className="space-y-1">
                              {quiz.subcategories.map((s, j) => (
                                <div key={j} className="text-gray-700">
                                  <span className="font-medium">{s.name}:</span>
                                  <span className="ml-2 bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs font-semibold">
                                    {s.selected}/{s.available}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2 justify-center flex-wrap">
                              <button
                                className="px-3 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-sm font-medium transition-colors"
                                onClick={() => handleEdit(quiz)}
                                title="Edit this quiz"
                              >
                                ✎ Edit
                              </button>
                              <button
                                className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
                                onClick={() => handleSeeResult(quiz.quizConfigId)}
                                title="View results"
                              >
                                📊 Result
                              </button>
                              <button
                                className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors"
                                onClick={() => handleDelete(quiz.quizConfigId)}
                                title="Delete this quiz"
                              >
                                🗑️ Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                          <div className="text-lg">No quiz configurations found</div>
                          <p className="text-sm mt-2">Create a new quiz to get started</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default MyQuizzes;
