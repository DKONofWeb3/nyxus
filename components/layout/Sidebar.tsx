"use client";

import type React from "react";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/utils";
import {
  Bell, ChevronDown, LayoutDashboard, Search,
  Settings, TrendingUp, Users, Sparkles, Network,
  Plus, Check, Star, Menu, X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  teaser?: boolean;
}

const navItems: { section: string; items: NavItem[] }[] = [
  {
    section: "Intelligence",
    items: [
      { label: "Dashboard",    href: "/dashboard",    icon: LayoutDashboard },
      { label: "Discovery",    href: "/discovery",    icon: Search },
      { label: "NYXUS AI",     href: "/ai",           icon: Sparkles },
      { label: "Partnerships", href: "/partnerships", icon: Users },
    ],
  },
  {
    section: "Growth",
    items: [
      { label: "KOLs & Creators", href: "/kols",      icon: Star,       teaser: true },
      { label: "Market pulse",    href: "/market",    icon: TrendingUp, teaser: true },
      { label: "Ecosystem map",   href: "/ecosystem", icon: Network,    teaser: true },
    ],
  },
  {
    section: "Account",
    items: [
      { label: "Alerts",   href: "/alerts",   icon: Bell },
      { label: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

interface Project { id: string; name: string; category: string; }
interface SidebarProps { projects?: Project[]; activeProjectId?: string | null; alertCount?: number; }

export function Sidebar({ projects = [], activeProjectId, alertCount = 0 }: SidebarProps) {
  const pathname = usePathname();
  const [open, setOpen]         = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [switching, setSwitching]   = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  const activeProject = projects.find((p) => p.id === activeProjectId) ?? projects[0] ?? null;

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close mobile sidebar on route change
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  // Prevent body scroll when mobile sidebar open
  useEffect(() => {
    if (mobileOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const switchProject = async (projectId: string) => {
    if (projectId === activeProject?.id) { setOpen(false); return; }
    setSwitching(true); setOpen(false);
    const supabase = createClient();
    await supabase.auth.updateUser({ data: { active_project_id: projectId } });
    window.location.href = "/dashboard";
  };

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="px-4 py-4 border-b border-border flex items-center justify-between">
        <Logo size="md" />
        {/* Close button — mobile only */}
        <button onClick={() => setMobileOpen(false)} className="md:hidden w-7 h-7 rounded-lg hover:bg-bg flex items-center justify-center">
          <X className="w-4 h-4 text-text-2" />
        </button>
      </div>

      {/* Project switcher */}
      <div className="px-4 py-3 border-b border-border" ref={dropRef}>
        <p className="text-[9px] text-text-3 font-semibold uppercase tracking-widest mb-1.5">Active project</p>
        <button
          onClick={() => setOpen(!open)}
          className={cn(
            "w-full flex items-center gap-2 bg-surface border border-border rounded-lg px-2.5 py-2 text-xs font-semibold",
            "hover:border-accent/40 transition-colors", open && "border-accent/40"
          )}
        >
          <span className={cn("w-2 h-2 rounded-full flex-shrink-0", switching ? "bg-yellow-400 animate-pulse" : "bg-accent")} />
          <span className="truncate flex-1 text-left">{switching ? "Switching..." : (activeProject?.name ?? "No project")}</span>
          <ChevronDown className={cn("w-3 h-3 text-text-3 flex-shrink-0 transition-transform", open && "rotate-180")} />
        </button>

        {open && (
          <div className="absolute z-50 mt-1 w-[188px] bg-surface border border-border rounded-lg shadow-card-lg overflow-hidden">
            {projects.map((p) => (
              <button key={p.id} onClick={() => switchProject(p.id)}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-xs hover:bg-bg-2 transition-colors text-left">
                <span className="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" />
                <span className="flex-1 truncate font-medium">{p.name}</span>
                {p.id === activeProject?.id && <Check className="w-3 h-3 text-accent flex-shrink-0" />}
              </button>
            ))}
            {projects.length > 0 && <div className="border-t border-border my-1" />}
            <Link href="/onboarding" onClick={() => setOpen(false)}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-xs hover:bg-bg-2 transition-colors text-accent font-semibold">
              <Plus className="w-3.5 h-3.5" />Add another project
            </Link>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 overflow-y-auto">
        {navItems.map((group) => (
          <div key={group.section} className="mb-4">
            <p className="text-[9px] text-text-3 font-semibold uppercase tracking-widest px-2 mb-1">{group.section}</p>
            {group.items.map(({ label, href, icon: Icon, teaser }) => {
              const isActive = pathname === href || pathname.startsWith(href + "/");
              const isAlerts = href === "/alerts";
              return (
                <Link key={href} href={href} className={cn("sidebar-item", isActive && "active")}>
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="flex-1">{label}</span>
                  {isAlerts && alertCount > 0 && (
                    <span className="ml-auto bg-accent text-white text-[9px] font-bold px-1.5 py-px rounded-full">{alertCount}</span>
                  )}
                  {teaser && (
                    <span className="ml-auto flex items-center gap-0.5 text-[9px] font-semibold text-accent/70 bg-accent/8 px-1.5 py-px rounded-full border border-accent/15">
                      <Sparkles className="w-2.5 h-2.5" />Soon
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </>
  );

  return (
    <>
      {/* ── Desktop sidebar (always visible md+) ─────────── */}
      <aside className="hidden md:flex w-[220px] flex-shrink-0 bg-bg-2 border-r border-border flex-col">
        <SidebarContent />
      </aside>

      {/* ── Mobile: hamburger button in top-left ─────────── */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-3 left-3 z-40 w-9 h-9 rounded-xl bg-surface border border-border flex items-center justify-center shadow-sm"
      >
        <Menu className="w-4 h-4 text-text-2" />
      </button>

      {/* ── Mobile: overlay + slide-in sidebar ───────────── */}
      {mobileOpen && (
        <>
          {/* Backdrop */}
          <div
            className="md:hidden fixed inset-0 z-40 bg-text/30 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          {/* Slide-in sidebar */}
          <aside className="md:hidden fixed inset-y-0 left-0 z-50 w-[260px] bg-bg-2 border-r border-border flex flex-col shadow-2xl animate-in slide-in-from-left duration-200">
            <SidebarContent />
          </aside>
        </>
      )}
    </>
  );
}
