import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Check,
  TrendingUp,
  ArrowRight,
  Wand2,
  ShieldCheck,
} from "lucide-react";

/**
 * FeatureAiMockup — visual konversi untuk fitur "AI Copywriter" CV-Buff.
 *
 * Sebuah kartu bergaya editor. Kalimat lemah ("Saya mengurus tim penjualan")
 * ditampilkan, lalu AI merombaknya menjadi kalimat kuat & terukur:
 *
 *  active === 0 → "Auto-Rewrite Berbasis Data"
 *    Kalimat lemah tercoret/memudar, kalimat kuat DIKETIK ULANG oleh AI
 *    (efek mesin tik + caret berkedip). Chip metrik muncul berurutan,
 *    pil "AI Copywriter" berdenyut, cincin ATS naik 71 → 98 (amber → emerald).
 *
 *  active === 1 → "Bebas Typo & Lolos ATS"
 *    Kalimat kuat terkunci bersih + baris konfirmasi hijau:
 *    "Grammar & ATS: lolos · ATS 98 · 0 error · 0 typo · lolos parser ATS".
 *
 * Selaras 1:1 dengan DNA hero CV-Buff (HeroMockup): kartu kaca, chrome
 * browser, kartu gelap intrinsik (engine), gradient aksen primary→blue-500,
 * glow difus, float perpetual 6s, caret berkedip, pulse dot melintas.
 * Murni JSX + Tailwind + framer-motion (tanpa gambar/SVG eksternal).
 */

interface FeatureAiMockupProps {
  active: number;
}

const STRONG_LINE =
  "Memimpin tim beranggotakan 15 orang & meningkatkan konversi B2B sebesar 34%";

const METRICS = [
  { label: "+34% konversi", tone: "emerald" as const, withIcon: true },
  { label: "15 orang", tone: "blue" as const, withIcon: false },
  { label: "Rp 2,4 M", tone: "primary" as const, withIcon: false },
];

function toneClasses(tone: "emerald" | "blue" | "primary") {
  switch (tone) {
    case "emerald":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
    case "blue":
      return "border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400";
    default:
      return "border-black/10 bg-black/[0.04] text-foreground/80 dark:border-white/10 dark:bg-white/[0.06] dark:text-foreground/90";
  }
}

/** Pil gradient-border "AI Copywriter" — resep identik dengan pil hero. */
function AiPill() {
  return (
    <div className="rounded-full bg-gradient-to-r from-primary/50 via-blue-500/40 to-primary/50 p-[1px]">
      <motion.div
        className="flex items-center gap-1.5 rounded-full bg-background/90 px-2.5 py-1 backdrop-blur-md"
        animate={{ opacity: [0.85, 1, 0.85] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
      >
        <motion.span
          animate={{ rotate: [0, 12, -8, 0], scale: [1, 1.12, 1] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          className="text-blue-500"
        >
          <Sparkles className="h-3 w-3" />
        </motion.span>
        <span className="hidden bg-gradient-to-r from-primary via-blue-500 to-primary bg-clip-text font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-transparent sm:inline">
          AI Copywriter
        </span>
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-500 opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-blue-500" />
        </span>
      </motion.div>
    </div>
  );
}

/** Efek mesin tik untuk kalimat kuat (hanya saat mode menulis ulang). */
function useTypewriter(
  text: string,
  run: boolean,
  startDelay = 650,
  speed = 24
) {
  const [typed, setTyped] = useState(run ? "" : text);

  useEffect(() => {
    if (!run) {
      setTyped(text);
      return;
    }
    setTyped("");
    let i = 0;
    let interval: ReturnType<typeof setInterval> | null = null;
    const start = setTimeout(() => {
      interval = setInterval(() => {
        i += 1;
        setTyped(text.slice(0, i));
        if (i >= text.length && interval) {
          clearInterval(interval);
          interval = null;
        }
      }, speed);
    }, startDelay);

    return () => {
      clearTimeout(start);
      if (interval) clearInterval(interval);
    };
  }, [text, run, startDelay, speed]);

  return typed;
}

/** Cincin kesiapan ATS — sapuan amber → emerald, angka berdetak naik. */
function AtsRing({ accepted }: { accepted: boolean }) {
  const target = accepted ? 98 : 71;
  const R = 26;
  const C = 2 * Math.PI * R;
  const [value, setValue] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    setValue(0);
    const from = accepted ? 71 : 0;
    const startAt = performance.now();
    const duration = 1100;
    const startDelay = accepted ? 250 : 800;

    const tick = (now: number) => {
      const elapsed = now - startAt - startDelay;
      if (elapsed < 0) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      const p = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(from + (target - from) * eased));
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [accepted, target]);

  const pct = Math.min(Math.max(value, 0), 100) / 100;
  const stroke = value >= 90 ? "#10b981" : "#f59e0b";

  return (
    <div className="relative flex h-[68px] w-[68px] shrink-0 items-center justify-center">
      <svg viewBox="0 0 64 64" className="h-full w-full -rotate-90">
        <circle
          cx="32"
          cy="32"
          r={R}
          fill="none"
          strokeWidth="5"
          className="stroke-neutral-200 dark:stroke-neutral-700"
        />
        <circle
          cx="32"
          cy="32"
          r={R}
          fill="none"
          strokeWidth="5"
          strokeLinecap="round"
          stroke={stroke}
          strokeDasharray={C}
          strokeDashoffset={C * (1 - pct)}
          style={{ filter: "drop-shadow(0 0 5px rgba(16,185,129,0.4))" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-base font-bold leading-none tabular-nums text-foreground">
          {value}
        </span>
        <span className="mt-0.5 text-[7px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          ATS
        </span>
      </div>
    </div>
  );
}

export default function FeatureAiMockup({ active }: FeatureAiMockupProps) {
  const isRewrite = active === 0;
  const typed = useTypewriter(STRONG_LINE, isRewrite);
  const typingDone = typed.length >= STRONG_LINE.length;

  // Chip metrik muncul berurutan setelah mengetik selesai (mode rewrite),
  // atau langsung tampil di mode terkunci.
  const chipDelays = useMemo(
    () => METRICS.map((_, i) => (isRewrite ? 1.7 + i * 0.22 : 0.05 + i * 0.07)),
    [isRewrite]
  );

  return (
    <div className="relative flex h-full min-h-[300px] w-full items-center justify-center">
      {/* Glow difus di belakang komposisi — resep identik dengan hero. */}
      <div className="pointer-events-none absolute -inset-6 -z-10 rounded-[2.5rem] bg-gradient-to-tr from-primary/15 via-blue-500/10 to-purple-500/10 blur-3xl" />

      {/* Float perpetual identik hero (y:[0,-10,0], 6s loop). */}
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="flex w-full"
      >
        {/* Kartu glass utama (token hero). */}
        <div className="relative flex w-full flex-col overflow-hidden rounded-2xl border border-black/5 bg-white shadow-2xl shadow-black/10 ring-1 ring-black/[0.03] dark:border-white/10 dark:bg-neutral-900">
          {/* Chrome bar (lampu lalu-lintas + nama file + pil AI). */}
          <div className="flex items-center gap-2 border-b border-black/5 bg-neutral-50 px-3 py-2.5 dark:border-white/5 dark:bg-neutral-800/60 sm:px-4">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
            <div className="ml-2 hidden items-center gap-1.5 text-[10px] font-medium text-neutral-400 dark:text-neutral-500 sm:flex">
              <Wand2 className="h-3 w-3" />
              <span className="font-mono">pengalaman_kerja.tsx</span>
            </div>
            <div className="ml-auto">
              <AiPill />
            </div>
          </div>

          {/* Body */}
          <div className="flex min-h-0 flex-1 flex-col gap-3 p-3 sm:gap-3.5 sm:p-5">
            {/* Header status — judul state + indikator live. */}
            <div className="flex items-center justify-between">
              <AnimatePresence mode="wait">
                <motion.div
                  key={isRewrite ? "title-rewrite" : "title-locked"}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center gap-2"
                >
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-md ${
                      isRewrite
                        ? "bg-blue-500/10 text-blue-500 dark:bg-blue-500/15"
                        : "bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/15"
                    }`}
                  >
                    {isRewrite ? (
                      <Sparkles className="h-3 w-3" />
                    ) : (
                      <ShieldCheck className="h-3 w-3" />
                    )}
                  </span>
                  <span className="text-[11px] font-semibold text-foreground/80 sm:text-xs">
                    {isRewrite
                      ? "Auto-Rewrite Berbasis Data"
                      : "Bebas Typo & Lolos ATS"}
                  </span>
                </motion.div>
              </AnimatePresence>

              <span className="hidden items-center gap-1 font-mono text-[9px] uppercase tracking-wider text-muted-foreground/70 sm:flex">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                </span>
                live
              </span>
            </div>

            {/* BEFORE — kalimat lemah (memudar & menutup di mode rewrite). */}
            <AnimatePresence>
              {isRewrite && (
                <motion.div
                  key="weak"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.4 }}
                  className="overflow-hidden"
                >
                  <div className="flex items-start gap-2 rounded-xl border border-rose-500/15 bg-rose-500/[0.05] px-3 py-2 dark:bg-rose-500/[0.07]">
                    <span className="mt-0.5 shrink-0 font-mono text-[9px] font-bold uppercase tracking-wider text-rose-500/70">
                      lemah
                    </span>
                    <p className="relative text-[12px] leading-snug text-rose-500/70 sm:text-sm">
                      <span className="relative inline">
                        Saya mengurus tim penjualan
                        {/* Coret yang menggambar sendiri. */}
                        <motion.span
                          className="absolute left-0 top-1/2 h-px bg-rose-500/60 dark:bg-rose-400/50"
                          initial={{ width: 0 }}
                          animate={{ width: "100%" }}
                          transition={{ duration: 0.5, delay: 0.35 }}
                        />
                      </span>
                      <span className="ml-1 hidden font-mono text-[9px] text-rose-500/50 sm:inline">
                        · pasif · tanpa angka
                      </span>
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Konektor "AI menulis ulang" — pulse dot melintas (idiom hero). */}
            {isRewrite && (
              <div className="flex items-center gap-2 pl-1">
                <ArrowRight className="h-3 w-3 shrink-0 text-blue-500" />
                <div className="relative h-px flex-1 bg-gradient-to-r from-blue-500/50 via-primary/30 to-transparent">
                  <motion.span
                    className="absolute top-1/2 h-1 w-1 -translate-y-1/2 rounded-full bg-blue-500 shadow-[0_0_8px_2px] shadow-blue-500/50"
                    animate={{ left: ["-4%", "104%"], opacity: [0, 1, 0] }}
                    transition={{
                      duration: 1.8,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                </div>
                <span className="font-mono text-[9px] uppercase tracking-wider text-blue-500/80">
                  rewrite
                </span>
              </div>
            )}

            {/* AFTER — kalimat kuat (diketik di mode rewrite, terkunci di mode lock). */}
            <div
              className={`relative rounded-xl border p-3 transition-colors sm:p-4 ${
                isRewrite
                  ? "border-blue-500/20 bg-blue-500/[0.04] dark:bg-blue-500/[0.06]"
                  : "border-emerald-500/25 bg-emerald-500/[0.06]"
              }`}
            >
              {/* Glow lembut di belakang kartu kuat. */}
              <div
                className={`pointer-events-none absolute -inset-1 -z-10 rounded-2xl blur-xl ${
                  isRewrite
                    ? "bg-gradient-to-tr from-blue-500/10 via-primary/5 to-transparent"
                    : "bg-gradient-to-tr from-emerald-500/15 via-emerald-400/8 to-transparent"
                }`}
              />
              <div className="mb-1.5 flex items-center gap-1.5">
                <span
                  className={`flex h-4 w-4 items-center justify-center rounded-[5px] ${
                    isRewrite
                      ? "bg-blue-500/15 text-blue-500"
                      : "bg-emerald-500/15 text-emerald-500"
                  }`}
                >
                  {isRewrite ? (
                    <Sparkles className="h-2.5 w-2.5" />
                  ) : (
                    <Check className="h-2.5 w-2.5" strokeWidth={3} />
                  )}
                </span>
                <span
                  className={`font-mono text-[9px] font-bold uppercase tracking-wider ${
                    isRewrite
                      ? "text-blue-500/80"
                      : "text-emerald-600 dark:text-emerald-400"
                  }`}
                >
                  {isRewrite ? "kuat · berbasis data" : "final · terkunci"}
                </span>
              </div>

              <p className="text-[13px] font-medium leading-snug text-foreground sm:text-[15px]">
                {isRewrite ? (
                  <>
                    {typed}
                    {!typingDone && (
                      <motion.span
                        className="ml-0.5 inline-block h-3.5 w-[2px] translate-y-0.5 bg-blue-500 align-middle sm:h-4"
                        animate={{ opacity: [1, 0, 1] }}
                        transition={{ duration: 0.9, repeat: Infinity }}
                      />
                    )}
                  </>
                ) : (
                  <>
                    Memimpin tim beranggotakan{" "}
                    <span className="bg-gradient-to-r from-primary via-blue-500 to-primary bg-clip-text font-semibold text-transparent">
                      15 orang
                    </span>{" "}
                    &amp; meningkatkan konversi B2B sebesar{" "}
                    <span className="bg-gradient-to-r from-primary via-blue-500 to-primary bg-clip-text font-semibold text-transparent">
                      34%
                    </span>
                  </>
                )}
              </p>

              {/* Chip metrik — muncul berurutan. */}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {METRICS.map((m, i) => (
                  <motion.span
                    key={m.label}
                    initial={{ opacity: 0, scale: 0.7, y: 6 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{
                      delay: chipDelays[i],
                      type: "spring",
                      stiffness: 380,
                      damping: 20,
                    }}
                    className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[10px] font-semibold ${toneClasses(
                      m.tone
                    )}`}
                  >
                    {m.withIcon && <TrendingUp className="h-2.5 w-2.5" />}
                    {m.label}
                  </motion.span>
                ))}
              </div>
            </div>

            {/* Footer engine — kartu gelap intrinsik (token hero), aman di light+dark. */}
            <div className="relative mt-auto overflow-hidden rounded-xl border border-white/10 bg-neutral-900 p-3 dark:bg-neutral-950">
              {/* Glow atas lembut. */}
              <div className="pointer-events-none absolute -top-10 left-1/2 h-20 w-32 -translate-x-1/2 rounded-full bg-blue-500/20 blur-2xl" />

              <div className="relative flex items-center justify-between gap-3">
                {/* Cincin ATS — selalu tampil, naik 71→98 saat diterima. */}
                <AtsRing accepted={!isRewrite} />

                <div className="min-w-0 flex-1">
                  <AnimatePresence mode="wait">
                    {isRewrite ? (
                      <motion.div
                        key="engine-rewrite"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-1.5"
                      >
                        <div className="flex min-w-0 items-center gap-2 font-mono text-[10px] text-neutral-400">
                          <span className="text-emerald-400">$</span>
                          <span className="truncate">
                            ai.rewrite(
                            <span className="text-sky-400">&quot;impact&quot;</span>)
                          </span>
                          <motion.span
                            className="inline-block h-3 w-1.5 shrink-0 bg-emerald-400"
                            animate={{ opacity: [1, 0, 1] }}
                            transition={{ duration: 1, repeat: Infinity }}
                          />
                        </div>
                        <div className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-wider text-amber-400/90">
                          <TrendingUp className="h-3 w-3" />
                          ATS 71 → 98 · merombak berbasis data
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="engine-locked"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-1.5"
                      >
                        <div className="flex items-center gap-2">
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{
                              type: "spring",
                              stiffness: 420,
                              damping: 18,
                              delay: 0.1,
                            }}
                            className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-neutral-950"
                          >
                            <Check className="h-3 w-3" strokeWidth={3} />
                          </motion.span>
                          <span className="font-mono text-[11px] font-semibold text-emerald-400">
                            Grammar &amp; ATS: lolos
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 font-mono text-[10px] text-neutral-400">
                          <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 font-semibold text-emerald-400">
                            ATS 98
                          </span>
                          <span className="rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5">
                            0 error
                          </span>
                          <span className="rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5">
                            0 typo
                          </span>
                          <span className="hidden items-center gap-1 rounded-md border border-emerald-500/20 bg-emerald-500/5 px-1.5 py-0.5 text-emerald-400/90 sm:inline-flex">
                            <Check className="h-2.5 w-2.5" strokeWidth={3} />
                            lolos parser ATS
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
