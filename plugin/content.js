async function apiCall(path, method = "GET", body = null) {
  return browser.runtime.sendMessage({
    type: "api",
    path,
    method,
    body,
  });
}

async function checkAuth() {
  const data = await apiCall("/auth/me");
  return data.success ? data.data : null;
}

function removePanel() {
  const existing = document.getElementById("tsukkomi-annotate-panel");
  const overlay = document.getElementById("tsukkomi-annotate-overlay");
  if (existing) existing.remove();
  if (overlay) overlay.remove();
}

function showToast(message) {
  const toast = document.createElement("div");
  toast.textContent = message;
  Object.assign(toast.style, {
    position: "fixed",
    top: "20px",
    right: "20px",
    background: "#22c55e",
    color: "#fff",
    padding: "10px 20px",
    borderRadius: "8px",
    fontSize: "14px",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    zIndex: "2147483647",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    animation: "tsukkomi-fadein 0.15s ease",
  });
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2000);
}

function showPanel(selectedText) {
  removePanel();

  const overlay = document.createElement("div");
  overlay.id = "tsukkomi-annotate-overlay";
  overlay.addEventListener("click", removePanel);

  const panel = document.createElement("div");
  panel.id = "tsukkomi-annotate-panel";
  panel.innerHTML = `
    <div class="tsukkomi-header">
      <span>💬 批注文本</span>
      <button class="tsukkomi-close" id="tsukkomi-close">&times;</button>
    </div>
    <div class="tsukkomi-body">
      <div class="tsukkomi-selected">${escapeHtml(selectedText)}</div>
      <textarea id="tsukkomi-content" placeholder="写下你的批注..."></textarea>
      <input class="tsukkomi-input" id="tsukkomi-labels" placeholder="标签（空格分隔）">
      <div class="tsukkomi-row">
        <label><input type="radio" name="tsukkomi-vis" value="1" checked> 公开</label>
        <label><input type="radio" name="tsukkomi-vis" value="0"> 私密</label>
      </div>
      <div class="tsukkomi-error" id="tsukkomi-error"></div>
    </div>
    <div class="tsukkomi-footer">
      <button class="tsukkomi-btn" id="tsukkomi-cancel">取消</button>
      <button class="tsukkomi-btn primary" id="tsukkomi-submit">发布</button>
    </div>
  `;

  document.body.appendChild(overlay);
  document.body.appendChild(panel);

  document.getElementById("tsukkomi-close").addEventListener("click", removePanel);
  document.getElementById("tsukkomi-cancel").addEventListener("click", removePanel);
  document.getElementById("tsukkomi-submit").addEventListener("click", () => submit(selectedText));

  document.getElementById("tsukkomi-content").focus();
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

async function submit(selectedText) {
  const content = document.getElementById("tsukkomi-content").value.trim();
  const errorEl = document.getElementById("tsukkomi-error");
  const submitBtn = document.getElementById("tsukkomi-submit");

  if (!content) {
    errorEl.textContent = "批注内容不能为空";
    return;
  }

  const labels = document.getElementById("tsukkomi-labels").value
    .trim()
    .split(/\s+/)
    .filter((l) => l.length > 0);

  const isPublic = Number(
    document.querySelector('input[name="tsukkomi-vis"]:checked').value
  );

  const fullContent = `${content}\n\n> ${selectedText}`;

  submitBtn.disabled = true;
  submitBtn.textContent = "发布中...";

  const data = await apiCall("/memos", "POST", {
    content: fullContent,
    isPublic,
    labels,
  });

  if (data.success) {
    removePanel();
    showToast("批注发布成功 ✓");
  } else {
    errorEl.textContent = data.error || "发布失败";
    submitBtn.disabled = false;
    submitBtn.textContent = "发布";
  }
}

browser.runtime.onMessage.addListener(async (msg) => {
  if (msg.type === "annotate" && msg.text) {
    const user = await checkAuth();
    if (!user) {
      alert("请先在 Tsukkomi 扩展中登录");
      return;
    }
    showPanel(msg.text);
  }
});
