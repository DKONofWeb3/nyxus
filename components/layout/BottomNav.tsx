"use client";

import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Search, Sparkles, Users, MoreHorizontal,
  Bell, Settings, Star, TrendingUp, Network, X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

interface BottomNavProps {
  alertCount?: number;
  projectName?: string;
}

const MAIN_TABS = [
  { label: "Dashboard",    href: "/dashboard",    icon: LayoutDashboard },
  { label: "Discovery",    href: "/discovery",    icon: Search },
  { label: "AI",           href: "/ai",           icon: Sparkles },
  { label: "Partners",     href: "/partnerships", icon: Users },
];

const MORE_ITEMS = [
  { label: "KOLs & Creators", href: "/kols",      icon: Star,       soon: true },
  { label: "Market Pulse",    href: "/market",    icon: TrendingUp, soon: true },
  { label: "Ecosystem Map",   href: "/ecosystem", icon: Network,    soon: true },
  { label: "Alerts",          href: "/alerts",    icon: Bell,       soon: false },
  { label: "Settings",        href: "/settings",  icon: Settings,   soon: false },
];

export function BottomNav({ alertCount = 0, projectName }: BottomNavProps) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  // Close more menu on navigation
  useEffect(() => { setMoreOpen(false); }, [pathname]);

  // Lock body scroll when more menu open
  useEffect(() => {
    if (moreOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [moreOpen]);

  const isMoreActive = MORE_ITEMS.some(i => pathname === i.href);

  return (
    <>
      {/* ── More menu overlay ────────────────────────────── */}
      {moreOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={() => setMoreOpen(false)}
          />
          <div className="fixed bottom-[72px] left-3 right-3 z-50 bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-2 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div>
                <p className="text-xs font-bold font-syne">More</p>
                {projectName && <p className="text-[10px] text-text-3">{projectName}</p>}
              </div>
              <button onClick={() => setMoreOpen(false)} className="w-7 h-7 rounded-lg bg-bg-2 flex items-center justify-center">
                <X className="w-3.5 h-3.5 text-text-2" />
              </button>
            </div>

            {/* Items grid */}
            <div className="grid grid-cols-2 gap-px bg-border p-px">
              {MORE_ITEMS.map(({ label, href, icon: Icon, soon }) => {
                const isActive = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3.5 bg-surface transition-colors",
                      isActive ? "text-accent" : "text-text-2 hover:bg-bg-2",
                      soon && "opacity-60"
                    )}
                  >
                    <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0", isActive ? "bg-accent/10" : "bg-bg-2")}>
                      <Icon className={cn("w-4 h-4", isActive ? "text-accent" : "text-text-2")} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate">{label}</p>
                      {soon && <p className="text-[9px] text-accent/60 font-medium">Coming soon</p>}
                      {label === "Alerts" && alertCount > 0 && (
                        <p className="text-[9px] text-accent font-bold">{alertCount} new</p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* ── Bottom tab bar ───────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-surface/95 backdrop-blur-md border-t border-border">
        {/* Safe area for home indicator */}
        <div className="flex items-center h-16 px-2">
          {MAIN_TABS.map(({ label, href, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(href + "/");
            const isAI = href === "/ai";

            if (isAI) {
              // Special treatment for AI tab — glowing center button
              return (
                <Link
                  key={href}
                  href={href}
                  className="flex-1 flex flex-col items-center justify-center gap-0.5 relative"
                >
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-all",
                    isActive
                      ? "bg-accent shadow-[0_0_20px_rgba(255,92,26,0.5)]"
                      : "bg-accent/10 border border-accent/20"
                  )}>
                    <Sparkles className={cn("w-5 h-5", isActive ? "text-white" : "text-accent")} />
                  </div>
                  <span className={cn("text-[9px] font-semibold tracking-wide", isActive ? "text-accent" : "text-text-3")}>
                    {label}
                  </span>
                </Link>
              );
            }

            return (
              <Link
                key={href}
                href={href}
                className="flex-1 flex flex-col items-center justify-center gap-1 relative py-1"
              >
                <div className={cn(
                  "w-6 h-6 flex items-center justify-center transition-all",
                  isActive && "scale-110"
                )}>
                  <Icon className={cn("w-5 h-5 transition-colors", isActive ? "text-accent" : "text-text-3")} />
                </div>
                {isActive && (
                  <span className="absolute top-1 w-1 h-1 rounded-full bg-accent" />
                )}
                <span className={cn("text-[9px] font-semibold tracking-wide", isActive ? "text-accent" : "text-text-3")}>
                  {label}
                </span>
              </Link>
            );
          })}

          {/* More button */}
          <button
            onClick={() => setMoreOpen(!moreOpen)}
            className="flex-1 flex flex-col items-center justify-center gap-1 py-1 relative"
          >
            {(isMoreActive || moreOpen) && (
              <span className="absolute top-1 w-1 h-1 rounded-full bg-accent" />
            )}
            <div className={cn("w-6 h-6 flex items-center justify-center")}>
              <MoreHorizontal className={cn("w-5 h-5 transition-colors", (isMoreActive || moreOpen) ? "text-accent" : "text-text-3")} />
            </div>
            {alertCount > 0 && (
              <span className="absolute top-1 right-4 w-4 h-4 bg-accent rounded-full flex items-center justify-center text-[8px] font-bold text-white">
                {alertCount > 9 ? "9+" : alertCount}
              </span>
            )}
            <span className={cn("text-[9px] font-semibold tracking-wide", (isMoreActive || moreOpen) ? "text-accent" : "text-text-3")}>
              More
            </span>
          </button>
        </div>

        {/* Home indicator spacer for iOS */}
        <div className="h-safe-area-bottom" />
      </nav>

      {/* Bottom padding so content doesn't hide behind nav */}
      <div className="md:hidden h-16 flex-shrink-0" />
    </>
  );
}
