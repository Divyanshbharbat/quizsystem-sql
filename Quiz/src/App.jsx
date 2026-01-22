import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./components/AuthContext";
import Sidebar from "./components/Sidebar";
import StudentLogin from "./pages/StudentLogin";
import HalfCircleGauge from "./components/HalfCircleGauge";
import Error from "./Error";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Dashboard from "./pages/faculty/Dashboard";
import AdminDashboard from "./pages/faculty/AdminDashboard";
import CreateQuiz from "./pages/faculty/CreateQuiz";
import CreateMyQuizzes from './components/CreateMyQuizzes ' 
import AddStudent from "./pages/faculty/Addstudent";
import Quiz from './pages/student/Quiz'
import QuizResults from "./pages/faculty/QuizResults";
import ThankYou from "./pages/student/ThankYou";
import Seeresult from "./pages/student/Seeresult";
import HomePageStudent from "./pages/student/HomePageStudent";
import ForgotPassword from "./pages/student/ForgotPassword";
import ResetPassword from "./pages/student/ResetPassword";
import StStudentQuizResult from "./pages/student/StStudentQuizResult";
import BlockedStudents from "./pages/faculty/Blockedstudent"
import BlockedStudentPage from "./pages/faculty/BlockedStudentPage";
import Template from "./pages/faculty/Template";
import Createquiz2 from "./pages/faculty/Createquiz2";
import BlockedWait from "./pages/student/BlockedWait";
import AllStudents from "./pages/faculty/AllStudents";
import UploadQuestions from "./pages/faculty/UploadQuestions";
import MyQuizzes from "./pages/faculty/MyQuizzes";
import FacultyManagement from "./pages/faculty/FacultyManagement";
// Layout
const DashboardLayout = ({ children }) => (
  <div style={{ display: "flex", minHeight: "100vh" }}>
    <Sidebar />
    <main style={{ flexGrow: 1, padding: "20px" }}>{children}</main>
  </div>
);

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/admin-login" element={<Login />} />
          <Route path="/quiz/:quizId" element={<Quiz />} />
          <Route path="/blocked-wait/:quizId" element={<BlockedWait />} />
          <Route path="/student-login" element={<StudentLogin />} />
          <Route path="/student-quiz-result" element={<StStudentQuizResult />} />
          <Route path="/faculty-login" element={<Login />} />
          <Route path="/create" element={<Createquiz2 />} />
          <Route path="/template" element={<Template />} />
          <Route path="/seeresult" element={<Seeresult />} />
          <Route path="/result/:id" element={<HomePageStudent />} />
          <Route path="/thankyou" element={<ThankYou />} />

          <Route path="/createquiz" element={<UploadQuestions />} />
          <Route path="/myquiz" element={<DashboardLayout><CreateMyQuizzes /></DashboardLayout>} />
          <Route path="/myquizzes" element={<MyQuizzes />} />
          <Route path="/studentdetails" element={<AllStudents/>}/>
          <Route path="/faculty-management" element={<FacultyManagement />} />
          <Route path="/seeresult/:quizId" element={<StStudentQuizResult />} />

          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/admin-dashboard" element={<DashboardLayout><AdminDashboard /></DashboardLayout>} />
          <Route path="/quiz-results/:quizId" element={<QuizResults />} />

          <Route path="*" element={<Error />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
