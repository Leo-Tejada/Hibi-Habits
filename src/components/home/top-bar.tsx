import type { DayKey } from '@/lib/dates/day'
import { longDate } from '@/lib/dates/format'
import type { SeasonNav } from '@/types/home'
import { SeasonSwitcher } from './season-switcher'
import { ThemeToggle } from './theme-toggle'

/** The five screens of Hibi. Only the homepage exists so far. */
const SCREENS = [
  { label: 'Home', ready: true },
  { label: 'Daily tasks', ready: false },
  { label: 'Journal', ready: false },
  { label: 'Quests', ready: false },
  { label: 'Habits', ready: false },
]

function Wordmark() {
  return (
    <span className="flex items-baseline gap-2.5">
      <span className="text-[18px] leading-none font-medium tracking-[-0.02em]">Hibi Habits</span>
      <span className="text-[13px] leading-none text-ink-faint">日々</span>
    </span>
  )
}

function Nav() {
  return (
    <nav aria-label="Screens" className="hidden items-center gap-5 lg:flex">
      {SCREENS.map((screen) =>
        screen.ready ? (
          <span
            key={screen.label}
            aria-current="page"
            className="border-b border-ink pb-0.5 text-[12px] text-ink"
          >
            {screen.label}
          </span>
        ) : (
          <span
            key={screen.label}
            title="Not built yet"
            className="cursor-default pb-0.5 text-[12px] text-ink-faint"
          >
            {screen.label}
          </span>
        )
      )}
    </nav>
  )
}

export function TopBar({ today, nav }: { today: DayKey; nav: SeasonNav }) {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-ground/90 backdrop-blur">
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-x-7 gap-y-3 px-6 py-3">
        <Wordmark />
        <Nav />

        <div className="ml-auto flex items-center gap-4">
          <span className="hidden font-mono text-[11px] uppercase tracking-[0.12em] text-ink-dim md:inline">
            {longDate(today)}
          </span>
          <ThemeToggle />
          <SeasonSwitcher nav={nav} />
        </div>
      </div>
    </header>
  )
}
