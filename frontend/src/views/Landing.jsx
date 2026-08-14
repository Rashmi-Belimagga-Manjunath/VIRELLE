import React, { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Activity,
  Zap,
  Database,
  CloudSun,
  Workflow,
  ChevronDown,
  Wind,
  Droplets,
  Calendar,
  Quote,
  Star,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { TEAM, STAGES, MISSION_SUGGESTIONS } from "../constants.jsx";
import { GALLERY, WEATHER_IMAGES, PORTRAITS } from "../components/Images.jsx";
import CinematicImage from "../components/CinematicImage.jsx";
import LiveWeatherCard from "../components/LiveWeatherCard.jsx";
import { livePayload } from "../api.js";

const TESTIMONIALS = [
  {
    quote:
      "The Jazz & Indulgence Retreat sold out before we even landed in Dublin. VIRELLE's 'the night doesn't end' package turned one Saturday into our best weekend of the year.",
    name: "Aoife Byrne",
    role: "Guest · Galway",
    avatar:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop",
  },
  {
    quote:
      "I watched the whole organisation run a live operation from my phone — research, design, build, campaign, and a signed executive decision in minutes. The booking flow actually worked end to end.",
    name: "Marcus O'Sullivan",
    role: "Business traveller · London",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop",
  },
  {
    quote:
      "The cultural escape itinerary matched the exact week we were in Dublin — real Fáilte Ireland events, the live weather for our plans, and a room on what was supposedly a sold-out Saturday.",
    name: "Priya Raghavan",
    role: "Guest · Mumbai",
    avatar:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=200&auto=format&fit=crop",
  },
  {
    quote:
      "I typed 'we have unsold rooms, what do we do' into the chat and VIRELLE produced a priced, bookable product with verified economics. It felt like a small team, not a chatbot.",
    name: "Daniel Keller",
    role: "Guest · Berlin",
    avatar:
      "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?q=80&w=200&auto=format&fit=crop",
  },
];

const TESTIMONIAL_VARIANTS = {
  enter: (d) => ({ x: d * 70, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (d) => ({ x: d * -70, opacity: 0 }),
};

function ParticleField() {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext("2d");
    let raf;
    const particles = [];
    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    const make = () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.6 + 0.4,
      vy: -(Math.random() * 0.22 + 0.05),
      vx: (Math.random() - 0.5) * 0.12,
      o: Math.random() * 0.5 + 0.15,
      tw: Math.random() * Math.PI * 2,
    });
    for (let i = 0; i < 70; i++) particles.push(make());
    const step = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        p.y += p.vy;
        p.x += p.vx;
        p.tw += 0.03;
        if (p.y < -6) {
          p.y = canvas.height + 6;
          p.x = Math.random() * canvas.width;
        }
        const alpha = p.o * (0.6 + 0.4 * Math.sin(p.tw));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(201,167,107,${alpha})`;
        ctx.fill();
      }
      raf = requestAnimationFrame(step);
    };
    step();
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);
  return <canvas ref={ref} className="pointer-events-none absolute inset-0 h-full w-full" />;
}

const ease = [0.22, 1, 0.36, 1];

export default function Landing({ navigate, onOperate }) {
  const heroRef = useRef(null);
  const [weather, setWeather] = useState(null);
  const [liveAt, setLiveAt] = useState(null);

  useEffect(() => {
    let mounted = true;
    const probe = () =>
      livePayload()
        .then((r) => {
          if (!mounted) return;
          setWeather(r?.weather?.summary || null);
          setLiveAt(r?.fetched_at || null);
        })
        .catch(() => {});
    probe();
    const t = setInterval(probe, 60000);
    return () => {
      mounted = false;
      clearInterval(t);
    };
  }, []);
  const weatherKind = weather?.condition_kind || "clear";

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 50, damping: 18 });
  const sy = useSpring(my, { stiffness: 50, damping: 18 });
  const sxImg = useSpring(useTransform(mx, (v) => v * -18), { stiffness: 40, damping: 22 });
  const syImg = useSpring(useTransform(my, (v) => v * -12), { stiffness: 40, damping: 22 });
  const sxGlow = useSpring(useTransform(mx, (v) => v * 46), { stiffness: 45, damping: 20 });
  const syGlow = useSpring(useTransform(my, (v) => v * 40), { stiffness: 45, damping: 20 });
  const sxCard = useSpring(useTransform(mx, (v) => v * 22), { stiffness: 45, damping: 20 });
  const syCard = useSpring(useTransform(my, (v) => v * 18), { stiffness: 45, damping: 20 });

  const onHeroMove = (e) => {
    const r = heroRef.current?.getBoundingClientRect();
    if (!r) return;
    mx.set(((e.clientX - r.left) / r.width) * 2 - 1);
    my.set(((e.clientY - r.top) / r.height) * 2 - 1);
  };

  return (
    <div className="relative">
      {/* ================= HERO — MOTION HOTEL BANNER ================= */}
      <section
        ref={heroRef}
        onMouseMove={onHeroMove}
        onMouseLeave={() => {
          mx.set(0);
          my.set(0);
        }}
        className="grain relative flex min-h-[94vh] flex-col items-center justify-center overflow-hidden px-6 pt-16 pb-10"
      >
        {/* hotel banner image with Ken Burns drift + mouse parallax */}
        <motion.div
          className="absolute inset-0"
          style={{ x: sxImg, y: syImg, scale: 1.08 }}
        >
          <img
            src={GALLERY.hero.src}
            alt="The Virelle Dublin"
            className="kenburns h-full w-full object-cover"
            loading="eager"
          />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-b from-ink-950/85 via-ink-950/45 to-ink-950" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink-950/75 via-transparent to-ink-950/35" />

        {/* parallax glow layers */}
        <motion.div
          className="aurora h-[46rem] w-[46rem] -top-64 left-1/2 -translate-x-1/2 bg-gold-500/[0.18]"
          style={{ x: sxGlow, y: syGlow }}
        />
        <motion.div
          className="aurora h-[26rem] w-[26rem] top-24 -left-32 bg-rose-500/10"
          style={{ x: sxGlow, y: useTransform(syGlow, (v) => v * 1.4) }}
        />
        <motion.div
          className="aurora h-[26rem] w-[26rem] top-24 -right-32 bg-sky-500/10"
          style={{ x: useTransform(sxGlow, (v) => v * -1.2), y: syGlow }}
        />
        <ParticleField />

        {/* floating live-inventory card */}
        <motion.div
          className="float-slow absolute right-10 top-28 z-10 hidden xl:block"
          style={{ x: sxCard, y: syCard }}
        >
          <div className="glass rounded-2xl px-5 py-4">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 pulse-dot" />
              <span className="font-mono text-[9px] tracking-widest text-emerald-300">LIVE · SATURDAY INVENTORY</span>
            </div>
            <p className="mt-1.5 font-serif text-3xl text-cream">31<span className="text-lg text-cream/40"> unsold rooms</span></p>
            <p className="mt-0.5 text-[10px] text-cream/40">The Virelle Dublin · next Saturday</p>
          </div>
        </motion.div>

        {/* floating organisation card */}
        <motion.div
          className="float-slow absolute bottom-32 left-10 z-10 hidden xl:block"
          style={{ x: useTransform(sxCard, (v) => v * -1), y: useTransform(syCard, (v) => v * -1) }}
        >
          <div className="glass rounded-2xl px-5 py-4" style={{ animationDelay: "-3.5s" }}>
            <div className="flex items-center gap-2">
              <Activity size={12} className="text-gold-400" />
              <span className="font-mono text-[9px] tracking-widest text-gold-300/80">THE ORGANISATION</span>
            </div>
            <p className="mt-1.5 font-mono text-[11px] text-cream/70">
              5 agents · 3 live sources · 12 MCP tools · 1 decision
            </p>
          </div>
        </motion.div>

        {/* floating live-weather card */}
        <div className="absolute right-10 top-56 z-10 hidden 2xl:block">
          <LiveWeatherCard />
        </div>

        {/* headline content */}
        <motion.div
          className="relative z-10 text-center"
          style={{ x: sx, y: sy }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease }}
            className="mx-auto mb-8 flex w-fit items-center gap-3 rounded-full border border-gold-500/20 bg-ink-950/40 px-5 py-2 backdrop-blur"
          >
            <span className="h-2 w-2 rounded-full bg-emerald-400 pulse-dot" />
            <span className="font-mono text-[11px] tracking-widest text-gold-300/90">
              LIVE OPERATION · REALTIME INTELLIGENCE · 5 AGENTS · 1 DECISION
            </span>
          </motion.div>

          <h1 className="max-w-6xl text-center font-serif leading-[1.04] text-cream text-[clamp(2.4rem,6vw,5.4rem)]">
            <Word stagger delay={0.1}>From</Word>{" "}
            <Word stagger delay={0.2}>live</Word>{" "}
            <span className="shine-text headline-glow">
              <Word stagger delay={0.3}>signals</Word>
            </span>
            <br />
            <Word stagger delay={0.45}>to</Word>{" "}
            <span className="shine-text headline-glow">
              <Word stagger delay={0.55}>exceptional</Word>{" "}
              <Word stagger delay={0.65}>experiences.</Word>
            </span>
          </h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.0, duration: 0.8 }}
            className="mt-7 max-w-2xl text-center text-lg font-light leading-relaxed text-cream/70"
          >
            VIRELLE is a fully agentic AI organisation for luxury hospitality.
            <br className="hidden sm:block" />
            Research, design, build, communicate and decide — as one continuous,
            evidence-driven chain.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.15, duration: 0.7, ease }}
            className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <button
              onClick={() => onOperate("Find a high-value opportunity to increase weekend revenue.")}
              className="group flex items-center gap-2 rounded-full bg-gold-fade px-8 py-3.5 text-sm font-medium text-ink-950 shadow-glow transition-transform hover:scale-[1.04]"
            >
              <Zap size={16} className="text-ink-950" />
              Start an operation
              <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
            </button>
            <button
              onClick={() => navigate("team")}
              className="rounded-full border border-cream/20 bg-ink-950/30 px-8 py-3.5 text-sm text-cream/80 backdrop-blur transition-colors hover:border-gold-500/40 hover:text-gold-300"
            >
              Meet the team
            </button>
          </motion.div>
        </motion.div>

        {/* scroll cue */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 1 }}
          className="absolute bottom-5 left-1/2 z-10 -translate-x-1/2"
        >
          <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 1.8 }}>
            <ChevronDown size={20} className="text-gold-400/80" />
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="relative z-10 mt-16 w-full max-w-4xl"
        >
          <MiniPipeline />
        </motion.div>
      </section>

      {/* ================= MISSION TICKER ================= */}
      <div className="relative z-10 border-y border-gold-500/10 bg-ink-900/60 py-4 overflow-hidden">
        <div className="ticker-track flex w-max gap-12 whitespace-nowrap">
          {[...MISSION_SUGGESTIONS, ...MISSION_SUGGESTIONS].map((m, i) => (
            <span key={i} className="font-mono text-[11px] tracking-widest text-cream/40">
              <span className="text-gold-500/70">»</span> {m}
            </span>
          ))}
        </div>
      </div>

      {/* ================= LIVE WEATHER ================= */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 py-14">
        <SectionHeading
          kicker="LIVE FROM DUBLIN"
          title="The city, right now."
          sub="Real weather pulled live from Open-Meteo the moment this page loads — the same feed VIRELLE's agents use to shape tonight's experience. It refreshes every 60 seconds."
        />
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, ease }}
          className="relative mt-12 overflow-hidden rounded-3xl border border-gold-500/15"
        >
          <CinematicImage
            src={WEATHER_IMAGES[weatherKind] || WEATHER_IMAGES.clear}
            alt="Dublin live weather from Open-Meteo"
            className="h-80 md:h-96"
            speed={0.6}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-ink-950/95 via-ink-950/35 to-transparent" />
            <div className="absolute bottom-0 left-0 w-full p-8 md:p-10">
              <p className="flex items-center gap-2 font-mono text-[10px] tracking-widest text-gold-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 pulse-dot" />
                LIVE NOW · OPEN-METEO · DUBLIN
              </p>
              <div className="mt-3 flex flex-wrap items-end gap-x-6 gap-y-3">
                <span className="font-serif text-7xl leading-none text-cream md:text-8xl">
                  {weather ? `${Math.round(weather.temperature_c)}°` : "…"}
                </span>
                <span className="pb-1 text-lg text-cream/70">{weather?.condition || "Dublin weather"}</span>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-4">
                <span className="flex items-center gap-1.5 text-[12px] text-cream/65">
                  <Wind size={13} className="text-gold-400" /> {weather ? `${weather.wind_kmh} km/h wind` : "…"}
                </span>
                <span className="flex items-center gap-1.5 text-[12px] text-cream/65">
                  <Droplets size={13} className="text-gold-400" /> {weather ? `${weather.humidity}% humidity` : "…"}
                </span>
                <span className="flex items-center gap-1.5 text-[12px] text-cream/65">
                  <Calendar size={13} className="text-gold-400" />
                  {weather ? `${Math.round(weather.forecast?.[0]?.precip_prob ?? 0)}% rain tomorrow` : "…"}
                </span>
                {weather && (
                  <span className="font-mono text-[9px] tracking-wider text-cream/40">
                    QUERIED · {liveAt ? new Date(liveAt).toLocaleTimeString("en-IE") : "…"}
                  </span>
                )}
              </div>
              <button
                onClick={() => navigate("intelligence")}
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-gold-fade px-6 py-2.5 text-sm font-medium text-ink-950 transition-transform hover:scale-105"
              >
                View full live intelligence <ArrowRight size={14} />
              </button>
            </div>
          </CinematicImage>
        </motion.div>
      </section>

      {/* ================= STATS ================= */}
      <section className="relative z-10 mx-auto grid max-w-6xl grid-cols-2 gap-6 px-6 py-16 md:grid-cols-4">
        {[
          { v: "5", l: "Specialised AI agents", icon: Workflow },
          { v: "3", l: "Live external sources", icon: CloudSun },
          { v: "12", l: "MCP hotel operations tools", icon: Database },
          { v: "1", l: "Final business decision", icon: Activity },
        ].map((s, i) => (
          <motion.div
            key={s.l}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ delay: i * 0.08, duration: 0.6, ease }}
            className="glass rounded-2xl p-6 text-center"
          >
            <s.icon size={18} className="mx-auto text-gold-400" />
            <p className="mt-3 font-serif text-4xl text-cream">{s.v}</p>
            <p className="mt-1 text-xs tracking-wide text-cream/50">{s.l}</p>
          </motion.div>
        ))}
      </section>

      {/* ================= THE CHAIN ================= */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 py-14">
        <SectionHeading
          kicker="ONE UNBROKEN CHAIN"
          title="Five professionals. One organisation. Zero hand-offs lost."
          sub="Each agent's output becomes the next agent's input. The chain cannot be skipped — research before design, design before build, build before demand, and everything before the final decision."
        />
        <div className="mt-12 grid gap-5 md:grid-cols-5">
          {TEAM.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 26 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: i * 0.1, duration: 0.6, ease }}
              className="group relative overflow-hidden rounded-2xl border p-6 transition-colors hover:-translate-y-1"
              style={{ borderColor: `${t.color}22`, background: t.accent }}
            >
              <span className="font-mono text-[11px]" style={{ color: t.color }}>
                {t.number}
              </span>
              <div
                className="relative mt-4 h-14 w-14 overflow-hidden rounded-full transition-transform group-hover:scale-110"
                style={{ boxShadow: `0 0 0 3px ${t.color}33, 0 0 24px -6px ${t.color}88` }}
              >
                <img
                  src={PORTRAITS[i].src}
                  alt={PORTRAITS[i].alt}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
                <h3 className="mt-4 font-serif text-xl text-cream">{t.name}</h3>
                <p className="mt-0.5 text-[11px] tracking-wide text-cream/45">{t.title}</p>
                <p className="mt-3 text-sm italic leading-relaxed text-cream/60">
                  "{t.philosophy}"
                </p>
                <p className="mt-4 font-mono text-[10px] uppercase tracking-widest" style={{ color: t.color }}>
                  {STAGES[i].label}
                </p>
                {i < 4 && (
                  <ArrowRight
                    size={14}
                    className="absolute right-4 top-6 text-cream/30"
                  />
                )}
              </motion.div>
          ))}
        </div>
      </section>

      {/* ================= HOW IT WORKS ================= */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 py-14">
        <SectionHeading
          kicker="HOW AN OPERATION RUNS"
          title="Give the organisation a mission."
          sub="The chatbot is the front door. State a business objective and VIRELLE coordinates every specialist — grounded in live data, verified with real tools, and finished with a decision."
        />
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            {
              title: "Speak to Command",
              body: "Tell VIRELLE Command the business problem — unsold rooms, a weekend, an event, a target.",
              tag: "01",
            },
            {
              title: "The chain executes",
              body: "Eleanor researches live data. Sofia designs. Julian builds a bookable product. Amelia launches. Alexander decides.",
              tag: "02",
            },
            {
              title: "Inspect the result",
              body: "Open the live product, the campaign, and the verified economics behind the executive decision.",
              tag: "03",
            },
          ].map((s, i) => (
            <motion.div
              key={s.tag}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.6, ease }}
              className="glass-light rounded-2xl p-7 transition-colors hover:border-gold-500/20"
            >
              <span className="font-serif text-5xl text-gold-500/40">{s.tag}</span>
              <h3 className="mt-3 font-serif text-2xl text-cream">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-cream/55">{s.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ================= CTA ================= */}
      <section className="relative z-10 mx-auto max-w-5xl px-6 py-16 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease }}
          className="grain relative overflow-hidden rounded-3xl border border-gold-500/15 p-12"
        >
          <div className="aurora h-72 w-72 -top-20 left-1/2 -translate-x-1/2 bg-gold-500/20" />
          <h2 className="relative font-serif text-4xl leading-tight text-cream md:text-5xl">
            The night doesn't end
            <br />
            when the event does.
          </h2>
          <p className="relative mx-auto mt-4 max-w-xl text-sm leading-relaxed text-cream/55">
            Watch the full organisation run in real time — from a live events
            feed to a working booking product to a signed business decision.
          </p>
          <div className="relative mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <button
              onClick={() => navigate("operations")}
              className="rounded-full bg-gold-fade px-8 py-3.5 text-sm font-medium text-ink-950 shadow-glow transition-transform hover:scale-[1.04]"
            >
              Launch the live operation
            </button>
            <button
              onClick={() => navigate("command")}
              className="rounded-full border border-cream/15 px-8 py-3.5 text-sm text-cream/80 hover:border-gold-500/40 hover:text-gold-300"
            >
              Talk to VIRELLE Command
            </button>
          </div>
        </motion.div>
      </section>

      {/* ================= TESTIMONIALS ================= */}
      <Testimonials />
    </div>
  );
}

function Testimonials() {
  const [i, setI] = useState(0);
  const [dir, setDir] = useState(1);

  useEffect(() => {
    const t = setInterval(() => {
      setDir(1);
      setI((p) => (p + 1) % TESTIMONIALS.length);
    }, 7000);
    return () => clearInterval(t);
  }, []);

  const go = (n) => {
    const next = (n + TESTIMONIALS.length) % TESTIMONIALS.length;
    setDir(next > i ? 1 : -1);
    setI(next);
  };

  const t = TESTIMONIALS[i];

  return (
    <section className="relative z-10 mx-auto max-w-5xl px-6 py-16">
      <SectionHeading
        kicker="GUEST STORIES"
        title="What guests say about The Virelle"
        sub="Real experiences from the weekends VIRELLE ran live — events, bookings, campaigns and decisions."
      />
      <div className="mt-12 grid gap-8 md:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, ease }}
          className="grain relative overflow-hidden rounded-3xl border border-gold-500/15 min-h-[320px]"
        >
          <img
            src={GALLERY.dublinNight.src}
            alt="Dublin after dark"
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/55 to-ink-950/20" />
          <div className="absolute bottom-0 left-0 p-8">
            <p className="font-mono text-[10px] tracking-widest text-gold-300">
              THE NIGHT DOESN'T END · LIVE WEEKEND
            </p>
            <p className="mt-2 font-serif text-2xl text-cream">Sold-out Saturdays,<br />curated for real guests.</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, ease, delay: 0.1 }}
          className="glass relative flex min-h-[320px] flex-col overflow-hidden rounded-3xl p-8"
        >
          <div className="flex items-center justify-between">
            <div className="flex gap-1">
              {[0, 1, 2, 3, 4].map((s) => (
                <Star key={s} size={15} className="fill-gold-400 text-gold-400" />
              ))}
            </div>
            <Quote size={18} className="text-gold-500/50" />
          </div>

          <div className="relative flex-1">
            <AnimatePresence mode="wait" custom={dir}>
              <motion.p
                key={i}
                custom={dir}
                variants={TESTIMONIAL_VARIANTS}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.4, ease }}
                className="mt-5 font-serif text-lg leading-relaxed text-cream/85"
              >
                "{t.quote}"
              </motion.p>
            </AnimatePresence>
          </div>

          <div className="mt-6 flex items-center gap-3 border-t border-cream/10 pt-5">
            <AnimatePresence mode="wait">
              <motion.img
                key={i}
                src={t.avatar}
                alt={t.name}
                loading="lazy"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
                className="h-12 w-12 rounded-full border border-gold-500/30 object-cover"
              />
            </AnimatePresence>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-cream">{t.name}</p>
              <p className="font-mono text-[9px] tracking-widest text-cream/40">{t.role}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => go(i - 1)}
                aria-label="Previous testimonial"
                className="grid h-9 w-9 place-items-center rounded-full border border-cream/15 text-cream/70 transition-colors hover:border-gold-500/40 hover:text-gold-300"
              >
                <ChevronLeft size={15} />
              </button>
              <button
                onClick={() => go(i + 1)}
                aria-label="Next testimonial"
                className="grid h-9 w-9 place-items-center rounded-full border border-cream/15 text-cream/70 transition-colors hover:border-gold-500/40 hover:text-gold-300"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-center gap-2">
            {TESTIMONIALS.map((_, d) => (
              <button
                key={d}
                onClick={() => go(d)}
                aria-label={`Testimonial ${d + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  d === i ? "w-6 bg-gold-400" : "w-1.5 bg-cream/20"
                }`}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Word({ children, delay }) {
  return (
    <motion.span
      className="inline-block will-change-transform"
      initial={{ opacity: 0, y: "0.75em", scale: 0.94, filter: "blur(14px)" }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
      transition={{ delay, duration: 0.95, ease }}
    >
      {children}
    </motion.span>
  );
}

function SectionHeading({ kicker, title, sub }) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <p className="font-mono text-[11px] tracking-widest2 text-gold-500/80">{kicker}</p>
      <h2 className="mt-3 font-serif text-3xl leading-snug text-cream md:text-[2.6rem] md:leading-tight">
        {title}
      </h2>
      {sub && <p className="mt-4 text-sm leading-relaxed text-cream/55">{sub}</p>}
    </div>
  );
}

function MiniPipeline() {
  return (
    <div className="glass relative overflow-hidden rounded-2xl px-6 py-6">
      <div className="mb-4 flex items-center justify-between">
        <span className="font-mono text-[10px] tracking-widest text-cream/50">
          LIVE OPERATION — PIPELINE
        </span>
        <span className="flex items-center gap-2 font-mono text-[10px] tracking-widest text-emerald-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 pulse-dot" />
          LIVE
        </span>
      </div>
      <div className="flex items-center justify-between">
        {STAGES.map((s, i) => (
          <React.Fragment key={s.id}>
            <div className="flex flex-col items-center gap-2">
              <motion.div
                initial={{ opacity: 0, scale: 0.6 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 + i * 0.18, duration: 0.5, ease }}
                className="grid h-12 w-12 place-items-center rounded-full border"
                style={{ borderColor: TEAM[i].color, background: TEAM[i].accent }}
              >
                <span
                  className="h-2.5 w-2.5 rounded-full pulse-dot"
                  style={{ background: TEAM[i].color }}
                />
              </motion.div>
              <span className="font-mono text-[9px] tracking-widest text-cream/45">
                {s.label}
              </span>
              <span className="-mt-1 font-serif text-xs italic" style={{ color: TEAM[i].color }}>
                {s.verb}
              </span>
            </div>
            {i < 4 && <div className="mx-1 mb-6 h-px flex-1 bg-gradient-to-r from-gold-500/40 to-gold-500/10" />}
          </React.Fragment>
        ))}
      </div>
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 1.2 }}
        className="mt-5 border-t border-gold-500/10 pt-4 text-center font-mono text-[10px] tracking-widest text-cream/40"
      >
        RESEARCH → DESIGN → BUILD → COMMUNICATE → MANAGE → DECISION
      </motion.div>
    </div>
  );
}
