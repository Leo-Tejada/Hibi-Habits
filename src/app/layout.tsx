import type { Metadata } from 'next'
import { THEME_BOOT_SCRIPT } from '@/lib/theme'
import './globals.css'

export const metadata: Metadata = {
  title: 'Hibi Habits',
  description: 'A season at a time: quests, habits and the days that carry them.',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    // The boot script stamps the theme before React sees the document.
    <html lang="en" className="h-full" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      <body className="min-h-full font-sans text-[13px] leading-normal">{children}</body>
    </html>
  )
}
