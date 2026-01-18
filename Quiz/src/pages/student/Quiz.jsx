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
} from "../../utils/quizsecurity.mjs";

/* =========================
   Small presentational pieces
   ========================= */
const OptionButton = ({ option, isSelected, onClick, disabled }) => (
  <button
    onClick={() => !disabled && onClick(option)}
    className={`flex items-center justify-center text-center gap-2 p-4 md:p-5 rounded-lg border transition-transform duration-200 transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 select-none break-words
      ${isSelected
        ? "bg-green-600 text-white border-green-700 shadow-lg"
        : "bg-white border-gray-300 hover:border-green-500 hover:shadow-sm"}`}
    style={{ userSelect: "none", minHeight: 72 }}
    disabled={disabled}
    aria-pressed={isSelected}
  >
    <span className="text-sm md:text-base leading-tight">{option}</span>
  </button>
);

const QuestionComponent = ({ question, selectedOption, onOptionSelect, disabled }) => (
  <div className="bg-white p-4 md:p-6 rounded-xl shadow-lg mb-6 select-none transition duration-300 hover:shadow-2xl">
    <div className="text-sm text-gray-500 mb-2">Subcategory: {question.subcategory}</div>
    <h2 className="text-lg md:text-2xl font-semibold mb-3 md:mb-4 leading-tight">
      {question.question}
      {question.description && (
        <span className="block text-sm text-gray-500 mt-1">{question.description}</span>
      )}
    </h2>

    {question.image ? (
      <div className="flex flex-col md:flex-row gap-6 items-start" style={{ minHeight: 200 }}>
        <div className="flex-shrink-0 md:w-1/2 w-full flex justify-center items-center">
          <div className="w-full max-w-full rounded-lg overflow-hidden border" style={{ maxHeight: "60vh" }}>
            <img
              src={question.image}
              alt="Question"
              className="w-full h-full object-contain block"
              draggable={false}
              onContextMenu={(e) => e.preventDefault()}
            />
          </div>
        </div>
        <div className="flex-1 w-full">
          <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(220px, 100%), 1fr))" }}>
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
    )}
  </div>
);

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

  const { quizId } = useParams();
  const navigate = useNavigate();
  const timerRef = useRef(null);
  const timeLeftRef = useRef(null);
  

  /* ---------------------
     Fullscreen helpers (local)
  --------------------- */
  const enterFullscreen = async () => {
    try {
      const el = document.documentElement;
      if (el.requestFullscreen) await el.requestFullscreen();
      else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
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
     Monitor Deliberate Navigation
  --------------------- */
  useEffect(() => {
    // Set flag when user intentionally navigates away via React Router
    const originalNavigate = window.location.href;
    
    const handleBeforeNavigate = () => {
      // Only flag as deliberate if navigating away from quiz page
      setIsDeliberateNavigation(true);
    };

    // Detect when student clicks a link or tries to navigate away from quiz
    const handleClick = (e) => {
      const target = e.target;
      const link = target?.closest('a');
      
      // If they clicked a link and it's NOT going to the quiz page
      if (link && !window.location.pathname.includes('/quiz/')) {
        setIsDeliberateNavigation(true);
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  /* ---------------------
     Handle Page Unload (Network Loss vs Deliberate Navigation)
     Network loss: Just save progress, no block
     Deliberate navigation: Save progress and block
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
          console.log("Emergency save completed (network loss or system shutdown)");
        } catch (err) {
          console.error("Emergency save failed:", err);
          // Even if save fails, don't block - could be network issue
        }
      }

      // IMPORTANT: Only block if it's DELIBERATE navigation (intentional link click to leave quiz)
      // If it's network loss, power off, or browser crash, we DON'T block - just saved progress
      if (isDeliberateNavigation && !quizCompleted) {
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
        // Show confirmation to warn student
        e.preventDefault();
        e.returnValue = "You will be blocked if you leave now!";
        return "You will be blocked if you leave now!";
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
      if (!data.success) {
        navigate("/");
        return;
      }

      const quiz = data.data.quizConfig;
      const progress = data.data.progress;
      console.log(progress)
   // server timestamp in ms
      const isBlocked = data.blocked || false;
      const remainingSeconds = data.remainingSeconds || 0;

      setQuiz(quiz);

      // Use timeLeft directly from backend
setTimeLeft(
  typeof progress?.timeLeft === "number"
    ? progress.timeLeft
    : quiz.timeLimit * 60
);

      // ----------------------------
      // Block handling
      // ----------------------------
      if (isBlocked && remainingSeconds > 0) {
        setQuizFrozen(true);
        setBlockCountdown(remainingSeconds);
        toast.error(data.message || "You are blocked from this quiz.");
        // Attempt to enter fullscreen automatically
        enterFullscreen();
        const pollInterval = setInterval(async () => {
          try {
            const statusRes = await axios.get(
              `${import.meta.env.VITE_APP}/api/quizzes/${quizId}/block-status`,
              { withCredentials: true }
            );
            if (statusRes.data.success) {
              const newRemaining = statusRes.data.remainingSeconds;
              setBlockCountdown(newRemaining);
              if (newRemaining <= 0) {
                clearInterval(pollInterval);
                if (document.hidden || !document.fullscreenElement) {
                  toast.error("Block expired but you are not in the quiz tab or fullscreen. Auto-submitting quiz.");
                  handleSubmit();
                } else {
                  setQuizFrozen(false);
                  toast.success("Block expired. You can now continue the quiz.");
                }
              }
            }
          } catch (err) {
            console.error("Error polling block status:", err);
          }
        }, 5000);
        window._blockPollInterval = pollInterval;
      } else {
        setQuizFrozen(false);
        setBlockCountdown(0);
        if (window._blockPollInterval) {
          clearInterval(window._blockPollInterval);
          delete window._blockPollInterval;
        }
      }

      setSelections(quiz.selections || []);

      // Load progress if exists
      if (progress) {
        setCurrentQuestionIndex(progress.currentQuestionIndex || 0);
        setAnswers(progress.answers || []);
        setShowStartingLoader(false); // skip countdown if resuming
      }

      setProgressLoaded(true);
      await enterFullscreen();
    } catch (e) {
      console.error(e);
    }
  };

  loadData();
}, [quizId]);


  /* ---------------------
     Shuffle Questions & Options
  --------------------- */
useEffect(() => {
  if (selections.length > 0 && progressLoaded && student) {
    let flatQuestions = [];

    selections.forEach((s) => {
      s.questions.forEach((q) => {
        if (q && q.options) {
          // Use selectedOption from backend (already set based on progress)
          const savedAnswer = q.selectedOption || null;

          flatQuestions.push({
            ...q,
            subcategory: s.subcategory,
            options: seededShuffle(q.options, student._id + q._id),
            savedSelectedOption: savedAnswer,
          });
        }
      });
    });

    setQuestions(seededShuffle(flatQuestions, student._id + quizId));
  }
}, [selections, progressLoaded, student, answers]);


  /* ---------------------
     Starting Countdown
  --------------------- */
  useEffect(() => {
    if (!progressLoaded || questions.length === 0) return;
    if (startingCountdown > 0) {
      const timer = setTimeout(() => setStartingCountdown((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setShowStartingLoader(false);
    }
  }, [startingCountdown, progressLoaded, questions.length]);

  /* ---------------------
     Save Progress
  --------------------- */
  const saveProgress = async () => {
    if (quizCompleted || quizFrozen || !progressLoaded) return;
     const safeTimeLeft =
    typeof timeLeftRef.current === "number" && timeLeftRef.current >= 0
      ? timeLeftRef.current
      : (quiz?.timeLimit || 15) * 60;
const payload = {
  currentQuestionIndex,
  answers,
  timeLeft: safeTimeLeft,
};

    console.log("Saving progress:", payload); // Debug log
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
  console.log("Timer useEffect running, conditions:", { progressLoaded, quizCompleted, submitting, timeLeft });
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
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }
}, [progressLoaded, quizCompleted, submitting]);


  /* ---------------------
     Auto-save every 5 seconds
  --------------------- */
useEffect(() => {
  if (!progressLoaded || quizCompleted || quizFrozen || submitting) return;

  const id = setInterval(() => {
    saveProgress();
  }, 5000);

  return () => clearInterval(id);
}, [progressLoaded, quizCompleted, quizFrozen, submitting, currentQuestionIndex, answers]);

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
    const qId = questions[currentQuestionIndex]?._id.toString();

    const updatedAnswers = [...answers];
    const idx = updatedAnswers.findIndex((a) => a.questionId === qId);
    if (idx !== -1) updatedAnswers[idx].selectedOption = option;
    else updatedAnswers.push({ questionId: qId, selectedOption: option });
    setAnswers(updatedAnswers);
    setSelectedOption(option);
    // Immediately request a save for this new selection
    saveProgress().catch((err) =>
      console.error("Immediate save failed:", err)
    );
  };

  useEffect(() => {
    const currQ = questions[currentQuestionIndex];
    const ans = answers.find((a) => a.questionId === currQ?._id);
    setSelectedOption(ans?.selectedOption ?? currQ?.savedSelectedOption ?? null);
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
      const existingAnswer = answers.find(a => a.questionId === question._id.toString());
      return {
        questionId: question._id.toString(),
        answer: existingAnswer ? existingAnswer.selectedOption : null, // null for unanswered
        subcategory: question.subcategory || "Unknown",
      };
    });

    // Submit to backend
    const response = await axios.post(
      `${import.meta.env.VITE_APP}/api/quizzes/${quizId}/submit`,
      { answers: enrichedAnswers },
      { withCredentials: true }
    );

    if (response.data.success) {
      setQuizCompleted(true);
      toast.success("Quiz submitted successfully!");

      // Optional: navigate to results/thank you page
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


  useEffect(() => {
    if (!showStartingLoader && !quizCompleted) {
      // Do not auto-enter fullscreen to avoid denial, but enforce if exited
      // enterFullscreen(); // Commented out to prevent denial

      // Listen for fullscreen exit and block
      const handleFullscreenChange = async () => {
        if (!document.fullscreenElement && !quizCompleted) {
          // If already frozen, just warn
          if (quizFrozen) {
            toast.error("re already blocked. You cannot exit fullscreen!");
            return;
          }

          setQuizFrozen(true);
          toast.error("You exited fullscreen! You have been blocked from this quiz.");

          try {
            const remainingSeconds = await blockStudent(quizId);
            setBlockCountdown(remainingSeconds);

            // Poll backend every 5 seconds for accurate remaining time
            const pollInterval = setInterval(async () => {
              try {
                const statusRes = await axios.get(
                  `${import.meta.env.VITE_APP}/api/quizzes/${quizId}/block-status`,
                  { withCredentials: true }
                );
                if (statusRes.data.success) {
                  const newRemaining = statusRes.data.remainingSeconds;
                  setBlockCountdown(newRemaining);
                  if (newRemaining <= 0) {
                    clearInterval(pollInterval);
                    // Check if user is back in the tab and fullscreen
                    if (document.hidden || !document.fullscreenElement) {
                      toast.error("Block expired but you are not in the quiz tab or fullscreen. Auto-submitting quiz.");
                      handleSubmit(); // Auto-submit with current answers
                    } else {
                      setQuizFrozen(false);
                      toast.success("Block expired. You can now continue the quiz.");
                    }
                  }
                }
              } catch (err) {
                console.error("Error polling block status:", err);
              }
            }, 5000);

            // Store interval ID
            window._blockPollInterval = pollInterval;
          } catch (err) {
            console.error("Failed to block student on fullscreen exit:", err);
          }
        }
      };

      // Prevent ESC from exiting fullscreen by blocking
      const handleKeyDown = (e) => {
        if (e.key === 'Escape' && !quizCompleted) {
          e.preventDefault();
          handleCheatingDetected(setQuizFrozen, quizId, setSubmitting, setBlockCountdown, setCheatWarningShown, cheatWarningShown);
        }
      };

      document.addEventListener('fullscreenchange', handleFullscreenChange);

      return () => {
        document.removeEventListener('fullscreenchange', handleFullscreenChange);
      };
    }
  }, [showStartingLoader, quizCompleted]);
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.hidden) {
        // If already frozen, just warn
        if (quizFrozen) {
          toast.error("You are already blocked. You cannot switch tabs!");
          return;
        }

        setQuizFrozen(true);
        toast.error("You switched tabs! You have been blocked from this quiz.");

        // Attempt to enter fullscreen automatically
        enterFullscreen();

        try {
          const remainingSeconds = await blockStudent(quizId);
          setBlockCountdown(remainingSeconds);

          // Poll backend every 5 seconds for accurate remaining time
          const pollInterval = setInterval(async () => {
            try {
              const statusRes = await axios.get(
                `${import.meta.env.VITE_APP}/api/quizzes/${quizId}/block-status`,
                { withCredentials: true }
              );
              if (statusRes.data.success) {
                const newRemaining = statusRes.data.remainingSeconds;
                setBlockCountdown(newRemaining);
                if (newRemaining <= 0) {
                  clearInterval(pollInterval);
                  // Check if user is back in the tab and fullscreen
                  if (document.hidden || !document.fullscreenElement) {
                    toast.error("Block expired but you are not in the quiz tab or fullscreen. Auto-submitting quiz.");
                    handleSubmit(); // Auto-submit with current answers
                  } else {
                    setQuizFrozen(false);
                    toast.success("Block expired. You can now continue the quiz.");
                  }
                }
              }
            } catch (err) {
              console.error("Error polling block status:", err);
            }
          }, 5000);

          // Store interval ID
          window._blockPollInterval = pollInterval;
        } catch (err) {
          console.error("Failed to block student on tab change:", err);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [quizFrozen, quizId]);

  /* ---------------------
     Lock Browser History During Quiz
     Back/Forward buttons trigger immediate block - no tolerance for escape attempts
  --------------------- */
  useEffect(() => {
    if (!progressLoaded || quizCompleted) return;

    // Push multiple dummy states to prevent back button from working at all
    for (let i = 0; i < 20; i++) {
      window.history.pushState({ quizState: i, timestamp: Date.now() }, "", window.location.href);
    }

    let backAttemptBlocked = false;
    let lastBackAttemptTime = 0;

    const handleBackAttempt = async (attemptType = "back") => {
      // Prevent multiple rapid back button clicks
      const now = Date.now();
      if (backAttemptBlocked && (now - lastBackAttemptTime < 3000)) {
        return; // Silently ignore rapid repeated attempts
      }

      // First attempt - immediately block
      if (!backAttemptBlocked && !quizFrozen) {
        backAttemptBlocked = true;
        lastBackAttemptTime = now;
        
        console.warn(`Student attempted ${attemptType} navigation - immediately blocking`);
        toast.error(`🚫 ${attemptType === 'back' ? 'Back' : 'Forward'} button is disabled! Block applied - cheating detected.`);
        
        // Immediately trigger cheating detection with blocking
        handleCheatingDetected(setQuizFrozen, quizId, setSubmitting, setBlockCountdown, setCheatWarningShown, true);
        
        // Reset after 5 seconds so repeated attempts aren't silently ignored
        setTimeout(() => {
          backAttemptBlocked = false;
        }, 5000);
      }
      
      // Push state again to maintain the buffer
      window.history.pushState({ quizState: Date.now(), timestamp: Date.now() }, "", window.location.href);
    };

    const handlePopState = () => {
      handleBackAttempt("back");
    };

    // Monitor keyboard shortcuts for back/forward navigation
    const handleKeyDown = (e) => {
      if (e.altKey && e.key === 'ArrowLeft') {
        e.preventDefault();
        handleBackAttempt("back");
      }
      if (e.altKey && e.key === 'ArrowRight') {
        e.preventDefault();
        handleBackAttempt("forward");
      }
      if (e.ctrlKey && e.key === ']') {
        e.preventDefault();
        handleBackAttempt("forward");
      }
      if (e.ctrlKey && e.key === '[') {
        e.preventDefault();
        handleBackAttempt("back");
      }
    };

    window.addEventListener("popstate", handlePopState);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [quizFrozen, progressLoaded, quizCompleted, quizId]);

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
  }, [quizFrozen, progressLoaded, quizCompleted, quizId]);


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
     DEDICATED: Windows Key Triggers Cheating Detection (Like ESC)
     This runs independently to ensure Windows key is 100% non-functional
     Now triggers immediate block like ESC key does
  --------------------- */
  useEffect(() => {
    if (!student || quizCompleted) return;

    let windowsKeyAttemptBlocked = false;
    let lastWindowsKeyAttemptTime = 0;

    // Handler for Windows key to trigger cheating detection
    const blockWindowsKey = (e) => {
      // Check for Windows/Meta/OS key at every level
      if (e.key === 'Meta' || e.key === 'OS' || e.keyCode === 91 || e.keyCode === 92) {
        // Immediate prevention at all levels
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        
        // During blocked state - just prevent, no additional action
        if (quizFrozen) {
          return false;
        }
        
        // Prevent multiple rapid Windows key presses from triggering multiple blocks
        const now = Date.now();
        if (windowsKeyAttemptBlocked && (now - lastWindowsKeyAttemptTime < 5000)) {
          return false; // Ignore rapid repeated Windows key presses
        }
        
        windowsKeyAttemptBlocked = true;
        lastWindowsKeyAttemptTime = now;
        
        // Trigger cheating detection - block the student just like ESC key
        handleCheatingDetected(setQuizFrozen, quizId, setSubmitting, setBlockCountdown, setCheatWarningShown, cheatWarningShown);
        
        // Reset after 5 seconds
        setTimeout(() => {
          windowsKeyAttemptBlocked = false;
        }, 5000);
        
        return false;
      }
    };

    // Attach to all possible event phases and targets
    // Use capture phase (true) for highest priority
    window.addEventListener('keydown', blockWindowsKey, true);
    window.addEventListener('keyup', blockWindowsKey, true);
    
    document.addEventListener('keydown', blockWindowsKey, true);
    document.addEventListener('keyup', blockWindowsKey, true);
    
    document.documentElement.addEventListener('keydown', blockWindowsKey, true);
    document.documentElement.addEventListener('keyup', blockWindowsKey, true);
    
    document.body.addEventListener('keydown', blockWindowsKey, true);
    document.body.addEventListener('keyup', blockWindowsKey, true);

    return () => {
      // Cleanup all listeners
      window.removeEventListener('keydown', blockWindowsKey, true);
      window.removeEventListener('keyup', blockWindowsKey, true);
      
      document.removeEventListener('keydown', blockWindowsKey, true);
      document.removeEventListener('keyup', blockWindowsKey, true);
      
      document.documentElement.removeEventListener('keydown', blockWindowsKey, true);
      document.documentElement.removeEventListener('keyup', blockWindowsKey, true);
      
      document.body.removeEventListener('keydown', blockWindowsKey, true);
      document.body.removeEventListener('keyup', blockWindowsKey, true);
    };
  }, [student, quizId, cheatWarningShown, quizCompleted, quizFrozen]);

  /* ---------------------
     Prevent Inspect and Cheating
  --------------------- */
  useEffect(() => {
    const preventInspect = (e) => {
      e.preventDefault();
      return false;
    };

    const preventKeys = (e) => {
      // Disable all inspection tools
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && e.key === 'I') ||
        (e.ctrlKey && e.shiftKey && e.key === 'J') ||
        (e.ctrlKey && e.shiftKey && e.key === 'C') ||
        (e.ctrlKey && e.key === 'u') ||
        (e.ctrlKey && e.key === 's')
      ) {
        e.preventDefault();
        toast.error("Inspecting is not allowed!");
        return false;
      }

      // Disable Tab key to prevent tab switching
      if (e.key === 'Tab') {
        e.preventDefault();
        toast.error("Tab navigation is disabled during quiz!");
        return false;
      }

      // Disable Alt key combinations (Alt+Tab, Alt+F4, etc)
      if (e.altKey && (e.key === 'Tab' || e.key === 'F4')) {
        e.preventDefault();
        toast.error("Alt+Tab and Alt+F4 are disabled!");
        return false;
      }

      // Disable Windows/Meta key during entire quiz - SILENT BLOCKING (NO MESSAGE)
      if (e.key === 'Meta' || e.key === 'OS') {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return false;
      }

      // Disable Ctrl+Alt+Delete (though browser can't fully prevent this)
      if (e.ctrlKey && e.altKey && e.key === 'Delete') {
        e.preventDefault();
        return false;
      }

      // Disable Alt+Tab globally
      if (e.altKey && e.key === 'Tab') {
        e.preventDefault();
        toast.error("Switching applications is not allowed!");
        return false;
      }

      // Disable Ctrl+W (close tab)
      if (e.ctrlKey && e.key === 'w') {
        e.preventDefault();
        toast.error("Closing tabs is not allowed!");
        return false;
      }

      // Disable Ctrl+T (new tab)
      if (e.ctrlKey && e.key === 't') {
        e.preventDefault();
        toast.error("Opening new tabs is not allowed!");
        return false;
      }

      // Disable Ctrl+N (new window)
      if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        toast.error("Opening new windows is not allowed!");
        return false;
      }

      return true;
    };

    // Additional handler for keyup to prevent Windows key from doing anything
    const preventWindowsKeyUp = (e) => {
      if (e.key === 'Meta' || e.key === 'OS') {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return false;
      }
    };

    // Additional handler for keypress to prevent Windows key
    const preventWindowsKeyPress = (e) => {
      if (e.key === 'Meta' || e.key === 'OS') {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return false;
      }
    };

    const preventCopy = (e) => {
      e.preventDefault();
      toast.error("Copying is not allowed!");
      return false;
    };

    document.addEventListener('contextmenu', preventInspect);
    document.addEventListener('keydown', preventKeys);
    document.addEventListener('keyup', preventWindowsKeyUp, true); // Use capture phase
    document.addEventListener('keypress', preventWindowsKeyPress, true); // Use capture phase
    document.addEventListener('copy', preventCopy);
    document.addEventListener('paste', preventCopy);
    document.addEventListener('cut', preventCopy);

    // Also add listener to window to catch at the highest level
    window.addEventListener('keydown', preventKeys);

    return () => {
      document.removeEventListener('contextmenu', preventInspect);
      document.removeEventListener('keydown', preventKeys);
      document.removeEventListener('keyup', preventWindowsKeyUp, true);
      document.removeEventListener('keypress', preventWindowsKeyPress, true);
      document.removeEventListener('copy', preventCopy);
      document.removeEventListener('paste', preventCopy);
      document.removeEventListener('cut', preventCopy);
      window.removeEventListener('keydown', preventKeys);
    };
  }, [quizFrozen]);

  /* ---------------------
     ESC Key Listener - Block Immediately on First Press
     Extra blocking during frozen state to prevent escape attempts while blocked
  --------------------- */
  useEffect(() => {
    if (!student || quizCompleted) return;
    
    const escListener = (e) => {
      if (e.key === "Escape") {
        e.preventDefault?.();
        
        // During blocked state - show aggressive warning
        if (quizFrozen) {
          toast.error("🚫 ESC key is DISABLED while blocked! You cannot escape from this quiz!");
          console.warn("Student attempted ESC while blocked - silently preventing");
          return;
        }
        
        // Prevent multiple rapid ESC presses from triggering multiple blocks
        const now = Date.now();
        if (escapeAttemptBlocked && (now - lastEscapeAttemptTime < 5000)) {
          console.warn("ESC press ignored - already blocked from escape attempt");
          return; // Ignore rapid repeated ESC presses
        }
        
        setEscapeAttemptBlocked(true);
        setLastEscapeAttemptTime(now);
        
        // Immediately block the student for trying to escape
        handleCheatingDetected(setQuizFrozen, quizId, setSubmitting, setBlockCountdown, setCheatWarningShown, cheatWarningShown);
      }
    };
    
    document.addEventListener("keydown", escListener);
    return () => document.removeEventListener("keydown", escListener);
  }, [student, quizId, cheatWarningShown, escapeAttemptBlocked, lastEscapeAttemptTime, quizCompleted, quizFrozen]);

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
    
    // Block the student for intentional logout
    try {
      await axios.post(
        `${import.meta.env.VITE_APP}/api/quizzes/${quizId}/block`,
        { reason: "student_logout" },
        { withCredentials: true }
      );
    } catch (err) {
      console.error("Failed to block on logout:", err);
    }
    
    navigate("/");
  };
  const isAnswered = (i) => answers.some((a) => a.questionId === questions[i]?._id);

  /* ---------------------
     Loading / Countdown
  --------------------- */
  if (!progressLoaded || questions.length === 0)
    return <p className="text-center mt-20 text-lg">Loading quiz...</p>;

  if (showStartingLoader)
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-85 backdrop-blur-sm text-white text-9xl font-bold select-none">
        {startingCountdown > 0 ? startingCountdown : "Go!"}
      </div>
    );

  const currentQ = questions[currentQuestionIndex];

  /* ---------------------
     FINAL RENDER
  --------------------- */
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

      {quizFrozen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 backdrop-blur-sm text-white select-none pointer-events-auto">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Quiz Frozen</h1>
            <p className="text-xl mb-2">You have been blocked for cheating.</p>
            <p className="text-lg mb-4">Time remaining: {blockCountdown} seconds</p>
            {!document.fullscreenElement && (
              <div className="mb-4">
                <p className="text-sm mb-2">You must be in fullscreen mode to continue.</p>
                <button
                  onClick={enterFullscreen}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold"
                >
                  Enter Fullscreen
                </button>
              </div>
            )}
            <p className="text-sm mt-4">Return to the quiz tab and fullscreen to continue.</p>
          </div>
        </div>
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
            <QuestionComponent
              question={currentQ}
              selectedOption={selectedOption}
              onOptionSelect={handleOptionClick}
              disabled={quizFrozen || quizCompleted}
            />
          </div>

          <div className="mt-3 w-full">
            <div className="sm:sticky sm:bottom-6 sm:z-40 sm:bg-transparent">
              <NavigationButtons
                currentIndex={currentQuestionIndex}
                totalQuestions={questions.length}
                canSubmit={answers.length === questions.length}
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
          <h2 className="font-bold text-lg mb-4 border-b pb-2 text-center">Question Navigation</h2>
          <div className="grid grid-cols-5 gap-3">
            {questions.map((_, idx) => (
              <button
                key={idx}
                disabled={quizFrozen}
                onClick={() => {
                  if (!quizFrozen) {
                    setCurrentQuestionIndex(idx);
                    saveProgress();
                  }
                }}
                className={`p-2 rounded-lg transition duration-200 font-semibold ${
                  currentQuestionIndex === idx
                    ? "bg-blue-600 text-white"
                    : isAnswered(idx)
                    ? "bg-green-500 text-white hover:bg-green-600"
                    : "bg-gray-200 hover:bg-gray-300"
                } ${quizFrozen ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                               {idx + 1}
              </button>
            ))}
          </div>
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
