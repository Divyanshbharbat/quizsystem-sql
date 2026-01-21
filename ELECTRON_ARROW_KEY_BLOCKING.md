# ✅ ELECTRON SECURITY - ARROW KEY BLOCKING

## Summary
Added Windows+Arrow key blocking at the OS level using Electron's global shortcuts. This prevents users from using Windows+Left and Windows+Right to snap the quiz window or minimize it.

---

## 🔐 Electron-level Blocking (main.js)

### Global Shortcuts (Lines 106-167)

These shortcuts are blocked at the **OS level**, preventing them even in other applications while the app is running.

```javascript
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
```

**How it works:**
- `globalShortcut.register()` intercepts OS-level keyboard events
- Prevents the default Windows 11 snap/dock behavior
- Returns empty function (does nothing)
- User presses Windows+Left → Nothing happens → Cannot snap window

---

## 🔐 Browser-level Blocking (before-input-event)

These are blocked **inside the browser process** (Lines 36-57 in main.js):

```javascript
mainWindow.webContents.on("before-input-event", (event, input) => {
  
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
```

**How it works:**
- `before-input-event` fires before keyboard input reaches the React app
- `event.preventDefault()` stops the key from being processed
- Checks for `input.meta` (Windows key) + arrow direction
- User presses Windows+Right in browser → Blocked → Window doesn't snap

---

## 📊 KEY BLOCKING LAYERS (Defense in Depth)

```
┌──────────────────────────────────────┐
│   User presses Windows+Right         │
└────────────────────┬─────────────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
         ↓                       ↓
┌──────────────────┐     ┌──────────────────┐
│  Layer 1:        │     │  Layer 2:        │
│  Global Shortcut │     │  Browser-level   │
│  (OS-level)      │     │  before-input    │
│                  │     │                  │
│  globalShortcut  │     │  mainWindow.     │
│  .register()     │     │  webContents.on()│
│                  │     │                  │
│  Blocks at OS    │     │  Blocks inside   │
│  before any app  │     │  Electron browser│
└────────┬─────────┘     └────────┬────────┘
         │                        │
         ↓                        ↓
     ✅ BLOCKED              ✅ BLOCKED
```

---

## 🔑 ALL BLOCKED KEYS

### Global Shortcuts (OS-Level)
- `Super` - Windows key alone
- `Super+Left` - Windows + Left arrow (snap left)
- `Super+Right` - Windows + Right arrow (snap right)
- `Super+Up` - Windows + Up arrow (maximize)
- `Super+Down` - Windows + Down arrow (minimize)
- `Alt+Tab` - Switch apps
- `Alt+Escape` - Cycle apps
- `Alt+F4` - Close window
- `Ctrl+Escape` - Open Start menu
- `Ctrl+Alt+Delete` - Task Manager (attempted, may not work on all systems)
- `Cmd+Tab` - macOS app switcher
- `Cmd+Escape` - macOS escape

### Browser-Level (Electron webContents)
- `F12` - DevTools
- `Ctrl+Shift+I` - DevTools alternate
- `Ctrl+Shift+J` - Console
- `Ctrl+Shift+C` - Inspect element
- `Ctrl+P` - Print
- `Ctrl+S` - Save
- `Windows+Left` - Snap left
- `Windows+Right` - Snap right
- `Escape` - (handled in React, not Electron)

---

## 🎯 IMPLEMENTATION DETAILS

### When Quiz Starts

```javascript
ipcMain.on("quiz-started", (event) => {
  isQuizActive = true;
  console.log("🚀 Quiz started - enforcing kiosk mode");
  
  if (mainWindow) {
    mainWindow.setKiosk(true);      // ✅ Enable kiosk mode
    mainWindow.setFullScreen(true); // ✅ Fullscreen
  }
  event.reply("quiz-started-ack", { success: true });
});
```

**Kiosk Mode Effects:**
- Prevents Alt+Tab
- Hides taskbar
- Blocks window management
- Enables before-input-event filtering

### When Student is Blocked

```javascript
ipcMain.on("quiz-blocked", (event) => {
  console.log("🚫 Quiz blocked - maintaining kiosk mode");
  // ✅ Kiosk mode STAYS ACTIVE
  // All keys remain blocked
  event.reply("quiz-blocked-ack", { success: true });
});
```

### When Quiz Ends

```javascript
ipcMain.on("quiz-submitted", (event) => {
  isQuizActive = false;
  console.log("✅ Quiz submitted - disabling kiosk mode");
  
  if (mainWindow) {
    mainWindow.setKiosk(false);  // ✅ Disable kiosk
  }
  event.reply("quiz-submitted-ack", { success: true });
});
```

---

## 🔄 Frontend Integration (Quiz.jsx)

### Signal to Electron When ESC Pressed

```javascript
if (e.key === 'Escape') {
  e.preventDefault();
  
  blockStudent(quizId).then(result => {
    if (result && result.expiresAt) {
      setQuizFrozen(true);
      
      // ✅ Signal to Electron that quiz is blocked
      if (window.electronAPI?.quizBlocked) {
        window.electronAPI.quizBlocked().catch(console.error);
      }
    }
  });
}
```

### In preload.js (Exposed API)

```javascript
contextBridge.exposeInMainWorld("electronAPI", {
  quizStarted: () => {
    ipcRenderer.send("quiz-started");
    return new Promise((resolve) => {
      ipcRenderer.once("quiz-started-ack", resolve);
    });
  },

  quizBlocked: () => {
    ipcRenderer.send("quiz-blocked");
    return new Promise((resolve) => {
      ipcRenderer.once("quiz-blocked-ack", resolve);
    });
  },

  quizSubmitted: () => {
    ipcRenderer.send("quiz-submitted");
    return new Promise((resolve) => {
      ipcRenderer.once("quiz-submitted-ack", resolve);
    });
  },
});
```

---

## ✅ VERIFICATION CHECKLIST

### Arrow Key Blocking
- [x] Windows+Left is blocked (snap left)
- [x] Windows+Right is blocked (snap right)
- [x] Windows+Up is blocked (maximize)
- [x] Windows+Down is blocked (minimize)
- [x] Blocked at both global shortcut AND browser-level
- [x] User cannot snap, minimize, or maximize window

### Window Management
- [x] Kiosk mode enabled when quiz starts
- [x] Fullscreen enforced
- [x] Alt+Tab blocked
- [x] Taskbar hidden
- [x] Window close button disabled during quiz

### Communication
- [x] Frontend signals quiz state to Electron
- [x] Electron updates kiosk mode accordingly
- [x] Console logs all security events

---

## 🧪 TESTING

### Test Windows+Left (Snap Left)
1. Start quiz
2. Press `Windows + Left Arrow`
3. ✅ Window should NOT snap to left side
4. Check console: `[SECURITY] Windows+Left (snap left) blocked`

### Test Windows+Right (Snap Right)
1. During quiz
2. Press `Windows + Right Arrow`
3. ✅ Window should NOT snap to right side
4. Check console: `[SECURITY] Windows+Right (snap right) blocked`

### Test ESC (Combined with Electron)
1. Start quiz
2. Press `ESC`
3. ✅ Quiz freezes (frontend)
4. ✅ Backend block saved (database)
5. ✅ Electron receives `quiz-blocked` signal
6. ✅ Kiosk mode maintained
7. Refresh page
8. ✅ Shows remaining block time
9. ✅ Cannot interact with quiz

---

## 📝 SUMMARY

| Layer | Technology | Keys Blocked | When Active |
|-------|-----------|-------------|------------|
| OS Level | Global Shortcuts | Windows+Arrows, Alt+Tab, etc | Always |
| Browser | before-input-event | F12, Ctrl+Shift+I, Arrows | During quiz |
| React | keydown handler | ESC, F11, Escape combos | During quiz |
| App | Kiosk Mode | Window snap, minimize | When quiz active |
| Backend | Database | Block persistence | After cheat detected |

---

## 🔐 SECURITY BENEFITS

1. **Cannot exit fullscreen** via Windows+Up
2. **Cannot minimize** via Windows+Down
3. **Cannot snap left/right** via Windows+Arrow
4. **Cannot switch apps** via Alt+Tab
5. **Cannot access DevTools** via F12 or Ctrl+Shift+I
6. **Cannot minimize/close** window during quiz
7. **Cannot navigate back** via Alt+Left
8. **Backend blocks** any refresh attempts if already blocked
9. **Auto-submits** quiz if student manages to escape blocking
10. **Electron kiosk mode** prevents all OS-level interactions

---

## 💡 NEXT IMPROVEMENTS

- Block print screen key (Ctrl+PrtScn, PrtScn)
- Block screenshot tools (if running in kiosk environment)
- Add password prompt when trying to exit
- Log all cheating attempts to backend
- Implement ML detection for suspicious patterns
