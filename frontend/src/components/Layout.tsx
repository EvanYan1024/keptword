import { ConnectButton } from "@rainbow-me/rainbowkit"
import { Link, NavLink, Outlet } from "react-router"

import { Seal } from "@/components/Seal"
import { Toaster } from "@/components/ui/sonner"
import { CONTRACT_ADDRESS, shortAddress } from "@/lib/keptword"
import { cn } from "@/lib/utils"

const navClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "font-mono text-xs tracking-[0.16em] uppercase transition-colors",
    isActive ? "text-ink underline decoration-vermilion decoration-2 underline-offset-8" : "text-ink-soft hover:text-ink",
  )

export function Layout() {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="border-ink/80 sticky top-0 z-30 border-b bg-paper/85 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-5">
          <Link to="/" className="flex items-center gap-2.5">
            <Seal className="size-8 text-[15px]" />
            <span className="font-serif text-2xl leading-none tracking-tight">KeptWord</span>
          </Link>
          <nav className="ml-auto hidden items-center gap-7 sm:flex">
            <NavLink to="/app" className={navClass}>
              Ledger
            </NavLink>
            <NavLink to="/docs" className={navClass}>
              Docs
            </NavLink>
          </nav>
          <div className="ml-auto sm:ml-0">
            <ConnectButton chainStatus="icon" showBalance={false} accountStatus="address" label="Connect" />
          </div>
        </div>
        <nav className="border-rule flex justify-center gap-8 border-t py-2 sm:hidden">
          <NavLink to="/app" className={navClass}>
            Ledger
          </NavLink>
          <NavLink to="/docs" className={navClass}>
            Docs
          </NavLink>
        </nav>
      </header>

      <div className="flex-1">
        <Outlet />
      </div>

      <footer className="border-ink/80 border-t">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-serif text-lg italic">A promise is worth its weight in gold.</p>
          <p className="eyebrow">
            Built on GenLayer · Studionet · contract {shortAddress(CONTRACT_ADDRESS)}
          </p>
        </div>
      </footer>
      <Toaster richColors position="bottom-right" />
    </div>
  )
}
