import React from "react";
import { motion } from "framer-motion";
import { FaSadTear } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

const Error = () => {
  const navigate = useNavigate();

  return (
    <div
      className="d-flex justify-content-center align-items-center vh-100 text-white text-center"
      style={{
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="p-4 rounded shadow-lg"
        style={{
          background: "rgba(255, 255, 255, 0.1)",
          backdropFilter: "blur(12px)",
          borderRadius: "20px",
          maxWidth: "600px",
        }}
      >
        <motion.div
          initial={{ y: -50 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <FaSadTear size={80} color="#ffd369" />
        </motion.div>

        <h1 className="mt-3 fw-bold">404</h1>
        <h2 className="mb-3">Oops! Page Not Found</h2>
        <p className="text-light">
          The page you’re looking for doesn’t exist or has been moved.  
          Don’t worry, let’s get you back on track!
        </p>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="btn btn-warning fw-bold px-4 py-2 mt-3 shadow"
          onClick={() => navigate("/")}
        >
          Go Home
        </motion.button>
      </motion.div>
    </div>
  );
};

export default Error;