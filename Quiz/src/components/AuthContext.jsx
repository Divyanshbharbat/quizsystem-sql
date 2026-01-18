import React, { createContext, useState } from "react";

// Read facultyDetails synchronously from localStorage
const stored = localStorage.getItem("facultyDetails");
const initialFaculty = stored ? JSON.parse(stored) : null;

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [facultyDetails, setFacultyDetails] = useState(initialFaculty);
  const [role, setRole] = useState(
    initialFaculty?.role || (initialFaculty?.isAdmin ? "admin" : "faculty")
  );
  const [isLoggedIn, setIsLoggedIn] = useState(!!initialFaculty);

  const login = (details) => {
    setFacultyDetails(details);
    const newRole = details.role || (details.isAdmin ? "admin" : "faculty");
    setRole(newRole);
    setIsLoggedIn(true);
    localStorage.setItem("facultyDetails", JSON.stringify(details));
  };

  const logout = () => {
    setFacultyDetails(null);
    setRole(null);
    setIsLoggedIn(false);
    localStorage.removeItem("facultyDetails");
  };

  const changeRole = (newRole) => {
    setRole(newRole);
    if (facultyDetails) {
      const updated = { ...facultyDetails, role: newRole };
      setFacultyDetails(updated);
      localStorage.setItem("facultyDetails", JSON.stringify(updated));
    }
  };

  return (
    <AuthContext.Provider
      value={{ facultyDetails, role, isLoggedIn, login, logout, changeRole }}
    >
      {children}
    </AuthContext.Provider>
  );
};
