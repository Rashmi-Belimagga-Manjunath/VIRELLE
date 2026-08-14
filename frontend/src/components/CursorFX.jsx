import React, { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export default function CursorFX() {
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const ringX = useSpring(x, { stiffness: 260, damping: 24, mass: 0.6 });
  const ringY = useSpring(y, { stiffness: 260, damping: 24, mass: 0.6 });
  const glowX = useSpring(x, { stiffness: 120, damping: 30, mass: 1.1 });
  const glowY = useSpring(y, { stiffness: 120, damping: 30, mass: 1.1 });
  const [hovering, setHovering] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const onMove = (e) => {
      x.set(e.clientX);
      y.set(e.clientY);
      setVisible(true);
    };
    const onOver = (e) => {
      const t = e.target.closest(
        "a, button, input, textarea, select, [role='button'], [data-cursor]"
      );
      setHovering(!!t);
    };
    const onDown = () => setPressed(true);
    const onUp = () => setPressed(false);
    const onLeave = () => setVisible(false);
    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseover", onOver, { passive: true });
    window.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    document.documentElement.addEventListener("mouseleave", onLeave);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseover", onOver);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      document.documentElement.removeEventListener("mouseleave", onLeave);
    };
  }, [x, y]);

  return (
    <div className="pointer-events-none fixed inset-0 z-[999]" aria-hidden="true">
      <motion.div
        className="cursor-glow"
        style={{ x: glowX, y: glowY }}
        animate={{ opacity: visible ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      />
      <motion.div
        className="cursor-ring"
        style={{ x: ringX, y: ringY }}
        animate={{
          scale: pressed ? 0.65 : hovering ? 1.7 : 1,
          opacity: visible ? 1 : 0,
          borderColor: hovering ? "rgba(201,167,107,0.9)" : "rgba(201,167,107,0.45)",
        }}
        transition={{ type: "spring", stiffness: 320, damping: 22 }}
      />
      <motion.div
        className="cursor-dot"
        style={{ x, y }}
        animate={{
          scale: pressed ? 2.4 : hovering ? 0.4 : 1,
          opacity: visible ? 1 : 0,
        }}
        transition={{ type: "spring", stiffness: 600, damping: 30 }}
      />
    </div>
  );
}
