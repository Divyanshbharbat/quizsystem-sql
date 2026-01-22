import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import Navbar from "../../components/Navbar";
import toast, { Toaster } from "react-hot-toast";
import {
  seededShuffle,
  randomShuffle,
  blockStudent,
  handleCheatingDetected,
  resetWindowFocusTracking,
  incrementWindowFocusLossCount,
  getWindowFocusLossCount,
} from "../../utils/quizsecurity.mjs";

/* =========================
   Small presentational pieces
   ========================= */
const OptionButton = ({ option, isSelected, onClick, disabled }) => (
  <button
    onClick={() => !disabled && onClick(option)}
    className={`flex items-center justify-center text-center gap-2 p-4 md:p-5 rounded-xl border-3 transition-all duration-200 transform hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-offset-2 select-none break-words font-semibold text-base md:text-lg
      ${isSelected
        ? "bg-gradient-to-br from-green-500 to-green-600 text-white border-green-700 shadow-2xl scale-105"
        : "bg-gradient-to-br from-white to-gray-50 border-gray-300 hover:border-green-500 hover:shadow-lg hover:scale-102"}`}
    style={{ userSelect: "none", minHeight: 80 }}
    disabled={disabled}
    aria-pressed={isSelected}
  >
    <span className="leading-tight">{option}</span>
  </button>
);

const QuestionComponent = ({ question, selectedOption, onOptionSelect, disabled }) => {
  const [imageLoaded, setImageLoaded] = React.useState(false);
  const [imageError, setImageError] = React.useState(false);

  // Safety check
  if (!question || !question.options) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-lg text-center text-gray-600">
        <p className="text-lg">Loading question...</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 md:p-6 rounded-xl shadow-lg mb-6 select-none transition duration-300 hover:shadow-2xl">
      <div className="text-sm text-gray-500 mb-2">Subcategory: {question.subcategory || "N/A"}</div>
      <h2 className="text-lg md:text-2xl font-semibold mb-3 md:mb-4 leading-tight">
        {question.question || "No question text"}
        {question.description && (
          <span className="block text-sm text-gray-500 mt-1">{question.description}</span>
        )}
      </h2>

      {question.image ? (
        <div className="flex flex-col gap-6">
          {/* IMAGE SECTION - OPTIMIZED HEIGHT */}
          <div className="w-full flex justify-center items-center">
            <div className="w-full rounded-lg overflow-hidden border-4 border-blue-300 relative bg-gradient-to-br from-gray-50 to-gray-100" style={{ maxHeight: "45vh", maxWidth: "100%" }}>
              {!imageLoaded && !imageError && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
                  <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-b-4 border-blue-500"></div>
                    <p className="mt-3 text-gray-700 text-lg font-semibold">Loading image...</p>
                  </div>
                </div>
              )}
              {imageError && (
                <div className="absolute inset-0 flex items-center justify-center bg-red-100 z-10">
                  <div className="text-center p-6">
                    <p className="text-red-700 font-bold text-xl">❌ Failed to load image</p>
                    <p className="text-sm text-red-600 mt-2 break-all">{question.image}</p>
                  </div>
                </div>
              )}
              <img
                src={question.image}
                alt="Question"
                className="w-full h-full object-contain block"
                draggable={false}
                onContextMenu={(e) => e.preventDefault()}
                onLoad={() => setImageLoaded(true)}
                onError={() => {
                  setImageLoaded(true);
                  setImageError(true);
                  console.error("[IMAGE ERROR] Failed to load image:", question.image);
                }}
                style={{ display: imageLoaded && !imageError ? "block" : "none", minHeight: "200px" }}
              />
            </div>
          </div>

          {/* OPTIONS SECTION - VISIBLE WITHOUT SCROLLING */}
          <div className="w-full">
            <p className="text-sm font-semibold text-gray-600 mb-3">Select your answer:</p>
            <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(260px, 100%), 1fr))" }}>
              {question.options.map((opt, idx) => (
                <OptionButton
                  key={idx}
                  option={opt}
                  isSelected={selectedOption === opt}
                  onClick={onOptionSelect}
                  disabled={disabled}
                />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(280px, 100%), 1fr))" }}>
          {question.options.map((opt, idx) => (
            <OptionButton
              key={idx}
              option={opt}
              isSelected={selectedOption === opt}
              onClick={onOptionSelect}
              disabled={disabled}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const NavigationButtons = ({ currentIndex, totalQuestions, canSubmit, onPrev, onNext, onSubmit, submitting, disabled }) => (
  <div className="mt-6 w-full select-none">
    <div className="relative">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex gap-3 w-full sm:w-auto">
          <button
            aria-label="Previous Question"
            disabled={currentIndex === 0 || disabled}
            onClick={onPrev}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white text-blue-700 border border-blue-200 hover:bg-blue-50 py-4 px-6 rounded-xl shadow-md transition transform hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed text-lg font-semibold"
            style={{ minWidth: 140 }}
          >
            Previous
          </button>

          <button
            aria-label="Next Question"
            disabled={currentIndex === totalQuestions - 1 || disabled}
            onClick={onNext}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 px-6 rounded-xl shadow-md transition transform hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed text-lg font-semibold"
            style={{ minWidth: 140 }}
          >
            Next
          </button>
        </div>

        <div className="w-full sm:w-auto">
          <button
            onClick={onSubmit}
            disabled={!canSubmit || submitting || disabled}
            className={`w-full py-4 px-6 rounded-xl text-white transition duration-300 shadow-lg font-semibold ${
              canSubmit && !submitting && !disabled
                ? "bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800"
                : "bg-gray-400 cursor-not-allowed"
            }`}
          >
            {submitting ? "Submitting..." : currentIndex === totalQuestions - 1 ? "Submit" : "Submit"}
          </button>
        </div>
      </div>
    </div>
  </div>
);

const TimerBar = ({ timeLeft, totalTime }) => {
  const percentage = (timeLeft / totalTime) * 100;
  const bgColor = percentage > 50 ? "bg-green-500" : percentage > 20 ? "bg-yellow-400" : "bg-red-500";
  return (
    <div className="w-full h-3 sm:h-4 bg-gray-300 rounded-full overflow-hidden mb-4 shadow-inner">
      <div className={`${bgColor} h-3 sm:h-4 transition-all duration-500`} style={{ width: `${percentage}%` }} />
    </div>
  );
};

/* =========================
   Main Quiz Component
   ========================= */
const Quiz = () => {
  const [selections, setSelections] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);
  const [timeLeft, setTimeLeft] = useState(15 * 60);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [student, setStudent] = useState(null);
  const [progressLoaded, setProgressLoaded] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [startingCountdown, setStartingCountdown] = useState(3);
  const [showStartingLoader, setShowStartingLoader] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [quizFrozen, setQuizFrozen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState("idle");
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [blockCountdown, setBlockCountdown] = useState(0);
  const [quiz, setQuiz] = useState(null);
  const [isDeliberateNavigation, setIsDeliberateNavigation] = useState(false);
  const [cheatWarningShown, setCheatWarningShown] = useState(false);
  const [backNavBlocked, setBackNavBlocked] = useState(false);
  const [escapeAttemptBlocked, setEscapeAttemptBlocked] = useState(false);
  const [lastEscapeAttemptTime, setLastEscapeAttemptTime] = useState(0);
  const [isMobileDevice, setIsMobileDevice] = useState(false);

  const { quizId } = useParams();
  const navigate = useNavigate();
  const timerRef = useRef(null);
  const timeLeftRef = useRef(null);
  const stateRef = useRef({ quizFrozen: false, submitting: false, quizCompleted: false });
  

  const [windowLostFocus, setWindowLostFocus] = useState(false);
  const [windowFocusWarnings, setWindowFocusWarnings] = useState(0);

  /* ---------------------
     Keep state ref updated with current values
  --------------------- */
  useEffect(() => {
    stateRef.current = { quizFrozen, submitting, quizCompleted };
    // ✅ Sync quizFrozen to window for security listener to check
    window._quizFrozen = quizFrozen;

    // ✅ Notify Electron about quiz state
    if (window.electronAPI) {
      if (progressLoaded && !quizCompleted && !quizFrozen) {
        window.electronAPI.quizStarted().catch(console.error);
      } else if (quizFrozen) {
        window.electronAPI.quizBlocked().catch(console.error);
      }
    }
  }, [quizFrozen, submitting, quizCompleted, progressLoaded]);

  /* ---------------------
     Fullscreen helpers (local)
  --------------------- */
  const enterFullscreen = () => {
    // Don't use async - browser security requires sync call from user event
    try {
      const el = document.documentElement;
      if (el.requestFullscreen) {
        el.requestFullscreen().catch(e => console.warn("Fullscreen request denied:", e));
      } else if (el.webkitRequestFullscreen) {
        el.webkitRequestFullscreen();
      }
    } catch (e) {
      console.warn("Fullscreen request denied:", e);
    }
  };

  const exitFullscreen = async () => {
    try {
      if (document.exitFullscreen) await document.exitFullscreen();
      else if (document.webkitExitFullscreen) await document.webkitExitFullscreen();
    } catch (e) {
      console.warn("Exit fullscreen failed:", e);
    }
  };

  /* ---------------------
     Mobile Device Detection
  --------------------- */
  useEffect(() => {
    const isMobileUserAgent = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
      navigator.userAgent.toLowerCase()
    );
    const isSmallScreen = window.innerWidth < 768;
    const isMobile = isMobileUserAgent || isSmallScreen;
    setIsMobileDevice(isMobile);
    console.log(`[MOBILE DETECTION] UserAgent mobile: ${isMobileUserAgent}, Small screen: ${isSmallScreen}, Final: ${isMobile}`);
  }, []);

  /* ---------------------
     Window Focus Detection - Block student if they switch tabs/windows
     Detects when browser window loses focus during quiz
  --------------------- */
  useEffect(() => {
    if (!progressLoaded || quizCompleted || quizFrozen) return;

    // Track window focus changes
    const handleWindowBlur = () => {
      console.log("[WINDOW BLUR] Student switched tabs or windows");
      const focusLossCount = incrementWindowFocusLossCount();
      setWindowLostFocus(true);
      setWindowFocusWarnings(focusLossCount);
      
      // Show warning
      toast.error("⚠️ You switched tabs! Stay in the quiz window.");

      // On first blur = block for 30 seconds (WARNING: Very strict - can change to >= 2 later)
      if (focusLossCount >= 1 && !quizFrozen) {
        console.warn("[WINDOW BLUR BLOCK] Tab switch detected (count=" + focusLossCount + ") - BLOCKING student");
        
        // ✅ Call blockStudent to trigger the backend block
        blockStudent(quizId).then(result => {
          console.log("[WINDOW BLUR BLOCK] blockStudent response:", result);
          if (result && result.expiresAt) {
            setQuizFrozen(true);
            setBlockCountdown(result.remainingSeconds || 30);
            window._blockExpiresAt = result.expiresAt;
            toast.error("⚠️ You have been BLOCKED for leaving the quiz tab! Block duration: 30 seconds");
            // Reset focus loss tracking
            resetWindowFocusTracking();
          }
        }).catch(err => {
          console.error("Failed to block on window blur:", err);
        });
      }
    };

    const handleWindowFocus = () => {
      console.log("[WINDOW FOCUS] Student returned to quiz, blur count was:", windowFocusWarnings);
      setWindowLostFocus(false);
      
      // If not blocked, just welcome them back
      if (!quizFrozen) {
        toast.success("✅ Welcome back to the quiz!");
      }
    };

    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [progressLoaded, quizCompleted, quizFrozen, quizId, windowFocusWarnings]);

  /* ---------------------
     Monitor Deliberate Navigation (Intentional Click Away)
     Network disconnect (no user action): Save progress, NO block
     Deliberate navigation (user clicks a link): Block student
  --------------------- */
  useEffect(() => {
    // Detect when student intentionally clicks a link to navigate away from quiz
    const handleClick = (e) => {
      const target = e.target;
      const link = target?.closest('a');
      
      // If they clicked a link and it's going away from quiz page
      if (link && !window.location.pathname.includes('/quiz/')) {
        console.log("[NAV] Student clicked to navigate away from quiz - marking as deliberate");
        setIsDeliberateNavigation(true);
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  /* ---------------------
     Handle Page Unload (Network Loss vs Deliberate Navigation)
     Network loss: Just save progress, NO block
     Deliberate navigation: Save progress and BLOCK
  --------------------- */
  useEffect(() => {
    const handleBeforeUnload = async (e) => {
      // Always save progress first (network loss, power off, etc)
      if (!quizCompleted && progressLoaded) {
        const safeTimeLeft =
          typeof timeLeftRef.current === "number" && timeLeftRef.current >= 0
            ? timeLeftRef.current
            : (quiz?.timeLimit || 15) * 60;

        try {
          // Use keepalive for quick save during unload
          await fetch(`${import.meta.env.VITE_APP}/api/quizzes/${quizId}/save-progress`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            keepalive: true,
            body: JSON.stringify({
              currentQuestionIndex,
              answers,
              timeLeft: safeTimeLeft,
            }),
          });
          console.log("[UNLOAD] Emergency save completed (network loss or system shutdown)");
        } catch (err) {
          console.error("[UNLOAD] Emergency save failed:", err);
          // Even if save fails, don't block - could be network issue or power loss
        }
      }

      // ✅ ONLY block if it's DELIBERATE navigation (user intentionally clicked away)
      // If it's network loss, power off, or browser crash, we DON'T block
      if (isDeliberateNavigation && !quizCompleted) {
        console.log("[UNLOAD] Deliberate navigation detected - BLOCKING student");
        // Block student only for intentional navigation away
        try {
          await fetch(`${import.meta.env.VITE_APP}/api/quizzes/${quizId}/block`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            keepalive: true,
            body: JSON.stringify({ reason: "deliberate_navigation" }),
          });
        } catch (err) {
          console.error("Failed to block on navigation:", err);
        }
        // Show warning to student
        e.preventDefault();
        e.returnValue = "You will be blocked if you leave now!";
        return "You will be blocked if you leave now!";
      } else if (!quizCompleted) {
        console.log("[UNLOAD] Network disconnect/power loss detected - NO block, just saved progress");
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [quizCompleted, progressLoaded, isDeliberateNavigation, currentQuestionIndex, answers, quizId, quiz]);


  /* ---------------------
     Load Student & Quiz
  --------------------- */
useEffect(() => {
  const loadData = async () => {
    try {
      // Load student info
      const { data: studentData } = await axios.get(
        `${import.meta.env.VITE_APP}/api/student/me`,
        { withCredentials: true }
      );
      if (studentData.success) setStudent(studentData.student);
      else handleLogout();
    } catch {
      handleLogout();
    }

    try {
      // Fetch quiz and progress
      const { data } = await axios.get(
        `${import.meta.env.VITE_APP}/api/quizzes/${quizId}`,
        { withCredentials: true }
      );
      console.log("fetching data in quiz.jsx",data)
      
      // ✅ Check if student is BLOCKED FIRST (before checking success)
      const isBlocked = data.blocked || false;
      const remainingSeconds = data.remainingSeconds || 0;
      const expiresAt = data.expiresAt || 0;
      
      console.log("[QUIZ LOAD] Checking block state:");
      console.log("   isBlocked:", isBlocked);
      console.log("   remainingSeconds:", remainingSeconds);
      console.log("   expiresAt:", expiresAt);
      
      // ✅ If blocked, handle it regardless of success flag
      if (isBlocked) {
        console.log("[QUIZ LOAD] Student is BLOCKED - handling block screen");
        
        let initialBlockDuration = 0;
        if (expiresAt) {
          const now = Date.now();
          initialBlockDuration = Math.ceil((expiresAt - now) / 1000);
          initialBlockDuration = Math.max(0, initialBlockDuration);
        } else if (remainingSeconds > 0) {
          initialBlockDuration = remainingSeconds;
        } else {
          initialBlockDuration = 30; // fallback
        }
        
        console.log(`[BLOCK LOAD] Initial duration: ${initialBlockDuration}s, expiresAt: ${new Date(expiresAt).toISOString()}`);
        
        if (initialBlockDuration > 0) {
          setQuizFrozen(true);
          setBlockCountdown(initialBlockDuration);
          toast.error(data.message || "You are blocked from this quiz.");
          
          // ✅ Store expiresAt for countdown calculation
          if (expiresAt) {
            window._blockExpiresAt = expiresAt;
          }
          
          // ✅ PROPER COUNTDOWN LOGIC - Calculate from expiresAt timestamp (works on refresh/relogin)
          console.log(`[BLOCK COUNTDOWN] Starting countdown from ${initialBlockDuration} seconds`);
          
          // Clear any previous interval
          if (window._blockCountdownInterval) {
            clearInterval(window._blockCountdownInterval);
          }
          
          // Update countdown every 1 second for smooth display
          const countdownInterval = setInterval(() => {
            // ✅ FIXED: Calculate remaining time from expiresAt, not just decrement
            if (window._blockExpiresAt) {
              const now = Date.now();
              let timeRemaining = Math.ceil((window._blockExpiresAt - now) / 1000);
              timeRemaining = Math.max(0, timeRemaining); // Don't go below 0
              
              console.log(`[BLOCK COUNTDOWN] Server time: ${new Date().toISOString()}, Expires: ${new Date(window._blockExpiresAt).toISOString()}, Remaining: ${timeRemaining}s`);
              setBlockCountdown(timeRemaining);
              
              // When countdown reaches 0, RESUME QUIZ (don't redirect)
              if (timeRemaining <= 0) {
                console.log("[BLOCK COUNTDOWN] Block expired - resuming quiz");
                clearInterval(countdownInterval);
                window._blockCountdownInterval = null;
                setQuizFrozen(false);
                toast.success("✅ Block expired - resuming quiz!");
                console.log("[BLOCK COUNTDOWN] Quiz unfrozen, student can continue");
              }
            }
          }, 1000); // Update every 1 second
          
          window._blockCountdownInterval = countdownInterval;
        } else if (initialBlockDuration === 0) {
          console.log("[BLOCK LOAD] Block time already expired - unfreezing quiz");
          setQuizFrozen(false);
          // Continue loading quiz normally
        }
        
        // ✅ Continue to load quiz even if was blocked (block expired)
        // DON'T return here - let quiz load
      }
      
      // ✅ Only check success if NOT blocked
      if (!data.success) {
        navigate("/");
        return;
      }

      const quiz = data.data.quizConfig;
      const progress = data.data.progress;
      const selectionsWithQuestions = data.data.selectionsWithQuestions; // ✅ Get questions from backend
      
      console.log("[QUIZ LOAD] ✅ Backend response received");
      console.log("[QUIZ LOAD] QuizConfig:", {
        id: quiz?.id,
        title: quiz?.title,
        timeLimit: quiz?.timeLimit,
      });
      console.log("[QUIZ LOAD] Progress:", progress);
      console.log("[QUIZ LOAD] Selections structure:", {
        isArray: Array.isArray(selectionsWithQuestions),
        count: selectionsWithQuestions?.length || 0,
        structure: selectionsWithQuestions?.map(s => ({
          subcategory: s.subcategory,
          questionsCount: s.questions?.length || 0,
        })) || [],
      });
      
      if (!selectionsWithQuestions || selectionsWithQuestions.length === 0) {
        console.error("[QUIZ LOAD] ❌ CRITICAL: selectionsWithQuestions is empty or undefined!");
        console.error("[QUIZ LOAD] Full data object:", data.data);
        return;
      }
      
      if (selectionsWithQuestions && selectionsWithQuestions.length > 0) {
        console.log("[QUIZ LOAD] First selection:", selectionsWithQuestions[0]);
        if (selectionsWithQuestions[0].questions && selectionsWithQuestions[0].questions.length > 0) {
          console.log("[QUIZ LOAD] First question:", selectionsWithQuestions[0].questions[0]);
          console.log("[QUIZ LOAD] Has image?", selectionsWithQuestions[0].questions[0].image ? "✅ YES" : "❌ NO");
        }
      }
      const isCompleted = data.completed || false;

      // ✅ Check if student already completed
      if (isCompleted) {
        toast.error("You have already submitted this quiz. You cannot take it again.");
        navigate("/thankyou", { replace: true });
        return;
      }

      setQuiz(quiz);

      // Use timeLeft directly from backend
      let initialTimeLeft = typeof progress?.timeLeft === "number"
        ? progress.timeLeft
        : quiz.timeLimit * 60;

      console.log("[QUIZ LOAD] TimeLeft from backend:", initialTimeLeft, "seconds");
      console.log("[QUIZ LOAD] Quiz timeLimit:", quiz.timeLimit, "minutes =", quiz.timeLimit * 60, "seconds");
      console.log("[QUIZ LOAD] Time penalty applied (if blocked):", (quiz.timeLimit * 60 - initialTimeLeft), "seconds");

      setTimeLeft(initialTimeLeft);

      console.log("[QUIZ LOAD] About to set selections with:", selectionsWithQuestions);
      setSelections(selectionsWithQuestions || []); // ✅ Use selectionsWithQuestions instead of quiz.selections
      console.log("[QUIZ LOAD] setSelections called");

      // Load progress if exists
      if (progress) {
        console.log("[QUIZ LOAD] Has existing progress, setting current question and skipping countdown");
        setCurrentQuestionIndex(progress.currentQuestionIndex || 0);
        setAnswers(progress.answers || []);
        setShowStartingLoader(false); // skip countdown if resuming
      } else {
        console.log("[QUIZ LOAD] No existing progress, will show countdown");
      }

      console.log("[QUIZ LOAD] About to call setProgressLoaded(true)");
      setProgressLoaded(true);
      console.log("[QUIZ LOAD] ✅ setProgressLoaded(true) CALLED!");
      // Request fullscreen synchronously (after short delay for render)
      setTimeout(() => enterFullscreen(), 100);
    } catch (error) {
      console.error("[QUIZ LOAD ERROR]", error);
      
      // ✅ Handle 403 Forbidden (Student is blocked)
      if (error.response?.status === 403 && error.response?.data?.blocked) {
        console.log("[QUIZ LOAD] 403 Blocked response received");
        const blockedData = error.response.data;
        const isBlocked = blockedData.blocked || false;
        const remainingSeconds = blockedData.remainingSeconds || 0;
        const expiresAt = blockedData.expiresAt || 0;
        
        console.log("[QUIZ LOAD ERROR] Student BLOCKED:");
        console.log("   isBlocked:", isBlocked);
        console.log("   remainingSeconds:", remainingSeconds);
        console.log("   expiresAt:", expiresAt);
        
        if (isBlocked && expiresAt > 0) {
          let initialBlockDuration = 0;
          if (expiresAt) {
            const now = Date.now();
            initialBlockDuration = Math.ceil((expiresAt - now) / 1000);
            initialBlockDuration = Math.max(0, initialBlockDuration);
          } else if (remainingSeconds > 0) {
            initialBlockDuration = remainingSeconds;
          } else {
            initialBlockDuration = 30;
          }
          
          console.log(`[BLOCK ERROR HANDLER] Initial duration: ${initialBlockDuration}s, expiresAt: ${new Date(expiresAt).toISOString()}`);
          
          if (initialBlockDuration > 0) {
            setQuizFrozen(true);
            setBlockCountdown(initialBlockDuration);
            toast.error(blockedData.message || "You are blocked from this quiz.");
            
            if (expiresAt) {
              window._blockExpiresAt = expiresAt;
            }
            
            // Clear any previous interval
            if (window._blockCountdownInterval) {
              clearInterval(window._blockCountdownInterval);
            }
            
            console.log(`[BLOCK ERROR HANDLER] Starting countdown from ${initialBlockDuration}s`);
            
            const countdownInterval = setInterval(() => {
              if (window._blockExpiresAt) {
                const now = Date.now();
                let timeRemaining = Math.ceil((window._blockExpiresAt - now) / 1000);
                timeRemaining = Math.max(0, timeRemaining);
                
                console.log(`[BLOCK ERROR COUNTDOWN] Remaining: ${timeRemaining}s`);
                setBlockCountdown(timeRemaining);
                
                if (timeRemaining <= 0) {
                  console.log("[BLOCK ERROR COUNTDOWN] Block expired - resuming quiz");
                  clearInterval(countdownInterval);
                  window._blockCountdownInterval = null;
                  setQuizFrozen(false);
                  toast.success("✅ Block expired - resuming quiz!");
                }
              }
            }, 1000);
            
            window._blockCountdownInterval = countdownInterval;
          } else if (initialBlockDuration === 0) {
            console.log("[BLOCK ERROR HANDLER] Block already expired - unfreezing");
            setQuizFrozen(false);
            // Continue loading quiz
          }
          
          // ✅ Continue loading quiz (don't return)
        }
      }
      
      // Other errors
      console.error("Failed to load quiz:", error.message);
      navigate("/");
    }
  };

  loadData();
}, [quizId]);


  /* ---------------------
     Shuffle Questions & Options
  --------------------- */
useEffect(() => {
  console.log("[SHUFFLE] Check conditions:", {
    selectionsLength: selections.length,
    progressLoaded,
    hasStudent: !!student,
    answersLength: answers.length,
  });
  
  if (selections.length > 0 && progressLoaded && student) {
    let flatQuestions = [];

    selections.forEach((s, idx) => {
      console.log(`[SHUFFLE] Processing selection ${idx + 1}/${selections.length}:`, {
        subcategory: s.subcategory,
        questionsCount: s.questions?.length || 0,
        questionsLoaded: !!s.questions,
      });
      
      if (!s.questions || !Array.isArray(s.questions)) {
        console.warn("[SHUFFLE] ⚠️ Selection has no questions array:", s);
        return;
      }

      s.questions.forEach((q, qIdx) => {
        if (!q) {
          console.warn("[SHUFFLE] ⚠️ Question is null/undefined at index", qIdx);
          return;
        }
        
        if (!q.options) {
          console.warn("[SHUFFLE] ⚠️ Question missing options:", q);
          return;
        }

        // Use selectedOption from backend (already set based on progress)
        const savedAnswer = q.selectedOption || null;

        const processedQuestion = {
          ...q,
          subcategory: s.subcategory,
          options: seededShuffle(q.options, student.id + q.id),
          savedSelectedOption: savedAnswer,
        };
        
        flatQuestions.push(processedQuestion);
        console.log(`[SHUFFLE] Added Q${q.id}:`, {
          type: q.type || "text",
          hasImage: !!q.image,
          optionsCount: q.options.length,
        });
      });
    });

    console.log("[SHUFFLE] ✅ Flat questions created:", {
      total: flatQuestions.length,
      subcategories: selections.length,
    });
    
    if (flatQuestions.length === 0) {
      console.error("[SHUFFLE] ❌ ERROR: No questions were processed from selections!");
      console.error("[SHUFFLE] Selections structure:", JSON.stringify(selections));
      return;
    }

    const shuffled = seededShuffle(flatQuestions, student.id + quizId);
    console.log("[SHUFFLE] ✅ Final shuffled questions:", {
      total: shuffled.length,
      firstQuestion: shuffled[0]?.id || "N/A",
    });
    
    setQuestions(shuffled);
  } else {
    console.log("[SHUFFLE] ⏳ Waiting for conditions - selections:", selections.length, "loaded:", progressLoaded, "student:", !!student);
  }
}, [selections, progressLoaded, student, answers]);


  /* ---------------------
     Starting Countdown
  --------------------- */
  useEffect(() => {
    console.log("[COUNTDOWN EFFECT]", {
      progressLoaded,
      questionsLength: questions.length,
      startingCountdown,
      showStartingLoader,
    });

    if (!progressLoaded || questions.length === 0) {
      console.log("[COUNTDOWN EFFECT] Skipping - conditions not met");
      return;
    }

    // ✅ If we already have questions loaded AND progressLoaded is true, 
    // don't show countdown - go straight to quiz
    if (startingCountdown > 0) {
      console.log("[COUNTDOWN EFFECT] Countdown active:", startingCountdown);
      const timer = setTimeout(() => {
        console.log("[COUNTDOWN EFFECT] Decrementing countdown");
        setStartingCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      console.log("[COUNTDOWN EFFECT] Countdown complete (or skipped), hiding loader");
      if (showStartingLoader) {
        console.log("[COUNTDOWN EFFECT] Setting showStartingLoader to false");
        setShowStartingLoader(false);
      }
    }
  }, [startingCountdown, progressLoaded, questions.length, showStartingLoader]);

  /* ---------------------
     Save Progress
  --------------------- */
  const saveProgress = async (answerList = answers) => {
    if (quizCompleted || !progressLoaded) return;
    // ✅ IMPORTANT: Allow saving timeLeft EVEN when quizFrozen=true
    // This ensures timer penalty during block is persisted to database
    const safeTimeLeft =
      typeof timeLeftRef.current === "number" && timeLeftRef.current >= 0
        ? timeLeftRef.current
        : (quiz?.timeLimit || 15) * 60;
    
    const payload = {
      currentQuestionIndex,
      answers: answerList,
      timeLeft: safeTimeLeft,
    };

    console.log("Saving progress:", payload);
    setSaving(true);
    setSaveStatus("saving");
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_APP}/api/quizzes/${quizId}/save-progress`,
        payload,
        { withCredentials: true }
      );
      setLastSavedAt(Date.now());
      setSaveStatus("saved");
      // keep "saved" visible briefly
      setTimeout(() => setSaveStatus((s) => (s === "saved" ? "idle" : s)), 2000);
    } catch (e) {
      console.error("Save progress error:", e);
      setSaveStatus("error");
    } finally {
      setSaving(false);
    }
  };

  // NOTE: we intentionally do NOT auto-save on every `timeLeft` change
  // because the timer updates every second and would cause a save each second.
  // Saving happens immediately on option selection (see `handleOptionClick`), on Next button click, and
  // via the 5s autosave interval below. This reduces unnecessary network calls.

  /* ---------------------
     Timer
  --------------------- */

  // Keep ref updated
  useEffect(() => {
    timeLeftRef.current = timeLeft;
  }, [timeLeft]);
 useEffect(() => {
  console.log("Timer useEffect running, conditions:", { progressLoaded, quizCompleted, submitting, timeLeft, quizFrozen });
  // ✅ IMPORTANT: Timer should continue running even when quizFrozen is true
  // This ensures students get penalized for cheating by losing time
  if (!progressLoaded || quizCompleted || submitting || timeLeft <= 0) {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return;
  }

  if (!timerRef.current) {
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        console.log("Timer ticking, prev timeLeft:", prev);
        if (prev <= 1) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          // ✅ Auto-submit when time runs out, regardless of blocked state
          // handleSubmit() will be called directly with current state
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }
}, [progressLoaded, quizCompleted, submitting]);

// ✅ Separate effect to handle auto-submit when time reaches 0
useEffect(() => {
  if (timeLeft === 0 && progressLoaded && !quizCompleted && !submitting) {
    console.log("[TIMER] Time's up! Auto-submitting quiz...");
    handleSubmit();
  }
}, [timeLeft, progressLoaded, quizCompleted, submitting]);


  /* ---------------------
     Auto-save every 5 seconds
  --------------------- */
useEffect(() => {
  if (!progressLoaded || quizCompleted || submitting) return;
  // ✅ IMPORTANT: Continue auto-saving EVEN when quizFrozen=true
  // This ensures timer penalty during block is persisted to database

  const id = setInterval(() => {
    saveProgress();
  }, 5000);

  return () => clearInterval(id);
}, [progressLoaded, quizCompleted, submitting, currentQuestionIndex, answers])

  /* ---------------------
     OPTIONAL Fullscreen with Cheating Detection
     - Student can take quiz without fullscreen
     - If they INTENTIONALLY exit fullscreen → Block for 30 seconds
     - After 30 seconds: 
       * If back in fullscreen → Resume quiz
       * If still NOT fullscreen → Auto-submit quiz
  --------------------- */
  useEffect(() => {
    if (!progressLoaded || quizCompleted || quizFrozen) return;

    // Listen for when student exits fullscreen
    const handleFullscreenChange = async () => {
      const isFullscreen = !!document.fullscreenElement;
      const isHidden = document.hidden;
      
      console.log(`[FULLSCREEN] isFullscreen=${isFullscreen}, isHidden=${isHidden}`);

      // If NOT in fullscreen AND tab is visible (not alt-tab) AND not already blocked
      // This means student INTENTIONALLY exited fullscreen (cheating)
      if (!isFullscreen && !isHidden && !quizFrozen && !quizCompleted) {
        console.warn("[CHEAT DETECTED] Student intentionally exited fullscreen - BLOCKING from backend");
        toast.error("🚫 CHEATING DETECTED! You exited fullscreen. You are BLOCKED for 30 seconds.");

        // ✅ CALL BACKEND TO SAVE BLOCK
        blockStudent(quizId)
          .then(blockResult => {
            console.log("[FULLSCREEN BLOCK] Backend response:", blockResult);
            
            if (blockResult && blockResult.expiresAt) {
              setQuizFrozen(true);
              const remainingSeconds = blockResult.remainingSeconds || 30;
              setBlockCountdown(remainingSeconds);
              window._blockExpiresAt = blockResult.expiresAt;
              
              console.log(`[FULLSCREEN BLOCK] Student blocked for ${remainingSeconds}s, expiresAt=${blockResult.expiresAt}`);
              
              // Start countdown from backend timestamp
              let timeRemaining = remainingSeconds;
              const countdownInterval = setInterval(() => {
                if (window._blockExpiresAt) {
                  const now = Date.now();
                  timeRemaining = Math.ceil((window._blockExpiresAt - now) / 1000);
                  timeRemaining = Math.max(0, timeRemaining);
                } else {
                  timeRemaining--;
                }
                
                setBlockCountdown(Math.max(0, timeRemaining));
                console.log(`[FULLSCREEN BLOCK] Countdown: ${timeRemaining}s remaining`);

                if (timeRemaining <= 0) {
                  clearInterval(countdownInterval);
                  console.log("[FULLSCREEN BLOCK] Block expired - checking student state");
                  console.log("[FULLSCREEN BLOCK EXPIRED] Current timeLeft:", timeLeft, "seconds");
                  console.log("[FULLSCREEN BLOCK EXPIRED] Time penalty applied: ~30 seconds");

                  // After 30 seconds, check if student is back in fullscreen
                  const isBackInFullscreen = !!document.fullscreenElement;
                  console.log(`[FULLSCREEN BLOCK EXPIRED] Back in fullscreen? ${isBackInFullscreen}`);

                  if (isBackInFullscreen) {
                    // ✅ Student is back in fullscreen → Resume quiz
                    console.log("[RESUME] Student back in fullscreen - resuming quiz");
                    console.log("[RESUME] Student has", timeLeft, "seconds remaining (30s penalty already applied)");
                    setQuizFrozen(false);
                    toast.success("✅ You're back in fullscreen. Quiz resumed!");
                  } else {
                    // ❌ Student still not in fullscreen → Auto-submit
                    console.log("[AUTO-SUBMIT] Student NOT in fullscreen - auto-submitting quiz");
                    console.log("[AUTO-SUBMIT] Current timeLeft:", timeLeft, "seconds (penalty applied)");
                    toast.error("❌ Block expired but you're not in fullscreen. Auto-submitting quiz...");
                    handleSubmit(); // Auto-submit with current answers
                  }
                }
              }, 1000);

              window._blockCountdownInterval = countdownInterval;
            }
          })
          .catch(err => {
            console.error("[FULLSCREEN BLOCK] Error calling backend:", err);
            // Still freeze locally even if backend fails
            setQuizFrozen(true);
            setBlockCountdown(30);
            toast.error("🚫 CHEATING DETECTED! Block applied. Block duration: 30 seconds");
          });
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [progressLoaded, quizCompleted, quizFrozen, quizId]);

  /* ---------------------
     Save progress on page unload (WITHOUT blocking on system shutdown)
  --------------------- */
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Just save, don't block. System shutdown is not student's fault
      const safeTimeLeft =
        typeof timeLeftRef.current === "number" && timeLeftRef.current >= 0
          ? timeLeftRef.current
          : (quiz?.timeLimit || 15) * 60;

      // Use keepalive to ensure save completes
      if (progressLoaded && !quizCompleted) {
        navigator.sendBeacon?.(
          `${import.meta.env.VITE_APP}/api/quizzes/${quizId}/save-progress`,
          JSON.stringify({
            currentQuestionIndex,
            answers,
            timeLeft: safeTimeLeft,
          })
        );
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [currentQuestionIndex, answers, progressLoaded, quizCompleted, quizId, quiz]);

  /* ---------------------
     Option Click
  --------------------- */
  const handleOptionClick = (option) => {
    if (quizFrozen || quizCompleted) return;
    const qId = questions[currentQuestionIndex]?.id; // ✅ Use number ID directly, not string

    const updatedAnswers = [...answers];
    const idx = updatedAnswers.findIndex((a) => a.questionId === qId);
    if (idx !== -1) updatedAnswers[idx].selectedOption = option;
    else updatedAnswers.push({ questionId: qId, selectedOption: option });
    setAnswers(updatedAnswers);
    setSelectedOption(option);
    
    // DEBUG: Log answer selection
    console.log(
      `[ANSWER] Selected Q${qId}: "${option}" | Answers: ${updatedAnswers.length}/${questions.length} | QuestionId=${qId}, currentIndex=${currentQuestionIndex}`
    );
    
    // Immediately request a save for this new selection with the UPDATED answers
    saveProgress(updatedAnswers).catch((err) =>
      console.error("Immediate save failed:", err)
    );
  };

  useEffect(() => {
    const currQ = questions[currentQuestionIndex];
    const qId = currQ?.id;
    const ans = answers.find((a) => a.questionId === qId);
    const selected = ans?.selectedOption ?? currQ?.savedSelectedOption ?? null;
    
    console.log(`[SELECT RESTORE] Index ${currentQuestionIndex}, qId=${qId}, found answer=${!!ans}, selectedOption=${selected}, savedSelectedOption=${currQ?.savedSelectedOption}`);
    setSelectedOption(selected);
  }, [currentQuestionIndex, questions, answers]);

  /* ---------------------
     Submit Quiz
  --------------------- */
  // const handleSubmit = async () => {
  //   if (quizCompleted) return;
  //   try {
  //     setSubmitting(true);
  //     await axios.post(
  //       `${import.meta.env.VITE_APP}/api/quizzes/${quizId}/submit`,
  //       { answers },
  //       { withCredentials: true }
  //     );
  //     setQuizCompleted(true);
  //     exitFullscreen();
  //     navigate("/thankyou");
  //     ///thank-you
  //   } catch (e) {
  //     console.error(e);
  //     setSubmitting(false);
  //   }
  // };

const handleSubmit = async () => {
  if (quizCompleted || submitting) return;

  try {
    setSubmitting(true);

    // Prepare answers in the format backend expects, including unanswered as null
    const enrichedAnswers = questions.map(question => {
      const existingAnswer = answers.find(a => a.questionId === question.id); // ✅ Use number ID
      return {
        questionId: question.id, // ✅ Send as string (e.g., "DSA_0")
        selectedOption: existingAnswer ? existingAnswer.selectedOption : null, // ✅ CORRECT FIELD NAME!
        subcategory: question.subcategory || "Unknown",
      };
    });

    console.log(`[SUBMIT] ⏱️ Submitting quiz ${quizId} at ${new Date().toISOString()}`);
    console.log(`[SUBMIT] Frontend sending ${enrichedAnswers.length} answers:`, enrichedAnswers.slice(0, 3));
    console.log(`[SUBMIT] Answers array size:`, answers.length);
    console.log(`[SUBMIT] Questions array size:`, questions.length);

    // Submit to backend
    const response = await axios.post(
      `${import.meta.env.VITE_APP}/api/quizzes/${quizId}/submit`,
      { answers: enrichedAnswers },
      { withCredentials: true }
    );

    console.log(`[SUBMIT] Backend response:`, response.data);

    if (response.data.success) {
      setQuizCompleted(true);
      
      // Block back navigation after submission by replacing history
      window.history.replaceState({ submitted: true }, "", window.location.href);
      
      // Clear the history stack by pushing new states
      for (let i = 0; i < 5; i++) {
        window.history.pushState({ submitted: true, state: i }, "", window.location.href);
      }
      
      toast.success("Quiz submitted successfully!");
      console.log(`[SUBMIT] Score: ${response.data.totalScore}/${response.data.totalQuestions}`);

      // Optional: navigate to results/thank you page with history replacement
      await exitFullscreen();
      navigate("/thankyou", { replace: true });
    } else {
      setSubmitting(false);
      toast.error(response.data.message || "Submission failed.");
    }
  } catch (e) {
    console.error("Quiz submission error:", e);
    setSubmitting(false);
    toast.error("Submission failed. Please try again.");
  }
};


  /* ---------------------
     Block All Keyboard Shortcuts During Quiz
     Block: Windows/Meta key, Alt+Tab, Escape, F11, Alt+F4, etc.
     Works both during normal quiz and when blocked
  --------------------- */
  useEffect(() => {
    if (!progressLoaded || quizCompleted) return;

    // ✅ Block copy (Ctrl+C / Cmd+C)
    const handleCopy = (e) => {
      e.preventDefault();
      toast.error("🚫 Copying text is disabled during quiz!");
    };

    // ✅ Block right-click context menu
    const handleContextMenu = (e) => {
      e.preventDefault();
      toast.error("🚫 Right-click is disabled during quiz!");
    };

    // ✅ Add listeners for copy and context menu
    document.addEventListener("copy", handleCopy);
    document.addEventListener("contextmenu", handleContextMenu);

    let metaKeyPressed = false; // Track if meta key is held down

    const handleKeyDown = (e) => {
      // Block Windows/Meta key (prevent Windows key functions)
      if (e.key === 'Meta' || e.key === 'OS') {
        e.preventDefault();
        e.stopPropagation();
        metaKeyPressed = true;
        console.warn("[KEYBOARD BLOCKED] Windows/Meta key pressed");
        toast.error("🚫 Windows key is disabled during quiz!");
        return;
      }

      // Block Escape key
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        console.warn("[KEYBOARD BLOCKED] Escape key pressed");
        
        if (!quizFrozen) {
          console.log("[ESC KEY] ⏳ Sending block request to backend...");
          toast.loading("🔄 Processing ESC key block...", { id: "esc-block" });
          
          // ✅ Wait for backend to confirm block is saved
          blockStudent(quizId)
            .then(result => {
              console.log("[ESC KEY] ✅ Backend confirmed block:", result);
              
              if (result && result.expiresAt) {
                // Backend confirmed block is saved to database
                console.log("[ESC KEY] Setting quizFrozen to TRUE");
                setQuizFrozen(true);
                const remainingSeconds = result.remainingSeconds || 30;
                console.log("[ESC KEY] Setting blockCountdown to:", remainingSeconds);
                setBlockCountdown(remainingSeconds);
                window._blockExpiresAt = result.expiresAt;
                
                // Signal to Electron that student is blocked
                if (window.electronAPI?.quizBlocked) {
                  window.electronAPI.quizBlocked().catch(console.error);
                }
                
                toast.error(
                  `🚫 BLOCKED FOR PRESSING ESC!\n\nYou are blocked for ${remainingSeconds} seconds.\n\nDo not attempt to close or exit.`,
                  { id: "esc-block", duration: 5000 }
                );
                console.log(`[ESC KEY] Block confirmed - ${remainingSeconds}s remaining`);
              } else {
                console.error("[ESC KEY] ❌ Invalid result from blockStudent:", result);
                // Still freeze locally even if result is invalid
                setQuizFrozen(true);
                setBlockCountdown(30);
              }
            })
            .catch(err => {
              console.error("[ESC KEY] ❌ Backend call failed:", err);
              console.error("[ESC KEY] Error details:", err.message, err.response?.data);
              // Still freeze locally even if backend call fails (defensive)
              setQuizFrozen(true);
              setBlockCountdown(30);
              toast.error(
                "🚫 BLOCKED FOR PRESSING ESC!\n\n(Block status: backend error but local block applied)",
                { id: "esc-block", duration: 5000 }
              );
            });
        } else {
          console.log("[SECURITY] Escape blocked silently during block state");
        }
        return;
      }

      // Block F12 (Developer Tools)
      if (e.key === 'F12') {
        e.preventDefault();
        e.stopPropagation();
        toast.error("🚫 Developer tools are disabled during quiz!");
        return;
      }

      // Block F11 (fullscreen toggle)
      if (e.key === 'F11') {
        e.preventDefault();
        e.stopPropagation();
        console.warn("[KEYBOARD BLOCKED] F11 key pressed");
        // ✅ Call cheat detection to properly block the student
        if (!quizFrozen) {
          console.log("[F11 KEY] Blocking student via backend API");
          toast.error("🚫 F11 is disabled during quiz! You are BLOCKED.");
          
          // ✅ DIRECTLY call blockStudent to save to backend database
          blockStudent(quizId).then(result => {
            console.log("[F11 KEY] blockStudent response:", result);
            if (result && result.expiresAt) {
              setQuizFrozen(true);
              setBlockCountdown(result.remainingSeconds || 30);
              window._blockExpiresAt = result.expiresAt;
              toast.error("⚠️ You have been BLOCKED for pressing F11! Block duration: 30 seconds");
            }
          }).catch(err => {
            console.error("[F11 KEY] Failed to block:", err);
            // Still freeze locally even if backend call fails
            setQuizFrozen(true);
            setBlockCountdown(30);
          });
        } else {
          console.log("[SECURITY] F11 blocked silently during block state");
        }
        return;
      }

      // Block Alt+Tab
      if (e.altKey && e.key === 'Tab') {
        e.preventDefault();
        e.stopPropagation();
        console.warn("[KEYBOARD BLOCKED] Alt+Tab pressed");
        // ✅ During block state: silently prevent without showing toast
        if (!quizFrozen) {
          toast.error("🚫 Alt+Tab is disabled during quiz!");
        } else {
          console.log("[SECURITY] Alt+Tab blocked silently during block state");
        }
        return;
      }

      // Block Alt+F4
      if (e.altKey && (e.key === 'F4' || e.code === 'F4')) {
        e.preventDefault();
        e.stopPropagation();
        console.warn("[KEYBOARD BLOCKED] Alt+F4 pressed");
        toast.error("🚫 Alt+F4 is disabled during quiz!");
        return;
      }

      // Block Cmd+Tab (macOS)
      if (e.metaKey && e.key === 'Tab') {
        e.preventDefault();
        e.stopPropagation();
        console.warn("[KEYBOARD BLOCKED] Cmd+Tab pressed");
        toast.error("🚫 Cmd+Tab is disabled during quiz!");
        return;
      }

      // Block Cmd+H (macOS)
      if (e.metaKey && e.key === 'h') {
        e.preventDefault();
        e.stopPropagation();
        console.warn("[KEYBOARD BLOCKED] Cmd+H pressed");
        toast.error("🚫 Cmd+H is disabled during quiz!");
        return;
      }

      // Block Ctrl+Tab
      if (e.ctrlKey && e.key === 'Tab') {
        e.preventDefault();
        e.stopPropagation();
        console.warn("[KEYBOARD BLOCKED] Ctrl+Tab pressed");
        toast.error("🚫 Ctrl+Tab is disabled during quiz!");
        return;
      }

      // Block arrow left key (browser back)
      if (e.key === 'ArrowLeft' && e.altKey) {
        e.preventDefault();
        e.stopPropagation();
        console.warn("[KEYBOARD BLOCKED] Alt+ArrowLeft (browser back) pressed");
        toast.error("🚫 Browser back is disabled during quiz!");
        return;
      }
    };

    // Also block keyup event for Meta key to prevent any system action
    const handleKeyUp = (e) => {
      if (e.key === 'Meta' || e.key === 'OS') {
        e.preventDefault();
        e.stopPropagation();
        metaKeyPressed = false;
        console.warn("[KEYBOARD BLOCKED] Windows/Meta key released");
      }
    };

    // Aggressive blocking: listen to both keydown and keyup
    document.addEventListener('keydown', handleKeyDown, true); // Use capture phase
    document.addEventListener('keyup', handleKeyUp, true);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('keyup', handleKeyUp, true);
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("contextmenu", handleContextMenu);
    };
  }, [progressLoaded, quizCompleted]);
  /* ---------------------
     Tab Visibility - Auto-submit if switched tabs
  --------------------- */
  useEffect(() => {
    if (!progressLoaded || quizCompleted) return;

    const handleVisibilityChange = async () => {
      if (document.hidden && !quizCompleted) {
        console.log("[TAB VISIBILITY] Student switched tabs - AUTO-SUBMITTING");
        console.log("[TAB VISIBILITY] Current answers:", answers);
        toast.error("⚠️ You switched tabs! Your quiz is being auto-submitted...");
        
        try {
          // Save progress first to ensure all answers are captured
          await saveProgress(answers);
          
          // Wait a moment for save to complete
          setTimeout(() => {
            handleSubmit();
          }, 500);
        } catch (err) {
          console.error("[TAB SWITCH] Failed to auto-submit:", err);
          toast.error("Error submitting quiz. Please refresh.");
        }
      } else if (!document.hidden) {
        console.log("[TAB VISIBILITY] Student returned to quiz tab");
        // Don't welcome them back if already submitted
        if (!quizCompleted) {
          toast.success("✅ Welcome back to the quiz!");
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [quizCompleted, quizFrozen, progressLoaded, quizId]);


  /* ---------------------
     Prevent Back Button - Actively Block History Navigation
     Push states to prevent back button from working
  --------------------- */
  useEffect(() => {
    if (!progressLoaded || quizCompleted) return;

    // Push multiple dummy states to prevent back button from working
    for (let i = 0; i < 15; i++) {
      window.history.pushState({ quizState: `state_${i}` }, "", window.location.href);
    }

    const handlePopState = (e) => {
      e.preventDefault();
      // Push another state to stay on quiz page
      window.history.pushState({ quizState: "back_blocked" }, "", window.location.href);
      console.warn("[HISTORY BLOCKED] Back button attempt detected - staying on quiz");
      toast.error("🚫 You cannot navigate back during the quiz!");
      return false;
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [progressLoaded, quizCompleted]);

  /* ---------------------
     Forward Button Handler (Double-Click Detection)
  --------------------- */
  useEffect(() => {
    if (!progressLoaded || quizCompleted) return;

    let lastForwardClickTime = 0;
    let forwardClickCount = 0;
    let hasBlockedForwardNavigation = false;

    // Monitor keyboard shortcuts for forward navigation (Alt+Right Arrow)
    const handleKeyDown = (e) => {
      // Alt+Right Arrow is common forward shortcut on browsers
      if ((e.altKey && e.key === 'ArrowRight') || (e.ctrlKey && e.key === '[')) {
        e.preventDefault();
        handleForwardAttempt();
      }
    };

    const handleForwardAttempt = async () => {
      forwardClickCount++;
      const currentTime = Date.now();

      // Check for double-click (2 clicks within 500ms)
      if (currentTime - lastForwardClickTime < 500 && forwardClickCount === 2) {
        toast.error("🚫 Double-click on forward button detected! Auto-submitting quiz as punishment!");
        console.warn("Student double-clicked forward button - auto-submitting quiz");
        forwardClickCount = 0;
        lastForwardClickTime = 0;
        // Auto-submit the quiz
        await handleSubmit();
        return;
      }
      lastForwardClickTime = currentTime;

      // Reset counter after 600ms of no clicks
      setTimeout(() => {
        if (Date.now() - lastForwardClickTime > 600) {
          forwardClickCount = 0;
        }
      }, 600);

      // Show error message on any attempt
      toast.error("🚫 Forward button disabled during quiz! Attempting escape detected.");

      // If already blocked, just warn
      if (quizFrozen && hasBlockedForwardNavigation) {
        toast.error("You are already blocked. Navigation is disabled!");
        return;
      }

      // If not already blocked AND this is the student's first forward attempt, block them
      if (!hasBlockedForwardNavigation && !quizFrozen && forwardClickCount === 1) {
        hasBlockedForwardNavigation = true;
        console.warn("Student attempted to navigate forward - blocking student");

        try {
          await blockStudent(quizId);
          setQuizFrozen(true);

          // Fetch remaining time
          const statusRes = await axios.get(
            `${import.meta.env.VITE_APP}/api/quizzes/${quizId}/block-status`,
            { withCredentials: true }
          );
          if (statusRes.data.success) {
            setBlockCountdown(statusRes.data.remainingSeconds);
          }

          toast.error("⚠️ You have been BLOCKED for attempting to escape the quiz!");
        } catch (err) {
          console.error("Failed to block student on forward navigation attempt:", err);
          toast.error("Navigation attempt detected and logged!");
        }
      } else if (quizFrozen) {
        // Already frozen, just warn
        toast.error("You are already blocked. Navigation is disabled!");
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [progressLoaded, quizCompleted]);


  // Cleanup poll interval on unmount
  useEffect(() => {
    return () => {
      if (window._blockPollInterval) {
        clearInterval(window._blockPollInterval);
        delete window._blockPollInterval;
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  /* ---------------------
     Sidebar & Logout
  --------------------- */
  const toggleSidebar = () => setSidebarOpen((s) => !s);
  const handleLogout = async () => {
    // Mark as deliberate navigation
    setIsDeliberateNavigation(true);
    
    // Save progress before logging out
    await saveProgress();
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    
    navigate("/");
  };
  const isAnswered = (i) => {
    const qId = questions[i]?.id;
    const hasAnswer = answers.some((a) => a.questionId === qId);
    console.log(`[ANSWERED CHECK] Index ${i}, qId=${qId}, hasAnswer=${hasAnswer}, answersArray=${JSON.stringify(answers)}`);
    return hasAnswer;
  };

  /* ---------------------
     Loading / Countdown / Mobile Detection
  --------------------- */

  // DEBUG: Log render state
  console.log("[RENDER STATE]", {
    progressLoaded,
    questionsLength: questions.length,
    showStartingLoader,
    startingCountdown,
    quizFrozen,
    isMobileDevice,
    currentQuestionIndex,
    currentQ: !!questions[currentQuestionIndex],
  });
  
  // ✅ Show loading screen while data is being fetched
  if (!progressLoaded) {
    console.log("[RENDER] ❌ SHOWING LOADING SCREEN - progressLoaded=false");
    return (
      <div className="flex flex-col h-screen bg-gradient-to-br from-gray-50 to-gray-200 select-none">
        <Navbar 
          userName="Loading..." 
          onProfileClick={toggleSidebar}
          isQuizActive={false}
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-b-4 border-blue-500 mb-4"></div>
            <p className="text-lg font-semibold text-gray-700 mb-2">Loading Quiz...</p>
            <p className="text-sm text-gray-600">Please wait while we prepare your questions</p>
          </div>
        </div>
      </div>
    );
  }

  console.log("[RENDER] ✅ Passed progressLoaded check");

  // ✅ Show error if questions failed to load
  if (questions.length === 0 && progressLoaded && !quizFrozen) {
    console.log("[RENDER] ❌ SHOWING ERROR SCREEN - no questions loaded");
    return (
      <div className="flex flex-col h-screen bg-gradient-to-br from-gray-50 to-gray-200 select-none">
        <Navbar 
          userName={student?.name || "Student"} 
          onProfileClick={toggleSidebar}
          isQuizActive={false}
        />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4">❌</div>
            <h1 className="text-3xl font-bold text-gray-800 mb-3">Error Loading Quiz</h1>
            <p className="text-lg text-gray-600 mb-6">
              The quiz questions could not be loaded. This may be a temporary issue.
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-left">
              <p className="text-sm text-gray-700 mb-2"><span className="font-semibold">Debugging info:</span></p>
              <p className="text-xs text-gray-600">Quiz ID: {quizId}</p>
              <p className="text-xs text-gray-600">Progress Loaded: {progressLoaded.toString()}</p>
              <p className="text-xs text-gray-600">Questions Count: {questions.length}</p>
              <p className="text-xs text-gray-600">Selections Count: {selections.length}</p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition"
            >
              🔄 Reload Quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  console.log("[RENDER] ✅ Passed questions check");
  
  // ✅ Show block screen FIRST, even if questions not loaded yet
  if (quizFrozen && blockCountdown >= 0) {
    try {
      return (
        <div className="flex flex-col h-screen bg-gradient-to-br from-gray-50 to-gray-200 select-none">
          <Navbar 
            userName={student?.name || "Student"} 
            onProfileClick={toggleSidebar}
            isQuizActive={false}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 backdrop-blur-sm text-white select-none pointer-events-auto">
            <div className="text-center max-w-2xl px-6">
              <h1 className="text-4xl font-bold mb-4">⏸️ Quiz Blocked</h1>
              <p className="text-xl mb-6 text-red-300">You have been blocked for violating quiz security rules.</p>
              
              {/* Countdown Timer - Shows in real-time */}
              <div className="bg-gradient-to-r from-red-600 to-red-800 rounded-lg p-8 mb-6">
                <p className="text-sm text-red-100 mb-2">⏱️ REMAINING TIME</p>
                <div className="text-6xl font-bold text-white animate-pulse">{blockCountdown}s</div>
                <p className="text-sm text-red-100 mt-2">30 second penalty applied • Time keeps running</p>
              </div>
              
              {/* Status and Instructions */}
              <div className="bg-gray-900 bg-opacity-80 rounded-lg p-6 mb-6 text-left space-y-3">
                <p className="text-yellow-300 font-semibold mb-4">📋 What happens when timer reaches 0:</p>
                <div className="space-y-2 text-sm">
                  <div className="flex gap-3">
                    <span className="text-red-400 font-bold">❌</span>
                    <span><span className="font-semibold text-red-300">Not in fullscreen:</span> Quiz AUTO-SUBMITS (all remaining unanswered = wrong)</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-red-400 font-bold">❌</span>
                    <span><span className="font-semibold text-red-300">Tab switched:</span> Quiz AUTO-SUBMITS immediately</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-green-400 font-bold">✅</span>
                    <span><span className="font-semibold text-green-300">Stay in fullscreen:</span> Resume quiz after timer expires</span>
                  </div>
                </div>
              </div>

              {/* Fullscreen Status */}
              {!document.fullscreenElement ? (
                <div className="mb-6 bg-yellow-900 bg-opacity-80 rounded-lg p-4 border border-yellow-600">
                  <p className="text-yellow-200 text-sm mb-3 font-semibold">⚠️ YOU MUST BE IN FULLSCREEN MODE!</p>
                  <button
                    onClick={enterFullscreen}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition transform hover:-translate-y-0.5"
                  >
                    ↗️ Enter Fullscreen Now
                  </button>
                </div>
              ) : (
                <div className="mb-6 bg-green-900 bg-opacity-80 rounded-lg p-3">
                  <p className="text-green-200 text-sm font-semibold">✅ Fullscreen mode active</p>
                </div>
              )}
              
              <p className="text-sm text-gray-300 border-t border-gray-600 pt-4">
                <span className="block mb-2">⏳ The clock is running...</span>
                <span>Stay focused, stay in fullscreen, and wait for the timer to expire.</span>
              </p>
            </div>
          </div>
        </div>
      );
    } catch (err) {
      console.error("[BLOCK SCREEN ERROR]", err);
      return (
        <div className="h-screen w-screen bg-black flex items-center justify-center text-white text-center">
          <div>
            <h1 className="text-3xl font-bold mb-4">⏸️ BLOCKED</h1>
            <p className="text-xl mb-4">Remaining: {blockCountdown}s</p>
            <p className="text-sm text-gray-400">({err.message})</p>
          </div>
        </div>
      );
    }
  }

  if (isMobileDevice) {
    console.log("[RENDER] ❌ SHOWING MOBILE WARNING");
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-600 to-blue-700 text-white p-6 select-none">
        <div className="text-center">
          <div className="text-6xl mb-6">📱</div>
          <h1 className="text-4xl font-bold mb-4">Desktop Only</h1>
          <p className="text-xl mb-6 text-blue-100">
            This quiz can only be taken on a desktop or laptop computer.
          </p>
          <p className="text-lg text-blue-200 mb-8">
            Please open this page on a desktop device to continue.
          </p>
          <div className="bg-blue-800 bg-opacity-50 rounded-lg p-6 text-left inline-block">
            <p className="text-sm text-blue-100">Why desktop only?</p>
            <ul className="text-sm text-blue-100 mt-3 space-y-2">
              <li>✓ Prevents mobile device cheating</li>
              <li>✓ Ensures proper fullscreen security</li>
              <li>✓ Provides better question display</li>
              <li>✓ Maintains data integrity</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  console.log("[RENDER] ✅ Passed mobile check, showStartingLoader:", showStartingLoader);

  if (showStartingLoader) {
    console.log("[RENDER] ❌ SHOWING COUNTDOWN SCREEN - startingCountdown:", startingCountdown);
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-85 backdrop-blur-sm text-white text-9xl font-bold select-none">
        {startingCountdown > 0 ? startingCountdown : "Go!"}
      </div>
    );
  }

  console.log("[RENDER] ✅ Passed all checks - SHOWING QUIZ SCREEN");

  const currentQ = questions[currentQuestionIndex];

  /* ---------------------
     FINAL RENDER
  --------------------- */
  console.log("[FINAL RENDER]", {
    currentQuestionIndex,
    currentQ: !!currentQ,
    questionId: currentQ?.id,
    questionText: currentQ?.question?.substring(0, 50) || "N/A",
  });

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-50 to-gray-200 select-none">
      <Navbar 
        userName={student?.name || "Student"} 
        onProfileClick={toggleSidebar}
        isQuizActive={!quizCompleted && progressLoaded}
      />
      <Toaster />

      {sidebarOpen && (
        <>
          <aside className="h-screen w-4/5 sm:w-1/3 md:w-1/5 bg-gradient-to-b from-blue-900 to-blue-700 text-white p-6 shadow-xl flex flex-col justify-between fixed top-0 left-0 z-50 select-none">
            <div>
              <h2 className="text-xl font-bold mb-6 border-b pb-2 border-gray-400">Student Profile</h2>
              <div className="space-y-3 text-sm bg-blue-800/80 p-4 rounded-xl shadow-inner">
                <div><span className="font-semibold">Name:</span> {student?.name}</div>
                <div><span className="font-semibold">ID:</span> {student?.studentId}</div>
                <div><span className="font-semibold">Email:</span> {student?.email}</div>
                <div><span className="font-semibold">Department:</span> {student?.department}</div>
                <div><span className="font-semibold">Year:</span> {student?.year}</div>
              </div>
            </div>
          </aside>
          <div className="fixed inset-0 bg-black bg-opacity-40 z-40" onClick={toggleSidebar} />
        </>
      )}

      {submitting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 backdrop-blur-sm text-white text-3xl font-semibold select-none">
          Submitting Quiz...
        </div>
      )}

      <main className="flex flex-col md:flex-row flex-grow gap-4 md:gap-6 p-3 md:p-6 overflow-hidden">
        <div className="flex flex-col flex-grow max-w-3xl mx-auto w-full" style={{ minHeight: 0 }}>
          <div className="mb-2">
            <TimerBar timeLeft={timeLeft} totalTime={quiz?.timeLimit * 60 || 15 * 60} />
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="text-lg font-semibold text-red-600">
                  Time Left: {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
                </div>
                <div className="text-sm text-gray-600">
                  {saveStatus === "saving" && "Saving..."}
                  {saveStatus === "saved" && "Saved"}
                  {saveStatus === "error" && "Save failed"}
                </div>
              </div>
              {quizFrozen && blockCountdown > 0 && (
                <div className="text-lg font-semibold text-red-700">
                  Quiz Frozen - Blocked for {blockCountdown} seconds
                </div>
              )}
              {quizFrozen && blockCountdown === 0 && (
                <div className="text-lg font-semibold text-red-700">Quiz Frozen</div>
              )}
            </div>
          </div>

          <div className="flex-grow overflow-auto py-2">
            {currentQ ? (
              <QuestionComponent
                question={currentQ}
                selectedOption={selectedOption}
                onOptionSelect={handleOptionClick}
                disabled={quizFrozen || quizCompleted}
              />
            ) : questions.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-red-600">
                  <p className="text-lg font-semibold">❌ No questions available</p>
                  <p className="text-sm">Questions failed to load from server</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold"
                  >
                    Reload Page
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-gray-600">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-b-4 border-blue-500 mb-3"></div>
                  <p className="text-lg font-semibold">Loading question...</p>
                  <p className="text-sm">Current: {currentQuestionIndex + 1}, Total: {questions.length}</p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-3 w-full">
            <div className="sm:sticky sm:bottom-6 sm:z-40 sm:bg-transparent">
              <NavigationButtons
                currentIndex={currentQuestionIndex}
                totalQuestions={questions.length}
                canSubmit={questions.length > 0 && answers.length === questions.length}
                onPrev={() => {
                  setCurrentQuestionIndex((i) => Math.max(0, i - 1));
                  saveProgress();
                }}
                onNext={() => {
                  setCurrentQuestionIndex((i) => Math.min(questions.length - 1, i + 1));
                  saveProgress();
                }}
                onSubmit={handleSubmit}
                submitting={submitting}
                disabled={quizFrozen || quizCompleted}
              />
            </div>
          </div>
        </div>

        <aside className="hidden md:flex md:flex-col md:w-72 xl:w-80 bg-white p-4 shadow-md rounded-lg overflow-auto">
          <h2 className="font-bold text-lg mb-4 border-b pb-2 text-center text-gray-800">Questions</h2>
          
          {/* Show subcategories with clickable question numbers */}
          {(() => {
            const groupedBySubcategory = {};
            questions.forEach((q, idx) => {
              const subcat = q.subcategory || "Uncategorized";
              if (!groupedBySubcategory[subcat]) {
                groupedBySubcategory[subcat] = [];
              }
              groupedBySubcategory[subcat].push({ ...q, index: idx });
            });

            return Object.entries(groupedBySubcategory).map(([subcategory, qs], groupIdx) => (
              <div key={groupIdx} className="mb-5 p-3 bg-gray-50 rounded-lg border border-gray-200">
                {/* Subcategory header with circle showing question count */}
                <div className="flex items-center justify-between gap-3 mb-3">
                  <h3 className="font-semibold text-sm text-gray-700 flex-grow">{subcategory}</h3>
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-md flex-shrink-0">
                    {qs.length}
                  </div>
                </div>
                
                {/* Question numbers grid - clickable */}
                <div className="grid grid-cols-4 gap-2">
                  {qs.map((q) => {
                    const isCurrentQuestion = currentQuestionIndex === q.index;
                    const isAnsweredQuestion = isAnswered(q.index);
                    
                    return (
                      <button
                        key={q.index}
                        disabled={quizFrozen}
                        onClick={() => {
                          if (!quizFrozen) {
                            setCurrentQuestionIndex(q.index);
                            saveProgress();
                          }
                        }}
                        className={`w-full h-9 rounded-lg transition duration-200 text-xs font-semibold flex items-center justify-center ${
                          isCurrentQuestion
                            ? "bg-blue-600 text-white shadow-md border-2 border-blue-700"
                            : isAnsweredQuestion
                            ? "bg-green-100 text-green-800 border border-green-300 hover:bg-green-200"
                            : "bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200"
                        } ${quizFrozen ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                        title={`Q${q.index + 1}`}
                      >
                        {q.index + 1}
                      </button>
                    );
                  })}
                </div>
              </div>
            ));
          })()}
        </aside>
      </main>

      {/* Mobile fixed navigation (visible on small screens) */}
      <div className="sm:hidden fixed bottom-4 left-4 right-4 z-50">
        <div className="bg-white/95 backdrop-blur-md shadow-xl rounded-2xl p-3 flex gap-2 items-center">
          <button
            onClick={() => {
              setCurrentQuestionIndex((i) => Math.max(0, i - 1));
              saveProgress();
            }}
            disabled={currentQuestionIndex === 0 || quizFrozen || quizCompleted}
            className="flex-1 bg-white border border-gray-200 text-blue-700 py-3 rounded-lg font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Prev
          </button>

          <button
            onClick={() => {
              setCurrentQuestionIndex((i) => Math.min(questions.length - 1, i + 1));
              saveProgress();
            }}
            disabled={currentQuestionIndex === questions.length - 1 || quizFrozen || quizCompleted}
            className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next
          </button>

          <button
            onClick={handleSubmit}
            disabled={!(answers.length === questions.length) || submitting || quizFrozen || quizCompleted}
            className={`ml-2 px-4 py-3 rounded-lg text-white font-semibold ${
              answers.length === questions.length && !submitting && !quizFrozen
                ? "bg-green-600"
                : "bg-gray-400"
            }`}
          >
            {submitting ? "Sending" : "Submit"}
          </button>
        </div>
      </div>
    </div>    

  );
};

export default Quiz;
