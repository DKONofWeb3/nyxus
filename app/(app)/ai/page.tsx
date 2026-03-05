export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AIChatClient } from "@/components/ai/AIChatClient";
import { Topbar } from "@/components/layout/Topbar";

export default async function AIPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const activeId = user.user_metadata?.active_project_id as string | undefined;
  const project  = (activeId ? projects?.find((p) => p.id === activeId) : null) ?? projects?.[0] ?? null;

  if (!project) redirect("/onboarding");

  // Fetch recent conversation history
  const { data: history } = await supabase
    .from("ai_messages")
    .select("role, content, created_at")
    .eq("project_id", project.id)
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(50);

  // Fetch message count for this month
  const thisMonth = new Date();
  thisMonth.setDate(1); thisMonth.setHours(0, 0, 0, 0);
  const { count } = await supabase
    .from("ai_messages")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", thisMonth.toISOString());

  return (
    <>
      <Topbar title="NYXUS AI">
        <span className="text-xs text-text-2 font-mono">
          {20 - (count || 0)} messages left this month
        </span>
      </Topbar>
      <AIChatClient
        project={project}
        userId={user.id}
        initialHistory={(history || []).map((m) => ({
          role:    m.role as "user" | "assistant",
          content: m.content,
        }))}
        messagesUsed={count || 0}
      />
    </>
  );
}
