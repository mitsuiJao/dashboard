import { useState } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import devicesJson from "../../data/devices.json"

type Status = "online" | "offline" | "error"

interface Device {
  id: string
  name: string
  model: string
  firmware: string
  location: string
  status: Status
  lastComm: string
  channels: Channel[]
  logs: Log[]
}

interface Channel {
  name: string
  unit: string
  min: number
  max: number
}

interface Log {
  time: string
  message: string
  level: "info" | "warn" | "error"
}

const devices: Device[] = devicesJson as Device[]

const statusConfig = {
  online:  { label: "接続中", dot: "bg-green-500", text: "text-green-700 dark:text-green-400",  ping: true  },
  offline: { label: "切断",   dot: "bg-slate-400", text: "text-muted-foreground",               ping: false },
  error:   { label: "エラー", dot: "bg-amber-400", text: "text-amber-600 dark:text-amber-400",  ping: false },
}

const logLevel = {
  info: "text-muted-foreground",
  warn: "text-yellow-600 dark:text-yellow-400",
  error: "text-red-600 dark:text-red-400",
}

type Filter = "all" | Status

export default function Devices() {
  const [filter, setFilter] = useState<Filter>("all")
  const [selected, setSelected] = useState<Device | null>(null)

  const filtered = filter === "all" ? devices : devices.filter((d) => d.status === filter)

  return (
    <div className="p-6 space-y-5">
      <h2 className="text-base font-semibold">デバイス管理</h2>

      {/* Filter */}
      <div className="flex gap-2">
        {(["all", "online", "offline", "error"] as const).map((f) => {
          const labels = { all: "すべて", online: "接続中", offline: "切断", error: "エラー" }
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-xs px-3 py-1.5 rounded-md border transition-colors ${
                filter === f
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/50"
              }`}
            >
              {labels[f]}
              {f !== "all" && (
                <span className="ml-1.5 tabular-nums">
                  ({devices.filter((d) => d.status === f).length})
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Device table */}
      <div className="border border-border rounded-lg bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr className="text-[11px] text-muted-foreground">
              <th className="text-left px-4 py-2.5 font-medium">ID</th>
              <th className="text-left px-4 py-2.5 font-medium">名称</th>
              <th className="text-left px-4 py-2.5 font-medium">モデル</th>
              <th className="text-left px-4 py-2.5 font-medium">設置場所</th>
              <th className="text-left px-4 py-2.5 font-medium">状態</th>
              <th className="text-left px-4 py-2.5 font-medium">最終通信</th>
              <th className="text-right px-4 py-2.5 font-medium">CH数</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((d) => {
              const sc = statusConfig[d.status]
              return (
                <tr
                  key={d.id}
                  className={`border-t border-border/50 cursor-pointer transition-colors ${
                    selected?.id === d.id ? "bg-muted/50" : "hover:bg-muted/30"
                  }`}
                  onClick={() => setSelected(selected?.id === d.id ? null : d)}
                >
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{d.id}</td>
                  <td className="px-4 py-3 font-medium">{d.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{d.model}</td>
                  <td className="px-4 py-3 text-muted-foreground">{d.location}</td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1.5">
                      {sc.ping ? (
                        <span className="relative w-1.5 h-1.5 flex-shrink-0">
                          <span className={`absolute inset-0 rounded-full ${sc.dot} animate-ping opacity-60`} />
                          <span className={`relative block w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                        </span>
                      ) : (
                        <span className={`w-1.5 h-1.5 rounded-full ${sc.dot} flex-shrink-0`} />
                      )}
                      <span className={`text-[11px] ${sc.text}`}>{sc.label}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{d.lastComm}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">{d.channels.length}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Device detail panel */}
      {selected && (
        <div className="border border-border rounded-lg bg-card">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div>
              <span className="font-semibold">{selected.name}</span>
              <span className="ml-2 font-mono text-xs text-muted-foreground">{selected.id}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setSelected(null)} className="h-7 w-7 p-0">
              <X size={14} />
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-0 divide-x divide-border">
            {/* Basic info */}
            <div className="p-4 space-y-3">
              <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">
                基本情報
              </p>
              {[
                ["デバイス名", selected.name],
                ["モデル", selected.model],
                ["ファームウェア", selected.firmware],
                ["設置場所", selected.location],
                ["最終通信", selected.lastComm],
              ].map(([k, v]) => (
                <div key={k}>
                  <p className="text-[10px] text-muted-foreground">{k}</p>
                  <p className="text-sm font-medium">{v}</p>
                </div>
              ))}
            </div>

            {/* Channel definitions */}
            <div className="p-4">
              <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider mb-3">
                チャンネル定義
              </p>
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-muted-foreground">
                    <th className="text-left pb-2 font-medium">名称</th>
                    <th className="text-left pb-2 font-medium">単位</th>
                    <th className="text-right pb-2 font-medium">下限</th>
                    <th className="text-right pb-2 font-medium">上限</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.channels.map((ch) => (
                    <tr key={ch.name} className="border-t border-border/50">
                      <td className="py-1.5">{ch.name}</td>
                      <td className="py-1.5 text-muted-foreground">{ch.unit}</td>
                      <td className="py-1.5 text-right tabular-nums">{ch.min}</td>
                      <td className="py-1.5 text-right tabular-nums">{ch.max}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Communication log */}
            <div className="p-4">
              <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider mb-3">
                通信ログ
              </p>
              <div className="space-y-2">
                {selected.logs.map((log, i) => (
                  <div key={i} className="flex gap-2 text-xs">
                    <span className="font-mono text-muted-foreground flex-shrink-0">{log.time}</span>
                    <span className={logLevel[log.level]}>{log.message}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
