'use client'

import { useState, useTransition } from 'react'
import { PROGRESS_MAX, PROGRESS_MIN, PROGRESS_STEP } from '@/lib/quests/rules'
import { setQuestProgress } from '@/server/actions/quest-progress'

const SCALES = {
  lg: { figure: 'text-[26px]', unit: 'text-[17px]', bar: 'h-2' },
  sm: { figure: 'text-[13px]', unit: 'text-[11px]', bar: 'h-1.5' },
}

/**
 * Quest progress is the user's own judgement, so it is an input, not a
 * readout. The visible bar is a plain div and the range input sits on top
 * of it invisibly — that way the bar can be styled freely while keeping a
 * real slider underneath for keyboard and screen-reader users.
 */
export function QuestProgress({
  questId,
  questTitle,
  initial,
  tone,
  scale = 'sm',
}: {
  questId: string
  questTitle: string
  initial: number
  tone: string
  scale?: keyof typeof SCALES
}) {
  const [value, setValue] = useState(initial)
  const [saved, setSaved] = useState(initial)
  const [saving, startSaving] = useTransition()
  const size = SCALES[scale]

  function commit(): void {
    if (value === saved) return
    setSaved(value)
    startSaving(() => setQuestProgress(questId, value))
  }

  return (
    <div className="flex items-center gap-3">
      <div className="relative flex h-6 flex-1 items-center">
        <input
          type="range"
          className="peer absolute inset-0 z-10 w-full cursor-ew-resize opacity-0"
          min={PROGRESS_MIN}
          max={PROGRESS_MAX}
          step={PROGRESS_STEP}
          value={value}
          aria-label={`Progress on ${questTitle}`}
          onChange={(event) => setValue(Number(event.target.value))}
          onPointerUp={commit}
          onKeyUp={commit}
          onBlur={commit}
        />
        <div
          className={`relative w-full overflow-hidden bg-line-soft outline-offset-2 peer-focus-visible:outline peer-focus-visible:outline-1 peer-focus-visible:outline-ink ${size.bar}`}
        >
          <span
            className="absolute inset-y-0 left-0 transition-[width] duration-100"
            style={{ width: `${value}%`, background: tone }}
          />
        </div>
      </div>
      <span
        className={`font-mono leading-none tabular-nums ${size.figure} ${saving ? 'text-ink-dim' : 'text-ink'}`}
      >
        {value}
        <span className={`ml-px text-ink-faint ${size.unit}`}>%</span>
      </span>
    </div>
  )
}
