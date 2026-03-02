"use client";

import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface Props {
  projectId: string;
}

type Phase = "idle" | "running" | "done" | "error";

export function DiscoveryButton({ projectId }: Props) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("idle");
  const [result, setResult] = useState<{ matched: number; top_score: number } | null>(null);
  const [error, setError] = useState("");

  const runDiscovery = async () => {
    setPhase("running");
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: projectId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Discovery failed");
      }

      setResult({ matched: data.matched, top_score: data.top_score });
      setPhase("done");

      // Refresh the page to show new match data
      router.refresh();

      // Reset button after 4 seconds
      setTimeout(() => setPhase("idle"), 4000);

    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setPhase("error");
      setTimeout(() => setPhase("idle"), 4000);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Status message */}
      {phase === "running" && (
        <p className="text-xs text-text-2 font-mono animate-pulse">
          🤖 AI scoring matches...
        </p>
      )}
      {phase === "done" && result && (
        <p className="text-xs text-brand-green font-mono">
          ✓ {result.matched} scored · top {result.top_score}%
        </p>
      )}
      {phase === "error" && (
        <p className="text-xs text-brand-red font-mono truncate max-w-[200px]">
          ✗ {error}
        </p>
      )}

      {/* Button */}
      <Button
        variant="primary"
        size="sm"
        onClick={runDiscovery}
        loading={phase === "running"}
        disabled={phase === "running"}
      >
        {phase === "done" ? "✓ Done" : "Run discovery →"}
      </Button>
    </div>
  );
}
