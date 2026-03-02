"use client";

import { cn } from "@/lib/utils";

interface TagSelectorProps {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  multi?: boolean;
}

export function TagSelector({
  options,
  selected,
  onChange,
  multi = true,
}: TagSelectorProps) {
  const toggle = (option: string) => {
    if (multi) {
      if (selected.includes(option)) {
        onChange(selected.filter((s) => s !== option));
      } else {
        onChange([...selected, option]);
      }
    } else {
      onChange(selected.includes(option) ? [] : [option]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => toggle(option)}
          className={cn(
            "tag",
            selected.includes(option) && "selected"
          )}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
