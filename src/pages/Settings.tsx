import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Save, Plus, Trash2 } from "lucide-react"
import { useTheme } from "@/components/theme-provider"

type SettingsTab = "connection" | "alerts" | "display" | "users"

interface Rule {
  id: number
  device: string
  channel: string
  low: string
  high: string
  notify: string
}

const initialRules: Rule[] = [
  { id: 1, device: "全デバイス", channel: "温度", low: "5.0", high: "35.0", notify: "メール" },
  { id: 2, device: "全デバイス", channel: "湿度", low: "20", high: "80", notify: "メール" },
  { id: 3, device: "全デバイス", channel: "気圧", low: "1000.0", high: "1030.0", notify: "Webhook" },
  { id: 4, device: "センサー D", channel: "温度", low: "0.0", high: "30.0", notify: "メール" },
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

function ConnectionTab() {
  return (
    <div className="space-y-6">
      <div className="border border-border rounded-lg p-5 bg-card space-y-4">
        <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">
          接続設定
        </p>
        <div className="grid grid-cols-2 gap-4">
          <Field label="APIエンドポイント URL">
            <TextInput defaultValue="https://api.datalogger.local/v1" placeholder="https://..." />
          </Field>
          <Field label="APIキー">
            <TextInput defaultValue="dl_sk_••••••••••••••••" type="password" />
          </Field>
          <Field label="ポーリング間隔 (秒)">
            <TextInput defaultValue="30" type="number" />
          </Field>
          <Field label="タイムアウト (秒)">
            <TextInput defaultValue="10" type="number" />
          </Field>
        </div>
        <div className="pt-2 flex gap-2">
          <Button size="sm" variant="outline">
            接続テスト
          </Button>
          <Button size="sm">
            <Save size={13} className="mr-1.5" />
            保存
          </Button>
        </div>
      </div>
    </div>
  )
}

function AlertsTab() {
  const [rules, setRules] = useState<Rule[]>(initialRules)

  function removeRule(id: number) {
    setRules((prev) => prev.filter((r) => r.id !== id))
  }

  return (
    <div className="space-y-5">
      <div className="border border-border rounded-lg bg-card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">
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
              <th className="px-4 py-2.5" />
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
                <td className="px-4 py-2.5 text-muted-foreground text-xs">{r.notify}</td>
                <td className="px-4 py-2.5 text-right">
                  <button
                    onClick={() => removeRule(r.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="border border-border rounded-lg p-5 bg-card space-y-4">
        <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">
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
      <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">
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
  const roleBadge: Record<string, string> = {
    管理者: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    編集者: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    閲覧専用: "bg-muted text-muted-foreground",
  }

  return (
    <div className="border border-border rounded-lg bg-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">
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
                <span
                  className={`text-[10px] px-2 py-0.5 rounded font-medium ${roleBadge[u.role]}`}
                >
                  {u.role}
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
  const [activeTab, setActiveTab] = useState<SettingsTab>("connection")

  const tabs: { id: SettingsTab; label: string }[] = [
    { id: "connection", label: "接続" },
    { id: "alerts", label: "アラート" },
    { id: "display", label: "表示" },
    { id: "users", label: "ユーザー" },
  ]

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center gap-2">
        <h2 className="text-base font-semibold">設定</h2>
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
        {activeTab === "connection" && <ConnectionTab />}
        {activeTab === "alerts" && <AlertsTab />}
        {activeTab === "display" && <DisplayTab />}
        {activeTab === "users" && <UsersTab />}
      </div>
    </div>
  )
}
