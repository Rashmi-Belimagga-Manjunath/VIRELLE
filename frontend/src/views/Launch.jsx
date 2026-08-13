import React from "react";
import { motion } from "framer-motion";
import {
  Megaphone,
  Instagram,
  Mail,
  Globe,
  CalendarClock,
  Target,
  Quote,
  ArrowUpRight,
} from "lucide-react";
import { useOperation } from "../hooks/useOperation.js";

export default function Launch({ opId }) {
  const { op } = useOperation(opId);
  const campaign = op.campaign || null;

  return (
    <div className="relative z-10 mx-auto max-w-6xl px-6 py-12">
      <div className="text-center">
        <p className="font-mono text-[11px] tracking-widest2 text-gold-500/80">VIRELLE LAUNCH</p>
        <h1 className="mt-2 font-serif text-4xl text-cream md:text-5xl">The go-to-market</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-cream/55">
          The campaign Amelia Bennett crafted to turn the product into demand —
          grounded in the real product, price and stay date.
        </p>
      </div>

      {!campaign ? (
        <div className="glass mt-12 rounded-2xl p-12 text-center">
          <Megaphone size={26} className="mx-auto text-gold-500/60" />
          <p className="mt-4 font-serif text-xl text-cream">No campaign created yet</p>
          <p className="mt-2 text-sm text-cream/45">
            Run an operation and the Communicator will design the full launch here.
          </p>
        </div>
      ) : (
        <div className="mt-12">
          {/* campaign hero */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-3xl border border-pink-400/15 bg-gradient-to-br from-ink-800 via-ink-900 to-ink-950 p-10"
          >
            <div className="aurora h-80 w-80 bg-pink-500/15" />
            <p className="font-mono text-[10px] tracking-widest text-pink-300/70">THE CAMPAIGN</p>
            <h2 className="relative mt-3 font-serif text-4xl tracking-tight text-cream md:text-6xl">
              {campaign.campaign_name}
            </h2>
            <div className="relative mt-6 max-w-2xl border-l-2 border-pink-400/40 pl-5">
              <Quote size={16} className="text-pink-400/70" />
              <p className="mt-2 text-lg leading-relaxed text-cream/80">{campaign.positioning}</p>
            </div>
            <div className="relative mt-6 flex flex-wrap gap-4">
              <div className="flex items-center gap-2 rounded-full border border-cream/10 px-4 py-2 text-[12px] text-cream/70">
                <Target size={13} className="text-pink-300" /> {campaign.audience}
              </div>
              <div className="flex items-center gap-2 rounded-full border border-gold-500/25 bg-gold-500/5 px-4 py-2 text-[12px] text-gold-200">
                <ArrowUpRight size={13} /> {campaign.call_to_action}
              </div>
            </div>
          </motion.div>

          {/* messaging by channel */}
          <div className="mt-10">
            <h3 className="font-serif text-2xl text-cream">Messaging by channel</h3>
            <div className="mt-5 grid gap-4 lg:grid-cols-3">
              {/* instagram */}
              <div className="glass rounded-2xl p-6">
                <div className="flex items-center gap-2">
                  <Instagram size={15} className="text-pink-300" />
                  <span className="font-mono text-[10px] tracking-widest text-cream/50">INSTAGRAM</span>
                </div>
                <div className="mt-4 space-y-4">
                  {(campaign.messages?.instagram || []).map((post, i) => (
                    <div key={i} className="rounded-xl border border-cream/8 bg-ink-950/50 p-4">
                      <p className="text-sm leading-relaxed text-cream/80">{post.post}</p>
                      <p className="mt-2 font-mono text-[10px] text-pink-300/70">{post.hashtags}</p>
                      <p className="mt-1.5 text-[10.5px] text-cream/40">
                        <span className="text-gold-500/60">Visual: </span>
                        {post.visual}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* email */}
              <div className="glass rounded-2xl p-6">
                <div className="flex items-center gap-2">
                  <Mail size={15} className="text-teal-300" />
                  <span className="font-mono text-[10px] tracking-widest text-cream/50">EMAIL</span>
                </div>
                <div className="mt-4 rounded-xl border border-cream/8 bg-ink-950/50 p-4">
                  <p className="font-mono text-[10px] tracking-widest text-teal-300/80">SUBJECT LINE</p>
                  <p className="mt-1.5 font-serif text-lg text-cream">{campaign.messages?.email?.subject}</p>
                  <p className="mt-1 text-[11px] italic text-cream/45">{campaign.messages?.email?.preview}</p>
                  <div className="mt-3 border-t border-cream/8 pt-3">
                    <p className="whitespace-pre-line text-[12.5px] leading-relaxed text-cream/70">
                      {campaign.messages?.email?.body}
                    </p>
                  </div>
                </div>
              </div>

              {/* web */}
              <div className="glass rounded-2xl p-6">
                <div className="flex items-center gap-2">
                  <Globe size={15} className="text-gold-300" />
                  <span className="font-mono text-[10px] tracking-widest text-cream/50">WEB</span>
                </div>
                <div className="relative mt-4 overflow-hidden rounded-xl border border-cream/8 bg-gradient-to-br from-ink-850 to-ink-950 p-5">
                  <p className="font-mono text-[9px] tracking-widest text-gold-500/60">VIRELLE DUBLIN</p>
                  <p className="mt-2 font-serif text-xl leading-snug text-cream">
                    {campaign.messages?.web}
                  </p>
                </div>
                <div className="mt-4 rounded-xl border border-gold-500/20 bg-gold-500/5 p-4">
                  <p className="font-mono text-[10px] tracking-widest text-gold-500/70">WHY THIS CAMPAIGN</p>
                  <p className="mt-1.5 text-[12px] leading-relaxed text-cream/65">
                    {campaign.campaign_rationale}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* launch schedule */}
          <div className="glass mt-10 rounded-2xl p-7">
            <h3 className="flex items-center gap-2 font-serif text-2xl text-cream">
              <CalendarClock size={18} className="text-gold-400" /> Launch schedule
            </h3>
            <div className="relative mt-6 flex flex-col gap-5">
              <div className="absolute bottom-4 left-[11px] top-4 w-px bg-gradient-to-b from-pink-400/50 via-gold-500/30 to-cream/10" />
              {(campaign.launch_schedule || []).map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="relative flex items-start gap-5"
                >
                  <span className="relative z-10 mt-1 grid h-6 w-6 place-items-center rounded-full border border-pink-400/40 bg-ink-950">
                    <span className="h-2 w-2 rounded-full bg-pink-400" />
                  </span>
                  <div>
                    <p className="font-mono text-[10px] tracking-widest text-pink-300/80">{step.phase}</p>
                    <p className="mt-1 text-sm text-cream/80">{step.action}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
