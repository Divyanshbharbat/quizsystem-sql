import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";
import { FaArrowLeft } from "react-icons/fa";
import toast,{Toaster} from 'react-hot-toast'
const AddStudent = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const facultyDetails =
    location.state?.facultyDetails ||
    JSON.parse(localStorage.getItem("facultyDetails"));

  const [studentFile, setStudentFile] = useState(null);
  const [students, setStudents] = useState([]);
  const [selectedYear, setSelectedYear] = useState(null);

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const cardRef = useRef();

  // Add student form states
  const [addStudentId, setAddStudentId] = useState("");
  const [addName, setAddName] = useState("");
  const [addDepartment, setAddDepartment] = useState("");
  const [addYear, setAddYear] = useState("");
  const [addEmail, setAddEmail] = useState("");
  const [addPhone, setAddPhone] = useState("");

  // Edit student states
  const [editStudentIdInput, setEditStudentIdInput] = useState("");
  const [editingStudent, setEditingStudent] = useState(null);
  const [editStudentId, setEditStudentId] = useState("");
  const [editName, setEditName] = useState("");
  const [editDepartment, setEditDepartment] = useState("");
  const [editYear, setEditYear] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");

  const handleFileChange = (e) => setStudentFile(e.target.files[0]);

  const handleStudentUpload = () => {
    if (!studentFile) return toast.error("Please select a CSV file.");
    const reader = new FileReader();
    reader.onload = async (e) => {
      const csvText = e.target.result;
      try {
   const res = await axios.post(
  `${import.meta.env.VITE_APP}/api/student/upload-csv`,
  { csvData: csvText }
);


        if (res.data.success) {
          toast.success("✅ Students uploaded successfully!");
          setStudents([...(students || []), ...(res.data.data || [])]);
          setStudentFile(null);
        } else toast.error("❌ " + res.data.message);
      } catch (err) {
        console.error(err);
        toast.error("❌ Something went wrong.");
      }
    };
    reader.readAsText(studentFile);
  };

const handleAddStudent = async () => {
  if (!addStudentId || !addName || !addYear || !addEmail || !addDepartment) {
    return toast.error("Fill all required fields");
  }

  try {
 const res = await axios.post(
  `${import.meta.env.VITE_APP}/api/student/register`,
  {
    studentId: addStudentId,
    name: addName,
    department: addDepartment,
    year: addYear,
    email: addEmail,
    phone: addPhone,
  }
);

    if (res.data.success) {
      toast.success("✅ Student added successfully!");
      setStudents([...(students || []), res.data.data]);
      clearAddForm();
    } else {
      // ✅ Show specific field error messages
      const errorField = res.data.errorField;
      const msg = res.data.message;
      
      if (errorField === "email") {
        toast.error("❌ Email already registered");
      } else if (errorField === "phone") {
        toast.error("❌ Phone number already registered");
      } else if (errorField === "studentId") {
        toast.error("❌ Student ID already exists");
      } else {
        toast.error("❌ " + msg);
      }
    }
  } catch (err) {
    console.error(err);
    // ✅ Handle error response with field-specific messages
    const errorData = err.response?.data;
    const errorField = errorData?.errorField;
    const msg = errorData?.message || "Something went wrong";
    
    if (errorField === "email") {
      toast.error("❌ Email already registered");
    } else if (errorField === "phone") {
      toast.error("❌ Phone number already registered");
    } else if (errorField === "studentId") {
      toast.error("❌ Student ID already exists");
    } else {
      toast.error("❌ " + msg);
    }
  }
};


  const handleFetchStudent = async () => {
    if (!editStudentIdInput) return toast.error("Enter a Student ID to fetch");
    try {
   const res = await axios.get(
  `${import.meta.env.VITE_APP}/api/student/id/${editStudentIdInput}`
);

      if (res.data.success) {
        const stu = res.data.data;
        setEditingStudent(stu);
        setEditStudentId(stu.studentId);
        setEditName(stu.name);
        setEditDepartment(stu.department);
        setEditYear(stu.year);
        setEditEmail(stu.email);
        setEditPhone(stu.phone);
      } else toast.error(res.data.message);
    } catch (err) {
      console.error(err);
      toast.error("❌ Student not found");
    }
  };

  const handleUpdateStudent = async () => {
    if (!editingStudent) return toast.error("Fetch a student first");
    if (!editName || !editEmail || !editYear || !editDepartment) {
      return toast.error("Please fill all required fields");
    }
    try {
  const res = await axios.put(
  `${import.meta.env.VITE_APP}/api/student/${editingStudent.id}`,
  {
    studentId: editStudentId,
    name: editName,
    department: editDepartment,
    year: editYear,
    email: editEmail,
    phone: editPhone,
  }
);

      if (res.data.success) {
         toast.success("✅ Student updated successfully!");
        // Update the student in the list
        setStudents(
          (students || []).map((stu) =>
            stu.id === editingStudent.id ? res.data.data : stu
          )
        );
        clearEditForm();
        // Refresh students if a year is selected
        if (selectedYear) {
          fetchStudentsByYear(selectedYear);
        }
      } else {
        // ✅ Show specific field error messages
        const errorField = res.data.errorField;
        const msg = res.data.message;
        
        if (errorField === "email") {
          toast.error("❌ Email already registered");
        } else if (errorField === "phone") {
          toast.error("❌ Phone number already registered");
        } else if (errorField === "studentId") {
          toast.error("❌ Student ID already exists");
        } else {
          toast.error("❌ " + msg);
        }
      }
    } catch (err) {
      console.error(err);
      // ✅ Handle error response with field-specific messages
      const errorData = err.response?.data;
      const errorField = errorData?.errorField;
      const msg = errorData?.message || "Error updating student";
      
      if (errorField === "email") {
        toast.error("❌ Email already registered");
      } else if (errorField === "phone") {
        toast.error("❌ Phone number already registered");
      } else if (errorField === "studentId") {
        toast.error("❌ Student ID already exists");
      } else {
        toast.error("❌ " + msg);
      }
    }
  };

  const handleDeleteStudent = async () => {
    if (!editingStudent) return toast.error("Fetch a student first");
    if (!window.confirm("Are you sure you want to delete this student?"))
      return;
    try {
   const res = await axios.delete(
  `${import.meta.env.VITE_APP}/api/student/${editingStudent.id}`
);


      if (res.data.success) {
         toast.success("✅ Student deleted successfully!");
        setStudents(
          (students || []).filter((stu) => stu.id !== editingStudent.id)
        );
        clearEditForm();
        // Refresh students if a year is selected
        if (selectedYear) {
          fetchStudentsByYear(selectedYear);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("❌ Error deleting student. Please try again.");
    }
  };

  // 🔹 Fetch students by year
  const fetchStudentsByYear = async (year) => {
    if (selectedYear === year) {
      setSelectedYear(null);
      setStudents([]);
      return;
    }
    
    const department = facultyDetails?.department || "";
    if (!department) {
      toast.error("Department information not available");
      return;
    }

    try {
      // Show loading state
      setStudents([]);
      setSelectedYear(year);
      
      // Fetch students from backend based on year
      const res = await axios.get(
        `${import.meta.env.VITE_APP}/api/student?year=${year}&department=${department}`
      );

      if (res.data.success) {
        const fetchedStudents = res.data.data || [];
        setStudents(fetchedStudents);
        toast.success(`Found ${fetchedStudents.length} student(s) for Year ${year}`);
      } else {
        setStudents([]);
        toast.error(res.data.message || "Failed to fetch students");
      }
    } catch (err) {
      console.error("Error fetching students:", err);
      setStudents([]);
      const errorMsg = err.response?.data?.message || "Error fetching students from backend";
      toast.error(errorMsg);
    }
  };

  // 🔹 Handle student click → fetch submissions
  const handleStudentClick = async (student) => {
    setSelectedStudent(student);
    try {
  const res = await axios.get(
  `${import.meta.env.VITE_APP}/api/student/submissions/${student.id}`
);


      if (res.data.success) {
        console.log(res.data)
        setSubmissions(res.data.submissions);
      } else {
        setSubmissions([]);
      }
    } catch (err) {
      console.error("Error fetching submissions:", err);
      setSubmissions([]);
    }
  };

  // 🔹 Close student card when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (cardRef.current && !cardRef.current.contains(event.target)) {
        setSelectedStudent(null);
        setSubmissions([]);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [cardRef]);
useEffect(() => {
  const faculty = localStorage.getItem("facultyDetails");

  if (!faculty) {
    navigate("/");
  }
}, [navigate]);

  const clearAddForm = () => {
    setAddStudentId("");
    setAddName("");
    setAddDepartment("");
    setAddYear("");
    setAddEmail("");
    setAddPhone("");
  };

  const clearEditForm = () => {
    setEditingStudent(null);
    setEditStudentIdInput("");
    setEditStudentId("");
    setEditName("");
    setEditDepartment("");
    setEditYear("");
    setEditEmail("");
    setEditPhone("");
  };

  return (
    <div className="flex min-h-screen ">
      <Sidebar role="faculty" facultyDetails={facultyDetails} />
<Toaster/>
      <div className="flex flex-col flex-1">
        <Navbar
          userName={facultyDetails?.name || "Manage Students"}
          onProfileClick={() => navigate(-1)}
        />

        <main className="p-6 bg-gray-50 flex-1">
          <h2 className="text-2xl font-semibold mb-6 text-gray-800">
            Manage Students
          </h2>

          {/* 🔹 Year Filter Buttons */}
          <div className="flex gap-3 mb-6 flex-wrap">
            {[1, 2, 3, 4].map((year) => (
              <button
                key={year}
                onClick={() => fetchStudentsByYear(year)}
                className={`px-5 py-2 rounded-lg font-semibold transition-all duration-200 ${
                  selectedYear === year
                    ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg transform scale-105"
                    : "bg-white text-blue-600 border-2 border-blue-600 hover:bg-blue-50"
                }`}
              >
                {year === 1 ? "1st Year" : year === 2 ? "2nd Year" : year === 3 ? "3rd Year" : "4th Year"}
              </button>
            ))}
            {selectedYear && (
              <button
                onClick={() => {
                  setSelectedYear(null);
                  setStudents([]);
                }}
                className="px-5 py-2 rounded-lg font-semibold bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
              >
                ✕ Clear
              </button>
            )}
          </div>
          
          {/* Status Message */}
          {selectedYear && students.length > 0 && (
            <div className="mb-4 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-lg">
              <p className="text-sm text-blue-700 font-medium">
                📊 Showing <strong>{students.length}</strong> student(s) for <strong>Year {selectedYear}</strong>
              </p>
            </div>
          )}

          {/* 🔹 Student List or Details */}
          {!selectedStudent ? (
            selectedYear && (
              <>
                {students.length > 0 ? (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800">
                      📚 Year {selectedYear} Students <span className="text-blue-600 text-sm font-normal">({students.length})</span>
                    </h3>
                    <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
                      <table className="w-full bg-white">
                        <thead>
                          <tr className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                            <th className="px-6 py-3 text-left text-sm font-semibold">#</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold">Student ID</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold">Name</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold">Department</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold">Email</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold">Phone</th>
                            <th className="px-6 py-3 text-center text-sm font-semibold">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {students.map((stu, index) => (
                            <tr
                              key={stu.id}
                              className="border-b border-gray-200 hover:bg-blue-50 transition-colors"
                            >
                              <td className="px-6 py-3 text-sm text-gray-700 font-medium">{index + 1}</td>
                              <td className="px-6 py-3 text-sm text-gray-800 font-semibold">{stu.studentId}</td>
                              <td className="px-6 py-3 text-sm text-gray-800">{stu.name}</td>
                              <td className="px-6 py-3 text-sm text-gray-700">
                                <span className="bg-gray-100 px-3 py-1 rounded-full text-xs font-medium">{stu.department}</span>
                              </td>
                              <td className="px-6 py-3 text-sm text-gray-700">{stu.email}</td>
                              <td className="px-6 py-3 text-sm text-gray-700">{stu.phone}</td>
                              <td className="px-6 py-3 text-center">
                                <div className="flex gap-2 justify-center">
                                  <button
                                    onClick={() => handleStudentClick(stu)}
                                    className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
                                    title="View student details"
                                  >
                                    👁️ View
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditStudentIdInput(stu.studentId);
                                      const fetchEdit = async () => {
                                        try {
                                          const res = await axios.get(
                                            `${import.meta.env.VITE_APP}/api/student/id/${stu.studentId}`
                                          );
                                          if (res.data.success) {
                                            const stuData = res.data.data;
                                            setEditingStudent(stuData);
                                            setEditStudentId(stuData.studentId);
                                            setEditName(stuData.name);
                                            setEditDepartment(stuData.department);
                                            setEditYear(stuData.year);
                                            setEditEmail(stuData.email);
                                            setEditPhone(stuData.phone);
                                          }
                                        } catch (err) {
                                          console.error(err);
                                          toast.error("❌ Student not found");
                                        }
                                      };
                                      fetchEdit();
                                    }}
                                    className="px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors"
                                    title="Edit student details"
                                  >
                                    ✎ Edit
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
                    <div className="text-5xl mb-4">👥</div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">No Students Found</h3>
                    <p className="text-gray-600">
                      No students registered for Year {selectedYear} in {facultyDetails?.department} department.
                    </p>
                    <p className="text-sm text-gray-500 mt-3">
                      Scroll down to add new students using the form below.
                    </p>
                  </div>
                )}
              </>
            )
          ) : (
            <div
              ref={cardRef}
              className="border border-gray-200 shadow-lg bg-white rounded-lg max-w-4xl mx-auto p-6 mt-4"
            >
              <div className="space-y-4">
                <div className="flex flex-row justify-between items-center mb-4 pb-4 border-b border-gray-200">
                  <h3 className="text-2xl font-bold text-gray-800">
                    {selectedStudent.name}
                  </h3>
                  <button
                    onClick={() => setSelectedStudent(null)}
                    className="flex items-center py-2 px-4 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
                  >
                    <FaArrowLeft className="mr-2" />
                    Back
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700"><span className="font-semibold">UID:</span> {selectedStudent.studentId}</p>
                  <p className="text-gray-700"><span className="font-semibold">Email:</span> {selectedStudent.email}</p>
                  <p className="text-gray-700"><span className="font-semibold">Phone:</span> {selectedStudent.phone}</p>
                  <p className="text-gray-700"><span className="font-semibold">Department:</span> {selectedStudent.department}</p>
                  <p className="text-gray-700"><span className="font-semibold">Year:</span> {selectedStudent.year}</p>
                </div>

                <h4 className="text-lg font-semibold py-4 border-b border-gray-200 text-gray-800">
                  📝 Quiz Submissions
                </h4>
                {submissions.length > 0 ? (
                  <div className="grid md:grid-cols-2 gap-4 mt-4">
                    {submissions.map((sub) => (
                      <div
                        key={sub.id}
                        className="p-4 border border-gray-200 shadow-sm bg-gradient-to-br from-gray-50 to-white rounded-lg hover:shadow-md transition"
                      >
                        <h5 className="font-semibold text-blue-600 mb-2">
                          {sub.quizId?.title || "Untitled Quiz"}
                        </h5>
                        <p className="text-gray-600 text-sm mb-3">
                          📅 Submitted: {new Date(sub.submittedAt).toLocaleString()}
                        </p>
                        <button
                          onClick={() =>
                            navigate(`/${sub.quizId?.id }/result`, {
                              state: {
                                student: selectedStudent,
                                submissionId: sub.id,
                                quizTitle: sub.quizId?.title || "Untitled Quiz",
                              },
                            })
                          }
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                          📊 View Result
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-gray-600 text-center py-6">
                    No quiz submissions found.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Existing Add / CSV Upload / Update/Delete UI */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            {/* Left Column - Add Student */}
            <div className="p-6 border border-gray-200 rounded-lg shadow-sm bg-white">
              <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center">
                ➕ Add New Student
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Student ID*</label>
                  <input
                    type="text"
                    placeholder="e.g., CS001"
                    value={addStudentId}
                    onChange={(e) => setAddStudentId(e.target.value)}
                    className="w-full border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name*</label>
                  <input
                    type="text"
                    placeholder="Enter student name"
                    value={addName}
                    onChange={(e) => setAddName(e.target.value)}
                    className="w-full border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Department*</label>
                  <select
                    value={addDepartment}
                    onChange={(e) => setAddDepartment(e.target.value)}
                    className="w-full border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">-- Select Department --</option>
                    <option value="IT">IT</option>
                    <option value="CIVIL">CIVIL</option>
                    <option value="DS">DS</option>
                    <option value="Computer Science">Computer Science</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Year*</label>
                  <select
                    value={addYear}
                    onChange={(e) => setAddYear(e.target.value)}
                    className="w-full border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">Select Year</option>
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Email*</label>
                  <input
                    type="email"
                    placeholder="student@college.edu"
                    value={addEmail}
                    onChange={(e) => setAddEmail(e.target.value)}
                    className="w-full border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Phone (Optional)</label>
                  <input
                    type="text"
                    placeholder="10-digit phone number"
                    value={addPhone}
                    onChange={(e) => setAddPhone(e.target.value)}
                    className="w-full border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  onClick={handleAddStudent}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-semibold transition-colors mt-4"
                >
                  Add Student
                </button>
              </div>
            </div>

            {/* Right Column - Upload CSV + Update/Delete */}
            <div className="flex flex-col gap-6">
              {/* Upload CSV */}
              <div className="p-6 border border-gray-200 rounded-lg shadow-sm bg-white">
                <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center">
                  📤 Bulk Upload Students
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Select CSV File</label>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileChange}
                      className="w-full border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-2">Accepted format: CSV with columns (studentId, name, department, year, email, phone)</p>
                  </div>
                  <button
                    onClick={handleStudentUpload}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-semibold transition-colors"
                  >
                    Upload CSV
                  </button>
                </div>
              </div>

              {/* Update/Delete */}
              <div className="p-6 border border-gray-200 rounded-lg shadow-sm bg-white">
                <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center">
                  ✏️ Edit / Delete Student
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Student ID</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Enter student ID"
                        value={editStudentIdInput}
                        onChange={(e) => setEditStudentIdInput(e.target.value)}
                        className="flex-1 border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={handleFetchStudent}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors whitespace-nowrap"
                      >
                        Fetch
                      </button>
                    </div>
                  </div>

                  {editingStudent && (
                    <div className="space-y-3 mt-4 pt-4 border-t border-gray-200">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Student ID</label>
                        <input
                          type="text"
                          placeholder="Student ID"
                          value={editStudentId}
                          onChange={(e) => setEditStudentId(e.target.value)}
                          className="w-full border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Name</label>
                        <input
                          type="text"
                          placeholder="Name"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Department</label>
                        <select
                          value={editDepartment}
                          onChange={(e) => setEditDepartment(e.target.value)}
                          className="w-full border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                          <option value="">-- Select Department --</option>
                          <option value="IT">IT</option>
                          <option value="CIVIL">CIVIL</option>
                          <option value="DS">DS</option>
                          <option value="Computer Science">Computer Science</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Year</label>
                        <select
                          value={editYear}
                          onChange={(e) => setEditYear(e.target.value)}
                          className="w-full border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                          <option value="">Select Year</option>
                          <option value="1">1st Year</option>
                          <option value="2">2nd Year</option>
                          <option value="3">3rd Year</option>
                          <option value="4">4th Year</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                        <input
                          type="email"
                          placeholder="Email"
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                          className="w-full border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Phone</label>
                        <input
                          type="text"
                          placeholder="Phone"
                          value={editPhone}
                          onChange={(e) => setEditPhone(e.target.value)}
                          className="w-full border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="flex gap-3 mt-4 pt-4 border-t border-gray-200">
                        <button
                          onClick={handleUpdateStudent}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                        >
                          ✓ Update
                        </button>
                        <button
                          onClick={handleDeleteStudent}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AddStudent;

