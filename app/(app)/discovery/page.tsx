import { Topbar } from "@/components/layout/Topbar";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DiscoveryClient } from "@/components/discovery/DiscoveryClient";

export default async function DiscoveryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Get user's active project
  const { data: projects } = await supabase
    .from("projects")
    .select("id, name")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1);

  const project = projects?.[0];
  if (!project) redirect("/onboarding");

  // Get all matches with discovered project data, sorted by score
  const { data: matches } = await supabase
    .from("matches")
    .select(`
      id, score, reasoning, category_match,
      discovered_projects (
        id, name, category, narrative,
        twitter_handle, telegram_handle,
        twitter_followers, telegram_members,
        last_active, source, raw_data
      )
    `)
    .eq("project_id", project.id)
    .order("score", { ascending: false });

  return (
    <>
      <Topbar title="Discovery">
        <span className="text-xs text-text-2 font-mono">
          {matches?.length ?? 0} projects matched
        </span>
      </Topbar>
      <DiscoveryClient matches={matches ?? []} projectName={project.name} />
    </>
  );
}
