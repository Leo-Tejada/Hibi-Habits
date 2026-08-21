import { DailyCard } from '@/components/daily/daily-card'
import { TopBar } from '@/components/home/top-bar'
import { seasonNavFor } from '@/lib/seasons/nav'
import { dailyView } from '@/server/queries/daily'

export default async function DailyTasksPage(props: PageProps<'/daily'>) {
  const { day } = await props.searchParams
  const view = await dailyView(typeof day === 'string' ? day : undefined)

  return (
    // `dvh` rather than `min-h-full`: a percentage height resolves against
    // the body, whose own height is auto, so `100%` collapsed to the content
    // and left `main` no room to place anything. The dynamic unit also
    // survives a phone's address bar sliding in and out.
    <div className="flex min-h-dvh flex-col">
      <TopBar today={view.today} nav={seasonNavFor(undefined, view.today)} current="/daily" />

      {/*
        One card and nothing else. It rides a *proportion* of the height
        rather than a fixed offset: the empty tracks above and below split
        the leftover space evenly, so the card keeps its place in a tall
        window and a short one alike. Change that ratio to move it: raise
        the first number to sit lower, the last to sit higher.
        Both tracks collapse to nothing before the card is squeezed, so a
        short window still shows it whole instead of scrolling.
      */}
      <main className="grid flex-1 grid-rows-[1fr_auto_1fr] px-6 py-10">
        <div className="row-start-2 flex justify-center">
          <DailyCard view={view} />
        </div>
      </main>
    </div>
  )
}
