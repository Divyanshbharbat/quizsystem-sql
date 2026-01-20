
// =========================
// Shuffle Utilities
// =========================

export const hashCode = (str = "") => {
  str = String(str);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
};

export function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const seededShuffle = (array, seed) => {
  let arr = [...array];
  const random = mulberry32(hashCode(seed));

  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

export const randomShuffle = (array) => {
  let arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

import axios from "axios";
import toast from "react-hot-toast";

// Progressive blocking for cheating attempts
// 1st cheat: 30 second block
// 2nd cheat: 2 minute block
// 3rd+ cheat: Permanent block from quiz
export const handleCheatingDetected = async (
  setQuizFrozen,
  quizId,
  setSubmitting,
  setBlockCountdown,
  setCheatWarningShown,
  cheatWarningShown
) => {
  // Only process once per event
  if (cheatWarningShown) {
    console.warn("Cheating attempt detected (already processed)");
    return;
  }

  try {
    const { data } = await axios.post(
      `${import.meta.env.VITE_APP}/api/student/increase-attempt`,
      {},
      { withCredentials: true }
    );

    const attemptCount = data.attempts || 1;
    
    // Mark warning as shown
    setCheatWarningShown?.(true);

    if (data.blocked) {
      // Student is permanently blocked after 3 attempts
      toast.error("🚫 PERMANENT BLOCK: You have been permanently blocked from this quiz due to multiple cheating attempts!");
      setQuizFrozen(true);
      setSubmitting?.(false);
      console.warn("Student permanently blocked after multiple cheating attempts");
      return { ...data, blocked: true };
    } else {
      // Apply progressive blocking
      let blockDuration = 0;
      let blockMessage = "";

      if (attemptCount === 1) {
        // First cheat: 30 second block
        blockDuration = 30;
        blockMessage = `⚠️ CHEAT DETECTED (Attempt 1/3)! Blocked for 30 seconds. ${3 - attemptCount} more attempts will result in permanent block!`;
      } else if (attemptCount === 2) {
        // Second cheat: 2 minute block
        blockDuration = 120;
        blockMessage = `🚫 CHEAT DETECTED AGAIN (Attempt 2/3)! Blocked for 2 minutes. One more attempt will permanently block you!`;
      } else {
        // Third+ cheat: Already handled by data.blocked above
        blockDuration = 300;
        blockMessage = `🚫 FINAL WARNING (Attempt 3/3)! Blocked for 5 minutes. Any further cheating will result in permanent block!`;
      }

      // Apply the block
      try {
        const blockRes = await axios.post(
          `${import.meta.env.VITE_APP}/api/quizzes/${quizId}/block-student`,
          { duration: blockDuration },
          { withCredentials: true }
        );
        
        const remainingSeconds = blockRes.data?.remainingSeconds ?? blockDuration;
        setBlockCountdown?.(remainingSeconds);
        setQuizFrozen(true);
        
        toast.error(blockMessage);
        console.warn(`Cheating detected - Attempt ${attemptCount}: ${blockDuration}s block applied`);

        // Poll backend for unblock
        const pollInterval = setInterval(async () => {
          try {
            const statusRes = await axios.get(
              `${import.meta.env.VITE_APP}/api/quizzes/${quizId}/block-status`,
              { withCredentials: true }
            );
            if (statusRes.data.success) {
              const newRemaining = statusRes.data.remainingSeconds;
              setBlockCountdown?.(newRemaining);
              if (newRemaining <= 0) {
                clearInterval(pollInterval);
                setQuizFrozen(false);
                toast.success("✅ Block expired. Continue carefully - further cheating will be permanent!");
              }
            }
          } catch (err) {
            console.error("Error polling block status:", err);
          }
        }, 1000);

        // Store interval ID
        window._blockPollInterval = pollInterval;
        
        return { ...data, remainingSeconds, blocked: false };
      } catch (err) {
        console.error("Error applying block:", err);
        toast.error("Error applying block. Please contact support.");
        return null;
      }
    }
  } catch (err) {
    console.error("Cheating detect error:", err);
    return null;
  }
};

// Block student from backend

// ✅ FIXED: Returns expiresAt timestamp so countdown can be calculated dynamically
export const blockStudent = async (quizId) => {
  if (!quizId) {
    console.error("blockStudent: quizId required");
    return { expiresAt: null, remainingSeconds: 0 };
  }

  try {
    const { data } = await axios.post(
      `${import.meta.env.VITE_APP}/api/quizzes/${quizId}/block-student`,
      {},
      { withCredentials: true }
    );

    // ✅ Return BOTH expiresAt timestamp AND remainingSeconds for dynamic countdown
    return {
      expiresAt: data?.expiresAt, // Timestamp in milliseconds
      remainingSeconds: data?.remainingSeconds ?? 30,
    };
  } catch (e) {
    console.error("Error blocking student:", e);
    return { expiresAt: null, remainingSeconds: 0 };
  }
};


// =========================
// SYSTEM SECURITY EVENTS
// =========================

let listenersAdded = false;

export const initSecurityListeners = (onCheatDetected) => {
  if (listenersAdded) return;
  listenersAdded = true;

  const prevent = (e) => {
    try {
      e.preventDefault();
      // If user attempted to copy, proactively clear the clipboard (allowed during the copy event)
      if (e.type === "copy" && navigator.clipboard && navigator.clipboard.writeText) {
        try {
          navigator.clipboard.writeText("");
        } catch (err) {
          // ignore clipboard errors
        }
      }
    } catch (err) {
      // swallow
    }
  };

  // Prevent copying/selecting/context menu and drag
  // Use capture to try and block browser native context menu (which may include "Inspect")
  document.addEventListener("copy", prevent, { capture: true });
  document.addEventListener("contextmenu", (e) => {
    // stop other handlers that might show the native menu
    try {
      e.stopImmediatePropagation?.();
    } catch {}
    prevent(e);
  }, { capture: true });
  document.addEventListener("dragstart", prevent, { capture: true });
  document.addEventListener("selectstart", prevent, { capture: true });

  // Also prevent right-click at mousedown stage to be extra aggressive
  const rightMouseDown = (e) => {
    try {
      if (e.button === 2) {
        e.preventDefault();
        e.stopImmediatePropagation?.();
      }
    } catch {}
  };
  document.addEventListener("mousedown", rightMouseDown, { capture: true });
  // Mirror on window too
  window.addEventListener("contextmenu", (e) => {
    try {
      e.stopImmediatePropagation?.();
    } catch {}
    prevent(e);
  }, { capture: true });

  // Keyboard security
    const keyListener = (e) => {
    const devToolsKeys =
      e.key === "F12" ||
      (e.ctrlKey &&
        e.shiftKey &&
        ["I", "J", "C"].includes(e.key.toUpperCase())) ||
      (e.ctrlKey && e.key.toUpperCase() === "U");

    const escapeKey = e.key === "Escape";

    const windowsKey =
      e.key === "Meta" ||
      e.key === "OS" ||
      e.keyCode === 91 ||
      e.keyCode === 92;

      // Print / screenshot keys (common codes)
      const printKey =
        e.key === "PrintScreen" ||
        e.key === "Print" ||
        e.key === "PrintScrn" ||
        e.keyCode === 44;

      // Common print / save shortcuts
      const printShortcut = (e.ctrlKey && e.key && e.key.toUpperCase() === "P");
      const saveShortcut = (e.ctrlKey && e.key && e.key.toUpperCase() === "S");

      if (devToolsKeys || escapeKey || windowsKey || printKey || printShortcut || saveShortcut) {
      try {
        e.preventDefault();
      } catch {}

      // Inform the caller that a cheating-like action occurred
      try {
        onCheatDetected();
      } catch (err) {
        console.error("onCheatDetected callback error:", err);
      }

      // Force fullscreen again
      const el = document.documentElement;
      if (el.requestFullscreen) el.requestFullscreen();
      else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    }
  };

  document.addEventListener("keydown", keyListener, { capture: true });

  // Store cleanup function:
  window._quizSecurityCleanup = () => {
    document.removeEventListener("copy", prevent);
    document.removeEventListener("contextmenu", prevent);
    document.removeEventListener("dragstart", prevent);
    document.removeEventListener("selectstart", prevent);
    document.removeEventListener("keydown", keyListener);
    document.removeEventListener("mousedown", rightMouseDown, { capture: true });
    window.removeEventListener("contextmenu", prevent);
    listenersAdded = false;
  };
};

// Remove ALL security listeners
export const removeSecurityListeners = () => {
  if (window._quizSecurityCleanup) {
    window._quizSecurityCleanup();
    delete window._quizSecurityCleanup;
  }
};

// =========================
// Block when attempts hit 3
// =========================
export const checkAndBlockIfLimitReached = async (
  attempts,
  quizId,
  setQuizFrozen,
  setSubmitting
) => {
  if (attempts >= 3) {
    await blockStudent(quizId, setQuizFrozen, setSubmitting);
  }
};
