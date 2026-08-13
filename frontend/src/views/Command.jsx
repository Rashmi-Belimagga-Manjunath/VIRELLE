import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, Bot, User } from "lucide-react";
import { createChatSession, chatStream } from "../api.js";
import { MISSION_SUGGESTIONS } from "../constants.jsx";

const OPENING =
  "Good evening. What would you like VIRELLE to solve?\n\nGive me a business objective, and I'll coordinate the organisation from research to decision.";

const AGENT_PILL = {
  researcher: { label: "ELEANOR", color: "#4facfe" },
  designer: { label: "SOFIA", color: "#f6c86a" },
  maker: { label: "JULIAN", color: "#5eead4" },
  communicator: { label: "AMELIA", color: "#f472b6" },
  manager: { label: "ALEXANDER", color: "#c4b5fd" },
};

export default function Command({ onOperate }) {
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([
    { role: "assistant", text: OPENING },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    createChatSession().then((r) => setSessionId(r.session_id)).catch(() => {});
  }, []);

  useEffect(() => {
    if (scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, typing]);

  const send = async (text) => {
    const message = (text ?? input).trim();
    if (!message || busy || !sessionId) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text: message }]);
    setBusy(true);
    setTyping(true);
    let agentTracker = new Set();
    await chatStream(sessionId, message, (ev) => {
      if (ev.type === "assistant") {
        setTyping(false);
        setMessages((m) => [...m, { role: "assistant", text: ev.text }]);
      } else if (ev.type === "agent") {
        if (ev.status === "working") {
          agentTracker.add(ev.agent);
          const pill = AGENT_PILL[ev.agent];
          setMessages((m) => [
            ...m,
            {
              role: "activity",
              id: ev.agent,
              text: `${pill?.label || ev.agent} is now working on this mission.`,
              color: pill?.color,
            },
          ]);
        }
      } else if (ev.type === "operation_started") {
        setTyping(false);
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            text: "The organisation has begun. I'll stream the live pipeline here — or open VIRELLE Operations for the full workspace.",
          },
        ]);
        onOperate(ev.operation_id);
      } else if (ev.type === "operation_done") {
        setMessages((m) => [
          ...m,
          { role: "assistant", text: "Operation complete. The organisation reached its decision." },
        ]);
        onOperate(ev.operation_id);
      } else if (ev.type === "error") {
        setTyping(false);
        setMessages((m) => [...m, { role: "assistant", text: ev.text, error: true }]);
      }
    });
    setTyping(false);
    setBusy(false);
  };

  return (
    <div className="relative z-10 mx-auto max-w-4xl px-6 py-12">
      <div className="text-center">
        <p className="font-mono text-[11px] tracking-widest2 text-gold-500/80">VIRELLE COMMAND</p>
        <h1 className="mt-2 font-serif text-4xl text-cream md:text-5xl">
          Your interface to the organisation.
        </h1>
        <p className="mt-3 text-sm text-cream/50">
          One conversation. Five specialists. A complete business operation.
        </p>
      </div>

      <div className="glass relative mt-10 flex h-[70vh] flex-col overflow-hidden rounded-3xl">
        {/* chat header */}
        <div className="flex items-center justify-between border-b border-cream/8 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-full border border-gold-500/40 bg-gold-500/10">
              <Bot size={16} className="text-gold-300" />
            </span>
            <div>
              <p className="font-serif text-lg leading-none text-cream">VIRELLE Command</p>
              <p className="mt-1 flex items-center gap-1.5 font-mono text-[9px] tracking-widest text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 pulse-dot" />
                ORGANISATION ONLINE
              </p>
            </div>
          </div>
          <span className="hidden font-mono text-[9px] tracking-widest text-cream/30 sm:block">
            MISSION → RESEARCH → DESIGN → BUILD → LAUNCH → DECISION
          </span>
        </div>

        {/* messages */}
        <div ref={scrollRef} className="chat-scroll flex-1 space-y-4 overflow-y-auto px-6 py-6">
          {messages.map((m, i) => (
            <Bubble key={i} m={m} />
          ))}
          {typing && (
            <div className="flex items-center gap-2 text-cream/40">
              <span className="h-2 w-2 rounded-full bg-gold-400 blink" />
              <span className="h-2 w-2 rounded-full bg-gold-400 blink" style={{ animationDelay: "0.2s" }} />
              <span className="h-2 w-2 rounded-full bg-gold-400 blink" style={{ animationDelay: "0.4s" }} />
              <span className="ml-1 font-mono text-[10px] tracking-widest">ORGANISATION THINKING</span>
            </div>
          )}
        </div>

        {/* suggestion chips */}
        <div className="flex gap-2 overflow-x-auto px-6 pb-3">
          {MISSION_SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              disabled={busy}
              className="whitespace-nowrap rounded-full border border-gold-500/20 bg-gold-500/5 px-4 py-2 text-[11px] text-gold-200/90 transition-colors hover:bg-gold-500/10 disabled:opacity-40"
            >
              {s}
            </button>
          ))}
        </div>

        {/* input */}
        <div className="border-t border-cream/8 px-6 py-4">
          <div className="flex items-center gap-3 rounded-2xl border border-cream/10 bg-ink-950/70 px-4 py-3 focus-within:border-gold-500/40">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              disabled={busy}
              placeholder="e.g. We have unsold rooms this weekend. Find us an opportunity."
              className="flex-1 bg-transparent text-sm text-cream placeholder:text-cream/30"
            />
            <button
              onClick={() => send()}
              disabled={busy || !input.trim()}
              className="grid h-9 w-9 place-items-center rounded-xl bg-gold-fade text-ink-950 transition-transform hover:scale-105 disabled:opacity-40"
            >
              <Send size={15} />
            </button>
          </div>
          <p className="mt-2 text-center font-mono text-[9px] tracking-widest text-cream/25">
            COMMAND · CONCIERGE NOT INCLUDED — THIS IS THE CONTROL DECK
          </p>
        </div>
      </div>
    </div>
  );
}

function Bubble({ m }) {
  if (m.role === "user") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-end"
      >
        <div className="max-w-[80%] rounded-2xl rounded-br-md bg-gold-fade px-5 py-3 text-sm text-ink-950 shadow-glow">
          <div className="flex items-center gap-1.5 opacity-60">
            <User size={11} />
            <span className="font-mono text-[9px] tracking-widest">EXECUTIVE</span>
          </div>
          <p className="mt-1 whitespace-pre-line">{m.text}</p>
        </div>
      </motion.div>
    );
  }
  if (m.role === "activity") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-start"
      >
        <div
          className="flex items-center gap-2 rounded-full border px-4 py-2 font-mono text-[10px] tracking-widest"
          style={{ borderColor: `${m.color}40`, background: `${m.color}0f`, color: m.color }}
        >
          <span className="h-1.5 w-1.5 rounded-full pulse-dot" style={{ background: m.color }} />
          {m.text.toUpperCase()}
        </div>
      </motion.div>
    );
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex justify-start"
    >
      <div
        className={`max-w-[80%] rounded-2xl rounded-bl-md border px-5 py-3 text-sm leading-relaxed ${
          m.error ? "border-rose-400/30 text-rose-200" : "border-cream/8 bg-ink-850 text-cream/85"
        }`}
      >
        <div className="flex items-center gap-1.5 text-gold-400/70">
          <Sparkles size={11} />
          <span className="font-mono text-[9px] tracking-widest">VIRELLE</span>
        </div>
        <p className="mt-1.5 whitespace-pre-line">{m.text}</p>
      </div>
    </motion.div>
  );
}
