// --- FULL UPDATED CODE STARTS ---

import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "../../components/Navbar";
import Papa from "papaparse";
import toast, { Toaster } from "react-hot-toast";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [faculties, setFaculties] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sessionFilter, setSessionFilter] = useState("");
  const [filteredFaculties, setFilteredFaculties] = useState([]);

  const [selectedFaculty, setSelectedFaculty] = useState(null); 
  const [viewFaculty, setViewFaculty] = useState(null); 

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

  // FACULTY EDIT & PASSWORD STATE
  const [editingFaculty, setEditingFaculty] = useState(null);
  const [facultyPasswordModal, setFacultyPasswordModal] = useState(false);
  const [facultyOldPassword, setFacultyOldPassword] = useState("");
  const [facultyNewPassword, setFacultyNewPassword] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // STUDENT MANAGEMENT STATE
  const [students, setStudents] = useState([]);
  const [searchStudentTerm, setSearchStudentTerm] = useState("");
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showStudentDetails, setShowStudentDetails] = useState(false);
  const [studentPasswordModal, setStudentPasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  // STUDENT YEAR PROMOTION STATE
  const [promoteModal, setPromoteModal] = useState(false);
  const [selectedYearForPromotion, setSelectedYearForPromotion] = useState("");
  const [excludeStudentsList, setExcludeStudentsList] = useState([]);
  const [promoting, setPomoting] = useState(false);

  const [formStudent, setFormStudent] = useState({
    name: "",
    email: "",
    phone: "",
    year: "",
    department: "",
  });

  const formRef = useRef(); 
  const formScrollRef = useRef();  // SCROLL TARGET

  const [adminDept, setAdminDept] = useState("");
  const [adminName, setAdminName] = useState("");
  const [showFacultyDetails, setShowFacultyDetails] = useState(false);

  // Smooth Scroll to Form
  const scrollToForm = () => {
    setTimeout(() => {
      formScrollRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 200);
  };

  // Get admin details
  useEffect(() => {
    const token = localStorage.getItem("facultyDetails");
    if (!token) navigate("/");
    const adminDetails = JSON.parse(token);
    setAdminDept(adminDetails.department);
    setAdminName(adminDetails.name || adminDetails.username || "Admin");
    setFormFaculty((prev) => ({ ...prev, department: adminDetails.department }));
  }, [navigate]);

  // Fetch faculties
  const fetchFaculties = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_APP}/api/faculty/getall`);

      if (res.data.success) {
        const deptFaculties = res.data.data.filter(
          (f) => f.department === adminDept && !f.isAdmin
        );
        setFaculties(deptFaculties);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (adminDept) fetchFaculties();
  }, [adminDept]);

  // ========== STUDENT MANAGEMENT FUNCTIONS ==========
  const fetchStudents = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_APP}/api/student?department=${adminDept}`);
      if (res.data.success) {
        setStudents(res.data.data || []);
      }
    } catch (err) {
      console.error(err);
      toast.error("Error fetching students");
    }
  };

  useEffect(() => {
    if (adminDept) fetchStudents();
  }, [adminDept]);

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
        fetchStudents();
      }
    } catch (err) {
      console.error(err);
      toast.error("Error updating student");
    }
  };

  const handleUpdatePassword = async () => {
    if (!newPassword.trim()) {
      toast.error("Password cannot be empty");
      return;
    }
    try {
      const res = await axios.put(
        `${import.meta.env.VITE_APP}/api/student/admin/password/${selectedStudent.id}`,
        { password: newPassword }
      );
      if (res.data.success) {
        toast.success("Password updated successfully");
        setStudentPasswordModal(false);
        setNewPassword("");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error updating password");
    }
  };

  const handleDeleteStudent = async (id) => {
    if (!window.confirm("Are you sure you want to delete this student?")) return;
    try {
      const res = await axios.delete(`${import.meta.env.VITE_APP}/api/student/${id}`);
      if (res.data.success) {
        toast.success("Student deleted successfully");
        setSelectedStudent(null);
        fetchStudents();
      }
    } catch (err) {
      console.error(err);
      toast.error("Error deleting student");
    }
  };

  // ========== END STUDENT MANAGEMENT FUNCTIONS ==========

  // ========== FACULTY EDIT & PASSWORD MANAGEMENT FUNCTIONS ==========
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
  };

  const handleSaveFacultyEdit = async (e) => {
    e.preventDefault();
    if (!editingFaculty) return;

    try {
      const res = await axios.put(
        `${import.meta.env.VITE_APP}/api/faculty/update/${editingFaculty.id}`,
        formFaculty
      );
      if (res.data.success) {
        toast.success("Faculty updated successfully");
        setEditingFaculty(null);
        fetchFaculties();
      }
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message;
      if (msg === "duplicate_email") {
        toast.error("Email already exists");
      } else if (msg === "duplicate_phone") {
        toast.error("Mobile number already exists");
      } else {
        toast.error("Error updating faculty");
      }
    }
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

  const handleDeleteFacultyClick = async (id) => {
    if (!window.confirm("Are you sure you want to delete this faculty?")) return;
    try {
      const res = await axios.delete(`${import.meta.env.VITE_APP}/api/faculty/delete/${id}`);
      if (res.data.success) {
        toast.success("Faculty deleted successfully");
        setEditingFaculty(null);
        fetchFaculties();
      }
    } catch (err) {
      console.error(err);
      toast.error("Error deleting faculty");
    }
  };

  // ========== END FACULTY EDIT & PASSWORD MANAGEMENT FUNCTIONS ==========

  // Filtering
  useEffect(() => {
    let filtered = faculties;

    if (searchTerm.trim()) {
      filtered = filtered.filter(
        (f) =>
          f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          f.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (sessionFilter.trim()) {
      filtered = filtered.filter((f) => f.session === sessionFilter);
    }

    setFilteredFaculties(filtered);
  }, [searchTerm, sessionFilter, faculties]);

  // Handle Inputs
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

  // Add or Update faculty
  const handleAddOrUpdateFaculty = async (e) => {
    e.preventDefault();

    if (!formFaculty.session || !formFaculty.semester) {
      toast.error("Session and Semester are required");
      return;
    }

    try {
      if (selectedFaculty) {
        const res = await axios.put(
          `${import.meta.env.VITE_APP}/api/faculty/update/${selectedFaculty.id}`,
          formFaculty
        );

        if (res.data.success) {
          toast.success("Faculty updated successfully!");
          setSelectedFaculty(null);
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

  // Delete
  const handleDeleteFaculty = async (id) => {
    if (!window.confirm("Are you sure you want to delete this faculty?")) return;

    try {
      const res = await axios.delete(
        `${import.meta.env.VITE_APP}/api/faculty/delete/${id}`
      );

      if (res.data.success) {
        toast.success("Faculty deleted!");
        setSelectedFaculty(null);
        setViewFaculty(null);
        fetchFaculties();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // CSV Upload
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

  // --------------------------------------------------------------------------------
  //                         VIEW FACULTY DETAILS MODAL
  // --------------------------------------------------------------------------------
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
          <p><strong>Subjects:</strong> {viewFaculty.subjects.join(", ")}</p>

          <div className="mt-5 flex justify-between">
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-md"
              onClick={() => {
                setSelectedFaculty(viewFaculty);
                setFormFaculty({
                  name: viewFaculty.name,
                  email: viewFaculty.email,
                  department: viewFaculty.department,
                  phone: viewFaculty.phone,
                  isAdmin: viewFaculty.isAdmin,
                  subjects: viewFaculty.subjects.length ? viewFaculty.subjects : [""],
                  session: viewFaculty.session,
                  semester: viewFaculty.semester,
                });

                setViewFaculty(null);
                scrollToForm(); // SCROLL ON UPDATE
              }}
            >
              Update
            </button>

            <button
              className="px-4 py-2 bg-red-600 text-white rounded-md"
              onClick={() => handleDeleteFaculty(viewFaculty.id)}
            >
              Delete
            </button>

            <button
              className="px-4 py-2 bg-gray-500 text-white rounded-md"
              onClick={() => setViewFaculty(null)}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    ) : null;

  // ========== STUDENT DETAILS MODAL ==========
  const StudentDetailsModal = () =>
    selectedStudent ? (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[999]">
        <div className="bg-white p-6 rounded-md shadow-xl w-[500px]">
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
              <input
                type="text"
                value={formStudent.department}
                readOnly
                className="w-full border p-2 rounded-md bg-gray-100"
              />
            </div>

            <div className="mt-5 flex gap-3">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md flex-1"
              >
                Update Details
              </button>

              <button
                type="button"
                onClick={() => setStudentPasswordModal(true)}
                className="px-4 py-2 bg-purple-600 text-white rounded-md"
              >
                Change Password
              </button>

              <button
                type="button"
                onClick={() => handleDeleteStudent(selectedStudent.id)}
                className="px-4 py-2 bg-red-600 text-white rounded-md"
              >
                Delete
              </button>

              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="px-4 py-2 bg-gray-500 text-white rounded-md"
              >
                Close
              </button>
            </div>
          </form>
        </div>
      </div>
    ) : null;

  // ========== FACULTY EDIT MODAL ==========
  const FacultyEditModal = () =>
    editingFaculty ? (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[999] overflow-y-auto">
        <div className="bg-white p-6 rounded-md shadow-xl w-[550px] my-8">
          <h2 className="text-xl font-bold mb-4 text-gray-700">Edit Faculty</h2>

          <form onSubmit={handleSaveFacultyEdit} className="space-y-3">
            <div>
              <label className="block text-sm font-semibold mb-1">Name</label>
              <input
                type="text"
                value={formFaculty.name}
                onChange={(e) => setFormFaculty({ ...formFaculty, name: e.target.value })}
                className="w-full border p-2 rounded-md"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">Email</label>
              <input
                type="email"
                value={formFaculty.email}
                onChange={(e) => setFormFaculty({ ...formFaculty, email: e.target.value })}
                className="w-full border p-2 rounded-md"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">Phone</label>
              <input
                type="text"
                value={formFaculty.phone}
                onChange={(e) => setFormFaculty({ ...formFaculty, phone: e.target.value })}
                className="w-full border p-2 rounded-md"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">Department</label>
              <input
                type="text"
                value={formFaculty.department}
                readOnly
                className="w-full border p-2 rounded-md bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">Session</label>
              <input
                type="text"
                value={formFaculty.session}
                onChange={(e) => setFormFaculty({ ...formFaculty, session: e.target.value })}
                className="w-full border p-2 rounded-md"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">Semester</label>
              <select
                value={formFaculty.semester}
                onChange={(e) => setFormFaculty({ ...formFaculty, semester: e.target.value })}
                className="w-full border p-2 rounded-md"
                required
              >
                <option value="">Select</option>
                <option value="even">Even</option>
                <option value="odd">Odd</option>
              </select>
            </div>

            <div className="mt-5 flex gap-3">
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md"
              >
                Save Changes
              </button>

              <button
                type="button"
                onClick={() => setFacultyPasswordModal(true)}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md"
              >
                Change Password
              </button>

              <button
                type="button"
                onClick={() => handleDeleteFacultyClick(editingFaculty.id)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md"
              >
                Delete
              </button>

              <button
                type="button"
                onClick={() => setEditingFaculty(null)}
                className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-md"
              >
                Close
              </button>
            </div>
          </form>
        </div>
      </div>
    ) : null;

  // ========== FACULTY PASSWORD CHANGE MODAL ==========
  const FacultyPasswordModal = () =>
    facultyPasswordModal && editingFaculty ? (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1001]">
        <div className="bg-white p-6 rounded-md shadow-xl w-[450px]">
          <h2 className="text-xl font-bold mb-4 text-gray-700">Change Password</h2>
          <p className="mb-4 text-gray-600">Faculty: <strong>{editingFaculty.name}</strong></p>

          <div className="mb-4">
            <label className="block text-sm font-semibold mb-2">Current Password (for reference)</label>
            <div className="relative">
              <input
                type={showOldPassword ? "text" : "password"}
                placeholder="Current password (read-only)"
                value={facultyOldPassword}
                readOnly
                className="w-full border p-2 rounded-md bg-gray-100 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowOldPassword(!showOldPassword)}
                className="absolute right-2 top-2 text-gray-600"
              >
                {showOldPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-semibold mb-2">New Password</label>
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                placeholder="Enter new password"
                value={facultyNewPassword}
                onChange={(e) => setFacultyNewPassword(e.target.value)}
                className="w-full border p-2 rounded-md pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-2 top-2 text-gray-600"
              >
                {showNewPassword ? "👁️" : "👁️‍🗨️"}
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
                setFacultyOldPassword("");
              }}
              className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-md"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    ) : null;

  // ========== STUDENT PASSWORD CHANGE MODAL ==========
  const StudentPasswordModal = () =>
    studentPasswordModal && selectedStudent ? (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000]">
        <div className="bg-white p-6 rounded-md shadow-xl w-[450px]">
          <h2 className="text-xl font-bold mb-4 text-gray-700">Change Password</h2>
          <p className="mb-4 text-gray-600">Student: <strong>{selectedStudent.name}</strong></p>

          <div className="mb-4">
            <label className="block text-sm font-semibold mb-2">Current Password (for reference)</label>
            <div className="relative">
              <input
                type={showOldPass ? "text" : "password"}
                placeholder="Current password (read-only)"
                value={oldPassword}
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
              onClick={handleUpdatePassword}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md"
            >
              Update Password
            </button>

            <button
              onClick={() => {
                setStudentPasswordModal(false);
                setNewPassword("");
                setOldPassword("");
              }}
              className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-md"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    ) : null;

  // --------------------------------------------------------------------------------

  return (
    <div className="flex min-h-screen bg-[#f5f6fa] font-sans">
      <div className="flex-grow transition-all duration-300">
        <Navbar userName={adminName || "Admin Dashboard"} onProfileClick={toggleSidebar} />
        <Toaster />

        {FacultyDetailsModal()}
        {FacultyEditModal()}
        {FacultyPasswordModal()}
        {StudentDetailsModal()}
        {StudentPasswordModal()}

        <main className="p-8 max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-6 text-[#1d285d]">Faculty Management</h1>

          {/* Search */}
          <div className="flex gap-4 mb-6">
            <input
              type="text"
              placeholder="Search by name/email"
              className="border p-2 rounded-md w-full max-w-md"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <input
              type="text"
              placeholder="Filter by session"
              className="border p-2 rounded-md w-full max-w-xs"
              value={sessionFilter}
              onChange={(e) => setSessionFilter(e.target.value)}
            />
          </div>

          {/* Toggle faculty table */}
          <button
            onClick={() => setShowFacultyDetails((prev) => !prev)}
            className="mb-6 px-5 py-2 bg-[#243278] text-white rounded-md"
          >
            {showFacultyDetails ? "Hide Faculty Details" : "Show Faculty Details"}
          </button>

          {/* Faculty Table */}
          {showFacultyDetails && (
            <div className="overflow-x-auto bg-white border rounded shadow">
              <table className="min-w-full">
                <thead className="bg-[#243278] text-white text-left text-sm">
                  <tr>
                    <th className="px-6 py-3">Sr No</th>
                    <th className="px-6 py-3">Faculty ID</th>
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
                  {(searchTerm || sessionFilter ? filteredFaculties : faculties).map(
                    (faculty, index) => (
                      <tr key={faculty.id} className="hover:bg-gray-50">
                        <td className="px-6 py-3">{index + 1}</td>

                        <td className="px-6 py-3">
                          {faculty.id.slice(0, 10)}...
                        </td>

                        <td className="px-6 py-3 font-semibold">
                          {faculty.name}
                        </td>

                        <td className="px-6 py-3">
                          {faculty.department}
                        </td>

                        <td className="px-6 py-3">{faculty.email}</td>

                        <td className="px-6 py-3">{faculty.phone}</td>

                        <td className="px-6 py-3">{faculty.session}</td>

                        <td className="px-6 py-3">{faculty.semester}</td>

                        <td className="px-6 py-3">
                          {faculty.subjects.join(", ")}
                        </td>

                        <td className="px-6 py-3">
                          <button
                            onClick={() => handleEditFaculty(faculty)}
                            className="text-blue-600 hover:underline me-3"
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

                  {(searchTerm || sessionFilter ? filteredFaculties : faculties)
                    .length === 0 && (
                    <tr>
                      <td colSpan="10" className="text-center py-4 text-gray-500">
                        No faculty found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Add/Edit Form */}
          <div
            ref={formScrollRef}  // <-- Scroll Target
            className="mt-6 bg-white p-6 shadow-md rounded-md"
          >
            <h2 className="text-xl font-semibold mb-4">
              {selectedFaculty ? "Edit Faculty" : "Add New Faculty"}
            </h2>

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

              <input
                name="department"
                value={formFaculty.department}
                readOnly
                placeholder="Department"
                className="border p-2 rounded-md bg-gray-100"
              />

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
                  placeholder="Select Semester"
                  value={formFaculty.semester}
                  onChange={handleChange}
                  required
                  className="border p-2 rounded-md w-full"
                >
                  <option value="">Select Semester</option>
                  <option value="even">Even Semester</option>
                  <option value="odd">Odd Semester</option>
                </select>
                <p style={{ fontSize: "11px", color: "#666", marginTop: "4px" }}>
                  Even: 2, 4, 6, 8 semesters | Odd: 1, 3, 5, 7 semesters
                </p>
              </div>

              {/* Subjects */}
              <div className="col-span-2">
                <label className="font-semibold">Subjects</label>

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
              <div className="col-span-2 flex gap-4">
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 text-white rounded-md"
                >
                  {selectedFaculty ? "Update Faculty" : "Add Faculty"}
                </button>

                {selectedFaculty && (
                  <button
                    type="button"
                    className="px-5 py-2 bg-red-600 text-white rounded-md"
                    onClick={() => handleDeleteFaculty(selectedFaculty.id)}
                  >
                    Delete
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* ============ STUDENT MANAGEMENT ============ */}
          <div className="mt-10">
            <h2 className="text-2xl font-bold mb-4 text-[#1d285d]">Student Management</h2>

            {/* Search Students */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search students by name/ID/email"
                className="border p-2 rounded-md w-full"
                value={searchStudentTerm}
                onChange={(e) => setSearchStudentTerm(e.target.value)}
              />
            </div>

            {/* Toggle Student Table */}
            <button
              onClick={() => setShowStudentDetails((prev) => !prev)}
              className="mb-6 px-5 py-2 bg-[#243278] text-white rounded-md"
            >
              {showStudentDetails ? "Hide Student List" : "Show Student List"}
            </button>

            {/* Student Table */}
            {showStudentDetails && (
              <div className="overflow-x-auto bg-white border rounded shadow mb-8">
                <table className="min-w-full">
                  <thead className="bg-[#243278] text-white text-left text-sm">
                    <tr>
                      <th className="px-6 py-3">Sr No</th>
                      <th className="px-6 py-3">Student ID</th>
                      <th className="px-6 py-3">Name</th>
                      <th className="px-6 py-3">Email</th>
                      <th className="px-6 py-3">Phone</th>
                      <th className="px-6 py-3">Year</th>
                      <th className="px-6 py-3">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y text-sm">
                    {(searchStudentTerm ? filteredStudents : students).map((student, index) => (
                      <tr key={student.id} className="hover:bg-gray-50">
                        <td className="px-6 py-3">{index + 1}</td>
                        <td className="px-6 py-3 font-mono text-xs">{student.studentId}</td>
                        <td className="px-6 py-3 font-semibold">{student.name}</td>
                        <td className="px-6 py-3">{student.email}</td>
                        <td className="px-6 py-3">{student.phone}</td>
                        <td className="px-6 py-3">{student.year || "-"}</td>
                        <td className="px-6 py-3">
                          <button
                            onClick={() => {
                              setSelectedStudent(student);
                              setFormStudent({
                                name: student.name,
                                email: student.email,
                                phone: student.phone,
                                year: student.year || "",
                                department: student.department,
                              });
                            }}
                            className="text-blue-600 hover:underline"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}

                    {(searchStudentTerm ? filteredStudents : students).length === 0 && (
                      <tr>
                        <td colSpan="7" className="text-center py-4 text-gray-500">
                          No students found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* CSV Upload */}
          <div className="mt-10 bg-white p-6 rounded-md shadow-md">
            <h2 className="text-xl font-semibold mb-4">Upload CSV</h2>

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
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;

// --- FULL UPDATED CODE ENDS ---
