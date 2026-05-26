import { useState, useEffect, useMemo } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import type { ChartConfig } from "@/components/ui/chart"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react"
import devicesJson from "../../data/devices.json"
import dev001 from "../../data/readings/dev-001.json"
import dev002 from "../../data/readings/dev-002.json"
import dev003 from "../../data/readings/dev-003.json"
import dev004 from "../../data/readings/dev-004.json"

interface StatRow { channel: string; min: string; max: string; avg: string; std: string }
interface DeviceReadings {
  deviceId: string
  date: string
  stats: StatRow[]
  data: Record<string, number | string>[]
}

const readingsMap: Record<string, DeviceReadings> = {
  "センサー A": dev001 as unknown as DeviceReadings,
  "センサー B": dev002 as unknown as DeviceReadings,
  "センサー C": dev003 as unknown as DeviceReadings,
  "センサー D": dev004 as unknown as DeviceReadings,
}

const ALL_CHANNELS = [
  { key: "temp",      label: "温度",  unit: "°C",  chartIdx: 1 },
  { key: "humidity",  label: "湿度",  unit: "%",   chartIdx: 2 },
  { key: "pressure",  label: "気圧",  unit: "hPa", chartIdx: 3 },
  { key: "co2",       label: "CO₂", unit: "ppm", chartIdx: 5 },
  { key: "windSpeed", label: "風速",  unit: "m/s", chartIdx: 3 },
  { key: "rainfall",  label: "雨量",  unit: "mm",  chartIdx: 4 },
]

const DEVICES = devicesJson.map(d => d.name)
const PAGE_SIZE = 10

const pillClass = (active: boolean) =>
  `text-[11px] px-2.5 py-1 rounded border transition-colors ${
    active
      ? "border-foreground/60 bg-foreground text-background"
      : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/40"
  }`

const chartConfig: ChartConfig = {
  temp:      { label: "温度 (°C)",   color: "var(--chart-1)" },
  humidity:  { label: "湿度 (%)",    color: "var(--chart-2)" },
  pressure:  { label: "気圧 (hPa)", color: "var(--chart-3)" },
  co2:       { label: "CO₂ (ppm)", color: "var(--chart-5)" },
  windSpeed: { label: "風速 (m/s)", color: "var(--chart-3)" },
  rainfall:  { label: "雨量 (mm)",  color: "var(--chart-4)" },
}

export default function DataView() {
  const [activeTab, setActiveTab] = useState<"graph" | "table" | "stats">("graph")
  const [selectedDevice, setSelectedDevice] = useState<string>("センサー A")
  const [selectedChannels, setSelectedChannels] = useState<string[]>(["temp", "humidity"])
  const [selectedPeriod, setSelectedPeriod] = useState<"今日" | "今週" | "今月">("今日")
  const [tablePage, setTablePage] = useState(0)

  const currentReading = readingsMap[selectedDevice]
  const graphData      = currentReading?.data ?? []
  const statsData      = currentReading?.stats ?? []

  const availableKeys = useMemo(
    () => graphData.length > 0 ? Object.keys(graphData[0]).filter(k => k !== "time") : [],
    [graphData]
  )
  const CHANNELS = ALL_CHANNELS.filter(c => availableKeys.includes(c.key))

  useEffect(() => {
    setSelectedChannels(prev => {
      const kept = prev.filter(c => availableKeys.includes(c))
      return kept.length > 0 ? kept : availableKeys.slice(0, 2)
    })
    setTablePage(0)
  }, [selectedDevice, availableKeys])

  function toggleChannel(c: string) {
    setSelectedChannels(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c])
  }

  const totalPages = Math.ceil(graphData.length / PAGE_SIZE)
  const pageRows   = graphData.slice(tablePage * PAGE_SIZE, (tablePage + 1) * PAGE_SIZE)

  const activeGraphChannels = ALL_CHANNELS.filter(c => selectedChannels.includes(c.key) && availableKeys.includes(c.key))

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-base font-semibold">データ閲覧</h2>

      {/* Filter bar */}
      <div className="border border-border rounded-lg bg-card px-4 py-3 space-y-2.5">
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest w-[68px] flex-shrink-0">デバイス</span>
          <div className="relative">
            <select
              value={selectedDevice}
              onChange={e => setSelectedDevice(e.target.value)}
              className="appearance-none text-xs border border-border rounded px-2.5 py-1 pr-7 bg-background focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
            >
              {DEVICES.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest w-[68px] flex-shrink-0">チャンネル</span>
          <div className="flex gap-1.5">
            {CHANNELS.map(c => (
              <button
                key={c.key}
                onClick={() => toggleChannel(c.key)}
                className={`${pillClass(selectedChannels.includes(c.key))} flex items-center gap-1.5`}
              >
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: `var(--chart-${c.chartIdx})` }} />
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest w-[68px] flex-shrink-0">期間</span>
          <div className="flex items-center gap-1.5">
            {(["今日", "今週", "今月"] as const).map(p => (
              <button key={p} onClick={() => setSelectedPeriod(p)} className={pillClass(selectedPeriod === p)}>
                {p}
              </button>
            ))}
            <span className="mx-1 h-3.5 w-px bg-border" />
            <input type="date" defaultValue="2026-05-26" className="text-xs border border-border rounded px-2 py-1 bg-background focus:outline-none focus:ring-1 focus:ring-ring" />
            <span className="text-[11px] text-muted-foreground/60">〜</span>
            <input type="date" defaultValue="2026-05-26" className="text-xs border border-border rounded px-2 py-1 bg-background focus:outline-none focus:ring-1 focus:ring-ring" />
          </div>
        </div>
      </div>

      {/* Tab strip */}
      <div>
        <div className="flex gap-1 border-b border-border">
          {(["graph", "table", "stats"] as const).map(tab => {
            const labels = { graph: "グラフ", table: "テーブル", stats: "統計" }
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`text-xs px-4 py-2 border-b-2 transition-colors -mb-px ${
                  activeTab === tab
                    ? "border-foreground text-foreground font-medium"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {labels[tab]}
              </button>
            )
          })}
        </div>

        <div className="pt-4">
          {activeTab === "graph" && (
            <div className="border border-border rounded-lg p-4 bg-card">
              <div className="flex items-baseline justify-between mb-3">
                <p className="text-[13px] font-medium">{selectedDevice}</p>
                <p className="text-[11px] text-muted-foreground font-mono">{currentReading?.date}  00:00 〜 23:00</p>
              </div>
              <ChartContainer config={chartConfig} className="aspect-auto h-[280px]">
                <LineChart data={graphData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="time" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} interval={3} />
                  <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={40} />
                  <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  {activeGraphChannels.map(c => (
                    <Line key={c.key} type="monotone" dataKey={c.key} stroke={`var(--color-${c.key})`} strokeWidth={1.5} dot={false} />
                  ))}
                </LineChart>
              </ChartContainer>
            </div>
          )}

          {activeTab === "table" && (
            <div className="border border-border rounded-lg bg-card overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr className="text-[11px] text-muted-foreground">
                    <th className="text-left px-4 py-2.5 font-medium">タイムスタンプ</th>
                    {CHANNELS.map(c => (
                      <th key={c.key} className="text-right px-4 py-2.5 font-medium">{c.label} ({c.unit})</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((row, i) => (
                    <tr key={i} className="border-t border-border/50 even:bg-muted/20 hover:bg-muted/40 transition-colors">
                      <td className="px-4 py-2 font-mono text-xs text-muted-foreground">
                        {currentReading?.date} {row["time"]}
                      </td>
                      {CHANNELS.map(c => (
                        <td key={c.key} className="px-4 py-2 text-right tabular-nums font-mono text-xs">
                          {row[c.key] != null ? String(row[c.key]) : "—"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/30">
                <span className="text-xs text-muted-foreground tabular-nums">
                  {tablePage * PAGE_SIZE + 1}–{Math.min((tablePage + 1) * PAGE_SIZE, graphData.length)} / {graphData.length} 件
                </span>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" onClick={() => setTablePage(p => Math.max(0, p - 1))} disabled={tablePage === 0} className="h-7 w-7 p-0">
                    <ChevronLeft size={14} />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setTablePage(p => Math.min(totalPages - 1, p + 1))} disabled={tablePage === totalPages - 1} className="h-7 w-7 p-0">
                    <ChevronRight size={14} />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "stats" && (
            <div className="border border-border rounded-lg bg-card overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr className="text-[11px] text-muted-foreground">
                    <th className="text-left px-4 py-2.5 font-medium">チャンネル</th>
                    <th className="text-right px-4 py-2.5 font-medium">最小</th>
                    <th className="text-right px-4 py-2.5 font-medium">最大</th>
                    <th className="text-right px-4 py-2.5 font-medium">平均</th>
                    <th className="text-right px-4 py-2.5 font-medium">標準偏差</th>
                  </tr>
                </thead>
                <tbody>
                  {statsData.map((row, i) => (
                    <tr key={row.channel} className="border-t border-border/50">
                      <td className="px-4 py-3 font-medium text-sm">
                        <span className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: `var(--chart-${(i % 5) + 1})` }} />
                          {row.channel}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-mono text-xs" style={{ color: "var(--chart-1)" }}>{row.min}</td>
                      <td className="px-4 py-3 text-right tabular-nums font-mono text-xs" style={{ color: "var(--chart-4)" }}>{row.max}</td>
                      <td className="px-4 py-3 text-right tabular-nums font-mono text-xs">{row.avg}</td>
                      <td className="px-4 py-3 text-right tabular-nums font-mono text-xs text-muted-foreground">±{row.std}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
