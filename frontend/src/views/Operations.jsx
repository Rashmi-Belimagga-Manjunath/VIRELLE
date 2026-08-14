import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Radio,
  Cpu,
  ArrowDown,
  ExternalLink,
  Activity,
  ChevronDown,
  Database,
  CloudSun,
  Cloud,
  Server,
} from "lucide-react";
import { TEAM, STAGES, MISSION_SUGGESTIONS } from "../constants.jsx";
import { GALLERY } from "../components/Images.jsx";
import SectionHero from "../components/SectionHero.jsx";
import { connections as fetchConnections, startOperation } from "../api.js";
import { useOperation } from "../hooks/useOperation.js";

const CONN_ICONS = {
  "Fáilte Ireland Events API": Cloud,
  "Open-Meteo Weather API": CloudSun,
  "Dublin Destination Signals": Activity,
  "Hospitality Operations MCP": Server,
  "Hotel Database (SQLite)": Database,
};

export default function Operations({ opId, navigate }) {
  const { op, connected } = useOperation(opId);
  const [mission, setMission] = useState("");
  const [starting, setStarting] = useState(false);
  const [myOpId, setMyOpId] = useState(opId || null);
  const [conns, setConns] = useState([]);
  const logRef = useRef(null);

  const activeId = myOpId;
  const active = activeId ? op : { ...op, status: "idle" };
  const running = active.status === "running" || starting;

  useEffect(() => {
    fetchConnections()
      .then((r) => setConns(r.connections))
      .catch(() => {});
    const t = setInterval(
      () => fetchConnections().then((r) => setConns(r.connections)).catch(() => {}),
      6000
    );
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [active.log?.length, connected]);

  const handleStart = async (m) => {
    const target = (m ?? mission).trim();
    if (!target || running) return;
    setStarting(true);
    try {
      const res = await startOperation(target);
      setMyOpId(res.operation_id);
    } catch (e) {
      alert(e.message);
    } finally {
      setStarting(false);
    }
  };

  return (
    <>
      <SectionHero
        chapter="Chapter 02 · The Live Workspace"
        kicker="VIRELLE OPERATIONS"
        title="The live workspace"
        sub="Give the organisation a mission. The five agents execute in sequence, each querying live data and real hotel operations as they work."
        image={GALLERY.dublinNight.src}
        imageAlt="VIRELLE operations"
      />
      <div className="relative z-10 mx-auto max-w-7xl px-6 py-12">
      <div className="flex justify-end">
        <span
          className={`flex items-center gap-2 rounded-full border px-4 py-2 font-mono text-[10px] tracking-widest ${
            running
              ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
              : "border-cream/10 text-cream/40"
          }`}
        >
          <span
            className={`h-2 w-2 rounded-full ${running ? "bg-emerald-400 pulse-dot" : "bg-cream/30"}`}
          />
          {running ? "OPERATION LIVE" : "STANDBY"}
        </span>
      </div>

      {/* mission bar */}
      <div className="glass mt-8 rounded-2xl p-4">
        <div className="flex flex-col gap-3 lg:flex-row">
          <input
            value={mission}
            onChange={(e) => setMission(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleStart()}
            placeholder="e.g. We have 30 unsold rooms on Saturday. Find us an opportunity."
            className="flex-1 rounded-xl border border-cream/10 bg-ink-950/70 px-5 py-3.5 text-sm text-cream placeholder:text-cream/30 focus:border-gold-500/40"
          />
          <button
            onClick={() => handleStart()}
            disabled={running || !mission.trim()}
            className="flex items-center justify-center gap-2 rounded-xl bg-gold-fade px-7 py-3.5 text-sm font-medium text-ink-950 shadow-glow transition-all hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Play size={15} />
            {running ? "Running…" : "Start operation"}
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {MISSION_SUGGESTIONS.map((m) => (
            <button
              key={m}
              onClick={() => {
                setMission(m);
                handleStart(m);
              }}
              disabled={running}
              className="rounded-full border border-cream/10 px-3 py-1.5 text-[11px] text-cream/55 transition-colors hover:border-gold-500/40 hover:text-gold-300 disabled:opacity-40"
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {!activeId && !running && (
        <div className="mt-10 text-center text-sm text-cream/45">
          No operation yet. Enter a mission above to start the organisation.
        </div>
      )}

      {activeId && (
        <div className="mt-10 grid gap-6 lg:grid-cols-12">
          {/* PIPELINE */}
          <div className="lg:col-span-7">
            <Pipeline agents={active.agents} status={active.status} running={running} />
            <ResultActions op={active} navigate={navigate} />
          </div>

          {/* RIGHT COLUMN */}
          <div className="flex flex-col gap-6 lg:col-span-5">
            <Connections conns={conns} running={running} />
            <LogPanel log={active.log} connected={connected} />
          </div>

          {/* EVIDENCE */}
          <div className="lg:col-span-12">
            <EvidencePanel evidence={active.evidence} />
          </div>
        </div>
      )}
      </div>
    </>
  );
}

function Pipeline({ agents, status, running }) {
  const doneCount = (agents || []).filter((a) => a.status === "done").length;
  const pct = agents?.length ? Math.round((doneCount / agents.length) * 100) : 0;

  return (
    <div className="glass relative overflow-hidden rounded-2xl p-7">
      <div className="mb-6 flex items-center justify-between">
        <span className="flex items-center gap-2 font-mono text-[10px] tracking-widest text-cream/50">
          <Cpu size={13} className="text-gold-400" />
          AGENT PIPELINE
        </span>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[11px] text-gold-300">{pct}%</span>
          <div className="h-1.5 w-28 overflow-hidden rounded-full bg-cream/10">
            <motion.div
              className="h-full rounded-full bg-gold-fade"
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.6 }}
            />
          </div>
        </div>
      </div>

      <div className="relative flex flex-col gap-0">
        <div className="absolute bottom-6 left-[26px] top-6 w-px bg-gradient-to-b from-gold-500/50 via-gold-500/20 to-transparent" />
        {(agents?.length ? agents : TEAM).map((a, i) => {
          const meta = TEAM[i];
          const st = a.status || "waiting";
          const isWorking = st === "working";
          const isDone = st === "done";
          return (
            <div key={a.id} className="relative flex items-start gap-5 py-3">
              {isWorking && (
                <span
                  className="flow-dot absolute left-[23px] top-3 h-2 w-2 rounded-full"
                  style={{ background: meta.color }}
                />
              )}
              <div
                className="relative z-10 grid h-[52px] w-[52px] shrink-0 place-items-center rounded-full border transition-all duration-500"
                style={{
                  borderColor: isDone ? meta.color : `${meta.color}44`,
                  background: isDone ? meta.accent : "rgba(13,14,22,0.8)",
                  boxShadow: isDone ? `0 0 24px ${meta.color}30` : "none",
                }}
              >
                <span
                  className={`h-3 w-3 rounded-full ${isWorking ? "pulse-dot" : ""}`}
                  style={{
                    background: isDone ? meta.color : isWorking ? meta.color : "#3a3f55",
                  }}
                />
              </div>
              <div className="flex-1 pt-1.5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-serif text-lg leading-none text-cream">{meta.name}</p>
                    <p className="mt-1 text-[11px] text-cream/45">{meta.title}</p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 font-mono text-[9px] tracking-widest ${
                      isWorking
                        ? "bg-amber-400/10 text-amber-300 border border-amber-400/30"
                        : isDone
                          ? "bg-emerald-400/10 text-emerald-300 border border-emerald-400/30"
                          : "bg-cream/5 text-cream/35 border border-cream/10"
                    }`}
                  >
                    {isWorking ? "● WORKING" : isDone ? "✓ COMPLETE" : "○ WAITING"}
                  </span>
                </div>
                {i < (agents?.length || TEAM.length) - 1 && (
                  <div className="mt-2.5 flex items-center gap-2 text-gold-500/50">
                    <ArrowDown size={12} />
                    <span className="font-mono text-[9px] tracking-widest text-cream/35">
                      {STAGES[i]?.label} → {STAGES[i + 1]?.label}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Connections({ conns, running }) {
  const [open, setOpen] = useState(true);
  const dots = running ? (
    <span className="flex items-center gap-2 font-mono text-[10px] tracking-widest text-emerald-400">
      <span className="h-2 w-2 rounded-full bg-emerald-400 pulse-dot" />
      LIVE
    </span>
  ) : (
    <span className="font-mono text-[10px] tracking-widest text-cream/35">LIVE CONNECTIONS</span>
  );

  return (
    <div className="glass rounded-2xl p-6">
      <button className="flex w-full items-center justify-between" onClick={() => setOpen(!open)}>
        <span className="flex items-center gap-2 font-mono text-[10px] tracking-widest text-cream/50">
          <Radio size={13} className="text-gold-400" />
          LIVE DATA SOURCES
        </span>
        {dots}
        <ChevronDown size={14} className={`text-cream/40 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="mt-4 space-y-3">
              {conns.length === 0 &&
                ["Fáilte Ireland Events API", "Open-Meteo Weather API", "Dublin Destination Signals", "Hospitality Operations MCP", "Hotel Database (SQLite)"].map((n) => (
                  <ConnRow key={n} name={n} status="idle" />
                ))}
              {conns.map((c) => (
                <ConnRow key={c.name} name={c.name} status={c.status} fetched_at={c.fetched_at} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ConnRow({ name, status, fetched_at }) {
  const Icon = CONN_ICONS[name] || Radio;
  const ok = status === "connected";
  const err = status === "error";
  return (
    <div className="flex items-center justify-between rounded-xl border border-cream/8 bg-ink-950/50 px-4 py-3">
      <div className="flex items-center gap-3">
        <Icon size={15} className={ok ? "text-emerald-400" : err ? "text-rose-400" : "text-cream/30"} />
        <span className="text-[12px] text-cream/75">{name}</span>
      </div>
      <div className="flex items-center gap-3">
        {fetched_at && (
          <span className="font-mono text-[9px] tracking-wider text-cream/35">
            last queried {new Date(fetched_at).toLocaleTimeString("en-IE")}
          </span>
        )}
        <span
          className={`font-mono text-[9px] tracking-widest ${
            ok ? "text-emerald-400" : err ? "text-rose-400" : "text-cream/35"
          }`}
        >
          {ok ? "● CONNECTED" : err ? "● ERROR" : "○ IDLE"}
        </span>
      </div>
    </div>
  );
}

function LogPanel({ log, connected }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [log?.length]);
  return (
    <div className="glass flex-1 rounded-2xl p-6">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] tracking-widest text-cream/50">OPERATION LOG</span>
        <span className="font-mono text-[9px] tracking-widest text-cream/30">
          {connected ? "STREAMING" : "HISTORY"}
        </span>
      </div>
      <div ref={ref} className="chat-scroll mt-4 h-56 space-y-2 overflow-y-auto font-mono text-[10.5px] leading-relaxed">
        {(log || []).map((l, i) => (
          <p key={i} className="text-cream/55">
            <span className="text-gold-500/60">{new Date(l.at).toLocaleTimeString("en-IE")}</span>{" "}
            {l.message}
          </p>
        ))}
        {connected && (log || []).length > 0 && <p className="caret text-cream/40">_</p>}
      </div>
    </div>
  );
}

function EvidencePanel({ evidence }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="glass rounded-2xl p-7">
      <button className="flex w-full items-center justify-between" onClick={() => setOpen(!open)}>
        <div>
          <span className="font-mono text-[10px] tracking-widest text-cream/50">
            VIRELLE INTELLIGENCE — EVIDENCE
          </span>
          <p className="mt-1 text-sm text-cream/45">
            Every decision below is grounded in timestamped runtime queries.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[11px] text-gold-300">{evidence.length} queries</span>
          <ChevronDown size={15} className={`text-cream/40 transition-transform ${open ? "rotate-180" : ""}`} />
        </div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            {evidence.length === 0 ? (
              <p className="mt-5 text-sm text-cream/40">No queries yet. Start an operation.</p>
            ) : (
              <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {[...evidence].reverse().map((e, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className="rounded-xl border border-cream/8 bg-ink-950/50 p-4"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded bg-gold-500/10 px-2 py-0.5 font-mono text-[9px] tracking-widest text-gold-300">
                        {e.tool}
                      </span>
                      <span className="font-mono text-[9px] text-cream/35">
                        {e.channel} · {new Date(e.fetched_at).toLocaleTimeString("en-IE")}
                      </span>
                    </div>
                    <p className="mt-2.5 font-mono text-[10.5px] leading-relaxed text-cream/60">
                      {e.summary}
                    </p>
                    <p className="mt-2 text-[9px] text-cream/30">{e.source}</p>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ResultActions({ op, navigate }) {
  if (op.status !== "complete") return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-6 grid gap-3 sm:grid-cols-3"
    >
      <button
        onClick={() => navigate("experiences")}
        className="glass group rounded-xl p-5 text-left transition-colors hover:border-gold-500/30"
      >
        <ExternalLink size={15} className="text-teal-300" />
        <p className="mt-2 font-serif text-lg text-cream">Experiences</p>
        <p className="text-[11px] text-cream/45">The product Julian built</p>
      </button>
      <button
        onClick={() => navigate("launch")}
        className="glass rounded-xl p-5 text-left transition-colors hover:border-gold-500/30"
      >
        <ExternalLink size={15} className="text-rose-300" />
        <p className="mt-2 font-serif text-lg text-cream">Launch</p>
        <p className="text-[11px] text-cream/45">Amelia's campaign</p>
      </button>
      <button
        onClick={() => navigate("executive")}
        className="glass rounded-xl p-5 text-left transition-colors hover:border-gold-500/30"
      >
        <ExternalLink size={15} className="text-violet-300" />
        <p className="mt-2 font-serif text-lg text-cream">Executive</p>
        <p className="text-[11px] text-cream/45">Alexander's decision</p>
      </button>
    </motion.div>
  );
}
