import React, { useEffect, useRef, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Send, X, Sparkles, User, Maximize2, Minimize2 } from "lucide-react";
import { createChatSession, chatStream } from "../api.js";

const OPENING =
  "Good evening. How can I help?\n\nTell me what you're looking for — a night out, a weekend, dinner — and I'll take care of the rest.";

const CUSTOMER_SUGGESTIONS = [
  "Any great experiences this weekend?",
  "Where can we get dinner tonight?",
  "What's on in Dublin?",
];

function dublinGreeting() {
  const h = new Date().toLocaleString("en-IE", { hour: "numeric", hour12: false, timeZone: "Europe/Dublin" });
  const hour = parseInt(h, 10);
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function openingMessage() {
  return `${dublinGreeting()}. How can I help?\n\nTell me what you're looking for — a night out, a weekend, dinner — and I'll take care of the rest.`;
}

const THINKING_MESSAGES = [
  "Stay calm, while we work our charm",
  "Crafting something beautiful… please hold",
  "Good things take time — almost there",
  "Our elves are on it — one moment",
];

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [maximized, setMaximized] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([{ role: "assistant", text: openingMessage() }]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [typing, setTyping] = useState(false);
  const [thinkIdx, setThinkIdx] = useState(0);
  const [nudge, setNudge] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, typing]);

  useEffect(() => {
    if (!open) return;
    let t;
    if (!sessionId) {
      t = setTimeout(() => {
        createChatSession().then((r) => setSessionId(r.session_id)).catch(() => {});
      }, 300);
    }
    return () => clearTimeout(t);
  }, [open, sessionId]);

  useEffect(() => {
    if (!typing) return;
    const id = setInterval(() => setThinkIdx((i) => (i + 1) % THINKING_MESSAGES.length), 3000);
    return () => clearInterval(id);
  }, [typing]);

  useEffect(() => {
    const t1 = setTimeout(() => setNudge(true), 4000);
    const t2 = setTimeout(() => setNudge(false), 12000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const getSession = async () => {
    if (sessionId) return sessionId;
    const r = await createChatSession();
    setSessionId(r.session_id);
    return r.session_id;
  };

  const send = async (text) => {
    const message = (text ?? input).trim();
    if (!message || busy) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text: message }]);
    setBusy(true);
    setTyping(true);
    try {
      const sid = await getSession();
      await chatStream(sid, message, (ev) => {
        if (ev.type === "assistant") {
          setTyping(false);
          setMessages((m) => [...m, { role: "assistant", text: ev.text }]);
        } else if (ev.type === "error") {
          setTyping(false);
          setMessages((m) => [...m, { role: "assistant", text: ev.text, error: true }]);
        }
      });
    } finally {
      setTyping(false);
      setBusy(false);
    }
  };

  return (
    <div className={`fixed right-6 flex flex-col items-end ${maximized ? "inset-0 z-[85]" : "bottom-6 z-[60]"}`}>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className={`flex flex-col overflow-hidden border border-gold-500/20 bg-ink-900/90 shadow-2xl backdrop-blur-xl ${
              maximized
                ? "fixed inset-0 z-[80] h-full w-full rounded-none"
                : "mb-4 h-[32rem] w-[calc(100vw-3rem)] max-w-[24rem] rounded-3xl"
            }`}
          >
            {/* header */}
            <div className="flex items-center justify-between border-b border-cream/8 bg-ink-950/60 px-5 py-3.5">
              <div className="flex items-center gap-3">
                <span className="relative grid h-9 w-9 place-items-center">
                  <span className="absolute inset-0 rounded-full border border-gold-500/50" />
                  <span className="absolute inset-[6px] rounded-full border border-gold-500/30" />
                  <span className="h-1.5 w-1.5 rounded-full bg-gold-400 pulse-dot" />
                </span>
                <div>
                  <p className="font-serif text-sm leading-none text-cream">Ask VIRELLE</p>
                  <p className="mt-1 flex items-center gap-1.5 font-mono text-[9px] tracking-widest text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 pulse-dot" />
                    ORGANISATION ONLINE
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setMaximized((m) => !m)}
                  className="grid h-8 w-8 place-items-center rounded-full text-cream/50 transition-colors hover:bg-cream/5 hover:text-cream"
                  aria-label={maximized ? "Minimise chat" : "Expand chat to full screen"}
                  title={maximized ? "Minimise" : "Full screen"}
                >
                  {maximized ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="grid h-8 w-8 place-items-center rounded-full text-cream/50 transition-colors hover:bg-cream/5 hover:text-cream"
                  aria-label="Close chat"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* messages */}
            <div ref={scrollRef} className="chat-scroll flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {messages.map((m, i) => (
                <WidgetBubble key={i} m={m} maximized={maximized} />
              ))}
              {typing && (
                <div className="flex items-center gap-2 text-cream/40">
                  <span className="h-1.5 w-1.5 rounded-full bg-gold-400 blink" />
                  <span className="h-1.5 w-1.5 rounded-full bg-gold-400 blink" style={{ animationDelay: "0.2s" }} />
                  <span className="h-1.5 w-1.5 rounded-full bg-gold-400 blink" style={{ animationDelay: "0.4s" }} />
                  <span className="ml-1 font-mono text-[9px] tracking-widest">{THINKING_MESSAGES[thinkIdx].toUpperCase()}</span>
                </div>
              )}
            </div>

            {/* suggestions */}
            <div className="flex gap-2 overflow-x-auto px-4 pb-2">
              {CUSTOMER_SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  disabled={busy}
                  className="whitespace-nowrap rounded-full border border-gold-500/20 bg-gold-500/5 px-3 py-1.5 text-[10px] text-gold-200/90 transition-colors hover:bg-gold-500/10 disabled:opacity-40"
                >
                  {s}
                </button>
              ))}
            </div>

            {/* input */}
            <div className="border-t border-cream/8 px-4 py-3">
              <div className="flex items-center gap-2 rounded-2xl border border-cream/10 bg-ink-950/70 px-3 py-2 focus-within:border-gold-500/40">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && send()}
                  disabled={busy}
                  placeholder="Ask me anything — a table, a weekend, an event…"
                  className="flex-1 bg-transparent text-[13px] text-cream placeholder:text-cream/30"
                />
                <button
                  onClick={() => send()}
                  disabled={busy || !input.trim()}
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-gold-fade text-ink-950 transition-transform hover:scale-105 disabled:opacity-40"
                  aria-label="Send"
                >
                  <Send size={14} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* launcher */}
      <div className="relative flex items-center gap-3">
        <AnimatePresence>
          {nudge && !open && (
            <motion.span
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="glass rounded-full px-4 py-2 text-[12px] text-cream/80"
            >
              Ask me anything —
              <span className="ml-1 text-gold-300">unsold rooms, events, revenue</span>
            </motion.span>
          )}
        </AnimatePresence>
        <motion.button
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => setOpen((o) => !o)}
          className={`relative grid h-14 w-14 place-items-center rounded-full shadow-glow transition-colors ${
            open ? "bg-cream text-ink-950" : "bg-gold-fade text-ink-950"
          }`}
          aria-label={open ? "Close chat" : "Ask VIRELLE"}
          title="Ask VIRELLE"
        >
          {!open && (
            <span className="ping-ring absolute inset-0 rounded-full bg-gold-500/40" />
          )}
          {open ? <X size={22} /> : <MessageCircle size={22} />}
        </motion.button>
      </div>
    </div>
  );
}

function WidgetBubble({ m, maximized }) {
  const bubbleWidth = maximized ? "max-w-[70%]" : "max-w-[85%]";
  if (m.role === "user") {
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex justify-end">
        <div className={`${bubbleWidth} rounded-2xl rounded-br-md bg-gold-fade px-4 py-2.5 shadow-glow ${maximized ? "text-[15px]" : "text-[13px]"} text-ink-950`}>
          <div className="flex items-center gap-1 opacity-60">
            <User size={10} />
            <span className="font-mono text-[8px] tracking-widest">YOU</span>
          </div>
          <p className="mt-0.5 whitespace-pre-line">{m.text}</p>
        </div>
      </motion.div>
    );
  }
  if (m.role === "activity") {
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
        <div
          className="flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-[9px] tracking-widest"
          style={{ borderColor: `${m.color}40`, background: `${m.color}0f`, color: m.color }}
        >
          <span className="h-1.5 w-1.5 rounded-full pulse-dot" style={{ background: m.color }} />
          {m.text.toUpperCase()}
        </div>
      </motion.div>
    );
  }
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
      <div
        className={`${bubbleWidth} rounded-2xl rounded-bl-md border px-4 py-2.5 leading-relaxed ${
          m.error ? "border-rose-400/30 text-rose-200" : "border-cream/8 bg-ink-850 text-cream/85"
        } ${maximized ? "text-[15px]" : "text-[13px]"}`}
      >
        <div className="flex items-center gap-1.5 text-gold-400/70">
          <Sparkles size={10} />
          <span className="font-mono text-[8px] tracking-widest">VIRELLE</span>
        </div>
        <p className="mt-1 whitespace-pre-line">{m.text}</p>
      </div>
    </motion.div>
  );
}
