import React from "react";
import CinematicImage from "./CinematicImage";

export const FALLBACKS = [
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?q=80&w=1600&auto=format&fit=crop",
];

export const GALLERY = {
  hero: {
    src: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?q=80&w=2400&auto=format&fit=crop",
    label: "The Virelle Dublin",
  },
  lobby: {
    src: "https://images.unsplash.com/photo-1564501049412-61c2a3083791?q=80&w=1600&auto=format&fit=crop",
    label: "Lobby",
  },
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
  dublinNight: {
    src: "https://images.unsplash.com/photo-1519280264946-63b276648c34?q=80&w=1600&auto=format&fit=crop",
    label: "Dublin by night",
  },
  champagne: {
    src: "https://images.unsplash.com/photo-1578926375605-eaf7559b5028?q=80&w=1600&auto=format&fit=crop",
    label: "Champagne",
  },
  suite: {
    src: "https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=1600&auto=format&fit=crop",
    label: "Suite",
  },
  terrace: {
    src: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=1600&auto=format&fit=crop",
    label: "Terrace",
  },
  event: {
    src: "https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=1600&auto=format&fit=crop",
    label: "Event",
  },
  concert: {
    src: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?q=80&w=1600&auto=format&fit=crop",
    label: "Live music",
  },
  foodFest: {
    src: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=1600&auto=format&fit=crop",
    label: "Festival food",
  },
};

export const WEATHER_IMAGES = {
  clear: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2000&auto=format&fit=crop",
  partly: "https://images.unsplash.com/photo-1508780709613-238b0fbb1f99?q=80&w=2000&auto=format&fit=crop",
  cloudy: "https://images.unsplash.com/photo-1499346030926-9a72daac6c63?q=80&w=2000&auto=format&fit=crop",
  fog: "https://images.unsplash.com/photo-1520095972714-909e91b038e5?q=80&w=2000&auto=format&fit=crop",
  drizzle: "https://images.unsplash.com/photo-1428592953211-077101b2021b?q=80&w=2000&auto=format&fit=crop",
  rain: "https://images.unsplash.com/photo-1428592953211-077101b2021b?q=80&w=2000&auto=format&fit=crop",
  snow: "https://images.unsplash.com/photo-1491002052546-bf38f186af56?q=80&w=2000&auto=format&fit=crop",
  storm: "https://images.unsplash.com/photo-1500462918059-b1a0cb512f1d?q=80&w=2000&auto=format&fit=crop",
};

export const PORTRAITS = [
  {
    src: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=800&auto=format&fit=crop",
    alt: "Eleanor Hayes",
  },
  {
    src: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=800&auto=format&fit=crop",
    alt: "Sofia Laurent",
  },
  {
    src: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=800&auto=format&fit=crop",
    alt: "Julian Mercer",
  },
  {
    src: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=800&auto=format&fit=crop",
    alt: "Amelia Vance",
  },
  {
    src: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop",
    alt: "Alexander Reid",
  },
];

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
  if (s.includes("festival") || s.includes("food") || s.includes("grill")) return GALLERY.foodFest;
  if (s.includes("music") || s.includes("concert") || s.includes("live")) return GALLERY.concert;
  if (s.includes("event")) return GALLERY.event;
  return null;
}

export function ProductImage({ subject, alt, className = "", overlay = true, speed = 1 }) {
  const img = matchImage(subject);
  const src = img?.src || FALLBACKS[0];
  return (
    <CinematicImage
      src={src}
      alt={alt || img?.label || subject}
      className={className}
      speed={speed}
    >
      {overlay && (
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-950/80 via-transparent to-transparent" />
      )}
    </CinematicImage>
  );
}
