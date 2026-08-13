import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Music, Music2, VolumeX } from "lucide-react";

const CHORDS = [
  [220.0, 261.63, 329.63],
  [174.61, 220.0, 261.63],
  [196.0, 246.94, 293.66],
  [164.81, 196.0, 246.94],
];
const ROOTS = [0, 1, 2, 3];

export default function MusicPlayer() {
  const [on, setOn] = useState(false);
  const [ready, setReady] = useState(false);
  const ctxRef = useRef(null);
  const masterRef = useRef(null);
  const voicesRef = useRef([]);
  const chordIdxRef = useRef(0);
  const timerRef = useRef(null);

  const build = useCallback(() => {
    if (ctxRef.current) return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ctx = new Ctx();
    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);

    const delay = ctx.createDelay(0.8);
    delay.delayTime.value = 0.6;
    const fb = ctx.createGain();
    fb.gain.value = 0.42;
    const wet = ctx.createGain();
    wet.gain.value = 0.18;
    delay.connect(fb);
    fb.connect(delay);
    delay.connect(wet);
    wet.connect(master);
    master.connect(delay);

    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 700;
    lp.Q.value = 0.6;
    lp.connect(master);

    ctxRef.current = ctx;
    masterRef.current = { master, lp };

    const playChord = () => {
      if (!ctxRef.current) return;
      const now = ctx.currentTime;
      const chord = CHORDS[chordIdxRef.current % CHORDS.length];
      chord.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.value = freq;
        osc.detune.value = (Math.random() - 0.5) * 8;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(i === 0 ? 0.07 : 0.05, now + 2.5);
        gain.gain.linearRampToValueAtTime(0.0001, now + 9.5);
        osc.connect(gain);
        gain.connect(masterRef.current.lp);
        osc.start(now);
        osc.stop(now + 10);
      });

      const oct = ctx.createOscillator();
      oct.type = "sine";
      oct.frequency.value = chord[0] / 2;
      const og = ctx.createGain();
      og.gain.setValueAtTime(0, now);
      og.gain.linearRampToValueAtTime(0.05, now + 4);
      og.gain.linearRampToValueAtTime(0.0001, now + 11);
      oct.connect(og);
      og.connect(masterRef.current.lp);
      oct.start(now);
      oct.stop(now + 12);

      const pad = ctx.createOscillator();
      pad.type = "triangle";
      pad.frequency.value = chord[0] * 1.5;
      const pg = ctx.createGain();
      pg.gain.value = 0.012;
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.07;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 0.008;
      lfo.connect(lfoGain);
      lfoGain.connect(pg.gain);
      pad.connect(pg);
      pg.connect(masterRef.current.master);
      pad.start(now);
      lfo.start(now);
      pad.stop(now + 30);
      voicesRef.current.push({ pad, lfo });
    };

    playChord();
    chordIdxRef.current += 1;
    timerRef.current = setInterval(() => {
      playChord();
      chordIdxRef.current += 1;
    }, 12000);
  }, []);

  const toggle = () => {
    if (!on) {
      build();
      const ctx = ctxRef.current;
      if (ctx.state === "suspended") ctx.resume();
      masterRef.current.master.gain.cancelScheduledValues(ctx.currentTime);
      masterRef.current.master.gain.setTargetAtTime(0.22, ctx.currentTime, 1.2);
      setOn(true);
    } else {
      const ctx = ctxRef.current;
      if (ctx) {
        masterRef.current.master.gain.cancelScheduledValues(ctx.currentTime);
        masterRef.current.master.gain.setTargetAtTime(0, ctx.currentTime, 0.6);
      }
      setOn(false);
    }
  };

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
    voicesRef.current.forEach(({ pad, lfo }) => {
      try { pad.stop(); lfo.stop(); } catch { /* noop */ }
    });
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
