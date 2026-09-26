import { ArrowRightIcon } from "lucide-react"
import { Link } from "react-router"
import { formatEther } from "viem"

import { VerdictBadge } from "@/components/Mark"
import { Button } from "@/components/ui/button"
import { usePledges } from "@/hooks/useKeptWord"

const STEPS = [
  {
    n: "01",
    title: "Pledge",
    body: "Write the promise in plain language, lock a GEN bond, set a deadline, and name the public page that will prove it: a release page, a changelog, an explorer, a published report.",
  },
  {
    n: "02",
    title: "Deliver, or prove early",
    body: "Ship before the deadline and ask the validators to judge right away. Until then the bond stays locked in the contract, where nobody, including you, can touch it.",
  },
  {
    n: "03",
    title: "Verdict",
    body: "From the deadline on, anyone can call for judgment. Validators each fetch the evidence, reason over it independently, and must agree. Kept: the bond comes home. Broken: it goes to the beneficiary.",
  },
]

const USES = [
  ["Founders", "Mainnet launches before Q4.", "Back the roadmap with money, not a thread."],
  ["Token teams", "No team tokens unlock before March.", "Let the market price your restraint."],
  ["DAO delegates", "I vote on every proposal this season.", "Make delegation accountable."],
  ["Maintainers", "v2.0 ships with a migration guide.", "Give sponsors something firmer than a promise."],
  ["Creators", "One long-form essay a week.", "Put a price on your streak."],
]

const VOTE_START_MS = 700
const VOTE_STEP_MS = 260

function ConsensusPanel() {
  const verdictDelay = VOTE_START_MS + VOTE_STEP_MS * 5 + 200
  return (
    <div className="bg-card relative overflow-hidden rounded-xl border shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_30px_80px_-40px_rgba(69,240,161,0.25)]">
      <div className="flex items-center justify-between border-b px-5 py-3">
        <span className="eyebrow">Pledge #0042</span>
        <span className="text-muted-foreground font-mono text-[0.68rem]">specimen</span>
      </div>

      <div className="px-5 py-5">
        <p className="text-[1.15rem] leading-snug font-medium tracking-tight">
          “We will publish v1.0 of the SDK with public release notes by October 1.”
        </p>
        <dl className="mt-5 grid grid-cols-3 gap-px overflow-hidden rounded-md border bg-border font-mono text-xs">
          {[
            ["bond", "25 GEN"],
            ["deadline", "Oct 01"],
            ["evidence", "…/releases"],
          ].map(([k, v]) => (
            <div key={k} className="bg-card px-3 py-2.5">
              <dt className="text-muted-foreground">{k}</dt>
              <dd className="mt-0.5 truncate">{v}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="border-t px-5 py-5">
        <div className="flex items-center justify-between">
          <span className="eyebrow">Validators</span>
          <span
            className="animate-fade text-signal font-mono text-xs"
            style={{ animationDelay: `${verdictDelay - 150}ms` }}
          >
            5/5 agree
          </span>
        </div>
        <div className="mt-3 grid grid-cols-5 gap-2">
          {["leader", "v1", "v2", "v3", "v4"].map((v, i) => (
            <div
              key={v}
              className="animate-vote bg-raised flex h-14 flex-col justify-between rounded-md border p-2"
              style={{ animationDelay: `${VOTE_START_MS + i * VOTE_STEP_MS}ms` }}
            >
              <span className="text-muted-foreground font-mono text-[0.6rem] uppercase">{v}</span>
              <span className="font-mono text-[0.7rem]">kept</span>
            </div>
          ))}
        </div>
        <div className="animate-fade mt-4 flex items-center justify-between gap-3" style={{ animationDelay: `${verdictDelay}ms` }}>
          <VerdictBadge verdict="kept" />
          <span className="text-muted-foreground font-mono text-xs">25 GEN → pledger</span>
        </div>
      </div>
    </div>
  )
}

export default function Landing() {
  const { data: pledges } = usePledges()
  const staked = pledges?.reduce((sum, p) => sum + p.bond, 0n) ?? 0n
  const kept = pledges?.filter((p) => p.status === "kept").length ?? 0
  const broken = pledges?.filter((p) => p.status === "broken").length ?? 0

  return (
    <main>
      {/* Hero */}
      <section className="relative">
        <div className="dot-grid pointer-events-none absolute inset-0" />
        <div className="relative mx-auto grid max-w-6xl gap-14 px-5 pt-20 pb-24 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:pt-28">
          <div>
            <p className="animate-rise text-muted-foreground inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs">
              <span className="bg-signal size-1.5 rounded-full" /> Accountability bonds on GenLayer
            </p>
            <h1 className="animate-rise mt-7 text-[clamp(2.6rem,5.4vw,4.4rem)] leading-[0.98] font-semibold tracking-[-0.045em] [animation-delay:80ms]">
              Put your stake
              <br />
              <span className="text-muted-foreground">behind your word.</span>
            </h1>
            <p className="animate-rise text-muted-foreground mt-7 max-w-xl text-lg leading-relaxed [animation-delay:160ms]">
              Lock GEN behind a public promise and name the page that will prove it. At the deadline, independent AI
              validators read the evidence and must agree. Keep your word and the bond comes back. Break it and it goes
              to whoever you named.
            </p>
            <div className="animate-rise mt-9 flex flex-wrap items-center gap-3 [animation-delay:240ms]">
              <Button asChild size="lg" className="h-11 px-5">
                <Link to="/app">
                  Make a pledge <ArrowRightIcon />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-11 px-5">
                <Link to="/docs">How judgment works</Link>
              </Button>
            </div>
          </div>
          <div className="animate-rise [animation-delay:200ms]">
            <ConsensusPanel />
          </div>
        </div>
      </section>

      {/* Live stats */}
      <section className="border-y">
        <div className="bg-border mx-auto grid max-w-6xl grid-cols-2 gap-px sm:grid-cols-4">
          {[
            ["Pledges", pledges ? String(pledges.length) : "—"],
            ["GEN bonded", pledges ? formatEther(staked) : "—"],
            ["Kept", pledges ? String(kept) : "—"],
            ["Broken", pledges ? String(broken) : "—"],
          ].map(([label, value]) => (
            <div key={label} className="bg-background px-6 py-8">
              <div className="font-mono text-4xl font-medium tracking-tight tabular-nums">{value}</div>
              <div className="eyebrow mt-3">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-5 py-24">
        <p className="eyebrow">How it works</p>
        <h2 className="mt-3 max-w-xl text-4xl font-semibold tracking-[-0.03em]">Three steps from promise to verdict.</h2>
        <ol className="bg-border mt-12 grid gap-px overflow-hidden rounded-xl border md:grid-cols-3">
          {STEPS.map((s) => (
            <li key={s.n} className="bg-card p-7">
              <span className="text-signal font-mono text-sm">{s.n}</span>
              <h3 className="mt-6 text-lg font-semibold tracking-tight">{s.title}</h3>
              <p className="text-muted-foreground mt-3 leading-relaxed">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Why validators */}
      <section className="border-y">
        <div className="mx-auto grid max-w-6xl gap-12 px-5 py-24 lg:grid-cols-2">
          <div>
            <p className="eyebrow">Why not just ask an AI?</p>
            <h2 className="mt-3 text-4xl leading-tight font-semibold tracking-[-0.03em]">
              One model is an opinion.
              <br />
              <span className="text-signal">Consensus is a verdict.</span>
            </h2>
          </div>
          <div className="text-muted-foreground grid gap-6 text-[1.05rem] leading-relaxed">
            <p>
              “Was this promise kept?” is a judgment call. A normal smart contract can’t read a release page, and a single
              backend or oracle turns the pledger’s counterparty into a trust problem.
            </p>
            <p>
              On GenLayer, a leader validator proposes the verdict and the others independently fetch the same evidence
              and re-derive it. Only agreement on the decision itself, kept or broken, settles the bond. No validator is
              allowed to just check the leader’s formatting and wave it through.
            </p>
            <p>
              <span className="text-foreground">The burden of proof is on the pledger.</span> Vague, missing, or late
              evidence means broken. Only a failed page fetch leaves a pledge pending for a retry.
            </p>
          </div>
        </div>
      </section>

      {/* Uses */}
      <section className="mx-auto max-w-6xl px-5 py-24">
        <p className="eyebrow">Who pledges</p>
        <div className="mt-8 overflow-hidden rounded-xl border">
          {USES.map(([who, pledge, why]) => (
            <div
              key={who}
              className="hover:bg-raised grid gap-1 border-t px-6 py-5 transition-colors first:border-t-0 sm:grid-cols-[11rem_1fr_1fr] sm:items-baseline sm:gap-6"
            >
              <span className="font-medium">{who}</span>
              <span className="font-mono text-sm">“{pledge}”</span>
              <span className="text-muted-foreground text-sm">{why}</span>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-5 pb-28">
        <div className="relative overflow-hidden rounded-xl border px-8 py-16 text-center sm:px-14">
          <div className="dot-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_60%_80%_at_50%_100%,#000_20%,transparent_70%)]" />
          <div className="bg-signal/20 pointer-events-none absolute -bottom-24 left-1/2 h-48 w-[36rem] -translate-x-1/2 rounded-full blur-3xl" />
          <h2 className="relative text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">Say it. Stake it. Keep it.</h2>
          <p className="text-muted-foreground relative mx-auto mt-4 max-w-md text-lg">
            It takes a minute to put your word on-chain, and a quorum of validators to let you off the hook.
          </p>
          <Button asChild size="lg" className="relative mt-8 h-11 px-5">
            <Link to="/app">
              Open the ledger <ArrowRightIcon />
            </Link>
          </Button>
        </div>
      </section>
    </main>
  )
}
