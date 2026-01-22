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
    <nav className="w-full bg-white text-gray-800 shadow-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Left: Logo and College Info */}
          <div className="flex items-center space-x-3">
            <img src={logo} alt="College Logo" className="h-10 w-10 sm:h-12 sm:w-12 object-contain bg-blue-600 rounded-full p-1" />
            <div>
              <h1 className="text-sm sm:text-base font-bold max-w-[300px] md:max-w-full truncate text-gray-800">
                St. Vincent Pallotti College
              </h1>
              <p className="text-xs text-gray-600">Engineering & Technology, Nagpur</p>
            </div>
          </div>

         

          {/* Right: Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-all transform hover:scale-105 text-sm"
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
