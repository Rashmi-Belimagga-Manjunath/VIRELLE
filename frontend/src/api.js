const rawBase = import.meta.env.VITE_API_BASE || "/api";
const BASE = rawBase.endsWith("/api") ? rawBase : `${rawBase.replace(/\/+$/, "")}/api`;

async function jsonFetch(path, options) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail || JSON.stringify(body);
    } catch {
      /* ignore */
    }
    throw new Error(detail);
  }
  return res.json();
}

export const health = () => jsonFetch("/health");
export const connections = () => jsonFetch("/connections");
export const connectionsLive = () => jsonFetch("/connections/live");
export const livePayload = () => jsonFetch("/live");
export const organisation = () => jsonFetch("/organisation");
export const startOperation = (mission) =>
  jsonFetch("/operation/start", { method: "POST", body: JSON.stringify({ mission }) });
export const getOperation = (id) => jsonFetch(`/operation/${id}`);
export const latestProduct = () => jsonFetch("/product/latest");
export const createChatSession = () => jsonFetch("/chat", { method: "POST" });
export const bookProduct = (payload) =>
  jsonFetch("/product/book", { method: "POST", body: JSON.stringify(payload) });
export const submitContact = (payload) =>
  jsonFetch("/contact", { method: "POST", body: JSON.stringify(payload) });

/** POST-based SSE reader for the chat stream. */
export async function chatStream(sessionId, message, onEvent) {
  const res = await fetch(`${BASE}/chat/message`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId, message }),
  });
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let idx;
    while ((idx = buffer.indexOf("\n\n")) !== -1) {
      const chunk = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);
      for (const line of chunk.split("\n")) {
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload) continue;
        try {
          onEvent(JSON.parse(payload));
        } catch {
          /* ignore */
        }
      }
    }
  }
}

/** EventSource-based SSE for operation progress. */
export function streamOperation(operationId, onEvent) {
  const es = new EventSource(`${BASE}/operation/${operationId}/stream`);
  es.onmessage = (ev) => {
    try {
      onEvent(JSON.parse(ev.data));
    } catch {
      /* ignore */
    }
  };
  es.addEventListener("snapshot", (ev) => {
    try {
      onEvent({ type: "snapshot", snapshot: JSON.parse(ev.data) });
    } catch {
      /* ignore */
    }
  });
  es.addEventListener("done", () => es.close());
  es.onerror = () => {};
  return es;
}

export function fmtTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleTimeString("en-IE", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function fmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-IE", { weekday: "long", day: "numeric", month: "long" });
}

export const AGENT_ORDER = ["researcher", "designer", "maker", "communicator", "manager"];
