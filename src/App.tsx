import { useState } from "react"
import { LayoutDashboard, TrendingUp, Cpu, Bell, FileDown, Settings, Activity } from "lucide-react"
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
        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-500 text-white font-medium leading-none tabular-nums">
          {badge}
        </span>
      )}
    </button>
  )
}

export default function App() {
  const [page, setPage] = useState<PageId>("dashboard")

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <nav className="w-52 flex-shrink-0 border-r border-border bg-sidebar flex flex-col">
        {/* ロゴ */}
        <div className="px-4 py-4 border-b border-border">
          <div className="flex items-center gap-2 mb-0.5">
            <Activity size={15} className="text-sidebar-primary flex-shrink-0" strokeWidth={2.5} />
            <p className="text-[13px] font-semibold text-sidebar-foreground tracking-tight">DataLogger</p>
          </div>
          <p className="text-[10px] text-sidebar-foreground/40 pl-[23px]">センサー監視システム</p>
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

        {/* フッター: 接続状況サマリー */}
        <div className="px-4 py-3 border-t border-border">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
            <p className="text-[10px] text-sidebar-foreground/45 tabular-nums">接続中 2 / 4 台</p>
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
