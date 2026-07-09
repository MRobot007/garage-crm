"use client";

import { useEffect, useRef } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { gsap } from "gsap";
import { Gauge, ShieldCheck, ReceiptText, Sparkles } from "lucide-react";
import { displayFont } from "@/lib/fonts";

const HEADLINE = "Run the whole dealership from one calm screen.";

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
  const wordWrap: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.05, delayChildren: 0.3 } },
  };
  const word: Variants = {
    hidden: { opacity: 0, y: reduce ? 0 : 20, filter: reduce ? "none" : "blur(6px)" },
    show: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] },
    },
  };

  return (
    <div
      ref={rootRef}
      className="relative hidden overflow-hidden bg-[linear-gradient(160deg,#20242c_0%,#191c22_46%,#101216_100%)] lg:flex lg:flex-col lg:justify-between"
    >
      {/* Aurora layer */}
      <div ref={blobsRef} className="pointer-events-none absolute inset-0">
        <div className="aurora-blob absolute -left-24 top-[-10%] h-[42rem] w-[42rem] rounded-full bg-red-400/25 blur-[120px]" />
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
        <motion.div variants={item} className="flex items-center gap-4">
          <motion.div
            className="relative"
            animate={reduce ? undefined : { y: [0, -7, 0] }}
            transition={
              reduce ? undefined : { duration: 5, repeat: Infinity, ease: "easeInOut" }
            }
          >
            {/* soft brand glow behind the mark */}
            <div className="absolute inset-0 rounded-full bg-red-300/25 blur-2xl" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="VOZIDEX"
              className="relative h-28 w-28 object-contain drop-shadow-[0_8px_22px_rgba(0,0,0,0.45)]"
            />
          </motion.div>
          <span
            className={`${displayFont.className} -skew-x-6 text-4xl font-bold uppercase tracking-[0.06em] text-white`}
          >
            VOZIDEX
          </span>
        </motion.div>

        <div>
          <motion.div
            variants={item}
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-red-100 backdrop-blur"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Dealership operations, refined
          </motion.div>
          <motion.h1
            variants={wordWrap}
            className={`${displayFont.className} max-w-lg text-5xl font-semibold uppercase leading-[1.03] tracking-tight text-white xl:text-6xl`}
          >
            {HEADLINE.split(" ").map((w, i) => (
              <motion.span key={i} variants={word} className="mr-[0.26em] inline-block">
                {w}
              </motion.span>
            ))}
          </motion.h1>
          <motion.p
            variants={item}
            className="mt-4 max-w-sm text-[15px] leading-relaxed text-red-100/70"
          >
            Leads, inventory, accessories, sales and invoicing — kept in sync,
            beautifully organised, and always at hand.
          </motion.p>

          <motion.ul variants={item} className="mt-10 space-y-4">
            {FEATURES.map((f) => (
              <li key={f.title} className="flex items-start gap-3.5">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/10 text-red-200 backdrop-blur">
                  <f.icon className="h-[18px] w-[18px]" />
                </span>
                <div>
                  <p className="text-sm font-medium text-white">{f.title}</p>
                  <p className="text-[13px] text-red-100/60">{f.copy}</p>
                </div>
              </li>
            ))}
          </motion.ul>
        </div>

        <motion.p variants={item} className="text-xs text-red-100/50">
          © {"2026"} VOZIDEX Motors · Secure staff access
        </motion.p>
      </motion.div>
    </div>
  );
}
