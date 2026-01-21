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
  if (!addStudentId || !addName || !addYear || !addEmail) {
    return toast.error("Fill all required fields");
  }

  try {
 const res = await axios.post(
  `${import.meta.env.VITE_APP}/api/student/register`,
  {
    studentId: addStudentId,
    name: addName,
    department: facultyDetails?.department,
    year: addYear,
    email: addEmail,
    phone: addPhone,
  }
);



    if (res.data.success) {
      toast.success("✅ Student added successfully!");
      setStudents([...(students || []), res.data.data]);
      clearAddForm();
    } else toast.error("❌ " + res.data.message);
  } catch (err) {
    console.error(err);
    toast.error("❌ Something went wrong.");
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
    if (!editingStudent) return alert("Fetch a student first");
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
        setStudents(
          (students || []).map((stu) =>
            stu.id === editingStudent.id ? res.data.data : stu
          )
        );
        clearEditForm();
      } else  toast.error("❌ " + res.data.message);
    } catch (err) {
      console.error(err);
     toast.error("❌ Something went wrong.");
    }
  };

  const handleDeleteStudent = async () => {
    if (!editingStudent) return alert("Fetch a student first");
    if (!window.confirm("Are you sure you want to delete this student?"))
      return;
    try {
   const res = await axios.delete(
  `${import.meta.env.VITE_APP}/api/student/${editingStudent._id}`
);


      if (res.data.success) {
         toast.success("✅ Student deleted!");
        setStudents(
          (students || []).filter((stu) => stu.id !== editingStudent.id)
        );
        clearEditForm();
      }
    } catch (err) {
      console.error(err);
      alert("❌ Something went wrong.");
    }
  };

  // 🔹 Fetch students by year
  const fetchStudentsByYear = async (year) => {
    if (selectedYear === year) {
      setSelectedYear(null);
      setStudents([]);
      return;
    }
    try {
  const res = await axios.get(
  `${import.meta.env.VITE_APP}/api/student?year=${year}&department=${facultyDetails?.department}`
);


      if (res.data.success) {
        setStudents(res.data.data);
        setSelectedYear(year);
      } else {
        setStudents([]);
        setSelectedYear(year);
      }
    } catch (err) {
      console.error("Error fetching students:", err);
      setStudents([]);
      setSelectedYear(year);
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
          <div className="flex gap-4 mb-6">
            {[1, 2, 3, 4].map((year) => (
              <button
                key={year}
                onClick={() => fetchStudentsByYear(year)}
                className="bg-[#243278] text-white px-4 py-2 rounded-md shadow-md transform transition duration-200 hover:scale-105"
              >
                {year} Year
              </button>
            ))}
          </div>

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
                    </tr>
                  </thead>
                  <tbody>
                    {students.length > 0 ? (
                      students.map((stu, index) => (
                        <tr
                          key={stu.id}
                          onClick={() => handleStudentClick(stu)}
                          className="hover:bg-gray-100 cursor-pointer"
                        >
                          <td className="border p-2 text-center">
                            {index + 1}
                          </td>
                          <td className="border p-2">{stu.studentId}</td>
                          <td className="border p-2">{stu.name}</td>
                          <td className="border p-2">{stu.department}</td>
                          <td className="border p-2">{stu.email}</td>
                          <td className="border p-2">{stu.phone}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="text-center p-3 border">
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
                 <input
  type="text"
  placeholder="Department"
  value={facultyDetails?.department || ""}
  disabled
  className="border p-2 rounded-md w-full bg-gray-100"
/>

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
                   <input
  type="text"
  placeholder="Department"
  value={facultyDetails?.department || ""}
  disabled
  className="border p-2 rounded-md w-full bg-gray-100"
/>

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

