import React, { useState } from "react";
import { motion } from "framer-motion";
import { Quote, ArrowRight, RotateCcw } from "lucide-react";
import { TEAM, STAGES } from "../constants.jsx";
import CinematicImage from "../components/CinematicImage.jsx";
import { PORTRAITS } from "../components/Images.jsx";

const FLIP_3D = {
  transformStyle: "preserve-3d",
  transition: "transform 0.85s cubic-bezier(0.22, 1, 0.36, 1)",
};
const FACE = { position: "absolute", inset: 0, backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" };

function TeamCard({ agent, stage, portrait, navigate }) {
  const [flipped, setFlipped] = useState(false);
  return (
    <div
      className="group h-[500px] w-full cursor-pointer select-none [perspective:1600px]"
      onClick={() => setFlipped((f) => !f)}
      onMouseEnter={() => setFlipped(true)}
      onMouseLeave={() => setFlipped(false)}
    >
      <div
        className="relative h-full w-full"
        style={{ ...FLIP_3D, transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)" }}
      >
        {/* ============ FRONT — portrait ============ */}
        <div
          className="overflow-hidden rounded-3xl border border-cream/10"
          style={{ ...FACE }}
        >
          <CinematicImage
            src={portrait.src}
            alt={portrait.alt || agent.name}
            className="h-full w-full"
            imgClassName="object-cover object-top"
            speed={0.4}
            fallbacks={[portrait.src]}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/35 to-ink-950/10" />
            <div
              className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full opacity-25 blur-3xl"
              style={{ background: agent.color }}
            />
            <div
              className="absolute left-4 top-4 rounded-full border px-3 py-1 font-mono text-[9px] tracking-widest backdrop-blur"
              style={{
                borderColor: `${agent.color}66`,
                color: "#fdf6e9",
                background: "rgba(10,10,14,0.5)",
              }}
            >
              {agent.number} · {agent.archetype.toUpperCase()}
            </div>
            <div className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full border border-cream/15 bg-ink-950/40 px-2.5 py-1 font-mono text-[8px] tracking-widest text-cream/60 backdrop-blur">
              <RotateCcw size={10} />
              HOVER TO FLIP
            </div>
            <div className="absolute bottom-0 left-0 w-full p-5">
              <h2 className="font-serif text-3xl text-cream">{agent.name}</h2>
              <p className="mt-0.5 text-[11px] tracking-wide text-cream/60">{agent.title}</p>
              <p className="mt-2 font-mono text-[9px] uppercase tracking-widest" style={{ color: agent.color }}>
                {stage.label}
              </p>
            </div>
            <div
              className="absolute bottom-5 right-5 font-serif text-6xl text-cream/25 drop-shadow"
            >
              {agent.number}
            </div>
          </CinematicImage>
        </div>

        {/* ============ BACK — the agent ============ */}
        <div
          className="flex flex-col overflow-hidden rounded-3xl border p-6"
          style={{
            ...FACE,
            transform: "rotateY(180deg)",
            borderColor: `${agent.color}33`,
            background: `linear-gradient(160deg, ${agent.accent}, rgba(10,11,18,0.98) 55%)`,
            boxShadow: `0 30px 80px -40px ${agent.color}66`,
          }}
        >
          <div className="flex items-center justify-between">
            <span
              className="rounded-full border px-3 py-1 font-mono text-[9px] tracking-widest"
              style={{ borderColor: `${agent.color}55`, color: agent.color }}
            >
              {agent.number} · {agent.archetype.toUpperCase()}
            </span>
            <span className="font-mono text-[9px] tracking-widest text-cream/40">
              {stage.label} → DECISION
            </span>
          </div>

          <h2 className="mt-4 font-serif text-2xl text-cream">{agent.name}</h2>
          <p className="text-[11px] tracking-wide text-cream/50">{agent.title}</p>

          <div className="mt-4 flex items-center gap-2 font-mono text-[9px] uppercase tracking-widest text-cream/45">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: agent.color, boxShadow: `0 0 10px ${agent.color}` }} />
            Answers: “{agent.answer}”
          </div>

          <p className="mt-3 text-[13px] leading-relaxed text-cream/65">{agent.personality}</p>

          <div
            className="mt-4 rounded-2xl border p-4"
            style={{ borderColor: `${agent.color}22`, background: "rgba(8,9,14,0.5)" }}
          >
            <Quote size={13} style={{ color: agent.color }} />
            <p className="mt-1.5 font-serif text-[15px] italic leading-snug" style={{ color: agent.color }}>
              “{agent.philosophy}”
            </p>
          </div>

          <div className="mt-4">
            <p className="font-mono text-[9px] tracking-widest text-cream/40">DELIVERS</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {agent.products.map((p) => (
                <span
                  key={p}
                  className="rounded-full border border-cream/12 bg-ink-950/50 px-2.5 py-1 font-mono text-[9px] text-cream/70"
                >
                  {p}
                </span>
              ))}
            </div>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate("operations");
            }}
            className="mt-auto flex items-center gap-2 rounded-full bg-gold-fade px-5 py-2.5 text-xs font-medium text-ink-950 transition-transform hover:scale-105"
          >
            Watch {agent.name.split(" ")[0]} work <ArrowRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Team({ navigate }) {
  return (
    <div className="relative z-10 mx-auto max-w-6xl px-6 py-12">
      <div className="text-center">
        <p className="font-mono text-[11px] tracking-widest2 text-gold-500/80">THE VIRELLE TEAM</p>
        <h1 className="mt-2 font-serif text-4xl text-cream md:text-5xl">Five specialists. One organisation.</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-cream/55">
          Every operation passes through the team in sequence — each agent
          hands its work to the next, and evidence flows through all of them.
          Hover a card to meet the agent behind the stage.
        </p>
      </div>

      <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {TEAM.map((a, i) => (
          <motion.div
            key={a.id}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ delay: i * 0.08 }}
          >
            <TeamCard agent={a} stage={STAGES[i]} portrait={PORTRAITS[i % PORTRAITS.length]} navigate={navigate} />
          </motion.div>
        ))}

        {/* CTA card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ delay: 0.4 }}
          className="flex h-[500px] flex-col items-start justify-center rounded-3xl bg-gold-fade p-7 shadow-glow"
        >
          <p className="font-serif text-2xl leading-snug text-ink-950">
            Watch them work together in real time.
          </p>
          <p className="mt-2 text-sm text-ink-950/60">
            Send one mission. The organisation runs the whole pipeline live.
          </p>
          <button
            onClick={() => navigate("operations")}
            className="mt-6 flex items-center gap-2 rounded-full bg-ink-950 px-6 py-3 text-sm font-medium text-cream transition-transform hover:scale-105"
          >
            Go to VIRELLE Operations <ArrowRight size={15} />
          </button>
        </motion.div>
      </div>
    </div>
  );
}
