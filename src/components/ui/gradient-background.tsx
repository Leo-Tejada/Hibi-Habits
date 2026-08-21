'use client'

import dynamic from 'next/dynamic'

/**
 * Three.js is 270 KB gzipped — far too much to stand between someone and
 * their tasks. It is a decoration, so it loads after the app is already
 * usable and fades in when it arrives. Nothing below it shifts.
 */
const GradientCanvas = dynamic(
  () => import('./gradient-canvas').then((module) => module.GradientCanvas),
  { ssr: false }
)

/**
 * A living background, fixed behind every screen.
 *
 * It is inert to the pointer and sits below all content, so panels and
 * cards keep their own opaque ground and stay as legible as they were on
 * a flat surface — the gradient shows in the margins around them.
 */
export function GradientBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
      <GradientCanvas />
    </div>
  )
}
