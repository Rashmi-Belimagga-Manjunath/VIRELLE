import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Music, Music2 } from "lucide-react";

export default function MusicPlayer() {
  const [on, setOn] = useState(true);
  const [ready, setReady] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = new Audio("/piano-ambient.wav");
    audio.loop = true;
    audio.volume = 0.22;
    audioRef.current = audio;

    const start = () => {
      if (audio.paused) audio.play().catch(() => {});
    };
    document.addEventListener("pointerdown", start);
    document.addEventListener("keydown", start);
    document.addEventListener("touchstart", start);
    start();

    return () => {
      audio.pause();
      audio.src = "";
      document.removeEventListener("pointerdown", start);
      document.removeEventListener("keydown", start);
      document.removeEventListener("touchstart", start);
    };
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 800);
    return () => clearTimeout(t);
  }, []);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    const next = !on;
    setOn(next);
    if (next) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  };

  return (
    <div className="fixed bottom-6 left-6 z-[60] flex items-center gap-2">
      <AnimatePresence>
        {on && (
          <motion.button
            initial={{ opacity: 0, x: 8, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 8, scale: 0.9 }}
            onClick={toggle}
            className="glass flex h-11 items-center gap-2 rounded-full px-4 font-mono text-[10px] tracking-widest text-gold-300"
            title="Pause ambient music"
          >
            <span className="flex items-end gap-[2px]">
              {[6, 10, 7, 12, 8].map((h, i) => (
                <motion.span
                  key={i}
                  animate={{ height: [h * 0.3, h, h * 0.4, h * 0.8, h * 0.3] }}
                  transition={{ repeat: Infinity, duration: 1.1, delay: i * 0.12 }}
                  className="w-[2.5px] rounded-full bg-gold-400"
                />
              ))}
            </span>
            AMBIENT · LIVE
          </motion.button>
        )}
      </AnimatePresence>
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: ready ? 1 : 0, scale: ready ? 1 : 0.8 }}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        onClick={toggle}
        className={`grid h-12 w-12 place-items-center rounded-full shadow-glow ${
          on ? "bg-gold-fade text-ink-950" : "glass text-gold-300"
        }`}
        aria-label={on ? "Pause ambient music" : "Play ambient music"}
        title={on ? "Pause ambient music" : "Play ambient music"}
      >
        {on ? <Music2 size={19} /> : <Music size={19} />}
      </motion.button>
    </div>
  );
}
