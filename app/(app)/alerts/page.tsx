import { Topbar } from "@/components/layout/Topbar";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Bell, Zap, Search, CheckCircle, Scan } from "lucide-react";

const ALERT_ICONS: Record<string, React.ReactNode> = {
  scan_complete:    <Scan className="w-4 h-4" />,
  new_project:      <Search className="w-4 h-4" />,
  collab_signal:    <Zap className="w-4 h-4" />,
  narrative_shift:  <Bell className="w-4 h-4" />,
};

const ALERT_COLORS: Record<string, string> = {
  scan_complete:   "bg-blue-500/10 text-blue-500",
  new_project:     "bg-brand-green/10 text-brand-green",
  collab_signal:   "bg-accent/10 text-accent",
  narrative_shift: "bg-yellow-500/10 text-yellow-600",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7)   return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default async function AlertsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: alerts } = await supabase
    .from("alerts")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const unread = alerts?.filter((a) => !a.read).length ?? 0;

  return (
    <>
      <Topbar title="Alerts">
        {unread > 0 && (
          <span className="text-xs font-mono text-text-2">
            {unread} unread
          </span>
        )}
      </Topbar>

      <div className="flex-1 overflow-y-auto p-6 bg-bg">
        {/* Empty state */}
        {!alerts || alerts.length === 0 ? (
          <div className="card p-12 text-center">
            <Bell className="w-8 h-8 text-text-3 mx-auto mb-3" />
            <p className="font-syne font-bold mb-1">No alerts yet</p>
            <p className="text-sm text-text-2">
              Alerts appear after you run discovery scans. Go to the dashboard and hit "Run discovery →".
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {alerts.map((alert) => {
              const icon  = ALERT_ICONS[alert.type] ?? <Bell className="w-4 h-4" />;
              const color = ALERT_COLORS[alert.type] ?? "bg-text/10 text-text";

              return (
                <div
                  key={alert.id}
                  className={`card flex items-start gap-3 p-4 transition-opacity ${alert.read ? "opacity-60" : ""}`}
                >
                  {/* Icon */}
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${color}`}>
                    {icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-semibold">{alert.title}</p>
                      {!alert.read && (
                        <span className="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" />
                      )}
                    </div>
                    {alert.description && (
                      <p className="text-xs text-text-2 leading-relaxed">{alert.description}</p>
                    )}
                  </div>

                  {/* Time */}
                  <span className="text-[10px] text-text-3 font-mono flex-shrink-0 mt-1">
                    {timeAgo(alert.created_at)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
