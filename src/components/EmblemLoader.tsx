import { useEffect, useState } from 'react'
import { Box, Image } from '@chakra-ui/react'

const FRAMES = [
  '/figma/emblem-frame-1.svg',
  '/figma/emblem-frame-2.svg',
  '/figma/emblem-frame-3.svg',
  '/figma/emblem-frame-4.svg',
] as const

/** Тайминг анимации — единый для splash, S1 и L1. */
export const EMBLEM_LOADER_FRAME_MS = 700
export const EMBLEM_LOADER_FADE_MS = 500

/** #737373 — орнамент на S1/L1 в Figma, в отличие от чёрного на splash. */
const MUTED_TONE_FILTER =
  'brightness(0) saturate(100%) invert(48%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(95%) contrast(90%)'

type EmblemLoaderProps = {
  /** 56px splash · 64px S1 · 40px L1. */
  size?: number
  /** primary — splash; muted — S1/L1. */
  tone?: 'primary' | 'muted'
}

/**
 * Анимированный орнамент из Figma loader (node 85:458).
 * 4 кадра: Frame 11 → 14 → 17 → 18 с плавным crossfade.
 */
export function EmblemLoader({ size = 56, tone = 'primary' }: EmblemLoaderProps) {
  const [frame, setFrame] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setFrame((current) => (current + 1) % FRAMES.length)
    }, EMBLEM_LOADER_FRAME_MS)
    return () => clearInterval(interval)
  }, [])

  return (
    <Box
      position="relative"
      boxSize={`${size}px`}
      flexShrink={0}
      overflow="hidden"
      bg="transparent"
      aria-hidden="true"
    >
      {FRAMES.map((src, index) => (
        <Image
          key={src}
          src={src}
          alt=""
          position="absolute"
          inset="0"
          boxSize="100%"
          objectFit="contain"
          opacity={index === frame ? 1 : 0}
          css={{
            transition: `opacity ${EMBLEM_LOADER_FADE_MS}ms ease-in-out`,
            willChange: 'opacity',
            filter: tone === 'muted' ? MUTED_TONE_FILTER : undefined,
          }}
        />
      ))}
    </Box>
  )
}
