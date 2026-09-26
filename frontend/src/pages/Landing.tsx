import { ArrowRightIcon } from "lucide-react"
import { Link } from "react-router"
import { formatEther } from "viem"

import { Seal, VerdictStamp } from "@/components/Seal"
import { Button } from "@/components/ui/button"
import { usePledges } from "@/hooks/useKeptWord"

const ARTICLES = [
  {
    n: "I",
    title: "Pledge",
    body: "Write the promise in plain language, lock a GEN bond, set a deadline, and name the public page that will prove it — a release page, a changelog, an on-chain explorer, a published report.",
  },
  {
    n: "II",
    title: "Wait, or prove early",
    body: "Deliver before the deadline and you can ask the validators to judge right away. Until then the bond stays locked in the contract, where nobody — including you — can touch it.",
  },
  {
    n: "III",
    title: "Verdict",
    body: "Once the deadline passes, anyone can call for judgment. GenLayer validators each fetch the evidence, reason over it independently, and must agree. Kept: the bond comes home. Broken: it goes to the beneficiary.",
  },
]

const USES = [
  ["Founders", "“Mainnet launches before Q4.” Back the roadmap with money, not a thread."],
  ["Token teams", "“No team tokens unlock before March.” Let the market price your restraint."],
  ["DAO delegates", "“I vote on every proposal this season.” Make delegation accountable."],
  ["Maintainers", "“v2.0 ships with a migration guide.” Give sponsors something firmer than a promise."],
  ["Creators", "“One long-form essay a week.” Put a price on your streak."],
]

export default function Landing() {
  const { data: pledges } = usePledges()
  const staked = pledges?.reduce((sum, p) => sum + p.bond, 0n) ?? 0n
  const kept = pledges?.filter((p) => p.status === "kept").length ?? 0
  const broken = pledges?.filter((p) => p.status === "broken").length ?? 0

  return (
    <main>
      {/* Hero */}
      <section className="mx-auto grid max-w-6xl gap-14 px-5 pt-16 pb-20 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:pt-24">
        <div>
          <p className="eyebrow animate-rise">An accountability bond on GenLayer</p>
          <h1 className="animate-rise mt-6 font-serif text-[clamp(3.4rem,8vw,6.6rem)] leading-[0.92] tracking-[-0.02em] [animation-delay:80ms]">
            Your word,
            <br />
            <em className="text-vermilion">under seal.</em>
          </h1>
          <p className="animate-rise text-ink-soft mt-8 max-w-xl text-lg leading-relaxed [animation-delay:160ms]">
            Lock GEN behind a public promise and name the page that will prove it. When the deadline arrives, a jury of
            AI validators reads the evidence and reaches consensus. Keep your word and the bond comes back. Break it and
            the bond goes to whoever you named.
          </p>
          <div className="animate-rise mt-10 flex flex-wrap items-center gap-3 [animation-delay:240ms]">
            <Button asChild size="lg" className="h-12 rounded-[3px] px-6 text-base">
              <Link to="/app">
                Make a pledge <ArrowRightIcon />
              </Link>
            </Button>
            <Button asChild size="lg" variant="ghost" className="h-12 rounded-[3px] px-5 text-base">
              <Link to="/docs">How judgment works</Link>
            </Button>
          </div>
        </div>

        {/* Specimen certificate */}
        <div className="animate-rise relative mx-auto w-full max-w-md [animation-delay:200ms]">
          <div className="bg-paper-deep absolute inset-0 translate-x-3 translate-y-3 rotate-[2.5deg] rounded-[3px] border border-rule" />
          <article className="bg-card border-ink relative -rotate-[1.5deg] rounded-[3px] border p-7 shadow-[0_24px_60px_-30px_rgba(27,25,21,0.45)]">
            <div className="border-rule flex items-center justify-between border-b border-dashed pb-4">
              <span className="eyebrow">Pledge Nº 0042 · specimen</span>
              <Seal className="size-9 text-[15px]" />
            </div>
            <p className="mt-5 font-serif text-[1.65rem] leading-snug">
              “We will publish v1.0 of the SDK with public release notes by October 1.”
            </p>
            <dl className="mt-6 grid grid-cols-2 gap-y-3 font-mono text-xs">
              <dt className="text-ink-soft">Bond</dt>
              <dd className="text-right">25 GEN</dd>
              <dt className="text-ink-soft">Evidence</dt>
              <dd className="truncate text-right">github.com/…/releases</dd>
              <dt className="text-ink-soft">If broken →</dt>
              <dd className="text-right">community treasury</dd>
            </dl>
            <div className="border-rule mt-6 border-t pt-4 text-sm leading-relaxed">
              <span className="eyebrow block pb-1">Validators</span>
              Release v1.0.0 is tagged on Sep 28 with full release notes, before the deadline.
            </div>
            <VerdictStamp verdict="kept" animate className="absolute -right-4 -bottom-5 scale-125 [animation-delay:900ms]" />
          </article>
        </div>
      </section>

      {/* Live ledger strip */}
      <section className="border-ink/80 border-y">
        <div className="bg-rule mx-auto grid max-w-6xl grid-cols-2 gap-px sm:grid-cols-4">
          {[
            ["Pledges on record", pledges ? String(pledges.length) : "—"],
            ["GEN under seal", pledges ? formatEther(staked) : "—"],
            ["Kept", pledges ? String(kept) : "—"],
            ["Broken", pledges ? String(broken) : "—"],
          ].map(([label, value]) => (
            <div key={label} className="bg-background px-6 py-7">
              <div className="font-serif text-5xl leading-none tabular-nums">{value}</div>
              <div className="eyebrow mt-3">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Articles */}
      <section className="mx-auto max-w-6xl px-5 py-24">
        <div className="grid gap-4 md:grid-cols-[0.8fr_2fr]">
          <h2 className="font-serif text-5xl leading-none">
            The covenant,
            <br />
            <em>in three articles.</em>
          </h2>
          <ol className="grid gap-0">
            {ARTICLES.map((a) => (
              <li key={a.n} className="border-rule grid grid-cols-[4rem_1fr] gap-4 border-t py-8 first:border-t-0 first:pt-0">
                <span className="text-vermilion font-serif text-4xl italic">{a.n}</span>
                <div>
                  <h3 className="text-xl font-semibold">{a.title}</h3>
                  <p className="text-ink-soft mt-2 max-w-2xl leading-relaxed">{a.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Why validators */}
      <section className="bg-ink text-paper">
        <div className="mx-auto grid max-w-6xl gap-12 px-5 py-24 lg:grid-cols-2">
          <div>
            <p className="eyebrow !text-paper/60">Why not just ask an AI?</p>
            <h2 className="mt-5 font-serif text-5xl leading-[1.02]">
              One model is an opinion.
              <br />
              <em className="text-[#e8826b]">A jury is a verdict.</em>
            </h2>
          </div>
          <div className="text-paper/80 grid gap-6 text-lg leading-relaxed">
            <p>
              “Was this promise kept?” is a judgment call. Deterministic smart contracts can’t read a release page, and a
              single backend or oracle turns the pledger’s counterparty into a trust problem.
            </p>
            <p>
              On GenLayer, a leader validator proposes the verdict and the others independently fetch the same evidence and
              re-derive it. Only agreement on the decision itself — kept or broken — settles the bond. A validator that only
              checks formatting is not allowed to rubber-stamp the leader.
            </p>
            <p>
              The burden of proof is on the pledger. Vague, missing, or late evidence means the pledge is broken; only a
              failed page fetch leaves it pending for a retry.
            </p>
          </div>
        </div>
      </section>

      {/* Uses */}
      <section className="mx-auto max-w-6xl px-5 py-24">
        <p className="eyebrow">Who pledges</p>
        <ul className="mt-8">
          {USES.map(([who, what]) => (
            <li
              key={who}
              className="border-rule group grid gap-2 border-t py-6 last:border-b sm:grid-cols-[14rem_1fr] sm:items-baseline"
            >
              <span className="font-serif text-3xl transition-colors group-hover:text-vermilion">{who}</span>
              <span className="text-ink-soft text-lg">{what}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-5 pb-28">
        <div className="border-ink relative overflow-hidden rounded-[3px] border px-8 py-14 sm:px-14">
          <Seal className="absolute -right-12 -bottom-16 size-72 rotate-[14deg] text-[120px] opacity-[0.09]" />
          <h2 className="max-w-2xl font-serif text-5xl leading-[1.02]">
            Say it. Stake it. <em>Keep it.</em>
          </h2>
          <p className="text-ink-soft mt-4 max-w-xl text-lg">
            It takes a minute to put your word on-chain — and a jury to let you off the hook.
          </p>
          <Button asChild size="lg" className="mt-8 h-12 rounded-[3px] px-6 text-base">
            <Link to="/app">
              Open the ledger <ArrowRightIcon />
            </Link>
          </Button>
        </div>
      </section>
    </main>
  )
}
