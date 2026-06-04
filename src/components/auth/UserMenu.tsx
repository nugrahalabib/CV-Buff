import { useState } from "react";
import { ChevronsUpDown, LogOut } from "lucide-react";
import { useSession, signOut } from "@/lib/auth-client";
import { useResumeStore } from "@/store/useResumeStore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface UserMenuProps {
  /** When the sidebar collapses to icon-rail width, render a compact avatar-only trigger. */
  collapsed?: boolean;
}

/**
 * Quiet, tappable account row that opens a polished dropdown (identity + Keluar).
 * Logout still wipes per-user local CV data and hard-reloads, so a shared browser
 * never leaks one user's resumes to the next account.
 */
export function UserMenu({ collapsed = false }: UserMenuProps) {
  const { data, isPending } = useSession();
  const [open, setOpen] = useState(false);

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

  const displayName = user.name ?? user.email ?? "Pengguna";
  const firstName = (user.name ?? "").trim().split(/\s+/)[0] || "";
  const initial = (user.name ?? user.email ?? "?").slice(0, 1).toUpperCase();

  const Avatar = ({ className = "" }: { className?: string }) =>
    user.image ? (
      <img
        src={user.image}
        alt={displayName}
        referrerPolicy="no-referrer"
        className={`shrink-0 rounded-full border border-black/5 object-cover ring-1 ring-black/[0.03] dark:border-white/10 dark:ring-white/[0.03] ${className}`}
      />
    ) : (
      <div
        className={`grid shrink-0 place-items-center rounded-full border border-black/5 bg-gradient-to-br from-primary/15 to-blue-500/15 text-xs font-bold text-primary ring-1 ring-black/[0.03] dark:border-white/10 dark:ring-white/[0.03] ${className}`}
      >
        {initial}
      </div>
    );

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={`flex w-full items-center gap-2.5 rounded-xl border border-transparent text-left transition-colors hover:border-border/60 hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 data-[state=open]:border-border/60 data-[state=open]:bg-accent/70 ${
            collapsed ? "justify-center p-1.5" : "px-2 py-2"
          }`}
        >
          <Avatar className="size-9" />
          {!collapsed && (
            <>
              <span className="flex min-w-0 flex-1 flex-col leading-tight">
                <span className="truncate text-sm font-semibold text-foreground">
                  {firstName ? `Halo, ${firstName}` : displayName}
                </span>
                {user.email && (
                  <span className="truncate text-xs text-muted-foreground">
                    {user.email}
                  </span>
                )}
              </span>
              <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground/70" />
            </>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        side="top"
        align="start"
        sideOffset={10}
        className="w-[--radix-dropdown-menu-trigger-width] min-w-60 rounded-xl border-border/60 bg-popover/95 p-1.5 shadow-2xl shadow-black/10 backdrop-blur-xl"
      >
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-2.5 rounded-lg px-2 py-2">
            <Avatar className="size-9" />
            <div className="flex min-w-0 flex-col leading-tight">
              <span className="truncate text-sm font-semibold text-foreground">
                {displayName}
              </span>
              {user.email && (
                <span className="truncate text-xs font-normal text-muted-foreground">
                  {user.email}
                </span>
              )}
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator className="bg-border/60" />

        <DropdownMenuItem
          onSelect={(event) => {
            event.preventDefault();
            handleLogout();
          }}
          className="cursor-pointer gap-2 rounded-lg px-2 py-2 text-sm font-medium text-red-600 focus:bg-red-500/10 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
        >
          <LogOut className="size-4" />
          Keluar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
