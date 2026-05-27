import { useState, useMemo } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import type { ChartConfig } from "@/components/ui/chart"
import { ChevronDown } from "lucide-react"
import type { PageId } from "../App"
import devicesData from "../../data/devices.json"
import dev001 from "../../data/readings/dev-001.json"
import dev002 from "../../data/readings/dev-002.json"
import dev003 from "../../data/readings/dev-003.json"
import dev004 from "../../data/readings/dev-004.json"

const chartConfig = {
  temp:     { label: "温度 (°C)", color: "var(--chart-1)" },
  humidity: { label: "湿度 (%)",  color: "var(--chart-2)" },
} satisfies ChartConfig

const statusConfig = {
  online:  { label: "接続中", dot: "bg-green-500", text: "text-green-700 dark:text-green-400",  ping: true  },
  offline: { label: "切断",   dot: "bg-slate-400", text: "text-muted-foreground",               ping: false },
  error:   { label: "エラー", dot: "bg-red-500",   text: "text-red-600 dark:text-red-400",     ping: false },
}

type CardVariant = "default" | "critical" | "warn"

function StatCard({
  label,
  value,
  sub,
  onClick,
  variant = "default",
}: {
  label: string
  value: React.ReactNode
  sub: React.ReactNode
  onClick?: () => void
  variant?: CardVariant
}) {
  const styles: Record<CardVariant, { wrap: string; label: string; sub: string; badge?: React.ReactNode }> = {
    default: {
      wrap: "border-border bg-card" + (onClick ? " cursor-pointer hover:bg-muted/30" : ""),
      label: "text-muted-foreground",
      sub: "text-muted-foreground",
    },
    critical: {
      wrap: "border-red-200 dark:border-red-900 border-l-[3px] border-l-red-500 bg-red-500/[0.03] dark:bg-red-950/20 cursor-pointer hover:bg-red-500/[0.07]",
      label: "text-red-700/60 dark:text-red-400/50",
      sub: "text-red-500/60",
      badge: (
        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
          </span>
          <span className="text-[9px] font-medium text-red-500">緊急</span>
        </div>
      ),
    },
    warn: {
      wrap: "border-amber-200 dark:border-amber-900 border-l-[3px] border-l-amber-400 bg-amber-400/[0.03] dark:bg-amber-950/20 cursor-pointer hover:bg-amber-400/[0.07]",
      label: "text-amber-700/60 dark:text-amber-400/50",
      sub: "text-amber-600/60 dark:text-amber-500/60",
      badge: (
        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
          <span className="text-[9px] font-medium text-amber-500">注意</span>
        </div>
      ),
    },
  }

  const s = styles[variant]
  return (
    <div
      className={`border rounded-lg p-4 relative overflow-hidden transition-colors ${s.wrap}`}
      onClick={onClick}
    >
      {s.badge}
      <p className={`text-[11px] font-medium mb-2 ${s.label}`}>{label}</p>
      <p className="text-[28px] font-semibold leading-none mb-2 tabular-nums">{value}</p>
      <p className={`text-[11px] ${s.sub}`}>{sub}</p>
    </div>
  )
}

// Today's actual data only (dev001 is multi-day; filter to 2026-05-26 actual rows)
const todayChartData = (dev001.data as { datetime?: string; time?: string; temp?: number; humidity?: number }[])
  .filter(d => typeof d.datetime === "string" && d.datetime.startsWith("2026-05-26") && d.temp != null)
  .map(d => ({ time: d.datetime!.split(" ")[1], temp: d.temp, humidity: d.humidity }))

const todayTemps = todayChartData.map(d => d.temp).filter((t): t is number => t != null)
const todayMinTemp = todayTemps.length > 0 ? Math.min(...todayTemps) : null
const todayMaxTemp = todayTemps.length > 0 ? Math.max(...todayTemps) : null

// ── Temperature monitor ───────────────────────────────────────────────────────
type ReadingRow = Record<string, unknown>
interface StatRow { channel: string; min: string; max: string; avg: string }
interface Readings { multiDay?: boolean; forecastKeys?: string[]; stats: StatRow[]; data: ReadingRow[] }

const tempReadingsMap: Record<string, Readings> = {
  "センサー A": dev001 as unknown as Readings,
  "センサー B": dev002 as unknown as Readings,
  "センサー C": dev003 as unknown as Readings,
  "センサー D": dev004 as unknown as Readings,
}
const TEMP_DEVICE_NAMES = Object.keys(tempReadingsMap)

const tempChartConfig = {
  temp: { label: "温度 (°C)", color: "var(--chart-1)" },
} satisfies ChartConfig

function getTodayTemp(name: string): { time: string; temp: number }[] {
  const r = tempReadingsMap[name]
  if (!r) return []
  const rows = r.data
  if (r.multiDay) {
    return rows
      .filter(d => typeof d.datetime === "string" && String(d.datetime).startsWith("2026-05-26") && d.temp != null)
      .map(d => ({ time: String(d.datetime).split(" ")[1], temp: Number(d.temp) }))
  }
  return rows
    .filter(d => d.temp != null)
    .map(d => ({ time: String(d.time ?? ""), temp: Number(d.temp) }))
}

export default function Dashboard({ onNavigate }: { onNavigate: (page: PageId) => void }) {
  const onlineCount  = devicesData.filter(d => d.status === "online").length
  const offlineCount = devicesData.filter(d => d.status === "offline").length
  const errorCount   = devicesData.filter(d => d.status === "error").length

  const [cardDevices, setCardDevices] = useState(["センサー A", "センサー B", "センサー C", "センサー D"])
  const cardData = useMemo(() => cardDevices.map(name => getTodayTemp(name)), [cardDevices])

  return (
    <div className="p-6 space-y-5">
      <h2 className="text-[15px] font-semibold tracking-tight">ダッシュボード</h2>

      <div className="grid grid-cols-5 gap-4">
        <StatCard
          label="総デバイス数"
          value={devicesData.length}
          sub={
            <>
              接続中 <span className="text-green-600 dark:text-green-400 font-medium">{onlineCount}</span>
              {" / "}切断中 <span className="text-red-500 font-medium">{offlineCount}</span>
              {" / "}エラー <span className="text-red-600 dark:text-red-400 font-medium">{errorCount}</span>
            </>
          }
        />
        <StatCard
          label="アクティブアラート"
          value={<span className="text-red-500 font-bold">3</span>}
          sub="確認 →"
          onClick={() => onNavigate("alerts")}
          variant="critical"
        />
        <StatCard
          label="予測注意"
          value={<span className="text-amber-500 font-bold">2</span>}
          sub="閾値超えの見込み (3h以内)"
          onClick={() => onNavigate("alerts")}
          variant="warn"
        />
        <StatCard
          label="最終受信時刻"
          value="14:32:05"
          sub="2026-05-26 — DEV-001"
        />

        {/* Min / Max temperature card */}
        <div className="border border-border rounded-lg p-4 bg-card relative overflow-hidden">
          <p className="text-[11px] font-medium mb-3 text-muted-foreground">
            直近24h 気温
          </p>
          <div className="flex items-center gap-2">
            <div className="flex-1 text-center">
              <p className="text-[10px] text-blue-500/70 mb-1 font-medium">最低</p>
              <p className="text-[24px] font-semibold tabular-nums text-blue-500 leading-none">
                {todayMinTemp != null ? todayMinTemp.toFixed(1) : "—"}
              </p>
              <p className="text-[11px] text-blue-400/60 mt-0.5">°C</p>
            </div>
            <div className="w-px h-10 bg-border" />
            <div className="flex-1 text-center">
              <p className="text-[10px] text-red-500/70 mb-1 font-medium">最高</p>
              <p className="text-[24px] font-semibold tabular-nums text-red-500 leading-none">
                {todayMaxTemp != null ? todayMaxTemp.toFixed(1) : "—"}
              </p>
              <p className="text-[11px] text-red-400/60 mt-0.5">°C</p>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground mt-3">センサー A · 本日実測</p>
        </div>
      </div>

      <div className="flex gap-4 items-start">
        <div className="flex-1 border border-border rounded-lg p-4 bg-card">
          <p className="text-[13px] font-medium mb-1">全体トレンド</p>
          <p className="text-xs text-muted-foreground mb-3">直近 24h — センサー A (1F 機械室)</p>
          <ChartContainer config={chartConfig} className="aspect-auto h-[200px]">
            <LineChart data={todayChartData}>
              <CartesianGrid strokeDasharray="4 6" vertical={false} stroke="var(--border)" strokeOpacity={0.5} />
              <XAxis dataKey="time" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} interval={11} />
              <YAxis yAxisId="left"  tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={30} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={30} />
              <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Line yAxisId="left"  type="monotone" dataKey="temp"     stroke="var(--color-temp)"     strokeWidth={2} dot={false} />
              <Line yAxisId="right" type="monotone" dataKey="humidity" stroke="var(--color-humidity)" strokeWidth={2} dot={false} />
            </LineChart>
          </ChartContainer>
        </div>

        <div className="flex-1 border border-border rounded-lg p-4 bg-card">
          <p className="text-[13px] font-medium mb-3">デバイスステータス一覧</p>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] text-muted-foreground border-b border-border">
                <th className="text-left pb-2 font-medium">ID</th>
                <th className="text-left pb-2 font-medium">名称</th>
                <th className="text-left pb-2 font-medium">状態</th>
                <th className="text-left pb-2 font-medium">最終通信</th>
                <th className="text-right pb-2 font-medium">CH</th>
              </tr>
            </thead>
            <tbody>
              {devicesData.map((d) => {
                const sc = statusConfig[d.status as keyof typeof statusConfig]
                return (
                  <tr
                    key={d.id}
                    className="border-b border-border/50 hover:bg-muted/40 cursor-pointer transition-colors"
                    onClick={() => onNavigate("devices")}
                  >
                    <td className="py-2 font-mono text-[11px] text-muted-foreground">{d.id}</td>
                    <td className="py-2 text-sm">{d.name}</td>
                    <td className="py-2">
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
                    <td className="py-2 text-xs text-muted-foreground">{d.lastCommRelative}</td>
                    <td className="py-2 text-xs text-right text-muted-foreground">{d.channels.length}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Temperature monitor ────────────────────────────────────────── */}
      <div className="flex gap-3 items-start">
          {[0, 1].map(col => (
            <div key={col} className="flex-1 flex flex-col gap-3">
              {cardDevices.filter((_, i) => i % 2 === col).map((deviceName, row) => {
                const i = col + row * 2
                const data = cardData[i]
                const lastTemp = data.length > 0 ? data[data.length - 1].temp : null
                return (
                  <div key={i} className="border border-border rounded-lg p-4 bg-card">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: "var(--chart-1)" }} />
                        <span className="text-[13px] font-medium">温度</span>
                        {lastTemp != null && (
                          <span className="font-mono text-sm font-semibold tabular-nums">{lastTemp}°C</span>
                        )}
                      </div>
                      <div className="relative">
                        <select
                          value={deviceName}
                          onChange={e => setCardDevices(prev => prev.map((d, j) => j === i ? e.target.value : d))}
                          className="appearance-none text-xs border border-border rounded px-2.5 py-1 pr-7 bg-background focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
                        >
                          {TEMP_DEVICE_NAMES.map(name => (
                            <option key={name} value={name}>{name}</option>
                          ))}
                        </select>
                        <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" />
                      </div>
                    </div>
                    {data.length > 0 ? (
                      <ChartContainer config={tempChartConfig} className="h-[140px] aspect-auto">
                        <LineChart data={data}>
                          <CartesianGrid strokeDasharray="4 6" vertical={false} stroke="var(--border)" strokeOpacity={0.5} />
                          <XAxis dataKey="time" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} interval={11} />
                          <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={30} />
                          <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
                          <Line type="monotone" dataKey="temp" stroke="var(--color-temp)" strokeWidth={1.5} dot={false} />
                        </LineChart>
                      </ChartContainer>
                    ) : (
                      <div className="h-[140px] flex items-center justify-center text-[11px] text-muted-foreground">
                        データなし
                      </div>
                    )}
                    {/* Per-channel stats footer — row count varies by device */}
                    {(() => {
                      const stats = tempReadingsMap[deviceName]?.stats ?? []
                      const device = devicesData.find(d => d.name === deviceName)
                      const hasForecast = (tempReadingsMap[deviceName]?.forecastKeys?.length ?? 0) > 0
                      return (
                        <div className="mt-3 pt-3 border-t border-border/50 space-y-1">
                          {stats.map(s => (
                            <div key={s.channel} className="flex items-center justify-between text-[11px]">
                              <span className="text-muted-foreground truncate">{s.channel}</span>
                              <span className="font-mono tabular-nums text-muted-foreground/80 flex-shrink-0 ml-2">
                                {s.min} – {s.max}
                              </span>
                            </div>
                          ))}
                          <div className="flex items-center justify-between pt-0.5">
                            <span className="text-[10px] text-muted-foreground/60">{device?.location}</span>
                            {hasForecast && (
                              <span className="text-[9px] font-mono border border-border/60 rounded px-1 text-muted-foreground">予測あり</span>
                            )}
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
    </div>
  )
}
