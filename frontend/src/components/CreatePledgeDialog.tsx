import { useState, type FormEvent } from "react"
import { useConnectModal } from "@rainbow-me/rainbowkit"
import { useQueryClient } from "@tanstack/react-query"
import { parseEther } from "viem"
import { toast } from "sonner"
import { CalendarIcon, Loader2Icon, PlusIcon } from "lucide-react"
import { enUS } from "react-day-picker/locale"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Textarea } from "@/components/ui/textarea"
import { useSigner } from "@/hooks/useKeptWord"
import { createPledge, sameAddress } from "@/lib/keptword"

const ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/

// URLs and addresses never contain whitespace; also drops invisible chars (zero-width, BOM, bidi marks) picked up by copy-paste.
const stripInvisible = (value: string) => value.replace(/[\s\p{Cf}]/gu, "")

// Local calendar day + "HH:MM" -> unix seconds, or NaN when either part is missing.
function toTimestamp(day: Date | undefined, time: string) {
  const [h, m] = time.split(":").map(Number)
  if (!day || Number.isNaN(h) || Number.isNaN(m)) return NaN
  const d = new Date(day)
  d.setHours(h, m, 0, 0)
  return Math.floor(d.getTime() / 1000)
}

export function CreatePledgeDialog() {
  const { account, getSigner } = useSigner()
  const { openConnectModal } = useConnectModal()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [statement, setStatement] = useState("")
  const [evidenceUrl, setEvidenceUrl] = useState("")
  const [deadlineDay, setDeadlineDay] = useState<Date | undefined>()
  const [deadlineTime, setDeadlineTime] = useState("23:59")
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [beneficiary, setBeneficiary] = useState("")
  const [bond, setBond] = useState("1")

  function validate(): string | null {
    if (!statement.trim()) return "Describe what you promise."
    if (statement.length > 500) return "Keep the promise under 500 characters."
    if (!evidenceUrl.startsWith("https://")) return "The evidence URL must start with https://"
    const ts = toTimestamp(deadlineDay, deadlineTime)
    if (Number.isNaN(ts) || ts <= Date.now() / 1000) return "Pick a deadline in the future."
    if (!ADDRESS_RE.test(beneficiary)) return "Beneficiary must be a 0x address."
    if (sameAddress(beneficiary, account)) return "The beneficiary can't be you."
    if (!(Number(bond) > 0)) return "The bond must be greater than zero."
    return null
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!account) return
    const error = validate()
    if (error) {
      toast.error(error)
      return
    }
    setSubmitting(true)
    const id = toast.loading("Waiting for consensus on your pledge…")
    try {
      await createPledge(await getSigner(), {
        statement: statement.trim(),
        evidenceUrl,
        deadline: toTimestamp(deadlineDay, deadlineTime),
        beneficiary,
        bond: parseEther(bond),
      })
      toast.success("Pledge is live. Your word is on the line.", { id })
      setOpen(false)
      setStatement("")
      setEvidenceUrl("")
      setDeadlineDay(undefined)
      setDeadlineTime("23:59")
      await queryClient.invalidateQueries({ queryKey: ["pledges"] })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err), { id })
    } finally {
      setSubmitting(false)
    }
  }

  if (!account) {
    return (
      <Button size="lg" className="h-10" onClick={openConnectModal}>
        <PlusIcon /> Make a pledge
      </Button>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="h-10">
          <PlusIcon /> Make a pledge
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card sm:max-w-lg">
        <form onSubmit={onSubmit} className="grid gap-4">
          <DialogHeader>
            <span className="eyebrow">New pledge</span>
            <DialogTitle className="text-2xl font-semibold tracking-tight">Make a pledge</DialogTitle>
            <DialogDescription>
              Stake GEN on a public promise. After the deadline, GenLayer validators read your evidence page and decide
              whether you kept your word.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-2">
            <Label htmlFor="statement">I promise that…</Label>
            <Textarea
              id="statement"
              value={statement}
              onChange={(e) => setStatement(e.target.value)}
              placeholder="We will publish v1.0 of our SDK with public release notes."
              maxLength={500}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="evidence">Evidence page</Label>
            <Input
              id="evidence"
              type="url"
              value={evidenceUrl}
              onChange={(e) => setEvidenceUrl(stripInvisible(e.target.value))}
              placeholder="https://github.com/your-org/your-repo/releases"
              required
            />
            <p className="text-muted-foreground text-xs">
              Validators read this page when judging. If it doesn't clearly show the promise was kept, the bond is lost.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
            <div className="grid gap-2">
              <Label htmlFor="deadline">Deadline</Label>
              <div className="flex gap-2">
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      id="deadline"
                      type="button"
                      variant="outline"
                      className="flex-1 justify-between font-normal"
                    >
                      <span className={deadlineDay ? undefined : "text-muted-foreground"}>
                        {deadlineDay
                          ? deadlineDay.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
                          : "Pick a date"}
                      </span>
                      <CalendarIcon className="text-muted-foreground" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={deadlineDay}
                      defaultMonth={deadlineDay}
                      captionLayout="dropdown"
                      locale={enUS}
                      disabled={{ before: new Date() }}
                      onSelect={(day) => {
                        setDeadlineDay(day)
                        setCalendarOpen(false)
                      }}
                    />
                  </PopoverContent>
                </Popover>
                <Input
                  aria-label="Deadline time"
                  type="time"
                  value={deadlineTime}
                  onChange={(e) => setDeadlineTime(e.target.value)}
                  className="w-28 appearance-none [&::-webkit-calendar-picker-indicator]:hidden"
                  required
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bond">Bond (GEN)</Label>
              <Input
                id="bond"
                type="number"
                min="0"
                step="any"
                value={bond}
                onChange={(e) => setBond(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="beneficiary">If I break it, the bond goes to</Label>
            <Input
              id="beneficiary"
              value={beneficiary}
              onChange={(e) => setBeneficiary(stripInvisible(e.target.value))}
              placeholder="0x… (community treasury, backers, a charity)"
              required
            />
          </div>

          <DialogFooter>
            <Button type="submit" size="lg" disabled={submitting}>
              {submitting && <Loader2Icon className="animate-spin" />}
              Lock bond and pledge
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
