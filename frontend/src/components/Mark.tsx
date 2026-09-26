import { cn } from "@/lib/utils"

/** KeptWord logomark: a monogram tile with a live status dot. */
export function Mark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "bg-foreground text-background relative inline-grid size-7 shrink-0 place-items-center rounded-[7px] font-mono text-[0.95rem] leading-none font-bold",
        className,
      )}
    >
      K
      <span className="bg-signal ring-background absolute -right-0.5 -bottom-0.5 size-2 rounded-full ring-2" />
    </span>
  )
}

type Verdict = "kept" | "broken"

const VERDICT = {
  kept: { label: "Kept", className: "text-signal border-signal/40 bg-signal/10" },
  broken: { label: "Broken", className: "text-danger border-danger/40 bg-danger/10" },
} as const

/** Final on-chain verdict badge for a resolved pledge. */
export function VerdictBadge({ verdict, className }: { verdict: Verdict; className?: string }) {
  const v = VERDICT[verdict]
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[0.68rem] tracking-[0.12em] uppercase",
        v.className,
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      Verdict · {v.label}
    </span>
  )
}
