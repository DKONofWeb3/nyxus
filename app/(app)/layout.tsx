import { Sidebar } from "@/components/layout/Sidebar";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Fetch all user projects + unread alert count in parallel
  const [{ data: projects }, { count: alertCount }] = await Promise.all([
    supabase
      .from("projects")
      .select("id, name, category")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("alerts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("read", false),
  ]);

  // Determine active project — stored in user metadata or default to most recent
  const activeProjectId =
    (user.user_metadata?.active_project_id as string | undefined) ??
    projects?.[0]?.id ??
    null;

  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      <Sidebar
        projects={projects ?? []}
        activeProjectId={activeProjectId}
        alertCount={alertCount ?? 0}
      />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {children}
      </main>
    </div>
  );
}
