import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizes = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-xl",
};

export function Logo({ size = "md", className }: LogoProps) {
  return (
    <span
      className={cn(
        "font-syne font-extrabold tracking-tight",
        sizes[size],
        className
      )}
    >
      NYX<span className="text-accent">US</span>
    </span>
  );
}
