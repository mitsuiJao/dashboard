import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Save, Plus, Trash2, TrendingUp, Pencil } from "lucide-react"
import { useTheme } from "@/components/theme-provider"

type SettingsTab = "alerts" | "display" | "users"

interface Rule {
  id: number
  device: string
  channel: string
  low: string
  high: string
  notify: string
  enabled: boolean
}

interface ForecastRule {
  id: number
  device: string
  channel: string
  low: string
  high: string
  warnLookahead: string  // optional — empty means no 注意 tier
  alertLookahead: string
  notify: string
  enabled: boolean
}

const initialRules: Rule[] = [
  { id: 1, device: "全デバイス", channel: "温度",   low: "5.0",    high: "35.0",   notify: "メール",   enabled: true  },
  { id: 2, device: "全デバイス", channel: "湿度",   low: "20",     high: "80",     notify: "メール",   enabled: true  },
  { id: 3, device: "全デバイス", channel: "気圧",   low: "1000.0", high: "1030.0", notify: "Webhook", enabled: true  },
  { id: 4, device: "センサー D", channel: "温度",   low: "0.0",    high: "30.0",   notify: "メール",   enabled: false },
]

const initialForecastRules: ForecastRule[] = [
  { id: 1, device: "センサー A", channel: "温度",   low: "",    high: "38.0", warnLookahead: "3時間", alertLookahead: "1時間", notify: "メール",   enabled: true  },
  { id: 2, device: "全デバイス", channel: "湿度",   low: "15",  high: "",     warnLookahead: "6時間", alertLookahead: "2時間", notify: "メール",   enabled: true  },
  { id: 3, device: "センサー A", channel: "気圧",   low: "998", high: "",     warnLookahead: "",      alertLookahead: "3時間", notify: "Webhook", enabled: false },
  { id: 4, device: "センサー A", channel: "CO₂",   low: "",    high: "1200", warnLookahead: "",      alertLookahead: "1時間", notify: "メール",   enabled: false },
]

const users = [
  { id: 1, name: "管理者 A", email: "admin@example.com", role: "管理者" },
  { id: 2, name: "ユーザー B", email: "userb@example.com", role: "編集者" },
  { id: 3, name: "ユーザー C", email: "userc@example.com", role: "閲覧専用" },
]

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground block mb-1">{label}</label>
      {children}
    </div>
  )
}

function TextInput({
  defaultValue,
  type = "text",
  placeholder,
}: {
  defaultValue?: string
  type?: string
  placeholder?: string
}) {
  return (
    <input
      type={type}
      defaultValue={defaultValue}
      placeholder={placeholder}
      className="w-full text-sm border border-border rounded-md px-3 py-2 bg-background focus:outline-none focus:ring-1 focus:ring-ring"
    />
  )
}

function AlertsTab() {
  const [rules, setRules] = useState<Rule[]>(initialRules)
  const [forecastRules, setForecastRules] = useState<ForecastRule[]>(initialForecastRules)

  function removeRule(id: number) {
    setRules((prev) => prev.filter((r) => r.id !== id))
  }

  function toggleRule(id: number) {
    setRules((prev) => prev.map((r) => r.id === id ? { ...r, enabled: !r.enabled } : r))
  }

  function removeForecastRule(id: number) {
    setForecastRules((prev) => prev.filter((r) => r.id !== id))
  }

  function toggleForecastRule(id: number) {
    setForecastRules((prev) => prev.map((r) => r.id === id ? { ...r, enabled: !r.enabled } : r))
  }

  return (
    <div className="space-y-5">
      {/* ── 閾値ルール ───────────────────────────────────────────────────── */}
      <div className="border border-border rounded-lg bg-card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <p className="text-[11px] text-muted-foreground font-semibold">
            閾値ルール
          </p>
          <Button size="sm" variant="outline" className="h-7 text-xs">
            <Plus size={12} className="mr-1" />
            ルール追加
          </Button>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr className="text-[11px] text-muted-foreground">
              <th className="text-left px-4 py-2.5 font-medium">デバイス</th>
              <th className="text-left px-4 py-2.5 font-medium">チャンネル</th>
              <th className="text-right px-4 py-2.5 font-medium">下限</th>
              <th className="text-right px-4 py-2.5 font-medium">上限</th>
              <th className="text-left px-4 py-2.5 font-medium">通知先</th>
              <th className="text-center px-4 py-2.5 font-medium">有効</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {rules.map((r) => (
              <tr
                key={r.id}
                className={`border-t border-border/50 transition-colors ${r.enabled ? "" : "opacity-50"}`}
              >
                <td className="px-4 py-2.5">{r.device}</td>
                <td className="px-4 py-2.5">{r.channel}</td>
                <td className="px-4 py-2.5 text-right font-mono text-xs text-blue-600 dark:text-blue-400">
                  {r.low || "—"}
                </td>
                <td className="px-4 py-2.5 text-right font-mono text-xs text-red-600 dark:text-red-400">
                  {r.high || "—"}
                </td>
                <td className="px-4 py-2.5 text-muted-foreground text-xs">{r.notify}</td>
                <td className="px-4 py-2.5 text-center">
                  <Switch checked={r.enabled} onCheckedChange={() => toggleRule(r.id)} />
                </td>
                <td className="px-4 py-2.5 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button className="text-muted-foreground hover:text-foreground transition-colors">
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => removeRule(r.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── 予測アラート ─────────────────────────────────────────────────── */}
      <div className="border border-border rounded-lg bg-card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <TrendingUp size={13} className="text-muted-foreground" />
            <p className="text-[11px] text-muted-foreground font-semibold">
              予測アラート
            </p>
          </div>
          <Button size="sm" variant="outline" className="h-7 text-xs">
            <Plus size={12} className="mr-1" />
            ルール追加
          </Button>
        </div>
        {/* <div className="px-4 py-2.5 bg-muted/30 border-b border-border/60">
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            予測値が閾値を超えると見込まれるとき、実際の超過前に事前通知します。
          </p>
        </div> */}
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr className="text-[11px] text-muted-foreground">
              <th className="text-left px-4 py-2.5 font-medium">デバイス</th>
              <th className="text-left px-4 py-2.5 font-medium">チャンネル</th>
              <th className="text-right px-4 py-2.5 font-medium">下限</th>
              <th className="text-right px-4 py-2.5 font-medium">上限</th>
              <th className="text-left px-4 py-2.5 font-medium">先行時間</th>
              <th className="text-left px-4 py-2.5 font-medium">通知先</th>
              <th className="text-center px-4 py-2.5 font-medium">有効</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {forecastRules.map((r) => (
              <tr
                key={r.id}
                className={`border-t border-border/50 transition-colors ${r.enabled ? "" : "opacity-50"}`}
              >
                <td className="px-4 py-2.5">{r.device}</td>
                <td className="px-4 py-2.5">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-muted-foreground/60 mt-px" />
                    {r.channel}
                    <span className="text-[9px] font-mono border border-border/60 rounded px-1 text-muted-foreground">予測</span>
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right font-mono text-xs text-blue-600 dark:text-blue-400">
                  {r.low || "—"}
                </td>
                <td className="px-4 py-2.5 text-right font-mono text-xs text-red-600 dark:text-red-400">
                  {r.high || "—"}
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex flex-col gap-0.5">
                    {r.warnLookahead && (
                      <span className="flex items-center gap-1 text-[11px] font-mono text-amber-600 dark:text-amber-400">
                        <span className="text-[9px] font-sans font-medium w-9 flex-shrink-0">注意</span>
                        {r.warnLookahead}前
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-[11px] font-mono text-red-600 dark:text-red-400">
                      <span className="text-[9px] font-sans font-medium w-9 flex-shrink-0">アラート</span>
                      {r.alertLookahead}前
                    </span>
                  </div>
                </td>
                <td className="px-4 py-2.5 text-muted-foreground text-xs">{r.notify}</td>
                <td className="px-4 py-2.5 text-center">
                  <Switch checked={r.enabled} onCheckedChange={() => toggleForecastRule(r.id)} />
                </td>
                <td className="px-4 py-2.5 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button className="text-muted-foreground hover:text-foreground transition-colors">
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => removeForecastRule(r.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── 通知設定 ─────────────────────────────────────────────────────── */}
      <div className="border border-border rounded-lg p-5 bg-card space-y-4">
        <p className="text-[11px] text-muted-foreground font-semibold">
          通知設定
        </p>
        <div className="grid grid-cols-2 gap-4">
          <Field label="通知メールアドレス">
            <TextInput defaultValue="alert@example.com" type="email" />
          </Field>
          <Field label="Webhook URL">
            <TextInput placeholder="https://hooks.example.com/..." />
          </Field>
        </div>
        <Button size="sm">
          <Save size={13} className="mr-1.5" />
          保存
        </Button>
      </div>
    </div>
  )
}

function DisplayTab() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="border border-border rounded-lg p-5 bg-card space-y-4">
      <p className="text-[11px] text-muted-foreground font-semibold">
        表示設定
      </p>
      <div className="grid grid-cols-2 gap-4">
        <Field label="テーマ">
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value as "light" | "dark" | "system")}
            className="w-full text-sm border border-border rounded-md px-3 py-2 bg-background"
          >
            <option value="light">ライト</option>
            <option value="dark">ダーク</option>
            <option value="system">システム設定に従う</option>
          </select>
        </Field>
        <Field label="タイムゾーン">
          <select className="w-full text-sm border border-border rounded-md px-3 py-2 bg-background">
            <option>Asia/Tokyo (UTC+9)</option>
            <option>UTC</option>
          </select>
        </Field>
        <Field label="単位系">
          <select className="w-full text-sm border border-border rounded-md px-3 py-2 bg-background">
            <option>SI単位系</option>
            <option>ヤード・ポンド法</option>
          </select>
        </Field>
        <Field label="グラフデフォルト期間">
          <select className="w-full text-sm border border-border rounded-md px-3 py-2 bg-background">
            <option>直近 24時間</option>
            <option>直近 7日間</option>
            <option>直近 30日間</option>
          </select>
        </Field>
      </div>
      <Button size="sm">
        <Save size={13} className="mr-1.5" />
        保存
      </Button>
    </div>
  )
}

function UsersTab() {
  const roleDot: Record<string, string> = {
    管理者:  "bg-purple-500",
    編集者:  "bg-blue-500",
    閲覧専用: "bg-slate-400",
  }

  return (
    <div className="border border-border rounded-lg bg-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <p className="text-[11px] text-muted-foreground font-semibold">
          ユーザー管理
        </p>
        <Button size="sm" variant="outline" className="h-7 text-xs">
          <Plus size={12} className="mr-1" />
          招待
        </Button>
      </div>
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr className="text-[11px] text-muted-foreground">
            <th className="text-left px-4 py-2.5 font-medium">名前</th>
            <th className="text-left px-4 py-2.5 font-medium">メールアドレス</th>
            <th className="text-left px-4 py-2.5 font-medium">ロール</th>
            <th className="px-4 py-2.5" />
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-t border-border/50">
              <td className="px-4 py-3 font-medium">{u.name}</td>
              <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
              <td className="px-4 py-3">
                <span className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${roleDot[u.role] ?? "bg-slate-400"}`} />
                  <span className="text-[11px] text-foreground">{u.role}</span>
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <button className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2">
                  編集
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("alerts")

  const tabs: { id: SettingsTab; label: string }[] = [
    { id: "alerts", label: "アラート" },
    { id: "display", label: "表示" },
    { id: "users", label: "ユーザー" },
  ]

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center gap-2">
        <h2 className="text-[15px] font-semibold tracking-tight">設定</h2>
        {/* <span className="text-[10px] px-2 py-0.5 rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 font-semibold tracking-wide uppercase">
          必須
        </span> */}
      </div>

      <div className="flex gap-1 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`text-xs px-4 py-2 border-b-2 transition-colors -mb-px ${
              activeTab === tab.id
                ? "border-foreground text-foreground font-medium"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="pt-1">
        {activeTab === "alerts" && <AlertsTab />}
        {activeTab === "display" && <DisplayTab />}
        {activeTab === "users" && <UsersTab />}
      </div>
    </div>
  )
}
