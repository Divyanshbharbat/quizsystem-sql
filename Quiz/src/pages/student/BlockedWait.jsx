import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";

const BlockedWait = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(0);
  const [blockData, setBlockData] = useState(null);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    // Retrieve block data from localStorage
    const stored = localStorage.getItem("blockData");
    if (!stored) {
      // No block data, go back to login
      navigate("/", { replace: true });
      return;
    }

    try {
      const data = JSON.parse(stored);
      setBlockData(data);

      // Calculate initial countdown
      const now = Date.now();
      const expiresAt = data.expiresAt || (now + (data.remainingSeconds * 1000));
      const remaining = Math.ceil((expiresAt - now) / 1000);

      if (remaining <= 0) {
        setExpired(true);
        setCountdown(0);
      } else {
        setCountdown(remaining);
      }
    } catch (err) {
      console.error("Error parsing block data:", err);
      navigate("/", { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    if (expired) {
      toast.success("Block expired! Redirecting to login...");
      // Clear block data
      localStorage.removeItem("blockData");
      // Redirect to login
      setTimeout(() => {
        navigate("/", { replace: true });
      }, 2000);
      return;
    }

    if (countdown <= 0) {
      return;
    }

    // Update countdown every 1 second
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setExpired(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown, expired, navigate]);

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-red-600 to-red-700 text-white p-6 select-none">
      <Toaster />
      <div className="text-center">
        <div className="text-8xl mb-8">⏸️</div>
        <h1 className="text-5xl font-bold mb-4">Quiz Blocked</h1>
        <p className="text-2xl mb-2">You have been blocked from this quiz.</p>
        <p className="text-lg mb-8 text-red-100">Please wait for the block to expire.</p>

        {/* Large Countdown Display */}
        <div className="bg-red-800 bg-opacity-50 rounded-3xl p-12 mb-8 inline-block">
          <div className="text-9xl font-bold text-yellow-300 font-mono">
            {countdown}s
          </div>
          <p className="text-xl text-red-100 mt-4">seconds remaining</p>
        </div>

        {/* Progress Bar */}
        {blockData && (
          <div className="w-full max-w-md mb-8">
            <div className="bg-red-900 rounded-full h-3 overflow-hidden">
              <div
                className="bg-yellow-400 h-full transition-all duration-1000"
                style={{
                  width: `${Math.max(0, Math.min(100, (countdown / blockData.remainingSeconds) * 100))}%`,
                }}
              ></div>
            </div>
          </div>
        )}

        {/* Message */}
        {expired ? (
          <div className="text-xl text-green-200">
            ✅ Block expired! Redirecting to login...
          </div>
        ) : (
          <div className="text-lg text-red-100">
            Do not close this window. You will be redirected after the countdown.
          </div>
        )}

        {/* Why Blocked Info */}
        <div className="mt-12 bg-red-900 bg-opacity-30 rounded-lg p-6 max-w-md text-left">
          <p className="font-semibold mb-2">Why are you blocked?</p>
          <ul className="text-sm text-red-100 space-y-1">
            <li>• You pressed ESC during the quiz</li>
            <li>• You exited fullscreen mode</li>
            <li>• Or attempted to navigate away</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default BlockedWait;
