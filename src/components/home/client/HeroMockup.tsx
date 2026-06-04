import { motion } from "framer-motion";

/**
 * Komposisi visual "workbench ganda" untuk hero:
 *  - Kiri  : mockup UI web CV-Buff (browser window berisi editor 3-panel)
 *  - Kanan : panel agen AI / terminal MCP yang mengisyaratkan sistem ini
 *            sedang "berkomunikasi" dengan agen AI eksternal.
 * Murni HTML/CSS/SVG (tanpa gambar), floating + diffused shadow.
 */

const Bar = ({ w = "100%", h = 8, className = "" }: { w?: string; h?: number; className?: string }) => (
  <div
    className={`rounded-full bg-neutral-200 dark:bg-neutral-700 ${className}`}
    style={{ width: w, height: h }}
  />
);

function BrowserCard() {
  return (
    <div className="relative flex-1 overflow-hidden rounded-2xl border border-black/5 bg-white shadow-2xl shadow-black/10 ring-1 ring-black/[0.03] dark:border-white/10 dark:bg-neutral-900">
      {/* Chrome */}
      <div className="flex items-center gap-2 border-b border-black/5 bg-neutral-50 px-4 py-3 dark:border-white/5 dark:bg-neutral-800/60">
        <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
        <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
        <span className="h-3 w-3 rounded-full bg-[#28c840]" />
        <div className="ml-3 flex h-6 flex-1 items-center rounded-md bg-white px-3 text-[10px] font-medium text-neutral-400 ring-1 ring-black/5 dark:bg-neutral-900 dark:text-neutral-500 dark:ring-white/5">
          cv.agentbuff.id/app
        </div>
      </div>

      {/* Body: 3-panel editor */}
      <div className="grid grid-cols-[1fr_1.3fr_1.6fr] gap-3 p-3 sm:p-4">
        {/* Panel 1 — sections */}
        <div className="space-y-2.5">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`flex items-center gap-2 rounded-lg px-2 py-2 ${
                i === 1 ? "bg-primary/10 ring-1 ring-primary/20" : ""
              }`}
            >
              <div className={`h-3 w-3 rounded-[4px] ${i === 1 ? "bg-primary" : "bg-neutral-300 dark:bg-neutral-600"}`} />
              <Bar w={i === 1 ? "70%" : "55%"} h={6} className={i === 1 ? "bg-primary/40" : ""} />
            </div>
          ))}
        </div>

        {/* Panel 2 — form fields */}
        <div className="space-y-3 rounded-lg bg-neutral-50/60 p-2.5 dark:bg-neutral-800/40">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="space-y-1.5">
              <Bar w="40%" h={5} />
              <div className="h-6 rounded-md bg-white ring-1 ring-black/5 dark:bg-neutral-900 dark:ring-white/5" />
            </div>
          ))}
        </div>

        {/* Panel 3 — CV preview */}
        <div className="rounded-lg bg-white p-3 shadow-sm ring-1 ring-black/5 dark:bg-neutral-950 dark:ring-white/5">
          <div className="mb-3 flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary/30 to-primary/10" />
            <div className="space-y-1.5">
              <div className="text-[11px] font-semibold leading-none text-neutral-700 dark:text-neutral-200">
                Budi Santoso
              </div>
              <Bar w="70px" h={5} />
            </div>
          </div>
          <div className="mb-2 h-[2px] w-8 rounded-full bg-primary" />
          <div className="space-y-1.5">
            {["100%", "92%", "78%", "100%", "85%", "60%"].map((w, i) => (
              <Bar key={i} w={w} h={5} />
            ))}
          </div>
          <div className="my-2.5 h-[2px] w-8 rounded-full bg-primary" />
          <div className="space-y-1.5">
            {["95%", "70%", "88%"].map((w, i) => (
              <Bar key={i} w={w} h={5} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function AgentCard() {
  const lines = [
    { t: "$ agent connect cv-buff", c: "text-emerald-400" },
    { t: "✓ MCP handshake ok", c: "text-neutral-400" },
    { t: "→ skill.run(\"build_resume\")", c: "text-sky-400" },
    { t: "✓ 200 · resume.pdf ready", c: "text-neutral-400" },
  ];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-neutral-900 shadow-2xl shadow-black/30 dark:bg-neutral-950">
      {/* subtle top glow */}
      <div className="pointer-events-none absolute -top-12 left-1/2 h-24 w-40 -translate-x-1/2 rounded-full bg-primary/20 blur-2xl" />

      <div className="flex items-center gap-2 border-b border-white/5 px-4 py-3">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-400">
          AI Agent · MCP
        </span>
      </div>

      {/* Node graph */}
      <div className="flex items-center justify-between px-4 pt-4">
        {["Agent", "MCP", "CV-Buff"].map((n, i) => (
          <div key={n} className="flex items-center">
            <div className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[9px] font-medium text-neutral-300">
              {n}
            </div>
            {i < 2 && (
              <div className="relative mx-1 h-[1px] w-5 bg-white/15">
                <motion.span
                  className="absolute top-1/2 h-1 w-1 -translate-y-1/2 rounded-full bg-primary shadow-[0_0_8px_2px] shadow-primary/60"
                  animate={{ left: ["0%", "100%"], opacity: [0, 1, 0] }}
                  transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.4, ease: "easeInOut" }}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Terminal */}
      <div className="m-4 mt-3 rounded-lg bg-black/40 p-3 font-mono text-[10px] leading-relaxed ring-1 ring-white/5">
        {lines.map((l, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 + i * 0.5, duration: 0.3 }}
            className={l.c}
          >
            {l.t}
          </motion.div>
        ))}
        <motion.span
          className="inline-block h-3 w-1.5 translate-y-0.5 bg-emerald-400"
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      </div>
    </div>
  );
}

/** Konektor animasi (web UI ↔ agen) — hanya tampil di layar lebar */
function Connector() {
  return (
    <div className="relative hidden w-10 flex-col items-center justify-center self-center md:flex">
      <div className="relative h-[1px] w-full bg-gradient-to-r from-transparent via-primary/40 to-primary/60">
        <motion.span
          className="absolute top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-primary shadow-[0_0_10px_2px] shadow-primary/60"
          animate={{ left: ["-5%", "105%"], opacity: [0, 1, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
    </div>
  );
}

export default function HeroMockup() {
  return (
    <div className="relative mx-auto w-full max-w-5xl">
      {/* Diffused glow behind the whole composition */}
      <div className="pointer-events-none absolute -inset-x-10 -inset-y-8 -z-10 rounded-[3rem] bg-gradient-to-tr from-primary/15 via-blue-500/10 to-purple-500/10 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, delay: 0.15 }}
      >
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="flex flex-col items-stretch gap-4 md:flex-row"
        >
          <BrowserCard />
          <Connector />
          <div className="md:w-[290px] md:self-center md:shrink-0">
            <AgentCard />
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
