import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "./Navbar";
import toast,{Toaster} from 'react-hot-toast'
const StudentDetails = () => {
  const navigate = useNavigate();

  // ... your existing state hooks ...

  const [csvFile, setCsvFile] = useState(null);
  const [csvUploading, setCsvUploading] = useState(false);

  // ... your existing functions (fetchStudents, handleNewChange, etc.) ...

  // CSV file change handler
  const handleCsvChange = (e) => {
    setCsvFile(e.target.files[0]);
  };

  // CSV upload handler
  const handleCsvUpload = async () => {
    if (!csvFile) {
       toast.error("Please select a CSV file first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", csvFile);

    setCsvUploading(true);

    try {
      // Adjust this URL to your backend csv upload endpoint
   const res = await axios.post(
  `${import.meta.env.VITE_APP}/api/students/upload-csv`,
  formData,
  {
    headers: { "Content-Type": "multipart/form-data" },
  }
);



      if (res.data.success) {
         toast.success("CSV uploaded successfully!");
        setCsvFile(null);
        fetchStudents();
      } else {
         toast.error("Failed to upload CSV.");
      }
    } catch (err) {
      console.error("CSV upload error:", err);
      toast.error("Error uploading CSV.");
    } finally {
      setCsvUploading(false);
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      <Navbar userName="Admin" />

      <div className="max-w-7xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Student Management</h1>

        {/* Search Bar */}
        <div className="mb-6">
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Search by name or student ID"
            className="w-full md:w-1/2 border border-gray-300 p-3 rounded-md shadow-sm"
          />
        </div>

        {/* Add Student & CSV Upload */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">

          {/* Add Student Form */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Add Student</h2>
            <div className="space-y-3">
              {["name", "studentId", "email", "department", "year"].map((field) => (
                <input
                  key={field}
                  name={field}
                  placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                  value={newStudent[field]}
                  onChange={handleNewChange}
                  className="w-full border border-gray-300 p-2 rounded-md"
                />
              ))}
              <button
                onClick={handleAddStudent}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-md"
              >
                Add Student
              </button>
            </div>
          </div>

          {/* CSV Upload */}
          <div className="bg-white p-6 rounded-lg shadow flex flex-col justify-center items-center">
            <h2 className="text-xl font-semibold mb-4">Import Students via CSV</h2>
            <input
              type="file"
              accept=".csv"
              onChange={handleCsvChange}
              className="mb-4"
            />
            <button
              onClick={handleCsvUpload}
              disabled={csvUploading}
              className={`w-full py-2 rounded-md text-white ${
                csvUploading ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {csvUploading ? "Uploading..." : "Upload CSV"}
            </button>
          </div>
        </div>

        {/* Edit Student Form */}
        <div className="bg-white p-6 rounded-lg shadow mb-10">
          <h2 className="text-xl font-semibold mb-4">Update Student</h2>
          {!editingStudent ? (
            <p className="text-gray-600">Select a student to edit from the table below.</p>
          ) : (
            <div className="space-y-3">
              {["name", "studentId", "email", "department", "year"].map((field) => (
                <input
                  key={field}
                  name={field}
                  placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                  value={editForm[field]}
                  onChange={handleEditChange}
                  className="w-full border border-gray-300 p-2 rounded-md"
                />
              ))}
              <div className="flex gap-3">
                <button
                  onClick={handleUpdateStudent}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-md"
                >
                  Save Changes
                </button>
                <button
                  onClick={cancelEdit}
                  className="flex-1 bg-gray-400 hover:bg-gray-500 text-white py-2 rounded-md"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Loading/Error */}
        {loading && <p className="text-indigo-600 text-center">Loading students...</p>}
        {error && !loading && <p className="text-red-600 text-center">{error}</p>}

        {/* Student List */}
        {!loading && filteredStudents.length > 0 && (
          <div className="overflow-x-auto bg-white rounded-lg shadow">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-indigo-600 text-white">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Student ID</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Department</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Year</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredStudents.map((student) => (
                  <tr key={student._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">{student.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{student.studentId}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{student.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{student.department}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{student.year}</td>
                    <td className="px-6 py-4 whitespace-nowrap space-x-2">
                      <button
                        onClick={() => startEdit(student)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Edit"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteStudent(student._id)}
                        className="text-red-600 hover:text-red-800"
                        title="Delete"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => handleViewDetails(student)}
                        className="text-green-600 hover:text-green-800"
                        title="View Details"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* No students message */}
        {!loading && filteredStudents.length === 0 && !error && (
          <p className="text-center text-gray-600">No students found.</p>
        )}
      </div>
    </div>
  );
};

export default StudentDetails;
