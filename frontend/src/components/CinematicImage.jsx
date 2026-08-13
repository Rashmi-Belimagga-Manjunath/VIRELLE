import React, { useEffect, useRef, useState } from "react";

const FALLBACKS = [
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?q=80&w=1600&auto=format&fit=crop",
];

/**
 * Real photograph with cinematic motion:
 * - slow Ken Burns drift (never static)
 * - gentle scroll-driven parallax
 * - mouse-move parallax while hovering
 * - graceful fallback chain so a broken URL never leaves a blank space
 */
export default function CinematicImage({
  src,
  alt,
  className = "",
  imgClassName = "",
  speed = 1,
  kenburns = true,
  hoverParallax = true,
  fallbacks = FALLBACKS,
  children,
  ...rest
}) {
  const wrapRef = useRef(null);
  const [srcIdx, setSrcIdx] = useState(0);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [scrollY, setScrollY] = useState(0);
  const chain = src ? [src, ...fallbacks] : fallbacks;

  useEffect(() => {
    const onScroll = () => {
      const el = wrapRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const pct = (r.top + r.height / 2 - window.innerHeight / 2) / window.innerHeight;
      setScrollY(-pct * 40 * speed);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [speed]);

  const onMove = (e) => {
    if (!hoverParallax) return;
    const r = wrapRef.current?.getBoundingClientRect();
    if (!r) return;
    const nx = (e.clientX - r.left) / r.width - 0.5;
    const ny = (e.clientY - r.top) / r.height - 0.5;
    setPos({ x: nx * 26, y: ny * 18 });
  };

  return (
    <div
      ref={wrapRef}
      onMouseMove={onMove}
      onMouseLeave={() => setPos({ x: 0, y: 0 })}
      className={`relative overflow-hidden ${className}`}
      {...rest}
    >
      {chain.slice(0, srcIdx + 1).map((u, i) => (
        <img
          key={u + i}
          src={u}
          alt={alt}
          loading={i === 0 ? "lazy" : "eager"}
          onError={() => i === srcIdx && srcIdx < chain.length - 1 && setSrcIdx(srcIdx + 1)}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
            i === srcIdx ? "opacity-100" : "opacity-0"
          } ${imgClassName}`}
          style={{
            transform: `translate3d(${pos.x}px, ${pos.y + scrollY}px, 0) scale(${
              kenburns ? 1.12 : 1
            })`,
          }}
          draggable="false"
        />
      ))}
      <div className="absolute inset-0" aria-hidden="true" />
      {children}
    </div>
  );
}
