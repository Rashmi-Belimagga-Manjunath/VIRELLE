import React, { useState } from "react";

export const GALLERY = {
  spa: {
    src: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=1600&auto=format&fit=crop",
    label: "Spa",
  },
  room: {
    src: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?q=80&w=1600&auto=format&fit=crop",
    label: "Suite",
  },
  dining: {
    src: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=1600&auto=format&fit=crop",
    label: "Dining",
  },
  cocktail: {
    src: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?q=80&w=1600&auto=format&fit=crop",
    label: "Cocktails",
  },
  rooftop: {
    src: "https://images.unsplash.com/photo-1524578271613-d550eacf6090?q=80&w=1600&auto=format&fit=crop",
    label: "Rooftop",
  },
  chauffeur: {
    src: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=1600&auto=format&fit=crop",
    label: "Chauffeur",
  },
  dublin: {
    src: "https://images.unsplash.com/photo-1549918864-48ac978761a4?q=80&w=1600&auto=format&fit=crop",
    label: "Dublin",
  },
  champagne: {
    src: "https://images.unsplash.com/photo-1578926375605-eaf7559b5028?q=80&w=1600&auto=format&fit=crop",
    label: "Champagne",
  },
  suite: {
    src: "https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=1600&auto=format&fit=crop",
    label: "Suite",
  },
};

export function matchImage(subject) {
  const s = (subject || "").toLowerCase();
  for (const [key, img] of Object.entries(GALLERY)) {
    if (s.includes(key)) return img;
  }
  if (s.includes("suite") || s.includes("room") || s.includes("stay")) return GALLERY.room;
  if (s.includes("bar") || s.includes("cocktail") || s.includes("drink")) return GALLERY.cocktail;
  if (s.includes("restaurant") || s.includes("menu") || s.includes("dinner") || s.includes("tasting"))
    return GALLERY.dining;
  if (s.includes("spa") || s.includes("ritual") || s.includes("wellness")) return GALLERY.spa;
  if (s.includes("city") || s.includes("dublin") || s.includes("rooftop")) return GALLERY.dublin;
  return null;
}

export function ProductImage({ subject, alt, className = "", overlay = true }) {
  const img = matchImage(subject);
  const [failed, setFailed] = useState(false);
  if (!img || failed) {
    return (
      <div className={`relative flex items-center justify-center overflow-hidden ${className}`}>
        <div className="absolute inset-0 bg-gradient-to-br from-ink-700 via-ink-850 to-ink-950" />
        <div className="aurora h-72 w-72 bg-gold-500/20" />
        <div className="relative font-serif text-lg tracking-[0.3em] text-gold-400/70">
          VIRELLE
        </div>
      </div>
    );
  }
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <img
        src={img.src}
        alt={alt || img.label}
        onError={() => setFailed(true)}
        loading="lazy"
        className="h-full w-full object-cover"
      />
      {overlay && (
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-950/80 via-transparent to-transparent" />
      )}
    </div>
  );
}
