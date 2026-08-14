import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Users,
  Check,
  Ticket,
  ShieldCheck,
  Moon,
  Star,
  ArrowRight,
  ChevronRight,
} from "lucide-react";
import { bookProduct, latestProduct, fmtDate } from "../api.js";
import { useOperation } from "../hooks/useOperation.js";
import { ProductImage, GALLERY } from "../components/Images.jsx";
import SectionHero from "../components/SectionHero.jsx";

export default function Experiences({ opId }) {
  const { op } = useOperation(opId);
  const [product, setProduct] = useState(null);
  const [booked, setBooked] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", guests: 2 });
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (op.product) setProduct(op.product);
  }, [op.product]);

  useEffect(() => {
    if (!product) {
      latestProduct()
        .then((r) => r.product && setProduct(r.product))
        .catch(() => {});
    }
  }, [product]);

  const submit = async () => {
    setErr("");
    if (!form.name.trim() || !form.email.trim()) {
      setErr("Please enter your name and email.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await bookProduct(form);
      setBooked(res.booking);
    } catch (e) {
      setErr(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <SectionHero
        chapter="Chapter 04 · The Product"
        kicker="VIRELLE EXPERIENCES"
        title="What the Maker built"
        sub="A working, customer-facing product with a real booking flow — constructed by Julian Mercer from Sofia's design."
        image={GALLERY.dining.src}
        imageAlt="VIRELLE experience"
      />
      <div className="relative z-10 mx-auto max-w-6xl px-6 py-12">
      {!product ? (
        <div className="glass mt-12 rounded-2xl p-12 text-center">
          <Moon size={26} className="mx-auto text-gold-500/60" />
          <p className="mt-4 font-serif text-xl text-cream">No experience built yet</p>
          <p className="mt-2 text-sm text-cream/45">
            Run an operation and the Maker will design and register a bookable experience here.
          </p>
        </div>
      ) : (
        <div className="mt-12 grid gap-8 lg:grid-cols-12">
          {/* HERO + GALLERY */}
          <div className="lg:col-span-7">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass overflow-hidden rounded-3xl"
            >
              <ProductImage
                subject={product.gallery?.[0]?.image || "suite"}
                alt={product.gallery?.[0]?.alt}
                className="h-[26rem] w-full"
              />
              <div className="p-8">
                <p className="font-mono text-[10px] tracking-widest text-gold-500/70">
                  THE VIRELLE DUBLIN · PRESENTS
                </p>
                <h2 className="mt-2 font-serif text-4xl text-cream">{product.experience_name}</h2>
                <p className="mt-1 font-serif text-lg italic text-gold-300">{product.tagline}</p>
                <p className="mt-4 max-w-2xl text-sm leading-relaxed text-cream/60">
                  {product.description}
                </p>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {(product.highlights || []).map((h, i) => (
                    <div key={i} className="flex items-start gap-3 rounded-xl border border-cream/8 bg-ink-950/50 px-4 py-3">
                      <Star size={14} className="mt-0.5 shrink-0 text-gold-400" />
                      <span className="text-[13px] text-cream/75">{h}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {(product.gallery?.length ? product.gallery : [{ image: "room" }, { image: "dining" }, { image: "cocktail" }, { image: "spa" }]).map(
                (g, i) => (
                  <ProductImage key={i} subject={g.image} alt={g.alt} className="h-48 w-full rounded-2xl" />
                )
              )}
            </div>

            {/* includes */}
            <div className="glass mt-6 rounded-2xl p-7">
              <p className="font-mono text-[10px] tracking-widest text-cream/50">THE EXPERIENCE INCLUDES</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {(product.includes || []).map((inc, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-gold-500/30 bg-gold-500/10">
                      <Check size={13} className="text-gold-300" />
                    </span>
                    <div>
                      <p className="text-sm text-cream/85">{inc.label}</p>
                      {inc.note && <p className="text-[11px] text-cream/40">{inc.note}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* BOOKING COLUMN */}
          <div className="lg:col-span-5">
            <div className="glass sticky top-24 rounded-3xl p-7">
              {booked ? (
                <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}>
                  <div className="grid h-14 w-14 place-items-center rounded-full border border-emerald-400/40 bg-emerald-400/10">
                    <Ticket size={24} className="text-emerald-300" />
                  </div>
                  <h3 className="mt-4 font-serif text-2xl text-cream">Reservation confirmed</h3>
                  <p className="mt-2 text-sm text-cream/55">
                    Thank you, {form.name}. The experience has been booked and written to the
                    hotel's real booking system.
                  </p>
                  <div className="mt-5 rounded-2xl border border-gold-500/20 bg-gold-500/5 p-5">
                    <p className="font-mono text-[10px] tracking-widest text-gold-500/70">BOOKING REFERENCE</p>
                    <p className="mt-1 font-serif text-3xl tracking-widest text-gold-300">
                      {booked.booking_ref}
                    </p>
                    <div className="mt-3 space-y-1.5 text-sm text-cream/70">
                      <p className="flex items-center gap-2">
                        <Calendar size={13} className="text-gold-400" /> {fmtDate(product.stay_date)}
                      </p>
                      <p className="flex items-center gap-2">
                        <Users size={13} className="text-gold-400" /> {form.guests} guests
                      </p>
                      <p className="flex items-center gap-2">
                        <ShieldCheck size={13} className="text-gold-400" /> Status: confirmed
                      </p>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-[11px] text-cream/45">{product.price_note || "per couple, one night"}</p>
                      <p className="font-serif text-4xl text-cream">
                        €{product.price}
                        <span className="text-base text-cream/40"> / couple</span>
                      </p>
                    </div>
                    <span className="rounded-full border border-cream/10 px-3 py-1 font-mono text-[9px] tracking-widest text-cream/45">
                      LIMITED · {product.capacity} EXPERIENCES
                    </span>
                  </div>

                  <div className="mt-5 flex items-center gap-3 rounded-xl border border-cream/8 bg-ink-950/50 px-4 py-3">
                    <Calendar size={15} className="text-gold-400" />
                    <div>
                      <p className="text-[13px] text-cream/85">{fmtDate(product.stay_date)}</p>
                      <p className="text-[10px] text-cream/40">{product.duration || "One night"} · {product.tagline}</p>
                    </div>
                  </div>

                  <div className="mt-5 space-y-3">
                    <input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Full name"
                      className="w-full rounded-xl border border-cream/10 bg-ink-950/70 px-4 py-3 text-sm text-cream placeholder:text-cream/30 focus:border-gold-500/40"
                    />
                    <input
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="Email address"
                      type="email"
                      className="w-full rounded-xl border border-cream/10 bg-ink-950/70 px-4 py-3 text-sm text-cream placeholder:text-cream/30 focus:border-gold-500/40"
                    />
                    <div className="flex items-center justify-between rounded-xl border border-cream/10 bg-ink-950/70 px-4 py-3">
                      <span className="flex items-center gap-2 text-sm text-cream/70">
                        <Users size={14} className="text-gold-400" /> Guests
                      </span>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setForm((f) => ({ ...f, guests: Math.max(2, f.guests - 1) }))}
                          className="h-7 w-7 rounded-full border border-cream/15 text-cream/70 hover:border-gold-500/40"
                        >
                          −
                        </button>
                        <span className="w-4 text-center text-sm text-cream">{form.guests}</span>
                        <button
                          onClick={() => setForm((f) => ({ ...f, guests: Math.min(4, f.guests + 1) }))}
                          className="h-7 w-7 rounded-full border border-cream/15 text-cream/70 hover:border-gold-500/40"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  {err && <p className="mt-3 text-xs text-rose-300">{err}</p>}

                  <button
                    onClick={submit}
                    disabled={submitting}
                    className="group mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gold-fade py-4 text-sm font-medium text-ink-950 shadow-glow transition-transform hover:scale-[1.02] disabled:opacity-50"
                  >
                    {product.cta_text || "Reserve the experience"}
                    <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
                  </button>

                  <p className="mt-4 flex items-start gap-2 text-[10.5px] leading-relaxed text-cream/40">
                    <ShieldCheck size={12} className="mt-0.5 shrink-0 text-gold-500/60" />
                    This is a live reservation. On confirmation, your booking is written to the
                    Virelle Dublin's hotel database through the Hospitality Operations MCP.
                  </p>
                </>
              )}
            </div>

            {(product.terms || []).length > 0 && (
              <div className="glass mt-4 rounded-2xl p-5">
                <p className="font-mono text-[9px] tracking-widest text-cream/40">TERMS</p>
                <ul className="mt-2 space-y-1.5">
                  {product.terms.map((t, i) => (
                    <li key={i} className="flex items-start gap-2 text-[11px] text-cream/50">
                      <ChevronRight size={11} className="mt-0.5 shrink-0 text-gold-500/50" /> {t}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
      </div>
    </>
  );
}
