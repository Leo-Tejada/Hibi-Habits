import type { Signal } from '@/types/home'
import { Panel } from '../ui/panel'

const MARK: Record<Signal['level'], string> = {
  alert: 'bg-alert',
  note: 'border border-ink-faint',
}

function SignalRow({ signal }: { signal: Signal }) {
  return (
    <li className="flex gap-3 px-4 py-3">
      <span className={`mt-1 h-1.5 w-1.5 shrink-0 ${MARK[signal.level]}`} />
      <div className="min-w-0">
        <p className={signal.level === 'alert' ? 'text-ink' : 'text-ink-dim'}>{signal.text}</p>
        {signal.detail && <p className="mt-1 text-[11px] text-ink-faint">{signal.detail}</p>}
      </div>
    </li>
  )
}

/**
 * Everything the other screens would want to tell you. All of it is
 * worked out from the data on each load, so nothing here can be stale.
 */
export function SignalsPanel({ signals }: { signals: Signal[] }) {
  return (
    <Panel title="Signals" padded={false}>
      {signals.length === 0 ? (
        <p className="px-4 py-4 text-[12px] text-ink-faint">
          Nothing is waiting on you. Everything scheduled is either done or still ahead.
        </p>
      ) : (
        <ul className="divide-y divide-line-soft">
          {signals.map((signal) => (
            <SignalRow key={signal.id} signal={signal} />
          ))}
        </ul>
      )}
    </Panel>
  )
}
