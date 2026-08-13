import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Radar,
  Sparkles,
  Code2,
  Megaphone,
  Landmark,
  ArrowRight,
  Activity,
  Zap,
  Database,
  CloudSun,
  Workflow,
} from "lucide-react";
import { TEAM, STAGES, MISSION_SUGGESTIONS } from "../constants.jsx";

const ICONS = {
  radar: Radar,
  sparkles: Sparkles,
  code: Code2,
  megaphone: Megaphone,
  landmark: Landmark,
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
  return (
    <div className="relative">
      {/* ================= HERO ================= */}
      <section className="grain relative flex min-h-[88vh] flex-col items-center justify-center overflow-hidden px-6 pt-16 pb-10">
        <div className="aurora h-[50rem] w-[50rem] -top-72 left-1/2 -translate-x-1/2 bg-gold-500/[0.14]" />
        <div className="aurora h-[30rem] w-[30rem] top-24 -left-40 bg-rose-500/[0.08]" />
        <div className="aurora h-[30rem] w-[30rem] top-24 -right-40 bg-sky-500/[0.08]" />
        <ParticleField />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease }}
          className="relative z-10 mb-8 flex items-center gap-3 rounded-full border border-gold-500/20 bg-gold-500/5 px-5 py-2 backdrop-blur"
        >
          <span className="h-2 w-2 rounded-full bg-emerald-400 pulse-dot" />
          <span className="font-mono text-[11px] tracking-widest text-gold-300/90">
            LIVE OPERATION · REALTIME INTELLIGENCE · 5 AGENTS · 1 DECISION
          </span>
        </motion.div>

        <h1 className="relative z-10 max-w-5xl text-center font-serif leading-[1.04]">
          <Word stagger delay={0.1}>From</Word> <Word stagger delay={0.18}>live</Word>{" "}
          <Word stagger delay={0.26}>signals</Word>
          <br />
          <Word stagger delay={0.4}>to</Word>{" "}
          <span className="gold-text">
            <Word stagger delay={0.5}>exceptional</Word>
          </span>{" "}
          <Word stagger delay={0.58}>experiences.</Word>
        </h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0, duration: 0.8 }}
          className="relative z-10 mt-7 max-w-2xl text-center text-lg font-light leading-relaxed text-cream/65"
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
          className="relative z-10 mt-9 flex flex-col items-center gap-4 sm:flex-row"
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
            className="rounded-full border border-cream/15 px-8 py-3.5 text-sm text-cream/80 transition-colors hover:border-gold-500/40 hover:text-gold-300"
          >
            Meet the team
          </button>
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
          {TEAM.map((t, i) => {
            const Icon = ICONS[t.icon];
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 26 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ delay: i * 0.1, duration: 0.6, ease }}
                className="group relative overflow-hidden rounded-2xl border p-6 transition-colors"
                style={{ borderColor: `${t.color}22`, background: t.accent }}
              >
                <span className="font-mono text-[11px]" style={{ color: t.color }}>
                  {t.number}
                </span>
                <div
                  className="mt-4 grid h-10 w-10 place-items-center rounded-xl"
                  style={{ background: `${t.color}1f`, border: `1px solid ${t.color}33` }}
                >
                  <Icon size={18} style={{ color: t.color }} />
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
            );
          })}
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
              className="glass-light rounded-2xl p-7"
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
    </div>
  );
}

function Word({ children, delay }) {
  return (
    <motion.span
      className="inline-block"
      initial={{ opacity: 0, y: "0.6em", filter: "blur(6px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ delay, duration: 0.8, ease }}
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
