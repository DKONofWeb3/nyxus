import { cn } from "@/lib/utils";

type BadgeVariant = "green" | "red" | "yellow" | "blue" | "default";

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantMap: Record<BadgeVariant, string> = {
  green: "badge-green",
  red: "badge-red",
  yellow: "badge-yellow",
  blue: "badge-blue",
  default: "inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-bg-2 text-text-2",
};

export function Badge({ variant = "default", children, className }: BadgeProps) {
  return (
    <span className={cn(variantMap[variant], className)}>{children}</span>
  );
}

interface MatchScoreBadgeProps {
  score: number;
  className?: string;
}

export function MatchScoreBadge({ score, className }: MatchScoreBadgeProps) {
  const variant =
    score >= 75 ? "green" : score >= 50 ? "yellow" : "red";

  const colors = {
    green: "bg-brand-green/10 text-brand-green",
    yellow: "bg-brand-yellow/10 text-yellow-700",
    red: "bg-brand-red/10 text-brand-red",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded-md",
        colors[variant],
        className
      )}
    >
      {score}%
    </span>
  );
}
