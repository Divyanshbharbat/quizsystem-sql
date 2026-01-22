import React from "react";
import { useNavigate } from "react-router-dom";
import { FiLogOut } from "react-icons/fi";
import logo from "../assets/logo.png";

const Navbar = ({ userName, onProfileClick }) => {
  const navigate = useNavigate();

  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const formattedTime = currentDate.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      localStorage.removeItem("facultyDetails");
      navigate("/");
    }
  };

  return (
    <nav className="sticky top-0 z-30 w-full bg-white text-gray-800 shadow-sm border-b border-gray-200">
      <div className="w-full px-4">
        <div className="flex justify-between items-center py-2.5">
          {/* Left: Logo and College Info */}
          <div className="flex items-center gap-3">
            <img src={logo} alt="College Logo" className="h-11 w-11 object-contain bg-blue-600 rounded-full p-1 shadow-sm" />
            <div>
              <h1 className="text-base font-bold text-gray-800 leading-tight">
                St. Vincent Pallotti College
              </h1>
              <p className="text-xs text-gray-600 leading-tight">Engineering & Technology, Nagpur</p>
            </div>
          </div>

          {/* Right: Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md text-sm whitespace-nowrap"
            title="Logout"
          >
            <FiLogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
