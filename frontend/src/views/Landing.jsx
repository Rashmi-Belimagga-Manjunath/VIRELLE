import React, { useEffect, useRef, useState } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useScroll,
  useInView,
  AnimatePresence,
} from "framer-motion";
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
  Send,
  Mail,
  Phone,
  MapPin,
  Clock,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { TEAM, STAGES, MISSION_SUGGESTIONS } from "../constants.jsx";
import { GALLERY, WEATHER_IMAGES, PORTRAITS } from "../components/Images.jsx";
import CinematicImage from "../components/CinematicImage.jsx";
import LiveWeatherCard from "../components/LiveWeatherCard.jsx";
import { livePayload, submitContact } from "../api.js";

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

const CHAPTERS = [
  { id: "signal", label: "The Signal" },
  { id: "city", label: "The City" },
  { id: "stay", label: "The House" },
  { id: "chain", label: "The Chain" },
  { id: "method", label: "The Method" },
  { id: "proof", label: "Proof" },
  { id: "contact", label: "Contact" },
];

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
      <StoryRail />
      {/* ================= HERO — MOTION HOTEL BANNER ================= */}
      <section
        ref={heroRef}
        id="signal"
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

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="mb-6 font-mono text-[10px] tracking-[0.5em] text-cream/45"
          >
            EST. 2026 · DUBLIN
          </motion.p>

          <h1 className="max-w-6xl text-center font-serif leading-[1.04] text-cream text-[clamp(2.4rem,6vw,5.4rem)]">
            <Word stagger delay={0.1}>From</Word>{" "}
            <Word stagger delay={0.2}>live</Word>{" "}
            <span className="shine-text">
              <Word stagger delay={0.3}>signals</Word>
            </span>
            <br />
            <Word stagger delay={0.45}>to</Word>{" "}
            <span className="shine-text">
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
      <section id="city" className="relative z-10 mx-auto max-w-6xl px-6 py-14">
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
          { v: 5, l: "Specialised AI agents", icon: Workflow },
          { v: 3, l: "Live external sources", icon: CloudSun },
          { v: 12, l: "MCP hotel operations tools", icon: Database },
          { v: 1, l: "Final business decision", icon: Activity },
        ].map((s, i) => (
          <Stat key={s.l} value={s.v} label={s.l} icon={s.icon} delay={i * 0.08} />
        ))}
      </section>

      {/* ================= INTERLUDE · THE SIGNAL ================= */}
      <Interlude
        image={GALLERY.rooftop.src}
        kicker="THE SIGNAL"
        title="Every operation starts with a signal."
        sub="A Friday evening. A sold-out event across the Liffey. 31 unsold rooms upstairs. The organisation wakes up."
      />

      {/* ================= THE HOUSE · GALLERY ================= */}
      <GalleryShowcase />

      {/* ================= THE CHAIN ================= */}
      <section id="chain" className="relative z-10 mx-auto max-w-6xl px-6 py-14">
        <SectionHeading
          kicker="ONE UNBROKEN CHAIN"
          title="Five professionals. One organisation. Zero hand-offs lost."
          sub="Each agent's output becomes the next agent's input. The chain cannot be skipped — research before design, design before build, build before demand, and everything before the final decision."
        />
        <ChainIndex />
      </section>

      {/* ================= HOW IT WORKS ================= */}
      <section id="method" className="relative z-10 mx-auto max-w-6xl px-6 py-14">
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

      {/* ================= INTERLUDE · THE METHOD ================= */}
      <Interlude
        image={GALLERY.room.src}
        kicker="THE METHOD"
        title="One conversation. Five specialists."
        sub="Research, design, build, communicate, decide — a chain that cannot be skipped, and evidence that cannot be faked."
      />

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

      {/* ================= QUESTIONS ================= */}
      <Faq />

      {/* ================= CONTACT ================= */}
      <Contact />
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
    <section id="proof" className="relative z-10 mx-auto max-w-5xl px-6 py-16">
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

function Stat({ value, label, icon: Icon, delay }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const duration = 900;
    const start = performance.now();
    let raf;
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      setDisplay(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ delay, duration: 0.6, ease }}
      className="glass rounded-2xl p-6 text-center"
    >
      <Icon size={18} className="mx-auto text-gold-400" />
      <p className="mt-3 font-serif text-4xl text-cream tabular-nums">{display}</p>
      <p className="mt-1 text-xs tracking-wide text-cream/50">{label}</p>
    </motion.div>
  );
}

function Interlude({ image, kicker, title, sub }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [70, -70]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.9, 1.02, 1.08]);
  const opacity = useTransform(scrollYProgress, [0, 0.12, 0.85, 1], [0, 1, 1, 0]);

  return (
    <section ref={ref} className="relative z-10 h-[130vh]">
      <div className="sticky top-0 flex h-screen items-center justify-center overflow-hidden">
        <motion.div style={{ y, scale }} className="absolute inset-0">
          <img src={image} alt="" className="kenburns h-full w-full object-cover" loading="lazy" />
        </motion.div>
        <div className="absolute inset-0 bg-ink-950/80" />
        <div className="aurora h-96 w-96 bg-gold-500/10" />
        <motion.div style={{ opacity }} className="relative z-10 max-w-3xl px-6 text-center">
          <p className="font-mono text-[11px] tracking-widest2 text-gold-400">{kicker}</p>
          <h2 className="mt-4 font-serif text-4xl leading-tight text-cream md:text-6xl">{title}</h2>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-cream/60">{sub}</p>
        </motion.div>
      </div>
    </section>
  );
}

function StoryRail() {
  const [active, setActive] = useState("signal");

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
      },
      { rootMargin: "-40% 0px -50% 0px" }
    );
    for (const c of CHAPTERS) {
      const el = document.getElementById(c.id);
      if (el) obs.observe(el);
    }
    return () => obs.disconnect();
  }, []);

  return (
    <nav className="fixed left-7 top-1/2 z-30 hidden -translate-y-1/2 flex-col gap-6 xl:flex">
      {CHAPTERS.map((c) => (
        <button
          key={c.id}
          onClick={() => document.getElementById(c.id)?.scrollIntoView({ behavior: "smooth" })}
          className="group flex items-center gap-3 text-left"
        >
          <span
            className={`h-px transition-all duration-300 ${
              active === c.id
                ? "w-10 bg-gold-400"
                : "w-5 bg-cream/25 group-hover:w-8 group-hover:bg-gold-500/50"
            }`}
          />
          <span
            className={`font-mono text-[10px] tracking-widest transition-colors ${
              active === c.id ? "text-gold-300" : "text-cream/40 group-hover:text-cream/70"
            }`}
          >
            {c.label.toUpperCase()}
          </span>
        </button>
      ))}
    </nav>
  );
}

const CONTACT_INFO = [
  { icon: MapPin, label: "ADDRESS", value: "The Virelle Dublin, 4 College Green, Dublin 2, Ireland" },
  { icon: Phone, label: "CONCIERGE", value: "+353 1 555 0147" },
  { icon: Mail, label: "EMAIL", value: "concierge@virelle.ie" },
  { icon: Clock, label: "HOURS", value: "Concierge · 24/7 — Command deck · always live" },
];

function Contact() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [status, setStatus] = useState("idle");
  const [err, setErr] = useState("");

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setStatus("sending");
    setErr("");
    try {
      await submitContact(form);
      setStatus("ok");
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch (ex) {
      setStatus("error");
      setErr(ex.message || "Could not reach the concierge. Try again.");
    }
  };

  const inputCls =
    "w-full rounded-xl border border-cream/10 bg-ink-950/50 px-4 py-3 text-sm text-cream placeholder:text-cream/30 outline-none transition-colors focus:border-gold-500/40";

  return (
    <section id="contact" className="relative z-10 mx-auto max-w-6xl px-6 py-16">
      <SectionHeading
        kicker="CONTACT THE CONCIERGE"
        title="Begin a conversation."
        sub="A question, a stay, or a mission for the organisation — the concierge desk and the command deck both read every message. Live, as always."
      />
      <div className="mt-12 grid gap-6 md:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, ease }}
          className="glass rounded-3xl p-8"
        >
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 pulse-dot" />
            <span className="font-mono text-[10px] tracking-widest text-emerald-300">
              THE CONCIERGE IS ON DUTY
            </span>
          </div>
          <h3 className="mt-5 font-serif text-3xl text-cream">The Virelle Dublin</h3>
          <p className="mt-2 text-sm leading-relaxed text-cream/55">
            Centre of the city, one block from the river. If the night doesn't
            end when the event does — this is where it begins.
          </p>
          <div className="mt-8 space-y-5">
            {CONTACT_INFO.map((row) => (
              <div key={row.label} className="flex items-start gap-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-gold-500/20 bg-gold-500/5">
                  <row.icon size={15} className="text-gold-400" />
                </span>
                <div>
                  <p className="font-mono text-[9px] tracking-widest text-gold-500/70">{row.label}</p>
                  <p className="mt-0.5 text-sm text-cream/80">{row.value}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 border-t border-cream/10 pt-6">
            <p className="font-mono text-[10px] tracking-widest text-cream/40">
              RESPONSE · WITHIN ONE OPERATION CYCLE
            </p>
            <div className="mt-3 flex gap-2">
              {TEAM.map((t, i) => (
                <img
                  key={t.id}
                  src={PORTRAITS[i].src}
                  alt={t.name}
                  loading="lazy"
                  title={t.name}
                  className="h-9 w-9 rounded-full border border-gold-500/30 object-cover"
                />
              ))}
            </div>
          </div>
        </motion.div>

        <motion.form
          onSubmit={submit}
          initial={{ opacity: 0, x: 24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, ease, delay: 0.1 }}
          className="glass-light rounded-3xl p-8"
        >
          {status === "ok" ? (
            <div className="flex h-full flex-col items-center justify-center py-16 text-center">
              <span className="grid h-16 w-16 place-items-center rounded-full border border-emerald-400/30 bg-emerald-400/10">
                <CheckCircle2 size={26} className="text-emerald-300" />
              </span>
              <h3 className="mt-6 font-serif text-3xl text-cream">Message received.</h3>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-cream/55">
                The concierge desk has your note. Expect a reply within one
                operation cycle — and check the command deck in the meantime.
              </p>
              <button
                type="button"
                onClick={() => setStatus("idle")}
                className="mt-8 rounded-full border border-cream/15 px-6 py-2.5 text-sm text-cream/80 transition-colors hover:border-gold-500/40 hover:text-gold-300"
              >
                Send another message
              </button>
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="font-mono text-[10px] tracking-widest text-cream/50">NAME</label>
                  <input
                    required
                    value={form.name}
                    onChange={set("name")}
                    placeholder="Your name"
                    className={`${inputCls} mt-2`}
                  />
                </div>
                <div>
                  <label className="font-mono text-[10px] tracking-widest text-cream/50">EMAIL</label>
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={set("email")}
                    placeholder="you@example.com"
                    className={`${inputCls} mt-2`}
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="font-mono text-[10px] tracking-widest text-cream/50">SUBJECT</label>
                <input
                  value={form.subject}
                  onChange={set("subject")}
                  placeholder="A stay, a question, a mission…"
                  className={`${inputCls} mt-2`}
                />
              </div>
              <div className="mt-4">
                <label className="font-mono text-[10px] tracking-widest text-cream/50">MESSAGE</label>
                <textarea
                  required
                  value={form.message}
                  onChange={set("message")}
                  rows={4}
                  placeholder="Tell the concierge everything."
                  className={`${inputCls} mt-2 resize-none`}
                />
              </div>
              {status === "error" && (
                <p className="mt-3 text-xs text-rose-300">{err}</p>
              )}
              <button
                type="submit"
                disabled={status === "sending"}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gold-fade px-6 py-3.5 text-sm font-medium text-ink-950 shadow-glow transition-transform hover:scale-[1.02] disabled:opacity-60"
              >
                {status === "sending" ? (
                  <>
                    <Loader2 size={15} className="animate-spin" /> Sending…
                  </>
                ) : (
                  <>
                    Send to the concierge <Send size={14} />
                  </>
                )}
              </button>
            </>
          )}
        </motion.form>
      </div>
    </section>
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

const SHOWCASE = [
  { src: GALLERY.lobby.src, label: "The Lobby", note: "Check-in, reimagined" },
  { src: GALLERY.room.src, label: "The Rooms", note: "Silence above the Liffey" },
  { src: GALLERY.dining.src, label: "The Table", note: "A dinner worth the night" },
  { src: GALLERY.rooftop.src, label: "The Roof", note: "City lights, straight up" },
  { src: GALLERY.spa.src, label: "The Spa", note: "Reset before midnight" },
  { src: GALLERY.cocktail.src, label: "The Bar", note: "The night doesn't end" },
  { src: GALLERY.chauffeur.src, label: "The Car", note: "Arrive decided" },
];

function GalleryShowcase() {
  const [i, setI] = useState(0);
  const n = SHOWCASE.length;
  const go = (d) => setI((p) => (p + d + n) % n);

  useEffect(() => {
    const t = setInterval(() => setI((p) => (p + 1) % n), 5000);
    return () => clearInterval(t);
  }, [n]);

  const cur = SHOWCASE[i];

  return (
    <section id="stay" className="relative z-10 mx-auto max-w-6xl px-6 py-14">
      <SectionHeading
        kicker="THE HOUSE"
        title="Seven rooms, one night."
        sub="Every space is a stage for the experiences VIRELLE designs — and every one of them is real, in the house and in the database."
      />
      <div className="relative mt-12 overflow-hidden rounded-3xl border border-gold-500/15">
        <AnimatePresence mode="popLayout">
          <motion.img
            key={i}
            src={cur.src}
            alt={cur.label}
            initial={{ opacity: 0, scale: 1.06 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9, ease }}
            className="h-[70vh] w-full object-cover"
            loading="lazy"
          />
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/20 to-transparent" />
        <div className="absolute top-6 right-6 flex gap-1.5">
          {SHOWCASE.map((_, d) => (
            <span
              key={d}
              className={`h-1 rounded-full transition-all duration-300 ${
                d === i ? "w-6 bg-gold-400" : "w-1.5 bg-cream/30"
              }`}
            />
          ))}
        </div>
        <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between gap-4 p-6 md:p-8">
          <div>
            <p className="font-mono text-[10px] tracking-widest text-gold-300">
              {cur.label.toUpperCase()}
            </p>
            <p className="mt-1 font-serif text-2xl text-cream md:text-3xl">{cur.note}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm text-cream/50">
              {String(i + 1).padStart(2, "0")} / {String(n).padStart(2, "0")}
            </span>
            <button
              onClick={() => go(-1)}
              aria-label="Previous room"
              className="grid h-10 w-10 place-items-center rounded-full border border-cream/15 bg-ink-950/40 text-cream/70 backdrop-blur transition-colors hover:border-gold-500/40 hover:text-gold-300"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => go(1)}
              aria-label="Next room"
              className="grid h-10 w-10 place-items-center rounded-full border border-cream/15 bg-ink-950/40 text-cream/70 backdrop-blur transition-colors hover:border-gold-500/40 hover:text-gold-300"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function ChainIndex() {
  const [active, setActive] = useState(0);

  return (
    <div className="mt-12 grid items-start gap-8 lg:grid-cols-12">
      <div className="lg:col-span-7">
        {TEAM.map((member, i) => {
          const stage = STAGES[i];
          const is = i === active;
          return (
            <motion.button
              key={member.id}
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: i * 0.06, duration: 0.5, ease }}
              className={`group flex w-full items-start gap-5 border-b py-6 text-left transition-colors duration-300 ${
                is ? "border-gold-500/40" : "border-cream/10"
              }`}
            >
              <span
                className={`font-serif text-4xl leading-none transition-colors duration-300 ${
                  is ? "text-gold-400" : "text-cream/20"
                }`}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="flex-1">
                <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span
                    className={`font-serif text-2xl transition-colors duration-300 md:text-3xl ${
                      is ? "text-cream" : "text-cream/70"
                    }`}
                  >
                    {stage.label}
                  </span>
                  <span className="font-mono text-[10px] tracking-widest" style={{ color: member.color }}>
                    {member.name.toUpperCase()} · {member.title.toUpperCase()}
                  </span>
                </span>
                <AnimatePresence initial={false}>
                  {is && (
                    <motion.span
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="block overflow-hidden"
                    >
                      <span className="mt-2 block max-w-xl text-sm leading-relaxed text-cream/60">
                        "{member.philosophy}" — {member.name}
                      </span>
                    </motion.span>
                  )}
                </AnimatePresence>
              </span>
              <ArrowRight
                size={16}
                className={`mt-1.5 shrink-0 transition-all duration-300 ${
                  is ? "translate-x-0 text-gold-400 opacity-100" : "-translate-x-2 opacity-0"
                }`}
              />
            </motion.button>
          );
        })}
      </div>

      <div className="sticky top-24 hidden lg:col-span-5 lg:block">
        <div className="relative aspect-[4/5] overflow-hidden rounded-3xl border border-gold-500/15">
          <AnimatePresence mode="wait">
            <motion.img
              key={active}
              src={PORTRAITS[active].src}
              alt={PORTRAITS[active].alt}
              initial={{ opacity: 0, scale: 1.08 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.5, ease }}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </AnimatePresence>
          <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-transparent to-transparent" />
          <div className="absolute bottom-0 left-0 p-6">
            <p className="font-mono text-[10px] tracking-widest" style={{ color: TEAM[active].color }}>
              {STAGES[active].verb.toUpperCase()} · {TEAM[active].title.toUpperCase()}
            </p>
            <p className="mt-1 font-serif text-2xl text-cream">{TEAM[active].name}</p>
            <p className="text-xs text-cream/55">{TEAM[active].philosophy}</p>
          </div>
        </div>
        <p className="mt-4 text-center font-mono text-[10px] tracking-widest text-cream/30">
          HOVER THE LIST TO FOLLOW THE CHAIN
        </p>
      </div>
    </div>
  );
}

const FAQS = [
  {
    q: "Is this real, or a mockup?",
    a: "Fully working. The backend runs live on Render — the agents call real APIs (Fáilte Ireland events, Open-Meteo weather, an external travel feed) and query real hotel data stored in SQLite through an MCP server. Nothing on these screens is copy-pasted or hardcoded.",
  },
  {
    q: "Do I need an API key to try it?",
    a: "No keys needed. The live organisation runs on the deployed backend — type a mission in Command and watch the five agents execute it in sequence.",
  },
  {
    q: "Can I actually book the experience it designs?",
    a: "Yes. The product page includes a live booking flow that writes a real booking record into the database and marks the inventory sold.",
  },
  {
    q: "What happens to my data?",
    a: "Names, emails and messages from the contact form, plus booking records, are stored in the hotel database so the concierge can reply. No payment data is collected.",
  },
  {
    q: "Who built VIRELLE?",
    a: "The five specialists you meet in the chain — Eleanor, Sofia, Julian, Amelia and Alexander — coordinated by a single operation. It is the product, not the pitch.",
  },
];

function Faq() {
  const [open, setOpen] = useState(0);

  return (
    <section className="relative z-10 mx-auto max-w-3xl px-6 py-16">
      <SectionHeading
        kicker="QUESTIONS"
        title="Asked, answered."
        sub="The questions every guest asks before they hand the night over to the organisation."
      />
      <div className="mt-12 space-y-3">
        {FAQS.map((f, i) => {
          const is = i === open;
          return (
            <div
              key={f.q}
              className={`glass rounded-2xl transition-colors duration-300 ${
                is ? "border-gold-500/30" : "border-cream/10"
              }`}
            >
              <button
                onClick={() => setOpen(is ? -1 : i)}
                className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
              >
                <span className={`font-serif text-lg transition-colors ${is ? "text-gold-200" : "text-cream"}`}>
                  {f.q}
                </span>
                <ChevronDown
                  size={16}
                  className={`shrink-0 text-gold-400 transition-transform duration-300 ${
                    is ? "rotate-180" : ""
                  }`}
                />
              </button>
              <AnimatePresence initial={false}>
                {is && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease }}
                    className="overflow-hidden"
                  >
                    <p className="px-6 pb-5 text-sm leading-relaxed text-cream/60">{f.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </section>
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
