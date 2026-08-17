import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Music, Music2 } from "lucide-react";

export default function MusicPlayer() {
  const [on, setOn] = useState(true);
  const [ready, setReady] = useState(false);
  const ctxRef = useRef(null);
  const masterRef = useRef(null);
  const sourceRef = useRef(null);
  const startedRef = useRef(false);
  const onRef = useRef(true);

  const build = useCallback(async () => {
    if (ctxRef.current) return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ctx = new Ctx();
    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
    ctxRef.current = ctx;
    masterRef.current = master;

    try {
      const resp = await fetch("/piano-ambient.wav");
      const arrayBuf = await resp.arrayBuffer();
      const audioBuf = await ctx.decodeAudioData(arrayBuf);
      const source = ctx.createBufferSource();
      source.buffer = audioBuf;
      source.loop = true;
      source.connect(master);
      source.start(0);
      sourceRef.current = source;
      startedRef.current = true;
    } catch {
      /* WAV not loaded yet */
    }
  }, []);

  const setMaster = useCallback((level, attack) => {
    const ctx = ctxRef.current;
    if (!ctx || !masterRef.current) return;
    masterRef.current.gain.cancelScheduledValues(ctx.currentTime);
    masterRef.current.gain.setTargetAtTime(level, ctx.currentTime, attack);
  }, []);

  const startAudio = useCallback(async () => {
    if (!ctxRef.current) await build();
    const ctx = ctxRef.current;
    if (!ctx) return;
    if (ctx.state === "suspended") {
      await ctx.resume().catch(() => {});
    }
    if (onRef.current) setMaster(0.22, 1.2);
  }, [build, setMaster]);

  const toggle = useCallback(async () => {
    if (!ctxRef.current) await build();
    const ctx = ctxRef.current;
    if (!ctx) return;
    const next = !onRef.current;
    onRef.current = next;
    setOn(next);
    if (ctx.state === "suspended") await ctx.resume().catch(() => {});
    setMaster(next ? 0.22 : 0, next ? 1.2 : 0.6);
  }, [build, setMaster]);

  useEffect(() => {
    build();
    const unlock = () => startAudio();
    document.addEventListener("pointerdown", unlock);
    document.addEventListener("keydown", unlock);
    document.addEventListener("touchstart", unlock);
    startAudio();
    return () => {
      document.removeEventListener("pointerdown", unlock);
      document.removeEventListener("keydown", unlock);
      document.removeEventListener("touchstart", unlock);
    };
  }, [build, startAudio]);

  useEffect(() => () => {
    sourceRef.current?.stop();
    ctxRef.current?.close();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 800);
    return () => clearTimeout(t);
  }, []);

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
