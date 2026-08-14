import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Wind, Droplets, Calendar, CloudSun, RefreshCw } from "lucide-react";
import { livePayload } from "../api.js";
import CinematicImage from "../components/CinematicImage.jsx";
import { WEATHER_IMAGES } from "../components/Images.jsx";

export default function LiveWeatherCard({ className = "" }) {
  const [weather, setWeather] = useState(null);
  const [liveAt, setLiveAt] = useState(null);

  useEffect(() => {
    let mounted = true;
    const probe = () =>
      livePayload()
        .then((r) => {
          if (!mounted) return;
          setWeather(r?.weather?.summary || null);
          setLiveAt(r?.fetched_at || null);
        })
        .catch(() => {});
    probe();
    const t = setInterval(probe, 60000);
    return () => {
      mounted = false;
      clearInterval(t);
    };
  }, []);

  const kind = weather?.condition_kind || "clear";
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.9 }}
      className={`float-slow pointer-events-auto w-64 ${className}`}
    >
      <div className="glass overflow-hidden rounded-2xl border border-cream/10 shadow-glow">
        <div className="relative h-20">
          <CinematicImage
            src={WEATHER_IMAGES[kind] || WEATHER_IMAGES.clear}
            alt="Dublin live weather"
            className="h-full w-full"
            speed={0.6}
            kenburns={false}
            hoverParallax={false}
            fallbacks={[WEATHER_IMAGES[kind] || WEATHER_IMAGES.clear]}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink-950/80 to-transparent" />
          <p className="absolute bottom-1.5 left-3 flex items-center gap-1.5 font-mono text-[8px] tracking-widest text-cream/70">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 pulse-dot" />
            LIVE · OPEN-METEO · DUBLIN
          </p>
        </div>

        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-end gap-2">
              <span className="font-serif text-4xl leading-none text-cream">
                {weather ? `${Math.round(weather.temperature_c)}°` : "…"}
              </span>
              <CloudSun size={18} className="mb-0.5 text-gold-400" />
            </div>
            <span className="text-right text-[11px] leading-tight text-cream/65">
              {weather?.condition || "Dublin"}
              <br />
              <span className="font-mono text-[8px] text-cream/40">
                {liveAt ? new Date(liveAt).toLocaleTimeString("en-IE") : "…"}
              </span>
            </span>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2 border-t border-cream/10 pt-3">
            <div className="text-center">
              <Wind size={12} className="mx-auto text-gold-400" />
              <p className="mt-1 font-mono text-[9px] text-cream/60">
                {weather ? `${weather.wind_kmh}` : "…"}
                <span className="text-cream/35"> km/h</span>
              </p>
            </div>
            <div className="text-center">
              <Droplets size={12} className="mx-auto text-gold-400" />
              <p className="mt-1 font-mono text-[9px] text-cream/60">
                {weather ? `${weather.humidity}` : "…"}
                <span className="text-cream/35">%</span>
              </p>
            </div>
            <div className="text-center">
              <Calendar size={12} className="mx-auto text-gold-400" />
              <p className="mt-1 font-mono text-[9px] text-cream/60">
                {weather ? `${Math.round(weather.forecast?.[0]?.precip_prob ?? 0)}` : "…"}
                <span className="text-cream/35">% rain</span>
              </p>
            </div>
          </div>

          <p className="mt-3 flex items-center gap-1 font-mono text-[8px] tracking-widest text-emerald-400/80">
            <RefreshCw size={9} /> AUTO-REFRESHES EVERY 60s
          </p>
        </div>
      </div>
    </motion.div>
  );
}
