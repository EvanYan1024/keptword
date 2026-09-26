# KeptWord

**Put your stake behind your word.**

KeptWord is an accountability bond on [GenLayer](https://genlayer.com). You lock GEN behind a public promise, name the page that will prove it, and set a deadline. When the deadline arrives, GenLayer validators independently read that evidence and must agree on a verdict:

- **Kept** → the bond is refunded to the pledger.
- **Broken** → the bond goes to the beneficiary the pledger named (backers, a community treasury, a public-goods fund).

> A promise is worth its weight in gold.

## Why GenLayer

"Was this promise kept?" is a judgment call. It needs someone to read a release page, a changelog or a report, and weigh it against a sentence written in plain language.

- A normal smart contract can't read or reason about a web page.
- A single backend or oracle makes whoever runs it the judge, which is exactly the counterparty risk a bond is supposed to remove.

KeptWord puts only that one decision into a GenLayer Intelligent Contract. The contract lets several validators independently fetch the evidence, reason over it with an LLM, and reach consensus before any money moves.

## How it works

| Step | Who | What happens |
|---|---|---|
| **Pledge** | Pledger | `create_pledge(statement, evidence_url, deadline, beneficiary)` with GEN attached as the bond. |
| **Early proof** (optional) | Pledger only, before the deadline | `resolve(id)`: if validators find the promise kept, the bond is refunded now. If not, the call reverts and the pledge stays active, so an early attempt can never cost the bond. |
| **Verdict** | Anyone, from the deadline on | `resolve(id)`: validators judge the evidence; the bond goes to the pledger (kept) or the beneficiary (broken). Anyone can trigger it, so no bond is ever stranded. |

### Resolution rules

- **Burden of proof is on the pledger.** Missing, ambiguous, unrelated or late evidence means *broken*. The pledger chose the evidence page, so a vague page can't be used to escape.
- **Fetch failures never decide anything.** If the page can't be loaded, the transaction fails without changing state and can be retried.
- **Evidence is data, not instructions.** The prompt fences the page content and tells the model to ignore any instructions inside it, which defends against prompt injection.

## Consensus design

`resolve` runs one non-deterministic block through `gl.vm.run_nondet_unsafe` with a custom leader/validator pair ([`contracts/kept_word.py`](contracts/kept_word.py)):

1. The **leader** renders the evidence page (`gl.nondet.web.render`), truncates it to 8,000 characters, and asks the LLM for `{"kept": bool, "reason": str}` with `response_format="json"`.
2. Each **validator** renders the page again and produces its *own* verdict. It accepts only if both agree on `kept`; the wording of `reason` is free to differ. Validators never just check the leader's formatting.
3. **Errors are classified.** `[EXPECTED]` / `[EXTERNAL]` errors must match exactly. Two `[TRANSIENT]` fetch failures count as agreement to do nothing. `[LLM_ERROR]` (malformed output) is always a disagreement, which forces a leader rotation.
4. Only after consensus does the contract update storage and send the bond (`emit_transfer`, executed on finalization).

## Repository layout

```
contracts/kept_word.py          Intelligent Contract
tests/direct/test_kept_word.py  Fast in-memory tests (mocked web + LLM, validator checks)
tests/integration/              Real Studionet run: live web evidence + real LLM validators
frontend/                       Vite + React + shadcn/ui + RainbowKit dApp
deploy/deployScript.ts          Deploy script used by `genlayer deploy`
```

## Quick start

### Contract

Requires Python 3.12+.

```bash
python3.12 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

genvm-lint check contracts/kept_word.py   # static checks
python -m pytest tests/direct -v          # 25 direct-mode tests
```

Integration test against hosted Studionet (real web pages, real LLM validators; takes about 3 minutes):

```bash
gltest tests/integration/test_kept_word.py -v -s --network studionet
```

Deploy:

```bash
npm install -g genlayer
genlayer network set studionet
genlayer deploy --contract contracts/kept_word.py
```

### Frontend

```bash
npm install                     # from the repo root (npm workspace)
cp frontend/.env.example frontend/.env
# set VITE_CONTRACT_ADDRESS; optionally VITE_WALLETCONNECT_PROJECT_ID for WalletConnect/mobile wallets
npm run dev
```

Routes: `/` landing page · `/app` the Ledger (create, browse and resolve pledges) · `/docs` user documentation.

## Deployment

| Network | Chain ID | Contract |
|---|---|---|
| GenLayer Studionet | 61999 | `0xc7c7644EE7A19d786eFec69c1204b466482A83e6` |

## Testing

- **Direct mode (25 tests):** covers input validation, refunds versus payouts (transfers captured and asserted), early proof, the deadline boundary, double resolution, LLM output coercion and rejection. Validator tests check that a validator agrees despite different wording, rejects an opposite verdict, rejects a forged "kept" from a malicious leader, and classifies errors correctly. A mutation check (swapping payees, or making the validator always agree) makes the suite fail.
- **Integration:** on Studionet, a true pledge ("genlayer-js publishes a tagged release") resolves early as **kept**. A false one ("publishes 99.0.0") resolves after its deadline as **broken**, with validator reasons that cite the actual release versions.

## License

MIT
