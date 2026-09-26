import { useCallback } from "react"
import { useQuery } from "@tanstack/react-query"
import type { EIP1193Provider } from "viem"
import { useAccount } from "wagmi"

import { fetchPledges, type Signer } from "@/lib/keptword"

export function usePledges() {
  return useQuery({ queryKey: ["pledges"], queryFn: fetchPledges, refetchInterval: 15_000 })
}

/** Connected account plus a getter for a signer backed by the RainbowKit-connected wallet. */
export function useSigner() {
  const { address, connector } = useAccount()
  const getSigner = useCallback(async (): Promise<Signer> => {
    if (!address || !connector) throw new Error("Connect a wallet first")
    const provider = (await connector.getProvider()) as EIP1193Provider
    return { account: address, provider }
  }, [address, connector])
  return { account: address ?? null, getSigner }
}
