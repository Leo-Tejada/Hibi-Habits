import { GraphShell } from '@/components/habits/graph-shell'
import { TopBar } from '@/components/home/top-bar'
import { seasonNavFor } from '@/lib/seasons/nav'
import { habitsView } from '@/server/queries/habits'

export default async function HabitsPage() {
  const view = await habitsView()

  return (
    // The graph fills whatever is left under the bar and never scrolls:
    // it is a space you move around in, not a document you read down.
    <div className="relative h-dvh w-full overflow-hidden">
      <div className="absolute inset-x-0 top-0 z-20">
        <TopBar today={view.today} nav={seasonNavFor(undefined, view.today)} current="/habits" />
      </div>

      <main className="absolute inset-0">
        <GraphShell view={view} />
      </main>
    </div>
  )
}
