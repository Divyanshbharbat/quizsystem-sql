import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FiMenu,
  FiX,
  FiPlusCircle,
  FiUsers,
  FiLogOut,
  FiFileText,
  FiUpload,
} from "react-icons/fi";

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [isOpen, setIsOpen] = useState(false);

  // Get facultyDetails from location or localStorage
  const facultyDetails =
    location.state?.facultyDetails ||
    JSON.parse(localStorage.getItem("facultyDetails"));

  const isAdmin = facultyDetails?.isAdmin === true;

  const closeSidebar = () => setIsOpen(false);

  const handleNavClick = (to) => {
    navigate(to, { state: { facultyDetails } });
    closeSidebar();
  };

  const logout = () => {
    localStorage.removeItem("facultyDetails");
    navigate("/");
  };

  /* =========================
     ROLE BASED NAV ITEMS
  ========================= */
  const adminNavItems = [
    { name: "Faculty Details", to: "/faculty-management", icon: <FiUsers /> },
    { name: "Student Details", to: "/studentdetails", icon: <FiUsers /> },
    { name: "Upload Questions", to: "/createquiz", icon: <FiUpload /> },
    { name: "Create Quiz", to: "/create", icon: <FiPlusCircle /> },
    { name: "My Quizzes", to: "/myquizzes", icon: <FiFileText /> },
    { name: "Template", to: "/template", icon: <FiFileText /> },
  ];

  const facultyNavItems = [
    { name: "Upload Questions", to: "/createquiz", icon: <FiUpload /> },
    { name: "Create Quiz", to: "/create", icon: <FiPlusCircle /> },
    { name: "My Quizzes", to: "/myquizzes", icon: <FiFileText /> },
    { name: "Template", to: "/template", icon: <FiFileText /> },
  ];

  const navItems = isAdmin ? adminNavItems : facultyNavItems;

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Hamburger Menu */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-40 p-2 bg-blue-600 text-white rounded-md shadow-md lg:hidden"
      >
        {isOpen ? <FiX size={22} /> : <FiMenu size={22} />}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-30 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-screen w-80 bg-white shadow-2xl z-40 flex flex-col transform transition-transform duration-300 border-r border-gray-200 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 lg:static`}
      >
        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 border-b border-blue-500">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-md">
              <span className="text-2xl">🎓</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {isAdmin ? "Admin Panel" : "Faculty Panel"}
              </h2>
              <p className="text-xs text-blue-100 font-medium">Quiz Management System</p>
            </div>
          </div>
        </div>

        {/* User Info Card */}
        <div className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 border-b border-gray-200 overflow-y-auto flex-shrink-0">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md flex-shrink-0">
                {facultyDetails?.name?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-800 text-sm break-words">{facultyDetails?.name || "User"}</p>
                <p className="text-xs text-gray-600 break-words">{facultyDetails?.email || ""}</p>
              </div>
            </div>
            <div className="space-y-2 pt-2 border-t border-blue-200">
              <div>
                <p className="text-xs text-gray-600 font-medium">Department</p>
                <p className="text-sm font-bold text-blue-700 break-words">{facultyDetails?.department || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 font-medium">Role</p>
                <p className="text-sm font-bold text-indigo-700">{isAdmin ? "Admin" : "Faculty"}</p>
              </div>
              {facultyDetails?.session && (
                <div>
                  <p className="text-xs text-gray-600 font-medium">Session</p>
                  <p className="text-sm font-semibold text-gray-800">{facultyDetails.session}</p>
                </div>
              )}
              {facultyDetails?.semester && (
                <div>
                  <p className="text-xs text-gray-600 font-medium">Semester</p>
                  <p className="text-sm font-semibold text-gray-800">{facultyDetails.semester}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="mb-4">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider px-3 mb-2">Main Menu</p>
          </div>
          <nav className="space-y-2">
            {navItems.map((item) => (
              <button
                key={item.name}
                onClick={() => handleNavClick(item.to)}
                className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200 text-left group ${
                  isActive(item.to)
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-200"
                    : "text-gray-700 hover:bg-blue-50 hover:text-blue-700 hover:shadow-md"
                }`}
              >
                <span className={`text-xl ${isActive(item.to) ? "text-white" : "text-gray-500 group-hover:text-blue-600"}`}>
                  {item.icon}
                </span>
                <span className={`font-semibold text-sm ${isActive(item.to) ? "text-white" : "text-gray-700 group-hover:text-blue-700"}`}>
                  {item.name}
                </span>
                {isActive(item.to) && (
                  <span className="ml-auto w-2 h-2 bg-white rounded-full"></span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Footer - Logout Button */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-red-500 to-red-600 text-white py-3.5 px-4 rounded-xl font-semibold text-sm hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <FiLogOut className="text-lg" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
