import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useSpring } from "framer-motion";

const TRAIL = [
  { color: "#4facfe", size: 5, blur: 10 },
  { color: "#f6c86a", size: 5, blur: 12 },
  { color: "#5eead4", size: 5, blur: 12 },
  { color: "#f472b6", size: 5, blur: 12 },
  { color: "#c4b5fd", size: 5, blur: 10 },
];

export default function CursorFX() {
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);

  const n1x = useSpring(x, { stiffness: 420, damping: 34, mass: 0.5 });
  const n1y = useSpring(y, { stiffness: 420, damping: 34, mass: 0.5 });
  const n2x = useSpring(n1x, { stiffness: 300, damping: 32, mass: 0.6 });
  const n2y = useSpring(n1y, { stiffness: 300, damping: 32, mass: 0.6 });
  const n3x = useSpring(n2x, { stiffness: 210, damping: 30, mass: 0.7 });
  const n3y = useSpring(n2y, { stiffness: 210, damping: 30, mass: 0.7 });
  const n4x = useSpring(n3x, { stiffness: 140, damping: 29, mass: 0.8 });
  const n4y = useSpring(n3y, { stiffness: 140, damping: 29, mass: 0.8 });
  const n5x = useSpring(n4x, { stiffness: 90, damping: 28, mass: 0.9 });
  const n5y = useSpring(n4y, { stiffness: 90, damping: 28, mass: 0.9 });

  const glowX = useSpring(x, { stiffness: 50, damping: 24, mass: 1.6 });
  const glowY = useSpring(y, { stiffness: 50, damping: 24, mass: 1.6 });

  const [visible, setVisible] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [ripples, setRipples] = useState([]);
  const rippleId = useRef(0);

  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const onMove = (e) => {
      x.set(e.clientX);
      y.set(e.clientY);
      setVisible(true);
    };
    const onOver = (e) => {
      setHovering(
        !!e.target.closest("a, button, input, textarea, select, [role='button'], [data-cursor]")
      );
    };
    const onDown = (e) => {
      setPressed(true);
      const id = ++rippleId.current;
      setRipples((r) => [...r, { id, x: e.clientX, y: e.clientY }]);
      setTimeout(() => setRipples((r) => r.filter((q) => q.id !== id)), 700);
    };
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

  const nodes = [
    { x: n1x, y: n1y, i: 0 },
    { x: n2x, y: n2y, i: 1 },
    { x: n3x, y: n3y, i: 2 },
    { x: n4x, y: n4y, i: 3 },
    { x: n5x, y: n5y, i: 4 },
  ];

  return (
    <div className="pointer-events-none fixed inset-0 z-[999]" aria-hidden="true">
      <motion.div
        className="cursor-glow"
        style={{ x: glowX, y: glowY }}
        animate={{ opacity: visible && !pressed ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      />

      {nodes.map(({ x: nx, y: ny, i }) => (
        <motion.div
          key={i}
          className="cur-node"
          style={{ x: nx, y: ny }}
          animate={{
            opacity: visible ? (hovering ? 0.18 : 0.75 - i * 0.11) : 0,
            scale: (hovering ? 0.55 : 1) * (pressed ? 0.8 : 1),
          }}
          transition={{ type: "spring", stiffness: 320, damping: 22 }}
        >
          <span
            className="block rounded-full"
            style={{
              width: TRAIL[i].size,
              height: TRAIL[i].size,
              background: TRAIL[i].color,
              boxShadow: `0 0 ${TRAIL[i].blur}px ${TRAIL[i].color}, 0 0 22px ${TRAIL[i].color}66`,
            }}
          />
        </motion.div>
      ))}

      <motion.div
        className="cursor-ring"
        style={{ x, y }}
        animate={{
          scale: pressed ? 0.7 : hovering ? 1.7 : 1,
          opacity: visible ? 1 : 0,
          borderColor: hovering
            ? "rgba(201,167,107,0.95)"
            : pressed
              ? "rgba(244,114,182,0.8)"
              : "rgba(201,167,107,0.4)",
        }}
        transition={{ type: "spring", stiffness: 340, damping: 22 }}
      />

      <motion.div
        className="cursor-dot"
        style={{ x, y }}
        animate={{
          scale: pressed ? 2.2 : hovering ? 0.45 : 1,
          opacity: visible ? 1 : 0,
        }}
        transition={{ type: "spring", stiffness: 640, damping: 30 }}
      />

      <AnimatePresence>
        {ripples.map((r) => (
          <motion.span
            key={r.id}
            className="pointer-events-none fixed left-0 top-0 block rounded-full"
            style={{ x: r.x, y: r.y }}
            initial={{ width: 6, height: 6, margin: -3, opacity: 0.7 }}
            animate={{ width: 56, height: 56, margin: -28, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <span className="block h-full w-full rounded-full border border-gold-400/70" />
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  );
}
