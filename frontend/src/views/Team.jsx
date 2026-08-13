import React from "react";
import { motion } from "framer-motion";
import { Quote, ArrowRight } from "lucide-react";
import { TEAM, STAGES } from "../constants.jsx";

export default function Team({ navigate }) {
  return (
    <div className="relative z-10 mx-auto max-w-6xl px-6 py-12">
      <div className="text-center">
        <p className="font-mono text-[11px] tracking-widest2 text-gold-500/80">THE VIRELLE TEAM</p>
        <h1 className="mt-2 font-serif text-4xl text-cream md:text-5xl">Five specialists. One organisation.</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-cream/55">
          Every operation passes through the team in sequence — each agent
          hands its work to the next, and evidence flows through all of them.
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
            className="group relative flex flex-col overflow-hidden rounded-3xl border border-cream/8 bg-gradient-to-b from-ink-850 to-ink-950 p-7"
            style={{ boxShadow: `0 20px 60px -30px ${a.color}30` }}
          >
            <div
              className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full opacity-[0.07] blur-2xl transition-opacity duration-500 group-hover:opacity-25"
              style={{ background: a.color }}
            />
            <div className="flex items-start justify-between">
              <span
                className="font-serif text-6xl leading-none"
                style={{ color: `${a.color}66` }}
              >
                {a.number}
              </span>
              <span
                className="rounded-full border px-3 py-1 font-mono text-[9px] tracking-widest"
                style={{ borderColor: `${a.color}44`, color: a.color }}
              >
                {a.archetype.toUpperCase()}
              </span>
            </div>

            <div className="mt-5 flex items-center gap-3">
              <span
                className="h-3 w-3 rounded-full"
                style={{ background: a.color, boxShadow: `0 0 16px ${a.color}` }}
              />
              <div>
                <h2 className="font-serif text-2xl text-cream">{a.name}</h2>
                <p className="text-[11px] text-cream/45">{a.title}</p>
              </div>
            </div>

            <p className="mt-4 text-[13px] leading-relaxed text-cream/60">{a.personality}</p>

            <div className="mt-5 rounded-2xl border border-cream/8 bg-ink-950/60 p-4">
              <Quote size={13} style={{ color: a.color }} />
              <p className="mt-2 font-serif text-lg italic leading-snug" style={{ color: a.color }}>
                {a.philosophy}
              </p>
            </div>

            <div className="mt-auto pt-6">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-mono tracking-widest text-cream/40">
                  {STAGES[i]?.label} · {a.role.toUpperCase()}
                </span>
              </div>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-cream/8">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${((i + 1) / TEAM.length) * 100}%`, background: a.color }}
                />
              </div>
            </div>
          </motion.div>
        ))}

        {/* CTA card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ delay: 0.4 }}
          className="flex flex-col items-start justify-center rounded-3xl bg-gold-fade p-7 shadow-glow"
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
