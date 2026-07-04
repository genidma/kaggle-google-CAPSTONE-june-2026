document.addEventListener("DOMContentLoaded", () => {
  console.log("MySupportBuddy UI loaded successfully!");

  /* ---- DOM References ---- */
  const welcomeView  = document.getElementById("welcomeView");
  const loadingView  = document.getElementById("loadingView");
  const resultsView  = document.getElementById("resultsView");
  const authView     = document.getElementById("authView");
  const profileView  = document.getElementById("profileView");
  const inputBar     = document.getElementById("inputBar");
  const loadingLabel = document.getElementById("loadingLabel");

  const supportForm  = document.getElementById("supportForm");
  const msgInput     = document.getElementById("msgInput");
  const btnBack      = document.getElementById("btnBack");

  const btnAuth        = document.getElementById("btnAuth");
  const btnSignUp      = document.getElementById("btnSignUp");
  const btnProfile     = document.getElementById("btnProfile");
  const btnProfileBack = document.getElementById("btnProfileBack");
  const btnLogout      = document.getElementById("btnLogout");
  
  const authForm       = document.getElementById("authForm");
  const authEmail      = document.getElementById("authEmail");
  const authPassword   = document.getElementById("authPassword");
  const authTitle      = document.getElementById("authTitle");
  const authSubmit     = document.getElementById("btnAuthSubmit");
  const authToggleLink = document.getElementById("authToggleLink");
  const authToggleText = document.getElementById("authToggleText");
  const authError      = document.getElementById("authError");

  const profileEmail   = document.getElementById("profileEmail");
  const profileTier    = document.getElementById("profileTier");

  // Profile Settings
  const settingSounds            = document.getElementById("settingSounds");
  const settingAlerts            = document.getElementById("settingAlerts");
  const changePasswordForm       = document.getElementById("changePasswordForm");
  const changeCurrentPassword    = document.getElementById("changeCurrentPassword");
  const changeNewPassword        = document.getElementById("changeNewPassword");
  const changeConfirmPassword    = document.getElementById("changeConfirmPassword");
  const btnChangePasswordSubmit  = document.getElementById("btnChangePasswordSubmit");
  const changePasswordError      = document.getElementById("changePasswordError");
  const changePasswordSuccess    = document.getElementById("changePasswordSuccess");

  const responseText     = document.getElementById("responseText");
  const buddySection     = document.getElementById("buddySection");
  const buddyGrid        = document.getElementById("buddyGrid");
  const crisisSection    = document.getElementById("crisisSection");
  const crisisLineName   = document.getElementById("crisisLineName");
  const crisisLineDesc   = document.getElementById("crisisLineDesc");
  const crisisLinePhone  = document.getElementById("crisisLinePhone");
  const crisisLineHours  = document.getElementById("crisisLineHours");
  const btnCallFromResults = document.getElementById("btnCallFromResults");

  // Sidbar crisis button
  const btnCallCrisis = document.getElementById("btnCallCrisis");

  // Pipeline indicators
  const pipelineOrchestrator = document.getElementById("pipelineOrchestrator");
  const pipelineSearch       = document.getElementById("pipelineSearch");
  const pipelinePrivacy      = document.getElementById("pipelinePrivacy");

  // Settings dialog
  const btnSettings    = document.getElementById("btnSettings");
  const settingsDialog = document.getElementById("settingsDialog");
  const btnCloseSettings = document.getElementById("btnCloseSettings");
  const btnSaveKey     = document.getElementById("btnSaveKey");
  const btnClearKey    = document.getElementById("btnClearKey");
  const apiKeyInput    = document.getElementById("apiKeyInput");

  // Crisis call dialog
  const crisisCallDialog = document.getElementById("crisisCallDialog");
  const callTimerEl      = document.getElementById("callTimer");
  const btnEndCall       = document.getElementById("btnEndCall");

  // Buddy view dialog
  const btnViewBuddy       = document.getElementById("btnViewBuddy");
  const buddyViewDialog    = document.getElementById("buddyViewDialog");
  const btnCloseBuddyView  = document.getElementById("btnCloseBuddyView");
  const buddyNotificationArea = document.getElementById("buddyNotificationArea");

  /* ---- State ---- */
  let geminiApiKey = localStorage.getItem("gemini_api_key") || "";
  apiKeyInput.value = geminiApiKey;

  let currentUser = JSON.parse(localStorage.getItem("match_user") || "null");
  let isSignUpMode = false;

  let callIntervalId = null;
  let callStartTime  = null;
  let selectedBuddyId = null;  // buddy ID to notify after call
  let crisisNotifications = []; // in-memory log for demo

  /* ============================================================
     DIALOG UTILITIES
  ============================================================ */
  function openDialog(dlg) { dlg.showModal(); }
  function closeDialog(dlg) { dlg.close(); }

  // Light-dismiss fallback for browsers without closedby support
  function addLightDismiss(dlg) {
    if ('closedBy' in HTMLDialogElement.prototype) return;
    dlg.addEventListener("click", (e) => {
      if (e.target !== dlg) return;
      const r = dlg.getBoundingClientRect();
      const inside = r.top <= e.clientY && e.clientY <= r.bottom &&
                     r.left <= e.clientX && e.clientX <= r.right;
      if (!inside) dlg.close();
    });
  }

  [settingsDialog, crisisCallDialog, buddyViewDialog].forEach(addLightDismiss);

  /* ---- Auth & Profile logic ---- */
  function updateAuthUI() {
    if (currentUser) {
      btnAuth.classList.add("hidden");
      btnSignUp.classList.add("hidden");
      btnProfile.classList.remove("hidden");
      profileEmail.textContent = currentUser.email;
      profileTier.textContent = `${currentUser.tier} Member`;
    } else {
      btnAuth.classList.remove("hidden");
      btnSignUp.classList.remove("hidden");
      btnProfile.classList.add("hidden");
    }
  }

  function setAuthMode(signup) {
    isSignUpMode = signup;
    authTitle.textContent = isSignUpMode ? "Create a MySupportBuddy Account" : "Login to MySupportBuddy";
    authSubmit.textContent = isSignUpMode ? "Begin Journey" : "Login";
    authToggleText.innerHTML = isSignUpMode 
      ? `Already have an account? <span id="authToggleLink" class="auth-link">Login</span>`
      : `First time here? <span id="authToggleLink" class="auth-link">Create Account</span>`;
  }

  // Use event delegation for auth toggle to handle dynamic content
  authView.addEventListener("click", (e) => {
    if (e.target.id === "authToggleLink") {
      setAuthMode(!isSignUpMode);
    }
  });

  btnAuth.addEventListener("click", () => {
    setAuthMode(false);
    show(authView);
  });

  btnSignUp.addEventListener("click", () => {
    setAuthMode(true);
    show(authView);
  });

  btnProfile.addEventListener("click", () => show(profileView));
  btnProfileBack.addEventListener("click", () => show(welcomeView));

  authForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = authEmail.value.trim();
    const password = authPassword.value;

    authError.classList.add("hidden");
    authSubmit.disabled = true;
    authSubmit.textContent = "Processing...";

    try {
      const endpoint = isSignUpMode ? "/api/auth/signup" : "/api/auth/login";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(getErrorMessage(errData, "Authentication failed"));
      }

      currentUser = await res.json();
      localStorage.setItem("match_user", JSON.stringify(currentUser));
      updateAuthUI();
      toast(isSignUpMode ? "Account created! Welcome." : "Logged in successfully.");
      show(welcomeView);
    } catch (err) {
      authError.textContent = err.message;
      authError.classList.remove("hidden");
    } finally {
      authSubmit.disabled = false;
      authSubmit.textContent = isSignUpMode ? "Begin Journey" : "Login";
    }
  });

  btnLogout.addEventListener("click", () => {
    currentUser = null;
    localStorage.removeItem("match_user");
    updateAuthUI();
    toast("Logged out");
    show(welcomeView);
  });

  // Initialize general settings checkboxes
  const soundsEnabled = localStorage.getItem("setting_sounds") === "true";
  settingSounds.checked = soundsEnabled;
  const alertsEnabled = localStorage.getItem("setting_alerts") === "true";
  settingAlerts.checked = alertsEnabled;

  settingSounds.addEventListener("change", () => {
    localStorage.setItem("setting_sounds", settingSounds.checked);
    toast(settingSounds.checked ? "Notification sounds enabled ✓" : "Notification sounds disabled");
  });

  settingAlerts.addEventListener("change", () => {
    localStorage.setItem("setting_alerts", settingAlerts.checked);
    toast(settingAlerts.checked ? "Background alerts enabled ✓" : "Background alerts disabled");
  });

  // Change Password submit handler
  changePasswordForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const currentPassword = changeCurrentPassword.value;
    const newPassword = changeNewPassword.value;
    const confirmPassword = changeConfirmPassword.value;

    changePasswordError.classList.add("hidden");
    changePasswordSuccess.classList.add("hidden");

    if (newPassword !== confirmPassword) {
      changePasswordError.textContent = "New passwords do not match";
      changePasswordError.classList.remove("hidden");
      return;
    }

    btnChangePasswordSubmit.disabled = true;
    btnChangePasswordSubmit.textContent = "Updating...";

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: currentUser.email,
          current_password: currentPassword,
          new_password: newPassword,
          confirm_new_password: confirmPassword
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(getErrorMessage(errData, "Failed to update password"));
      }

      changePasswordSuccess.textContent = "Password updated successfully ✓";
      changePasswordSuccess.classList.remove("hidden");
      changeCurrentPassword.value = "";
      changeNewPassword.value = "";
      changeConfirmPassword.value = "";
    } catch (err) {
      changePasswordError.textContent = err.message;
      changePasswordError.classList.remove("hidden");
    } finally {
      btnChangePasswordSubmit.disabled = false;
      btnChangePasswordSubmit.textContent = "Change Password";
    }
  });

  updateAuthUI();

  /* ---- Settings dialog ---- */
  btnSettings.addEventListener("click",       () => openDialog(settingsDialog));
  btnCloseSettings.addEventListener("click",  () => closeDialog(settingsDialog));

  btnSaveKey.addEventListener("click", () => {
    geminiApiKey = apiKeyInput.value.trim();
    localStorage.setItem("gemini_api_key", geminiApiKey);
    closeDialog(settingsDialog);
    toast("API Key saved ✓");
  });

  btnClearKey.addEventListener("click", () => {
    geminiApiKey = "";
    apiKeyInput.value = "";
    localStorage.removeItem("gemini_api_key");
    closeDialog(settingsDialog);
    toast("API Key cleared");
  });

  /* ---- Buddy View dialog ---- */
  btnViewBuddy.addEventListener("click",       () => { renderBuddyNotifications(); openDialog(buddyViewDialog); });
  btnCloseBuddyView.addEventListener("click",  () => closeDialog(buddyViewDialog));

  /* ============================================================
     PROMPT CHIPS
  ============================================================ */
  document.querySelectorAll(".prompt-chip").forEach(chip => {
    chip.addEventListener("click", () => {
      msgInput.value = chip.dataset.msg;
      msgInput.focus();
    });
  });

  /* ============================================================
     BACK BUTTON
  ============================================================ */
  btnBack.addEventListener("click", () => {
    show(welcomeView);
    resetPipeline();
  });

  /* ============================================================
     SUPPORT FORM SUBMIT
  ============================================================ */
  supportForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const message = msgInput.value.trim();
    if (!message) return;

    show(loadingView);
    setPipeline("orchestrator", "active", "Analyzing message...");
    setPipeline("search", "idle", "Waiting...");
    setPipeline("privacy", "idle", "Waiting...");

    try {
      loadingLabel.textContent = "Orchestrator: Classifying support needs...";
      await wait(700);

      setPipeline("orchestrator", "done", "Complete");
      setPipeline("search", "active", "Querying buddy & crisis directory...");
      loadingLabel.textContent = "Service Search: Finding available resources...";
      await wait(700);

      setPipeline("search", "done", "Complete");
      setPipeline("privacy", "active", "Applying privacy guardrails...");
      loadingLabel.textContent = "Privacy Guard: Confirming access policies...";
      await wait(500);

      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, custom_api_key: geminiApiKey })
      });

      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();

      setPipeline("privacy", "done", "Complete");
      await wait(200);

      renderResults(data);

    } catch (err) {
      console.error(err);
      setPipeline("orchestrator", "error", "Error");
      setPipeline("search", "error", "Error");
      setPipeline("privacy", "error", "Error");
      show(welcomeView);
      toast(`Error: ${err.message}`, "error");
    }
  });

  /* ============================================================
     RENDER RESULTS
  ============================================================ */
  function renderResults(data) {
    // Response text
    responseText.innerHTML = mdToHtml(data.response || "");

    // Buddies
    buddyGrid.innerHTML = "";
    const resources = data.resources || {};
    const buddies = resources.all_buddies || [];
    const crisis  = resources.crisis_line || {};

    if (buddies.length > 0) {
      buddySection.classList.remove("hidden");
      buddies.forEach(buddy => {
        buddyGrid.appendChild(createBuddyCard(buddy));
      });
    } else {
      buddySection.classList.add("hidden");
    }

    // Crisis line card
    if (crisis.name) {
      crisisSection.classList.remove("hidden");
      crisisLineName.textContent  = crisis.name;
      crisisLineDesc.textContent  = crisis.description || "";
      crisisLinePhone.textContent = crisis.phone || "";
      crisisLineHours.textContent = crisis.hours || "";
    } else {
      crisisSection.classList.add("hidden");
    }

    show(resultsView);
  }

  /* ============================================================
     BUDDY CARD FACTORY
  ============================================================ */
  function createBuddyCard(buddy) {
    const card = document.createElement("div");
    card.className = "buddy-card";

    const isOnline = buddy.availability?.toLowerCase() === "online";
    const chipClass = isOnline ? "online" : "offline";
    const specialtyTags = (buddy.specialties || [])
      .map(s => `<span class="specialty-tag">${s}</span>`)
      .join("");

    card.innerHTML = `
      <div class="buddy-card-top">
        <div>
          <div class="buddy-name">${buddy.name}</div>
          <div class="buddy-cert">${buddy.certification}</div>
        </div>
        <span class="availability-chip ${chipClass}">${buddy.availability}</span>
      </div>
      <p class="buddy-bio">${buddy.bio}</p>
      <div class="buddy-specialties">${specialtyTags}</div>
      <div class="buddy-footer">
        <span class="buddy-lang">🌐 ${(buddy.languages || []).join(", ")}</span>
        <button
          class="btn btn-connect"
          data-buddy-id="${buddy.id}"
          data-buddy-name="${buddy.name}"
          ${!isOnline ? "disabled title='Buddy is offline'" : ""}
        >
          ${isOnline ? "Connect" : "Offline"}
        </button>
      </div>
    `;

    // Connect button → start crisis call timer (simulated chat connection)
    const connectBtn = card.querySelector(".btn-connect");
    if (isOnline) {
      connectBtn.addEventListener("click", () => {
        selectedBuddyId = buddy.id;
        startCrisisCall();
      });
    }

    return card;
  }

  /* ============================================================
     CRISIS CALL TIMER
  ============================================================ */
  function startCrisisCall() {
    callStartTime = Date.now();
    callTimerEl.textContent = "00:00";
    openDialog(crisisCallDialog);

    callIntervalId = setInterval(() => {
      const elapsed = Math.floor((Date.now() - callStartTime) / 1000);
      const mins = String(Math.floor(elapsed / 60)).padStart(2, "0");
      const secs = String(elapsed % 60).padStart(2, "0");
      callTimerEl.textContent = `${mins}:${secs}`;
    }, 1000);
  }

  btnEndCall.addEventListener("click", endCrisisCall);

  // Also end call if dialog is closed any other way
  crisisCallDialog.addEventListener("close", () => {
    if (callIntervalId) endCrisisCall();
  });

  async function endCrisisCall() {
    if (!callIntervalId) return;

    clearInterval(callIntervalId);
    callIntervalId = null;

    const durationSeconds = Math.floor((Date.now() - callStartTime) / 1000);
    const durationMinutes = Math.max(1, Math.ceil(durationSeconds / 60));
    const timestamp = new Date().toLocaleString("en-US", {
      month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit"
    });

    closeDialog(crisisCallDialog);

    // Log the crisis call & notify buddy
    if (selectedBuddyId) {
      try {
        const res = await fetch("/api/crisis-call-log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            buddy_id: selectedBuddyId,
            duration_minutes: durationMinutes,
            timestamp
          })
        });

        if (res.ok) {
          const data = await res.json();
          if (data.status === "success") {
            crisisNotifications.push(data.notification);
            toast("Your buddy has been notified (metadata only). ✓");
          }
        }
      } catch (err) {
        console.error("Crisis log error:", err);
      }
    }
  }

  /* ---- Sidebar crisis button also starts a call ---- */
  btnCallCrisis.addEventListener("click", () => {
    selectedBuddyId = null; // no specific buddy for sidebar call
    startCrisisCall();
  });

  btnCallFromResults.addEventListener("click", () => {
    startCrisisCall();
  });

  /* ============================================================
     BUDDY NOTIFICATION VIEW
  ============================================================ */
  function renderBuddyNotifications() {
    if (crisisNotifications.length === 0) {
      buddyNotificationArea.innerHTML = `<div class="empty-state">No warmline calls logged yet. Call the warmline to see a notification appear here.</div>`;
      return;
    }

    buddyNotificationArea.innerHTML = "";
    crisisNotifications.forEach(n => {
      const div = document.createElement("div");
      div.className = "buddy-notification";
      div.innerHTML = `
        <div class="notif-header">📋 Warmline Call Notification</div>
        <div class="notif-meta">📅 ${n.timestamp} &nbsp;|&nbsp; ⏱ ${n.duration_minutes} min</div>
        <div class="notif-body">${n.suggested_buddy_action}</div>
        <div class="notif-privacy">🔒 ${n.privacy_note}</div>
      `;
      buddyNotificationArea.appendChild(div);
    });
  }

  /* ============================================================
     PIPELINE STATE HELPERS
  ============================================================ */
  function setPipeline(agent, state, label) {
    const el = agent === "orchestrator" ? pipelineOrchestrator :
               agent === "search"       ? pipelineSearch       : pipelinePrivacy;

    el.className = `pipeline-item ${state}`;
    el.querySelector(".pipeline-state").textContent = label;
  }

  function resetPipeline() {
    ["orchestrator", "search", "privacy"].forEach(a => setPipeline(a, "idle", "Idle"));
  }

  /* ============================================================
     VIEW SWITCHER
  ============================================================ */
  const views = [welcomeView, loadingView, resultsView, authView, profileView];

  function show(view) {
    views.forEach(v => {
      if (v === view) { v.classList.remove("hidden"); }
      else            { v.classList.add("hidden"); }
    });

    // Hide main layout and input bar if we're in Auth or Profile views
    const isMainView = [welcomeView, loadingView, resultsView].includes(view);
    if (isMainView) {
      document.querySelector(".main-layout").classList.remove("hidden");
      inputBar.classList.remove("hidden");
    } else {
      document.querySelector(".main-layout").classList.add("hidden");
      inputBar.classList.add("hidden");
    }
  }

  /* ============================================================
     UTILITIES
  ============================================================ */
  function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

  function mdToHtml(text) {
    return text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/\n/g, "<br>");
  }

  function toast(msg, type = "success") {
    const t = document.createElement("div");
    t.style.cssText = `
      position:fixed; bottom:24px; right:24px; z-index:9999;
      padding:0.75rem 1.25rem; border-radius:10px;
      font-size:0.85rem; font-weight:600;
      background:${type === "error" ? "#f87171" : "#2dd4bf"};
      color:${type === "error" ? "#fff" : "#060d16"};
      box-shadow:0 4px 16px rgba(0,0,0,0.3);
      animation: fadeIn 0.2s ease;
    `;
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3500);
  }

  function getErrorMessage(errData, defaultMsg) {
    if (!errData || !errData.detail) return defaultMsg;
    if (typeof errData.detail === "string") {
      return errData.detail;
    }
    if (Array.isArray(errData.detail)) {
      return errData.detail.map(d => `${d.loc.slice(1).join(".")}: ${d.msg}`).join("; ");
    }
    return JSON.stringify(errData.detail);
  }

});
