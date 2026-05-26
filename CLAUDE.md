# DataLogger — Claude Context

## Commands

- `pnpm dev` — start dev server (Vite, default port 5174)
- `pnpm build` — type-check + production build (`tsc -b && vite build`)
- `pnpm typecheck` — type-check only (`tsc --noEmit`)
- `pnpm lint` — ESLint
- `pnpm format` — Prettier (`.ts`, `.tsx`)

## Stack

- React 19 + TypeScript, Vite 7, Tailwind CSS v4, shadcn/ui, Recharts 3, lucide-react
- Package manager: **pnpm** (pnpm-workspace.yaml present)
- Font: IBM Plex Sans Variable (UI) + IBM Plex Mono (data values) — Inter is installed but NOT used

## CSS / Theme

- Tailwind v4 uses `@theme inline { }` block in `index.css` — no `tailwind.config.*` file
- Colors use `oklch()` throughout; chart vars are `--chart-1` … `--chart-5`
- Light mode is the **default** (`defaultTheme="light"` in `main.tsx`); dark mode toggled from Settings
- Dark mode class applied via `@custom-variant dark (&:is(.dark *))` — Tailwind dark: prefix works
- Chart colors in components should use `var(--chart-N)` or `var(--color-chartN)`, never hardcoded hex

## UI Conventions

- **Toggle pills** (multi-select filters): shared `pillClass(active: boolean)` helper defined locally in each page — `border-foreground/60 bg-foreground text-background` when active
- **Status dots**: dot+text pattern (not pill badges). Online devices use `animate-ping` (absolute+relative span pair)
- **Data cells**: always `font-mono text-xs tabular-nums` for numeric values
- **Table zebra striping**: `even:bg-muted/20` on `<tr>`
- **Acknowledged / inactive rows**: `opacity-40`
- **Alert types**: arrow+text (`↑ 上限超過` / `↓ 下限超過`) — no colored pill backgrounds
- **Icon decoration boxes**: `bg-muted text-muted-foreground` — avoid specific hue backgrounds (green-100, blue-100 etc.)
- Stat card labels: `text-[10px] uppercase tracking-widest`; values: `text-[28px] font-semibold`

## Data

- Device list: `data/devices.json`
- Per-device readings: `data/readings/dev-001.json` … `dev-004.json`
- Each readings file has `{ deviceId, date, stats: StatRow[], data: Record<string, number|string>[] }`

## Architecture

- Single-page app; navigation is pure state in `App.tsx` via `PageId` union type and `onNavigate` prop
- `ThemeProvider` wraps the entire app; pages access theme via `useTheme()` from `@/components/theme-provider`
- Settings page `DisplayTab` is wired to `setTheme()` for live theme switching
