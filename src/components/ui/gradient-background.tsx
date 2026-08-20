'use client'

import { ShaderGradient, ShaderGradientCanvas } from '@shadergradient/react'
import { useSyncExternalStore } from 'react'

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

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
      <ShaderGradientCanvas
        style={{ width: '100%', height: '100%' }}
        pointerEvents="none"
        fov={45}
      >
        <ShaderGradient
          animate={still ? 'off' : 'on'}
          axesHelper="off"
          brightness={1.2}
          cAzimuthAngle={180}
          cDistance={38}
          cPolarAngle={90}
          cameraZoom={1}
          color1="#ff5005"
          color2="#dbba95"
          color3="#8a0000"
          destination="onCanvas"
          embedMode="off"
          envPreset="city"
          format="gif"
          fov={45}
          frameRate={10}
          gizmoHelper="hide"
          grain="on"
          lightType="3d"
          pixelDensity={1}
          positionX={-1.4}
          positionY={0}
          positionZ={0}
          range="disabled"
          rangeEnd={40}
          rangeStart={0}
          reflection={0.1}
          rotationX={0}
          rotationY={10}
          rotationZ={50}
          shader="defaults"
          type="sphere"
          uAmplitude={1}
          uDensity={1.3}
          uFrequency={5.5}
          uSpeed={0.4}
          uStrength={4}
          uTime={0}
          wireframe={false}
          zoomOut={false}
        />
      </ShaderGradientCanvas>
    </div>
  )
}
