"use client";

import { useEffect, useRef } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { gsap } from "gsap";
import { Gauge, ShieldCheck, ReceiptText, Sparkles } from "lucide-react";

const FEATURES = [
  { icon: Gauge, title: "Real-time pipeline", copy: "Leads, follow-ups and stock at a glance." },
  { icon: ReceiptText, title: "One-tap invoicing", copy: "Convert a lead to a printed sale in seconds." },
  { icon: ShieldCheck, title: "Role-based access", copy: "Owner, manager and staff — each sees their lane." },
];

/**
 * The cinematic left panel of the login screen.
 * GSAP drives a slow drifting aurora + subtle pointer parallax; Framer Motion
 * staggers the brand content in. Both honour prefers-reduced-motion.
 */
export function BrandPanel() {
  const reduce = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const blobsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reduce) return;
    const ctx = gsap.context(() => {
      const blobs = gsap.utils.toArray<HTMLElement>(".aurora-blob");
      blobs.forEach((el, i) => {
        gsap.to(el, {
          xPercent: i % 2 === 0 ? 14 : -12,
          yPercent: i % 2 === 0 ? -10 : 12,
          scale: 1.18,
          duration: 9 + i * 2.5,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      });
    }, rootRef);

    // Subtle parallax: nudge the aurora toward the pointer.
    const onMove = (e: PointerEvent) => {
      const r = rootRef.current?.getBoundingClientRect();
      if (!r || !blobsRef.current) return;
      const dx = (e.clientX - (r.left + r.width / 2)) / r.width;
      const dy = (e.clientY - (r.top + r.height / 2)) / r.height;
      gsap.to(blobsRef.current, {
        x: dx * 28,
        y: dy * 28,
        duration: 0.9,
        ease: "power2.out",
      });
    };
    const node = rootRef.current;
    node?.addEventListener("pointermove", onMove);
    return () => {
      node?.removeEventListener("pointermove", onMove);
      ctx.revert();
    };
  }, [reduce]);

  const container: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.12, delayChildren: 0.15 } },
  };
  const item: Variants = {
    hidden: { opacity: 0, y: reduce ? 0 : 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
  };

  return (
    <div
      ref={rootRef}
      className="relative hidden overflow-hidden bg-[linear-gradient(160deg,#0c4a45_0%,#0a3a37_46%,#062725_100%)] lg:flex lg:flex-col lg:justify-between"
    >
      {/* Aurora layer */}
      <div ref={blobsRef} className="pointer-events-none absolute inset-0">
        <div className="aurora-blob absolute -left-24 top-[-10%] h-[42rem] w-[42rem] rounded-full bg-teal-400/25 blur-[120px]" />
        <div className="aurora-blob absolute right-[-15%] top-[18%] h-[34rem] w-[34rem] rounded-full bg-cyan-300/20 blur-[120px]" />
        <div className="aurora-blob absolute bottom-[-18%] left-[22%] h-[38rem] w-[38rem] rounded-full bg-emerald-400/20 blur-[130px]" />
      </div>

      {/* Grain + vignette for tactile depth */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_120%_at_50%_0%,transparent_40%,rgba(3,20,19,0.55)_100%)]" />

      {/* Content */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative z-10 flex h-full flex-col justify-between p-12 xl:p-16"
      >
        <motion.div variants={item} className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="VOZIDEX"
            className="h-16 w-16 object-contain drop-shadow-[0_4px_14px_rgba(0,0,0,0.35)]"
          />
          <span className="text-xl font-semibold tracking-tight text-white">
            VOZIDEX
          </span>
        </motion.div>

        <div>
          <motion.div
            variants={item}
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-teal-100 backdrop-blur"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Dealership operations, refined
          </motion.div>
          <motion.h1
            variants={item}
            className="max-w-md text-4xl font-semibold leading-[1.1] tracking-tight text-white xl:text-5xl"
          >
            Run the whole garage from one calm screen.
          </motion.h1>
          <motion.p
            variants={item}
            className="mt-4 max-w-sm text-[15px] leading-relaxed text-teal-100/70"
          >
            Leads, inventory, accessories, sales and invoicing — kept in sync,
            beautifully organised, and always at hand.
          </motion.p>

          <motion.ul variants={item} className="mt-10 space-y-4">
            {FEATURES.map((f) => (
              <li key={f.title} className="flex items-start gap-3.5">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/10 text-teal-200 backdrop-blur">
                  <f.icon className="h-[18px] w-[18px]" />
                </span>
                <div>
                  <p className="text-sm font-medium text-white">{f.title}</p>
                  <p className="text-[13px] text-teal-100/60">{f.copy}</p>
                </div>
              </li>
            ))}
          </motion.ul>
        </div>

        <motion.p variants={item} className="text-xs text-teal-100/50">
          © {"2026"} VOZIDEX Motors · Secure staff access
        </motion.p>
      </motion.div>
    </div>
  );
}
