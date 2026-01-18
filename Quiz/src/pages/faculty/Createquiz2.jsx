import React, { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "../../components/Navbar";
import { useNavigate } from "react-router-dom";

const CreateQuiz2 = () => {
  const navigate = useNavigate();

  const [facultyDetails, setFacultyDetails] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [quizConfigsForForm, setQuizConfigsForForm] = useState([]);
  const [quizConfigsForTable, setQuizConfigsForTable] = useState([]);

  const [title, setTitle] = useState("");
  const [timeLimit, setTimeLimit] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [categorySearch, setCategorySearch] = useState("");
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [subcategories, setSubcategories] = useState([]);
  const [subcategorySearch, setSubcategorySearch] = useState("");
  const [selectedSubs, setSelectedSubs] = useState({});
  const [editId, setEditId] = useState(null);

  const [selectedDate, setSelectedDate] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");

  /* ================= AUTH CHECK ================= */
  useEffect(() => {
    const storedFaculty = localStorage.getItem("facultyDetails");
    if (!storedFaculty) {
      navigate("/");
    } else {
      setFacultyDetails(JSON.parse(storedFaculty));
    }
  }, [navigate]);

  /* ================= FORM DATA ================= */
  useEffect(() => {
    const fetchFormData = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_APP}/api/quizzes/grouped-categories2`
        );
        setQuizConfigsForForm(res.data?.data || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchFormData();
  }, []);

  /* ================= TABLE DATA ================= */
  const fetchTableData = async () => {
    if (!facultyDetails?.id) return;
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_APP}/api/quizzes/gettabledata`,
        { params: { facultyId: facultyDetails.id } }
      );
      setQuizConfigsForTable(res.data?.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (facultyDetails?.id) fetchTableData();
  }, [facultyDetails]);

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
        alert("Updated successfully");
      } else {
        await axios.post(
          `${import.meta.env.VITE_APP}/api/quizzes/create-config`,
          {
            title,
            timeLimit,
            category: selectedCategory,
            selections,
            facultyId: facultyDetails.id,
          }
        );
        alert("Created successfully");
      }
      resetForm();
      fetchTableData();
    } catch (err) {
      alert("Operation failed");
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
    fetchTableData();
  };

  const handleSeeResult = (id) => navigate(`/seeresult/${id}`);

  /* ================= DATE & DEPARTMENT FILTER ================= */
  const availableDates = [
    ...new Set(
      quizConfigsForTable.map((q) =>
        new Date(q.createdAt).toISOString().split("T")[0]
      )
    ),
  ];

  const availableDepartments = [
    ...new Set(
      quizConfigsForTable.map((q) => q.createdBy?.department).filter(Boolean)
    ),
  ];

  const filteredTableData = quizConfigsForTable.filter((q) => {
    const dateMatch = !selectedDate || new Date(q.createdAt).toISOString().split("T")[0] === selectedDate;
    const deptMatch = !selectedDepartment || q.createdBy?.department === selectedDepartment;
    return dateMatch && deptMatch;
  });

  const groupedQuizConfigs = filteredTableData.reduce((acc, item) => {
    if (!acc[item.quizConfigId]) {
      acc[item.quizConfigId] = {
        quizConfigId: item.quizConfigId,
        title: item.title,
        category: item.category,
        createdAt: item.createdAt,
        createdBy: item.createdBy,
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

  /* ================= UI ================= */
  return (
    <div className="bg-gray-50 min-h-screen">
      <Navbar
        userName={facultyDetails?.name}
        onProfileClick={() => setSidebarOpen(!sidebarOpen)}
      />

      <div className="p-6">
        {/* ================= FORM ================= */}
        <div className="bg-white border rounded-lg p-6 mb-6 shadow-sm">
          <h5 className="mb-4 fw-semibold">
            {editId ? "Update Quiz Config" : "Create Quiz Config"}
          </h5>

          <form onSubmit={handleSubmit}>
            <input
              className="form-control mb-3"
              placeholder="Quiz Title"
              value={title}
              disabled={!!editId}
              onChange={(e) => setTitle(e.target.value)}
              required
            />

            {!editId && (
              <input
                type="number"
                className="form-control mb-3"
                placeholder="Time Limit (min)"
                value={timeLimit}
                onChange={(e) => setTimeLimit(e.target.value)}
                required
              />
            )}

            <div className="mb-3 position-relative">
              <div className="d-flex align-items-center">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search & Select Category"
                  value={selectedCategory ? selectedCategory : categorySearch}
                  disabled={!!editId}
                  onChange={(e) => {
                    const value = e.target.value;
                    setCategorySearch(value);
                    setShowCategoryDropdown(true);
                    // Only clear selectedCategory if user is actively typing
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
                    className="btn btn-sm btn-outline-secondary ms-2"
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
                  className="position-absolute bg-white border rounded mt-1 w-100"
                  style={{
                    zIndex: 1000,
                    maxHeight: "200px",
                    overflowY: "auto",
                    top: "calc(100% + 2px)",
                    left: 0,
                  }}
                >
                  {getFilteredCategories().length > 0 ? (
                    getFilteredCategories().map((c) => (
                      <div
                        key={c}
                        className="p-2 cursor-pointer"
                        style={{
                          cursor: "pointer",
                          padding: "10px 12px",
                          borderBottom: "1px solid #eee",
                          fontWeight: c === selectedCategory ? "bold" : "normal",
                          backgroundColor: c === selectedCategory ? "#e7f3ff" : "white",
                        }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleCategoryChange(c);
                        }}
                        onMouseEnter={(e) => {
                          if (c !== selectedCategory) {
                            e.target.style.backgroundColor = "#f0f0f0";
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = c === selectedCategory ? "#e7f3ff" : "white";
                        }}
                      >
                        {c}
                      </div>
                    ))
                  ) : (
                    <div className="p-2 text-muted">No categories found</div>
                  )}
                </div>
              )}
            </div>

            {subcategories.length > 0 && (
              <div className="mb-3">
                <input
                  type="text"
                  className="form-control mb-2"
                  placeholder="Search Subcategory"
                  value={subcategorySearch}
                  onChange={(e) => setSubcategorySearch(e.target.value)}
                />
                {getFilteredSubcategories().map((s) => (
                  <div key={s.name} className="d-flex align-items-center mb-2">
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
                    />
                    <span className="mx-3">{s.name}</span>
                    <input
                      type="number"
                      className="form-control w-25"
                      value={selectedSubs[s.name] || ""}
                      disabled={!selectedSubs[s.name]}
                      onChange={(e) =>
                        handleQuestionCount(s.name, e.target.value)
                      }
                    />
                    <span className="ms-2 text-muted">
                      / {s.questionsAvailable}
                    </span>
                  </div>
                ))}
                {getFilteredSubcategories().length === 0 && subcategories.length > 0 && (
                  <div className="text-muted">No subcategories match your search</div>
                )}
              </div>
            )}

            <button className="btn btn-success mt-3">
              {editId ? "Update" : "Create"}
            </button>
          </form>
        </div>

        {/* ================= TABLE ================= */}
        <div className="bg-white border rounded-lg shadow-sm">
          <div className="p-4 bg-dark text-white">
            <h5 className="mb-3">Quiz Configuration Summary</h5>
            <div className="d-flex gap-3" style={{ flexWrap: "wrap" }}>
              <div className="flex-grow-1" style={{ minWidth: "250px" }}>
                <label className="form-label text-white mb-2">Filter by Date</label>
                <select
                  className="form-select"
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
              {facultyDetails?.isAdmin && availableDepartments.length > 0 && (
                <div className="flex-grow-1" style={{ minWidth: "250px" }}>
                  <label className="form-label text-white mb-2">Filter by Department</label>
                  <select
                    className="form-select"
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
              )}
            </div>
          </div>

          <div className="p-4 table-responsive">
            <table className="table table-bordered table-hover">
              <thead className="table-dark">
                <tr>
                  <th>#</th>
                  <th>Title</th>
                  {facultyDetails?.isAdmin && <th>Created By</th>}
                  <th>Category</th>
                  <th>Date & Time</th>
                  <th>Subcategories</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {Object.values(groupedQuizConfigs).map((quiz, i) => (
                  <tr key={quiz.quizConfigId}>
                    <td>{i + 1}</td>
                    <td>{quiz.title}</td>

                    {facultyDetails?.isAdmin && (
                      <td>
                        <b>{quiz.createdBy?.name}</b>
                        <div className="text-muted text-sm">
                          {quiz.createdBy?.department}
                        </div>
                      </td>
                    )}

                    <td>
                      <span className="badge bg-primary">
                        {quiz.category}
                      </span>
                    </td>

                    <td>{new Date(quiz.createdAt).toLocaleString()}</td>

                    <td>
                      {quiz.subcategories.map((s, j) => (
                        <div key={j}>
                          {s.name}: {s.selected}/{s.available}
                        </div>
                      ))}
                    </td>

                    <td>
                      <button
                        className="btn btn-sm btn-warning me-2"
                        onClick={() => handleEdit(quiz)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-sm btn-primary me-2"
                        onClick={() =>
                          handleSeeResult(quiz.quizConfigId)
                        }
                      >
                        Result
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() =>
                          handleDelete(quiz.quizConfigId)
                        }
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}

                {Object.values(groupedQuizConfigs).length === 0 && (
                  <tr>
                    <td colSpan="7" className="text-center text-muted">
                      No data found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateQuiz2;
