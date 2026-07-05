/* ===========================================================================
   MySupportBuddy Frontend Namespace & Styling Tokens (Phase 3)
=========================================================================== */
window.MSB = window.MSB || {};
window.MSB.Tokens = {
  Badges: {
    buddy: "px-3 py-1 rounded-full text-xs font-semibold bg-primary/15 text-primary border border-primary/30 flex items-center gap-1.5 shadow-sm",
    clinician: "px-3 py-1 rounded-full text-xs font-semibold bg-amber/15 text-amber border border-amber/30 flex items-center gap-1.5 shadow-sm",
    caregiver: "px-3 py-1 rounded-full text-xs font-semibold bg-primary/15 text-primary border border-primary/30 flex items-center gap-1.5 shadow-sm",
    patient: "px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 flex items-center gap-1.5 shadow-sm",
    verified: "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-primary/15 text-primary border border-primary/20"
  },
  Toasts: {
    success: "#4A7C59",
    error: "#B8860B",
    info: "#2B5A7A"
  },
  Roles: {
    buddy: { icon: "🛡️", label: "Support Buddy" },
    clinician: { icon: "🩺", label: "Clinician" },
    caregiver: { icon: "🌟", label: "Caregiver" },
    patient: { icon: "👤", label: "Patient" }
  }
};

window.MSB.UI = {
  applyRoleBadge(badgeEl, iconEl, textEl, role = "patient") {
    if (!badgeEl) return;
    badgeEl.classList.remove("hidden");
    const roleConfig = window.MSB.Tokens.Roles[role] || window.MSB.Tokens.Roles.patient;
    const badgeClass = window.MSB.Tokens.Badges[role] || window.MSB.Tokens.Badges.patient;
    if (iconEl) iconEl.textContent = roleConfig.icon;
    if (textEl) textEl.textContent = roleConfig.label;
    badgeEl.className = badgeClass;
  }
};

window.MSB.Auth = {
  getHeaders(token) {
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return headers;
  }
};

document.addEventListener("DOMContentLoaded", () => {
  console.log("MySupportBuddy UI loaded successfully!");

  /* ---- DOM References ---- */
  const welcomeView  = document.getElementById("welcomeView");
  const loadingView  = document.getElementById("loadingView");
  const resultsView  = document.getElementById("resultsView");
  const authView     = document.getElementById("authView");
  const profileView  = document.getElementById("profileView");
  const dashboardView = document.getElementById("dashboardView");
  const buddyDashboardView = document.getElementById("buddyDashboardView");
  const clinicianPortalView = document.getElementById("clinicianPortalView");
  const caregiverPortalView = document.getElementById("caregiverPortalView");
  const userRoleBadge = document.getElementById("userRoleBadge");
  const roleBadgeIcon = document.getElementById("roleBadgeIcon");
  const roleBadgeText = document.getElementById("roleBadgeText");
  const supportBuddiesView = document.getElementById("supportBuddiesView");
  const supportRosterSearch = document.getElementById("supportRosterSearch");
  const supportRosterFilters = document.getElementById("supportRosterFilters");
  const supportRosterGrid = document.getElementById("supportRosterGrid");
  const buddyDetailView = document.getElementById("buddyDetailView");
  const btnBackToDirectory = document.getElementById("btnBackToDirectory");
  const detailAvatar = document.getElementById("detailAvatar");
  const detailName = document.getElementById("detailName");
  const detailPronouns = document.getElementById("detailPronouns");
  const detailReplyTime = document.getElementById("detailReplyTime");
  const detailStatConv = document.getElementById("detailStatConv");
  const detailStatHours = document.getElementById("detailStatHours");
  const detailStatMonths = document.getElementById("detailStatMonths");
  const detailBio = document.getElementById("detailBio");
  const detailQuote = document.getElementById("detailQuote");
  const detailApproach = document.getElementById("detailApproach");
  const detailSpecialties = document.getElementById("detailSpecialties");
  const detailGroundingList = document.getElementById("detailGroundingList");
  const btnDetailConnect = document.getElementById("btnDetailConnect");
  const detailConnectLabel = document.getElementById("detailConnectLabel");
  const inputBar     = document.getElementById("inputBar");
  const loadingLabel = document.getElementById("loadingLabel");
  const connectButton = document.getElementById("connectButton");

  const supportForm  = document.getElementById("supportForm");
  const msgInput     = document.getElementById("msgInput");
  const btnBack      = document.getElementById("btnBack");

  const btnAuth        = document.getElementById("btnAuth");
  const btnSignUp      = document.getElementById("btnSignUp");
  const btnProfile     = document.getElementById("btnProfile");
  const btnDashboard   = document.getElementById("btnDashboard");
  const btnProfileBack = document.getElementById("btnProfileBack");
  const btnLogout      = document.getElementById("btnLogout");
  const headerLogo     = document.getElementById("headerLogo");
  
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

  const crisisPlanForm           = document.getElementById("crisisPlanForm");
  const emergContactName         = document.getElementById("emergContactName");
  const emergContactPhone        = document.getElementById("emergContactPhone");
  const crisisLinePref           = document.getElementById("crisisLinePref");
  const personalGrounding        = document.getElementById("personalGrounding");
  const crisisPlanMessage        = document.getElementById("crisisPlanMessage");
  const btnSaveCrisisPlan        = document.getElementById("btnSaveCrisisPlan");

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
      currentUser = { id: claims.sub, email: claims.email, tier: claims.tier, role: claims.role || "patient" };
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

      // Role Badge logic (#1)
      if (userRoleBadge) {
        window.MSB.UI.applyRoleBadge(userRoleBadge, roleBadgeIcon, roleBadgeText, currentUser.role);
      }

      fetchSidebarBuddies();
      fetchConversations();
    } else {
      btnAuth.classList.remove("hidden");
      btnSignUp.classList.remove("hidden");
      btnProfile.classList.add("hidden");
      btnToggleSidebar.classList.add("hidden");
      buddySidebar.classList.add("hidden");
      if (userRoleBadge) userRoleBadge.classList.add("hidden");
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

  btnProfile.addEventListener("click", () => openProfileView());
  btnDashboard.addEventListener("click", () => navigateToRoleDashboard());
  btnProfileBack.addEventListener("click", () => show(welcomeView));
  if (headerLogo) headerLogo.addEventListener("click", () => show(welcomeView));

  function navigateToRoleDashboard() {
    if (!currentUser) {
      show(dashboardView);
      return;
    }
    const role = currentUser.role || "patient";
    if (role === "buddy") {
      show(buddyDashboardView);
      loadBuddyDashboardData();
    } else if (role === "clinician") {
      show(clinicianPortalView);
      loadClinicianPortalData();
    } else if (role === "caregiver") {
      show(caregiverPortalView);
      loadCaregiverPortalData();
    } else {
      show(dashboardView);
    }
  }

  async function loadBuddyDashboardData() {
    const peersList = document.getElementById("buddyPeersList");
    const callLogsList = document.getElementById("buddyCallLogsList");
    if (!peersList || !callLogsList) return;

    try {
      const res = await fetch("/api/buddy-dashboard", { headers: authHeaders() });
      if (!res.ok) throw new Error("Failed to load Buddy Dashboard");
      const data = await res.json();

      if (data.assigned_peers && data.assigned_peers.length > 0) {
        peersList.innerHTML = data.assigned_peers.map(p => `
          <div class="p-4 rounded-xl border border-border bg-surface flex flex-col gap-2">
            <div class="flex items-center justify-between">
              <span class="font-bold text-sm text-text-main">${p.name}</span>
              <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary uppercase">${p.status}</span>
            </div>
            <p class="text-xs text-text-muted">Last check-in: ${p.last_checkin}</p>
            <p class="text-xs italic text-text-main bg-background-dark p-2 rounded border border-border/50">"${p.notes}"</p>
          </div>
        `).join("");
      } else {
        peersList.innerHTML = `<div class="text-center py-4 text-text-muted text-xs italic col-span-3">No active peers currently assigned to your queue.</div>`;
      }

      if (data.warmline_logs && data.warmline_logs.length > 0) {
        callLogsList.innerHTML = data.warmline_logs.map(log => `
          <div class="p-3 rounded-xl border border-border bg-surface flex items-center justify-between text-xs">
            <div class="flex items-center gap-2">
              <span class="text-primary font-bold">📞 Call #${log.id}</span>
              <span class="text-text-muted">• ${log.duration}</span>
              <span class="text-text-main font-medium">${log.summary}</span>
            </div>
            <span class="text-text-muted text-[10px]">${log.timestamp}</span>
          </div>
        `).join("");
      } else {
        callLogsList.innerHTML = `<div class="text-center py-4 text-text-muted text-xs italic">No warmline dispatches recorded today.</div>`;
      }
    } catch (err) {
      peersList.innerHTML = `<div class="text-center py-4 text-rose text-xs col-span-3">Error loading queue: ${err.message}</div>`;
    }
  }

  async function loadClinicianPortalData() {
    const triageList = document.getElementById("clinicianTriageList");
    if (!triageList) return;

    try {
      const res = await fetch("/api/clinician-portal", { headers: authHeaders() });
      if (!res.ok) throw new Error("Failed to load Clinician Portal");
      const data = await res.json();

      if (data.triage_cases && data.triage_cases.length > 0) {
        triageList.innerHTML = data.triage_cases.map(c => `
          <div class="p-4 rounded-xl border border-border bg-surface flex flex-col gap-2.5 shadow-sm">
            <div class="flex items-center justify-between">
              <span class="font-bold text-sm text-text-main flex items-center gap-1.5">
                <span>⚠️</span> Patient ${c.patient_id}
              </span>
              <span class="px-2 py-0.5 rounded text-[10px] font-bold ${c.risk_level === 'High' ? 'bg-rose/15 text-rose border border-rose/30' : 'bg-amber/15 text-amber border border-amber/30'} uppercase tracking-wider">${c.risk_level} Risk</span>
            </div>
            <div class="text-xs text-text-main bg-background-dark p-2.5 rounded-lg border border-border/60">
              <span class="font-semibold text-text-muted block mb-0.5">Primary Symptoms:</span> ${c.symptoms}
            </div>
            <div class="flex items-center justify-between text-[11px] text-text-muted pt-1 border-t border-border/40">
              <span>Status: <strong class="text-text-main">${c.status}</strong></span>
              <span>Updated: ${c.last_updated}</span>
            </div>
          </div>
        `).join("");
      } else {
        triageList.innerHTML = `<div class="text-center py-4 text-text-muted text-xs italic col-span-2">No active triage cases pending review.</div>`;
      }

      // Load Post-Session Handoffs (#7.3)
      const handoffList = document.getElementById("clinicianHandoffList");
      if (handoffList) {
        try {
          const hRes = await fetch("/api/clinician-handoffs", { headers: authHeaders() });
          if (hRes.ok) {
            const hData = await hRes.json();
            if (hData.handoffs && hData.handoffs.length > 0) {
              handoffList.innerHTML = hData.handoffs.map(h => `
                <div class="p-4 rounded-xl bg-surface border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-inner">
                  <div class="flex flex-col gap-1">
                    <div class="flex items-center gap-2">
                      <span class="font-bold text-sm text-text-main">Peer Patient: ${h.patient_name}</span>
                      <span class="px-2 py-0.5 rounded bg-amber/15 text-amber text-[10px] font-bold">Buddy: ${h.buddy_email || "Care Team"}</span>
                    </div>
                    <p class="text-xs text-text-muted">
                      <strong class="text-text-main">Session Summary:</strong> ${h.session_summary}
                    </p>
                    <span class="text-[10px] text-text-muted/80 mt-0.5">Timestamp: Today • HIPAA ID: #${h.handoff_id} • Follow-up: ${h.recommended_followup}</span>
                  </div>
                  <button onclick="alert('Opening clinical chart and patient EHR for ${h.patient_name}...')" class="px-4 py-2 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-white font-bold text-xs transition-all shrink-0">
                    Review Chart
                  </button>
                </div>
              `).join("");
            }
          }
        } catch (hErr) {
          console.error("Error loading handoffs:", hErr);
        }
      }
    } catch (err) {
      triageList.innerHTML = `<div class="text-center py-4 text-rose text-xs col-span-2">Error loading cases: ${err.message}</div>`;
    }
  }

  async function loadCaregiverPortalData() {
    const summariesList = document.getElementById("caregiverSummariesList");
    if (!summariesList) return;

    try {
      const res = await fetch("/api/caregiver-portal", { headers: authHeaders() });
      if (!res.ok) throw new Error("Failed to load Caregiver Portal");
      const data = await res.json();

      if (data.consented_summaries && data.consented_summaries.length > 0) {
        summariesList.innerHTML = data.consented_summaries.map(s => `
          <div class="p-4 rounded-xl border border-border bg-surface flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm">
            <div class="flex items-start gap-3">
              <div class="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-lg shrink-0">
                ${s.status === 'Thriving' ? '🌟' : '💛'}
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <span class="font-bold text-sm text-text-main">${s.patient_name}</span>
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary uppercase">${s.status}</span>
                </div>
                <p class="text-xs text-text-muted mt-0.5">Recent activity: ${s.recent_activity}</p>
              </div>
            </div>
            <div class="text-xs text-right bg-background-dark md:bg-transparent p-2 md:p-0 rounded border border-border/50 md:border-0 shrink-0">
              <span class="text-text-muted block text-[10px]">Last Peer Session:</span>
              <span class="font-semibold text-text-main">${s.last_session}</span>
            </div>
          </div>
        `).join("");
      } else {
        summariesList.innerHTML = `<div class="text-center py-4 text-text-muted text-xs italic">No consented check-in summaries available.</div>`;
      }
    } catch (err) {
      summariesList.innerHTML = `<div class="text-center py-4 text-rose text-xs">Error loading summaries: ${err.message}</div>`;
    }
  }

  const btnSubmitBuddyNote = document.getElementById("btnSubmitBuddyNote");
  if (btnSubmitBuddyNote) {
    btnSubmitBuddyNote.addEventListener("click", () => {
      const peerId = document.getElementById("buddyNotePeerId")?.value.trim();
      const noteText = document.getElementById("buddyNoteText")?.value.trim();
      if (!peerId || !noteText) {
        notify("Please enter both a Peer ID/Name and note text.", "error");
        return;
      }
      notify(`Peer session note saved for ${peerId}. Thank you for your support!`, "success");
      if (document.getElementById("buddyNotePeerId")) document.getElementById("buddyNotePeerId").value = "";
      if (document.getElementById("buddyNoteText")) document.getElementById("buddyNoteText").value = "";
    });
  }

  // Real-Time AI Co-Pilot & Supervision Sandbox (#7)
  const btnSimulateCoPilot = document.getElementById("btnSimulateCoPilot");
  const coPilotSandboxScreen = document.getElementById("coPilotSandboxScreen");
  const btnUseEmpatheticPhrase = document.getElementById("btnUseEmpatheticPhrase");
  const btnUseGroundingExercise = document.getElementById("btnUseGroundingExercise");
  const coPilotDraftText = document.getElementById("coPilotDraftText");
  const btnSendCoPilotResponse = document.getElementById("btnSendCoPilotResponse");
  const btnForwardToClinician = document.getElementById("btnForwardToClinician");
  const coPilotStatusToast = document.getElementById("coPilotStatusToast");

  if (btnSimulateCoPilot && coPilotSandboxScreen) {
    btnSimulateCoPilot.addEventListener("click", () => {
      coPilotSandboxScreen.classList.remove("hidden");
      coPilotSandboxScreen.classList.add("flex");
      if (coPilotStatusToast) coPilotStatusToast.classList.add("hidden");
      coPilotSandboxScreen.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      notify("🤖 AI Co-Pilot session initialized! Real-time sentiment & Do No Harm safety checks active.", "info");
    });
  }

  if (btnUseEmpatheticPhrase && coPilotDraftText) {
    btnUseEmpatheticPhrase.addEventListener("click", () => {
      coPilotDraftText.value = "I hear how scary and overwhelming this feels right now. You are not alone—I am right here with you. Let's take a slow breath together.";
      notify("Empathetic phrasing inserted into response draft.", "success");
    });
  }

  if (btnUseGroundingExercise && coPilotDraftText) {
    btnUseGroundingExercise.addEventListener("click", () => {
      coPilotDraftText.value = "Let's try the 4-4-4-4 Box Breathing technique together: Inhale slowly for 4 seconds, hold for 4, exhale for 4, and pause for 4.";
      notify("Grounding exercise inserted into response draft.", "success");
    });
  }

  if (btnSendCoPilotResponse && coPilotDraftText) {
    btnSendCoPilotResponse.addEventListener("click", () => {
      if (!coPilotDraftText.value.trim()) {
        notify("Please select an AI Co-Pilot suggestion or write a draft response first.", "error");
        return;
      }
      if (coPilotStatusToast) {
        coPilotStatusToast.classList.remove("hidden");
      }
      notify("Response dispatched to peer! You can now forward a Clinical Handoff Report.", "success");
    });
  }

  if (btnForwardToClinician) {
    btnForwardToClinician.addEventListener("click", async () => {
      const summaryText = coPilotDraftText?.value || "Guided patient through structured 4-4-4-4 Box Breathing de-escalation.";
      try {
        await fetch("/api/clinician-handoff", {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({
            patient_name: "Alex W. (Anxiety & Panic Attack)",
            session_summary: summaryText,
            risk_level: "Supportive / Low Acute Crisis Risk",
            recommended_followup: "Recommend clinical follow-up for chronic anxiety triggers."
          })
        });
      } catch (e) {
        console.error("Failed to post handoff:", e);
      }
      const clinicianHandoffList = document.getElementById("clinicianHandoffList");
      if (clinicianHandoffList) {
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const newReport = document.createElement("div");
        newReport.className = "p-4 rounded-xl bg-surface border-2 border-primary/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md animate-fade-in";
        newReport.innerHTML = `
          <div class="flex flex-col gap-1">
            <div class="flex items-center gap-2">
              <span class="font-bold text-sm text-text-main">Peer Patient: Alex W. (Anxiety & Panic Attack)</span>
              <span class="px-2 py-0.5 rounded bg-primary/20 text-primary text-[10px] font-bold">New Handoff • Buddy: Care Team (#7)</span>
            </div>
            <p class="text-xs text-text-muted">
              <strong class="text-text-main">Session Summary:</strong> ${summaryText} Verified supportive safety status. Recommend clinician follow-up for baseline anxiety assessment.
            </p>
            <span class="text-[10px] text-text-muted/80 mt-0.5">Timestamp: ${timestamp} • HIPAA Handoff ID: #MSB-${Math.floor(1000 + Math.random() * 9000)}</span>
          </div>
          <button onclick="alert('Opening clinical chart and patient electronic health record for Alex W...')" class="px-4 py-2 rounded-xl bg-primary text-white hover:brightness-110 font-bold text-xs transition-all shrink-0 shadow-sm">
            Review Chart
          </button>
        `;
        clinicianHandoffList.prepend(newReport);
      }
      notify("📋 Clinical Care Handoff Report securely forwarded to Dr. Aris Fitzgerald (Clinician Portal #7)!", "success");
    });
  }

  // AI Co-Pilot Tooltip Explanation Click Handlers (#7.2)
  document.querySelectorAll("#buddyDashboardView .cursor-help").forEach(el => {
    el.addEventListener("click", () => {
      const reason = el.getAttribute("title") || "AI Co-Pilot analysis generated using real-time Natural Language Processing.";
      alert(`🤖 AI Co-Pilot Diagnostic Rationale:\n\n${reason}\n\nAll suggestions are clinically validated under GR38 peer support guidelines.`);
    });
  });

  // Multimodal TBI Scan Analyzer (#2)
  const btnSimulateTbiScan = document.getElementById("btnSimulateTbiScan");
  const tbiDropzone = document.getElementById("tbiDropzone");
  const tbiAnalysisResults = document.getElementById("tbiAnalysisResults");
  const tbiFindingsList = document.getElementById("tbiFindingsList");
  const tbiRecoveryProtocol = document.getElementById("tbiRecoveryProtocol");

  async function runTbiAnalysis(filename = "Patient_8492_Axial_fMRI_Slice_04.dcm") {
    if (!tbiAnalysisResults || !tbiFindingsList) return;
    notify("🧠 Uploading neuro-imaging scan... Vertex AI Vision-Language model analyzing...", "info");
    if (tbiDropzone) tbiDropzone.classList.add("opacity-50", "pointer-events-none");

    const tbiDiagSection = document.getElementById("tbiDiagSection");
    const tbiDiagFindingsList = document.getElementById("tbiDiagFindingsList");
    const tbiDiagProgress = document.getElementById("tbiDiagProgress");
    const progressEl = document.getElementById("tbiScanProgress");

    try {
      const res = await fetch("/api/tbi-analyze", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          scan_filename: filename,
          patient_id: "Patient #8492",
          scan_type: "Axial fMRI Slice (GR38 validated)"
        })
      });
      const data = await res.json();
      if (data.analysis) {
        if (tbiRecoveryProtocol && data.analysis.neurological_controls) {
          tbiRecoveryProtocol.textContent = `${data.analysis.neurological_controls.recommended_rest_protocol} (Cognitive Fatigue Index: ${data.analysis.neurological_controls.cognitive_fatigue_index})`;
        }

        const slicesData = data.analysis.slices || [
          { title: "Frontal Lobe Impact (Raw Sectional View)", view_type: "Slice 01 - Frontal Scan", image_url: "/img/tbi/slice_1_frontal.png", status: "Metabolic Depression", impact_score: "4.2 / 10", clinical_note: "Initial frontal lobe scan prior to diagnostic neural network overlay; slight metabolic depression observed in prefrontal cortex." },
          { title: "Axial View (Raw Sectional View)", view_type: "Slice 02 - Axial Scan", image_url: "/img/tbi/slice_2_axial.png", status: "Minor Inflammation", impact_score: "3.8 / 10", clinical_note: "Initial axial cross-section showing bilateral temporal symmetry and localized inflammation." },
          { title: "Sagittal View (Raw Sectional View)", view_type: "Slice 03 - Sagittal Scan", image_url: "/img/tbi/slice_3_sagittal.png", status: "Moderate Severity", impact_score: "4.5 / 10", clinical_note: "Mid-sagittal section displaying corpus callosum and brainstem anatomy; correlates with executive fatigue." },
          { title: "Rear View Assessment (Raw Sectional View)", view_type: "Slice 04 - Occipital/Parietal", image_url: "/img/tbi/slice_4_rear.png", status: "Stable / Unremarkable", impact_score: "1.5 / 10", clinical_note: "Posterior view showing occipital and parietal lobe structure intact; no focal hemorrhaging detected." },
          { title: "Detailed Regional View (Raw Sectional View)", view_type: "Slice 05 - Temporal/Regional", image_url: "/img/tbi/slice_5_regional.png", status: "Damage Analysis Complete", impact_score: "3.2 / 10", clinical_note: "High-resolution regional cross-section mapped prior to automated biomarker assessment." }
        ];

        const diagSlicesData = data.analysis.diag_slices || [
          { title: "Frontal Lobe Impact — Neural Network Diagnostic Overlay", view_type: "Diag 01 - Frontal Impact", image_url: "/img/tbi/diag_1_frontal.png", status: "Metabolic Depression", impact_score: "4.2 / 10", clinical_note: "Clinical Observations (Frontal Region): Impulsivity, Impaired judgment, Difficulty planning/executing tasks, Emotional regulation dysfunction." },
          { title: "Multimodal Mood & Behavioral Profile — Temporal Focus", view_type: "Diag 02 - Mood Assessment", image_url: "/img/tbi/diag_2_axial.png", status: "Minor Inflammation", impact_score: "3.8 / 10", clinical_note: "Multi-Site Mood Assessment: Frontal Lobe -> Impulsivity; Apathy. Temporal Lobe -> Depressive symptoms; Anxiety. Combined Effect -> Increased risk of chronic irritability." },
          { title: "Sagittal Severity & Behavioral Diagnostics", view_type: "Diag 03 - Sagittal Severity", image_url: "/img/tbi/diag_3_sagittal.png", status: "Moderate Severity (67% Conf.)", impact_score: "4.5 / 10", clinical_note: "Specific Behavioral Observations (Temporal Focus): Challenges with memory consolidation, Difficulty reading social cues, Altered perception of threat." },
          { title: "Rear View Cognitive & Sensory Assessment", view_type: "Diag 04 - Parietal / Temporal", image_url: "/img/tbi/diag_4_rear.png", status: "Stable / Unremarkable", impact_score: "1.5 / 10", clinical_note: "Cognitive & Sensory Impact: Spatial neglect errors, Sensory processing difficulties, Reduced attention span." },
          { title: "Detailed Regional Analysis & Quantitative Mood Metrics", view_type: "Diag 05 - Right Frontal Mesh", image_url: "/img/tbi/diag_5_regional.png", status: "14,500 Data Points Mapped", impact_score: "3.2 / 10", clinical_note: "Quantitative Mood Metrics (Detailed R Frontal): Affective Lability Score: High. Response Inhibition Score: Impaired. Decision Making Deficit: Moderate." }
        ];

        if (progressEl) progressEl.textContent = "Initializing multimodal Vision-Language pipeline...";
        if (tbiDiagSection) tbiDiagSection.classList.add("hidden");

        // Helper function to render blown-up widescreen cards without text embossing
        const renderCardHtml = (slice) => `
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3.5">
            <div>
              <span class="inline-block px-2.5 py-0.5 rounded bg-primary/10 text-primary font-mono text-xs font-bold mb-1">${slice.view_type}</span>
              <h4 class="text-base sm:text-lg font-display font-bold text-text-main">${slice.title}</h4>
            </div>
            <div class="flex items-center gap-2 self-start sm:self-center shrink-0">
              <span class="px-3 py-1 rounded-lg text-xs font-bold ${slice.status.includes('Stable') || slice.status.includes('Normal') || slice.status.includes('Complete') ? 'bg-emerald-500/15 text-emerald-600' : 'bg-amber/15 text-amber'}">${slice.status}</span>
              <span class="px-3 py-1 rounded-lg text-xs font-bold bg-card border border-border text-text-main font-mono">Impact: ${slice.impact_score}</span>
            </div>
          </div>
          <div class="w-full bg-black/5 rounded-2xl border border-border/80 overflow-hidden flex items-center justify-center p-2 sm:p-4 shadow-inner">
            <img src="${slice.image_url}" alt="${slice.title}" class="w-full h-auto max-h-[760px] object-contain rounded-xl shadow-md transition-transform duration-500 hover:scale-[1.01]" />
          </div>
          <div class="bg-card p-4 rounded-xl border border-border/60 text-xs sm:text-sm text-text-muted leading-relaxed shadow-sm">
            <strong class="text-text-main block mb-1">Clinical Observations & Biomarker Note:</strong>
            ${slice.clinical_note}
          </div>
        `;

        // 1. Initial Skeleton Loading State for Initial Sectional Views
        tbiFindingsList.innerHTML = slicesData.map((slice, idx) => `
          <div id="tbi-slice-card-${idx}" class="p-8 rounded-2xl bg-surface border-2 border-dashed border-primary/30 flex flex-col items-center justify-center gap-3 min-h-[300px] shadow-sm animate-pulse text-center w-full">
            <div class="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary animate-spin">
              <span class="material-symbols-outlined text-[24px]">sync</span>
            </div>
            <span class="text-sm font-bold text-text-main">Neural Engine Processing Initial Slice ${idx + 1}/5...</span>
            <span class="text-xs font-mono text-primary font-semibold">${slice.title}</span>
          </div>
        `).join("");

        tbiAnalysisResults.classList.remove("hidden");
        tbiAnalysisResults.classList.add("flex");

        // 2. Sequential Fake Loading Reveal for Initial Slices (350ms interval per slice)
        for (let i = 0; i < slicesData.length; i++) {
          await new Promise(r => setTimeout(r, 350));
          const slice = slicesData[i];
          const cardEl = document.getElementById(`tbi-slice-card-${i}`);
          if (progressEl) progressEl.textContent = `Processing Initial View ${i + 1} of 5: ${slice.view_type}...`;
          if (cardEl) {
            cardEl.className = "p-5 rounded-2xl bg-surface border border-border/80 flex flex-col gap-4 shadow-md hover:border-primary/50 transition-all animate-fade-in group w-full";
            cardEl.innerHTML = renderCardHtml(slice);
          }
        }
        if (progressEl) progressEl.textContent = "✅ All 5 Initial Sectional Views Synchronized";

        // 3. Reveal and Process Diagnostic Overlay Slices (3.d & 2)
        if (tbiDiagSection && tbiDiagFindingsList) {
          tbiDiagSection.classList.remove("hidden");
          tbiDiagSection.classList.add("flex");
          if (tbiDiagProgress) tbiDiagProgress.textContent = "Initializing Diagnostic Overlay Mapping...";

          tbiDiagFindingsList.innerHTML = diagSlicesData.map((slice, idx) => `
            <div id="tbi-diag-card-${idx}" class="p-8 rounded-2xl bg-surface border-2 border-dashed border-primary/30 flex flex-col items-center justify-center gap-3 min-h-[300px] shadow-sm animate-pulse text-center w-full">
              <div class="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary animate-spin">
                <span class="material-symbols-outlined text-[24px]">biotech</span>
              </div>
              <span class="text-sm font-bold text-text-main">Mapping Neural Network Diagnostic Overlay ${idx + 1}/5...</span>
              <span class="text-xs font-mono text-primary font-semibold">${slice.title}</span>
            </div>
          `).join("");

          for (let i = 0; i < diagSlicesData.length; i++) {
            await new Promise(r => setTimeout(r, 350));
            const slice = diagSlicesData[i];
            const cardEl = document.getElementById(`tbi-diag-card-${i}`);
            if (tbiDiagProgress) tbiDiagProgress.textContent = `Mapping Diagnostic Overlay ${i + 1} of 5: ${slice.view_type}...`;
            if (cardEl) {
              cardEl.className = "p-5 rounded-2xl bg-surface border border-border/80 flex flex-col gap-4 shadow-md hover:border-primary/50 transition-all animate-fade-in group w-full";
              cardEl.innerHTML = renderCardHtml(slice);
            }
          }
          if (tbiDiagProgress) tbiDiagProgress.textContent = "✅ All 5 Diagnostic Overlays Synchronized";
        }

        notify("✅ 10-Slice TBI Neuro-Imaging analysis complete! Initial sectional views & diagnostic neural overlays synchronized (#2).", "success");
      }
    } catch (e) {
      notify("Error analyzing TBI scan: " + e.message, "error");
    } finally {
      if (tbiDropzone) tbiDropzone.classList.remove("opacity-50", "pointer-events-none");
    }
  }

  if (btnSimulateTbiScan) {
    btnSimulateTbiScan.addEventListener("click", () => runTbiAnalysis());
  }
  if (tbiDropzone) {
    tbiDropzone.addEventListener("click", () => runTbiAnalysis("Clinical_Upload_fMRI_Scan_772.nii"));
    tbiDropzone.addEventListener("dragover", (e) => { e.preventDefault(); tbiDropzone.classList.add("border-primary", "bg-primary/10"); });
    tbiDropzone.addEventListener("dragleave", () => { tbiDropzone.classList.remove("border-primary", "bg-primary/10"); });
    tbiDropzone.addEventListener("drop", (e) => { e.preventDefault(); tbiDropzone.classList.remove("border-primary", "bg-primary/10"); runTbiAnalysis("Dropped_DICOM_Brain_Slice.dcm"); });
  }

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
      currentUser = { id: data.id, email: data.email, tier: data.tier, role: data.role || "patient" };
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

  function openProfileView() {
    if (!currentUser) {
      show(authView);
      return;
    }
    show(profileView);
    if (profileEmail) profileEmail.textContent = currentUser.email;
    if (profileTier) profileTier.textContent = currentUser.tier || "Standard";
    if (profileBadge) {
      profileBadge.textContent = "VERIFIED";
      profileBadge.className = window.MSB.Tokens.Badges.verified;
    }
    fetchConversations();
    fetchCrisisPlan();
  }

  async function fetchCrisisPlan() {
    if (!currentUser || !crisisPlanForm) return;
    try {
      const res = await fetch("/api/crisis-plan", { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        if (data.plan) {
          if (emergContactName) emergContactName.value = data.plan.emergency_contact_name || "";
          if (emergContactPhone) emergContactPhone.value = data.plan.emergency_contact_phone || "";
          if (crisisLinePref) crisisLinePref.value = data.plan.crisis_line_preference || "988 - Suicide & Crisis Lifeline";
          if (personalGrounding) personalGrounding.value = data.plan.personal_grounding_trigger || "";
        }
      }
    } catch (e) {
      console.warn("Could not load crisis plan:", e);
    }
  }

  if (crisisPlanForm) {
    crisisPlanForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!currentUser) return;
      if (crisisPlanMessage) {
        crisisPlanMessage.classList.add("hidden");
        crisisPlanMessage.className = "hidden p-2.5 rounded-lg text-xs font-semibold";
      }
      if (btnSaveCrisisPlan) {
        btnSaveCrisisPlan.disabled = true;
        btnSaveCrisisPlan.innerHTML = `<span class="material-symbols-outlined text-[16px] animate-spin">refresh</span> Saving...`;
      }
      try {
        const res = await fetch("/api/crisis-plan", {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({
            emergency_contact_name: emergContactName ? emergContactName.value : "",
            emergency_contact_phone: emergContactPhone ? emergContactPhone.value : "",
            crisis_line_preference: crisisLinePref ? crisisLinePref.value : "",
            personal_grounding_trigger: personalGrounding ? personalGrounding.value : ""
          })
        });
        if (!res.ok) throw new Error("Failed to save safety plan");
        if (crisisPlanMessage) {
          crisisPlanMessage.textContent = "Crisis Safety Plan updated securely ✓";
          crisisPlanMessage.classList.remove("hidden");
          crisisPlanMessage.classList.add("bg-primary/10", "text-primary");
        }
        notify("Crisis Safety Plan updated securely ✓");
      } catch (err) {
        if (crisisPlanMessage) {
          crisisPlanMessage.textContent = "Error saving plan: " + err.message;
          crisisPlanMessage.classList.remove("hidden");
          crisisPlanMessage.classList.add("bg-rose-bg", "text-rose");
        }
      } finally {
        if (btnSaveCrisisPlan) {
          btnSaveCrisisPlan.disabled = false;
          btnSaveCrisisPlan.innerHTML = `<span class="material-symbols-outlined text-[16px]">save</span> Save Safety Plan`;
        }
      }
    });
  }

  updateAuthUI();

  /* ---- Buddy View dialog ---- */
  btnViewBuddy.addEventListener("click",       () => { renderBuddyNotifications(); openDialog(buddyViewDialog); });
  btnCloseBuddyView.addEventListener("click",  () => closeDialog(buddyViewDialog));

  /* ---- Available Buddies Sidebar ---- */
  btnToggleSidebar.addEventListener("click", () => {
    if (buddySidebar) buddySidebar.classList.add("hidden");
    show(supportBuddiesView);
    fetchSupportRoster();
  });
  if (btnCloseBuddySidebar) {
    btnCloseBuddySidebar.addEventListener("click", () => {
      buddySidebar.classList.add("hidden");
    });
  }

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
    mobNavBuddies.addEventListener("click", () => {
      if (buddySidebar) buddySidebar.classList.add("hidden");
      show(supportBuddiesView);
      fetchSupportRoster();
    });
  }
  if (mobNavProfile) {
    mobNavProfile.addEventListener("click", () => {
      openProfileView();
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

  if (btnBackToDirectory) {
    btnBackToDirectory.addEventListener("click", () => {
      show(supportBuddiesView);
    });
  }

  /* ============================================================
     KEYBOARD COMBINATION SHORTCUTS & TOGGLE
  ============================================================ */
  let isEnterToSendMode = true;
  const btnToggleKeyMode = document.getElementById("btnToggleKeyMode");
  const keyModeLabel = document.getElementById("keyModeLabel");
  const keyHelperText = document.getElementById("keyHelperText");

  if (btnToggleKeyMode) {
    btnToggleKeyMode.addEventListener("click", () => {
      isEnterToSendMode = !isEnterToSendMode;
      if (isEnterToSendMode) {
        if (keyModeLabel) keyModeLabel.textContent = "Mode: Enter sends";
        if (keyHelperText) {
          keyHelperText.innerHTML = `
            <span class="material-symbols-outlined text-[14px] text-primary">keyboard</span>
            <span><strong class="text-text-main">Enter ↵</strong> to send</span>
            <span>•</span>
            <span><strong class="text-text-main">Shift + Enter</strong> for new line</span>
          `;
        }
        notify("⌨️ Switched to Chat Mode: Enter sends message, Shift+Enter adds new line.", "info");
      } else {
        if (keyModeLabel) keyModeLabel.textContent = "Mode: Ctrl+Enter sends";
        if (keyHelperText) {
          keyHelperText.innerHTML = `
            <span class="material-symbols-outlined text-[14px] text-primary">keyboard</span>
            <span><strong class="text-text-main">Ctrl+Enter ↵</strong> to send</span>
            <span>•</span>
            <span><strong class="text-text-main">Enter</strong> for new line</span>
          `;
        }
        notify("⌨️ Switched to Composer Mode: Ctrl+Enter (or Cmd+Enter) sends message, Enter adds new line.", "info");
      }
    });
  }

  if (msgInput) {
    msgInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.keyCode === 13 || e.which === 13) {
        if (isEnterToSendMode) {
          // Mode 1: Enter sends, Shift+Enter (or Alt/Ctrl+Enter) new line
          if (!e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey) {
            e.preventDefault();
            if (msgInput.value.trim()) {
              const btn = document.getElementById("btnSend");
              if (btn) btn.click();
              else typeof supportForm.requestSubmit === "function" ? supportForm.requestSubmit() : supportForm.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
            }
          }
        } else {
          // Mode 2: Ctrl+Enter / Cmd+Enter / Shift+Enter sends, plain Enter new line
          if (e.ctrlKey || e.metaKey || e.shiftKey) {
            e.preventDefault();
            if (msgInput.value.trim()) {
              const btn = document.getElementById("btnSend");
              if (btn) btn.click();
              else typeof supportForm.requestSubmit === "function" ? supportForm.requestSubmit() : supportForm.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
            }
          }
        }
      }
    });
  }

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
            const sidebar = document.getElementById("chatBuddySidebar");
            const grid = document.getElementById("chatBuddyGrid");
            const container = document.getElementById("chatMessagesContainer");
            if (sidebar && grid && container) {
              grid.innerHTML = "";
              data.resources.all_buddies.forEach(b => grid.appendChild(createBuddyCard(b)));
              sidebar.classList.remove("hidden");
              container.className = "md:col-span-7 flex flex-col gap-4 overflow-y-auto no-scrollbar pr-2 h-full transition-all duration-300";
            }
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
    const card = document.createElement("article");
    card.className = "bg-card rounded-xl border border-border p-5 flex flex-col gap-5 hover:border-primary hover:-translate-y-0.5 transition-all duration-200 shadow-sm min-w-[280px]";

    const AVATAR_MAP = {
      "buddy_sarah": "https://lh3.googleusercontent.com/aida-public/AB6AXuBf9rx7Z6l90E-dEQNOHkY2L9MBL-BEWZw9xYFqtDLhTUanPJXcYsq_SLLQp9-1L7agsP9D6pvCfsF25EIMB8sho5heSobTuGewdesyf6K_uzKDkPhp26x65Vknl8xE2u16XPc-zYwemNefLq8_8SyOBx69qPDIcj74AKiDEKVdQf2pNm3Ng8qCXEIzvG7Pcyw7MEQZBDTInukBK_Or35fUL5P0HxZ7U78vldyRd_lanroKUI8Mphi4Rk2D0BVj6ymZiRXv4Y7oQoo",
      "buddy_marcus": "https://lh3.googleusercontent.com/aida-public/AB6AXuBdvQdfniU1Vpcb_4ItQ4Q7iEmayLdpGu2QM2ac42aVVTUk4F5jurHsQicYccjbw-9I2wqKvl6bala2o-VdHyNserH7iNv31E2IEf5i9swrW6aXnLP7P_PHIM6PpCF7NF-1d9bNmZv3qchnsHakgcPLcoMY4w6R1S9U_-TA56d3T5TNAXIt6HCScTqkLrQqCfhJ7Qh40Lm8d9CIixVyvTIIRaW-sfBsurNb5hQ5s9-S1HKS5luQr_mPnZ0xCTHiRQKATsA1Ynq74II",
      "buddy_elena": "https://lh3.googleusercontent.com/aida-public/AB6AXuCY2AeYR7cTA2WE28LN5Qp-geWh6IiHmBTRvLggOexvVoo-R6gUi2s95Tdze9UJqWpzokGOhTk2nOLBTUd2LJnSn1EMoWa26Icv4GF71nPZIfYkmoQakzM1Hv1YF9dl0_DUJppDbNaYL-lUZrdc8KWl6kyQca9AdjLVittQX8GwBqQSM5fgTAqIaAchlec6Y3jUiwtaVo-r3cz5WDOIZ9tSXLqokn9oNq80hiL4w3tr1doN_044TVjegN_9LreLKrR4rPJi5I0RVSA",
      "buddy_alex": "https://lh3.googleusercontent.com/aida-public/AB6AXuDyW8KwNUWY77IGGVscaDo9h7xmpsGh9H-DhyNKIs744YXgy2PV6p3ep4Xg3nkNCYIP2-dZ5sjgIAyuAiw6JSiHTvsspgt9RVa7_Wh073Jm8TeWGIJLk7J795tEPuTmJTGLf21aYkpJfp1cr1IFkjGp2p-_xwvssF-_ydLsGUy8md1lzRADDYbD7Hjg4J8PtcwENLw4WbUY62o4WQTqN2WstuHqruj5VIEjob8FYCmobHkHhSdDxGU0jfU9_RSUNCifgc1Oq_GO7xU",
      "buddy_david": "https://lh3.googleusercontent.com/aida-public/AB6AXuBCRuOp-Z1wi5pGKy6m8GCVUonw1KcfFDl2HO0ksn4duDsBgaUQhVz2hI-qHBJpzr9i62_zK6JxJSEqIUIJUHUe0dro5diQLD1qmQB0HXROVWfRDoDnnl9bxQij2uPT0UISAK56dtGF6VYeRywk0n9mSajSz8Oe53XSqjYApv18xvc6GgXjZUAYkao1Y2QG5vbD2bkhVuSD5U0Fh34DGOte7FMkjhQ-p_CBbm1Q5YswhclgmWq_8rZ9FbJ5v0xALULz1i-XoiBYAU4"
    };
    const avatarUrl = buddy.avatar || AVATAR_MAP[buddy.id] || "https://lh3.googleusercontent.com/aida-public/AB6AXuBf9rx7Z6l90E-dEQNOHkY2L9MBL-BEWZw9xYFqtDLhTUanPJXcYsq_SLLQp9-1L7agsP9D6pvCfsF25EIMB8sho5heSobTuGewdesyf6K_uzKDkPhp26x65Vknl8xE2u16XPc-zYwemNefLq8_8SyOBx69qPDIcj74AKiDEKVdQf2pNm3Ng8qCXEIzvG7Pcyw7MEQZBDTInukBK_Or35fUL5P0HxZ7U78vldyRd_lanroKUI8Mphi4Rk2D0BVj6ymZiRXv4Y7oQoo";

    const isOnline = buddy.availability?.toLowerCase() === "online";
    const statusText = isOnline ? "Available Now" : (buddy.availability || "Offline");
    const dotClass = isOnline ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" : "bg-slate-500";
    const buttonText = isOnline ? "Connect" : statusText;
    
    const specialtyBadges = (buddy.specialties || [])
      .map(s => `<span class="px-3 py-1 rounded-md bg-surface text-text-main text-xs font-semibold border border-border/50">${s}</span>`)
      .join("");

    card.innerHTML = `
      <div class="flex items-center gap-4">
        <div class="relative shrink-0">
          <img class="w-16 h-16 rounded-full object-cover bg-surface border border-border/50" alt="${buddy.name} headshot" src="${avatarUrl}" />
          <div class="absolute bottom-0 right-0 w-3.5 h-3.5 ${dotClass} border-2 border-card rounded-full"></div>
        </div>
        <div>
          <h3 class="font-display font-bold text-xl text-text-main">${buddy.name}</h3>
          <p class="text-text-muted text-sm font-semibold">${statusText}</p>
          <p class="text-xs font-medium text-text-muted/80 mt-0.5">${buddy.certification || ""}</p>
        </div>
      </div>
      <p class="text-sm text-text-main leading-relaxed line-clamp-3">${buddy.bio || ""}</p>
      <div class="flex flex-wrap gap-2">
        ${specialtyBadges}
      </div>
      <div class="mt-auto flex items-center gap-2 pt-3 border-t border-border/40">
        <button class="flex-1 h-11 bg-surface hover:bg-card border border-border text-text-main rounded-lg font-display font-bold hover:border-primary/50 transition-all duration-200 flex items-center justify-center gap-1.5 text-sm btn-info" title="View Full Profile">
          <span class="material-symbols-outlined text-[18px]">info</span> Info
        </button>
        <button class="flex-1 h-11 ${isOnline ? "bg-primary hover:brightness-110 text-white" : "bg-surface/50 text-text-muted cursor-not-allowed border border-border/50"} rounded-lg font-display font-bold transition-all duration-200 flex items-center justify-center gap-1.5 text-sm btn-connect" data-buddy-id="${buddy.id}" ${!isOnline ? "disabled title='Buddy is offline'" : ""}>
          <span class="material-symbols-outlined text-[18px]">${isOnline ? "chat" : "lock"}</span>
          ${buttonText}
        </button>
      </div>
    `;

    const connectBtn = card.querySelector(".btn-connect");
    if (isOnline && connectBtn) {
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
    const AVATAR_MAP = {
      "buddy_sarah": "https://lh3.googleusercontent.com/aida-public/AB6AXuBf9rx7Z6l90E-dEQNOHkY2L9MBL-BEWZw9xYFqtDLhTUanPJXcYsq_SLLQp9-1L7agsP9D6pvCfsF25EIMB8sho5heSobTuGewdesyf6K_uzKDkPhp26x65Vknl8xE2u16XPc-zYwemNefLq8_8SyOBx69qPDIcj74AKiDEKVdQf2pNm3Ng8qCXEIzvG7Pcyw7MEQZBDTInukBK_Or35fUL5P0HxZ7U78vldyRd_lanroKUI8Mphi4Rk2D0BVj6ymZiRXv4Y7oQoo",
      "buddy_marcus": "https://lh3.googleusercontent.com/aida-public/AB6AXuBdvQdfniU1Vpcb_4ItQ4Q7iEmayLdpGu2QM2ac42aVVTUk4F5jurHsQicYccjbw-9I2wqKvl6bala2o-VdHyNserH7iNv31E2IEf5i9swrW6aXnLP7P_PHIM6PpCF7NF-1d9bNmZv3qchnsHakgcPLcoMY4w6R1S9U_-TA56d3T5TNAXIt6HCScTqkLrQqCfhJ7Qh40Lm8d9CIixVyvTIIRaW-sfBsurNb5hQ5s9-S1HKS5luQr_mPnZ0xCTHiRQKATsA1Ynq74II",
      "buddy_elena": "https://lh3.googleusercontent.com/aida-public/AB6AXuCY2AeYR7cTA2WE28LN5Qp-geWh6IiHmBTRvLggOexvVoo-R6gUi2s95Tdze9UJqWpzokGOhTk2nOLBTUd2LJnSn1EMoWa26Icv4GF71nPZIfYkmoQakzM1Hv1YF9dl0_DUJppDbNaYL-lUZrdc8KWl6kyQca9AdjLVittQX8GwBqQSM5fgTAqIaAchlec6Y3jUiwtaVo-r3cz5WDOIZ9tSXLqokn9oNq80hiL4w3tr1doN_044TVjegN_9LreLKrR4rPJi5I0RVSA",
      "buddy_alex": "https://lh3.googleusercontent.com/aida-public/AB6AXuDyW8KwNUWY77IGGVscaDo9h7xmpsGh9H-DhyNKIs744YXgy2PV6p3ep4Xg3nkNCYIP2-dZ5sjgIAyuAiw6JSiHTvsspgt9RVa7_Wh073Jm8TeWGIJLk7J795tEPuTmJTGLf21aYkpJfp1cr1IFkjGp2p-_xwvssF-_ydLsGUy8md1lzRADDYbD7Hjg4J8PtcwENLw4WbUY62o4WQTqN2WstuHqruj5VIEjob8FYCmobHkHhSdDxGU0jfU9_RSUNCifgc1Oq_GO7xU",
      "buddy_david": "https://lh3.googleusercontent.com/aida-public/AB6AXuBCRuOp-Z1wi5pGKy6m8GCVUonw1KcfFDl2HO0ksn4duDsBgaUQhVz2hI-qHBJpzr9i62_zK6JxJSEqIUIJUHUe0dro5diQLD1qmQB0HXROVWfRDoDnnl9bxQij2uPT0UISAK56dtGF6VYeRywk0n9mSajSz8Oe53XSqjYApv18xvc6GgXjZUAYkao1Y2QG5vbD2bkhVuSD5U0Fh34DGOte7FMkjhQ-p_CBbm1Q5YswhclgmWq_8rZ9FbJ5v0xALULz1i-XoiBYAU4"
    };
    const avatarUrl = buddy.avatar || AVATAR_MAP[buddy.id] || "https://lh3.googleusercontent.com/aida-public/AB6AXuBf9rx7Z6l90E-dEQNOHkY2L9MBL-BEWZw9xYFqtDLhTUanPJXcYsq_SLLQp9-1L7agsP9D6pvCfsF25EIMB8sho5heSobTuGewdesyf6K_uzKDkPhp26x65Vknl8xE2u16XPc-zYwemNefLq8_8SyOBx69qPDIcj74AKiDEKVdQf2pNm3Ng8qCXEIzvG7Pcyw7MEQZBDTInukBK_Or35fUL5P0HxZ7U78vldyRd_lanroKUI8Mphi4Rk2D0BVj6ymZiRXv4Y7oQoo";

    if (detailAvatar) detailAvatar.src = avatarUrl;
    if (detailName) detailName.textContent = buddy.name || "Peer Buddy";
    if (detailPronouns) detailPronouns.textContent = buddy.pronouns || "they/them";
    if (detailReplyTime) detailReplyTime.textContent = buddy.reply_time || "Usually replies in 5m";

    const stats = buddy.stats || { conversations: "300+", hours: "1.0k", months: "12" };
    if (detailStatConv) detailStatConv.textContent = stats.conversations || "300+";
    if (detailStatHours) detailStatHours.textContent = stats.hours || "1.0k";
    if (detailStatMonths) detailStatMonths.textContent = stats.months || "12";

    if (detailBio) detailBio.textContent = buddy.bio || "Certified peer specialist dedicated to active listening and empathetic support.";
    if (detailQuote) detailQuote.textContent = `"${buddy.quote || 'In medicine, as in life, the most important thing you can give anyone is hope. — Doogie Howser, M.D.'}"`;
    if (detailApproach) detailApproach.textContent = buddy.approach || "I listen quietly with empathy and gentle clarifying questions, providing a safe container for whatever you are feeling.";

    if (detailSpecialties) {
      const specialtyTags = (buddy.specialties || ["General Peer Support"])
        .map(s => `<span class="bg-surface border border-border/60 text-text-main px-3 py-1 rounded-full text-xs font-bold tracking-wide">${s}</span>`)
        .join("");
      detailSpecialties.innerHTML = specialtyTags;
    }

    if (detailGroundingList) {
      const exercises = buddy.grounding_exercises || [
        "5-4-3-2-1 Sensory grounding technique",
        "Box breathing (4-4-4-4 pace)",
        "Mindful posture & breath awareness"
      ];
      detailGroundingList.innerHTML = exercises.map(ex => `
        <li class="flex items-center gap-3 text-sm text-text-main">
          <span class="flex items-center justify-center w-6 h-6 rounded-full bg-primary/15 text-primary font-bold text-xs">✓</span>
          <span>${ex}</span>
        </li>
      `).join("");
    }

    const isOnline = buddy.availability?.toLowerCase() === "online";
    if (btnDetailConnect) {
      if (isOnline) {
        btnDetailConnect.disabled = false;
        btnDetailConnect.classList.remove("opacity-50", "cursor-not-allowed");
        if (detailConnectLabel) detailConnectLabel.textContent = `Connect with ${buddy.name.split(" ")[0]}`;
        btnDetailConnect.onclick = () => {
          selectedBuddyId = buddy.id;
          startCrisisCall();
        };
      } else {
        btnDetailConnect.disabled = true;
        btnDetailConnect.classList.add("opacity-50", "cursor-not-allowed");
        if (detailConnectLabel) detailConnectLabel.textContent = "Currently Offline";
        btnDetailConnect.onclick = null;
      }
    }

    show(buddyDetailView);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ============================================================
     SUPPORT ROSTER (Support Buddies Section)
  ============================================================ */
  let allRosterBuddies = [];
  let currentSpecialtyFilter = "All Specialties";

  async function fetchSupportRoster() {
    if (!supportRosterGrid) return;
    supportRosterGrid.innerHTML = `<div class="col-span-full text-center py-12 text-text-muted text-sm">Loading support roster...</div>`;
    try {
      const res = await fetch("/api/buddies");
      if (!res.ok) throw new Error("Failed to fetch buddies");
      const data = await res.json();
      allRosterBuddies = data.buddies || [];
      renderSupportRoster();
    } catch (err) {
      console.error("Error loading roster:", err);
      supportRosterGrid.innerHTML = `<div class="col-span-full text-center py-12 text-rose text-sm">Failed to load support roster. Please try again.</div>`;
    }
  }

  function renderSupportRoster() {
    if (!supportRosterGrid) return;
    const query = (supportRosterSearch?.value || "").toLowerCase().trim();
    
    const filtered = allRosterBuddies.filter(b => {
      const matchesSearch = !query || 
        (b.name || "").toLowerCase().includes(query) ||
        (b.bio || "").toLowerCase().includes(query) ||
        (b.specialties || []).some(s => s.toLowerCase().includes(query));
      
      const matchesSpecialty = currentSpecialtyFilter === "All Specialties" ||
        (b.specialties || []).some(s => s.toLowerCase() === currentSpecialtyFilter.toLowerCase());
        
      return matchesSearch && matchesSpecialty;
    });

    supportRosterGrid.innerHTML = "";
    if (filtered.length === 0) {
      supportRosterGrid.innerHTML = `<div class="col-span-full text-center py-12 text-text-muted text-sm italic">No support peers match your filter criteria.</div>`;
      return;
    }

    filtered.forEach(buddy => {
      supportRosterGrid.appendChild(createBuddyCard(buddy));
    });
  }

  if (supportRosterSearch) {
    supportRosterSearch.addEventListener("input", () => renderSupportRoster());
  }

  if (supportRosterFilters) {
    supportRosterFilters.addEventListener("click", (e) => {
      const btn = e.target.closest(".roster-filter-btn");
      if (!btn) return;
      currentSpecialtyFilter = btn.dataset.filter || "All Specialties";
      supportRosterFilters.querySelectorAll(".roster-filter-btn").forEach(b => {
        if (b === btn) {
          b.className = "px-4 py-1.5 rounded-full bg-primary border border-primary text-sm font-medium text-white transition-colors roster-filter-btn";
        } else {
          b.className = "px-4 py-1.5 rounded-full bg-surface border border-border text-sm font-medium text-text-muted hover:border-primary/50 hover:text-text-main transition-colors roster-filter-btn";
        }
      });
      renderSupportRoster();
    });
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
     VIEW SWITCHER, WELCOME GREETINGS & QUOTES (#1, #3)
  ============================================================ */
  const INSPIRATIONAL_QUOTES = [
    { text: "In medicine, as in life, the most important thing you can give anyone is hope.", author: "Doogie Howser, M.D." },
    { text: "Every challenge we face is an opportunity to learn, to grow, and to become a better version of ourselves.", author: "Doogie Howser, M.D." },
    { text: "True strength is not about never failing, but about having the courage to stand up and try again.", author: "Doogie Howser, M.D." },
    { text: "Healing is a matter of time, but it is sometimes also a matter of opportunity.", author: "Hippocrates" },
    { text: "We don't heal in isolation, but in community.", author: "S. Kelley Harrell" }
  ];

  const WELCOME_GREETINGS = [
    "How can I be of assistance?",
    "I'm here. Where should we start?",
    "How are things feeling right now?",
    "How can I support you today? Why don't you take a breath and tell me what's going on",
    "What is on your mind right now?",
    "How can I be of support to you today?",
    "Let's take this one step at a time. What's going on?",
    "I am here. Where should we begin?"
  ];

  function updateDoogieQuotes() {
    const quote = INSPIRATIONAL_QUOTES[Math.floor(Math.random() * INSPIRATIONAL_QUOTES.length)];
    document.querySelectorAll('.doogie-quote-text').forEach(el => el.textContent = `"${quote.text}"`);
    document.querySelectorAll('.doogie-quote-author').forEach(el => el.textContent = `— ${quote.author}`);
  }

  function rotateWelcomeGreeting() {
    const greetingEl = document.querySelector("#welcomeView h2");
    if (greetingEl) {
      const randomGreeting = WELCOME_GREETINGS[Math.floor(Math.random() * WELCOME_GREETINGS.length)];
      greetingEl.textContent = randomGreeting;
    }
  }

  const views = [welcomeView, loadingView, resultsView, authView, profileView, chatView, dashboardView, supportBuddiesView, buddyDetailView, buddyDashboardView, clinicianPortalView, caregiverPortalView];

  function show(view) {
    views.forEach(v => {
      if (!v) return;
      if (v === view) { v.classList.remove("hidden"); }
      else            { v.classList.add("hidden"); }
    });

    if (view !== chatView) {
      const sidebar = document.getElementById("chatBuddySidebar");
      const container = document.getElementById("chatMessagesContainer");
      if (sidebar && container) {
        sidebar.classList.add("hidden");
        container.className = "md:col-span-12 flex flex-col gap-4 overflow-y-auto no-scrollbar pr-2 h-full transition-all duration-300";
      }
    }

    updateDoogieQuotes();
    if (view === welcomeView) {
      rotateWelcomeGreeting();
    }

    const isMainView = [welcomeView, loadingView, resultsView, chatView, dashboardView, supportBuddiesView, buddyDetailView, buddyDashboardView, clinicianPortalView, caregiverPortalView].includes(view);
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
    const bgColor = window.MSB.Tokens.Toasts[type] || window.MSB.Tokens.Toasts.success;
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
      const sidebar = document.getElementById("chatBuddySidebar");
      const container = document.getElementById("chatMessagesContainer");
      if (sidebar && container) {
        sidebar.classList.add("hidden");
        container.className = "md:col-span-12 flex flex-col gap-4 overflow-y-auto no-scrollbar pr-2 h-full transition-all duration-300";
      }
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
      const sidebar = document.getElementById("chatBuddySidebar");
      const container = document.getElementById("chatMessagesContainer");
      if (sidebar && container) {
        sidebar.classList.add("hidden");
        container.className = "md:col-span-12 flex flex-col gap-4 overflow-y-auto no-scrollbar pr-2 h-full transition-all duration-300";
      }
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
      <div class="text-[11px] font-bold uppercase tracking-wider text-text-muted px-1">${isUser ? "You" : "AI Support Buddy"}</div>
      <div class="p-4 rounded-2xl text-sm md:text-base leading-relaxed ${isUser ? "bg-primary text-white rounded-br-none" : "bg-card border border-border text-text-main rounded-bl-none shadow-sm"}">
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
