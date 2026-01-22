import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";
import toast, { Toaster } from "react-hot-toast";
import { FiEdit2, FiTrash2, FiPlus, FiEye, FiEyeOff } from "react-icons/fi";
import Papa from "papaparse";

const FacultyManagement = () => {
  const navigate = useNavigate();
  const facultyDetails = JSON.parse(localStorage.getItem("facultyDetails"));

  const [faculty, setFaculty] = useState([]);
  const [filteredFaculty, setFilteredFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    department: "",
    phone: "",
    password: "",
    session: "2026-2027",
    semester: "even",
  });

  const [showUploadForm, setShowUploadForm] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordFaculty, setPasswordFaculty] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [csvFile, setCSVFile] = useState(null);
  const [uploadingCSV, setUploadingCSV] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [currentFacultyPassword, setCurrentFacultyPassword] = useState("");
  const fileInputRef = useRef();

  // Fetch all faculty
  useEffect(() => {
    if (!facultyDetails?.isAdmin) {
      toast.error("Only admins can access this page");
      navigate("/");
      return;
    }
    fetchFaculty();
  }, []);

  const fetchFaculty = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${import.meta.env.VITE_APP}/api/faculty/getall`);
      if (res.data.success) {
        setFaculty(res.data.data || []);
        setFilteredFaculty(res.data.data || []);
      }
    } catch (err) {
      console.error("Error fetching faculty:", err);
      // API endpoint not available - use empty list
      toast.error("Faculty API not available. Please check backend.");
      setFaculty([]);
      setFilteredFaculty([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter faculty
  useEffect(() => {
    let filtered = faculty;

    if (searchTerm) {
      filtered = filtered.filter(
        (f) =>
          f.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          f.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterDepartment) {
      filtered = filtered.filter((f) => f.department === filterDepartment);
    }

    setFilteredFaculty(filtered);
  }, [searchTerm, filterDepartment, faculty]);

  const departments = [...new Set(faculty.map((f) => f.department))].filter(Boolean).sort();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddFaculty = async () => {
    if (!formData.name || !formData.email || !formData.department || !formData.session || !formData.semester) {
      toast.error("Please fill all required fields (Name, Email, Department, Session, Semester)");
      return;
    }

    try {
      if (editingId) {
        // Update faculty
        await axios.put(
          `${import.meta.env.VITE_APP}/api/faculty/update/${editingId}`,
          formData
        );
        toast.success("Faculty updated successfully");
        setEditingId(null);
      } else {
        // Add new faculty - send all required fields
        const dataToSend = {
          name: formData.name,
          email: formData.email,
          department: formData.department,
          phone: formData.phone || "",
          password: formData.password || "temp123",
          session: formData.session,
          semester: formData.semester,
        };
        await axios.post(`${import.meta.env.VITE_APP}/api/faculty/register`, dataToSend);
        toast.success("Faculty added successfully");
      }
      setFormData({ name: "", email: "", department: "", phone: "", password: "", session: "2026-2027", semester: "even" });
      setShowAddForm(false);
      
      // Add small delay and then refresh to ensure database is updated
      await new Promise(resolve => setTimeout(resolve, 500));
      await fetchFaculty();
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || "Error saving faculty";
      toast.error(`${msg}`);
    }
  };

  const handleEdit = async (fac) => {
    try {
      // Fetch full faculty details to get password
      const res = await axios.get(`${import.meta.env.VITE_APP}/api/faculty/get/${fac.id}`);
      const fullFaculty = res.data.data || fac;
      setEditingId(fullFaculty.id);
      setFormData({
        name: fullFaculty.name,
        email: fullFaculty.email,
        department: fullFaculty.department,
        phone: fullFaculty.phone || "",
        password: "",
        session: fullFaculty.session || "2026-2027",
        semester: fullFaculty.semester || "even",
      });
      setShowAddForm(true);
    } catch (err) {
      console.error(err);
      // Fallback to basic faculty data
      setEditingId(fac.id);
      setFormData({
        name: fac.name,
        email: fac.email,
        department: fac.department,
        phone: fac.phone || "",
        password: "",
        session: fac.session || "2026-2027",
        semester: fac.semester || "even",
      });
      setShowAddForm(true);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this faculty member?")) return;
    try {
      await axios.delete(`${import.meta.env.VITE_APP}/api/faculty/delete/${id}`);
      toast.success("Faculty deleted successfully");
      fetchFaculty();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete faculty");
    }
  };

  const handleChangePassword = async (faculty) => {
    try {
      // Fetch full faculty details with password for admin view
      const res = await axios.get(`${import.meta.env.VITE_APP}/api/faculty/admin/password/${faculty.id}`);
      const fullFaculty = res.data.data || faculty;
      setPasswordFaculty(fullFaculty);
      setCurrentFacultyPassword(fullFaculty.password || "");
      setNewPassword("");
      setConfirmPassword("");
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowPasswordModal(true);
    } catch (err) {
      console.error(err);
      // Fallback
      setPasswordFaculty(faculty);
      setCurrentFacultyPassword(faculty.password || "");
      setNewPassword("");
      setConfirmPassword("");
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowPasswordModal(true);
    }
  };

  const handleUpdatePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast.error("Please fill both password fields");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    try {
      const res = await axios.put(
        `${import.meta.env.VITE_APP}/api/faculty/admin/password/${passwordFaculty.id}`,
        { password: newPassword }
      );
      if (res.data.success) {
        toast.success("Password updated successfully");
        setShowPasswordModal(false);
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || "Error updating password";
      toast.error(msg);
    }
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingId(null);
    setFormData({ name: "", email: "", department: "", phone: "", password: "", session: "2026-2027", semester: "even" });
  };

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

        const res = await axios.post(`${import.meta.env.VITE_APP}/api/faculty/upload-csv`, {
          csvData: csv,
        });

        if (res.data.success) {
          toast.success(`✅ ${res.data.message || "CSV uploaded successfully"}`);
          setCSVFile(null);
          fileInputRef.current.value = "";
          setShowUploadForm(false);
          
          // Add small delay and then refresh to ensure database is updated
          await new Promise(resolve => setTimeout(resolve, 500));
          await fetchFaculty();
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
      <Toaster />
      <Sidebar />

      <div className="flex flex-col flex-1 h-screen overflow-hidden">
        <Navbar userName={facultyDetails?.name || "Faculty Management"} />

        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {/* Filters and Add Button */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex flex-col md:flex-row gap-4 items-end justify-between mb-4">
              <div className="flex-1 min-w-0">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Search Faculty</label>
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex-1 min-w-0">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Department</label>
                <select
                  value={filterDepartment}
                  onChange={(e) => setFilterDepartment(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Departments</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => {
                  setShowAddForm(!showAddForm);
                  setEditingId(null);
                  setFormData({ name: "", email: "", department: "", phone: "", password: "", session: "2026-2027", semester: "even" });
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center gap-2 shadow-md"
              >
                <FiPlus /> Add Faculty
              </button>

              <button
                onClick={() => setShowUploadForm(!showUploadForm)}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center gap-2 shadow-md"
              >
                {showUploadForm ? "Close" : "Upload CSV"}
              </button>
            </div>

            {/* Add/Edit Form */}
            {showAddForm && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-600 pt-6 mt-6 p-6 rounded-lg">
                <h3 className="text-lg font-bold mb-6 text-gray-800">
                  {editingId ? "Edit Faculty Member" : "Add New Faculty Member"}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      name="name"
                      placeholder="Enter full name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Email *</label>
                    <input
                      type="email"
                      name="email"
                      placeholder="Enter email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Department *</label>
                    <input
                      type="text"
                      name="department"
                      placeholder="Enter department"
                      value={formData.department}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      placeholder="Enter phone (optional)"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Session *</label>
                    <input
                      type="text"
                      name="session"
                      placeholder="e.g., 2026-2027"
                      value={formData.session}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Semester *</label>
                    <select
                      name="semester"
                      value={formData.semester}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="even">Even</option>
                      <option value="odd">Odd</option>
                    </select>
                  </div>
                  {!editingId && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
                      <input
                        type="password"
                        name="password"
                        placeholder="Enter password (optional)"
                        value={formData.password}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  )}
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={handleAddFaculty}
                    className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-8 rounded-lg transition-colors shadow-md hover:shadow-lg"
                  >
                    {editingId ? "Update Faculty" : "Add Faculty"}
                  </button>
                  <button
                    onClick={handleCancel}
                    className="bg-gray-400 hover:bg-gray-500 text-white font-semibold py-2 px-8 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* CSV Upload Form */}
            {showUploadForm && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-600 pt-6 mt-6 p-6 rounded-lg">
                <h3 className="text-lg font-bold mb-4 text-gray-800">Upload Faculty CSV</h3>
                <div className="border-2 border-dashed border-green-300 rounded-lg p-6 text-center mb-4 bg-white">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={(e) => setCSVFile(e.target.files[0])}
                    className="hidden"
                    id="facultyCsvInput"
                  />
                  <label htmlFor="facultyCsvInput" className="cursor-pointer block">
                    <p className="font-semibold text-gray-700">Click to select CSV file</p>
                    <p className="text-sm text-gray-600 mt-2">Format: name, email, department, phone, session, semester</p>
                    {csvFile && (
                      <p className="mt-3 text-green-600 font-medium">✓ {csvFile.name}</p>
                    )}
                  </label>
                </div>
                <button
                  onClick={handleCSVUpload}
                  disabled={!csvFile || uploadingCSV}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-lg transition-colors shadow-md"
                >
                  {uploadingCSV ? "Uploading..." : "Upload CSV"}
                </button>
              </div>
            )}
          </div>

          {/* Faculty Table */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <div className="p-6 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
              <h3 className="text-xl font-bold">Faculty Directory</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-300">
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Department</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Phone</th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center">
                        <span className="text-gray-500">Loading faculty...</span>
                      </td>
                    </tr>
                  ) : filteredFaculty.length > 0 ? (
                    filteredFaculty.map((fac) => (
                      <tr
                        key={fac.id}
                        className="border-b border-gray-200 hover:bg-blue-50 transition-colors"
                      >
                        <td className="px-6 py-4 text-sm font-semibold text-gray-800">{fac.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{fac.email}</td>
                        <td className="px-6 py-4 text-sm">
                          <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold">
                            {fac.department}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">{fac.phone || "—"}</td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2 justify-center flex-wrap">
                            <button
                              onClick={() => handleEdit(fac)}
                              className="px-3 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-sm font-medium transition-colors"
                              title="Edit faculty"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleChangePassword(fac)}
                              className="px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-medium transition-colors"
                              title="Change password"
                            >
                              Password
                            </button>
                            <button
                              onClick={() => handleDelete(fac.id)}
                              className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors"
                              title="Delete faculty"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                        <div className="text-lg">No faculty found</div>
                        <p className="text-sm mt-2">Add a new faculty member to get started</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        {/* Password Change Modal */}
        {showPasswordModal && passwordFaculty && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Change Password</h3>
            <p className="text-sm text-gray-600 mb-6">Faculty: {passwordFaculty.name}</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Current Password</label>
                <div className="relative flex items-center">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentFacultyPassword}
                    readOnly
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 text-gray-600 hover:text-gray-800 transition-colors"
                    title={showCurrentPassword ? "Hide password" : "Show password"}
                  >
                    {showCurrentPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">New Password *</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm Password *</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleUpdatePassword}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Update Password
              </button>
              <button
                onClick={() => setShowPasswordModal(false)}
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

export default FacultyManagement;
