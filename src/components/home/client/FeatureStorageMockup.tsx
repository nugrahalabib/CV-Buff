import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  Lock,
  Download,
  Check,
  FileText,
  FileJson,
  FileCode2,
  UserCheck,
  Ban,
} from "lucide-react";

/**
 * FeatureStorageMockup — visual untuk fitur "Tersimpan di Akun".
 * Selaras 1:1 dengan DNA hero/AI-mockup CV-Buff (kartu kaca, chrome bar,
 * footer engine gelap intrinsik, glow difus, float 6s, pulse).
 *
 *  active === 0 → "Tersimpan per-akun": CV terkunci ke akunmu, pengguna lain
 *    ditolak. Baris query mono `WHERE user_id = kamu` menegaskan isolasi.
 *  active === 1 → "Beragam format ekspor": unduh ke PDF / JSON / Markdown.
 *
 * Murni JSX + Tailwind + framer-motion (tanpa gambar/SVG eksternal).
 */

interface FeatureStorageMockupProps {
  active: number;
}

const FORMATS = [
  { label: "PDF", icon: FileText, cls: "border-rose-500/20 bg-rose-500/10 text-rose-500" },
  { label: "JSON", icon: FileJson, cls: "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  { label: "Markdown", icon: FileCode2, cls: "border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400" },
];

function DocCard() {
  return (
    <div className="relative w-32 shrink-0 rounded-xl border border-black/5 bg-white p-2.5 shadow-lg shadow-black/5 ring-1 ring-black/[0.03] dark:border-white/10 dark:bg-neutral-950">
      <div className="mb-2 flex items-center gap-1.5">
        <div className="h-5 w-5 rounded-full bg-gradient-to-br from-primary/30 to-primary/10" />
        <div className="space-y-1">
          <div className="text-[8px] font-semibold leading-none text-foreground/80">Budi Santoso</div>
          <div className="h-1 w-10 rounded-full bg-neutral-200 dark:bg-neutral-700" />
        </div>
      </div>
      <div className="mb-1.5 h-[2px] w-5 rounded-full bg-primary" />
      <div className="space-y-1">
        {["100%", "78%", "92%", "60%"].map((w, i) => (
          <div key={i} className="h-1 rounded-full bg-neutral-200 dark:bg-neutral-700" style={{ width: w }} />
        ))}
      </div>
    </div>
  );
}

export default function FeatureStorageMockup({ active }: FeatureStorageMockupProps) {
  const isVault = active === 0;

  return (
    <div className="relative flex h-full min-h-[300px] w-full items-center justify-center">
      {/* Glow difus — tint emerald (aman) selaras hero. */}
      <div className="pointer-events-none absolute -inset-6 -z-10 rounded-[2.5rem] bg-gradient-to-tr from-emerald-500/12 via-blue-500/10 to-primary/10 blur-3xl" />

      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="flex w-full"
      >
        <div className="relative flex w-full flex-col overflow-hidden rounded-2xl border border-black/5 bg-white shadow-2xl shadow-black/10 ring-1 ring-black/[0.03] dark:border-white/10 dark:bg-neutral-900">
          {/* Chrome bar */}
          <div className="flex items-center gap-2 border-b border-black/5 bg-neutral-50 px-3 py-2.5 dark:border-white/5 dark:bg-neutral-800/60 sm:px-4">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
            <div className="ml-2 hidden items-center gap-1.5 text-[10px] font-medium text-neutral-400 dark:text-neutral-500 sm:flex">
              <Lock className="h-3 w-3" />
              <span className="font-mono">akun_saya</span>
            </div>
            <div className="ml-auto inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-semibold text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="h-3 w-3" />
              Terenkripsi
            </div>
          </div>

          {/* Body */}
          <div className="flex min-h-0 flex-1 flex-col gap-3 p-3 sm:gap-3.5 sm:p-5">
            {/* Header status */}
            <div className="flex items-center justify-between">
              <AnimatePresence mode="wait">
                <motion.div
                  key={isVault ? "title-vault" : "title-export"}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center gap-2"
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/15">
                    {isVault ? <ShieldCheck className="h-3 w-3" /> : <Download className="h-3 w-3" />}
                  </span>
                  <span className="text-[11px] font-semibold text-foreground/80 sm:text-xs">
                    {isVault ? "Tersimpan per-akun" : "Ekspor kapan saja"}
                  </span>
                </motion.div>
              </AnimatePresence>
              <span className="hidden items-center gap-1 font-mono text-[9px] uppercase tracking-wider text-muted-foreground/70 sm:flex">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                </span>
                tersinkron
              </span>
            </div>

            {/* Scene */}
            <div className="relative flex min-h-[132px] flex-1 items-center justify-center rounded-xl border border-black/5 bg-neutral-50/60 p-3 dark:border-white/5 dark:bg-neutral-800/30">
              <AnimatePresence mode="wait">
                {isVault ? (
                  <motion.div
                    key="vault"
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.35 }}
                    className="flex w-full items-center justify-center gap-3"
                  >
                    {/* Kamu — akses penuh */}
                    <div className="flex flex-col items-center gap-1.5">
                      <DocCard />
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[8px] font-semibold text-emerald-600 dark:text-emerald-400">
                        <UserCheck className="h-2.5 w-2.5" />
                        akunmu
                      </span>
                    </div>

                    {/* Barrier */}
                    <div className="relative flex h-24 flex-col items-center justify-center">
                      <div className="h-full w-px bg-gradient-to-b from-transparent via-rose-500/40 to-transparent" />
                      <span className="absolute flex h-6 w-6 items-center justify-center rounded-full border border-rose-500/30 bg-background text-rose-500 shadow-sm">
                        <Lock className="h-3 w-3" />
                      </span>
                    </div>

                    {/* Pengguna lain — ditolak */}
                    <div className="flex flex-col items-center gap-1.5 opacity-60">
                      <div className="relative w-20 rounded-xl border border-dashed border-neutral-300 bg-neutral-100/50 p-2.5 dark:border-neutral-700 dark:bg-neutral-800/40">
                        <div className="mb-2 flex items-center gap-1.5">
                          <div className="h-4 w-4 rounded-full bg-neutral-300 dark:bg-neutral-600" />
                          <div className="h-1 w-8 rounded-full bg-neutral-300 dark:bg-neutral-600" />
                        </div>
                        <div className="space-y-1">
                          <div className="h-1 w-full rounded-full bg-neutral-200 dark:bg-neutral-700" />
                          <div className="h-1 w-2/3 rounded-full bg-neutral-200 dark:bg-neutral-700" />
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-neutral-100/40 backdrop-blur-[1px] dark:bg-neutral-900/40">
                          <Ban className="h-5 w-5 text-rose-500/70" />
                        </div>
                      </div>
                      <span className="font-mono text-[8px] text-muted-foreground">pengguna lain</span>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="export"
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.35 }}
                    className="flex w-full items-center justify-center gap-4"
                  >
                    <DocCard />
                    <div className="flex flex-col gap-2">
                      {FORMATS.map((f, i) => (
                        <motion.div
                          key={f.label}
                          initial={{ opacity: 0, x: 12 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.15 + i * 0.12, type: "spring", stiffness: 320, damping: 22 }}
                          className={`inline-flex w-32 items-center gap-2 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold ${f.cls}`}
                        >
                          <f.icon className="h-3.5 w-3.5" />
                          <span className="font-mono">{f.label}</span>
                          <motion.span
                            className="ml-auto text-current"
                            animate={{ y: [0, 2, 0], opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.2, ease: "easeInOut" }}
                          >
                            <Download className="h-3 w-3" />
                          </motion.span>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer engine — kartu gelap intrinsik (token hero). */}
            <div className="relative mt-auto overflow-hidden rounded-xl border border-white/10 bg-neutral-900 p-3 dark:bg-neutral-950">
              <div className="pointer-events-none absolute -top-10 left-1/2 h-20 w-32 -translate-x-1/2 rounded-full bg-emerald-500/20 blur-2xl" />
              <div className="relative">
                <AnimatePresence mode="wait">
                  {isVault ? (
                    <motion.div
                      key="engine-vault"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-1.5"
                    >
                      <div className="flex items-center gap-2 font-mono text-[10px] text-neutral-400">
                        <span className="text-emerald-400">$</span>
                        <span className="truncate">
                          SELECT * FROM resume WHERE{" "}
                          <span className="text-sky-400">user_id = kamu</span>
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-emerald-400">
                          <Check className="h-2.5 w-2.5" strokeWidth={3} />
                          terisolasi penuh
                        </span>
                        <span className="rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-neutral-400">
                          per-akun
                        </span>
                        <span className="rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-neutral-400">
                          terenkripsi
                        </span>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="engine-export"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-1.5"
                    >
                      <div className="flex items-center gap-2 font-mono text-[10px] text-neutral-400">
                        <span className="text-emerald-400">$</span>
                        <span className="truncate">
                          export(<span className="text-sky-400">&quot;resume&quot;</span>) → pdf · json · md
                        </span>
                        <motion.span
                          className="inline-block h-3 w-1.5 shrink-0 bg-emerald-400"
                          animate={{ opacity: [1, 0, 1] }}
                          transition={{ duration: 1, repeat: Infinity }}
                        />
                      </div>
                      <div className="flex items-center gap-1.5 font-mono text-[10px] text-emerald-400">
                        <Check className="h-3 w-3" strokeWidth={3} />
                        siap diunduh kapan saja
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
