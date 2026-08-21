'use client'

import { ShaderGradient, ShaderGradientCanvas, type GradientT } from '@shadergradient/react'
import { useSyncExternalStore } from 'react'
import { usePrefersReducedMotion } from '@/lib/motion'
import { readResolvedTheme, subscribeResolvedTheme, type ResolvedTheme } from '@/lib/theme'

/**
 * One gradient per theme, written as plain values.
 *
 * shadergradient.co is for exploring; this is where a design lands. Its
 * URL does not always catch up with the canvas, so what you copy can be a
 * step behind what you were looking at — and a 900-character query string
 * is unreadable in a diff besides. The library takes these as props
 * directly (`control="query"` is the alternate path, not the native one),
 * so every knob is named, typed and commented here instead.
 *
 * Anything omitted falls back to the library's `halo` preset.
 *
 * One trap worth keeping in mind if you ever set `type: 'sphere'`:
 * `cDistance` is ignored for spheres. The library pins them to a fixed
 * distance of 14 units and frames them with `cameraZoom` alone. For
 * planes it is the other way round — `cDistance` moves the camera and
 * `cameraZoom` stays at 1.
 */
const GRADIENTS: Record<ResolvedTheme, GradientT> = {
  light: {
    type: 'plane',
    animate: 'on',
    shader: 'defaults',
    uTime: 0,
    uSpeed: 0.4,
    uStrength: 4,
    uDensity: 1.3,
    uFrequency: 5.5,
    uAmplitude: 1,
    range: 'disabled',
    rangeStart: 0,
    rangeEnd: 40,
    positionX: -1.4,
    positionY: 0,
    positionZ: 0,
    rotationX: 0,
    rotationY: 10,
    rotationZ: 50,
    color1: '#ff5005',
    color2: '#dbad91',
    color3: '#e18c87',
    reflection: 0.1,
    wireframe: false,
    cAzimuthAngle: 180,
    cPolarAngle: 90,
    cDistance: 3.6,
    cameraZoom: 1,
    lightType: '3d',
    brightness: 1.2,
    envPreset: 'city',
    grain: 'on',
  },
  dark: {
    type: 'waterPlane',
    animate: 'on',
    shader: 'defaults',
    uTime: 0,
    uSpeed: 0.4,
    uStrength: 5.4,
    uDensity: 0.5,
    uFrequency: 5.5,
    uAmplitude: 1,
    range: 'disabled',
    rangeStart: 0,
    rangeEnd: 40,
    positionX: 0,
    positionY: 0,
    positionZ: 0,
    rotationX: 0,
    rotationY: 10,
    rotationZ: 50,
    color1: '#92293a',
    color2: '#4c292f',
    color3: '#6d2d6e',
    reflection: 0.1,
    wireframe: false,
    cAzimuthAngle: 180,
    cPolarAngle: 90,
    cDistance: 4.51,
    cameraZoom: 1,
    lightType: '3d',
    brightness: 0.7,
    envPreset: 'city',
    grain: 'on',
  },
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

  return (
    <ShaderGradientCanvas style={{ width: '100%', height: '100%' }} pointerEvents="none" fov={45}>
      {/*
        Keyed by theme: the two gradients are different mesh types, and a
        compiled shader does not survive being handed a new one. This
        rebuilds the scene on a theme change and leaves the canvas — and
        its WebGL context — standing.
      */}
      <ShaderGradient key={theme} control="props" {...GRADIENTS[theme]} animate={still ? 'off' : 'on'} />
    </ShaderGradientCanvas>
  )
}
