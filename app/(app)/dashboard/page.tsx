import { Topbar } from "@/components/layout/Topbar";
import { Badge, MatchScoreBadge } from "@/components/ui/Badge";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DiscoveryButton } from "@/components/ui/DiscoveryButton";
import Link from "next/link";
import { Plus } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Fetch ALL user projects for switcher
  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const project = projects?.[0] ?? null;

  // No projects at all — show setup prompt instead of forcing redirect
  if (!project) {
    return (
      <>
        <Topbar title="Dashboard" />
        <div className="flex-1 flex items-center justify-center p-6 bg-bg">
          <div className="text-center max-w-sm">
            <p className="text-4xl mb-4">🚀</p>
            <p className="font-syne font-extrabold text-xl mb-2">Welcome to NYXUS</p>
            <p className="text-sm text-text-2 mb-6 leading-relaxed">
              Set up your first project to start discovering partnership matches across the Web3 ecosystem.
            </p>
            <Link
              href="/onboarding"
              className="inline-flex items-center gap-2 bg-accent text-white font-semibold text-sm px-5 py-2.5 rounded-lg hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" />
              Add your first project →
            </Link>
          </div>
        </div>
      </>
    );
  }

  // Fetch top matches for active project
  const { data: matches } = await supabase
    .from("matches")
    .select(`
      score, reasoning, category_match,
      discovered_projects (id, name, category, twitter_followers, telegram_members)
    `)
    .eq("project_id", project.id)
    .order("score", { ascending: false })
    .limit(5);

  // Fetch unread alerts
  const { data: alerts } = await supabase
    .from("alerts")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(4);

  const topScore    = matches?.[0]?.score ?? null;
  const totalFound  = matches?.length ?? 0;
  const unreadAlerts = alerts?.filter((a) => !a.read).length ?? 0;
  const hasRun      = matches && matches.length > 0;

  const categoryGradient: Record<string, string> = {
    "DeFi":              "from-blue-500 to-purple-500",
    "Meme coin":         "from-accent to-orange-400",
    "NFT":               "from-pink-500 to-purple-500",
    "Gaming / GameFi":   "from-green-500 to-teal-500",
    "AI + Crypto":       "from-cyan-500 to-blue-500",
    "Protocol":          "from-violet-500 to-indigo-500",
    "Infrastructure":    "from-slate-500 to-gray-600",
    "Trading bot":       "from-yellow-500 to-orange-500",
  };

  return (
    <>
      <Topbar title="Dashboard">
        <DiscoveryButton projectId={project.id} />
      </Topbar>

      <div className="flex-1 overflow-y-auto p-6 bg-bg">

        {!hasRun && (
          <div className="card p-4 mb-6 border-accent/20 bg-accent/5 flex items-center gap-3">
            <span className="text-xl">🚀</span>
            <div>
              <p className="text-sm font-semibold">
                <span className="text-accent">{project.name}</span> is set up.
              </p>
              <p className="text-xs text-text-2 mt-0.5">
                Hit "Run discovery" to score your first batch of partnership matches.
              </p>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="card p-4">
            <p className="text-[10px] text-text-3 font-semibold uppercase tracking-widest mb-2">Top match score</p>
            <p className="font-syne text-3xl font-extrabold tracking-tighter mb-1">
              {topScore !== null ? `${topScore}%` : "—"}
            </p>
            <Badge variant={topScore && topScore >= 70 ? "green" : topScore ? "yellow" : "default"}>
              {topScore && topScore >= 70 ? "↑ Strong fit" : topScore ? "Moderate fit" : "Run discovery"}
            </Badge>
          </div>
          <div className="card p-4">
            <p className="text-[10px] text-text-3 font-semibold uppercase tracking-widest mb-2">Projects matched</p>
            <p className="font-syne text-3xl font-extrabold tracking-tighter mb-1">{totalFound}</p>
            <Badge variant={totalFound > 0 ? "yellow" : "default"}>
              {totalFound > 0 ? `Top ${totalFound} shown` : "Not yet run"}
            </Badge>
          </div>
          <div className="card p-4">
            <p className="text-[10px] text-text-3 font-semibold uppercase tracking-widest mb-2">New alerts</p>
            <p className="font-syne text-3xl font-extrabold tracking-tighter mb-1">{unreadAlerts}</p>
            <Badge variant={unreadAlerts > 0 ? "red" : "default"}>
              {unreadAlerts > 0 ? "Needs review" : "All clear"}
            </Badge>
          </div>
        </div>

        {/* Top matches */}
        <h2 className="font-syne text-sm font-bold mb-3 tracking-tight">
          Top matches for {project.name}
        </h2>

        {!hasRun ? (
          <div className="card p-8 text-center mb-6">
            <p className="text-2xl mb-2">🔍</p>
            <p className="text-sm font-semibold mb-1">No matches yet</p>
            <p className="text-xs text-text-2">Run your first discovery scan to see AI-generated match scores.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2 mb-6">
            {matches!.map((match, i) => {
              const dp = (Array.isArray(match.discovered_projects)
                ? match.discovered_projects[0]
                : match.discovered_projects) as {
                id: string; name: string; category: string | null;
                twitter_followers: number | null; telegram_members: number | null;
              };
              const initials = dp.name.slice(0, 2).toUpperCase();
              const gradient = categoryGradient[dp.category ?? ""] ?? "from-gray-500 to-gray-600";

              return (
                <div key={i} className="card flex items-center gap-3 p-3 hover:shadow-card-lg transition-shadow cursor-pointer">
                  <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{dp.name}</p>
                    <p className="text-xs text-text-2 truncate">{match.reasoning}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <MatchScoreBadge score={match.score} />
                    {dp.category && (
                      <span className="text-[10px] text-text-3 bg-bg-2 px-1.5 py-px rounded">{dp.category}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Alerts */}
        <h2 className="font-syne text-sm font-bold mb-3 tracking-tight">Recent alerts</h2>
        {!alerts || alerts.length === 0 ? (
          <div className="card p-6 text-center">
            <p className="text-xs text-text-2">No alerts yet — alerts appear after your first discovery scan.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {alerts.map((alert) => (
              <div key={alert.id} className="card flex items-start gap-3 p-3">
                <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${alert.read ? "bg-border" : "bg-accent"}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{alert.title}</p>
                  {alert.description && <p className="text-xs text-text-2 mt-0.5">{alert.description}</p>}
                </div>
                <span className="text-[10px] text-text-3 flex-shrink-0 font-mono">
                  {new Date(alert.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}