import { useState } from "react"
import { CheckCircle, Settings } from "lucide-react"
import type { PageId } from "../App"

interface ActiveAlert {
  id: number
  device: string
  channel: string
  value: string
  threshold: string
  type: "high" | "low"
  time: string
  acknowledged: boolean
  forecast?: { level: "warn" | "alert"; lookahead: string }
}

interface HistoryAlert {
  id: number
  device: string
  channel: string
  type: "high" | "low"
  triggered: string
  resolved: string
  duration: string
}

const initialAlerts: ActiveAlert[] = [
  {
    id: 1,
    device: "センサー D",
    channel: "温度",
    value: "87.3°C",
    threshold: "35.0°C",
    type: "high",
    time: "14:01:45",
    acknowledged: false,
  },
  {
    id: 2,
    device: "センサー A",
    channel: "湿度",
    value: "82%",
    threshold: "80%",
    type: "high",
    time: "13:45:12",
    acknowledged: false,
  },
  {
    id: 3,
    device: "センサー B",
    channel: "気圧",
    value: "998.2hPa",
    threshold: "1000.0hPa",
    type: "low",
    time: "12:30:00",
    acknowledged: true,
  },
  {
    id: 4,
    device: "センサー A",
    channel: "温度",
    value: "36.1°C (予測)",
    threshold: "38.0°C",
    type: "high",
    time: "14:30:00",
    acknowledged: false,
    forecast: { level: "warn", lookahead: "3時間以内" },
  },
  {
    id: 5,
    device: "全デバイス",
    channel: "湿度",
    value: "17% (予測)",
    threshold: "15%",
    type: "low",
    time: "14:30:00",
    acknowledged: false,
    forecast: { level: "warn", lookahead: "6時間以内" },
  },
]

const historyAlerts: HistoryAlert[] = [
  {
    id: 1,
    device: "センサー A",
    channel: "温度",
    type: "high",
    triggered: "05-25 22:15",
    resolved: "05-25 22:48",
    duration: "33分",
  },
  {
    id: 2,
    device: "センサー C",
    channel: "湿度",
    type: "low",
    triggered: "05-25 18:00",
    resolved: "05-25 20:12",
    duration: "2時間12分",
  },
  {
    id: 3,
    device: "センサー B",
    channel: "気圧",
    type: "low",
    triggered: "05-24 09:30",
    resolved: "05-24 11:05",
    duration: "1時間35分",
  },
  {
    id: 4,
    device: "センサー A",
    channel: "温度",
    type: "high",
    triggered: "05-23 14:20",
    resolved: "05-23 15:10",
    duration: "50分",
  },
]

function parseNumeric(s: string): number | null {
  const m = s.match(/[\d.]+/)
  return m ? parseFloat(m[0]) : null
}

function deviation(alert: ActiveAlert): string | null {
  if (alert.forecast) return null
  const v = parseNumeric(alert.value)
  const t = parseNumeric(alert.threshold)
  if (v === null || t === null || t === 0) return null
  const pct = alert.type === "high" ? ((v - t) / t) * 100 : ((t - v) / t) * 100
  if (pct <= 0) return null
  return `+${pct.toFixed(1)}%`
}

export default function Alerts({ onNavigate }: { onNavigate: (page: PageId) => void }) {
  const [activeTab, setActiveTab] = useState<"active" | "history">("active")
  const [alerts, setAlerts] = useState<ActiveAlert[]>(initialAlerts)

  const unacked = alerts.filter((a) => !a.acknowledged && !a.forecast).length
  const warnCount = alerts.filter((a) => !a.acknowledged && a.forecast?.level === "warn").length

  function acknowledge(id: number) {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, acknowledged: true } : a)))
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-semibold tracking-tight">アラート</h2>
        <button
          onClick={() => onNavigate("settings")}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Settings size={13} />
          アラート設定
        </button>
      </div>

      {/* Tab strip */}
      <div className="flex gap-1 border-b border-border">
        <button
          onClick={() => setActiveTab("active")}
          className={`text-xs px-4 py-2 border-b-2 transition-colors -mb-px flex items-center gap-1.5 ${
            activeTab === "active"
              ? "border-foreground text-foreground font-medium"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          アクティブ
          {unacked > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500 text-white font-medium leading-none">
              {unacked}
            </span>
          )}
          {warnCount > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-400 text-white font-medium leading-none">
              {warnCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`text-xs px-4 py-2 border-b-2 transition-colors -mb-px ${
            activeTab === "history"
              ? "border-foreground text-foreground font-medium"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          履歴
        </button>
      </div>

      {activeTab === "active" && (
        <div className="space-y-5">
          <div className="border border-border rounded-lg bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="text-[11px] text-muted-foreground">
                  <th className="text-left px-4 py-2.5 font-medium">デバイス</th>
                  <th className="text-left px-4 py-2.5 font-medium">チャンネル</th>
                  <th className="text-left px-4 py-2.5 font-medium">種別</th>
                  <th className="text-right px-4 py-2.5 font-medium">検出値</th>
                  <th className="text-right px-4 py-2.5 font-medium">閾値</th>
                  <th className="text-left px-4 py-2.5 font-medium">発生時刻</th>
                  <th className="text-left px-4 py-2.5 font-medium">状態</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {alerts.map((a) => (
                  <tr
                    key={a.id}
                    className={`border-t border-border/50 transition-colors even:bg-muted/20 ${
                      a.acknowledged ? "opacity-40" : ""
                    }`}
                  >
                    <td className="px-4 py-3 font-medium text-sm">{a.device}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className="flex items-center gap-1.5">
                        {a.channel}
                        {a.forecast && (
                          <span className="text-[9px] font-mono border border-border/60 rounded px-1 text-muted-foreground">予測</span>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {a.forecast ? (
                        <span className="text-[11px] font-medium flex items-center gap-0.5 text-amber-600 dark:text-amber-400">
                          {a.type === "high" ? "↑" : "↓"} {a.forecast.lookahead}に超過見込
                        </span>
                      ) : (
                        <span className={`text-[11px] font-medium flex items-center gap-0.5 ${
                          a.type === "high" ? "text-red-600 dark:text-red-400" : "text-blue-600 dark:text-blue-400"
                        }`}>
                          {a.type === "high" ? "↑" : "↓"} {a.type === "high" ? "上限超過" : "下限超過"}
                        </span>
                      )}
                    </td>
                    <td className={`px-4 py-3 text-right font-mono text-xs font-semibold ${
                      a.forecast ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400"
                    }`}>
                      {a.value}
                      {deviation(a) && (
                        <span className="block text-[10px] font-normal text-muted-foreground">
                          {deviation(a)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs text-muted-foreground">
                      {a.threshold}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{a.time}</td>
                    <td className="px-4 py-3">
                      {a.acknowledged ? (
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                          <CheckCircle size={11} />
                          対応済
                        </span>
                      ) : a.forecast ? (
                        <span className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                          <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">注意</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                          <span className="text-[11px] text-red-600 dark:text-red-400 font-medium">未対応</span>
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {!a.acknowledged && !a.forecast && (
                        <button
                          onClick={() => acknowledge(a.id)}
                          className="text-[11px] text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
                        >
                          対応済みにする
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {activeTab === "history" && (
        <div className="border border-border rounded-lg bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="text-[11px] text-muted-foreground">
                <th className="text-left px-4 py-2.5 font-medium">デバイス</th>
                <th className="text-left px-4 py-2.5 font-medium">チャンネル</th>
                <th className="text-left px-4 py-2.5 font-medium">種別</th>
                <th className="text-left px-4 py-2.5 font-medium">発生</th>
                <th className="text-left px-4 py-2.5 font-medium">解除</th>
                <th className="text-right px-4 py-2.5 font-medium">継続時間</th>
              </tr>
            </thead>
            <tbody>
              {historyAlerts.map((a) => (
                <tr key={a.id} className="border-t border-border/50 even:bg-muted/20 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 text-sm">{a.device}</td>
                  <td className="px-4 py-3 text-sm">{a.channel}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[11px] font-medium flex items-center gap-0.5 ${
                      a.type === "high" ? "text-red-600 dark:text-red-400" : "text-blue-600 dark:text-blue-400"
                    }`}>
                      {a.type === "high" ? "↑" : "↓"} {a.type === "high" ? "上限超過" : "下限超過"}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{a.triggered}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{a.resolved}</td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-muted-foreground">{a.duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
