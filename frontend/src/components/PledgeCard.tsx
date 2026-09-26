import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { formatEther } from "viem"
import { toast } from "sonner"
import { ArrowUpRightIcon, GavelIcon, Loader2Icon } from "lucide-react"

import { VerdictStamp } from "@/components/Seal"
import { Button } from "@/components/ui/button"
import { useSigner } from "@/hooks/useKeptWord"
import { resolvePledge, sameAddress, shortAddress, TxFailedError, type Pledge } from "@/lib/keptword"
import { cn } from "@/lib/utils"

function relative(ts: number, now: number) {
  const diff = ts - now
  const abs = Math.abs(diff)
  const unit =
    abs >= 86400
      ? `${Math.round(abs / 86400)}d`
      : abs >= 3600
        ? `${Math.round(abs / 3600)}h`
        : `${Math.max(1, Math.round(abs / 60))}m`
  return diff >= 0 ? `in ${unit}` : `${unit} ago`
}

function formatDate(ts: number) {
  return new Date(ts * 1000).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function PledgeCard({ pledge, now }: { pledge: Pledge; now: number }) {
  const [resolving, setResolving] = useState(false)
  const queryClient = useQueryClient()
  const { account, getSigner } = useSigner()
  const pastDeadline = now >= pledge.deadline
  const isPledger = sameAddress(account, pledge.pledger)
  const canResolve = pledge.status === "active" && !!account && (pastDeadline || isPledger)

  async function onResolve() {
    setResolving(true)
    const id = toast.loading("The validators are reading the evidence…")
    try {
      await resolvePledge(await getSigner(), pledge.id)
      toast.success("Verdict recorded.", { id })
      await queryClient.invalidateQueries({ queryKey: ["pledges"] })
    } catch (err) {
      const early = err instanceof TxFailedError && !pastDeadline
      toast.error(
        early
          ? "The evidence doesn't prove it yet. Your pledge stays active."
          : err instanceof Error
            ? err.message
            : String(err),
        { id },
      )
    } finally {
      setResolving(false)
    }
  }

  return (
    <article
      className={cn(
        "bg-card relative flex h-full flex-col rounded-[3px] border p-6 transition-shadow hover:shadow-[0_18px_40px_-28px_rgba(27,25,21,0.5)]",
        pledge.status === "active" ? "border-ink/70" : "border-rule",
      )}
    >
      <header className="flex items-center justify-between gap-3">
        <span className="eyebrow">Pledge Nº {pledge.id.padStart(4, "0")}</span>
        {pledge.status === "active" && (
          <span className="text-vermilion inline-flex items-center gap-1.5 font-mono text-[0.7rem] tracking-[0.16em] uppercase">
            <span className="bg-vermilion size-1.5 animate-pulse rounded-full" /> Under seal
          </span>
        )}
      </header>

      <p className="mt-4 pr-2 font-serif text-[1.55rem] leading-snug">“{pledge.statement}”</p>

      <dl className="mt-5 mb-6 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 font-mono text-xs">
        <dt className="text-ink-soft">Pledger</dt>
        <dd>
          {shortAddress(pledge.pledger)}
          {isPledger && <span className="text-vermilion"> · you</span>}
        </dd>
        <dt className="text-ink-soft">Bond</dt>
        <dd className="font-medium">{formatEther(pledge.bond)} GEN</dd>
        <dt className="text-ink-soft">Deadline</dt>
        <dd>
          {formatDate(pledge.deadline)} <span className="text-ink-soft">({relative(pledge.deadline, now)})</span>
        </dd>
        <dt className="text-ink-soft">If broken →</dt>
        <dd>{shortAddress(pledge.beneficiary)}</dd>
        <dt className="text-ink-soft">Evidence</dt>
        <dd className="min-w-0">
          <a
            href={pledge.evidenceUrl}
            target="_blank"
            rel="noreferrer"
            className="decoration-vermilion inline-flex max-w-full items-center gap-1 underline decoration-1 underline-offset-4 hover:decoration-2"
          >
            <span className="truncate">{pledge.evidenceUrl.replace(/^https:\/\//, "")}</span>
            <ArrowUpRightIcon className="size-3 shrink-0" />
          </a>
        </dd>
      </dl>

      {pledge.status !== "active" && (
        <div className="border-rule mt-auto border-t border-dashed pt-4 pr-36">
          <span className="eyebrow block pb-1">Validators · {formatDate(pledge.resolvedAt)}</span>
          <p className="text-sm leading-relaxed">{pledge.reason || "No reason recorded."}</p>
          <VerdictStamp verdict={pledge.status} className="absolute right-5 bottom-5" />
        </div>
      )}

      {pledge.status === "active" && (
        <footer className="border-rule mt-auto flex items-center justify-between gap-3 border-t border-dashed pt-4">
          <span className="text-ink-soft text-xs">
            {pastDeadline ? "Deadline passed — anyone can call the verdict." : "Only the pledger can ask for an early verdict."}
          </span>
          <Button
            size="sm"
            variant="outline"
            className="rounded-[3px]"
            disabled={!canResolve || resolving}
            onClick={onResolve}
          >
            {resolving ? <Loader2Icon className="animate-spin" /> : <GavelIcon />}
            {pastDeadline ? "Call verdict" : "Prove now"}
          </Button>
        </footer>
      )}
    </article>
  )
}
