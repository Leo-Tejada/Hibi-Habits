import { DailyCard } from '@/components/daily/daily-card'
import { TopBar } from '@/components/home/top-bar'
import { seasonNavFor } from '@/lib/seasons/nav'
import { dailyView } from '@/server/queries/daily'

export default async function DailyTasksPage(props: PageProps<'/daily'>) {
  const { day } = await props.searchParams
  const view = await dailyView(typeof day === 'string' ? day : undefined)

  return (
    <div className="flex min-h-full flex-col">
      <TopBar today={view.today} nav={seasonNavFor(undefined, view.today)} current="/daily" />

      {/* One card, centred, and nothing else. */}
      <main className="flex flex-1 items-center justify-center px-6 py-10">
        <DailyCard view={view} />
      </main>
    </div>
  )
}
