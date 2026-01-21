// src/student/ThankYou.jsx
import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FaCheckCircle } from "react-icons/fa";
import toast, { Toaster } from "react-hot-toast";

const ThankYou = () => {
  useEffect(() => {
    // Protect against back navigation after submission
    // Replace current history entry to prevent going back to quiz
    window.history.replaceState({ submitted: true, completed: true }, "", window.location.href);
    
    // Push dummy states to prevent back navigation
    for (let i = 0; i < 10; i++) {
      window.history.pushState({ submitted: true, state: i }, "", window.location.href);
    }

    // Listen for back button attempts
    const handlePopState = (e) => {
      e.preventDefault();
      window.history.pushState({ submitted: true }, "", window.location.href);
      toast.error("🚫 You cannot go back after quiz submission!");
      console.warn("[NAVIGATION BLOCKED] Student attempted to go back after submission");
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  return (
    <div
      className="flex flex-col items-center justify-center h-screen text-center text-white"
      style={{
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      }}
    >
      {/* Icon animation */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <FaCheckCircle size={90} color="#fbd38d" />
      </motion.div>

      {/* Heading */}
      <motion.h1
        className="text-4xl font-extrabold mt-6 mb-4"
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, delay: 0.3 }}
      >
        Thank You for Completing the Quiz!
      </motion.h1>

      {/* Paragraph */}
      <motion.p
        className="text-lg text-gray-200 mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.5 }}
      >
        Your responses have been recorded successfully.
      </motion.p>

      {/* Note about back button */}
      <motion.p
        className="text-sm text-yellow-100 mb-8 max-w-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.7 }}
      >
        ℹ️ You cannot go back to the quiz. This is to maintain the integrity of the assessment.
      </motion.p>

      {/* Button */}
      <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
        <Link
          to="/"
          className="bg-[#313970] text-white py-3 px-6 rounded-xl shadow-lg font-semibold hover:bg-[#f29109] transition duration-300"
        >
          Go to Home
        </Link>
      </motion.div>

      <Toaster />
    </div>
  );
};

export default ThankYou;
