import { useState } from "react"
import { CheckCircle, ExternalLink } from "lucide-react"
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

interface Rule {
  id: number
  device: string
  channel: string
  low: string
  high: string
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

const rules: Rule[] = [
  { id: 1, device: "全デバイス", channel: "温度", low: "5.0°C", high: "35.0°C" },
  { id: 2, device: "全デバイス", channel: "湿度", low: "20%", high: "80%" },
  { id: 3, device: "全デバイス", channel: "気圧", low: "1000.0hPa", high: "1030.0hPa" },
  { id: 4, device: "センサー D", channel: "温度", low: "0.0°C", high: "30.0°C" },
]

export default function Alerts({ onNavigate }: { onNavigate: (page: PageId) => void }) {
  const [activeTab, setActiveTab] = useState<"active" | "history">("active")
  const [alerts, setAlerts] = useState<ActiveAlert[]>(initialAlerts)

  const unacked = alerts.filter((a) => !a.acknowledged).length

  function acknowledge(id: number) {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, acknowledged: true } : a)))
  }

  return (
    <div className="p-6 space-y-5">
      <h2 className="text-base font-semibold">アラート</h2>

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
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-500 text-white font-medium leading-none">
              {unacked}
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
                    <td className="px-4 py-3 text-sm">{a.channel}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[11px] font-medium flex items-center gap-0.5 ${
                        a.type === "high" ? "text-red-600 dark:text-red-400" : "text-blue-600 dark:text-blue-400"
                      }`}>
                        {a.type === "high" ? "↑" : "↓"} {a.type === "high" ? "上限超過" : "下限超過"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs font-semibold text-red-600 dark:text-red-400">
                      {a.value}
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
                      ) : (
                        <span className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0" />
                          <span className="text-[11px] text-orange-600 dark:text-orange-400 font-medium">未対応</span>
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {!a.acknowledged && (
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

          {/* Threshold rules shortcut */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">
                閾値ルール一覧
              </p>
              <button
                onClick={() => onNavigate("settings")}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
              >
                設定で編集 <ExternalLink size={11} />
              </button>
            </div>
            <div className="border border-border rounded-lg bg-card overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr className="text-[11px] text-muted-foreground">
                    <th className="text-left px-4 py-2.5 font-medium">デバイス</th>
                    <th className="text-left px-4 py-2.5 font-medium">チャンネル</th>
                    <th className="text-right px-4 py-2.5 font-medium">下限</th>
                    <th className="text-right px-4 py-2.5 font-medium">上限</th>
                  </tr>
                </thead>
                <tbody>
                  {rules.map((r) => (
                    <tr key={r.id} className="border-t border-border/50">
                      <td className="px-4 py-2.5">{r.device}</td>
                      <td className="px-4 py-2.5">{r.channel}</td>
                      <td className="px-4 py-2.5 text-right font-mono text-xs text-blue-600 dark:text-blue-400">
                        {r.low}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-xs text-red-600 dark:text-red-400">
                        {r.high}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
