"use client";

import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { LogOut, User, Settings, Moon, Sun } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { useTheme } from "@/components/providers/ThemeProvider";

interface TopbarProps {
  title: string;
  children?: React.ReactNode;
}

export function Topbar({ title, children }: TopbarProps) {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  return (
    <header className="h-12 flex items-center justify-between px-4 md:px-6 bg-surface border-b border-border flex-shrink-0">
      <h1 className="font-syne font-bold text-base tracking-tight">{title}</h1>

      <div className="flex items-center gap-2">
        {children}

        {/* Dark mode toggle */}
        <button
          onClick={toggleTheme}
          className="w-7 h-7 rounded-lg border border-border bg-bg-2 flex items-center justify-center hover:border-accent/40 transition-colors"
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          {theme === "dark"
            ? <Sun className="w-3.5 h-3.5 text-text-2" />
            : <Moon className="w-3.5 h-3.5 text-text-2" />
          }
        </button>

        {/* Profile menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className={cn(
              "w-7 h-7 rounded-lg border border-border bg-bg-2 flex items-center justify-center",
              "hover:border-accent/40 transition-colors",
              menuOpen && "border-accent/40"
            )}
          >
            <User className="w-3.5 h-3.5 text-text-2" />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-9 z-20 bg-surface border border-border rounded-lg shadow-card-lg py-1 w-40">
                <Link
                  href="/settings"
                  onClick={() => setMenuOpen(false)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-text-2 hover:bg-bg-2 hover:text-text transition-colors"
                >
                  <Settings className="w-3.5 h-3.5" />
                  Settings
                </Link>
                <div className="my-1 border-t border-border" />
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-text-2 hover:bg-bg-2 hover:text-brand-red transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
