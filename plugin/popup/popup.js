const DEFAULT_API = "https://api.tsukkomi.lain.today";

// ==============================
// State
// ==============================

let apiUrl = DEFAULT_API;

// ==============================
// Elements
// ==============================

const loginView = document.getElementById("login-view");
const mainView = document.getElementById("main-view");
const settingsView = document.getElementById("settings-view");

const loginForm = document.getElementById("login-form");
const loginEmail = document.getElementById("login-email");
const loginPassword = document.getElementById("login-password");
const loginError = document.getElementById("login-error");

const memoForm = document.getElementById("memo-form");
const memoContent = document.getElementById("memo-content");
const memoLabels = document.getElementById("memo-labels");
const memoError = document.getElementById("memo-error");
const memoSuccess = document.getElementById("memo-success");
const btnSubmit = document.getElementById("btn-submit");
const btnLogout = document.getElementById("btn-logout");
const includePage = document.getElementById("include-page");

const settingsForm = document.getElementById("settings-form");
const settingsUrl = document.getElementById("api-url");
const settingsCancel = document.getElementById("settings-cancel");
const gotoSettings = document.getElementById("goto-settings");

// ==============================
// API Helpers
// ==============================

async function apiFetch(path, options = {}) {
  const res = await fetch(apiUrl + path, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  return res.json();
}

async function checkAuth() {
  try {
    const data = await apiFetch("/auth/me");
    return data.success ? data.data : null;
  } catch {
    return null;
  }
}

// ==============================
// View Switching
// ==============================

function showView(view) {
  loginView.classList.add("hidden");
  mainView.classList.add("hidden");
  settingsView.classList.add("hidden");
  view.classList.remove("hidden");
}

// ==============================
// Draft
// ==============================

async function saveDraft() {
  await browser.storage.local.set({
    draft: {
      content: memoContent.value,
      labels: memoLabels.value,
      isPublic: document.querySelector('input[name="visibility"]:checked').value,
    },
  });
}

async function loadDraft() {
  const stored = await browser.storage.local.get("draft");
  if (stored.draft) {
    memoContent.value = stored.draft.content || "";
    memoLabels.value = stored.draft.labels || "";
    const radio = document.querySelector(`input[name="visibility"][value="${stored.draft.isPublic || "1"}"]`);
    if (radio) radio.checked = true;
  }
}

function clearDraft() {
  browser.storage.local.remove("draft");
}

memoContent.addEventListener("input", saveDraft);
memoLabels.addEventListener("input", saveDraft);
document.querySelectorAll('input[name="visibility"]').forEach((r) => r.addEventListener("change", saveDraft));

// ==============================
// Init
// ==============================

async function init() {
  // Load API URL from storage
  const stored = await browser.storage.local.get("apiUrl");
  if (stored.apiUrl) apiUrl = stored.apiUrl;

  // Check auth
  const user = await checkAuth();
  if (user) {
    showView(mainView);
    await loadDraft();
    await loadPageInfo();
  } else {
    showView(loginView);
  }

  // Show UI after auth check completes
  document.body.style.opacity = "1";
}

// ==============================
// Login
// ==============================

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  loginError.textContent = "";

  try {
    const data = await apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: loginEmail.value.trim(),
        password: loginPassword.value,
      }),
    });

    if (data.success) {
      showView(mainView);
      await loadPageInfo();
    } else {
      loginError.textContent = data.error || "登录失败";
    }
  } catch (err) {
    loginError.textContent = "网络错误，请检查 API 地址";
  }
});

// ==============================
// Logout
// ==============================

btnLogout.addEventListener("click", async () => {
  try {
    await apiFetch("/auth/logout", { method: "POST" });
  } catch {
    // ignore
  }
  showView(loginView);
});

// ==============================
// Page Info
// ==============================

async function loadPageInfo() {
  try {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      includePage.checked = true;
      includePage.dataset.title = tab.title || "";
      includePage.dataset.url = tab.url || "";
    }
  } catch {
    includePage.checked = false;
  }
}

// ==============================
// Submit Memo
// ==============================

memoForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  memoError.textContent = "";
  memoSuccess.classList.add("hidden");

  const content = memoContent.value.trim();
  if (!content) {
    memoError.textContent = "内容不能为空";
    return;
  }

  // Build final content
  let finalContent = content;
  if (includePage.checked && includePage.dataset.url) {
    const title = includePage.dataset.title || includePage.dataset.url;
    finalContent += `\n\n> [${title}](${includePage.dataset.url})`;
  }

  // Parse labels
  const labels = memoLabels.value
    .trim()
    .split(/\s+/)
    .filter((l) => l.length > 0);

  const isPublic = Number(document.querySelector('input[name="visibility"]:checked').value);

  btnSubmit.disabled = true;
  btnSubmit.textContent = "发布中...";

  try {
    const data = await apiFetch("/memos", {
      method: "POST",
      body: JSON.stringify({ content: finalContent, isPublic, labels }),
    });

    if (data.success) {
      memoSuccess.classList.remove("hidden");
      memoContent.value = "";
      memoLabels.value = "";
      clearDraft();
      setTimeout(() => memoSuccess.classList.add("hidden"), 2000);
    } else {
      memoError.textContent = data.error || "发布失败";
    }
  } catch (err) {
    memoError.textContent = "网络错误";
  } finally {
    btnSubmit.disabled = false;
    btnSubmit.textContent = "发布！";
  }
});

// ==============================
// Settings
// ==============================

gotoSettings.addEventListener("click", (e) => {
  e.preventDefault();
  settingsUrl.value = apiUrl;
  showView(settingsView);
});

settingsCancel.addEventListener("click", () => {
  showView(loginView);
});

settingsForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const url = settingsUrl.value.trim().replace(/\/+$/, "");
  if (!url) return;
  apiUrl = url;
  await browser.storage.local.set({ apiUrl });
  showView(loginView);
});

// ==============================
// Start
// ==============================

init();
