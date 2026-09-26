import { useEffect, useState } from "react"

import { CreatePledgeDialog } from "@/components/CreatePledgeDialog"
import { PledgeCard } from "@/components/PledgeCard"
import { usePledges } from "@/hooks/useKeptWord"
import type { PledgeStatus } from "@/lib/keptword"
import { cn } from "@/lib/utils"

type Filter = "all" | PledgeStatus

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Under seal" },
  { key: "kept", label: "Kept" },
  { key: "broken", label: "Broken" },
]

function useNow() {
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000))
  useEffect(() => {
    const id = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 15_000)
    return () => clearInterval(id)
  }, [])
  return now
}

export default function Ledger() {
  const { data: pledges, error, isPending } = usePledges()
  const [filter, setFilter] = useState<Filter>("all")
  const now = useNow()

  const count = (f: Filter) => (f === "all" ? pledges?.length : pledges?.filter((p) => p.status === f).length) ?? 0
  const shown = pledges?.filter((p) => filter === "all" || p.status === filter) ?? []

  return (
    <main className="mx-auto max-w-6xl px-5 py-14">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="eyebrow">Public record</p>
          <h1 className="mt-3 font-serif text-6xl leading-none">The Ledger</h1>
          <p className="text-ink-soft mt-4 max-w-lg">
            Every pledge on KeptWord, its bond, its evidence, and — once judged — the validators’ verdict.
          </p>
        </div>
        <CreatePledgeDialog />
      </div>

      <div className="border-ink/80 mt-10 flex flex-wrap gap-x-6 gap-y-2 border-b">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "-mb-px border-b-2 pb-3 font-mono text-xs tracking-[0.14em] uppercase transition-colors",
              filter === f.key ? "border-vermilion text-ink" : "text-ink-soft hover:text-ink border-transparent",
            )}
          >
            {f.label} <span className="text-ink-soft">{count(f.key)}</span>
          </button>
        ))}
      </div>

      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        {error && <p className="text-vermilion text-sm">Couldn’t read the ledger: {error.message}</p>}
        {isPending && <p className="text-ink-soft font-mono text-sm">Reading the ledger…</p>}
        {pledges && shown.length === 0 && (
          <p className="text-ink-soft font-serif text-2xl italic">
            {pledges.length === 0 ? "No pledges yet. Be the first to put your word on record." : "Nothing here yet."}
          </p>
        )}
        {shown.map((p, i) => (
          <div key={p.id} className="animate-rise" style={{ animationDelay: `${Math.min(i, 8) * 60}ms` }}>
            <PledgeCard pledge={p} now={now} />
          </div>
        ))}
      </section>
    </main>
  )
}
