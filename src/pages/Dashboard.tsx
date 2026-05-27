import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import type { ChartConfig } from "@/components/ui/chart"
import type { PageId } from "../App"
import devicesData from "../../data/devices.json"
import dev001 from "../../data/readings/dev-001.json"

const chartConfig = {
  temp:     { label: "温度 (°C)", color: "var(--chart-1)" },
  humidity: { label: "湿度 (%)",  color: "var(--chart-2)" },
} satisfies ChartConfig

const statusConfig = {
  online:  { label: "接続中", dot: "bg-green-500", text: "text-green-700 dark:text-green-400",  ping: true  },
  offline: { label: "切断",   dot: "bg-slate-400", text: "text-muted-foreground",               ping: false },
  error:   { label: "エラー", dot: "bg-red-500",   text: "text-red-600 dark:text-red-400",     ping: false },
}

function StatCard({
  label,
  value,
  sub,
  onClick,
  critical = false,
}: {
  label: string
  value: React.ReactNode
  sub: React.ReactNode
  onClick?: () => void
  critical?: boolean
}) {
  return (
    <div
      className={`border rounded-lg p-4 relative overflow-hidden transition-colors ${
        critical
          ? "border-red-200 dark:border-red-900 border-l-[3px] border-l-red-500 bg-red-500/[0.03] dark:bg-red-950/20 cursor-pointer hover:bg-red-500/[0.07]"
          : "border-border bg-card" + (onClick ? " cursor-pointer hover:bg-muted/30" : "")
      }`}
      onClick={onClick}
    >
      {critical && (
        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
          </span>
          <span className="text-[9px] font-bold text-red-500 uppercase tracking-widest">緊急</span>
        </div>
      )}
      <p className={`text-[10px] font-medium mb-2 uppercase tracking-widest ${critical ? "text-red-700/60 dark:text-red-400/50" : "text-muted-foreground"}`}>
        {label}
      </p>
      <p className="text-[28px] font-semibold leading-none mb-2 tabular-nums">{value}</p>
      <p className={`text-[11px] ${critical ? "text-red-500/60" : "text-muted-foreground"}`}>{sub}</p>
    </div>
  )
}

// Today's actual data only (dev001 is multi-day; filter to 2026-05-26 actual rows)
const todayChartData = (dev001.data as { datetime?: string; time?: string; temp?: number; humidity?: number }[])
  .filter(d => typeof d.datetime === "string" && d.datetime.startsWith("2026-05-26") && d.temp != null)
  .map(d => ({ time: d.datetime!.split(" ")[1], temp: d.temp, humidity: d.humidity }))

export default function Dashboard({ onNavigate }: { onNavigate: (page: PageId) => void }) {
  const onlineCount  = devicesData.filter(d => d.status === "online").length
  const offlineCount = devicesData.filter(d => d.status === "offline").length
  const errorCount   = devicesData.filter(d => d.status === "error").length

  return (
    <div className="p-6 space-y-5">
      <h2 className="text-base font-semibold">ダッシュボード</h2>

      <div className="grid grid-cols-3 gap-4">
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
          sub="クリックでアラートページへ →"
          onClick={() => onNavigate("alerts")}
          critical
        />
        <StatCard
          label="最終受信時刻"
          value="14:32:05"
          sub="2026-05-26 — DEV-001"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="border border-border rounded-lg p-4 bg-card">
          <p className="text-sm font-medium mb-1">全体トレンド</p>
          <p className="text-xs text-muted-foreground mb-3">直近 24h — センサー A (1F 機械室)</p>
          <ChartContainer config={chartConfig} className="aspect-auto h-[200px]">
            <LineChart data={todayChartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis dataKey="time" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} interval={11} />
              <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={30} />
              <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Line type="monotone" dataKey="temp"     stroke="var(--color-temp)"     strokeWidth={1.5} dot={false} />
              <Line type="monotone" dataKey="humidity" stroke="var(--color-humidity)" strokeWidth={1.5} dot={false} />
            </LineChart>
          </ChartContainer>
        </div>

        <div className="border border-border rounded-lg p-4 bg-card">
          <p className="text-sm font-medium mb-3">デバイスステータス一覧</p>
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
    </div>
  )
}
