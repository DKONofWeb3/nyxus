import { Topbar } from "@/components/layout/Topbar";
import { Handshake, Plus, ArrowRight } from "lucide-react";

// Placeholder partnership stages for visual demo
const STAGES = [
  { id: "identified",   label: "Identified",   color: "bg-text-3/20 text-text-3",   count: 0 },
  { id: "contacted",    label: "Contacted",    color: "bg-blue-500/10 text-blue-500", count: 0 },
  { id: "in_talks",     label: "In talks",     color: "bg-yellow-500/10 text-yellow-600", count: 0 },
  { id: "agreed",       label: "Agreed",       color: "bg-brand-green/10 text-brand-green", count: 0 },
];

export default function PartnershipsPage() {
  return (
    <>
      <Topbar title="Partnerships">
        <button className="flex items-center gap-1.5 text-xs font-semibold bg-accent text-white px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity">
          <Plus className="w-3.5 h-3.5" />
          Add partnership
        </button>
      </Topbar>

      <div className="flex-1 overflow-y-auto p-6 bg-bg">

        {/* Kanban columns */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {STAGES.map((stage) => (
            <div key={stage.id} className="flex flex-col gap-2">
              {/* Column header */}
              <div className="flex items-center justify-between mb-1">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${stage.color}`}>
                  {stage.label}
                </span>
                <span className="text-[10px] text-text-3 font-mono">{stage.count}</span>
              </div>

              {/* Empty column placeholder */}
              <div className="card border-dashed p-4 flex flex-col items-center justify-center gap-2 min-h-[120px] opacity-50">
                <Plus className="w-4 h-4 text-text-3" />
                <p className="text-[10px] text-text-3 text-center">Save a project from Discovery to start tracking</p>
              </div>
            </div>
          ))}
        </div>

        {/* Empty state CTA */}
        <div className="card p-8 text-center max-w-md mx-auto">
          <Handshake className="w-8 h-8 text-text-3 mx-auto mb-3" />
          <p className="font-syne font-bold mb-1">No partnerships tracked yet</p>
          <p className="text-sm text-text-2 mb-4">
            When you find a match in Discovery, hit "Save to partnerships" to track your outreach here.
          </p>
          <a
            href="/discovery"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline"
          >
            Go to Discovery <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </>
  );
}
