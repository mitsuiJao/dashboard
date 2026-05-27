/**
 * Dummy data generator for DataLogger
 * Run: node data/generate.mjs
 *
 * DEV-001: 30-day multi-day data (2026-04-27 〜 2026-05-26)
 *          actual data ends at 14:30; 14:30〜23:50 are forecast (keys: tempF, humidityF, pressureF, co2F)
 * DEV-002〜010: single-day (2026-05-26), 10-minute intervals (144 pts)
 */

import { writeFileSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const __dir = dirname(fileURLToPath(import.meta.url))

// ─── Pseudo-random (LCG, seeded for reproducibility) ────────────────────────

let seed = 42
function reSeed(n) { seed = n >>> 0 }
function rand() {
  seed = (seed * 1664525 + 1013904223) & 0xffffffff
  return (seed >>> 0) / 0xffffffff
}
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)) }

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Generate N 10-minute data points with smooth random walk + sinusoidal daily cycle.
 * channelDefs: { key: { base, min, max, noise, cycle?: { peakHour (0-1), amp }, dec } }
 * Returns array of objects with { time | datetime, ...channels }.
 */
function makeSeries(channelDefs, { N = 144, datetimePrefix = null, anomalies = [] } = {}) {
  const state = {}
  for (const [k, d] of Object.entries(channelDefs)) state[k] = d.base

  return Array.from({ length: N }, (_, i) => {
    const hh = Math.floor(i / 6)
    const mm = (i % 6) * 10
    const timeStr = `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`
    const t = i / 144

    const point = datetimePrefix
      ? { datetime: `${datetimePrefix} ${timeStr}` }
      : { time: timeStr }

    for (const [k, d] of Object.entries(channelDefs)) {
      let target = d.base
      if (d.cycle) {
        const phase = (t - d.cycle.peakHour) * 2 * Math.PI
        target = d.base + d.cycle.amp * Math.sin(phase)
      }
      const noise = (rand() - 0.5) * 2 * (d.noise ?? 0.3)
      state[k] = clamp(state[k] + (target - state[k]) * 0.12 + noise, d.min, d.max)
      point[k] = +state[k].toFixed(d.dec ?? 1)
    }

    for (const a of anomalies) {
      if (i === a.at) point[a.key] = a.value
    }

    return point
  })
}

function computeStats(data, channels) {
  return channels.map(({ key, label }) => {
    const vals = data.map(d => d[key]).filter(v => typeof v === "number")
    if (!vals.length) return { channel: label, min: "—", max: "—", avg: "—", std: "—" }
    const min = Math.min(...vals)
    const max = Math.max(...vals)
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length
    const std = Math.sqrt(vals.map(v => (v - avg) ** 2).reduce((a, b) => a + b, 0) / vals.length)
    return {
      channel: label,
      min: String(+min.toFixed(1)),
      max: String(+max.toFixed(1)),
      avg: String(+avg.toFixed(1)),
      std: String(+std.toFixed(1)),
    }
  })
}

// ─── DEV-001: multi-day (30 days) + forecast ──────────────────────────────────

const TODAY         = "2026-05-26"
const LAST_ACTUAL   = "14:30"               // last real data timestamp
const LAST_IDX      = 14 * 6 + 3           // = 87  (14:30 in 10-min index)
const FORECAST_CH   = ["temp", "humidity", "pressure", "co2"]
const FORECAST_N    = 18                    // recent samples used for linear regression (= 3 h)

/** Returns the slope of the least-squares line through ys[0..n-1]. */
function linReg(ys) {
  const n = ys.length
  const meanX = (n - 1) / 2
  const meanY = ys.reduce((a, b) => a + b, 0) / n
  const num = ys.reduce((s, y, i) => s + (i - meanX) * (y - meanY), 0)
  const den = ys.reduce((s, _, i) => s + (i - meanX) ** 2, 0)
  return den === 0 ? 0 : num / den
}

function generateDev001() {
  reSeed(1001)

  // Build date list 2026-04-27 〜 2026-05-26
  const dates = []
  let cur = new Date("2026-04-27T00:00:00Z")
  const end = new Date(TODAY + "T00:00:00Z")
  while (cur <= end) {
    dates.push(cur.toISOString().split("T")[0])
    cur.setUTCDate(cur.getUTCDate() + 1)
  }

  const allData = []

  for (let di = 0; di < dates.length; di++) {
    const dateStr = dates[di]
    const isToday = dateStr === TODAY

    // Day-to-day variation: two overlapping sine waves → looks like week-scale weather
    const dv = Math.sin(di * 0.47) * 2.0 + Math.sin(di * 1.13) * 1.1

    const tempBase  = 24.0 + dv
    const humBase   = clamp(62 - dv * 2, 45, 78)
    const pressBase = 1012.5 + Math.sin(di * 0.25) * 1.8

    const defs = {
      temp:     { base: tempBase,   min: 15,    max: 37,    noise: 0.35, cycle: { peakHour: 14 / 24, amp: 5.0 + Math.abs(dv) * 0.4 }, dec: 1 },
      humidity: { base: humBase,    min: 32,    max: 92,    noise: 1.2,  cycle: { peakHour: 3 / 24,  amp: 11  }, dec: 0 },
      pressure: { base: pressBase,  min: 1006,  max: 1020,  noise: 0.15, cycle: { peakHour: 10 / 24, amp: 1.0 }, dec: 1 },
      co2:      { base: 560,        min: 370,   max: 960,   noise: 18,   cycle: { peakHour: 13 / 24, amp: 190 + dv * 15 }, dec: 0 },
    }

    // Generate all 144 raw values for this day first
    const state = {}
    for (const [k, d] of Object.entries(defs)) state[k] = d.base

    const dayRows = Array.from({ length: 144 }, (_, i) => {
      const hh = Math.floor(i / 6)
      const mm = (i % 6) * 10
      const datetime = `${dateStr} ${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`
      const t = i / 144
      const vals = {}
      for (const [k, d] of Object.entries(defs)) {
        let target = d.base
        if (d.cycle) {
          const phase = (t - d.cycle.peakHour) * 2 * Math.PI
          target = d.base + d.cycle.amp * Math.sin(phase)
        }
        const noise = (rand() - 0.5) * 2 * d.noise
        state[k] = clamp(state[k] + (target - state[k]) * 0.12 + noise, d.min, d.max)
        vals[k] = +state[k].toFixed(d.dec)
      }
      return { datetime, ...vals }
    })

    if (!isToday) {
      allData.push(...dayRows)
    } else {
      // Compute per-channel LR slope from the last FORECAST_N actual points
      const slopes = {}
      for (const k of FORECAST_CH) {
        const history = dayRows.slice(LAST_IDX - FORECAST_N + 1, LAST_IDX + 1).map(r => r[k])
        slopes[k] = linReg(history)
      }

      for (let i = 0; i < 144; i++) {
        const row = dayRows[i]
        if (i < LAST_IDX) {
          allData.push(row)
        } else if (i === LAST_IDX) {
          // Anchor: actual + forecast key set to same value (line continuity)
          const fcast = {}
          for (const k of FORECAST_CH) fcast[`${k}F`] = row[k]
          allData.push({ ...row, ...fcast })
        } else {
          // Forecast only: anchor value + slope × steps, clamped to physical range
          const step = i - LAST_IDX
          const fcast = {}
          for (const k of FORECAST_CH) {
            const projected = dayRows[LAST_IDX][k] + slopes[k] * step
            fcast[`${k}F`] = +clamp(projected, defs[k].min, defs[k].max).toFixed(defs[k].dec)
          }
          allData.push({ datetime: row.datetime, ...fcast })
        }
      }
    }
  }

  // Stats: today's actual segment only
  const todayActual = allData.filter(
    d => typeof d.datetime === "string" && d.datetime.startsWith(TODAY) && typeof d.temp === "number"
  )
  const statChannels = [
    { key: "temp",     label: "温度 (°C)"   },
    { key: "humidity", label: "湿度 (%)"    },
    { key: "pressure", label: "気圧 (hPa)" },
    { key: "co2",      label: "CO₂ (ppm)" },
  ]

  return {
    deviceId: "DEV-001",
    multiDay: true,
    lastActual: `${TODAY} ${LAST_ACTUAL}`,
    forecastKeys: FORECAST_CH,
    stats: computeStats(todayActual, statChannels),
    data: allData,
  }
}

// ─── Single-day device definitions ───────────────────────────────────────────

const singleDayDevices = [
  {
    id: "dev-002", seed: 1002,
    channels: [
      { key: "temp",     label: "温度 (°C)",   def: { base: 20.5, min: 18, max: 24, noise: 0.2, cycle: { peakHour: 0.60, amp: 2   }, dec: 1 } },
      { key: "humidity", label: "湿度 (%)",    def: { base: 43,   min: 38, max: 50, noise: 0.8, dec: 0 } },
      { key: "pressure", label: "気圧 (hPa)", def: { base: 1012.9, min: 1011, max: 1015, noise: 0.15, dec: 1 } },
    ],
    anomalies: [],
  },
  {
    id: "dev-003", seed: 1003,
    channels: [
      { key: "temp",      label: "温度 (°C)",   def: { base: 20,  min: 10, max: 30, noise: 0.8, cycle: { peakHour: 0.58, amp: 8   }, dec: 1 } },
      { key: "humidity",  label: "湿度 (%)",    def: { base: 68,  min: 40, max: 95, noise: 2.5, cycle: { peakHour: 0.1,  amp: 20  }, dec: 0 } },
      { key: "windSpeed", label: "風速 (m/s)", def: { base: 2.0, min: 0,  max: 12, noise: 0.6, cycle: { peakHour: 0.55, amp: 2   }, dec: 1 } },
      { key: "rainfall",  label: "雨量 (mm)",  def: { base: 0,   min: 0,  max: 0,  noise: 0, dec: 1 } },
    ],
    anomalies: [],
  },
  {
    id: "dev-004", seed: 1004,
    channels: [
      { key: "temp",     label: "温度 (°C)", def: { base: 19,  min: 17, max: 35, noise: 0.3, cycle: { peakHour: 0.6, amp: 1.5 }, dec: 1 } },
      { key: "humidity", label: "湿度 (%)",  def: { base: 61,  min: 50, max: 68, noise: 1.0, dec: 0 } },
    ],
    anomalies: [
      { at: 84, key: "temp", value: 31.2 },
      { at: 85, key: "temp", value: 28.4 },
      { at: 86, key: "temp", value: 24.1 },
    ],
  },
  {
    id: "dev-005", seed: 1005,
    channels: [
      { key: "temp",        label: "温度 (°C)",    def: { base: 23,  min: 18, max: 30,   noise: 0.5, cycle: { peakHour: 0.60, amp: 4   }, dec: 1 } },
      { key: "humidity",    label: "湿度 (%)",     def: { base: 55,  min: 40, max: 75,   noise: 1.5, cycle: { peakHour: 0.1,  amp: 10  }, dec: 0 } },
      { key: "co2",         label: "CO₂ (ppm)",  def: { base: 480, min: 380, max: 1200, noise: 25,  cycle: { peakHour: 0.55, amp: 250 }, dec: 0 } },
      { key: "illuminance", label: "照度 (lux)",  def: { base: 400, min: 0,   max: 1000, noise: 30,  cycle: { peakHour: 0.5,  amp: 380 }, dec: 0 } },
    ],
    anomalies: [],
  },
  {
    id: "dev-006", seed: 1006,
    channels: [
      { key: "temp",      label: "温度 (°C)",    def: { base: 22,  min: 8,  max: 36, noise: 1.0, cycle: { peakHour: 0.58, amp: 9  }, dec: 1 } },
      { key: "humidity",  label: "湿度 (%)",     def: { base: 72,  min: 35, max: 98, noise: 3.0, cycle: { peakHour: 0.1,  amp: 22 }, dec: 0 } },
      { key: "windSpeed", label: "風速 (m/s)",  def: { base: 3.5, min: 0,  max: 18, noise: 1.2, cycle: { peakHour: 0.55, amp: 3  }, dec: 1 } },
      { key: "rainfall",  label: "雨量 (mm)",   def: { base: 0.2, min: 0,  max: 8,  noise: 0.3, dec: 1 } },
      { key: "uvIndex",   label: "UV指数",       def: { base: 0,   min: 0,  max: 11, noise: 0.4, cycle: { peakHour: 0.5,  amp: 5  }, dec: 1 } },
    ],
    anomalies: [],
  },
  {
    id: "dev-007", seed: 1007,
    channels: [
      { key: "temp",     label: "温度 (°C)",    def: { base: 28,  min: 20, max: 45,  noise: 0.8, cycle: { peakHour: 0.6,  amp: 6  }, dec: 1 } },
      { key: "pressure", label: "圧力 (kPa)",  def: { base: 250, min: 200, max: 300, noise: 3,   dec: 1 } },
      { key: "flow",     label: "流量 (L/min)", def: { base: 85,  min: 40, max: 120, noise: 4,   cycle: { peakHour: 0.5,  amp: 25 }, dec: 1 } },
    ],
    anomalies: [],
  },
  {
    id: "dev-008", seed: 1008,
    channels: [
      { key: "temp",      label: "温度 (°C)",    def: { base: 22,  min: 18, max: 28,   noise: 0.4, cycle: { peakHour: 0.6,  amp: 3   }, dec: 1 } },
      { key: "humidity",  label: "湿度 (%)",     def: { base: 52,  min: 35, max: 70,   noise: 1.5, cycle: { peakHour: 0.1,  amp: 12  }, dec: 0 } },
      { key: "co2",       label: "CO₂ (ppm)",  def: { base: 520, min: 380, max: 1400, noise: 30,  cycle: { peakHour: 0.55, amp: 300 }, dec: 0 } },
      { key: "occupancy", label: "在室数 (人)",  def: { base: 5,   min: 0,  max: 30,   noise: 2,   cycle: { peakHour: 0.5,  amp: 12  }, dec: 0 } },
    ],
    anomalies: [],
  },
  {
    id: "dev-009", seed: 1009,
    channels: [
      { key: "temp",      label: "温度 (°C)",    def: { base: 21,  min: 5,  max: 38,   noise: 1.2, cycle: { peakHour: 0.58, amp: 10  }, dec: 1 } },
      { key: "humidity",  label: "湿度 (%)",     def: { base: 65,  min: 30, max: 95,   noise: 3.5, cycle: { peakHour: 0.1,  amp: 25  }, dec: 0 } },
      { key: "solarRad",  label: "日射量 (W/m²)", def: { base: 0,   min: 0,  max: 950,  noise: 30,  cycle: { peakHour: 0.5,  amp: 460 }, dec: 0 } },
      { key: "windSpeed", label: "風速 (m/s)",  def: { base: 4.0, min: 0,  max: 20,   noise: 1.5, cycle: { peakHour: 0.55, amp: 3.5 }, dec: 1 } },
    ],
    anomalies: [],
  },
  {
    id: "dev-010", seed: 1010,
    channels: [
      { key: "temp",  label: "温度 (°C)",    def: { base: 32,  min: 25, max: 55, noise: 1.0, cycle: { peakHour: 0.6,  amp: 8  }, dec: 1 } },
      { key: "flow",  label: "流量 (L/min)", def: { base: 120, min: 60, max: 180, noise: 5,  cycle: { peakHour: 0.5,  amp: 40 }, dec: 1 } },
      { key: "power", label: "消費電力 (kW)", def: { base: 15,  min: 8,  max: 30, noise: 0.8, cycle: { peakHour: 0.55, amp: 8  }, dec: 1 } },
    ],
    anomalies: [],
  },
]

// ─── Generate and write ───────────────────────────────────────────────────────

// DEV-001
const dev001Out = generateDev001()
writeFileSync(
  join(__dir, "readings", "dev-001.json"),
  JSON.stringify(dev001Out, null, 2)
)
console.log(`✓ dev-001.json  (${dev001Out.data.length} rows, multi-day, forecast up to 23:50)`)

// DEV-002〜010 (single day)
const DATE = "2026-05-26"
for (const dev of singleDayDevices) {
  reSeed(dev.seed)
  const channelDefs = Object.fromEntries(dev.channels.map(c => [c.key, c.def]))
  const data = makeSeries(channelDefs, { anomalies: dev.anomalies })
  const stats = computeStats(data, dev.channels)

  const out = { deviceId: dev.id.replace("dev-", "DEV-").toUpperCase(), date: DATE, stats, data }
  writeFileSync(join(__dir, "readings", `${dev.id}.json`), JSON.stringify(out, null, 2))
  console.log(`✓ ${dev.id}.json  (${data.length} rows, ${dev.channels.length} channels)`)
}

console.log("\nDone.")
