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
  const connectButton = document.getElementById("connectButton");

  const supportForm  = document.getElementById("supportForm");
  const msgInput     = document.getElementById("msgInput");
  const btnBack      = document.getElementById("btnBack");

  const btnAuth        = document.getElementById("btnAuth");
  const btnSignUp      = document.getElementById("btnSignUp");
  const btnProfile     = document.getElementById("btnProfile");
  const btnProfileBack = document.getElementById("btnProfileBack");
  const btnLogout      = document.getElementById("btnLogout");
  
  const btnToggleSidebar     = document.getElementById("btnToggleSidebar");
  const buddySidebar         = document.getElementById("buddySidebar");
  const btnCloseBuddySidebar = document.getElementById("btnCloseBuddySidebar");
  const sidebarBuddyList     = document.getElementById("sidebarBuddyList");
  
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

  // Sidebar crisis button
  const btnCallCrisis = document.getElementById("btnCallCrisis");

  // Pipeline indicators
  const pipelineOrchestrator = document.getElementById("pipelineOrchestrator");
  const pipelineSearch       = document.getElementById("pipelineSearch");
  const pipelinePrivacy      = document.getElementById("pipelinePrivacy");

  // Crisis call dialog
  const crisisCallDialog = document.getElementById("crisisCallDialog");
  const callTimerEl      = document.getElementById("callTimer");
  const btnEndCall       = document.getElementById("btnEndCall");

  // Buddy view dialog
  const btnViewBuddy       = document.getElementById("btnViewBuddy");
  const buddyViewDialog    = document.getElementById("buddyViewDialog");
  const btnCloseBuddyView  = document.getElementById("btnCloseBuddyView");
  const buddyNotificationArea = document.getElementById("buddyNotificationArea");

  // Phase 2: Chat & Trash DOM
  const chatView       = document.getElementById("chatView");
  const chatTitle      = document.getElementById("chatTitle");
  const chatMessages   = document.getElementById("chatMessages");
  const btnNewChat     = document.getElementById("btnNewChat");
  const btnDeleteChat  = document.getElementById("btnDeleteChat");

  const profileConvoList = document.getElementById("profileConvoList");
  const btnOpenTrash     = document.getElementById("btnOpenTrash");
  const trashBinDialog   = document.getElementById("trashBinDialog");
  const btnCloseTrash    = document.getElementById("btnCloseTrash");
  const btnEmptyTrash    = document.getElementById("btnEmptyTrash");
  const trashListArea    = document.getElementById("trashListArea");

  /* ---- State ---- */
  let authToken = localStorage.getItem("msb_token") || null;
  let currentUser = null;

  // Decode JWT claims for display (no verification needed client-side)
  function parseJwtClaims(token) {
    try {
      const payload = token.split(".")[1];
      return JSON.parse(atob(payload));
    } catch { return null; }
  }

  // Restore session from stored token
  if (authToken) {
    const claims = parseJwtClaims(authToken);
    if (claims && claims.exp * 1000 > Date.now()) {
      currentUser = { id: claims.sub, email: claims.email, tier: claims.tier };
    } else {
      // Token expired — clear it
      authToken = null;
      localStorage.removeItem("msb_token");
    }
  }

  let isSignUpMode = false;
  let callIntervalId = null;
  let callStartTime  = null;
  let selectedBuddyId = null;
  let crisisNotifications = [];
  let currentConvoId = null;

  /* ============================================================
     DIALOG UTILITIES
  ============================================================ */
  function openDialog(dlg) { dlg.showModal(); }
  function closeDialog(dlg) { dlg.close(); }

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

  [crisisCallDialog, buddyViewDialog, trashBinDialog].forEach(addLightDismiss);

  /* ---- Auth & Profile logic ---- */
  function updateAuthUI() {
    if (currentUser) {
      btnAuth.classList.add("hidden");
      btnSignUp.classList.add("hidden");
      btnProfile.classList.remove("hidden");
      btnToggleSidebar.classList.remove("hidden");
      profileEmail.textContent = currentUser.email;
      profileTier.textContent = `${currentUser.tier} Member`;
      fetchSidebarBuddies();
      fetchConversations();
    } else {
      btnAuth.classList.remove("hidden");
      btnSignUp.classList.remove("hidden");
      btnProfile.classList.add("hidden");
      btnToggleSidebar.classList.add("hidden");
      buddySidebar.classList.add("hidden");
      currentConvoId = null;
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

      const data = await res.json();
      authToken = data.token;
      localStorage.setItem("msb_token", authToken);
      currentUser = { id: data.id, email: data.email, tier: data.tier };
      updateAuthUI();
      notify(isSignUpMode ? "Account created! Welcome." : "Logged in successfully.");
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
    authToken = null;
    localStorage.removeItem("msb_token");
    updateAuthUI();
    notify("Logged out");
    show(welcomeView);
  });

  // Initialize general settings checkboxes
  const soundsEnabled = localStorage.getItem("setting_sounds") === "true";
  settingSounds.checked = soundsEnabled;
  const alertsEnabled = localStorage.getItem("setting_alerts") === "true";
  settingAlerts.checked = alertsEnabled;

  settingSounds.addEventListener("change", () => {
    localStorage.setItem("setting_sounds", settingSounds.checked);
    notify(settingSounds.checked ? "Notification sounds enabled ✓" : "Notification sounds disabled");
  });

  settingAlerts.addEventListener("change", () => {
    localStorage.setItem("setting_alerts", settingAlerts.checked);
    notify(settingAlerts.checked ? "Background alerts enabled ✓" : "Background alerts disabled");
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
        headers: authHeaders(),
        body: JSON.stringify({
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

  /* ---- Buddy View dialog ---- */
  btnViewBuddy.addEventListener("click",       () => { renderBuddyNotifications(); openDialog(buddyViewDialog); });
  btnCloseBuddyView.addEventListener("click",  () => closeDialog(buddyViewDialog));

  /* ---- Available Buddies Sidebar ---- */
  btnToggleSidebar.addEventListener("click", () => {
    const isClosed = buddySidebar.classList.contains("hidden");
    buddySidebar.classList.toggle("hidden");
    if (isClosed && currentUser) {
      fetchSidebarBuddies();
    }
  });
  btnCloseBuddySidebar.addEventListener("click", () => {
    buddySidebar.classList.add("hidden");
  });

  /* ============================================================
     PROMPT CHIPS & DEMO CARDS (Phase 4.2)
  ============================================================ */
  document.querySelectorAll(".prompt-chip, .demo-card").forEach(item => {
    item.addEventListener("click", () => {
      msgInput.value = item.dataset.msg;
      msgInput.focus();
      if (item.classList.contains("demo-card")) {
        supportForm.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
      }
    });
  });

  /* ============================================================
     MOBILE BOTTOM NAVIGATION (Phase 4.1)
  ============================================================ */
  const mobNavHome = document.getElementById("mobNavHome");
  const mobNavChat = document.getElementById("mobNavChat");
  const mobNavCall = document.getElementById("mobNavCall");
  const mobNavBuddies = document.getElementById("mobNavBuddies");
  const mobNavProfile = document.getElementById("mobNavProfile");

  if (mobNavHome) {
    mobNavHome.addEventListener("click", () => show(welcomeView));
  }
  if (mobNavChat) {
    mobNavChat.addEventListener("click", () => {
      if (!currentUser) {
        notify("Please sign in or send a message to open conversations.", "info");
        show(authView);
      } else {
        show(chatView);
        fetchConversations();
      }
    });
  }
  if (mobNavCall) {
    mobNavCall.addEventListener("click", () => {
      selectedBuddyId = "crisis-line";
      startCrisisCall();
    });
  }
  if (mobNavBuddies) {
    mobNavBuddies.addEventListener("click", async () => {
      buddySidebar.classList.remove("hidden");
      try {
        const res = await fetch("/api/buddies");
        if (res.ok) {
          const data = await res.json();
          renderAvailableBuddies(data.buddies || []);
        }
      } catch (e) {
        console.error("Failed to load buddies for mobile nav:", e);
      }
    });
  }
  if (mobNavProfile) {
    mobNavProfile.addEventListener("click", () => {
      if (currentUser) {
        show(profileView);
        profileEmail.textContent = currentUser.email;
        profileTier.textContent = currentUser.tier || "Standard";
        profileBadge.textContent = "VERIFIED";
        profileBadge.className = "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-primary/15 text-primary border border-primary/20";
        fetchConversations();
      } else {
        show(authView);
      }
    });
  }

  connectButton.addEventListener("click", () => {
    msgInput.value = "I need to talk to someone.";
    msgInput.focus();
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
        body: JSON.stringify({ message })
      });

      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();

      setPipeline("privacy", "done", "Complete");
      await wait(200);

      if (currentUser) {
        if (!currentConvoId) {
          await createNewConversation(message.slice(0, 30) + (message.length > 30 ? "..." : ""));
        }
        if (currentConvoId) {
          fetch(`/api/conversations/${currentConvoId}/messages`, {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify({ role: "user", content: message })
          });
          fetch(`/api/conversations/${currentConvoId}/messages`, {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify({ role: "assistant", content: data.response || "" })
          });
          appendChatMessage("user", message);
          appendChatMessage("assistant", data.response || "");
          
          if (data.resources?.all_buddies?.length > 0) {
            const buddyBox = document.createElement("div");
            buddyBox.className = "self-start w-full max-w-[90%] bg-card/60 border border-border rounded-xl p-4 my-2 flex flex-col gap-3 shadow-sm";
            buddyBox.innerHTML = `<div class="font-display font-bold text-xs text-primary flex items-center gap-1.5"><span class="material-symbols-outlined text-[16px]">account_circle</span> Recommended Peer Buddies</div><div class="grid grid-cols-1 md:grid-cols-2 gap-3 buddy-rec-grid"></div>`;
            const grid = buddyBox.querySelector(".buddy-rec-grid");
            data.resources.all_buddies.slice(0, 2).forEach(b => grid.appendChild(createBuddyCard(b)));
            chatMessages.appendChild(buddyBox);
            chatMessages.scrollTop = chatMessages.scrollHeight;
          }

          show(chatView);
          msgInput.value = "";
          return;
        }
      }

      renderResults(data);

    } catch (err) {
      console.error(err);
      setPipeline("orchestrator", "error", "Error");
      setPipeline("search", "error", "Error");
      setPipeline("privacy", "error", "Error");
      show(welcomeView);
      notify(`Error: ${err.message}`, "error");
    }
  });

  /* ============================================================
     RENDER RESULTS
  ============================================================ */
  function renderResults(data) {
    responseText.innerHTML = mdToHtml(data.response || "");

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
    card.className = "bg-card border border-border rounded-xl p-5 flex flex-col gap-4 shadow-sm hover:border-primary transition-all duration-200";

    const isOnline = buddy.availability?.toLowerCase() === "online";
    const chipClass = isOnline ? "bg-primary/15 text-primary border border-primary/20" : "bg-surface text-text-muted border border-border";
    const specialtyTags = (buddy.specialties || [])
      .map(s => `<span class="bg-surface text-text-main px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide">${s}</span>`)
      .join("");

    card.innerHTML = `
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center text-xl">👤</div>
          <div>
            <div class="font-display font-bold text-sm text-text-main">${buddy.name}</div>
            <div class="text-[10px] text-text-muted">${buddy.certification}</div>
          </div>
        </div>
        <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${chipClass}">${buddy.availability}</span>
      </div>
      <p class="text-xs text-text-main/90 leading-relaxed">${buddy.bio}</p>
      <div class="flex flex-wrap gap-1.5">${specialtyTags}</div>
      <div class="flex items-center justify-between border-t border-border/40 pt-3 mt-1">
        <span class="text-[10px] text-text-muted">🌐 ${(buddy.languages || []).join(", ")}</span>
        <div class="flex items-center gap-2">
          <button class="px-2.5 py-1.5 border border-border bg-surface hover:bg-card text-text-main font-bold rounded-lg text-xs transition-all shadow-sm btn-info" title="View Full Profile">Info</button>
          <button
            class="px-3 py-1.5 bg-primary text-white hover:brightness-110 font-bold rounded-lg text-xs transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed btn-connect"
            data-buddy-id="${buddy.id}"
            data-buddy-name="${buddy.name}"
            ${!isOnline ? "disabled title='Buddy is offline'" : ""}
          >
            ${isOnline ? "Connect" : "Offline"}
          </button>
        </div>
      </div>
    `;

    const connectBtn = card.querySelector(".btn-connect");
    if (isOnline) {
      connectBtn.addEventListener("click", () => {
        selectedBuddyId = buddy.id;
        startCrisisCall();
      });
    }

    const infoBtn = card.querySelector(".btn-info");
    if (infoBtn) {
      infoBtn.addEventListener("click", () => {
        openBuddyProfileModal(buddy);
      });
    }

    return card;
  }

  function openBuddyProfileModal(buddy) {
    const dialog = document.getElementById("buddyProfileDialog");
    const content = document.getElementById("buddyProfileContent");
    if (!dialog || !content) return;

    const isOnline = buddy.availability?.toLowerCase() === "online";
    const chipClass = isOnline ? "bg-primary/15 text-primary border border-primary/20" : "bg-surface text-text-muted border border-border";
    const specialtyTags = (buddy.specialties || [])
      .map(s => `<span class="bg-surface text-text-main px-2.5 py-1 rounded-md text-xs font-bold tracking-wide">${s}</span>`)
      .join("");

    content.innerHTML = `
      <div class="flex items-center justify-between border-b border-border/40 pb-3">
        <h3 class="font-display font-bold text-lg text-text-main flex items-center gap-2">
          <span>👤</span> Buddy Profile Details
        </h3>
        <button id="btnCloseBuddyProfile" class="text-text-muted hover:text-text-main">
          <span class="material-symbols-outlined text-[20px]">close</span>
        </button>
      </div>
      <div class="flex items-center gap-4 py-2">
        <div class="w-14 h-14 rounded-full bg-surface border-2 border-primary/40 flex items-center justify-center text-3xl shadow-sm">👤</div>
        <div>
          <div class="font-display font-bold text-base text-text-main">${buddy.name}</div>
          <div class="text-xs text-primary font-semibold">${buddy.certification}</div>
          <div class="mt-1"><span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${chipClass}">${buddy.availability}</span></div>
        </div>
      </div>
      <div class="flex flex-col gap-1.5 bg-surface/50 p-3 rounded-xl border border-border/40">
        <span class="text-xs font-bold text-text-muted uppercase tracking-wider">About Me</span>
        <p class="text-xs text-text-main leading-relaxed">${buddy.bio || "Dedicated peer support buddy ready to assist you."}</p>
      </div>
      <div class="flex flex-col gap-1.5">
        <span class="text-xs font-bold text-text-muted uppercase tracking-wider">Specialties</span>
        <div class="flex flex-wrap gap-1.5">${specialtyTags || '<span class="text-xs text-text-muted">General Peer Support</span>'}</div>
      </div>
      <div class="flex flex-col gap-1.5">
        <span class="text-xs font-bold text-text-muted uppercase tracking-wider">Languages & Schedule</span>
        <div class="text-xs text-text-main">🌐 Languages: ${(buddy.languages || []).join(", ") || "English"}</div>
        <div class="text-xs text-text-muted">📅 Standard Availability: Mon-Fri, 9:00 AM - 5:00 PM (Local)</div>
      </div>
      <div class="flex items-center justify-end gap-2 border-t border-border/40 pt-4 mt-2">
        <button id="btnDismissBuddyProfile" class="px-4 py-2 border border-border rounded-xl text-xs font-bold text-text-main hover:bg-surface transition-all">Close</button>
        <button id="btnConnectFromProfile" class="px-4 py-2 bg-primary text-white font-bold rounded-xl text-xs hover:brightness-110 transition-all shadow-sm disabled:opacity-50" ${!isOnline ? "disabled title='Buddy is offline'" : ""}>
          ${isOnline ? "Connect with Buddy" : "Currently Offline"}
        </button>
      </div>
    `;

    content.querySelector("#btnCloseBuddyProfile")?.addEventListener("click", () => dialog.close());
    content.querySelector("#btnDismissBuddyProfile")?.addEventListener("click", () => dialog.close());
    const connectBtn = content.querySelector("#btnConnectFromProfile");
    if (isOnline && connectBtn) {
      connectBtn.addEventListener("click", () => {
        dialog.close();
        selectedBuddyId = buddy.id;
        startCrisisCall();
      });
    }

    dialog.showModal();
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
            notify("Your buddy has been notified (metadata only). ✓");
          }
        }
      } catch (err) {
        console.error("Crisis log error:", err);
      }
    }
  }

  /* ---- Sidebar crisis button also starts a call ---- */
  btnCallCrisis.addEventListener("click", () => {
    selectedBuddyId = null;
    startCrisisCall();
  });

  btnCallFromResults.addEventListener("click", () => {
    startCrisisCall();
  });

  /* ============================================================
     BUDDY NOTIFICATION VIEW (styled with Tailwind)
  ============================================================ */
  async function renderBuddyNotifications() {
    let allNotifications = [...crisisNotifications];

    if (currentUser) {
      try {
        const res = await fetch("/api/crisis-calls", { headers: authHeaders() });
        if (res.ok) {
          const data = await res.json();
          if (data.calls && data.calls.length > 0) {
            data.calls.forEach(remoteCall => {
              const exists = allNotifications.some(n => n.timestamp === remoteCall.timestamp && n.duration_minutes === remoteCall.duration_minutes);
              if (!exists) {
                allNotifications.push(remoteCall);
              }
            });
          }
        }
      } catch (err) {
        console.warn("Could not fetch remote crisis calls:", err);
      }
    }

    if (allNotifications.length === 0) {
      buddyNotificationArea.innerHTML = `
        <div class="text-center py-8 text-text-muted text-xs italic">
          No warmline calls logged yet. Call the warmline to see a notification appear here.
        </div>`;
      return;
    }

    buddyNotificationArea.innerHTML = "";
    allNotifications.forEach(n => {
      const div = document.createElement("div");
      div.className = "bg-surface border border-border rounded-xl p-4 flex flex-col gap-2";
      div.innerHTML = `
        <div class="font-display font-semibold text-sm text-text-main flex items-center gap-1.5">
          <span class="material-symbols-outlined text-[16px] text-primary">description</span>
          Warmline Call Notification ${n.buddy_name ? `(${n.buddy_name})` : ""}
        </div>
        <div class="text-[11px] text-text-muted flex items-center gap-3">
          <span class="flex items-center gap-1"><span class="material-symbols-outlined text-[13px]">calendar_today</span> ${n.timestamp}</span>
          <span class="flex items-center gap-1"><span class="material-symbols-outlined text-[13px]">timer</span> ${n.duration_minutes} min</span>
        </div>
        <p class="text-xs text-text-main/90 leading-relaxed">${n.suggested_buddy_action || "User completed a confidential warmline support call."}</p>
        <div class="text-[10px] text-text-muted flex items-center gap-1 border-t border-border/40 pt-2 mt-1">
          <span class="material-symbols-outlined text-[12px] text-primary">shield</span> ${n.privacy_note || "Call content is confidential and has not been recorded or shared."}
        </div>
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
  const views = [welcomeView, loadingView, resultsView, authView, profileView, chatView];

  function show(view) {
    views.forEach(v => {
      if (v === view) { v.classList.remove("hidden"); }
      else            { v.classList.add("hidden"); }
    });

    const isMainView = [welcomeView, loadingView, resultsView, chatView].includes(view);
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

  /** Returns standard headers with JWT Authorization for authenticated requests. */
  function authHeaders() {
    const headers = { "Content-Type": "application/json" };
    if (authToken) headers["Authorization"] = `Bearer ${authToken}`;
    return headers;
  }

  /** Brief status notification — replaces "toast" with veteran-friendly colors. */
  function notify(msg, type = "success") {
    const el = document.createElement("div");
    const bgColor = type === "error" ? "#B8860B" : "#4A7C59";
    el.style.cssText = `
      position:fixed; bottom:24px; right:24px; z-index:9999;
      padding:0.75rem 1.25rem; border-radius:10px;
      font-size:0.85rem; font-weight:600;
      background:${bgColor};
      color:#FFFFFF;
      box-shadow:0 4px 16px rgba(0,0,0,0.2);
      animation: fadeIn 0.2s ease;
    `;
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3500);
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

  /* ============================================================
     FETCH SIDEBAR BUDDIES
  ============================================================ */
  async function fetchSidebarBuddies() {
    try {
      const res = await fetch("/api/buddies");
      if (!res.ok) throw new Error("Failed to load buddies");
      const data = await res.json();
      
      const buddies = data.buddies || [];
      const onlineBuddies = buddies.filter(b => b.availability?.toLowerCase() === "online");
      
      sidebarBuddyList.innerHTML = "";
      if (onlineBuddies.length === 0) {
        sidebarBuddyList.innerHTML = `
          <div class="text-center py-8 text-text-muted text-xs italic">
            All peer buddies are currently offline. Check back soon!
          </div>
        `;
        return;
      }

      onlineBuddies.forEach(buddy => {
        sidebarBuddyList.appendChild(createBuddyCard(buddy));
      });
    } catch (err) {
      console.error("Error loading sidebar buddies:", err);
      sidebarBuddyList.innerHTML = `
        <div class="text-center py-8 text-text-muted text-xs italic">
          Failed to load available buddies list.
        </div>
      `;
    }
  }

  /* ============================================================
     PHASE 2: CONVERSATION & TRASH BIN MANAGEMENT
  ============================================================ */
  if (btnNewChat) {
    btnNewChat.addEventListener("click", () => {
      currentConvoId = null;
      if (chatMessages) chatMessages.innerHTML = "";
      if (msgInput) msgInput.value = "";
      show(welcomeView);
    });
  }

  if (btnDeleteChat) {
    btnDeleteChat.addEventListener("click", () => {
      if (currentConvoId) trashConversation(currentConvoId);
    });
  }

  if (btnOpenTrash) {
    btnOpenTrash.addEventListener("click", () => {
      fetchTrashList();
      openDialog(trashBinDialog);
    });
  }

  if (btnCloseTrash) {
    btnCloseTrash.addEventListener("click", () => closeDialog(trashBinDialog));
  }

  if (btnEmptyTrash) {
    btnEmptyTrash.addEventListener("click", () => emptyTrashBin());
  }

  async function fetchConversations() {
    if (!currentUser) return;
    try {
      const res = await fetch("/api/conversations", { headers: authHeaders() });
      if (!res.ok) throw new Error("Failed to load conversations");
      const data = await res.json();
      renderConvoList(data.conversations || []);
    } catch (err) {
      console.error("Error loading conversations:", err);
      if (profileConvoList) {
        profileConvoList.innerHTML = `<div class="text-center py-4 text-text-muted text-xs italic">Failed to load conversation history.</div>`;
      }
    }
  }

  function renderConvoList(convos) {
    if (!profileConvoList) return;
    profileConvoList.innerHTML = "";
    if (convos.length === 0) {
      profileConvoList.innerHTML = `<div class="text-center py-4 text-text-muted text-xs italic">No active conversations found.</div>`;
      return;
    }
    convos.forEach(c => {
      const el = document.createElement("div");
      el.className = "flex items-center justify-between p-2.5 rounded-lg border border-border/60 bg-background-dark hover:border-primary/50 transition-all cursor-pointer text-xs";
      el.innerHTML = `
        <div class="flex items-center gap-2 truncate flex-1 mr-2">
          <span class="material-symbols-outlined text-[16px] text-primary">chat_bubble</span>
          <span class="font-semibold text-text-main truncate">${c.title || "Untitled Conversation"}</span>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <span class="text-[10px] text-text-muted">${new Date(c.updated_at || c.created_at || Date.now()).toLocaleDateString()}</span>
          <button class="text-text-muted hover:text-rose p-1 btn-trash-convo" data-id="${c.id}" title="Move to trash">
            <span class="material-symbols-outlined text-[14px]">delete</span>
          </button>
        </div>
      `;
      el.addEventListener("click", (e) => {
        if (e.target.closest(".btn-trash-convo")) return;
        loadConversation(c.id);
      });
      const btnTrash = el.querySelector(".btn-trash-convo");
      btnTrash.addEventListener("click", (e) => {
        e.stopPropagation();
        trashConversation(c.id);
      });
      profileConvoList.appendChild(el);
    });
  }

  async function createNewConversation(title) {
    if (!currentUser) return null;
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ title: title || "Support Conversation" })
      });
      if (!res.ok) throw new Error("Failed to create conversation");
      const data = await res.json();
      currentConvoId = data.id;
      if (chatTitle) chatTitle.textContent = data.title || "Conversation";
      fetchConversations();
      return data.id;
    } catch (err) {
      console.error("Create convo error:", err);
      return null;
    }
  }

  async function loadConversation(convoId) {
    if (!currentUser) return;
    try {
      show(loadingView);
      const res = await fetch(`/api/conversations/${convoId}`, { headers: authHeaders() });
      if (!res.ok) throw new Error("Failed to load conversation");
      const data = await res.json();
      currentConvoId = data.id;
      if (chatTitle) chatTitle.textContent = data.title || "Conversation";
      
      chatMessages.innerHTML = "";
      (data.messages || []).forEach(m => {
        appendChatMessage(m.role, m.content, false);
      });
      if (chatMessages) chatMessages.scrollTop = chatMessages.scrollHeight;
      show(chatView);
    } catch (err) {
      console.error("Load convo error:", err);
      notify("Could not load conversation.", "error");
      show(welcomeView);
    }
  }

  function appendChatMessage(role, content, scrollToBottom = true) {
    if (!chatMessages) return;
    const isUser = role === "user";
    const bubble = document.createElement("div");
    bubble.className = `flex flex-col gap-1 max-w-[80%] ${isUser ? "self-end items-end" : "self-start items-start"}`;
    bubble.innerHTML = `
      <div class="text-[10px] font-bold uppercase tracking-wider text-text-muted px-1">${isUser ? "You" : "AI Support Buddy"}</div>
      <div class="p-3.5 rounded-2xl text-xs leading-relaxed ${isUser ? "bg-primary text-white rounded-br-none" : "bg-card border border-border text-text-main rounded-bl-none shadow-sm"}">
        ${isUser ? content : mdToHtml(content)}
      </div>
    `;
    chatMessages.appendChild(bubble);
    if (scrollToBottom) chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  async function trashConversation(convoId) {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/conversations/${convoId}`, {
        method: "DELETE",
        headers: authHeaders()
      });
      if (!res.ok) throw new Error("Failed to trash conversation");
      notify("Conversation moved to trash.");
      if (currentConvoId === convoId) {
        currentConvoId = null;
        if (chatMessages) chatMessages.innerHTML = "";
        show(welcomeView);
      }
      fetchConversations();
    } catch (err) {
      console.error("Trash error:", err);
      notify("Error trashing conversation.", "error");
    }
  }

  async function fetchTrashList() {
    if (!currentUser) return;
    try {
      const res = await fetch("/api/conversations/trash/list", { headers: authHeaders() });
      if (!res.ok) throw new Error("Failed to load trash");
      const data = await res.json();
      renderTrashList(data.trashed || []);
    } catch (err) {
      console.error("Error loading trash:", err);
      if (trashListArea) trashListArea.innerHTML = `<div class="text-center py-4 text-text-muted text-xs italic">Failed to load trash items.</div>`;
    }
  }

  function renderTrashList(trashed) {
    if (!trashListArea) return;
    trashListArea.innerHTML = "";
    if (trashed.length === 0) {
      trashListArea.innerHTML = `<div class="text-center py-8 text-text-muted text-xs italic">Your trash is empty.</div>`;
      return;
    }
    trashed.forEach(t => {
      const el = document.createElement("div");
      el.className = "flex items-center justify-between p-2.5 rounded-lg border border-border bg-surface text-xs";
      el.innerHTML = `
        <div class="flex flex-col truncate mr-2">
          <span class="font-semibold text-text-main truncate">${t.title || "Untitled Conversation"}</span>
          <span class="text-[10px] text-text-muted">Deleted: ${new Date(t.deleted_at || Date.now()).toLocaleDateString()}</span>
        </div>
        <button class="px-2.5 py-1 bg-primary/20 text-primary hover:bg-primary hover:text-white font-bold rounded-md transition-all text-[11px] btn-restore" data-id="${t.id}">
          Restore
        </button>
      `;
      el.querySelector(".btn-restore").addEventListener("click", () => restoreFromTrash(t.id));
      trashListArea.appendChild(el);
    });
  }

  async function restoreFromTrash(convoId) {
    try {
      const res = await fetch(`/api/conversations/${convoId}/restore`, {
        method: "POST",
        headers: authHeaders()
      });
      if (!res.ok) throw new Error("Failed to restore");
      notify("Conversation restored! ✓");
      fetchTrashList();
      fetchConversations();
    } catch (err) {
      console.error("Restore error:", err);
      notify("Error restoring conversation.", "error");
    }
  }

  async function emptyTrashBin() {
    if (!confirm("Permanently delete all conversations in trash? This cannot be undone.")) return;
    try {
      const res = await fetch("/api/conversations/trash/empty", {
        method: "DELETE",
        headers: authHeaders()
      });
      if (!res.ok) throw new Error("Failed to empty trash");
      notify("Trash bin emptied. ✓");
      fetchTrashList();
    } catch (err) {
      console.error("Empty trash error:", err);
      notify("Error emptying trash.", "error");
    }
  }

});
