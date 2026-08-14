import React, { useEffect, useState } from "react";
import { motion, useInView } from "framer-motion";
import {
  Crown,
  TrendingUp,
  TrendingDown,
  Wallet,
  Package,
  Users,
  Percent,
  ShieldAlert,
  CheckCircle2,
  Gavel,
} from "lucide-react";
import { useOperation } from "../hooks/useOperation.js";
import { GALLERY } from "../components/Images.jsx";
import SectionHero from "../components/SectionHero.jsx";

const RATING_COLOR = {
  strong: "text-emerald-300",
  good: "text-teal-300",
  moderate: "text-amber-300",
  weak: "text-rose-300",
  high: "text-rose-300",
};

export default function Executive({ opId }) {
  const { op } = useOperation(opId);
  const decision = op.decision || null;

  return (
    <>
      <SectionHero
        chapter="Chapter 06 · The Verdict"
        kicker="VIRELLE EXECUTIVE"
        title="The final decision"
        sub="Alexander Sterling reviews the complete operation, verifies the economics himself, and signs."
        image={GALLERY.suite.src}
        imageAlt="Executive decision"
      />
      <div className="relative z-10 mx-auto max-w-6xl px-6 py-12">
      {!decision ? (
        <div className="glass mt-12 rounded-2xl p-12 text-center">
          <Gavel size={26} className="mx-auto text-gold-500/60" />
          <p className="mt-4 font-serif text-xl text-cream">No decision rendered yet</p>
          <p className="mt-2 text-sm text-cream/45">
            The Executive Director signs after the full organisation has delivered its work.
          </p>
        </div>
      ) : (
        <div className="mt-12">
          {/* verdict */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-3xl border border-violet-400/15 bg-gradient-to-br from-ink-800 via-ink-900 to-ink-950 p-10 text-center"
          >
            <div className="aurora h-80 w-80 bg-violet-500/15" />
            <div className="relative">
              <span
                className={`mx-auto grid h-16 w-16 place-items-center rounded-full border ${
                  decision.verdict === "LAUNCH_APPROVED"
                    ? "border-emerald-400/40 bg-emerald-400/10"
                    : "border-rose-400/40 bg-rose-400/10"
                }`}
              >
                <Crown size={28} className={decision.verdict === "LAUNCH_APPROVED" ? "text-emerald-300" : "text-rose-300"} />
              </span>
              <p className="mt-5 font-mono text-[10px] tracking-widest text-cream/50">EXECUTIVE DECISION</p>
              <h2
                className={`mt-2 font-serif text-5xl tracking-wide md:text-6xl ${
                  decision.verdict === "LAUNCH_APPROVED" ? "text-emerald-300" : "text-rose-300"
                }`}
              >
                {decision.verdict.replace(/_/g, " ")}
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-cream/70">
                {decision.decision_summary}
              </p>
              <div className="mx-auto mt-5 inline-flex items-center gap-2 rounded-full border border-cream/10 px-4 py-1.5 font-mono text-[10px] tracking-widest text-cream/50">
                <CheckCircle2 size={12} className="text-gold-400" />
                CONFIDENCE {decision.confidence}% · SIGNED — A. STERLING
              </div>
            </div>
          </motion.div>

          {/* economics */}
          <div className="mt-8 grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
            <Counter label="Price / couple" value={decision.economics?.price} prefix="€" />
            <Counter label="Capacity" value={decision.economics?.capacity} />
            <Counter label="Expected sold" value={decision.economics?.expected_sold} />
            <Counter label="Revenue" value={decision.economics?.revenue} prefix="€" />
            <Counter label="Delivery cost" value={decision.economics?.delivery_cost} prefix="€" />
            <Counter label="Contribution" value={decision.economics?.contribution} prefix="€" accent />
            <Counter label="Margin" value={decision.economics?.margin_pct} suffix="%" accent />
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-12">
            {/* evaluation */}
            <div className="glass rounded-2xl p-7 lg:col-span-7">
              <h3 className="flex items-center gap-2 font-serif text-xl text-cream">
                <Wallet size={16} className="text-gold-400" /> Evaluation
              </h3>
              <div className="mt-5 space-y-3">
                {(decision.evaluation || []).map((ev, i) => (
                  <div key={i} className="rounded-xl border border-cream/8 bg-ink-950/50 px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-cream/85">{ev.factor}</p>
                      <span
                        className={`rounded-full px-3 py-0.5 font-mono text-[9px] tracking-widest ${
                          RATING_COLOR[(ev.rating || "").toLowerCase()] || "text-cream/50"
                        } border border-cream/10`}
                      >
                        {ev.rating?.toUpperCase()}
                      </span>
                    </div>
                    <p className="mt-1.5 text-[12.5px] leading-relaxed text-cream/55">{ev.assessment}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* risk + strategic fit */}
            <div className="flex flex-col gap-6 lg:col-span-5">
              <div className="glass rounded-2xl p-7">
                <h3 className="flex items-center gap-2 font-serif text-xl text-cream">
                  <ShieldAlert size={16} className="text-amber-300" /> Risk assessment
                </h3>
                <span
                  className={`mt-4 inline-block rounded-full border px-4 py-1 font-mono text-[10px] tracking-widest ${
                    (decision.risk?.level || "").toLowerCase() === "low"
                      ? "border-emerald-400/30 text-emerald-300"
                      : (decision.risk?.level || "").toLowerCase() === "high"
                        ? "border-rose-400/30 text-rose-300"
                        : "border-amber-400/30 text-amber-300"
                  }`}
                >
                  {decision.risk?.level?.toUpperCase()}
                </span>
                <ul className="mt-4 space-y-2">
                  {(decision.risk?.notes || []).map((n, i) => (
                    <li key={i} className="flex items-start gap-2 text-[12.5px] leading-relaxed text-cream/60">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-gold-500" /> {n}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="glass rounded-2xl p-7">
                <h3 className="flex items-center gap-2 font-serif text-xl text-cream">
                  <TrendingUp size={16} className="text-gold-400" /> Strategic fit
                </h3>
                <p className="mt-4 text-sm leading-relaxed text-cream/70">{decision.strategic_fit}</p>
              </div>

              <div className="rounded-2xl border border-gold-500/25 bg-gold-500/5 p-7">
                <h3 className="flex items-center gap-2 font-serif text-xl text-gold-200">
                  <Gavel size={16} /> Recommendation
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-cream/80">{decision.recommendation}</p>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
}

function Counter({ label, value, prefix = "", suffix = "", accent }) {
  const [display, setDisplay] = useState(0);
  const ref = React.useRef(null);
  const inView = useInView(ref, { once: true });
  const num = Number(value) || 0;

  useEffect(() => {
    if (!inView) return;
    const duration = 1200;
    const start = performance.now();
    let raf;
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(num * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, num]);

  return (
    <div
      ref={ref}
      className={`glass rounded-2xl p-5 ${accent ? "border-gold-500/30 bg-gold-500/5" : ""}`}
    >
      <p className="flex items-center gap-1.5 font-mono text-[9px] tracking-widest text-cream/45">
        {accent ? <TrendingUp size={11} className="text-gold-400" /> : <Package size={11} className="text-cream/35" />}
        {label.toUpperCase()}
      </p>
      <p className={`mt-2 font-serif text-3xl ${accent ? "text-gold-200" : "text-cream"}`}>
        {prefix}
        {display.toLocaleString()}
        {suffix}
      </p>
    </div>
  );
}
