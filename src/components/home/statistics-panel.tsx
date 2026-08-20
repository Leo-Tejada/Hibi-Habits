import { Eyebrow } from '../ui/eyebrow'
import { Panel } from '../ui/panel'

/** Held open on purpose. The statistics screen fills this in later. */
export function StatisticsPanel() {
  return (
    <Panel title="Statistics">
      <div className="flex aspect-square items-center justify-center border border-dashed border-line">
        <Eyebrow>Reserved</Eyebrow>
      </div>
    </Panel>
  )
}
