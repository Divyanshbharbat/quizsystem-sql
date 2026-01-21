const { app, BrowserWindow, globalShortcut, ipcMain, dialog } = require("electron");
const path = require("path");
const isDev = require("electron-is-dev");

let mainWindow;
let isQuizActive = false; // Track if quiz is running

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, "preload.js"),
    },
    fullscreen: true, // Start in fullscreen
    kiosk: false, // We'll control this via code
  });

  const startUrl = isDev
    ? "http://localhost:5173" // Vite dev server
    : `file://${path.join(__dirname, "../build/index.html")}`; // Production build

  mainWindow.loadURL(startUrl);

  if (isDev) {
    mainWindow.webContents.openDevTools(); // Only in dev
  }

  // Block DevTools and other dangerous keys INSIDE the browser
  mainWindow.webContents.on("before-input-event", (event, input) => {
    // Block F12 (DevTools)
    if (input.key === "F12") {
      event.preventDefault();
      return;
    }

    // Block Ctrl+Shift+I (DevTools)
    if (input.control && input.shift && input.key === "I") {
      event.preventDefault();
      return;
    }

    // Block Ctrl+Shift+J (Console)
    if (input.control && input.shift && input.key === "J") {
      event.preventDefault();
      return;
    }

    // Block Ctrl+Shift+C (Inspect)
    if (input.control && input.shift && input.key === "C") {
      event.preventDefault();
      return;
    }

    // Block Ctrl+P (Print)
    if (input.control && input.key === "P") {
      event.preventDefault();
      return;
    }

    // Block Ctrl+S (Save)
    if (input.control && input.key === "S") {
      event.preventDefault();
      return;
    }

    // ✅ NEW: Block Windows+Left arrow (snap left)
    if (input.meta && input.key === "ArrowLeft") {
      console.warn("[SECURITY] Windows+Left (snap) blocked");
      event.preventDefault();
      return;
    }

    // ✅ NEW: Block Windows+Right arrow (snap right)
    if (input.meta && input.key === "ArrowRight") {
      console.warn("[SECURITY] Windows+Right (snap) blocked");
      event.preventDefault();
      return;
    }

    // ✅ NEW: Block arrow keys in fullscreen/kiosk mode
    if (isQuizActive) {
      // These are less critical but still block for completeness
      // You can comment these out if needed
      if (input.key === "ArrowLeft" && input.meta) {
        console.warn("[SECURITY] Arrow key with meta blocked");
        event.preventDefault();
        return;
      }
      if (input.key === "ArrowRight" && input.meta) {
        console.warn("[SECURITY] Arrow key with meta blocked");
        event.preventDefault();
        return;
      }
    }
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  // Prevent window from being closed
  mainWindow.on("close", (event) => {
    if (isQuizActive) {
      event.preventDefault();
      dialog.showErrorBox(
        "Quiz Active",
        "You cannot close the window while the quiz is active!"
      );
    }
  });
}

app.whenReady().then(() => {
  createWindow();
  setupGlobalShortcuts();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// ✅ Setup Global Shortcuts (blocks OS-level keys)
function setupGlobalShortcuts() {
  // Block Windows/Super key
  globalShortcut.register("Super", () => {
    console.log("[SECURITY] Windows key blocked");
    return;
  });

  // Block Alt+Tab
  globalShortcut.register("Alt+Tab", () => {
    console.log("[SECURITY] Alt+Tab blocked");
    return;
  });

  // Block Alt+F4 (Close window)
  globalShortcut.register("Alt+F4", () => {
    console.log("[SECURITY] Alt+F4 blocked");
    if (isQuizActive) {
      mainWindow?.webContents.send("quiz-close-attempt");
    }
    return;
  });

  // Block Ctrl+Alt+Delete (on Windows) - Note: This can't be blocked by Electron
  // but we try anyway
  globalShortcut.register("Ctrl+Alt+Delete", () => {
    console.log("[SECURITY] Ctrl+Alt+Delete blocked");
    return;
  });

  // Block Alt+Escape
  globalShortcut.register("Alt+Escape", () => {
    console.log("[SECURITY] Alt+Escape blocked");
    return;
  });

  // Block Ctrl+Esc (Open Start menu on Windows)
  globalShortcut.register("Ctrl+Escape", () => {
    console.log("[SECURITY] Ctrl+Escape blocked");
    return;
  });

  // Block Cmd+Tab (macOS app switcher)
  globalShortcut.register("Cmd+Tab", () => {
    console.log("[SECURITY] Cmd+Tab blocked");
    return;
  });

  // Block Cmd+Escape (macOS)
  globalShortcut.register("Cmd+Escape", () => {
    console.log("[SECURITY] Cmd+Escape blocked");
    return;
  });

  // ✅ NEW: Block Windows+Left (snap to left)
  globalShortcut.register("Super+Left", () => {
    console.log("[SECURITY] Windows+Left (snap left) blocked");
    return;
  });

  // ✅ NEW: Block Windows+Right (snap to right)
  globalShortcut.register("Super+Right", () => {
    console.log("[SECURITY] Windows+Right (snap right) blocked");
    return;
  });

  // ✅ NEW: Block Windows+Up (maximize)
  globalShortcut.register("Super+Up", () => {
    console.log("[SECURITY] Windows+Up (maximize) blocked");
    return;
  });

  // ✅ NEW: Block Windows+Down (minimize)
  globalShortcut.register("Super+Down", () => {
    console.log("[SECURITY] Windows+Down (minimize) blocked");
    return;
  });

  console.log("✅ Global shortcuts blocked");
}

// ✅ IPC Handlers for React to communicate with Electron

// When quiz starts
ipcMain.on("quiz-started", (event) => {
  isQuizActive = true;
  console.log("🚀 Quiz started - enforcing kiosk mode");
  
  if (mainWindow) {
    mainWindow.setKiosk(true); // Enable kiosk mode
    mainWindow.setFullScreen(true); // Ensure fullscreen
  }
  event.reply("quiz-started-ack", { success: true });
});

// When quiz ends or student is blocked
ipcMain.on("quiz-blocked", (event) => {
  console.log("🚫 Quiz blocked - maintaining kiosk mode");
  // Keep kiosk mode active, quiz is still ongoing but student is blocked
  event.reply("quiz-blocked-ack", { success: true });
});

// When quiz is submitted
ipcMain.on("quiz-submitted", (event) => {
  isQuizActive = false;
  console.log("✅ Quiz submitted - disabling kiosk mode");
  
  if (mainWindow) {
    mainWindow.setKiosk(false); // Disable kiosk mode
  }
  event.reply("quiz-submitted-ack", { success: true });
});

// When student tries to close window during quiz
ipcMain.on("attempt-exit-quiz", (event) => {
  if (isQuizActive) {
    console.log("⚠️ Student attempted to exit during quiz");
    event.reply("exit-denied", { reason: "quiz-active" });
  }
});

// Test endpoint to check if Electron is running
ipcMain.handle("get-app-info", async () => {
  return {
    appName: app.name,
    version: app.getVersion(),
    isRunning: true,
    isQuizActive: isQuizActive,
    platform: process.platform,
  };
});
