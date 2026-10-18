import type { QueryClient } from "@tanstack/react-query";
import { MODES, type Mode } from "@/lib/emissions";
import { cn } from "@/lib/utils";

export function refreshAll(qc: QueryClient) {
  for (const k of ["trips", "habits", "profile", "leaderboard", "admin"]) qc.invalidateQueries({ queryKey: [k] });
}

export function ModeGrid({ value, onChange }: { value: string; onChange: (m: Mode) => void }) {
  return (
    <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-label="Travel mode">
      {MODES.map(({ mode, label, icon: Icon }) => {
        const active = value === mode;
        return (
          <button
            key={mode}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(mode)}
            className={cn(
              "flex min-h-[72px] flex-col items-center justify-center gap-1.5 rounded-2xl border text-sm font-medium transition-all active:scale-95",
              active ? "border-primary bg-primary text-primary-foreground shadow-sm" : "border-border bg-card text-foreground hover:border-primary/50",
            )}
          >
            <Icon className="size-5" strokeWidth={1.75} />
            {label}
          </button>
        );
      })}
    </div>
  );
}

export function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "min-h-11 rounded-full border px-4 text-sm font-medium transition-colors",
        active ? "border-primary bg-secondary text-secondary-foreground" : "border-border bg-card text-muted-foreground",
      )}
    >
      {children}
    </button>
  );
}

export function StateBox({ children }: { children: React.ReactNode }) {
  return <div className="card-surface p-6 text-center text-sm text-muted-foreground">{children}</div>;
}
