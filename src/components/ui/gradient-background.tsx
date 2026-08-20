'use client'

import { ShaderGradient, ShaderGradientCanvas } from '@shadergradient/react'
import { useSyncExternalStore } from 'react'

/**
 * The gradient, exactly as exported from shadergradient.co.
 *
 * The whole design lives in this one string — colours, shape, camera,
 * grain, animation — so restyling the app's background means pasting a
 * new URL here and nothing else.
 */
const GRADIENT_URL =
  'https://shadergradient.co/customize?animate=on&axesHelper=off&brightness=3&cAzimuthAngle=270&cDistance=0.51&cPolarAngle=180&cameraZoom=9.1&color1=%2373bfc4&color2=%23ff810a&color3=%238da0ce&destination=onCanvas&embedMode=off&envPreset=city&format=gif&fov=45&frameRate=10&gizmoHelper=hide&grain=on&lightType=env&pixelDensity=0.5&positionX=-0.1&positionY=0&positionZ=0&range=disabled&rangeEnd=40&rangeStart=0&reflection=0.3&rotationX=0&rotationY=130&rotationZ=70&shader=defaults&type=sphere&uAmplitude=5.5&uDensity=0.7&uFrequency=5.5&uSpeed=0.2&uStrength=1.3&uTime=0&wireframe=false'

function subscribeToMotion(listener: () => void): () => void {
  const query = window.matchMedia('(prefers-reduced-motion: reduce)')

  query.addEventListener('change', listener)
  return () => query.removeEventListener('change', listener)
}

function readMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** Server-rendered markup cannot know the preference, so it assumes stillness. */
function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribeToMotion, readMotion, () => true)
}

/**
 * A living background, fixed behind every screen.
 *
 * It is inert to the pointer and sits below all content, so panels and
 * cards keep their own opaque ground and stay as legible as they were on
 * a flat surface — the gradient shows in the margins around them.
 *
 * Anyone who has asked their system for less movement gets the same
 * gradient held still, rather than no gradient at all.
 */
export function GradientBackground() {
  const still = usePrefersReducedMotion()
  const url = still ? GRADIENT_URL.replace('animate=on', 'animate=off') : GRADIENT_URL

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
      <ShaderGradientCanvas
        style={{ width: '100%', height: '100%' }}
        pointerEvents="none"
        fov={45}
      >
        <ShaderGradient control="query" urlString={url} />
      </ShaderGradientCanvas>
    </div>
  )
}
