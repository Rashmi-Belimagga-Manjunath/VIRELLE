import { motion, useScroll, useSpring } from "framer-motion";

export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 28, restDelta: 0.001 });
  return (
    <motion.div
      className="fixed left-0 top-0 z-[120] h-[2px] w-full origin-left bg-gradient-to-r from-gold-500/30 via-gold-400 to-gold-500/60"
      style={{ scaleX }}
      aria-hidden="true"
    />
  );
}
