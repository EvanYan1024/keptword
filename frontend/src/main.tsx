import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter, Route, Routes } from "react-router"
import { WagmiProvider } from "wagmi"

import "@rainbow-me/rainbowkit/styles.css"
import "./index.css"

import { Layout } from "@/components/Layout"
import { wagmiConfig } from "@/lib/wagmi"
import Docs from "@/pages/Docs"
import Landing from "@/pages/Landing"
import Ledger from "@/pages/Ledger"

const queryClient = new QueryClient()

const theme = darkTheme({
  accentColor: "#ededed",
  accentColorForeground: "#0a0a0a",
  borderRadius: "medium",
  fontStack: "system",
})
theme.colors.modalBackground = "#0e0e0e"
theme.colors.connectButtonBackground = "#111111"
theme.fonts.body = '"Geist Variable", ui-sans-serif, system-ui, sans-serif'

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={theme} modalSize="compact">
          <BrowserRouter>
            <Routes>
              <Route element={<Layout />}>
                <Route index element={<Landing />} />
                <Route path="app" element={<Ledger />} />
                <Route path="docs" element={<Docs />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </StrictMode>,
)
