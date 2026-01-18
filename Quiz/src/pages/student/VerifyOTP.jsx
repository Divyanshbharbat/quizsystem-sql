import React, { useState } from "react";
import axios from "axios";

const VerifyOTP = ({ email, onVerified }) => {
  const [otp, setOTP] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      // Verify OTP with backend — assuming an API endpoint to validate OTP
await axios.post(
  "http://localhost:5000/api/student/verify-otp",
  { email, otp }
);

      onVerified(otp); // move to reset password with valid token (otp)
    } catch (err) {
      setError(err.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-xl shadow-lg border border-gray-200">
      <h2 className="text-3xl font-semibold text-center text-blue-700 mb-6">Verify OTP</h2>

      <form onSubmit={handleVerify} className="space-y-5">
        <input
          type="text"
          placeholder="Enter OTP"
          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-xl tracking-widest"
          value={otp}
          onChange={(e) => setOTP(e.target.value)}
          maxLength={6}
          required
          autoFocus
        />
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 rounded-md font-semibold text-white ${
            loading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
          } transition`}
        >
          {loading ? "Verifying..." : "Verify OTP"}
        </button>
      </form>

      {error && <p className="mt-4 text-red-600 text-center">{error}</p>}
    </div>
  );
};

export default VerifyOTP;
