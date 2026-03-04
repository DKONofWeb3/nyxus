export const dynamic = "force-dynamic";

import { Topbar } from "@/components/layout/Topbar";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PartnershipsClient } from "@/components/partnerships/PartnershipsClient";

export default async function PartnershipsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: projects } = await supabase
    .from("projects")
    .select("id, name")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const activeId = user.user_metadata?.active_project_id as string | undefined;
  const project = (activeId ? projects?.find((p) => p.id === activeId) : null) ?? projects?.[0] ?? null;

  if (!project) redirect("/onboarding");

  const { data: partnerships } = await supabase
    .from("partnerships")
    .select("*")
    .eq("project_id", project.id)
    .order("created_at", { ascending: false });

  return (
    <>
      <Topbar title="Partnerships">
        <span className="text-xs text-text-2 font-mono">
          {partnerships?.length ?? 0} tracked
        </span>
      </Topbar>
      <PartnershipsClient partnerships={partnerships ?? []} projectId={project.id} />
    </>
  );
}
