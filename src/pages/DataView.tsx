import { useState, useEffect, useMemo } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ReferenceArea } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import type { ChartConfig } from "@/components/ui/chart"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react"
import devicesJson from "../../data/devices.json"
import dev001 from "../../data/readings/dev-001.json"
import dev002 from "../../data/readings/dev-002.json"
import dev003 from "../../data/readings/dev-003.json"
import dev004 from "../../data/readings/dev-004.json"
import dev005 from "../../data/readings/dev-005.json"
import dev006 from "../../data/readings/dev-006.json"
import dev007 from "../../data/readings/dev-007.json"
import dev008 from "../../data/readings/dev-008.json"
import dev009 from "../../data/readings/dev-009.json"
import dev010 from "../../data/readings/dev-010.json"

interface StatRow { channel: string; min: string; max: string; avg: string; std: string }
interface DeviceReadings {
  deviceId: string
  date?: string
  multiDay?: boolean
  lastActual?: string     // "YYYY-MM-DD HH:MM" — where actual data ends
  forecastKeys?: string[] // channel keys that have a forecast variant (e.g. "temp" → "tempF")
  stats: StatRow[]
  data: Record<string, number | string | undefined>[]
}

const readingsMap: Record<string, DeviceReadings> = {
  "センサー A": dev001 as unknown as DeviceReadings,
  "センサー B": dev002 as unknown as DeviceReadings,
  "センサー C": dev003 as unknown as DeviceReadings,
  "センサー D": dev004 as unknown as DeviceReadings,
  "センサー E": dev005 as unknown as DeviceReadings,
  "センサー F": dev006 as unknown as DeviceReadings,
  "センサー G": dev007 as unknown as DeviceReadings,
  "センサー H": dev008 as unknown as DeviceReadings,
  "センサー I": dev009 as unknown as DeviceReadings,
  "センサー J": dev010 as unknown as DeviceReadings,
}

const ALL_CHANNELS = [
  { key: "temp",        label: "温度",     unit: "°C",    chartIdx: 1 },
  { key: "humidity",    label: "湿度",     unit: "%",     chartIdx: 2 },
  { key: "pressure",    label: "気圧",     unit: "hPa",   chartIdx: 3 },
  { key: "co2",         label: "CO₂",    unit: "ppm",   chartIdx: 5 },
  { key: "windSpeed",   label: "風速",     unit: "m/s",   chartIdx: 3 },
  { key: "rainfall",    label: "雨量",     unit: "mm",    chartIdx: 4 },
  { key: "illuminance", label: "照度",     unit: "lux",   chartIdx: 4 },
  { key: "uvIndex",     label: "UV指数",   unit: "",      chartIdx: 5 },
  { key: "flow",        label: "流量",     unit: "L/min", chartIdx: 2 },
  { key: "solarRad",    label: "日射量",   unit: "W/m²",  chartIdx: 4 },
  { key: "occupancy",   label: "在室数",   unit: "人",    chartIdx: 5 },
  { key: "power",       label: "消費電力", unit: "kW",    chartIdx: 3 },
]

const chartConfig: ChartConfig = {
  temp:        { label: "温度 (°C)",     color: "var(--chart-1)" },
  tempF:       { label: "温度 予測",     color: "var(--chart-1)" },
  humidity:    { label: "湿度 (%)",      color: "var(--chart-2)" },
  humidityF:   { label: "湿度 予測",     color: "var(--chart-2)" },
  pressure:    { label: "気圧 (hPa)",   color: "var(--chart-3)" },
  pressureF:   { label: "気圧 予測",    color: "var(--chart-3)" },
  co2:         { label: "CO₂ (ppm)",   color: "var(--chart-5)" },
  co2F:        { label: "CO₂ 予測",    color: "var(--chart-5)" },
  windSpeed:    { label: "風速 (m/s)",    color: "var(--chart-3)" },
  windSpeedF:   { label: "風速 予測",    color: "var(--chart-3)" },
  rainfall:     { label: "雨量 (mm)",    color: "var(--chart-4)" },
  rainfallF:    { label: "雨量 予測",    color: "var(--chart-4)" },
  illuminance:  { label: "照度 (lux)",   color: "var(--chart-4)" },
  illuminanceF: { label: "照度 予測",    color: "var(--chart-4)" },
  uvIndex:      { label: "UV指数",       color: "var(--chart-5)" },
  uvIndexF:     { label: "UV指数 予測",  color: "var(--chart-5)" },
  flow:         { label: "流量 (L/min)", color: "var(--chart-2)" },
  flowF:        { label: "流量 予測",    color: "var(--chart-2)" },
  solarRad:     { label: "日射量 (W/m²)", color: "var(--chart-4)" },
  solarRadF:    { label: "日射量 予測",  color: "var(--chart-4)" },
  occupancy:    { label: "在室数 (人)",  color: "var(--chart-5)" },
  occupancyF:   { label: "在室数 予測",  color: "var(--chart-5)" },
  power:        { label: "消費電力 (kW)", color: "var(--chart-3)" },
  powerF:       { label: "消費電力 予測", color: "var(--chart-3)" },
}

const PAGE_SIZE = 10
const TODAY     = "2026-05-26"

const pillClass = (active: boolean) =>
  `text-[11px] px-2.5 py-1 rounded border transition-colors ${
    active
      ? "border-foreground/60 bg-foreground text-background"
      : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/40"
  }`

const ALL_TAGS = Array.from(
  new Set(devicesJson.flatMap(d => (d as typeof d & { tags?: string[] }).tags ?? []))
)

export default function DataView() {
  const [activeTab,       setActiveTab]       = useState<"graph" | "table" | "stats">("graph")
  const [selectedTag,     setSelectedTag]     = useState<string | null>(null)
  const [selectedDevice,  setSelectedDevice]  = useState<string>("センサー A")
  const [selectedPeriod,  setSelectedPeriod]  = useState<"今日" | "今週" | "今月" | null>("今日")
  const [dateFrom,        setDateFrom]        = useState(TODAY)
  const [dateTo,          setDateTo]          = useState(TODAY)
  const [tablePage,       setTablePage]       = useState(0)

  const filteredDevices = useMemo(() => {
    if (!selectedTag) return devicesJson.map(d => d.name)
    return devicesJson
      .filter(d => ((d as typeof d & { tags?: string[] }).tags ?? []).includes(selectedTag))
      .map(d => d.name)
  }, [selectedTag])

  useEffect(() => {
    if (!filteredDevices.includes(selectedDevice)) {
      setSelectedDevice(filteredDevices[0] ?? "センサー A")
    }
  }, [filteredDevices, selectedDevice])

  const currentDevice  = devicesJson.find(d => d.name === selectedDevice)
  const currentTags    = (currentDevice as typeof currentDevice & { tags?: string[] })?.tags ?? []
  const currentReading = readingsMap[selectedDevice]
  const isMultiDay     = currentReading?.multiDay ?? false
  const forecastKeys   = currentReading?.forecastKeys ?? []

  // ── Period picker: sync pill → date inputs ───────────────────────────────
  function applyPeriod(p: "今日" | "今週" | "今月") {
    setSelectedPeriod(p)
    if (p === "今日") {
      setDateFrom(TODAY)
      setDateTo(TODAY)
    } else if (p === "今週") {
      setDateFrom("2026-05-20")
      setDateTo(TODAY)
    } else {
      setDateFrom("2026-05-01")
      setDateTo(TODAY)
    }
  }

  function handleDateFrom(v: string) { setDateFrom(v); setSelectedPeriod(null) }
  function handleDateTo(v: string)   { setDateTo(v);   setSelectedPeriod(null) }

  // ── Data filtering ────────────────────────────────────────────────────────
  const filteredGraphData = useMemo(() => {
    const raw = currentReading?.data ?? []
    if (!isMultiDay || !raw.length) return raw

    return raw.filter(d => {
      const date = String(d.datetime ?? "").split(" ")[0]
      return date >= dateFrom && date <= dateTo
    })
  }, [currentReading, isMultiDay, dateFrom, dateTo])

  const statsData = currentReading?.stats ?? []

  // Keys present in the data (excluding time/datetime and *F forecast keys)
  const availableKeys = useMemo(() => {
    const data = filteredGraphData
    if (!data.length) return []
    // Sample 20 points spread across the dataset to catch all keys
    const step = Math.max(1, Math.floor(data.length / 20))
    const keys = new Set<string>()
    for (let i = 0; i < data.length; i += step) {
      Object.keys(data[i] as Record<string, unknown>).forEach(k => keys.add(k))
    }
    return Array.from(keys).filter(k => k !== "time" && k !== "datetime" && !k.endsWith("F"))
  }, [filteredGraphData])

  const CHANNELS = ALL_CHANNELS.filter(c => availableKeys.includes(c.key))

  // ── X-axis ticks and formatter ────────────────────────────────────────────
  const xKey = isMultiDay ? "datetime" : "time"

  const xAxisTicks = useMemo<string[] | undefined>(() => {
    if (!isMultiDay || !filteredGraphData.length) return undefined

    const isSingleDay = dateFrom === dateTo
    return filteredGraphData
      .map(d => String(d.datetime ?? ""))
      .filter(dt => {
        const time = dt.split(" ")[1] ?? ""
        const [hh, mm] = time.split(":")
        if (isSingleDay) return mm === "00" && parseInt(hh) % 2 === 0
        return time === "00:00"
      })
  }, [filteredGraphData, isMultiDay, dateFrom, dateTo])

  function xTickFormatter(v: string) {
    if (!isMultiDay) return v
    const [date, time] = v.split(" ")
    if (!date || !time) return ""
    if (dateFrom === dateTo) return time
    const [, m, d] = date.split("-")
    return `${parseInt(m)}/${parseInt(d)}`
  }

  // Forecast zone boundaries (for ReferenceArea)
  const forecastStart = currentReading?.lastActual
  const forecastEnd   = isMultiDay && filteredGraphData.length > 0
    ? String(filteredGraphData[filteredGraphData.length - 1].datetime)
    : undefined

  useEffect(() => { setTablePage(0) }, [selectedDevice, dateFrom, dateTo])

  const totalPages = Math.ceil(filteredGraphData.length / PAGE_SIZE)
  const pageRows   = filteredGraphData.slice(tablePage * PAGE_SIZE, (tablePage + 1) * PAGE_SIZE)

  // ── Period label for graph header ─────────────────────────────────────────
  const periodLabel = dateFrom === dateTo
    ? dateFrom
    : `${dateFrom} 〜 ${dateTo}`

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-[15px] font-semibold tracking-tight">データ閲覧</h2>

      {/* Filter bar */}
      <div className="border border-border rounded-lg bg-card px-4 py-3 space-y-2.5">

        {/* Group tag filter */}
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-muted-foreground font-medium w-[68px] flex-shrink-0">グループ</span>
          <div className="flex gap-1.5 flex-wrap">
            <button onClick={() => setSelectedTag(null)} className={pillClass(selectedTag === null)}>
              すべて
            </button>
            {ALL_TAGS.map(tag => (
              <button
                key={tag}
                onClick={() => setSelectedTag(prev => prev === tag ? null : tag)}
                className={pillClass(selectedTag === tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Device selector */}
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-muted-foreground font-medium w-[68px] flex-shrink-0">デバイス</span>
          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                value={selectedDevice}
                onChange={e => setSelectedDevice(e.target.value)}
                className="appearance-none text-xs border border-border rounded px-2.5 py-1 pr-7 bg-background focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
              >
                {filteredDevices.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" />
            </div>
            <div className="flex gap-1">
              {currentTags.map(tag => (
                <span
                  key={tag}
                  className="text-[10px] px-1.5 py-0.5 rounded border border-border/60 bg-muted/60 text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Period */}
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-muted-foreground font-medium w-[68px] flex-shrink-0">期間</span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {(["今日", "今週", "今月"] as const).map(p => (
              <button
                key={p}
                onClick={() => applyPeriod(p)}
                className={pillClass(selectedPeriod === p)}
              >
                {p}
              </button>
            ))}
            <span className="mx-1 h-3.5 w-px bg-border" />
            <input
              type="date"
              value={dateFrom}
              onChange={e => handleDateFrom(e.target.value)}
              className="text-xs border border-border rounded px-2 py-1 bg-background focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <span className="text-[11px] text-muted-foreground/60">〜</span>
            <input
              type="date"
              value={dateTo}
              onChange={e => handleDateTo(e.target.value)}
              className="text-xs border border-border rounded px-2 py-1 bg-background focus:outline-none focus:ring-1 focus:ring-ring"
            />
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
          {/* ── Graph tab ──────────────────────────────────────────────────── */}
          {activeTab === "graph" && (
            <div className="space-y-3">
              <div className="flex items-baseline justify-between">
                <p className="text-[13px] font-medium">{selectedDevice}</p>
                <div className="flex items-center gap-3">
                  {forecastKeys.length > 0 && dateFrom === dateTo && (
                    <div className="flex items-center gap-1.5">
                      <span className="w-5 border-t border-dashed border-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground">予測</span>
                    </div>
                  )}
                  <p className="text-[11px] text-muted-foreground font-mono">{periodLabel}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                {CHANNELS.map(c => {
                  const hasForecast = forecastKeys.includes(c.key) && dateFrom === dateTo
                  const fKey = `${c.key}F`
                  const cfg: ChartConfig = {
                    [c.key]: chartConfig[c.key as keyof typeof chartConfig],
                    ...(hasForecast ? { [fKey]: chartConfig[fKey as keyof typeof chartConfig] } : {}),
                  }

                  return (
                    <div key={c.key} className="border border-border rounded-lg p-4 bg-card">
                      <div className="flex items-center gap-2 mb-3">
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: `var(--chart-${c.chartIdx})` }}
                        />
                        <span className="text-[13px] font-medium">{c.label}</span>
                        <span className="text-[11px] text-muted-foreground font-mono">{c.unit}</span>
                      </div>
                      <ChartContainer config={cfg} className="aspect-auto h-[160px]">
                        <LineChart data={filteredGraphData}>
                          <CartesianGrid strokeDasharray="4 6" vertical={false} stroke="var(--border)" strokeOpacity={0.5} />
                          <XAxis
                            dataKey={xKey}
                            tick={{ fontSize: 10 }}
                            tickLine={false}
                            axisLine={false}
                            ticks={xAxisTicks}
                            tickFormatter={xTickFormatter}
                          />
                          <YAxis
                            tick={{ fontSize: 10 }}
                            tickLine={false}
                            axisLine={false}
                            width={44}
                          />
                          <ChartTooltip content={<ChartTooltipContent indicator="line" />} />

                          {/* Forecast shading */}
                          {hasForecast && forecastStart && forecastEnd && (
                            <ReferenceArea
                              x1={forecastStart}
                              x2={forecastEnd}
                              fill="var(--muted)"
                              fillOpacity={0.35}
                            />
                          )}

                          {/* Actual data line */}
                          <Line
                            type="monotone"
                            dataKey={c.key}
                            stroke={`var(--color-${c.key})`}
                            strokeWidth={1.5}
                            dot={false}
                            connectNulls={false}
                          />

                          {/* Forecast line (dashed) */}
                          {hasForecast && (
                            <Line
                              type="monotone"
                              dataKey={fKey}
                              stroke={`var(--color-${c.key})`}
                              strokeWidth={1.5}
                              strokeDasharray="5 3"
                              dot={false}
                              connectNulls
                            />
                          )}
                        </LineChart>
                      </ChartContainer>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── Table tab ──────────────────────────────────────────────────── */}
          {activeTab === "table" && (
            <div className="border border-border rounded-lg bg-card overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr className="text-[11px] text-muted-foreground">
                    <th className="text-left px-4 py-2.5 font-medium">タイムスタンプ</th>
                    {CHANNELS.map(c => (
                      <th key={c.key} className="text-right px-4 py-2.5 font-medium">
                        {c.label}{c.unit ? ` (${c.unit})` : ""}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((row, i) => {
                    const isPredicted = CHANNELS.every(c => row[c.key] == null) && CHANNELS.some(c => row[`${c.key}F`] != null)
                    return (
                      <tr
                        key={i}
                        className={`border-t border-border/50 even:bg-muted/20 hover:bg-muted/40 transition-colors ${isPredicted ? "opacity-60" : ""}`}
                      >
                        <td className="px-4 py-2 font-mono text-xs text-muted-foreground">
                          {isMultiDay
                            ? String(row.datetime ?? "")
                            : `${currentReading?.date} ${row.time}`
                          }
                          {isPredicted && (
                            <span className="ml-1.5 text-[9px] border border-border/60 rounded px-1 text-muted-foreground">予測</span>
                          )}
                        </td>
                        {CHANNELS.map(c => {
                          const actual = row[c.key]
                          const forecast = row[`${c.key}F`]
                          const display = actual != null ? actual : forecast
                          return (
                            <td key={c.key} className="px-4 py-2 text-right tabular-nums font-mono text-xs">
                              {display != null ? String(display) : "—"}
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/30">
                <span className="text-xs text-muted-foreground tabular-nums">
                  {tablePage * PAGE_SIZE + 1}–{Math.min((tablePage + 1) * PAGE_SIZE, filteredGraphData.length)} / {filteredGraphData.length} 件
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

          {/* ── Stats tab ──────────────────────────────────────────────────── */}
          {activeTab === "stats" && (
            <div className="border border-border rounded-lg bg-card overflow-hidden">
              {isMultiDay && (
                <div className="px-4 py-2 border-b border-border bg-muted/30">
                  <span className="text-[10px] text-muted-foreground">統計: {TODAY} 実測値 (00:00〜14:30)</span>
                </div>
              )}
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
