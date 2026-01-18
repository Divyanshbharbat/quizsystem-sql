import React, { useContext } from "react";
import Sidebar from "../components/Sidebar";
import { AuthContext } from "../components/AuthContext";

const DashboardLayout = ({ children }) => {
  const { facultyDetails, isLoggedIn } = useContext(AuthContext);

  // Render immediately, Sidebar and Dashboard together
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main style={{ flexGrow: 1, padding: "20px" }}>
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
