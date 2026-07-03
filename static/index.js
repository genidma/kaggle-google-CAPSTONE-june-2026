document.addEventListener("DOMContentLoaded", () => {
  // Elements
  const queryForm = document.getElementById("queryForm");
  const queryInput = document.getElementById("queryInput");
  const welcomeView = document.getElementById("welcomeView");
  const loadingView = document.getElementById("loadingView");
  const resultsView = document.getElementById("resultsView");
  const loadingText = document.getElementById("loadingText");
  
  const btnSettings = document.getElementById("btnSettings");
  const settingsDialog = document.getElementById("settingsDialog");
  const btnDialogClose = document.getElementById("btnDialogClose");
  const btnSaveKey = document.getElementById("btnSaveKey");
  const btnClearKey = document.getElementById("btnClearKey");
  const apiKeyInput = document.getElementById("apiKeyInput");
  
  const btnBackToHome = document.getElementById("btnBackToHome");
  const matchBadge = document.getElementById("matchBadge");
  const responseSpeechText = document.getElementById("responseSpeechText");
  const resourceGrid = document.getElementById("resourceGrid");
  const resourceMatchSection = document.getElementById("resourceMatchSection");
  
  // Status indicators
  const statusOrchestrator = document.getElementById("statusOrchestrator");
  const statusSearch = document.getElementById("statusSearch");
  const statusSecurity = document.getElementById("statusSecurity");
  
  // Load saved API Key from LocalStorage
  let geminiApiKey = localStorage.getItem("gemini_api_key") || "";
  apiKeyInput.value = geminiApiKey;

  // Dialog Operations
  btnSettings.addEventListener("click", () => {
    settingsDialog.showModal();
  });
  
  const closeDialog = () => {
    settingsDialog.close();
  };
  
  btnDialogClose.addEventListener("click", closeDialog);
  
  // Save API Key
  btnSaveKey.addEventListener("click", () => {
    geminiApiKey = apiKeyInput.value.trim();
    localStorage.setItem("gemini_api_key", geminiApiKey);
    closeDialog();
    showNotification("API Key saved successfully!");
  });
  
  // Clear API Key
  btnClearKey.addEventListener("click", () => {
    geminiApiKey = "";
    apiKeyInput.value = "";
    localStorage.removeItem("gemini_api_key");
    closeDialog();
    showNotification("API Key cleared.");
  });

  // Fallback for browsers without native closedby support (Light Dismiss)
  if (!('closedBy' in HTMLDialogElement.prototype)) {
    settingsDialog.addEventListener('click', (event) => {
      if (event.target !== settingsDialog) return;
      const rect = settingsDialog.getBoundingClientRect();
      const isDialogContent = (
        rect.top <= event.clientY &&
        event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX &&
        event.clientX <= rect.left + rect.width
      );
      if (isDialogContent) return;
      settingsDialog.close();
    });
  }

  // Pre-fill suggested scenarios
  document.querySelectorAll(".scenario-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      queryInput.value = btn.getAttribute("data-query");
      queryInput.focus();
    });
  });

  // Back to home button
  btnBackToHome.addEventListener("click", () => {
    resultsView.classList.add("hidden");
    welcomeView.classList.remove("hidden");
    resetTracker();
  });

  // Query Form Submit
  queryForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const query = queryInput.value.trim();
    if (!query) return;

    // Show loading UI
    welcomeView.classList.add("hidden");
    resultsView.classList.add("hidden");
    loadingView.classList.remove("hidden");
    
    // Step 1: Orchestrator analyzing query
    updateTrackerState("orchestrator", "active", "Analyzing intent...");
    updateTrackerState("search", "idle", "Waiting...");
    updateTrackerState("security", "idle", "Waiting...");
    
    try {
      // Simulate multi-agent processing steps visually
      loadingText.textContent = "Orchestrator: Parsing query and extracting location...";
      await delay(800);
      
      // Step 2: Search agent active
      loadingText.textContent = "Service Search: Querying verified directory...";
      updateTrackerState("orchestrator", "completed", "Done");
      updateTrackerState("search", "active", "Searching database...");
      await delay(800);

      // Step 3: Security check
      loadingText.textContent = "Security Layer: Verifying matched resources...";
      updateTrackerState("search", "completed", "Done");
      updateTrackerState("security", "active", "Checking safety parameters...");
      await delay(600);

      // Call API backend
      const response = await fetch("/api/match", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          query: query,
          custom_api_key: geminiApiKey
        })
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const data = await response.json();
      
      // Step 4: Completed
      updateTrackerState("security", "completed", "Done");
      await delay(200);
      
      displayResults(data);

    } catch (err) {
      console.error(err);
      updateTrackerState("orchestrator", "error", "Error");
      updateTrackerState("search", "error", "Error");
      updateTrackerState("security", "error", "Error");
      
      loadingView.classList.add("hidden");
      welcomeView.classList.remove("hidden");
      alert(`An error occurred: ${err.message}. Please verify the backend is running.`);
    }
  });

  // Display results
  function displayResults(data) {
    loadingView.classList.add("hidden");
    resultsView.classList.remove("hidden");

    // Clear previous results
    resourceGrid.innerHTML = "";
    
    // Set response text
    responseSpeechText.innerHTML = formatMarkdown(data.response);
    
    // Set match status badge
    if (data.status === "severe_crisis") {
      matchBadge.textContent = "🚨 Severe Crisis Redirection";
      matchBadge.className = "match-badge danger";
      resourceMatchSection.classList.add("hidden");
    } else if (data.status === "non_crisis") {
      matchBadge.textContent = "⚠️ Non-Crisis Intent";
      matchBadge.className = "match-badge warning";
      resourceMatchSection.classList.add("hidden");
    } else {
      matchBadge.textContent = `✅ matched ${data.resources.length} resource(s)`;
      matchBadge.className = "match-badge success";
      resourceMatchSection.classList.remove("hidden");

      if (data.resources.length === 0) {
        resourceMatchSection.classList.add("hidden");
      } else {
        // Render matches
        data.resources.forEach(res => {
          const card = document.createElement("div");
          card.className = `resource-card category-${getCategoryClass(res.category)}`;
          
          card.innerHTML = `
            <div class="resource-card-header">
              <h4 class="resource-name">${res.name}</h4>
              <span class="resource-type-tag">${res.category.replace("_", " ")}</span>
            </div>
            <p class="resource-desc">${res.description}</p>
            <div class="resource-details">
              <div class="detail-item">
                <span class="detail-icon">📍</span>
                <span class="detail-text">${res.address}</span>
              </div>
              <div class="detail-item">
                <span class="detail-icon">📞</span>
                <span class="detail-text">${res.phone}</span>
              </div>
              <div class="detail-item">
                <span class="detail-icon">🕒</span>
                <span class="detail-text">${res.hours}</span>
              </div>
            </div>
          `;
          resourceGrid.appendChild(card);
        });
      }
    }
  }

  // Utilities
  function updateTrackerState(agent, state, text) {
    const el = agent === "orchestrator" ? statusOrchestrator :
               agent === "search" ? statusSearch : statusSecurity;
               
    el.className = `tracker-item ${state}`;
    el.querySelector(".tracker-state").textContent = text;
  }

  function resetTracker() {
    updateTrackerState("orchestrator", "idle", "Idle");
    updateTrackerState("search", "idle", "Idle");
    updateTrackerState("security", "idle", "Idle");
  }

  function getCategoryClass(cat) {
    if (cat.includes("shelter")) return "shelter";
    if (cat.includes("food")) return "food";
    if (cat.includes("mental")) return "mental";
    if (cat.includes("medical")) return "medical";
    return "other";
  }

  function formatMarkdown(text) {
    // Basic formatting for bullet points and bold text
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^\* (.*?)$/gm, '<li>$1</li>')
      .replace(/(<li>.*?<\/li>)/g, '<ul>$1</ul>')
      .replace(/<\/ul>\s*<ul>/g, '') // Merge adjacent lists
      .replace(/\n/g, '<br>');
  }

  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function showNotification(msg) {
    // Simple alert or toast notification (fallback)
    const toast = document.createElement("div");
    toast.style.position = "fixed";
    toast.style.bottom = "20px";
    toast.style.right = "20px";
    toast.style.backgroundColor = "#10b981";
    toast.style.color = "#0b0f19";
    toast.style.padding = "0.75rem 1.5rem";
    toast.style.borderRadius = "8px";
    toast.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
    toast.style.fontWeight = "600";
    toast.style.zIndex = "1000";
    toast.textContent = msg;
    
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.remove();
    }, 3000);
  }
});
