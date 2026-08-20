import Link from 'next/link'
import type { DayKey } from '@/lib/dates/day'
import { longDate } from '@/lib/dates/format'
import type { SeasonNav } from '@/lib/seasons/nav'
import { SeasonSwitcher } from './season-switcher'
import { ThemeToggle } from './theme-toggle'

/** The five screens of Hibi. Two of them exist so far. */
const SCREENS = [
  { label: 'Home', href: '/' },
  { label: 'Daily tasks', href: '/daily' },
  { label: 'Journal', href: null },
  { label: 'Quests', href: null },
  { label: 'Habits', href: null },
]

function Wordmark() {
  return (
    <span className="flex items-baseline gap-2.5">
      <span className="text-[18px] leading-none font-medium tracking-[-0.02em]">Hibi Habits</span>
    </span>
  )
}

function Nav({ current }: { current: string }) {
  return (
    <nav aria-label="Screens" className="hidden items-center gap-5 lg:flex">
      {SCREENS.map((screen) => {
        if (!screen.href) {
          return (
            <span
              key={screen.label}
              title="Not built yet"
              className="cursor-default pb-0.5 text-[12px] text-ink-faint"
            >
              {screen.label}
            </span>
          )
        }

        const active = screen.href === current

        return (
          <Link
            key={screen.label}
            href={screen.href}
            aria-current={active ? 'page' : undefined}
            className={`pb-0.5 text-[12px] ${
              active ? 'border-b border-ink text-ink' : 'text-ink-dim hover:text-ink'
            }`}
          >
            {screen.label}
          </Link>
        )
      })}
    </nav>
  )
}

export function TopBar({
  today,
  nav,
  current,
}: {
  today: DayKey
  nav: SeasonNav
  current: string
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-ground/90 backdrop-blur">
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-x-7 gap-y-3 px-6 py-3">
        <Wordmark />
        <Nav current={current} />

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
