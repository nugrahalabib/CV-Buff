import { useSession, signOut } from "@/lib/auth-client";
import { useResumeStore } from "@/store/useResumeStore";

/**
 * Avatar + name + logout. Logout also wipes per-user local CV data and hard-reloads,
 * so a shared browser never leaks one user's resumes to the next account.
 */
export function UserMenu() {
  const { data, isPending } = useSession();
  if (isPending || !data?.user) return null;

  const { user } = data;

  const handleLogout = async () => {
    try {
      await signOut();
    } finally {
      try {
        useResumeStore.getState().reset();
      } catch {
        /* ignore */
      }
      // shared-browser safety: clear the previous user's in-browser AI keys/config
      // (CV data lives on the server now, scoped to the account).
      ["cv-buff-ai-config", "cv-buff-resume-storage"].forEach((k) => {
        try {
          localStorage.removeItem(k);
        } catch {
          /* ignore */
        }
      });
      // hard reload fully resets in-memory state before the next account loads
      window.location.href = "/login";
    }
  };

  const initial = (user.name ?? user.email ?? "?").slice(0, 1).toUpperCase();

  return (
    <div className="flex items-center gap-2">
      {user.image ? (
        <img
          src={user.image}
          alt={user.name ?? "User"}
          referrerPolicy="no-referrer"
          className="w-7 h-7 rounded-full border border-border object-cover"
        />
      ) : (
        <div className="w-7 h-7 rounded-full bg-primary/10 text-primary grid place-items-center text-xs font-semibold">
          {initial}
        </div>
      )}
      <span className="text-sm font-medium hidden md:inline max-w-[120px] truncate">
        {user.name ?? user.email}
      </span>
      <button
        onClick={handleLogout}
        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        title="Keluar"
      >
        Keluar
      </button>
    </div>
  );
}
