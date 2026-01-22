import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "../../components/Navbar";
import Papa from "papaparse";
import toast, { Toaster } from "react-hot-toast";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("students"); // students | faculty
  
  // ==================== ADMIN INFO ====================
  const [adminDept, setAdminDept] = useState("");
  const [adminName, setAdminName] = useState("");
  
  // ==================== STUDENT MANAGEMENT STATE ====================
  const [students, setStudents] = useState([]);
  const [searchStudentTerm, setSearchStudentTerm] = useState("");
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedYear, setSelectedYear] = useState(null); // Track selected year
  const [selectedStudentDept, setSelectedStudentDept] = useState(""); // Department filter for students
  const [showStudentDetails, setShowStudentDetails] = useState(false);
  const [studentPasswordModal, setStudentPasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  const [formStudent, setFormStudent] = useState({
    name: "",
    email: "",
    phone: "",
    year: "",
    department: "",
  });

  // ==================== YEAR PROMOTION STATE ====================
  const [promoteModal, setPromoteModal] = useState(false);
  const [promoteYear, setPromoteYear] = useState(null);
  const [promoteDepartment, setPromoteDepartment] = useState("");
  const [skipStudentIds, setSkipStudentIds] = useState("");
  const [isPromoting, setIsPromoting] = useState(false);
  const [allDepartments, setAllDepartments] = useState([]);

  // ==================== FACULTY MANAGEMENT STATE ====================
  const [faculties, setFaculties] = useState([]);
  const [searchFacultyTerm, setSearchFacultyTerm] = useState("");
  const [filteredFaculties, setFilteredFaculties] = useState([]);
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [selectedFacultyDept, setSelectedFacultyDept] = useState(""); // Department filter for faculty
  const [editingFaculty, setEditingFaculty] = useState(null);
  const [viewFaculty, setViewFaculty] = useState(null);
  const [facultyPasswordModal, setFacultyPasswordModal] = useState(false);
  const [facultyOldPassword, setFacultyOldPassword] = useState("");
  const [facultyNewPassword, setFacultyNewPassword] = useState("");
  const [showOldPasswordFaculty, setShowOldPasswordFaculty] = useState(false);
  const [showNewPasswordFaculty, setShowNewPasswordFaculty] = useState(false);
  const [sessionFilter, setSessionFilter] = useState("");

  const [formFaculty, setFormFaculty] = useState({
    name: "",
    email: "",
    department: "",
    phone: "",
    isAdmin: false,
    subjects: [""],
    session: "",
    semester: "",
  });

  const [csvFaculties, setCsvFaculties] = useState([]);

  const formScrollRef = useRef();
  const formRef = useRef();

  const scrollToForm = () => {
    setTimeout(() => {
      formScrollRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 200);
  };

  // ==================== INITIALIZATION ====================
  useEffect(() => {
    const token = localStorage.getItem("facultyDetails");
    if (!token) navigate("/");
    const adminDetails = JSON.parse(token);
    setAdminDept(adminDetails.department);
    setAdminName(adminDetails.name || adminDetails.username || "Admin");
    setFormFaculty((prev) => ({ ...prev, department: adminDetails.department }));
  }, [navigate]);

  // ==================== STUDENT MANAGEMENT FUNCTIONS ====================
  const fetchStudents = async (year = null, department = null) => {
    try {
      // If selectedStudentDept is empty, fetch all departments using "*"
      const deptToFetch = department || selectedStudentDept || "*";
      let url = `${import.meta.env.VITE_APP}/api/student?department=${deptToFetch}`;
      if (year) {
        url += `&year=${year}`;
      }
      const res = await axios.get(url);
      if (res.data.success) {
        setStudents(res.data.data || []);
      }
    } catch (err) {
      console.error(err);
      toast.error("Error fetching students");
    }
  };

  useEffect(() => {
    if (adminDept || selectedStudentDept) {
      if (selectedYear) {
        fetchStudents(selectedYear);
      } else {
        fetchStudents();
      }
    }
  }, [adminDept, selectedYear, selectedStudentDept]);

  const handleYearClick = (year) => {
    setSelectedYear(year === selectedYear ? null : year);
  };

  // Filter students
  useEffect(() => {
    let filtered = students;
    if (searchStudentTerm.trim()) {
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(searchStudentTerm.toLowerCase()) ||
          s.studentId.toLowerCase().includes(searchStudentTerm.toLowerCase()) ||
          s.email.toLowerCase().includes(searchStudentTerm.toLowerCase())
      );
    }
    setFilteredStudents(filtered);
  }, [searchStudentTerm, students]);

  const handleEditStudent = (student) => {
    setSelectedStudent(student);
    setFormStudent({
      name: student.name,
      email: student.email,
      phone: student.phone,
      year: student.year,
      department: student.department,
    });
    setShowStudentDetails(true);
  };

  const handleUpdateStudent = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.put(
        `${import.meta.env.VITE_APP}/api/student/${selectedStudent.id}`,
        formStudent
      );
      if (res.data.success) {
        toast.success("Student updated successfully");
        setSelectedStudent(null);
        setShowStudentDetails(false);
        fetchStudents(selectedYear);
      }
    } catch (err) {
      console.error(err);
      toast.error("Error updating student");
    }
  };

  const handleUpdateStudentPassword = async () => {
    if (!newPassword.trim()) {
      toast.error("Password cannot be empty");
      return;
    }
    try {
      const res = await axios.put(
        `${import.meta.env.VITE_APP}/api/student/admin/password/${selectedStudent.studentId}`,
        { password: newPassword }
      );
      if (res.data.success) {
        toast.success("✅ Password updated successfully");
        setStudentPasswordModal(false);
        setNewPassword("");
        setOldPassword("");
      }
    } catch (err) {
      console.error(err);
      toast.error("❌ Error updating password");
    }
  };

  const handleDeleteStudent = async (id) => {
    if (!window.confirm("Are you sure you want to delete this student?")) return;
    try {
      const res = await axios.delete(`${import.meta.env.VITE_APP}/api/student/${id}`);
      if (res.data.success) {
        toast.success("Student deleted successfully");
        setSelectedStudent(null);
        setShowStudentDetails(false);
        fetchStudents(selectedYear);
      }
    } catch (err) {
      console.error(err);
      toast.error("Error deleting student");
    }
  };

  // ==================== YEAR PROMOTION FUNCTIONS ====================
  const fetchAllDepartments = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_APP}/api/student?department=*`);
      if (res.data.success && res.data.data) {
        const depts = [...new Set(res.data.data.map(s => s.department))];
        setAllDepartments(depts);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAllDepartments();
  }, []);

  const handlePromoteStudents = async () => {
    if (!promoteYear || !promoteDepartment) {
      toast.error("Please select year and department");
      return;
    }

    const excludeIds = skipStudentIds
      .split(",")
      .map(id => id.trim())
      .filter(id => id);

    setIsPromoting(true);
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_APP}/api/student/admin/promote-year`,
        {
          currentYear: promoteYear,
          department: promoteDepartment,
          excludeStudentIds: excludeIds,
        }
      );

      if (res.data.success) {
        toast.success(`Successfully promoted ${res.data.promoted} students to year ${promoteYear + 1}`);
        setPromoteModal(false);
        setPromoteYear(null);
        setPromoteDepartment("");
        setSkipStudentIds("");
        fetchStudents(selectedYear);
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Error promoting students");
    } finally {
      setIsPromoting(false);
    }
  };

  // ==================== FACULTY MANAGEMENT FUNCTIONS ====================
  const fetchFaculties = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_APP}/api/faculty/getall`);
      if (res.data.success) {
        // Filter by selected department or admin's department
        const deptToFilter = selectedFacultyDept || adminDept;
        const deptFaculties = res.data.data.filter(
          (f) => f.department === deptToFilter && !f.isAdmin
        );
        setFaculties(deptFaculties);
      }
    } catch (err) {
      console.error(err);
      toast.error("Error fetching faculties");
    }
  };

  useEffect(() => {
    if (adminDept) fetchFaculties();
  }, [adminDept, selectedFacultyDept]);

  // Filter faculties
  useEffect(() => {
    let filtered = faculties;
    if (searchFacultyTerm.trim()) {
      filtered = filtered.filter(
        (f) =>
          f.name.toLowerCase().includes(searchFacultyTerm.toLowerCase()) ||
          f.email.toLowerCase().includes(searchFacultyTerm.toLowerCase())
      );
    }
    if (sessionFilter.trim()) {
      filtered = filtered.filter((f) => f.session === sessionFilter);
    }
    setFilteredFaculties(filtered);
  }, [searchFacultyTerm, sessionFilter, faculties]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormFaculty((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubjectChange = (index, value) => {
    const newSubjects = [...formFaculty.subjects];
    newSubjects[index] = value;
    setFormFaculty((prev) => ({ ...prev, subjects: newSubjects }));
  };

  const addSubjectField = () => {
    setFormFaculty((prev) => ({ ...prev, subjects: [...prev.subjects, ""] }));
  };

  const handleAddOrUpdateFaculty = async (e) => {
    e.preventDefault();

    if (!formFaculty.session || !formFaculty.semester) {
      toast.error("Session and Semester are required");
      return;
    }

    try {
      if (editingFaculty) {
        const res = await axios.put(
          `${import.meta.env.VITE_APP}/api/faculty/update/${editingFaculty.id}`,
          formFaculty
        );
        if (res.data.success) {
          toast.success("Faculty updated successfully!");
          setEditingFaculty(null);
          setFormFaculty({
            name: "",
            email: "",
            department: adminDept,
            phone: "",
            isAdmin: false,
            subjects: [""],
            session: "",
            semester: "",
          });
          fetchFaculties();
        }
      } else {
        const res = await axios.post(
          `${import.meta.env.VITE_APP}/api/faculty/register`,
          formFaculty
        );
        if (res.data.success) {
          toast.success("Faculty added successfully!");
          setFormFaculty({
            name: "",
            email: "",
            department: adminDept,
            phone: "",
            isAdmin: false,
            subjects: [""],
            session: "",
            semester: "",
          });
          fetchFaculties();
        }
      }
    } catch (err) {
      console.error(err);
      const message = err.response?.data?.message;
      if (message === "duplicate_email") {
        toast.error("Email already exists");
      } else if (message === "duplicate_phone") {
        toast.error("Mobile number already exists");
      } else {
        toast.error(message || "Error saving faculty");
      }
    }
  };

  const handleEditFaculty = async (faculty) => {
    setEditingFaculty(faculty);
    setFormFaculty({
      name: faculty.name,
      email: faculty.email,
      department: faculty.department,
      phone: faculty.phone,
      isAdmin: faculty.isAdmin,
      subjects: faculty.subjects || [""],
      session: faculty.session,
      semester: faculty.semester,
    });
    scrollToForm();
  };

  const handleUpdateFacultyPassword = async () => {
    if (!facultyNewPassword.trim()) {
      toast.error("Password cannot be empty");
      return;
    }
    try {
      const res = await axios.put(
        `${import.meta.env.VITE_APP}/api/faculty/admin/password/${editingFaculty.id}`,
        { password: facultyNewPassword }
      );
      if (res.data.success) {
        toast.success("Password updated successfully");
        setFacultyPasswordModal(false);
        setFacultyNewPassword("");
        setFacultyOldPassword("");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error updating password");
    }
  };

  const handleDeleteFaculty = async (id) => {
    if (!window.confirm("Are you sure you want to delete this faculty?")) return;
    try {
      const res = await axios.delete(
        `${import.meta.env.VITE_APP}/api/faculty/delete/${id}`
      );
      if (res.data.success) {
        toast.success("Faculty deleted!");
        setEditingFaculty(null);
        setViewFaculty(null);
        fetchFaculties();
      }
    } catch (err) {
      console.error(err);
      toast.error("Error deleting faculty");
    }
  };

  const handleCSVFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsedData = results.data.map((row) => ({
          name: row.name,
          email: row.email,
          department: adminDept,
          phone: row.phone,
          isAdmin: row.isAdmin === "true" || row.isAdmin === true,
          subjects: row.subjects ? row.subjects.split(";") : [],
          session: row.session || "",
          semester: row.semester || "",
          password: row.phone,
        }));
        setCsvFaculties(parsedData);
      },
    });
  };

  const handleCSVSubmit = async () => {
    if (!csvFaculties.length) return alert("Upload CSV first!");

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_APP}/api/faculty/upload-csv`,
        { faculties: csvFaculties }
      );

      if (res.data.success) {
        toast.success("CSV uploaded successfully!");
        setCsvFaculties([]);
        fetchFaculties();
      }
    } catch (err) {
      console.error(err);
      toast.error("Error uploading CSV");
    }
  };

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  // ==================== MODALS ====================

  // Student Details Modal
  const StudentDetailsModal = () =>
    showStudentDetails && selectedStudent ? (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[999]">
        <div className="bg-white p-6 rounded-md shadow-xl w-[500px] max-h-[90vh] overflow-y-auto">
          <h2 className="text-xl font-bold mb-4 text-gray-700">Student Details & Edit</h2>

          <form onSubmit={handleUpdateStudent} className="space-y-3">
            <div>
              <label className="block text-sm font-semibold mb-1">Name</label>
              <input
                type="text"
                value={formStudent.name}
                onChange={(e) => setFormStudent({ ...formStudent, name: e.target.value })}
                className="w-full border p-2 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">Email</label>
              <input
                type="email"
                value={formStudent.email}
                onChange={(e) => setFormStudent({ ...formStudent, email: e.target.value })}
                className="w-full border p-2 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">Phone</label>
              <input
                type="text"
                value={formStudent.phone}
                onChange={(e) => setFormStudent({ ...formStudent, phone: e.target.value })}
                className="w-full border p-2 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">Year</label>
              <input
                type="number"
                value={formStudent.year}
                onChange={(e) => setFormStudent({ ...formStudent, year: e.target.value })}
                className="w-full border p-2 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">Department</label>
              <select
                value={formStudent.department}
                onChange={(e) => setFormStudent({ ...formStudent, department: e.target.value })}
                className="w-full border p-2 rounded-md"
              >
                <option value="">-- Select Department --</option>
                {allDepartments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-5 flex gap-3 flex-wrap">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md flex-1"
              >
                Update Details
              </button>

              <button
                type="button"
                onClick={() => setStudentPasswordModal(true)}
                className="px-4 py-2 bg-purple-600 text-white rounded-md flex-1"
              >
                Change Password
              </button>

              <button
                type="button"
                onClick={() => handleDeleteStudent(selectedStudent.id)}
                className="px-4 py-2 bg-red-600 text-white rounded-md flex-1"
              >
                Delete
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedStudent(null);
                  setShowStudentDetails(false);
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded-md flex-1"
              >
                Close
              </button>
            </div>
          </form>
        </div>
      </div>
    ) : null;

  // Student Password Modal
  const StudentPasswordModal = () =>
    studentPasswordModal && selectedStudent ? (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000]">
        <div className="bg-white p-6 rounded-md shadow-xl w-[450px]">
          <h2 className="text-xl font-bold mb-4 text-gray-700">Change Student Password</h2>
          <p className="mb-4 text-gray-600">Student: <strong>{selectedStudent.name}</strong></p>
          <p className="mb-4 text-gray-600">Student ID: <strong>{selectedStudent.studentId}</strong></p>

          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <label className="block text-sm font-semibold mb-2 text-gray-700">Current Password (to share with student)</label>
            <div className="relative">
              <input
                type={showOldPass ? "text" : "password"}
                placeholder="Current password"
                value={selectedStudent.studentId || ""}
                readOnly
                className="w-full border p-2 rounded-md bg-gray-100 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowOldPass(!showOldPass)}
                className="absolute right-2 top-2 text-gray-600"
              >
                {showOldPass ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
            <p className="text-xs text-yellow-700 mt-2">Note: Default password is usually the Student ID. Share this with the student.</p>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-semibold mb-2">New Password</label>
            <div className="relative">
              <input
                type={showNewPass ? "text" : "password"}
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full border p-2 rounded-md pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNewPass(!showNewPass)}
                className="absolute right-2 top-2 text-gray-600"
              >
                {showNewPass ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleUpdateStudentPassword}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md"
            >
              Update Password
            </button>

            <button
              onClick={() => {
                setStudentPasswordModal(false);
                setNewPassword("");
              }}
              className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-md"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    ) : null;

  // Faculty Details Modal
  const FacultyDetailsModal = () =>
    viewFaculty ? (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[999]">
        <div className="bg-white p-6 rounded-md shadow-xl w-[450px]">
          <h2 className="text-xl font-bold mb-3 text-gray-700">Faculty Details</h2>

          <p><strong>Name:</strong> {viewFaculty.name}</p>
          <p><strong>Email:</strong> {viewFaculty.email}</p>
          <p><strong>Phone:</strong> {viewFaculty.phone}</p>
          <p><strong>Department:</strong> {viewFaculty.department}</p>
          <p><strong>Session:</strong> {viewFaculty.session}</p>
          <p><strong>Semester:</strong> {viewFaculty.semester}</p>
          <p><strong>Subjects:</strong> {viewFaculty.subjects && Array.isArray(viewFaculty.subjects) ? viewFaculty.subjects.join(", ") : "N/A"}</p>

          <div className="mt-5 flex justify-between gap-2 flex-wrap">
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-md flex-1"
              onClick={() => {
                handleEditFaculty(viewFaculty);
                setViewFaculty(null);
              }}
            >
              Edit
            </button>

            <button
              className="px-4 py-2 bg-red-600 text-white rounded-md flex-1"
              onClick={() => {
                handleDeleteFaculty(viewFaculty.id);
                setViewFaculty(null);
              }}
            >
              Delete
            </button>

            <button
              className="px-4 py-2 bg-gray-500 text-white rounded-md flex-1"
              onClick={() => setViewFaculty(null)}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    ) : null;

  // Faculty Password Modal
  const FacultyPasswordModal = () =>
    facultyPasswordModal && editingFaculty ? (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1001]">
        <div className="bg-white p-6 rounded-md shadow-xl w-[450px]">
          <h2 className="text-xl font-bold mb-4 text-gray-700">Change Faculty Password</h2>
          <p className="mb-4 text-gray-600">Faculty: <strong>{editingFaculty.name}</strong></p>
          <p className="mb-4 text-gray-600">Email: <strong>{editingFaculty.email}</strong></p>

          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <label className="block text-sm font-semibold mb-2 text-gray-700">Current Password (to share with faculty)</label>
            <div className="relative">
              <input
                type={showOldPasswordFaculty ? "text" : "password"}
                placeholder="Current password"
                value={editingFaculty.phone || ""}
                readOnly
                className="w-full border p-2 rounded-md bg-gray-100 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowOldPasswordFaculty(!showOldPasswordFaculty)}
                className="absolute right-2 top-2 text-gray-600"
              >
                {showOldPasswordFaculty ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
            <p className="text-xs text-yellow-700 mt-2">Note: Default password is usually the Phone number. Share this with the faculty member.</p>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-semibold mb-2">New Password</label>
            <div className="relative">
              <input
                type={showNewPasswordFaculty ? "text" : "password"}
                placeholder="Enter new password"
                value={facultyNewPassword}
                onChange={(e) => setFacultyNewPassword(e.target.value)}
                className="w-full border p-2 rounded-md pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNewPasswordFaculty(!showNewPasswordFaculty)}
                className="absolute right-2 top-2 text-gray-600"
              >
                {showNewPasswordFaculty ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleUpdateFacultyPassword}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md"
            >
              Update Password
            </button>

            <button
              onClick={() => {
                setFacultyPasswordModal(false);
                setFacultyNewPassword("");
              }}
              className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-md"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    ) : null;

  // ==================== PROMOTE STUDENTS MODAL ====================
  const PromoteStudentsModal = () =>
    promoteModal ? (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1002]">
        <div className="bg-white p-6 rounded-md shadow-xl w-[550px] max-h-[90vh] overflow-y-auto">
          <h2 className="text-xl font-bold mb-4 text-gray-700">Promote Students to Next Year</h2>

          <div className="space-y-4">
            {/* Current Year Selection */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Select Current Year</label>
              <div className="flex gap-2 flex-wrap">
                {[1, 2, 3].map((year) => (
                  <button
                    key={year}
                    onClick={() => setPromoteYear(year)}
                    className={`px-4 py-2 rounded-md font-semibold transition ${
                      promoteYear === year
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    Year {year}
                  </button>
                ))}
              </div>
              {promoteYear && (
                <p className="text-sm text-blue-600 mt-2">Will promote to Year {promoteYear + 1}</p>
              )}
            </div>

            {/* Department Selection */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Select Department</label>
              <select
                value={promoteDepartment}
                onChange={(e) => setPromoteDepartment(e.target.value)}
                className="w-full border p-2 rounded-md"
              >
                <option value="">-- Choose Department --</option>
                {allDepartments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            {/* Skip Student IDs */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">
                Skip Student IDs (comma-separated)
              </label>
              <textarea
                value={skipStudentIds}
                onChange={(e) => setSkipStudentIds(e.target.value)}
                placeholder="E.g., STU001, STU002, STU003"
                className="w-full border p-2 rounded-md h-24"
              />
              <p className="text-xs text-gray-600 mt-1">Leave empty to promote all students of this year and department</p>
            </div>

            {/* Summary */}
            {promoteYear && promoteDepartment && (
              <div className="bg-blue-50 border border-blue-200 p-3 rounded-md">
                <p className="text-sm text-blue-700">
                  <strong>Summary:</strong> Promoting Year {promoteYear} students from <strong>{promoteDepartment}</strong> department to Year {promoteYear + 1}
                  {skipStudentIds && ` (excluding ${skipStudentIds.split(",").length} student(s))`}
                </p>
              </div>
            )}
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={handlePromoteStudents}
              disabled={!promoteYear || !promoteDepartment || isPromoting}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isPromoting ? "Promoting..." : "Promote Students"}
            </button>

            <button
              onClick={() => {
                setPromoteModal(false);
                setPromoteYear(null);
                setPromoteDepartment("");
                setSkipStudentIds("");
              }}
              disabled={isPromoting}
              className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-md disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    ) : null;
  return (
    <div className="flex min-h-screen bg-[#f5f6fa] font-sans">
      <div className="flex-grow transition-all duration-300 flex flex-col">
        <Navbar userName={adminName || "Admin Dashboard"} onProfileClick={toggleSidebar} />
        <Toaster />

        {StudentDetailsModal()}
        {StudentPasswordModal()}
        {FacultyDetailsModal()}
        {FacultyPasswordModal()}
        {PromoteStudentsModal()}

        <main className="flex-1 p-4 max-w-7xl mx-auto w-full">
          <h1 className="text-2xl font-bold mb-4 text-gray-800">⚙️ Admin Dashboard</h1>

          {/* TABS */}
          <div className="flex gap-4 mb-6 border-b border-gray-300">
            <button
              onClick={() => setActiveTab("faculty")}
              className={`px-6 py-3 font-semibold transition ${
                activeTab === "faculty"
                  ? "border-b-4 border-blue-600 text-blue-600"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              👥 Faculty Management
            </button>
          </div>

          {/* ==================== FACULTY MANAGEMENT TAB ==================== */}
          {activeTab === "faculty" && (
            <div>
              {/* Search & Filter */}
              <div className="flex gap-4 mb-6 flex-wrap">
                <input
                  type="text"
                  placeholder="Search by name/email"
                  className="border p-2 rounded-md w-full max-w-md"
                  value={searchFacultyTerm}
                  onChange={(e) => setSearchFacultyTerm(e.target.value)}
                />

                <input
                  type="text"
                  placeholder="Filter by session"
                  className="border p-2 rounded-md w-full max-w-xs"
                  value={sessionFilter}
                  onChange={(e) => setSessionFilter(e.target.value)}
                />

                <select
                  value={selectedFacultyDept}
                  onChange={(e) => setSelectedFacultyDept(e.target.value)}
                  className="border p-2 rounded-md w-full max-w-md"
                >
                  <option value="">-- All Departments --</option>
                  {allDepartments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              {/* Fetch Faculty Button */}
              <div className="flex gap-4 mb-6">
                <button
                  onClick={fetchFaculties}
                  className="px-5 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Fetch Faculty Details
                </button>
              </div>

              {/* Faculty Table */}
              <div className="overflow-x-auto bg-white border rounded shadow mb-8">
                <table className="min-w-full">
                  <thead className="bg-[#243278] text-white text-left text-sm">
                    <tr>
                      <th className="px-6 py-3">Sr No</th>
                      <th className="px-6 py-3">Name</th>
                      <th className="px-6 py-3">Department</th>
                      <th className="px-6 py-3">Email</th>
                      <th className="px-6 py-3">Phone</th>
                      <th className="px-6 py-3">Session</th>
                      <th className="px-6 py-3">Semester</th>
                      <th className="px-6 py-3">Subjects</th>
                      <th className="px-6 py-3">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y text-sm">
                    {(searchFacultyTerm || sessionFilter ? filteredFaculties : faculties).map(
                      (faculty, index) => (
                        <tr key={faculty.id} className="hover:bg-gray-50">
                          <td className="px-6 py-3">{index + 1}</td>
                          <td className="px-6 py-3 font-semibold">{faculty.name}</td>
                          <td className="px-6 py-3">{faculty.department}</td>
                          <td className="px-6 py-3">{faculty.email}</td>
                          <td className="px-6 py-3">{faculty.phone}</td>
                          <td className="px-6 py-3">{faculty.session}</td>
                          <td className="px-6 py-3">{faculty.semester}</td>
                          <td className="px-6 py-3">{faculty.subjects && Array.isArray(faculty.subjects) ? faculty.subjects.join(", ") : "N/A"}</td>
                          <td className="px-6 py-3 flex gap-2">
                            <button
                              onClick={() => handleEditFaculty(faculty)}
                              className="text-blue-600 hover:underline"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => setViewFaculty(faculty)}
                              className="text-green-600 hover:underline"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      )
                    )}

                    {(searchFacultyTerm || sessionFilter ? filteredFaculties : faculties).length === 0 && (
                      <tr>
                        <td colSpan="9" className="text-center py-4 text-gray-500">
                          No faculty found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Add/Edit Faculty Form */}
              <div ref={formScrollRef} className="bg-white p-6 shadow-md rounded-md mb-8">
                <h2 className="text-xl font-semibold mb-4">
                  {editingFaculty ? "Edit Faculty" : "Add New Faculty"}
                </h2>

                {editingFaculty && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-sm text-blue-700">
                      <strong>Editing:</strong> {editingFaculty.name} ({editingFaculty.email})
                    </p>
                  </div>
                )}

                <form
                  ref={formRef}
                  onSubmit={handleAddOrUpdateFaculty}
                  className="grid grid-cols-2 gap-4"
                >
                  <input
                    name="name"
                    placeholder="Name"
                    value={formFaculty.name}
                    onChange={handleChange}
                    required
                    className="border p-2 rounded-md"
                  />

                  <input
                    name="email"
                    type="email"
                    placeholder="Email"
                    value={formFaculty.email}
                    onChange={handleChange}
                    required
                    className="border p-2 rounded-md"
                  />

                  <select
                    name="department"
                    value={formFaculty.department}
                    onChange={handleChange}
                    className="border p-2 rounded-md"
                  >
                    <option value="">-- Select Department --</option>
                    <option value="IT">IT</option>
                    <option value="CIVIL">CIVIL</option>
                    <option value="DS">DS</option>
                    <option value="Computer Science">Computer Science</option>
                  </select>

                  <input
                    name="phone"
                    placeholder="Phone"
                    value={formFaculty.phone}
                    onChange={handleChange}
                    required
                    className="border p-2 rounded-md"
                  />

                  <input
                    name="session"
                    placeholder="Session (e.g., 2025-26)"
                    value={formFaculty.session}
                    onChange={handleChange}
                    required
                    className="border p-2 rounded-md"
                  />

                  <div>
                    <select
                      name="semester"
                      value={formFaculty.semester}
                      onChange={handleChange}
                      required
                      className="border p-2 rounded-md w-full"
                    >
                      <option value="">Select Semester</option>
                      <option value="even">Even</option>
                      <option value="odd">Odd</option>
                    </select>
                  </div>

                  {/* Subjects */}
                  <div className="col-span-2">
                    <label className="font-semibold block mb-2">Subjects</label>
                    {formFaculty.subjects.map((subj, idx) => (
                      <input
                        key={idx}
                        value={subj}
                        onChange={(e) => handleSubjectChange(idx, e.target.value)}
                        placeholder={`Subject ${idx + 1}`}
                        className="border p-2 rounded-md w-full mb-2"
                      />
                    ))}
                    <button
                      type="button"
                      onClick={addSubjectField}
                      className="px-3 py-1 border border-blue-600 text-blue-600 rounded-md"
                    >
                      Add Subject
                    </button>
                  </div>

                  {/* Buttons */}
                  <div className="col-span-2 flex gap-4 flex-wrap">
                    <button
                      type="submit"
                      className="px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      {editingFaculty ? "Update Faculty" : "Add Faculty"}
                    </button>

                    {editingFaculty && (
                      <>
                        <button
                          type="button"
                          onClick={() => setFacultyPasswordModal(true)}
                          className="px-5 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                        >
                          Change Password
                        </button>
                        <button
                          type="button"
                          className="px-5 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                          onClick={() => handleDeleteFaculty(editingFaculty.id)}
                        >
                          Delete Faculty
                        </button>
                        <button
                          type="button"
                          className="px-5 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                          onClick={() => {
                            setEditingFaculty(null);
                            setFormFaculty({
                              name: "",
                              email: "",
                              department: adminDept,
                              phone: "",
                              isAdmin: false,
                              subjects: [""],
                              session: "",
                              semester: "",
                            });
                          }}
                        >
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                </form>
              </div>

              {/* CSV Upload */}
              <div className="bg-white p-6 rounded-md shadow-md">
                <h2 className="text-xl font-semibold mb-4">Upload Faculty CSV</h2>

                <input
                  type="file"
                  accept=".csv"
                  onChange={handleCSVFile}
                  className="mb-3"
                />

                <button
                  onClick={handleCSVSubmit}
                  className="px-5 py-2 bg-green-600 text-white rounded-md"
                >
                  Upload CSV
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
