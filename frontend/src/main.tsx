import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { RainbowKitProvider, lightTheme } from "@rainbow-me/rainbowkit"
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

const theme = lightTheme({
  accentColor: "#1b1915",
  accentColorForeground: "#f7f2e6",
  borderRadius: "small",
  fontStack: "system",
})
theme.colors.modalBackground = "#faf6ec"
theme.colors.connectButtonBackground = "#faf6ec"
theme.fonts.body = '"Hanken Grotesk", ui-sans-serif, sans-serif'

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
