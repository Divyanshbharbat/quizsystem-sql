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
    { name: "Faculty Details", to: "/admin-dashboard", icon: <FiUsers /> },
    { name: "Student Details", to: "/studentdetails", icon: <FiUsers /> },
    { name: "Upload Qs", to: "/createquiz", icon: <FiUpload /> },
    { name: "Create Quiz", to: "/create", icon: <FiPlusCircle /> },
    { name: "Template", to: "/template", icon: <FiFileText /> },
  ];

  const facultyNavItems = [
    { name: "Upload Qs", to: "/createquiz", icon: <FiUpload /> },
    { name: "Create Quiz", to: "/create", icon: <FiPlusCircle /> },
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
        className={`fixed top-0 left-0 h-screen w-64 bg-white shadow-xl border-r p-6 z-40 flex flex-col justify-between transform transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 lg:static`}
      >
        <div>
          <h2 className="text-2xl font-bold mb-6 border-b pb-2">
            {isAdmin ? "Admin Panel" : "Faculty Panel"}
          </h2>

          {/* Faculty Info */}
          <div className="space-y-2 text-sm bg-gray-50 p-4 rounded-md border">
            <div>
              <strong>Name:</strong> {facultyDetails?.name || "N/A"}
            </div>
            <div>
              <strong>Department:</strong>{" "}
              {facultyDetails?.department || "N/A"}
            </div>
            <div>
              <strong>Role:</strong> {isAdmin ? "Admin" : "Faculty"}
            </div>
          </div>

          {/* Navigation */}
          <nav className="mt-8 flex flex-col gap-2">
            {navItems.map((item) => (
              <button
                key={item.name}
                onClick={() => handleNavClick(item.to)}
                className={`flex items-center gap-3 px-3 py-2 rounded-md transition ${
                  isActive(item.to)
                    ? "bg-[#243278] text-white"
                    : "hover:bg-gray-100"
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                {item.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          className="flex items-center justify-center gap-2 bg-red-600 text-white py-2 rounded-md"
        >
          <FiLogOut /> Logout
        </button>
      </aside>
    </>
  );
};

export default Sidebar;
