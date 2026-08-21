'use client'

import { ShaderGradient, ShaderGradientCanvas } from '@shadergradient/react'
import { useSyncExternalStore } from 'react'
import { readResolvedTheme, subscribeResolvedTheme, type ResolvedTheme } from '@/lib/theme'

/**
 * A gradient as exported from shadergradient.co, plus how close to stand.
 *
 * `zoom` is a separate field because the exported URL cannot carry it: for
 * `type=sphere` the library pins the camera to a fixed distance of 14 units,
 * ignores `cDistance` entirely, and steers with `camera.zoom` alone — which
 * the export always leaves at 1. Planes read `cDistance` from the URL as
 * normal and ignore this field.
 */
type Gradient = { url: string; zoom?: number }

/**
 * One gradient per theme, because a background that flatters the light
 * palette will not flatter the dark one.
 *
 * The whole design lives in the URL — colours, shape, camera, grain,
 * animation — so restyling a background means pasting a new string here
 * and changing nothing else.
 */
const GRADIENTS: Record<ResolvedTheme, Gradient> = {
  light: {
    url: 'https://shadergradient.co/customize?animate=on&axesHelper=off&bgColor1=%23000000&bgColor2=%23000000&brightness=1.2&cAzimuthAngle=180&cDistance=3.6&cPolarAngle=90&cameraZoom=1&color1=%23ff5005&color2=%23dbad91&color3=%23e18c87&destination=onCanvas&embedMode=off&envPreset=city&format=gif&fov=45&frameRate=10&gizmoHelper=hide&grain=on&lightType=3d&pixelDensity=1&positionX=-1.4&positionY=0&positionZ=0&range=disabled&rangeEnd=40&rangeStart=0&reflection=0.1&rotationX=0&rotationY=10&rotationZ=50&shader=defaults&type=plane&uAmplitude=1&uDensity=1.3&uFrequency=5.5&uSpeed=0.4&uStrength=4&uTime=0&wireframe=false',
  },
  dark: {
    url: 'https://shadergradient.co/customize?animate=on&axesHelper=off&bgColor1=%23000000&bgColor2=%23000000&brightness=1.2&cAzimuthAngle=180&cDistance=3.6&cPolarAngle=90&cameraZoom=1&color1=%233b1718&color2=%23a65b46&color3=%23a40000&destination=onCanvas&embedMode=off&envPreset=city&format=gif&fov=45&frameRate=10&gizmoHelper=hide&grain=on&lightType=3d&pixelDensity=1&positionX=-1.4&positionY=0&positionZ=0&range=disabled&rangeEnd=40&rangeStart=0&reflection=0.1&rotationX=0&rotationY=10&rotationZ=50&shader=defaults&type=plane&uAmplitude=1&uDensity=1.3&uFrequency=5.5&uSpeed=0.4&uStrength=4&uTime=0&wireframe=false',
  },
}

/** Spheres need their closeness supplied; planes already carry it. */
function framed({ url, zoom }: Gradient): string {
  if (zoom === undefined || !url.includes('type=sphere')) return url

  return url.replace(/cameraZoom=[\d.]+/, `cameraZoom=${zoom}`)
}

/** Reduced motion holds the same gradient still rather than removing it. */
function heldStill(url: string): string {
  return url.replace('animate=on', 'animate=off')
}

function subscribeToMotion(listener: () => void): () => void {
  const query = window.matchMedia('(prefers-reduced-motion: reduce)')

  query.addEventListener('change', listener)
  return () => query.removeEventListener('change', listener)
}

function readMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** Assume stillness until the browser says otherwise. */
function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribeToMotion, readMotion, () => true)
}

function useResolvedTheme(): ResolvedTheme {
  return useSyncExternalStore(subscribeResolvedTheme, readResolvedTheme, () => 'light')
}

/**
 * Anyone who has asked their system for less movement gets the same
 * gradient held still, rather than no gradient at all.
 */
export function GradientCanvas() {
  const theme = useResolvedTheme()
  const still = usePrefersReducedMotion()
  const url = framed(GRADIENTS[theme])

  return (
    <ShaderGradientCanvas style={{ width: '100%', height: '100%' }} pointerEvents="none" fov={45}>
      <ShaderGradient control="query" urlString={still ? heldStill(url) : url} />
    </ShaderGradientCanvas>
  )
}
