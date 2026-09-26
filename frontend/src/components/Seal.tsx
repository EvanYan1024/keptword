import { cn } from "@/lib/utils"

/** Vermilion square seal carrying the KeptWord monogram. */
export function Seal({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "bg-vermilion text-paper relative inline-grid size-10 shrink-0 place-items-center rounded-[3px] font-serif leading-none italic",
        "shadow-[inset_0_0_0_2px_var(--vermilion),inset_0_0_0_3.5px_var(--paper)]",
        className,
      )}
    >
      <span className="-translate-x-[0.03em] translate-y-[0.04em] text-[1.45em]">K</span>
    </span>
  )
}

type Verdict = "kept" | "broken"

const VERDICT = {
  kept: { label: "Kept", className: "text-jade border-jade", rotate: "-8deg" },
  broken: { label: "Broken", className: "text-vermilion border-vermilion", rotate: "7deg" },
} as const

/** Rubber-stamp verdict mark, pressed onto resolved pledges. */
export function VerdictStamp({ verdict, className, animate }: { verdict: Verdict; className?: string; animate?: boolean }) {
  const v = VERDICT[verdict]
  return (
    <span
      style={{ ["--stamp-rotate" as string]: v.rotate, rotate: animate ? undefined : v.rotate }}
      className={cn(
        "inline-flex flex-col items-center rounded-[4px] border-[2.5px] px-4 pt-1.5 pb-1 opacity-90 mix-blend-multiply",
        "shadow-[inset_0_0_0_2px_var(--card),inset_0_0_0_3.5px_currentColor]",
        v.className,
        animate && "animate-stamp",
        className,
      )}
    >
      <span className="font-mono text-[0.55rem] font-medium tracking-[0.34em] uppercase">Verdict</span>
      <span className="font-serif text-[1.35rem] leading-none tracking-wide uppercase">{v.label}</span>
    </span>
  )
}
