import { connectorsForWallets } from "@rainbow-me/rainbowkit"
import {
  coinbaseWallet,
  injectedWallet,
  metaMaskWallet,
  rabbyWallet,
  walletConnectWallet,
} from "@rainbow-me/rainbowkit/wallets"
import { studionet as genlayerStudionet } from "genlayer-js/chains"
import { defineChain } from "viem"
import { createConfig, http } from "wagmi"

export const studionet = defineChain({
  id: genlayerStudionet.id,
  name: "GenLayer Studionet",
  nativeCurrency: genlayerStudionet.nativeCurrency,
  rpcUrls: genlayerStudionet.rpcUrls,
})

// WalletConnect-based wallets (mobile, QR) need a project id from cloud.reown.com.
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID as string | undefined

const connectors = connectorsForWallets(
  [
    {
      groupName: "Wallets",
      wallets: projectId
        ? [metaMaskWallet, rabbyWallet, coinbaseWallet, walletConnectWallet, injectedWallet]
        : [injectedWallet, rabbyWallet, coinbaseWallet],
    },
  ],
  { appName: "KeptWord", projectId: projectId ?? "" },
)

export const wagmiConfig = createConfig({
  chains: [studionet],
  connectors,
  transports: { [studionet.id]: http() },
})
