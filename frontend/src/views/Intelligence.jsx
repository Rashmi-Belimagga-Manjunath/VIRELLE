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
  RefreshCw,
  Droplets,
  Wind,
  Calendar,
  MapPin,
} from "lucide-react";
import { connectionsLive, livePayload } from "../api.js";
import { useOperation } from "../hooks/useOperation.js";
import CinematicImage from "../components/CinematicImage.jsx";
import SectionHero from "../components/SectionHero.jsx";
import { WEATHER_IMAGES, GALLERY } from "../components/Images.jsx";

const CONN_META = {
  "Fáilte Ireland Events API": { icon: Cloud, note: "Live Irish tourism events feed" },
  "Open-Meteo Weather API": { icon: CloudSun, note: "Live Dublin forecast" },
  "Fáilte Ireland Tourism": { icon: Activity, note: "Live Fáilte Ireland attractions & experiences" },
  "Hospitality Operations MCP": { icon: Server, note: "Hotel operational tools" },
  "Hotel Database (SQLite)": { icon: Database, note: "Real queryable hotel data" },
};

export default function Intelligence({ opId, navigate }) {
  const { op } = useOperation(opId);
  const [conns, setConns] = useState([]);
  const [live, setLive] = useState(null);
  const [probing, setProbing] = useState(false);

  useEffect(() => {
    let mounted = true;
    const probe = () =>
      connectionsLive()
        .then((r) => mounted && setConns(r.connections))
        .catch(() => {});
    probe();
    const t = setInterval(probe, 20000);
    return () => {
      mounted = false;
      clearInterval(t);
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    livePayload().then((r) => mounted && setLive(r)).catch(() => {});
    const t = setInterval(
      () => livePayload().then((r) => mounted && setLive(r)).catch(() => {}),
      60000
    );
    return () => {
      mounted = false;
      clearInterval(t);
    };
  }, []);

  const recheck = () => {
    setProbing(true);
    connectionsLive()
      .then((r) => setConns(r.connections))
      .finally(() => setProbing(false));
  };

  const brief =
    op.agents?.find((a) => a.id === "researcher")?.output?.opportunity_brief || null;

  const weather = live?.weather?.summary || null;
  const weatherKind = weather?.condition_kind || "clear";
  const events = live?.events?.events || [];
  const dest = live?.destination?.summary || null;
  const liveAt = live?.fetched_at || null;

  return (
    <>
      <SectionHero
        chapter="Chapter 03 · The Evidence"
        kicker="VIRELLE INTELLIGENCE"
        title="Live data, evidence, research"
        sub="Every source below is queried at the moment of use — nothing is cached, hardcoded or copy-pasted."
        image={GALLERY.dublin.src}
        imageAlt="Dublin live intelligence"
      />
      <div className="relative z-10 mx-auto max-w-7xl px-6 py-12">

      {/* ===== LIVE NOW — real-time imagery banner ===== */}
      <div className="mt-10 grid gap-5 lg:grid-cols-3">
        {/* weather photo banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2"
        >
          <div className="relative overflow-hidden rounded-3xl border border-gold-500/15">
            <CinematicImage
              src={WEATHER_IMAGES[weatherKind] || WEATHER_IMAGES.clear}
              alt={weather?.condition || "Dublin weather"}
              className="h-72 md:h-80"
              speed={0.7}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-ink-950/90 via-ink-950/25 to-transparent" />
              <div className="absolute bottom-0 left-0 p-7">
                <p className="flex items-center gap-2 font-mono text-[10px] tracking-widest text-gold-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 pulse-dot" />
                  LIVE NOW · OPEN-METEO · DUBLIN
                </p>
                {weather ? (
                  <>
                    <div className="mt-2 flex items-end gap-3">
                      <span className="font-serif text-7xl leading-none text-cream">
                        {Math.round(weather.temperature_c)}°
                      </span>
                      <span className="pb-1 text-lg text-cream/70">{weather.condition}</span>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-4">
                      <span className="flex items-center gap-1.5 text-[12px] text-cream/60">
                        <Wind size={13} className="text-gold-400" /> {weather.wind_kmh} km/h wind
                      </span>
                      <span className="flex items-center gap-1.5 text-[12px] text-cream/60">
                        <Droplets size={13} className="text-gold-400" /> {weather.humidity}% humidity
                      </span>
                      <span className="flex items-center gap-1.5 text-[12px] text-cream/60">
                        <Calendar size={13} className="text-gold-400" />
                        {Math.round(weather.forecast?.[0]?.precip_prob ?? 0)}% rain tomorrow
                      </span>
                    </div>
                  </>
                ) : (
                  <p className="mt-2 text-sm text-cream/50">Weather feed unreachable right now.</p>
                )}
              </div>
            </CinematicImage>
          </div>
        </motion.div>

        {/* destination + next event column */}
        <div className="grid gap-5">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative overflow-hidden rounded-3xl border border-gold-500/15"
          >
            <CinematicImage
              src={GALLERY.dublinNight.src}
              alt="Dublin — live destination interest"
              className="h-40"
              speed={0.8}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-ink-950/90 via-ink-950/30 to-transparent" />
              <div className="absolute bottom-0 left-0 p-5">
                <p className="font-mono text-[10px] tracking-widest text-gold-300">DESTINATION SIGNALS</p>
                {dest ? (
                  <p className="mt-1 font-serif text-lg text-cream">
                    {dest.trend === "rising" ? "Dublin interest is rising" : `Dublin interest is ${dest.trend}`}
                    <span className="ml-2 font-mono text-sm text-emerald-400">{dest.trend_pct > 0 ? "+" : ""}{dest.trend_pct}% WoW</span>
                  </p>
                ) : (
                  <p className="mt-1 text-sm text-cream/50">No pageview data.</p>
                )}
              </div>
            </CinematicImage>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            className="glass relative overflow-hidden rounded-3xl p-5"
          >
            <div className="flex items-center justify-between">
              <p className="font-mono text-[10px] tracking-widest text-gold-300">
                NEXT LIVE EVENT
              </p>
              <span className="font-mono text-[9px] text-cream/35">
                {events.length ? `${events.length} in window` : "…"}
              </span>
            </div>
            {events.length ? (
              <div className="mt-3 flex gap-4">
                <CinematicImage
                  src={events[0].image || GALLERY.event.src}
                  alt={events[0].name}
                  className="h-20 w-20 shrink-0 rounded-xl"
                  speed={0.4}
                />
                <div className="min-w-0">
                  <p className="truncate font-serif text-base text-cream">{events[0].name}</p>
                  <p className="mt-1 flex items-center gap-1 text-[11px] text-cream/50">
                    <MapPin size={11} className="text-gold-400" /> {events[0].venue || "Dublin"}
                  </p>
                  <p className="mt-0.5 font-mono text-[10px] text-gold-400/80">
                    {events[0].start_date}
                  </p>
                </div>
              </div>
            ) : (
              <p className="mt-3 text-sm text-cream/50">No Dublin events in the next two weeks.</p>
            )}
          </motion.div>
        </div>
      </div>

      {/* ===== LIVE CONNECTIONS ===== */}
      <div className="mt-12 flex items-center justify-between">
        <h2 className="font-serif text-2xl text-cream">Live connections</h2>
        <button
          onClick={recheck}
          disabled={probing}
          className="flex items-center gap-2 rounded-full border border-gold-500/25 px-4 py-2 font-mono text-[10px] tracking-widest text-gold-300 transition-colors hover:bg-gold-500/10 disabled:opacity-50"
        >
          <RefreshCw size={12} className={probing ? "animate-spin" : ""} />
          RECHECK NOW
        </button>
      </div>
      {liveAt && (
        <p className="mt-1 font-mono text-[10px] tracking-wider text-cream/35">
          LIVE SNAPSHOT · {new Date(liveAt).toLocaleTimeString("en-IE")}
        </p>
      )}

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        {(conns.length
          ? conns
          : Object.keys(CONN_META).map((n) => ({ name: n, status: "checking" }))
        ).map((c, i) => {
          const meta = CONN_META[c.name] || { icon: Database, note: "" };
          const Icon = meta.icon;
          const ok = c.status === "connected";
          const err = c.status === "error";
          const statusLabel = ok ? "CONNECTED" : err ? "ERROR" : c.status === "checking" ? "CHECKING" : "IDLE";
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
                  {statusLabel}
                </span>
              </div>
              <p className="mt-3 text-sm font-medium text-cream">{c.name}</p>
              <p className="mt-0.5 text-[11px] text-cream/40">{meta.note}</p>
              {c.detail && (
                <p className="mt-2.5 font-mono text-[10px] leading-relaxed text-cream/60">
                  <span className="text-gold-400/80">› </span>
                  {c.detail}
                </p>
              )}
              {c.fetched_at && (
                <p className="mt-2 font-mono text-[9px] tracking-wider text-gold-500/70">
                  QUERIED · {new Date(c.fetched_at).toLocaleTimeString("en-IE")}
                </p>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* ===== LIVE EVENTS — real photos from the feed ===== */}
      {events.length > 0 && (
        <div className="mt-12">
          <h2 className="flex items-center gap-2 font-serif text-2xl text-cream">
            <Cloud size={18} className="text-gold-400" /> Live Dublin events
          </h2>
          <p className="mt-1 text-[12px] text-cream/45">
            Real listings pulled from the Fáilte Ireland feed, imagery included.
          </p>
          <div className="mt-5 flex gap-4 overflow-x-auto pb-3">
            {events.slice(0, 8).map((e, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="w-64 shrink-0 overflow-hidden rounded-2xl border border-cream/8 bg-ink-900/50"
              >
                <CinematicImage
                  src={e.image || GALLERY.event.src}
                  alt={e.name}
                  className="h-32"
                  speed={0.5}
                />
                <div className="p-4">
                  <p className="font-mono text-[9px] tracking-widest text-gold-500/80">
                    {e.start_date}
                  </p>
                  <p className="mt-1 truncate font-serif text-base text-cream">{e.name}</p>
                  <p className="mt-1 flex items-center gap-1 text-[10px] text-cream/45">
                    <MapPin size={10} className="text-gold-400" /> {e.venue || e.county}
                  </p>
                  {e.price && !e.free && (
                    <p className="mt-1.5 font-mono text-[10px] text-cream/60">{e.price}</p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

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
    </>
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
