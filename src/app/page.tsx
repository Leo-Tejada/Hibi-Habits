import { MainQuests } from '@/components/home/main-quests'
import { SeasonPanel } from '@/components/home/season-panel'
import { SideQuests } from '@/components/home/side-quests'
import { SignalsPanel } from '@/components/home/signals-panel'
import { StatisticsPanel } from '@/components/home/statistics-panel'
import { TodayPanel } from '@/components/home/today-panel'
import { TopBar } from '@/components/home/top-bar'
import { homeView } from '@/server/queries/home'

export default async function HomePage(props: PageProps<'/'>) {
  const { season } = await props.searchParams
  const view = await homeView(typeof season === 'string' ? season : undefined)

  return (
    <div className="flex min-h-full flex-col">
      <TopBar today={view.today} nav={view.nav} />

      <main className="mx-auto w-full max-w-[1400px] flex-1 px-6 py-5">
        <SeasonPanel season={view.season} months={view.months} />

        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="flex flex-col gap-8">
            <MainQuests quests={view.mainQuests} />
            <SideQuests quests={view.sideQuests} />
          </div>

          <aside className="flex flex-col gap-4">
            <SignalsPanel signals={view.signals} />
            <TodayPanel today={view.todayTally} recent={view.recentTally} />
            <StatisticsPanel />
          </aside>
        </div>
      </main>
    </div>
  )
}
