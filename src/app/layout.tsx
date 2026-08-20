import type { Metadata } from 'next'
import localFont from 'next/font/local'
import { GradientBackground } from '@/components/ui/gradient-background'
import { THEME_BOOT_SCRIPT } from '@/lib/theme'
import './globals.css'

/*
 * JetBrains Mono NL is shipped with the app because no operating system
 * has it — without this the figures fall back to a system mono on every
 * device but the one it was built on. Subset to Latin; see
 * `fonts/NOTICE.md` for the licence.
 *
 * Helvetica Neue is not shipped: it is proprietary and cannot be
 * redistributed. Apple devices already have it, and `globals.css` names
 * the fallbacks for everywhere else.
 */
const jetbrainsMonoNL = localFont({
  src: [
    { path: './fonts/JetBrainsMonoNL-Regular.woff2', weight: '400', style: 'normal' },
    { path: './fonts/JetBrainsMonoNL-Bold.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-mono-file',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Hibi Habits',
  description: 'A season at a time: quests, habits and the days that carry them.',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    // The boot script stamps the theme before React sees the document.
    <html lang="en" className={`${jetbrainsMonoNL.variable} h-full`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      <body className="min-h-full font-sans text-[13px] leading-normal">
        <GradientBackground />
        {children}
      </body>
    </html>
  )
}
