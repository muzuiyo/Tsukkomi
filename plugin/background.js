const DEFAULT_API = "https://api.tsukkomi.lain.today";

async function getApiUrl() {
  try {
    const stored = await browser.storage.local.get("apiUrl");
    return stored.apiUrl || DEFAULT_API;
  } catch {
    return DEFAULT_API;
  }
}

// Context menu
browser.contextMenus.create({
  id: "tsukkomi-annotate",
  title: "批注文本",
  contexts: ["selection"],
});

browser.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "tsukkomi-annotate" && info.selectionText) {
    browser.tabs.sendMessage(tab.id, {
      type: "annotate",
      text: info.selectionText,
    });
  }
});

// Handle API requests from content script
browser.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "api") {
    handleApi(msg).then(sendResponse);
    return true; // keep channel open for async response
  }
});

async function handleApi(msg) {
  const apiUrl = await getApiUrl();
  const url = `${apiUrl}${msg.path}`;
  try {
    const res = await fetch(url, {
      method: msg.method || "GET",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: msg.body ? JSON.stringify(msg.body) : undefined,
    });
    return await res.json();
  } catch {
    return { success: false, error: "网络错误" };
  }
}
