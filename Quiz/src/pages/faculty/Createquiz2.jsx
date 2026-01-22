import React, { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import { useNavigate, useLocation } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";

const CreateQuiz2 = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [facultyDetails, setFacultyDetails] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [quizConfigsForForm, setQuizConfigsForForm] = useState([]);

  const [title, setTitle] = useState("");
  const [timeLimit, setTimeLimit] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [categorySearch, setCategorySearch] = useState("");
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [subcategories, setSubcategories] = useState([]);
  const [subcategorySearch, setSubcategorySearch] = useState("");
  const [selectedSubs, setSelectedSubs] = useState({});
  const [editId, setEditId] = useState(null);

  /* ================= AUTH CHECK ================= */
  useEffect(() => {
    const storedFaculty = localStorage.getItem("facultyDetails");
    if (!storedFaculty) {
      navigate("/");
    } else {
      setFacultyDetails(JSON.parse(storedFaculty));
    }
  }, [navigate]);

  /* ================= REFRESH CATEGORIES ================= */
  const refreshCategories = async () => {
    try {
      console.log("\n[CREATE_QUIZ2] 🔄 REFRESHING CATEGORIES");
      console.log("[CREATE_QUIZ2] Endpoint: /api/quizzes/grouped-categories2");
      
      const res = await axios.get(
        `${import.meta.env.VITE_APP}/api/quizzes/grouped-categories2`
      );
      
      console.log("[CREATE_QUIZ2] Response received:", res.status);
      console.log("[CREATE_QUIZ2] Response data:", res.data);
      
      const categories = res.data?.data || [];
      console.log("[CREATE_QUIZ2] ✅ Parsed " + categories.length + " category/subcategory combinations");
      
      if (categories.length > 0) {
        console.log("[CREATE_QUIZ2] Categories found:");
        categories.forEach(q => {
          console.log("[CREATE_QUIZ2]   ✓ " + q.category + " / " + q.subcategory + " (" + q.totalQuestionsAvailable + " questions)");
        });
      } else {
        console.log("[CREATE_QUIZ2] ⚠️ No categories found in response");
      }
      
      setQuizConfigsForForm(categories);
      toast.success("✅ Categories loaded!", { duration: 1500 });
      return categories;
    } catch (err) {
      console.error("[CREATE_QUIZ2] ❌ Error refreshing categories:", err);
      console.error("[CREATE_QUIZ2] Error message:", err.message);
      console.error("[CREATE_QUIZ2] Error response:", err.response?.data);
      toast.error("❌ Failed to refresh categories", { duration: 3000 });
      setQuizConfigsForForm([]);
      return [];
    }
  };

  /* ================= FORM DATA - LOAD ON MOUNT ================= */
  useEffect(() => {
    // Initial load only - no auto-refresh
    refreshCategories();
  }, []);

  /* ================= LOAD EDIT QUIZ IF NAVIGATING FROM MYQUIZZES ================= */
  useEffect(() => {
    if (location.state?.editQuiz) {
      const quiz = location.state.editQuiz;
      console.log("[CREATE_QUIZ2] Loading edit quiz:", quiz);
      setEditId(quiz.quizConfigId);
      setTitle(quiz.title);
      setSelectedCategory(quiz.category);
      setTimeLimit(quiz.timeLimit || "");
      
      // Load subcategories for the selected category
      const subs = {};
      quiz.subcategories.forEach((s) => (subs[s.name] = s.selected));
      setSelectedSubs(subs);
      
      setSubcategories(
        quiz.subcategories.map((s) => ({
          name: s.name,
          questionsAvailable: s.available || 0,
        }))
      );
    }
  }, [location.state]);

  /* ================= CATEGORY ================= */
  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setCategorySearch("");
    setShowCategoryDropdown(false);
    setSubcategorySearch("");
    setSelectedSubs({});

    const subs = quizConfigsForForm
      .filter((q) => q.category === category)
      .map((q) => ({
        name: q.subcategory,
        questionsAvailable: q.totalQuestionsAvailable,
      }));

    setSubcategories(subs);
  };

  const getFilteredCategories = () => {
    const allCategories = [...new Set(quizConfigsForForm.map((q) => q.category))];
    return allCategories.filter((c) =>
      c.toLowerCase().includes(categorySearch.toLowerCase())
    );
  };

  const getFilteredSubcategories = () => {
    return subcategories.filter((s) =>
      s.name.toLowerCase().includes(subcategorySearch.toLowerCase())
    );
  };

  const handleQuestionCount = (sub, value) => {
    const max =
      subcategories.find((s) => s.name === sub)?.questionsAvailable || 0;
    let count = Number(value);
    if (count > max) count = max;
    if (count < 1) count = 1;
    setSelectedSubs((prev) => ({ ...prev, [sub]: count }));
  };

  const resetForm = () => {
    setTitle("");
    setTimeLimit("");
    setSelectedCategory("");
    setCategorySearch("");
    setShowCategoryDropdown(false);
    setSubcategorySearch("");
    setSubcategories([]);
    setSelectedSubs({});
    setEditId(null);
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = async (e) => {
    e.preventDefault();

    const selections = Object.entries(selectedSubs).map(([sub, count]) => ({
      subcategory: sub,
      questionCount: count,
    }));

    try {
      if (editId) {
        await axios.put(
          `${import.meta.env.VITE_APP}/api/quizzes/config/${editId}`,
          { selections, facultyId: facultyDetails.id }
        );
        toast.success("Updated successfully");
      } else {
        await axios.post(
          `${import.meta.env.VITE_APP}/api/quizzes/create-config`,
          {
            title,
            timeLimit: parseInt(timeLimit, 10), // ✅ Convert to integer
            category: selectedCategory,
            selections,
            facultyId: facultyDetails.id,
          }
        );
        toast.success("Created successfully");
      }
      resetForm();
    } catch (err) {
      toast.error("Operation failed");
    }
  };

  /* ================= ACTIONS ================= */
  const handleEdit = (quiz) => {
    setEditId(quiz.quizConfigId);
    setTitle(quiz.title);
    setSelectedCategory(quiz.category);
    setCategorySearch("");
    setShowCategoryDropdown(false);
    setSubcategorySearch("");

    const subs = {};
    quiz.subcategories.forEach((s) => (subs[s.name] = s.selected));
    setSelectedSubs(subs);

    setSubcategories(
      quiz.subcategories.map((s) => ({
        name: s.name,
        questionsAvailable: s.available,
      }))
    );

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this quiz?")) return;
    await axios.delete(
      `${import.meta.env.VITE_APP}/api/quizzes/config/${id}`,
      { data: { facultyId: facultyDetails.id } }
    );
    toast.success("Quiz deleted successfully");
  };

  const handleSeeResult = (id) => navigate(`/quiz-results/${id}`);

  /* ================= UI ================= */
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Toaster />
      <Sidebar />
      
      <div className="flex-1">
        <Navbar
          userName={facultyDetails?.name}
          onProfileClick={() => setSidebarOpen(!sidebarOpen)}
        />

        <div className="p-6">
        {/* ================= FORM ================= */}
        <div className="bg-white border rounded-lg p-6 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h5 className="fw-semibold m-0">
              {editId ? "Update Quiz Config" : "Create Quiz Config"}
            </h5>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Quiz Title</label>
              <input
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter quiz title"
                value={title}
                disabled={!!editId}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            {!editId && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Time Limit (minutes)</label>
                <input
                  type="number"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter time limit"
                  value={timeLimit}
                  onChange={(e) => setTimeLimit(e.target.value)}
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Select Category</label>
              <div className="relative">
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Search & select category"
                    value={selectedCategory ? selectedCategory : categorySearch}
                    disabled={!!editId}
                    onChange={(e) => {
                      const value = e.target.value;
                      setCategorySearch(value);
                      setShowCategoryDropdown(true);
                      if (selectedCategory && value !== selectedCategory) {
                        setSelectedCategory("");
                      }
                    }}
                    onFocus={() => {
                      setShowCategoryDropdown(true);
                      if (selectedCategory) {
                        setCategorySearch("");
                      }
                    }}
                    onBlur={() => {
                      setTimeout(() => {
                        setShowCategoryDropdown(false);
                        setCategorySearch("");
                      }, 200);
                    }}
                    required
                  />
                  {selectedCategory && (
                    <button
                      type="button"
                      className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                      onClick={() => {
                        setSelectedCategory("");
                        setCategorySearch("");
                        setShowCategoryDropdown(false);
                        setSubcategories([]);
                        setSelectedSubs({});
                      }}
                    >
                      ✕ Clear
                    </button>
                  )}
                </div>
                {showCategoryDropdown && !editId && (
                  <div
                    className="absolute w-full bg-white border border-gray-300 rounded-lg mt-1 shadow-lg z-10"
                    style={{
                      maxHeight: "200px",
                      overflowY: "auto",
                    }}
                  >
                    {getFilteredCategories().length > 0 ? (
                      getFilteredCategories().map((c) => (
                        <div
                          key={c}
                          className="px-4 py-3 cursor-pointer border-b border-gray-200 last:border-b-0 hover:bg-blue-50 transition-colors"
                          style={{
                            fontWeight: c === selectedCategory ? "600" : "normal",
                            backgroundColor: c === selectedCategory ? "#eff6ff" : "white",
                          }}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleCategoryChange(c);
                          }}
                        >
                          {c}
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-gray-500">No categories found</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {subcategories.length > 0 && (
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-700">Select Subcategories & Questions</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Search subcategories..."
                  value={subcategorySearch}
                  onChange={(e) => setSubcategorySearch(e.target.value)}
                />
                <div className="space-y-3 mt-4">
                  {getFilteredSubcategories().map((s) => (
                    <div key={s.name} className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3 flex-1">
                          <input
                            type="checkbox"
                            checked={selectedSubs[s.name] > 0}
                            onChange={(e) =>
                              setSelectedSubs((prev) =>
                                e.target.checked
                                  ? { ...prev, [s.name]: 1 }
                                  : (() => {
                                      const x = { ...prev };
                                      delete x[s.name];
                                      return x;
                                    })()
                              )
                            }
                            className="w-5 h-5 cursor-pointer accent-blue-500"
                          />
                          <span className="font-semibold text-gray-800">{s.name}</span>
                        </div>
                        <span className="text-sm font-medium text-gray-600 bg-gray-100 px-3 py-1 rounded">
                          Max: {s.questionsAvailable}
                        </span>
                      </div>
                      
                      {selectedSubs[s.name] > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-gray-600 w-24">Select: {selectedSubs[s.name]}</span>
                            <input
                              type="range"
                              min="1"
                              max={s.questionsAvailable}
                              value={selectedSubs[s.name] || 1}
                              onChange={(e) =>
                                handleQuestionCount(s.name, e.target.value)
                              }
                              className="flex-1 h-2 bg-blue-300 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />
                            <div className="bg-blue-500 text-white rounded-lg px-4 py-2 font-bold text-center w-14">
                              {selectedSubs[s.name]}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  {getFilteredSubcategories().length === 0 && subcategories.length > 0 && (
                    <div className="text-center py-6 text-gray-500">No subcategories match your search</div>
                  )}
                </div>
              </div>
            )}

            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors mt-4">
              {editId ? "Update Quiz" : "Create Quiz"}
            </button>
          </form>
        </div>

        {/* LINK TO MY QUIZZES */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 rounded-lg p-6 mb-6">
          <p className="text-gray-800 font-semibold mb-3">📚 View your created quizzes</p>
          <button
            onClick={() => navigate("/myquizzes")}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
          >
            Go to My Quizzes →
          </button>
        </div>
        </div>
      </div>
    </div>
  );
};

export default CreateQuiz2;
