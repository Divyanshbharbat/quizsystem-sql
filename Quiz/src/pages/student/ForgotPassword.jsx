import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [stage, setStage] = useState("email"); // email or otp
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // Step 1: send OTP
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
     let t= await axios.post("http://localhost:5000/api/student/forgot-password", { email });
     console.log(t);
      setStage("otp");
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: verify OTP
  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await axios.post("http://localhost:5000/api/student/verify-otp", { email, otp });
      const token = res.data.token; // OTP token returned from backend
      navigate("/reset-password", { state: { email, token } });
    } catch (err) {
      setError(err.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {stage === "email" ? (
        <form onSubmit={handleEmailSubmit}>
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required />
          <button type="submit" disabled={loading}>{loading ? "Sending..." : "Send OTP"}</button>
        </form>
      ) : (
        <form onSubmit={handleOtpSubmit}>
          <input value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="OTP" required />
          <button type="submit" disabled={loading}>{loading ? "Verifying..." : "Verify OTP"}</button>
        </form>
      )}
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
};

export default ForgotPassword;
