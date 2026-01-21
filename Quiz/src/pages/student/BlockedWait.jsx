import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";

const BlockedWait = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();

  const [countdown, setCountdown] = useState(0);
  const [blockData, setBlockData] = useState(null);
  const [expired, setExpired] = useState(false);
  const [userSwitchedTab, setUserSwitchedTab] = useState(false);

  // Load block data
  useEffect(() => {
    const stored = localStorage.getItem("blockData");

    if (!stored) {
      navigate("/", { replace: true });
      return;
    }

    try {
      const data = JSON.parse(stored);
      setBlockData(data);

      const now = Date.now();
      const expiresAt =
        data.expiresAt || now + data.remainingSeconds * 1000;

      const remaining = Math.ceil((expiresAt - now) / 1000);

      if (remaining <= 0) {
        setExpired(true);
        setCountdown(0);
      } else {
        setCountdown(remaining);
      }
    } catch (err) {
      console.error("Invalid block data", err);
      navigate("/", { replace: true });
    }
  }, [navigate]);

  // 🔴 Detect tab switch - auto-submit if user leaves tab
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && !expired && !userSwitchedTab) {
        console.log("[BLOCKED WAIT] User switched tab - auto-submitting");
        setUserSwitchedTab(true);
        toast.error("You switched tabs! Quiz auto-submitting...");
        autoSubmitQuiz();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [expired, userSwitchedTab, quizId, navigate]);

  // Countdown timer
  useEffect(() => {
    if (expired || countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown, expired]);

  // When block expires - check fullscreen
  useEffect(() => {
    if (expired && !userSwitchedTab) {
      // Check if user is in fullscreen
      const isFullscreen = !!document.fullscreenElement;
      
      console.log("[BLOCKED WAIT] Block expired. Fullscreen:", isFullscreen);
      console.log("[BLOCKED WAIT] 30-second penalty has been applied (timer ran during block)");

      if (!isFullscreen) {
        // NOT fullscreen - auto-submit quiz
        console.log("[BLOCKED WAIT] Not fullscreen - auto-submitting");
        toast.error("Block expired and screen is not fullscreen. Auto-submitting quiz...");
        autoSubmitQuiz();
      } else {
        // IS fullscreen - return to quiz with 30 second penalty (timer already deducted time)
        console.log("[BLOCKED WAIT] Fullscreen detected - continuing quiz (timer ran during block = 30s penalty)");
        console.log("[BLOCKED WAIT] When you return to quiz, your time should be: originalTime - 30s");
        localStorage.removeItem("blockData");
        
        toast.success("Block expired! Continuing quiz (you lost 30 seconds during block)...");
        setTimeout(() => {
          console.log("[BLOCKED WAIT] Navigating back to quiz with penalty applied");
          navigate(`/quiz/${quizId}`, { replace: true });
        }, 1500);
      }
    }
  }, [expired, userSwitchedTab, quizId, navigate]);

  const autoSubmitQuiz = async () => {
    try {
      console.log("[AUTO_SUBMIT] Starting auto-submit for quiz:", quizId);
      console.log("[AUTO_SUBMIT] Fetching quiz progress...");
      
      // Get current quiz progress
      const progressRes = await axios.get(
        `${import.meta.env.VITE_APP}/api/quizzes/${quizId}`,
        { withCredentials: true }
      );

      const studentAnswers = progressRes.data.data.progress?.answers || [];
      const currentIndex = progressRes.data.data.progress?.currentQuestionIndex || 0;
      const timeLeft = progressRes.data.data.progress?.timeLeft || 0;

      console.log("[AUTO_SUBMIT] Got progress, submitting with:", {
        answersCount: studentAnswers.length,
        currentIndex,
        timeLeft,
        quizId,
      });
      console.log("[AUTO_SUBMIT] Full answers:", studentAnswers);

      // Submit the quiz
      const submitRes = await axios.post(
        `${import.meta.env.VITE_APP}/api/quizzes/${quizId}/submit`,
        {
          answers: studentAnswers,
          currentQuestionIndex: currentIndex,
        },
        { withCredentials: true }
      );

      console.log("[AUTO_SUBMIT] Submit response:", submitRes.data);

      if (submitRes.data.success) {
        console.log("[AUTO_SUBMIT] ✅ Quiz submitted successfully");
        console.log("[AUTO_SUBMIT] Score:", submitRes.data.totalScore, "/", submitRes.data.totalQuestions);
        toast.success("Block expired! Quiz auto-submitted!");
        localStorage.removeItem("blockData");
        
        setTimeout(() => {
          navigate("/thankyou", { replace: true });
        }, 1500);
      } else {
        throw new Error(submitRes.data.message || "Submit failed");
      }
    } catch (err) {
      console.error("[AUTO_SUBMIT] ❌ Error:", err);
      toast.error("Auto-submit error. Redirecting...");
      localStorage.removeItem("blockData");
      
      setTimeout(() => {
        navigate("/", { replace: true });
      }, 1500);
    }
  };

  // 🔹 Enter fullscreen
  const enterFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
    } catch (err) {
      console.error("Fullscreen failed:", err);
    }
  };

  // 🔹 Auto-submit when fullscreen is exited
  const handleFullscreenChange = () => {
    if (!document.fullscreenElement && !expired) {
      handleSubmit();
    }
  };

  useEffect(() => {
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [expired]);

  const handleSubmit = () => {
    toast.error("You exited fullscreen. Quiz auto-submitted!");
    // 👉 Put your actual submit logic here
    // navigate(`/quiz/${quizId}/submit`);
  };

  // 🔹 Block browser back button
  useEffect(() => {
    window.history.pushState(null, "", window.location.pathname);

    const handleBackButton = (event) => {
      event.preventDefault();
      window.history.pushState(null, "", window.location.pathname);
    };

    window.addEventListener("popstate", handleBackButton);
    return () => {
      window.removeEventListener("popstate", handleBackButton);
    };
  }, []);

  const progress =
    blockData?.remainingSeconds
      ? Math.min(100, (countdown / blockData.remainingSeconds) * 100)
      : 0;

 return (
  <div className="min-h-screen w-full flex items-center justify-center bg-black text-white select-none">
    <Toaster />

    <div className="w-full max-w-2xl bg-[#0f0f0f] border border-gray-800 rounded-2xl shadow-2xl p-10 text-center">
      {/* Icon */}
      <div className="text-7xl mb-6 text-yellow-400">⏸️</div>

      {/* Title */}
      <h1 className="text-4xl font-bold mb-3 tracking-wide">
        Quiz Blocked
      </h1>

      <p className="text-lg text-gray-400 mb-8">
        You have been temporarily blocked for violating quiz rules.  
        Please remain in fullscreen until the timer ends.
        <br />
        <span className="text-yellow-400 font-semibold mt-2 block">
          ⚠️ You will lose 30 seconds from your quiz time for this penalty.
        </span>
        <br />
        <span className="text-sm text-gray-300 mt-2 block">
          📋 After timer expires:
        </span>
        <span className="text-sm text-red-400 block">
          • If you are NOT in fullscreen → Quiz will AUTO-SUBMIT
        </span>
        <span className="text-sm text-red-400 block">
          • If you switch tabs → Quiz will AUTO-SUBMIT immediately
        </span>
        <span className="text-sm text-green-400 block">
          • If you stay in fullscreen → Resume quiz with 30 second penalty applied
        </span>
      </p>

      {/* Countdown */}
      <div className="bg-black border border-gray-700 rounded-xl py-8 px-6 mb-8">
        <div className="text-7xl font-mono font-bold text-yellow-400">
          {countdown}s
        </div>
        <p className="text-sm text-gray-400 mt-2">
          seconds remaining
        </p>
      </div>

      {/* Progress Bar */}
      {blockData && (
        <div className="w-full mb-8">
          <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-yellow-400 transition-all duration-1000"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Block progress
          </p>
        </div>
      )}

      {/* Warning Text */}
      {!expired && (
        <div className="text-sm text-red-400 mb-6">
          ⚠ Do not exit fullscreen or switch tabs.  
          Any violation will auto-submit your quiz.
        </div>
      )}

      {/* Enter Fullscreen Button */}
      {!expired && (
        <button
          onClick={enterFullscreen}
          className="px-6 py-3 rounded-lg bg-yellow-400 text-black font-semibold hover:bg-yellow-300 transition"
        >
          Enter Fullscreen
        </button>
      )}

      {/* Expired Message */}
      {expired && (
        <div className="mt-6">
          <p className="text-xl text-green-400 font-semibold">
            Block expired!
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Processing result...
          </p>
        </div>
      )}
    </div>
  </div>
);

};

export default BlockedWait;
