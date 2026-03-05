import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const [{ data: projects }, { count: alertCount }] = await Promise.all([
    supabase.from("projects").select("id, name, category").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("alerts").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("read", false),
  ]);

  const activeProjectId =
    (user.user_metadata?.active_project_id as string | undefined) ??
    projects?.[0]?.id ??
    null;

  const activeProject = projects?.find(p => p.id === activeProjectId) ?? projects?.[0] ?? null;

  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      {/* Desktop sidebar — hidden on mobile */}
      <Sidebar
        projects={projects ?? []}
        activeProjectId={activeProjectId}
        alertCount={alertCount ?? 0}
      />

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {children}
      </main>

      {/* Mobile bottom nav — hidden on desktop */}
      <BottomNav
        alertCount={alertCount ?? 0}
        projectName={activeProject?.name}
      />
    </div>
  );
}
