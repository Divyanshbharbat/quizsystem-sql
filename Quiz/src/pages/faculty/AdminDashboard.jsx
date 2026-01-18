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
          `${import.meta.env.VITE_APP}/api/faculty/update/${selectedFaculty._id}`,
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
      toast.error("Error saving faculty.");
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
              onClick={() => handleDeleteFaculty(viewFaculty._id)}
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

  // --------------------------------------------------------------------------------

  return (
    <div className="flex min-h-screen bg-[#f5f6fa] font-sans">
      <div className="flex-grow transition-all duration-300">
        <Navbar userName={adminName || "Admin Dashboard"} onProfileClick={toggleSidebar} />
        <Toaster />

        {FacultyDetailsModal()}

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
                      <tr key={faculty._id} className="hover:bg-gray-50">
                        <td className="px-6 py-3">{index + 1}</td>

                        <td className="px-6 py-3">
                          {faculty._id.slice(0, 10)}...
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
                            onClick={() => setViewFaculty(faculty)}
                            className="text-blue-600 hover:underline"
                          >
                            View Details
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
                placeholder="Session"
                value={formFaculty.session}
                onChange={handleChange}
                required
                className="border p-2 rounded-md"
              />

              <input
                name="semester"
                placeholder="Semester"
                value={formFaculty.semester}
                onChange={handleChange}
                required
                className="border p-2 rounded-md"
              />

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
                    onClick={() => handleDeleteFaculty(selectedFaculty._id)}
                  >
                    Delete
                  </button>
                )}
              </div>
            </form>
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
