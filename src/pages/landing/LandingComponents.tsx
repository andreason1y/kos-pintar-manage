import { useRef } from "react";
import { motion, useInView } from "framer-motion";

/* ─── Fade-in wrapper ─── */
export function FadeIn({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: [0.25, 0.4, 0.25, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── Phone Mockup — Notion-style minimal ─── */
export function PhoneMockup({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative mx-auto ${className}`} role="img" aria-label="Tampilan aplikasi KosPintar">
      <div className="rounded-[2rem] border-2 border-foreground/10 bg-background shadow-xl overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-4 bg-foreground/10 rounded-b-lg z-10" />
        <div className="pt-5 overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}

/* ─── Section wrapper ─── */
export function Section({ children, className = "", id }: { children: React.ReactNode; className?: string; id?: string }) {
  return (
    <section id={id} className={`px-5 md:px-8 py-16 md:py-24 ${className}`}>
      {children}
    </section>
  );
}

/* ─── Section heading ─── */
export function SectionHeading({ tag, title, subtitle }: { tag?: string; title: string; subtitle?: string }) {
  return (
    <div className="text-center max-w-2xl mx-auto mb-10 md:mb-14">
      {tag && (
        <span className="inline-block text-xs font-semibold tracking-wide uppercase text-accent mb-3">
          {tag}
        </span>
      )}
      <h2 className="text-2xl md:text-4xl font-bold tracking-tighter text-foreground text-balance">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-3 text-sm md:text-base text-muted-foreground leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
}
