import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Zap } from "lucide-react";
import { signIn } from "@/lib/auth-client";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Daftar Gratis — CV-Buff" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogle = async () => {
    setError(null);
    setLoading(true);
    try {
      await signIn.social({
        provider: "google",
        callbackURL: "/app/dashboard/resumes",
        errorCallbackURL: "/login?error=1",
      });
    } catch {
      setLoading(false);
      setError("Gagal memulai login Google. Coba lagi.");
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      {/* Grid presisi — selaras DNA hero, momentum merek terjaga */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35] dark:opacity-[0.25]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(128,128,128,0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(128,128,128,0.12) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          maskImage:
            "radial-gradient(ellipse 60% 55% at 50% 45%, black 25%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 60% 55% at 50% 45%, black 25%, transparent 100%)",
        }}
      />
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/2 h-[420px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-[130px]" />
        <div className="absolute left-1/4 top-1/3 h-64 w-64 rounded-full bg-blue-500/10 blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 h-64 w-64 rounded-full bg-purple-500/10 blur-[120px]" />
      </div>

      {/* Kartu otentikasi */}
      <div className="relative w-full max-w-sm">
        {/* Diffused glow di belakang kartu — bikin "pop" berbobot */}
        <div className="pointer-events-none absolute -inset-3 -z-10 rounded-[2rem] bg-gradient-to-tr from-primary/15 via-blue-500/10 to-purple-500/10 blur-2xl" />

        <div className="rounded-2xl border border-black/5 bg-white/90 p-8 text-center shadow-2xl shadow-black/10 ring-1 ring-black/[0.03] backdrop-blur-xl dark:border-white/10 dark:bg-neutral-900/90">
          {/* Badge "Gratis" — selalu terlihat, meredam skeptis (resep pil hero) */}
          <div className="mb-6 flex justify-center">
            <div className="inline-flex rounded-full bg-gradient-to-r from-primary/50 via-blue-500/40 to-primary/50 p-[1px]">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-background/90 px-3 py-1 backdrop-blur-md">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                </span>
                <span className="text-[11px] font-semibold tracking-wide text-foreground/80">
                  100% Gratis Selamanya
                </span>
              </div>
            </div>
          </div>

          <img src="/icon.png" alt="CV-Buff" className="mx-auto mb-5 block h-12 w-12 rounded-xl" />

          <h1 className="mb-2.5 font-serif text-2xl font-semibold leading-tight tracking-tight text-foreground">
            Satu Langkah Lagi Menuju CV Profesionalmu
          </h1>
          <p className="mb-7 text-sm leading-relaxed text-muted-foreground">
            Buat akun gratis dalam 2 detik. Simpan progres Anda secara otomatis,
            ekspor tanpa batas, dan privasi data 100% hanya di tangan Anda.
          </p>

          {/* Microcopy penetral ketakutan password */}
          <div className="mb-2.5 inline-flex items-center gap-1.5 text-xs font-semibold text-foreground/70">
            <Zap className="h-3.5 w-3.5 text-blue-500" />
            Akses Instan. Tanpa Password.
          </div>

          <button
            onClick={handleGoogle}
            disabled={loading}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold shadow-sm transition-all hover:bg-accent hover:shadow-md active:scale-[0.99] disabled:opacity-60"
          >
            <GoogleIcon />
            {loading ? "Mengalihkan…" : "Lanjutkan dengan Google"}
          </button>

          {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

          <p className="mt-6 text-xs leading-relaxed text-muted-foreground/80">
            Tanpa kartu kredit · Ekspor kapan saja. Dengan masuk, kamu menyetujui
            penggunaan data profil Google (nama, email, foto) untuk pendaftaran
            akun.
          </p>
        </div>
      </div>
    </main>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z"
      />
    </svg>
  );
}
