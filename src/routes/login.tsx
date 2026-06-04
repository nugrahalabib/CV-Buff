import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { signIn } from "@/lib/auth-client";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Masuk — CV-Buff" },
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
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#f8f9fb] to-white dark:from-gray-900 dark:to-gray-800 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-sm text-center">
        <img src="/logo.svg" alt="CV-Buff" className="h-10 mx-auto mb-6" />
        <h1 className="text-xl font-semibold mb-1">Masuk ke CV-Buff</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Daftar gratis untuk mulai membuat CV profesional. CV-mu tersimpan aman
          di akunmu dan terisolasi penuh dari pengguna lain.
        </p>

        <button
          onClick={handleGoogle}
          disabled={loading}
          className="w-full inline-flex items-center justify-center gap-3 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium hover:bg-accent transition-colors disabled:opacity-60"
        >
          <GoogleIcon />
          {loading ? "Mengalihkan…" : "Lanjutkan dengan Google"}
        </button>

        {error && <p className="text-sm text-red-500 mt-3">{error}</p>}

        <p className="text-xs text-muted-foreground mt-6 leading-relaxed">
          Dengan masuk, kamu menyetujui penggunaan data profil Google (nama,
          email, foto) untuk pendaftaran akun.
        </p>
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
