"use client";

import { User, Building2, CreditCard, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface Props {
  user: { email: string };
  project: {
    name: string;
    category: string;
    stage: string;
    narrative: string;
    goals: string[];
    twitter_handle: string | null;
    telegram_handle: string | null;
    website: string | null;
  } | null;
}

export function SettingsClient({ user, project }: Props) {
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-bg">
      <div className="max-w-lg flex flex-col gap-5">

        {/* Account */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-4 h-4 text-text-3" />
            <p className="text-xs font-semibold uppercase tracking-widest text-text-3">Account</p>
          </div>
          <div className="flex flex-col gap-3">
            <div>
              <label className="input-label">Email</label>
              <input
                className="input-base opacity-60 cursor-not-allowed"
                value={user.email}
                disabled
              />
            </div>
            <div>
              <label className="input-label">Password</label>
              <input
                className="input-base"
                type="password"
                placeholder="Change password..."
                disabled
              />
              <p className="text-[10px] text-text-3 mt-1">Password changes coming in v1.1</p>
            </div>
          </div>
        </div>

        {/* Project */}
        {project && (
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="w-4 h-4 text-text-3" />
              <p className="text-xs font-semibold uppercase tracking-widest text-text-3">Your project</p>
            </div>
            <div className="flex flex-col gap-3">
              <div>
                <label className="input-label">Project name</label>
                <input className="input-base" defaultValue={project.name} />
              </div>
              <div>
                <label className="input-label">Category</label>
                <input className="input-base" defaultValue={project.category} disabled />
              </div>
              <div>
                <label className="input-label">Narrative</label>
                <textarea
                  className="input-base resize-none"
                  rows={4}
                  defaultValue={project.narrative}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="input-label">Twitter / X</label>
                  <input className="input-base" defaultValue={project.twitter_handle ?? ""} placeholder="@handle" />
                </div>
                <div>
                  <label className="input-label">Telegram</label>
                  <input className="input-base" defaultValue={project.telegram_handle ?? ""} placeholder="@channel" />
                </div>
              </div>
              <button className="btn-primary self-start">
                Save changes
              </button>
            </div>
          </div>
        )}

        {/* Plan */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="w-4 h-4 text-text-3" />
            <p className="text-xs font-semibold uppercase tracking-widest text-text-3">Plan</p>
          </div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-semibold text-sm">Free plan</p>
              <p className="text-xs text-text-2">Limited to 1 project, 50 matches/month</p>
            </div>
            <span className="text-[10px] font-semibold px-2 py-1 bg-bg-2 rounded-full text-text-3">
              Free
            </span>
          </div>
          <button className="btn-primary text-xs">
            Upgrade to Pro — $99/mo →
          </button>
        </div>

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 text-sm text-text-2 hover:text-brand-red transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>

      </div>
    </div>
  );
}
