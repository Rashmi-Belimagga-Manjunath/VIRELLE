import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Radar,
  Database,
  Server,
  CloudSun,
  Cloud,
  Activity,
  TrendingUp,
  Gauge,
  Target,
} from "lucide-react";
import { connections as fetchConnections } from "../api.js";
import { useOperation } from "../hooks/useOperation.js";

const CONN_META = {
  "Fáilte Ireland Events API": { icon: Cloud, note: "Live Irish tourism events feed" },
  "Open-Meteo Weather API": { icon: CloudSun, note: "Live Dublin forecast" },
  "Dublin Destination Signals": { icon: Activity, note: "Live destination interest" },
  "Hospitality Operations MCP": { icon: Server, note: "Hotel operational tools" },
  "Hotel Database (SQLite)": { icon: Database, note: "Real queryable hotel data" },
};

export default function Intelligence({ opId, navigate }) {
  const { op } = useOperation(opId);
  const [conns, setConns] = useState([]);

  useEffect(() => {
    fetchConnections().then((r) => setConns(r.connections)).catch(() => {});
    const t = setInterval(
      () => fetchConnections().then((r) => setConns(r.connections)).catch(() => {}),
      6000
    );
    return () => clearInterval(t);
  }, []);

  const brief =
    op.agents?.find((a) => a.id === "researcher")?.output?.opportunity_brief || null;

  return (
    <div className="relative z-10 mx-auto max-w-7xl px-6 py-12">
      <div className="text-center">
        <p className="font-mono text-[11px] tracking-widest2 text-gold-500/80">VIRELLE INTELLIGENCE</p>
        <h1 className="mt-2 font-serif text-4xl text-cream md:text-5xl">Live data, evidence, research</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-cream/55">
          Every source below is queried at the moment of use. Nothing is cached,
          hardcoded or copy-pasted.
        </p>
      </div>

      {/* live connections */}
      <div className="mt-12 grid gap-4 md:grid-cols-3">
        {(conns.length
          ? conns
          : Object.keys(CONN_META).map((n) => ({ name: n, status: "idle" }))
        ).map((c, i) => {
          const meta = CONN_META[c.name] || { icon: Database, note: "" };
          const Icon = meta.icon;
          const ok = c.status === "connected";
          const err = c.status === "error";
          return (
            <motion.div
              key={c.name + i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="glass rounded-2xl p-5"
            >
              <div className="flex items-center justify-between">
                <Icon size={18} className={ok ? "text-emerald-400" : err ? "text-rose-400" : "text-cream/30"} />
                <span
                  className={`flex items-center gap-1.5 font-mono text-[9px] tracking-widest ${
                    ok ? "text-emerald-400" : err ? "text-rose-400" : "text-cream/35"
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${ok ? "bg-emerald-400 pulse-dot" : err ? "bg-rose-400" : "bg-cream/30"}`} />
                  {ok ? "CONNECTED" : err ? "ERROR" : "IDLE"}
                </span>
              </div>
              <p className="mt-3 text-sm font-medium text-cream">{c.name}</p>
              <p className="mt-0.5 text-[11px] text-cream/40">{meta.note}</p>
              {c.fetched_at && (
                <p className="mt-3 font-mono text-[9px] tracking-wider text-gold-500/70">
                  LAST QUERIED · {new Date(c.fetched_at).toLocaleTimeString("en-IE")}
                </p>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* research brief */}
      <div className="mt-12">
        <h2 className="flex items-center gap-2 font-serif text-2xl text-cream">
          <Radar size={18} className="text-gold-400" /> Opportunity research
        </h2>
        {brief ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass mt-5 rounded-2xl p-8"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="font-mono text-[10px] tracking-widest text-gold-500/70">
                  ELEANOR HAYES · RESEARCH & INTELLIGENCE DIRECTOR
                </p>
                <h3 className="mt-2 max-w-2xl font-serif text-2xl text-cream">{brief.headline}</h3>
              </div>
              <div className="flex items-center gap-3">
                <Score label="OPPORTUNITY" value={brief.opportunity_score} color="#4facfe" />
                <Score label="CONFIDENCE" value={brief.confidence} color="#f6c86a" />
              </div>
            </div>

            <p className="mt-5 max-w-3xl text-sm leading-relaxed text-cream/65">{brief.opportunity}</p>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-cream/55">
              <span className="text-gold-300">Customer opportunity: </span>
              {brief.customer_opportunity}
            </p>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div>
                <p className="flex items-center gap-2 font-mono text-[10px] tracking-widest text-cream/50">
                  <TrendingUp size={12} className="text-gold-400" /> MARKET SIGNALS
                </p>
                <div className="mt-3 space-y-2">
                  {(brief.market_signals || []).map((s, i) => (
                    <div key={i} className="rounded-xl border border-cream/8 bg-ink-950/50 px-4 py-3">
                      <p className="text-[13px] text-cream/80">{s.signal}</p>
                      <p className="mt-0.5 font-mono text-[10px] text-cream/40">
                        {s.evidence} · {s.source}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="flex items-center gap-2 font-mono text-[10px] tracking-widest text-cream/50">
                  <Target size={12} className="text-gold-400" /> EVIDENCE
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {(brief.evidence || []).map((e, i) => (
                    <div key={i} className="rounded-xl border border-cream/8 bg-ink-950/50 px-3 py-2.5">
                      <p className="font-mono text-[9px] tracking-widest text-gold-500/80">{e.key}</p>
                      <p className="mt-0.5 text-[12px] leading-snug text-cream/70">{e.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <p className="text-sm text-cream/55">
                <span className="text-gold-300">Recommended direction: </span>
                {brief.recommended_direction}
              </p>
              <span className="ml-auto rounded-full border border-cream/10 px-3 py-1 font-mono text-[9px] tracking-widest text-cream/45">
                {brief.headline}
              </span>
            </div>
          </motion.div>
        ) : (
          <EmptyState onNavigate={() => navigate("operations")} />
        )}
      </div>

      {/* evidence board */}
      <div className="mt-12">
        <h2 className="flex items-center gap-2 font-serif text-2xl text-cream">
          <Gauge size={18} className="text-gold-400" /> Evidence board
        </h2>
        {op.evidence?.length ? (
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {[...op.evidence].reverse().map((e, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
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
                <p className="mt-2.5 font-mono text-[10.5px] leading-relaxed text-cream/60">{e.summary}</p>
                <p className="mt-2 text-[9px] text-cream/30">{e.source}</p>
              </motion.div>
            ))}
          </div>
        ) : (
          <p className="mt-5 text-sm text-cream/40">
            No evidence recorded yet — run an operation to populate the intelligence board.
          </p>
        )}
      </div>
    </div>
  );
}

function Score({ label, value, color }) {
  return (
    <div className="rounded-xl border px-4 py-2.5 text-center" style={{ borderColor: `${color}44` }}>
      <p className="font-mono text-[8px] tracking-widest text-cream/45">{label}</p>
      <p className="font-serif text-2xl" style={{ color }}>
        {value}
        <span className="text-sm text-cream/40">/100</span>
      </p>
    </div>
  );
}

function EmptyState({ onNavigate }) {
  return (
    <div className="glass mt-5 rounded-2xl p-10 text-center">
      <Radar size={26} className="mx-auto text-gold-500/60" />
      <p className="mt-4 font-serif text-xl text-cream">No research delivered yet</p>
      <p className="mt-2 text-sm text-cream/45">
        Eleanor Hayes investigates live destination and hotel data at the start of every operation.
      </p>
      <button
        onClick={onNavigate}
        className="mt-6 rounded-full bg-gold-fade px-6 py-3 text-sm font-medium text-ink-950"
      >
        Launch an operation
      </button>
    </div>
  );
}
