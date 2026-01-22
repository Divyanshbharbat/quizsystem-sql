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
    { name: "Upload Questions", to: "/createquiz", icon: <FiUpload /> },
    { name: "Create Quiz", to: "/create", icon: <FiPlusCircle /> },
    { name: "My Quizzes", to: "/myquizzes", icon: <FiFileText /> },
    { name: "Faculty Management", to: "/faculty-management", icon: <FiUsers /> },
    { name: "Student Management", to: "/studentdetails", icon: <FiUsers /> },
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
        className={`fixed top-0 left-0 h-screen w-72 bg-gradient-to-b from-slate-800 via-slate-700 to-slate-800 text-gray-100 shadow-2xl z-40 flex flex-col justify-between transform transition-transform duration-300 border-r-2 border-blue-500 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 lg:static`}
      >
        <div className="p-7 space-y-7">
          <div className="pb-5 border-b-2 border-blue-400">
            <h2 className="text-3xl font-bold text-white">
              {isAdmin ? "Admin" : "Faculty"}
            </h2>
            <p className="text-sm text-blue-300 mt-2 font-semibold">Portal</p>
          </div>

          {/* Faculty Info Card */}
          <div className="space-y-4 text-sm bg-gradient-to-br from-blue-600 to-indigo-700 p-5 rounded-xl border-2 border-blue-400 shadow-lg">
            <div className="flex items-start gap-3">
              <span className="font-semibold text-blue-100 min-w-fit text-xl">👤</span>
              <div>
                <p className="text-xs text-blue-200 font-semibold">Name</p>
                <p className="font-semibold text-white break-words text-sm">{facultyDetails?.name || "N/A"}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="font-semibold text-blue-100 min-w-fit text-xl">🏢</span>
              <div>
                <p className="text-xs text-blue-200 font-semibold">Department</p>
                <p className="font-semibold text-white break-words text-sm">{facultyDetails?.department || "N/A"}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="font-semibold text-blue-100 min-w-fit text-xl">👔</span>
              <div>
                <p className="text-xs text-blue-200 font-semibold">Role</p>
                <p className="font-semibold text-white text-sm">{isAdmin ? "Administrator" : "Faculty"}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex flex-col gap-2 pt-3">
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-3 px-4">Navigation</p>
            {navItems.map((item) => (
              <button
                key={item.name}
                onClick={() => handleNavClick(item.to)}
                className={`flex items-center gap-4 px-5 py-3 rounded-lg transition-all duration-200 font-semibold text-sm ${
                  isActive(item.to)
                    ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg scale-105"
                    : "text-gray-300 hover:bg-slate-600 hover:text-white"
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Footer */}
        <div className="p-7 space-y-4 border-t-2 border-slate-600 bg-slate-900 bg-opacity-70">
          <p className="text-xs text-gray-400 text-center font-semibold">
            Session: {facultyDetails?.session || "2026-2027"}
          </p>
          <p className="text-xs text-gray-500 text-center font-semibold">
            Logged in: {facultyDetails?.name || "Faculty"}
          </p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
