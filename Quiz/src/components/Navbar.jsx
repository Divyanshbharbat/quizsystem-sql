import React from "react";
import logo from "../assets/logo.png";

const Navbar = ({ userName, onProfileClick }) => {
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

  return (
    <nav className="w-full bg-slate-200 text-slate-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-3">
          {/* Left: Logo and College Info */}
          <div className="flex items-center space-x-3">
            <img src={logo} alt="College Logo" className="h-10 w-10 sm:h-12 sm:w-12 object-contain" />
            <h1 className="text-sm sm:text-lg font-semibold max-w-[300px] md:max-w-full truncate">
              St. Vincent Pallotti College of Engineering and Technology, Nagpur
            </h1>
          </div>

          {/* Right: Profile Click */}
          <div
            onClick={onProfileClick}
            className="text-sm text-right cursor-pointer hover:text-blue-900 transition"
            title="Click to toggle sidebar"
          >
            <p className="font-semibold">{userName}</p>
            <p className="text-xs">{formattedDate} | {formattedTime}</p>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
