import { createClient } from "genlayer-js"
import { studionet } from "genlayer-js/chains"
import { TransactionStatus, type GenLayerTransaction, type TransactionHash } from "genlayer-js/types"
import type { EIP1193Provider } from "viem"

type Hex = `0x${string}`

const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS as Hex | undefined
if (!contractAddress) {
  throw new Error("VITE_CONTRACT_ADDRESS is not set; copy frontend/.env.example to frontend/.env")
}
export const CONTRACT_ADDRESS: Hex = contractAddress

export type PledgeStatus = "active" | "kept" | "broken"

export type Pledge = {
  id: string
  pledger: string
  beneficiary: string
  statement: string
  evidenceUrl: string
  deadline: number
  bond: bigint
  status: PledgeStatus
  reason: string
  createdAt: number
  resolvedAt: number
}

const reader = createClient({ chain: studionet })

export type Signer = { account: Hex; provider: EIP1193Provider }

function writer({ account, provider }: Signer) {
  return createClient({ chain: studionet, account, provider })
}

function toPledge(raw: unknown): Pledge {
  const m = raw instanceof Map ? Object.fromEntries(raw) : (raw as Record<string, unknown>)
  return {
    id: String(m.id),
    pledger: String(m.pledger),
    beneficiary: String(m.beneficiary),
    statement: String(m.statement),
    evidenceUrl: String(m.evidence_url),
    deadline: Number(m.deadline),
    bond: BigInt(m.bond as bigint | number),
    status: m.status as PledgeStatus,
    reason: String(m.reason),
    createdAt: Number(m.created_at),
    resolvedAt: Number(m.resolved_at),
  }
}

export async function fetchPledges(): Promise<Pledge[]> {
  const raw = await reader.readContract({
    address: CONTRACT_ADDRESS,
    functionName: "get_pledges",
    args: [],
  })
  return (raw as unknown[]).map(toPledge).reverse()
}

async function waitForSuccess(client: ReturnType<typeof writer>, hash: TransactionHash): Promise<GenLayerTransaction> {
  const tx = await client.waitForTransactionReceipt({
    hash,
    status: TransactionStatus.ACCEPTED,
    interval: 5000,
    retries: 60,
  })
  const ok =
    (tx.statusName === "ACCEPTED" || tx.statusName === "FINALIZED") &&
    tx.txExecutionResultName === "FINISHED_WITH_RETURN"
  if (!ok) {
    throw new TxFailedError(tx)
  }
  return tx
}

export class TxFailedError extends Error {
  tx: GenLayerTransaction
  constructor(tx: GenLayerTransaction) {
    super(`Transaction ${tx.statusName ?? "unknown"} / ${tx.txExecutionResultName ?? "unknown"}`)
    this.tx = tx
  }
}

export async function createPledge(
  signer: Signer,
  input: { statement: string; evidenceUrl: string; deadline: number; beneficiary: string; bond: bigint },
) {
  const client = writer(signer)
  const hash = await client.writeContract({
    address: CONTRACT_ADDRESS,
    functionName: "create_pledge",
    args: [input.statement, input.evidenceUrl, BigInt(input.deadline), input.beneficiary],
    value: input.bond,
  })
  return waitForSuccess(client, hash)
}

export async function resolvePledge(signer: Signer, pledgeId: string) {
  const client = writer(signer)
  const hash = await client.writeContract({
    address: CONTRACT_ADDRESS,
    functionName: "resolve",
    args: [pledgeId],
    value: 0n,
  })
  return waitForSuccess(client, hash)
}

export function shortAddress(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

export function sameAddress(a?: string | null, b?: string | null) {
  return !!a && !!b && a.toLowerCase() === b.toLowerCase()
}
