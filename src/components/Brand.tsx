import { Leaf } from "lucide-react";

export function Brand({ inverted = false }: { inverted?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`grid size-8 place-items-center rounded-lg ${inverted ? "bg-forest-foreground text-forest" : "bg-primary text-primary-foreground"}`}>
        <Leaf className="size-4" />
      </span>
      <span className="font-display text-lg font-semibold">EcoTrack</span>
    </div>
  );
}
