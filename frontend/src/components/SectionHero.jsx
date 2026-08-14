import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import CinematicImage from "./CinematicImage.jsx";

const ease = [0.22, 1, 0.36, 1];

export default function SectionHero({ kicker, chapter, title, sub, image, imageAlt, height = "min-h-[52vh]" }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const scale = useTransform(scrollYProgress, [0, 1], [1.02, 1.16]);
  const fade = useTransform(scrollYProgress, [0, 0.7], [1, 0.15]);

  return (
    <section ref={ref} className={`relative ${height} flex items-end overflow-hidden`}>
      <motion.div className="absolute -inset-y-10 inset-x-0" style={{ y }}>
        <motion.div className="absolute inset-0" style={{ scale }}>
          <CinematicImage src={image} alt={imageAlt || title} className="h-full w-full" speed={0.8} hoverParallax={false}>
            <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/35 to-ink-950/55" />
            <div className="absolute inset-0 bg-gradient-to-r from-ink-950/70 via-transparent to-ink-950/25" />
            <div className="absolute inset-0 opacity-[0.18] mix-blend-overlay" style={{ backgroundImage: "radial-gradient(120% 120% at 50% 0%, rgba(201,167,107,0.5) 0%, transparent 60%)" }} />
          </CinematicImage>
        </motion.div>
      </motion.div>

      <motion.div
        style={{ opacity: fade }}
        className="relative z-10 mx-auto w-full max-w-7xl px-6 pb-16 pt-28 md:pb-20"
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease }}
        >
          {chapter && (
            <p className="flex items-center gap-3 font-mono text-[10px] tracking-[0.45em] text-gold-500/70">
              <span className="h-px w-8 bg-gold-500/50" />
              {chapter.toUpperCase()}
            </p>
          )}
          <p className="mt-4 font-mono text-[11px] tracking-widest2 text-gold-400">{kicker}</p>
          <h1 className="mt-3 max-w-4xl font-serif text-4xl leading-[1.08] text-cream md:text-6xl">
            {title}
          </h1>
          {sub && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35, duration: 0.8 }}
              className="mt-5 max-w-2xl text-sm leading-relaxed text-cream/60 md:text-base"
            >
              {sub}
            </motion.p>
          )}
        </motion.div>
      </motion.div>
    </section>
  );
}
