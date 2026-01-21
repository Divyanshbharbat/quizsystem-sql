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
      <div className="flex flex-col p-3 flex-1">
        <div className="font-sans  bg-gray-50">
          <Navbar
            userName={`Hey, ${facultyDetails?.name || "Faculty"}`}
            onProfileClick={() => navigate(-1)}
          />
        </div>

        <main className="p-6 bg-gray-50 flex-1">
          <h2 className="text-2xl font-semibold mb-6 text-gray-800">
            Manage Students
          </h2>

          {/* 🔹 Year Filter Buttons */}
          <div className="flex gap-4 mb-6 flex-wrap">
            {[1, 2, 3, 4].map((year) => (
              <button
                key={year}
                onClick={() => fetchStudentsByYear(year)}
                className={`px-6 py-3 rounded-lg font-semibold shadow-md transform transition duration-200 hover:scale-105 ${
                  selectedYear === year
                    ? "bg-[#243278] text-white ring-2 ring-blue-300"
                    : "bg-white text-[#243278] border-2 border-[#243278] hover:bg-blue-50"
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
                className="px-6 py-3 rounded-lg font-semibold bg-gray-200 text-gray-700 hover:bg-gray-300 transition duration-200"
              >
                Clear Filter
              </button>
            )}
          </div>
          
          {/* Status Message */}
          {selectedYear && students.length > 0 && (
            <div className="mb-4 p-3 bg-blue-50 border-l-4 border-blue-500 rounded-lg">
              <p className="text-sm text-blue-700 font-medium">
                Showing <strong>{students.length}</strong> student(s) for <strong>Year {selectedYear}</strong>
              </p>
            </div>
          )}

          {/* 🔹 Student List or Details */}
          {!selectedStudent ? (
            selectedYear && (
              <div className="overflow-x-auto mb-6">
                <h3 className="text-lg font-semibold mb-3">
                  {selectedYear} Year Students
                </h3>
                <table className="w-full border border-gray-300 rounded-md shadow-sm">
                  <thead>
                    <tr className="bg-[#243278] text-white">
                      <th className="p-2 border">Sr No</th>
                      <th className="p-2 border">Student ID</th>
                      <th className="p-2 border">Name</th>
                      <th className="p-2 border">Department</th>
                      <th className="p-2 border">Email</th>
                      <th className="p-2 border">Phone</th>
                      <th className="p-2 border">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.length > 0 ? (
                      students.map((stu, index) => (
                        <tr
                          key={stu.id}
                          className="hover:bg-gray-100"
                        >
                          <td className="border p-2 text-center">
                            {index + 1}
                          </td>
                          <td className="border p-2">{stu.studentId}</td>
                          <td className="border p-2">{stu.name}</td>
                          <td className="border p-2">{stu.department}</td>
                          <td className="border p-2">{stu.email}</td>
                          <td className="border p-2">{stu.phone}</td>
                          <td className="border p-2">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleStudentClick(stu)}
                                className="text-blue-600 hover:underline text-sm"
                              >
                                View
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditStudentIdInput(stu.studentId);
                                  // Auto-fetch when clicking edit
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
                                className="text-green-600 hover:underline text-sm"
                              >
                                Edit
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="text-center p-3 border">
                          No students found for {selectedYear} Year
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            <div
              ref={cardRef}
              className="border shadow-lg bg-white rounded-md max-w-8xl mx-auto p-4 mt-2"
            >
              <div className="space-y-1">
                <div className="flex flex-row justify-between items-center">
                  <h3 className="text-xl font-bold border-b mb-4 text-[#1e254a]">
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

                <div className="grid grid-cols-2 gap-2 text-sm text-gray-700">
                  <p>
                    <span className="font-semibold">UID :</span>{" "}
                    {selectedStudent.studentId}
                  </p>
                  <p>
                    <span className="font-semibold">Email :</span>{" "}
                    {selectedStudent.email}
                  </p>
                  <p>
                    <span className="font-semibold">Phone :</span>{" "}
                    {selectedStudent.phone}
                  </p>
                  <p>
                    <span className="font-semibold">Department :</span>{" "}
                    {selectedStudent.department}
                  </p>
                  <p>
                    <span className="font-semibold">Studying Year :</span>{" "}
                    {selectedStudent.year}
                  </p>
                </div>

                <h4 className="text-lg font-semibold py-4 border-b text-[#1e254a]">
                  Quiz Submissions
                </h4>
                {submissions.length > 0 ? (
                  <div className="grid md:grid-cols-2 gap-4 mt-3">
                    {submissions.map((sub) => (
                      <div
                        key={sub.id}
                        className="p-4 border shadow-sm bg-gray-50 rounded-md hover:shadow-md transition"
                      >
                        <h5 className="font-semibold text-[#02be3a]">
                          {sub.quizId?.title || "Untitled Quiz"}
                      
                        </h5>
                        <p className="text-gray-600 text-sm">
                          Submitted:{" "}
                          {new Date(sub.submittedAt).toLocaleString()}
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
  className="mt-3 bg-[#243278] text-white px-4 py-1 rounded-md hover:bg-[#cd354d] transition"
>
  See Result
</button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-gray-600">
                    No quiz submissions found.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Existing Add / CSV Upload / Update/Delete UI */}
          <div className="flex flex-col md:flex-row gap-6 mt-8">
            {/* Left Column - Add Student */}
            <div className="md:w-1/2 w-full">
              <div className="p-5 border rounded-lg shadow bg-white h-full">
                <h3 className="text-lg font-semibold mb-3 text-[#202d6c]">
                  Add Student
                </h3>
                <div className="space-y-2 mb-3">
                  <input
                    type="text"
                    placeholder="Student ID"
                    value={addStudentId}
                    onChange={(e) => setAddStudentId(e.target.value)}
                    className="border p-2 rounded-md w-full"
                  />
                  <input
                    type="text"
                    placeholder="Name"
                    value={addName}
                    onChange={(e) => setAddName(e.target.value)}
                    className="border p-2 rounded-md w-full"
                  />
                  <select
                    value={addDepartment}
                    onChange={(e) => setAddDepartment(e.target.value)}
                    className="border p-2 rounded-md w-full"
                  >
                    <option value="">-- Select Department --</option>
                    <option value="IT">IT</option>
                    <option value="CIVIL">CIVIL</option>
                    <option value="DS">DS</option>
                    <option value="Computer Science">Computer Science</option>
                  </select>

                  <select
                    value={addYear}
                    onChange={(e) => setAddYear(e.target.value)}
                    className="border p-2 rounded-md w-full bg-white"
                  >
                    <option value="">Select Year</option>
                    <option value="1">1st Year (Odd Semester)</option>
                    <option value="2">2nd Year (Even Semester)</option>
                    <option value="3">3rd Year (Odd Semester)</option>
                    <option value="4">4th Year (Even Semester)</option>
                  </select>

                  <input
                    type="email"
                    placeholder="Email"
                    value={addEmail}
                    onChange={(e) => setAddEmail(e.target.value)}
                    className="border p-2 rounded-md w-full"
                  />
                  <input
                    type="text"
                    placeholder="Phone"
                    value={addPhone}
                    onChange={(e) => setAddPhone(e.target.value)}
                    className="border p-2 rounded-md w-full"
                  />
                </div>
                <button
                  onClick={handleAddStudent}
                  className="bg-[#202d6c] text-white w-full py-2 rounded hover:bg-[#243278]"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Right Column - Upload CSV + Update/Delete */}
            <div className="md:w-1/2 w-full flex flex-col gap-6">
              {/* Upload CSV */}
              <div className="p-5 border rounded-lg shadow bg-white">
                <h3 className="text-lg font-semibold mb-3 text-[#202d6c]">
                  Upload Students from CSV
                </h3>
                <div className="flex flex-col gap-2">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="border p-2 rounded-md w-full"
                  />
                  <button
                    onClick={handleStudentUpload}
                    className="bg-[#243278] text-white py-2 rounded hover:bg-[#293989]"
                  >
                    Upload
                  </button>
                </div>
              </div>

              {/* Update/Delete */}
              <div className="p-5 border rounded-lg shadow bg-white">
                <h3 className="text-lg font-semibold mb-3 text-[#202d6c]">
                  Update / Delete Student
                </h3>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    placeholder="Enter Student ID"
                    value={editStudentIdInput}
                    onChange={(e) => setEditStudentIdInput(e.target.value)}
                    className="border p-2 rounded-md flex-1"
                  />
                  <button
                    onClick={handleFetchStudent}
                    className="bg-[#243278] text-white px-4 rounded hover:bg-[#222d66]"
                  >
                    Fetch
                  </button>
                </div>

                {editingStudent && (
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Student ID"
                      value={editStudentId}
                      onChange={(e) => setEditStudentId(e.target.value)}
                      className="border p-2 rounded-md w-full"
                    />
                    <input
                      type="text"
                      placeholder="Name"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="border p-2 rounded-md w-full"
                    />
                    <select
                      value={editDepartment}
                      onChange={(e) => setEditDepartment(e.target.value)}
                      className="border p-2 rounded-md w-full"
                    >
                      <option value="">-- Select Department --</option>
                      <option value="IT">IT</option>
                      <option value="CIVIL">CIVIL</option>
                      <option value="DS">DS</option>
                      <option value="Computer Science">Computer Science</option>
                    </select>

                    <select
                      value={editYear}
                      onChange={(e) => setEditYear(e.target.value)}
                      className="border p-2 rounded-md w-full bg-white"
                    >
                      <option value="">Select Year</option>
                      <option value="1">1st Year (Odd Semester)</option>
                      <option value="2">2nd Year (Even Semester)</option>
                      <option value="3">3rd Year (Odd Semester)</option>
                      <option value="4">4th Year (Even Semester)</option>
                    </select>

                    <input
                      type="email"
                      placeholder="Email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="border p-2 rounded-md w-full"
                    />
                    <input
                      type="text"
                      placeholder="Phone"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className="border p-2 rounded-md w-full"
                    />

                    <div className="flex gap-3 mt-3">
                      <button
                        onClick={handleUpdateStudent}
                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                      >
                        Update
                      </button>
                      <button
                        onClick={handleDeleteStudent}
                        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AddStudent;

