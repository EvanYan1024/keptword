import { ConnectButton } from "@rainbow-me/rainbowkit"
import { Link, NavLink, Outlet } from "react-router"

import { Mark } from "@/components/Mark"
import { Toaster } from "@/components/ui/sonner"
import { CONTRACT_ADDRESS, shortAddress } from "@/lib/keptword"
import { cn } from "@/lib/utils"

const navClass = ({ isActive }: { isActive: boolean }) =>
  cn("text-sm transition-colors", isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground")

export function Layout() {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="bg-background/75 sticky top-0 z-30 border-b backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-8 px-5">
          <Link to="/" className="flex items-center gap-2.5">
            <Mark />
            <span className="text-[1.05rem] font-semibold tracking-tight">KeptWord</span>
          </Link>
          <nav className="hidden items-center gap-6 sm:flex">
            <NavLink to="/app" className={navClass}>
              Ledger
            </NavLink>
            <NavLink to="/docs" className={navClass}>
              Docs
            </NavLink>
          </nav>
          <div className="ml-auto">
            <ConnectButton chainStatus="icon" showBalance={false} accountStatus="address" label="Connect" />
          </div>
        </div>
        <nav className="flex justify-center gap-8 border-t py-2 sm:hidden">
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

      <footer className="border-t">
        <div className="text-muted-foreground mx-auto flex max-w-6xl flex-col gap-3 px-5 py-8 text-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <Mark className="size-5 rounded-[5px] text-[0.7rem]" />
            <span>A promise is worth its weight in gold.</span>
          </div>
          <p className="font-mono text-xs">
            GenLayer Studionet · {shortAddress(CONTRACT_ADDRESS)}
          </p>
        </div>
      </footer>
      <Toaster position="bottom-right" />
    </div>
  )
}
