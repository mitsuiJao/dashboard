import { useState } from "react"
import { Download, FileText, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"

const DEVICES = ["センサー A", "センサー B", "センサー C", "センサー D"]
const CHANNELS = ["温度", "湿度", "気圧", "CO₂", "風速", "雨量"]
const PDF_OPTIONS = ["グラフ（折れ線）を含める", "統計サマリーを含める", "アラート履歴を含める"]

const pillClass = (active: boolean) =>
  `text-[11px] px-2.5 py-1 rounded border transition-colors ${
    active
      ? "border-foreground/60 bg-foreground text-background"
      : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/40"
  }`

export default function Reports() {
  const [selectedDevices, setSelectedDevices] = useState<string[]>(["センサー A", "センサー B"])
  const [selectedChannels, setSelectedChannels] = useState<string[]>(["温度", "湿度"])
  const [encoding, setEncoding] = useState<"utf8" | "sjis">("utf8")
  const [pdfOptions, setPdfOptions] = useState<string[]>(PDF_OPTIONS)
  const [exporting, setExporting] = useState(false)

  function toggleDevice(d: string) {
    setSelectedDevices((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]))
  }
  function toggleChannel(c: string) {
    setSelectedChannels((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]))
  }
  function togglePdfOption(opt: string) {
    setPdfOptions((prev) => (prev.includes(opt) ? prev.filter((x) => x !== opt) : [...prev, opt]))
  }
  function handleExport(_type: "csv" | "pdf") {
    setExporting(true)
    setTimeout(() => setExporting(false), 1500)
  }

  const summary = (
    <p className="text-[11px] text-muted-foreground">
      {selectedDevices.length > 0 ? selectedDevices.join("  /  ") : "デバイス未選択"}
      {"  ·  "}
      {selectedChannels.length > 0 ? selectedChannels.join("、") : "チャンネル未選択"}
    </p>
  )

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-base font-semibold">レポート</h2>

      {/* 共通フィルタ */}
      <div className="border border-border rounded-lg bg-card px-4 py-3 space-y-2.5">
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest w-[68px] flex-shrink-0">デバイス</span>
          <div className="flex gap-1.5 flex-wrap">
            {DEVICES.map((d) => (
              <button key={d} onClick={() => toggleDevice(d)} className={pillClass(selectedDevices.includes(d))}>
                {d}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest w-[68px] flex-shrink-0">チャンネル</span>
          <div className="flex gap-1.5 flex-wrap">
            {CHANNELS.map((c) => (
              <button key={c} onClick={() => toggleChannel(c)} className={pillClass(selectedChannels.includes(c))}>
                {c}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest w-[68px] flex-shrink-0">期間</span>
          <div className="flex items-center gap-1.5">
            <input type="date" defaultValue="2026-05-01" className="text-xs border border-border rounded px-2 py-1 bg-background focus:outline-none focus:ring-1 focus:ring-ring" />
            <span className="text-[11px] text-muted-foreground/60">〜</span>
            <input type="date" defaultValue="2026-05-26" className="text-xs border border-border rounded px-2 py-1 bg-background focus:outline-none focus:ring-1 focus:ring-ring" />
          </div>
        </div>
      </div>

      {/* 出力形式 */}
      <div className="grid grid-cols-2 gap-4">
        {/* CSV */}
        <div className="border border-border rounded-lg p-5 bg-card space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded bg-muted flex items-center justify-center flex-shrink-0">
              <Download size={14} className="text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold">CSV エクスポート</p>
              <p className="text-xs text-muted-foreground mt-0.5">タイムスタンプ × チャンネルの生データ</p>
            </div>
          </div>

          <div>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest mb-2">文字コード</p>
            <div className="flex gap-1.5">
              {(["utf8", "sjis"] as const).map((enc) => (
                <button key={enc} onClick={() => setEncoding(enc)} className={pillClass(encoding === enc)}>
                  {enc === "utf8" ? "UTF-8" : "Shift_JIS"}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-border space-y-3">
            {summary}
            <Button
              onClick={() => handleExport("csv")}
              disabled={exporting || selectedDevices.length === 0 || selectedChannels.length === 0}
              className="w-full"
              size="sm"
            >
              <Download size={14} className="mr-1.5" />
              {exporting ? "処理中..." : "CSV をダウンロード"}
            </Button>
          </div>
        </div>

        {/* PDF */}
        <div className="border border-border rounded-lg p-5 bg-card space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded bg-muted flex items-center justify-center flex-shrink-0">
              <FileText size={14} className="text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold">PDF レポート</p>
              <p className="text-xs text-muted-foreground mt-0.5">グラフ＋統計サマリーを含む帳票</p>
            </div>
          </div>

          <div>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest mb-2">含める内容</p>
            <div className="flex gap-1.5 flex-wrap">
              {PDF_OPTIONS.map((opt) => (
                <button key={opt} onClick={() => togglePdfOption(opt)} className={pillClass(pdfOptions.includes(opt))}>
                  {opt.replace("を含める", "")}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-border space-y-3">
            {summary}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" disabled={selectedDevices.length === 0}>
                <Eye size={14} className="mr-1.5" />
                プレビュー
              </Button>
              <Button
                size="sm"
                className="flex-1"
                onClick={() => handleExport("pdf")}
                disabled={exporting || selectedDevices.length === 0 || selectedChannels.length === 0}
              >
                <Download size={14} className="mr-1.5" />
                {exporting ? "生成中..." : "PDF を生成"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
