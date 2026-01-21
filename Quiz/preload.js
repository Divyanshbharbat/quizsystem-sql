const { contextBridge, ipcRenderer } = require("electron");

// ✅ Safe API exposed to React
contextBridge.exposeInMainWorld("electronAPI", {
  // Signal to Electron that quiz has started
  quizStarted: () => {
    ipcRenderer.send("quiz-started");
    return new Promise((resolve) => {
      ipcRenderer.once("quiz-started-ack", resolve);
    });
  },

  // Signal to Electron that student is blocked
  quizBlocked: () => {
    ipcRenderer.send("quiz-blocked");
    return new Promise((resolve) => {
      ipcRenderer.once("quiz-blocked-ack", resolve);
    });
  },

  // Signal to Electron that quiz is submitted
  quizSubmitted: () => {
    ipcRenderer.send("quiz-submitted");
    return new Promise((resolve) => {
      ipcRenderer.once("quiz-submitted-ack", resolve);
    });
  },

  // Attempt to exit quiz
  attemptExitQuiz: () => {
    ipcRenderer.send("attempt-exit-quiz");
    return new Promise((resolve) => {
      ipcRenderer.once("exit-denied", (_, data) => resolve(data));
    });
  },

  // Get app info
  getAppInfo: async () => {
    return await ipcRenderer.invoke("get-app-info");
  },

  // Listen for close attempt
  onCloseAttempt: (callback) => {
    ipcRenderer.on("quiz-close-attempt", callback);
  },

  // Remove listener
  removeCloseAttemptListener: () => {
    ipcRenderer.removeAllListeners("quiz-close-attempt");
  },
});
