import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { NAV_ITEMS } from "./constants.jsx";
import { health as fetchHealth } from "./api.js";
import Landing from "./views/Landing.jsx";
import Command from "./views/Command.jsx";
import Operations from "./views/Operations.jsx";
import Intelligence from "./views/Intelligence.jsx";
import Experiences from "./views/Experiences.jsx";
import Launch from "./views/Launch.jsx";
import Executive from "./views/Executive.jsx";
import Team from "./views/Team.jsx";
import ChatWidget from "./components/ChatWidget.jsx";
import MusicPlayer from "./components/MusicPlayer.jsx";

function readHash() {
  const h = window.location.hash.replace(/^#\/?/, "");
  const valid = NAV_ITEMS.map((n) => n.id);
  return valid.includes(h) ? h : "landing";
}

export default function App() {
  const [view, setView] = useState(readHash);
  const [provider, setProvider] = useState({ ok: true, label: "checking" });
  const [opId, setOpId] = useState(null);

  useEffect(() => {
    const onHash = () => setView(readHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const checkHealth = useCallback(() => {
    fetchHealth()
      .then((h) =>
        setProvider({
          ok: h.provider !== "none",
          label: h.provider === "none" ? "No LLM key" : `${h.provider} · ${h.model}`,
          state: "ok",
        })
      )
      .catch(() =>
        setProvider({ ok: false, label: "Backend offline", state: "retrying" })
      );
  }, []);

  useEffect(() => {
    setProvider({ ok: false, label: "Checking", state: "connecting" });
    checkHealth();
    const t = setInterval(checkHealth, 12000);
    return () => clearInterval(t);
  }, [checkHealth]);

  const navigate = useCallback((id) => {
    window.location.hash = `#/${id}`;
  }, []);

  const onOperationStarted = useCallback((id) => {
    setOpId(id);
    navigate("operations");
  }, [navigate]);

  return (
    <div className="relative min-h-screen bg-ink-950 text-cream font-sans">
      <Backdrop />
      <Nav view={view} navigate={navigate} provider={provider} />
      {!provider.ok && (
        <div className="relative z-40 border-b border-amber-500/20 bg-amber-500/10 px-6 py-2.5 text-center">
          <p className="text-[12px] text-amber-200">
            {provider.state === "connecting" ? (
              <span>Connecting to the live VIRELLE backend…</span>
            ) : (
              <>
                <span className="font-mono text-[10px] tracking-widest">WAKING LIVE BACKEND · </span>
                The free-tier server spins down when idle and is waking up — this can take up to a
                minute. Live features resume automatically.
                <button
                  onClick={checkHealth}
                  className="ml-3 rounded border border-amber-400/40 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-amber-200 hover:bg-amber-400/10"
                >
                  Recheck
                </button>
              </>
            )}
          </p>
        </div>
      )}
      <AnimatePresence mode="wait">
        <motion.main
          key={view}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        >
          {view === "landing" && <Landing navigate={navigate} onOperate={onOperationStarted} />}
          {view === "command" && <Command onOperate={onOperationStarted} />}
          {view === "operations" && <Operations opId={opId} navigate={navigate} />}
          {view === "intelligence" && <Intelligence opId={opId} navigate={navigate} />}
          {view === "experiences" && <Experiences opId={opId} />}
          {view === "launch" && <Launch opId={opId} />}
          {view === "executive" && <Executive opId={opId} />}
          {view === "team" && <Team navigate={navigate} />}
        </motion.main>
      </AnimatePresence>
      <Footer navigate={navigate} />
      <ChatWidget onOperate={onOperationStarted} />
      <MusicPlayer />
    </div>
  );
}

function Backdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="aurora h-[42rem] w-[42rem] -top-56 -left-40 bg-gold-500/10" />
      <div className="aurora h-[36rem] w-[36rem] top-1/3 -right-48 bg-blue-500/10" />
      <div className="aurora h-[30rem] w-[30rem] bottom-0 left-1/3 bg-violet-500/[0.07]" />
    </div>
  );
}

function Nav({ view, navigate, provider }) {
  return (
    <header className="relative z-40 sticky top-0 border-b border-gold-500/10 bg-ink-950/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
        <button
          onClick={() => navigate("landing")}
          className="group flex items-center gap-3"
          aria-label="VIRELLE home"
        >
          <span className="relative grid h-8 w-8 place-items-center">
            <span className="absolute inset-0 rounded-full border border-gold-500/60" />
            <span className="absolute inset-[7px] rounded-full border border-gold-500/40" />
            <span className="h-1.5 w-1.5 rounded-full bg-gold-400" />
          </span>
          <span className="font-serif text-xl tracking-[0.28em] text-cream">
            VIRELLE
          </span>
        </button>

        <nav className="hidden items-center gap-7 md:flex">
          <button
            onClick={() => navigate("landing")}
            className={`text-[13px] tracking-wide transition-colors ${
              view === "landing" ? "text-gold-300" : "text-cream/50 hover:text-cream"
            }`}
          >
            Home
          </button>
          {NAV_ITEMS.filter((n) => n.id !== "landing").map((n) => (
            <button
              key={n.id}
              onClick={() => navigate(n.id)}
              className={`text-[13px] tracking-wide transition-colors ${
                view === n.id ? "text-gold-300" : "text-cream/50 hover:text-cream"
              }`}
            >
              {n.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <span className="hidden items-center gap-2 rounded-full border border-gold-500/15 bg-gold-500/5 px-3 py-1.5 font-mono text-[10px] tracking-widest text-cream/60 sm:flex">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                provider.ok ? "bg-emerald-400 pulse-dot" : "bg-amber-400"
              }`}
            />
            {provider.label}
          </span>
          <button
            onClick={() => navigate("operations")}
            className="rounded-full bg-gold-fade px-5 py-2 text-[13px] font-medium text-ink-950 shadow-glow transition-transform hover:scale-[1.03]"
          >
            Start an operation
          </button>
        </div>
      </div>

      {/* mobile nav */}
      <div className="flex gap-4 overflow-x-auto px-6 pb-3 md:hidden">
        <button
          onClick={() => navigate("landing")}
          className={`whitespace-nowrap text-[13px] ${
            view === "landing" ? "text-gold-300" : "text-cream/50"
          }`}
        >
          Home
        </button>
        {NAV_ITEMS.filter((n) => n.id !== "landing").map((n) => (
          <button
            key={n.id}
            onClick={() => navigate(n.id)}
            className={`whitespace-nowrap text-[13px] ${
              view === n.id ? "text-gold-300" : "text-cream/50"
            }`}
          >
            {n.label}
          </button>
        ))}
      </div>
    </header>
  );
}

function Footer({ navigate }) {
  return (
    <footer className="relative z-10 border-t border-gold-500/10 py-12">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-3">
            <span className="grid h-7 w-7 place-items-center">
              <span className="absolute inset-0 rounded-full border border-gold-500/50" />
              <span className="h-1.5 w-1.5 rounded-full bg-gold-400" />
            </span>
            <span className="font-serif text-lg tracking-[0.28em]">VIRELLE</span>
          </div>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-cream/50">
            The Intelligent Hospitality Organisation. A five-agent AI organisation
            that turns live destination and hotel data into exceptional,
            commercially-viable guest experiences.
          </p>
          <p className="mt-4 font-mono text-[11px] tracking-widest text-cream/35">
            SENSE · DESIGN · BUILD · ATTRACT · DECIDE
          </p>
        </div>
        {[
          { title: "VIRELLE", items: ["Command", "Operations", "Intelligence"] },
          { title: "OUTPUT", items: ["Experiences", "Launch", "Executive"] },
          { title: "THE TEAM", items: ["Eleanor Hayes", "Sofia Laurent", "Julian Mercer", "Amelia Bennett", "Alexander Sterling"] },
        ].map((col) => (
          <div key={col.title}>
            <p className="font-mono text-[10px] tracking-widest2 text-gold-500/70">
              {col.title}
            </p>
            <ul className="mt-3 space-y-2">
              {col.items.map((item) => (
                <li key={item}>
                  <button
                    onClick={() => navigate("team")}
                    className="text-sm text-cream/55 transition-colors hover:text-gold-300"
                  >
                    {item}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <p className="mt-10 text-center font-mono text-[10px] tracking-widest text-cream/25">
        © 2026 VIRELLE · LIVE DATA · REAL MCP · FIVE SPECIALISED AGENTS · ONE BUSINESS DECISION
      </p>
    </footer>
  );
}
