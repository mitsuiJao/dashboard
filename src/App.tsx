import { useState } from "react"
import { LayoutDashboard, TrendingUp, Cpu, Bell, FileDown, Settings, Activity, ChevronRight } from "lucide-react"
import devicesData from "../data/devices.json"
import Dashboard from "./pages/Dashboard"
import DataView from "./pages/DataView"
import Devices from "./pages/Devices"
import Alerts from "./pages/Alerts"
import Reports from "./pages/Reports"
import SettingsPage from "./pages/Settings"

export type PageId = "dashboard" | "dataview" | "devices" | "alerts" | "reports" | "settings"

const navMain = [
  { id: "dashboard" as const, label: "ダッシュボード", icon: LayoutDashboard },
  { id: "dataview" as const, label: "データ閲覧", icon: TrendingUp },
  { id: "devices" as const, label: "デバイス管理", icon: Cpu },
  { id: "alerts" as const, label: "アラート", icon: Bell },
  { id: "reports" as const, label: "レポート", icon: FileDown },
]

function NavItem({
  label,
  icon: Icon,
  active,
  onClick,
  badge,
}: {
  label: string
  icon: React.ElementType
  active: boolean
  onClick: () => void
  badge?: number
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2 transition-colors relative ${
        active
          ? "text-sidebar-foreground bg-sidebar-accent"
          : "text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/60"
      }`}
    >
      {active && (
        <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-sidebar-primary" />
      )}
      <Icon size={15} className="flex-shrink-0" />
      <span className={`flex-1 text-left text-[13px] ${active ? "font-medium" : ""}`}>{label}</span>
      {badge != null && badge > 0 && (
        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500 text-white font-medium leading-none tabular-nums">
          {badge}
        </span>
      )}
    </button>
  )
}

const ACCOUNT = {
  name: "管理者 A",
  email: "admin@example.com",
  role: "管理者",
  initial: "A",
}

export default function App() {
  const [page, setPage] = useState<PageId>("dashboard")
  const onlineCount = devicesData.filter(d => d.status === "online").length

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <nav className="w-52 flex-shrink-0 border-r border-border bg-sidebar flex flex-col">
        {/* ロゴ */}
        <div className="px-4 py-4 border-b border-border">
          <div className="flex items-center gap-2 mb-0.5">
            <Activity size={15} className="text-sidebar-primary flex-shrink-0" strokeWidth={2.5} />
            <p className="text-[13px] font-semibold text-sidebar-foreground tracking-tight">DataLogger</p>
          </div>
          <p className="text-[10px] text-sidebar-foreground/40 pl-[23px]">センサー監視システムデモ</p>
        </div>

        {/* ナビゲーション */}
        <div className="flex-1 overflow-y-auto py-3 space-y-0.5 px-1.5">
          <p className="px-2 pt-1 pb-1.5 text-[10px] text-sidebar-foreground/35 font-semibold tracking-widest uppercase">
            メイン
          </p>
          {navMain.map((item) => (
            <NavItem
              key={item.id}
              {...item}
              active={page === item.id}
              onClick={() => setPage(item.id)}
              badge={item.id === "alerts" ? 3 : undefined}
            />
          ))}
          <p className="px-2 pt-4 pb-1.5 text-[10px] text-sidebar-foreground/35 font-semibold tracking-widest uppercase">
            システム
          </p>
          <NavItem
            label="設定"
            icon={Settings}
            active={page === "settings"}
            onClick={() => setPage("settings")}
          />
        </div>

        {/* フッター: アカウント情報 + 接続状況 */}
        <div className="px-3 py-3 border-t border-border space-y-2.5">
          <button
            onClick={() => setPage("settings")}
            className="w-full flex items-center gap-2.5 rounded px-1 py-1 hover:bg-sidebar-accent/60 transition-colors group"
          >
            <div className="w-7 h-7 rounded-full bg-sidebar-primary/15 flex items-center justify-center flex-shrink-0">
              <span className="text-[12px] font-bold text-sidebar-primary">{ACCOUNT.initial}</span>
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-[12px] font-medium text-sidebar-foreground leading-tight truncate">{ACCOUNT.name}</p>
              <p className="text-[10px] text-sidebar-foreground/40 leading-tight truncate">{ACCOUNT.role}</p>
            </div>
            <ChevronRight size={12} className="text-sidebar-foreground/25 group-hover:text-sidebar-foreground/50 flex-shrink-0 transition-colors" />
          </button>
          <div className="flex items-center gap-1.5 pl-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
            <p className="text-[10px] text-sidebar-foreground/40 tabular-nums">
              接続中 {onlineCount} / {devicesData.length} 台
            </p>
          </div>
        </div>
      </nav>

      <main className="flex-1 overflow-auto">
        {page === "dashboard" && <Dashboard onNavigate={setPage} />}
        {page === "dataview" && <DataView />}
        {page === "devices" && <Devices />}
        {page === "alerts" && <Alerts onNavigate={setPage} />}
        {page === "reports" && <Reports />}
        {page === "settings" && <SettingsPage />}
      </main>
    </div>
  )
}
