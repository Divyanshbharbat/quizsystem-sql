import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";
import toast, { Toaster } from "react-hot-toast";
import { FaArrowLeft } from "react-icons/fa";
import { FiEye, FiEyeOff } from "react-icons/fi";
import Papa from "papaparse";

const AllStudents = () => {
  const navigate = useNavigate();
  const facultyDetails = JSON.parse(localStorage.getItem("facultyDetails"));
  const fileInputRef = useRef();

  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");

  // Edit form state
  const [editFormData, setEditFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });

  // Student upload form states
  const [newStudent, setNewStudent] = useState({
    studentId: "",
    name: "",
    email: "",
    phone: "",
    department: "",
    year: "",
  });

  const [uploadingCSV, setUploadingCSV] = useState(false);
  const [csvFile, setCSVFile] = useState(null);

  // Fetch all students
  useEffect(() => {
    if (!facultyDetails?.isAdmin) {
      toast.error("Only admins can access this page");
      navigate("/");
      return;
    }
    fetchAllStudents();
  }, []);

  const fetchAllStudents = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${import.meta.env.VITE_APP}/api/student?department=*`);
      if (res.data.success) {
        setStudents(res.data.data || []);
        setFilteredStudents(res.data.data || []);
      } else {
        toast.error("Failed to fetch students");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error fetching students");
    } finally {
      setLoading(false);
    }
  };

  // Filter students based on search and filters
  useEffect(() => {
    let filtered = students;

    if (searchTerm) {
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterYear) {
      filtered = filtered.filter((s) => String(s.year) === String(filterYear));
    }

    if (filterDepartment) {
      filtered = filtered.filter((s) => s.department === filterDepartment);
    }

    setFilteredStudents(filtered);
  }, [searchTerm, filterYear, filterDepartment, students]);

  const handleStudentClick = async (student) => {
    setSelectedStudent(student);
    try {
      console.log("[AllStudents] Fetching submissions for student ID:", student.id);
      const res = await axios.get(
        `${import.meta.env.VITE_APP}/api/student/submissions/${student.id}`
      );
      console.log("[AllStudents] Submissions response:", res.data);
      if (res.data.success) {
        setSubmissions(res.data.submissions || []);
        if (!res.data.submissions || res.data.submissions.length === 0) {
          toast.info("No quiz submissions found for this student");
        }
      }
    } catch (err) {
      console.error("[AllStudents] Error fetching submissions:", err);
      toast.error("Failed to load submissions: " + err.message);
      setSubmissions([]);
    }
  };

  const departments = [...new Set(students.map((s) => s.department))].sort();
  const years = ["1", "2", "3", "4"];

  // Add single student
  const handleAddStudent = async () => {
    if (!newStudent.studentId || !newStudent.name || !newStudent.email || !newStudent.department || !newStudent.year) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      const res = await axios.post(`${import.meta.env.VITE_APP}/api/student/register`, newStudent);
      if (res.data.success) {
        toast.success("✅ Student added successfully");
        setNewStudent({ studentId: "", name: "", email: "", phone: "", department: "", year: "" });
        
        // Add small delay and then refresh to ensure database is updated
        await new Promise(resolve => setTimeout(resolve, 500));
        await fetchAllStudents();
      }
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || "Error adding student";
      toast.error(`❌ ${msg}`);
    }
  };

  // Edit student
  const handleEditClick = async (student) => {
    try {
      console.log("[AllStudents] Editing student ID:", student.id);
      // Fetch full student details with password for admin view
      const res = await axios.get(`${import.meta.env.VITE_APP}/api/student/admin/password/${student.id}`);
      console.log("[AllStudents] Password API response:", res.data);
      const fullStudent = res.data.data || student;
      console.log("[AllStudents] Full student data:", fullStudent);
      console.log("[AllStudents] Password value:", fullStudent.password);
      setEditingStudent(fullStudent);
      setCurrentPassword(fullStudent.password || "");
      setEditFormData({
        name: fullStudent.name,
        email: fullStudent.email,
        phone: fullStudent.phone || "",
        password: "",
      });
      setShowEditModal(true);
      setShowPassword(false);
      toast.success("Student details loaded");
    } catch (err) {
      console.error("[AllStudents] Password API error:", err);
      console.error("[AllStudents] Error response:", err.response?.data);
      toast.error(`Error loading password: ${err.response?.data?.message || err.message}`);
      // Fallback to basic student data
      setEditingStudent(student);
      setCurrentPassword(student.password || "");
      setEditFormData({
        name: student.name,
        email: student.email,
        phone: student.phone || "",
        password: "",
      });
      setShowEditModal(true);
      setShowPassword(false);
    }
  };

  const handleDeleteStudent = async (studentId) => {
    if (!window.confirm("Are you sure you want to delete this student? This action cannot be undone.")) {
      return;
    }

    try {
      console.log("[AllStudents] Deleting student:", studentId);
      const res = await axios.delete(
        `${import.meta.env.VITE_APP}/api/student/delete/${studentId}`
      );
      console.log("[AllStudents] Delete response:", res.data);
      if (res.data.success) {
        toast.success("Student deleted successfully");
        await fetchAllStudents();
        setSelectedStudent(null);  // Clear selected student view
      } else {
        toast.error(res.data.message || "Failed to delete student");
      }
    } catch (err) {
      console.error("[AllStudents] Delete error:", err);
      console.error("[AllStudents] Error response:", err.response?.data);
      const msg = err.response?.data?.message || "Error deleting student";
      toast.error(msg);
    }
  };

  const handleUpdateStudent = async () => {
    if (!editFormData.name || !editFormData.email) {
      toast.error("Name and Email are required");
      return;
    }

    try {
      const updateData = {
        name: editFormData.name,
        email: editFormData.email,
        phone: editFormData.phone || "",
      };
      if (editFormData.password) {
        updateData.password = editFormData.password;
      }

      const res = await axios.put(
        `${import.meta.env.VITE_APP}/api/student/update/${editingStudent.id}`,
        updateData
      );
      if (res.data.success) {
        toast.success("Student updated successfully");
        setShowEditModal(false);
        fetchAllStudents();
      }
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || "Error updating student";
      toast.error(msg);
    }
  };

  // Upload CSV
  const handleCSVUpload = async () => {
    if (!csvFile) {
      toast.error("Please select a CSV file");
      return;
    }

    setUploadingCSV(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const csv = e.target.result;
        const results = Papa.parse(csv, { header: true });
        
        const res = await axios.post(`${import.meta.env.VITE_APP}/api/student/upload-csv`, {
          csvData: csv,
        });

        if (res.data.success) {
          toast.success(`✅ ${res.data.message || "CSV uploaded successfully"}`);
          setCSVFile(null);
          fileInputRef.current.value = "";
          
          // Add small delay and then refresh to ensure database is updated
          await new Promise(resolve => setTimeout(resolve, 500));
          await fetchAllStudents();
        }
      } catch (err) {
        console.error(err);
        toast.error(err.response?.data?.message || "CSV upload failed");
      } finally {
        setUploadingCSV(false);
      }
    };
    reader.readAsText(csvFile);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <Toaster />

      <div className="flex flex-col flex-1 h-screen overflow-hidden">
        <Navbar
          userName={facultyDetails?.name || "Student Details"}
          onProfileClick={() => navigate(-1)}
        />

        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-gray-800">All Students</h2>
              <button
                onClick={() => setShowUploadForm(!showUploadForm)}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors"
              >
                {showUploadForm ? "Close" : "Add Students"}
              </button>
            </div>

            {/* UPLOAD FORM SECTION */}
            {showUploadForm && (
              <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                <h3 className="text-2xl font-bold mb-6 text-gray-800">➕ Add New Students</h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Manual Entry */}
                  <div className="p-6 border border-gray-200 rounded-lg">
                    <h4 className="text-lg font-bold mb-4 text-gray-800">Add Manually</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Student ID *</label>
                        <input
                          type="text"
                          placeholder="e.g., CS001"
                          value={newStudent.studentId}
                          onChange={(e) => setNewStudent({ ...newStudent, studentId: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Name *</label>
                        <input
                          type="text"
                          placeholder="Student name"
                          value={newStudent.name}
                          onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Email *</label>
                        <input
                          type="email"
                          placeholder="student@college.edu"
                          value={newStudent.email}
                          onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Phone (Optional)</label>
                        <input
                          type="text"
                          placeholder="10-digit number"
                          value={newStudent.phone}
                          onChange={(e) => setNewStudent({ ...newStudent, phone: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Department *</label>
                        <select
                          value={newStudent.department}
                          onChange={(e) => setNewStudent({ ...newStudent, department: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                        >
                          <option value="">Select Department</option>
                          <option value="IT">IT</option>
                          <option value="CIVIL">CIVIL</option>
                          <option value="DS">DS</option>
                          <option value="Computer Science">Computer Science</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Year *</label>
                        <select
                          value={newStudent.year}
                          onChange={(e) => setNewStudent({ ...newStudent, year: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                        >
                          <option value="">Select Year</option>
                          <option value="1">1st Year</option>
                          <option value="2">2nd Year</option>
                          <option value="3">3rd Year</option>
                          <option value="4">4th Year</option>
                        </select>
                      </div>
                      <button
                        onClick={handleAddStudent}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                      >
                        Add Student
                      </button>
                    </div>
                  </div>

                  {/* CSV Upload */}
                  <div className="p-6 border border-gray-200 rounded-lg">
                    <h4 className="text-lg font-bold mb-4 text-gray-800">Upload CSV</h4>
                    <div className="border-2 border-dashed border-green-300 rounded-lg p-6 text-center mb-4">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv"
                        onChange={(e) => setCSVFile(e.target.files[0])}
                        className="hidden"
                        id="csvInput"
                      />
                      <label htmlFor="csvInput" className="cursor-pointer">
                        <p className="font-semibold text-gray-700">Click to select CSV file</p>
                        <p className="text-sm text-gray-600 mt-1">Format: CSV with studentId, name, email, phone, department, year</p>
                        {csvFile && (
                          <p className="mt-2 text-green-600 font-medium">✓ {csvFile.name}</p>
                        )}
                      </label>
                    </div>
                    <button
                      onClick={handleCSVUpload}
                      disabled={!csvFile || uploadingCSV}
                      className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                    >
                      {uploadingCSV ? "Uploading..." : "Upload CSV"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {!selectedStudent ? (
              <>
                {/* Filters */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Search (Name/ID/Email)
                      </label>
                      <input
                        type="text"
                        placeholder="Search students..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Year
                      </label>
                      <select
                        value={filterYear}
                        onChange={(e) => setFilterYear(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      >
                        <option value="">All Years</option>
                        {years.map((year) => (
                          <option key={year} value={year}>
                            Year {year}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Department
                      </label>
                      <select
                        value={filterDepartment}
                        onChange={(e) => setFilterDepartment(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      >
                        <option value="">All Departments</option>
                        {departments.map((dept) => (
                          <option key={dept} value={dept}>
                            {dept}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={() => {
                          setSearchTerm("");
                          setFilterYear("");
                          setFilterDepartment("");
                        }}
                        className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors"
                      >
                        Clear Filters
                      </button>
                    </div>
                  </div>
                </div>

                {/* Student Count */}
                <div className="mb-4 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-lg">
                  <p className="text-sm text-blue-700 font-medium">
                    📊 Showing <strong>{filteredStudents.length}</strong> of{" "}
                    <strong>{students.length}</strong> students
                  </p>
                </div>

                {/* Students Table */}
                {loading ? (
                  <div className="text-center py-8 text-gray-600">Loading students...</div>
                ) : filteredStudents.length > 0 ? (
                  <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                            <th className="px-6 py-3 text-left text-sm font-semibold">#</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold">Student ID</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold">Name</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold">Email</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold">Department</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold">Year</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold">Phone</th>
                            <th className="px-6 py-3 text-center text-sm font-semibold">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredStudents.map((student, index) => (
                            <tr
                              key={student.id}
                              className="border-b border-gray-200 hover:bg-blue-50 transition-colors"
                            >
                              <td className="px-6 py-4 text-sm text-gray-700 font-medium">{index + 1}</td>
                              <td className="px-6 py-4 text-sm text-gray-800 font-semibold">
                                {student.studentId}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-800">{student.name}</td>
                              <td className="px-6 py-4 text-sm text-gray-700">{student.email}</td>
                              <td className="px-6 py-4 text-sm">
                                <span className="bg-gray-100 px-3 py-1 rounded-full text-xs font-medium text-gray-800">
                                  {student.department}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-700">Year {student.year}</td>
                              <td className="px-6 py-4 text-sm text-gray-700">{student.phone || "-"}</td>
                              <td className="px-6 py-4 text-center">
                                <div className="flex gap-2 justify-center">
                                  <button
                                    onClick={() => handleStudentClick(student)}
                                    className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
                                    title="View Submissions"
                                  >
                                    View
                                  </button>
                                  <button
                                    onClick={() => handleEditClick(student)}
                                    className="px-3 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-sm font-medium transition-colors"
                                    title="Edit Details"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteStudent(student.id)}
                                    className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors"
                                    title="Delete Student"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-lg p-12 text-center">
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">No Students Found</h3>
                    <p className="text-gray-600">
                      No students match your search filters.
                    </p>
                  </div>
                )}
              </>
            ) : (
              /* Student Detail View */
              <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200">
                  <h3 className="text-2xl font-bold text-gray-800">{selectedStudent.name}</h3>
                  <button
                    onClick={() => setSelectedStudent(null)}
                    className="flex items-center py-2 px-4 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
                  >
                    <FaArrowLeft className="mr-2" />
                    Back
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg mb-6">
                  <p className="text-gray-700">
                    <span className="font-semibold">Student ID:</span> {selectedStudent.studentId}
                  </p>
                  <p className="text-gray-700">
                    <span className="font-semibold">Email:</span> {selectedStudent.email}
                  </p>
                  <p className="text-gray-700">
                    <span className="font-semibold">Phone:</span> {selectedStudent.phone || "-"}
                  </p>
                  <p className="text-gray-700">
                    <span className="font-semibold">Department:</span> {selectedStudent.department}
                  </p>
                  <p className="text-gray-700">
                    <span className="font-semibold">Year:</span> {selectedStudent.year}
                  </p>
                </div>

                <h4 className="text-lg font-semibold py-4 border-b border-gray-200 text-gray-800 mb-4">
                  Quiz Submissions ({submissions.length})
                </h4>

                {submissions.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full border border-gray-200">
                      <thead>
                        <tr className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                          <th className="px-6 py-3 text-left text-sm font-semibold">Quiz Title</th>
                          <th className="px-6 py-3 text-left text-sm font-semibold">Category</th>
                          <th className="px-6 py-3 text-center text-sm font-semibold">Score</th>
                          <th className="px-6 py-3 text-left text-sm font-semibold">Submitted At</th>
                          <th className="px-6 py-3 text-center text-sm font-semibold">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {submissions.map((sub) => {
                          const quiz = sub.Quiz || sub.quizId;
                          return (
                          <tr key={sub.id} className="border-b border-gray-200 hover:bg-blue-50 transition-colors">
                            <td className="px-6 py-4 text-sm font-semibold text-gray-800">
                              {quiz?.title || "Untitled Quiz"}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-700">
                              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold">
                                {quiz?.category || "N/A"}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <div className="flex flex-col items-center">
                                <span className="text-lg font-bold text-green-600">
                                  {sub.score || 0}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {quiz?.totalMarks ? `of ${quiz.totalMarks}` : "marks"}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-700">
                              {new Date(sub.submittedAt).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <button
                                onClick={() =>
                                  navigate(`/quiz-results/${quiz?.id}`, {
                                    state: {
                                      student: selectedStudent,
                                      submissionId: sub.id,
                                      quizTitle: quiz?.title || "Untitled Quiz",
                                    },
                                  })
                                }
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                              >
                                Details
                              </button>
                            </td>
                          </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-center text-gray-600 py-6">No quiz submissions found.</p>
                )}
              </div>
            )}
          </div>

            {/* Edit Student Modal */}
            {showEditModal && editingStudent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">Edit Student Details</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Name *</label>
                  <input
                    type="text"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email *</label>
                  <input
                    type="email"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData({...editFormData, phone: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Current Password</label>
                  <div className="relative flex items-center">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={currentPassword}
                      readOnly
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 text-gray-600 hover:text-gray-800 transition-colors"
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">New Password (optional)</label>
                  <div className="relative flex items-center">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={editFormData.password}
                      onChange={(e) => setEditFormData({...editFormData, password: e.target.value})}
                      placeholder="Leave blank to keep current password"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 text-gray-600 hover:text-gray-800 transition-colors"
                      title={showNewPassword ? "Hide password" : "Show password"}
                    >
                      {showNewPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleUpdateStudent}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  Update
                </button>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 bg-gray-400 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
            )}
        </main>
      </div>
    </div>
  );
};

export default AllStudents;
