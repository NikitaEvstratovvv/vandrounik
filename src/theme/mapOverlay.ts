/** Frosted bar поверх карты — Figma node 215:908 / 215:913. */
const MAP_FROST_BLUR = 'blur(12px)'

/** Градиентный слой blur: сильнее у края экрана, плавно исчезает к карте. */
export const mapFrostedGradientLayer = {
  top: {
    backdropFilter: MAP_FROST_BLUR,
    WebkitBackdropFilter: MAP_FROST_BLUR,
    bg: 'rgba(255,255,255,0.01)',
    maskImage: 'linear-gradient(to bottom, black 0%, black 45%, transparent 100%)',
    WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 45%, transparent 100%)',
  },
  bottom: {
    backdropFilter: MAP_FROST_BLUR,
    WebkitBackdropFilter: MAP_FROST_BLUR,
    bg: 'rgba(255,255,255,0.01)',
    maskImage: 'linear-gradient(to top, black 0%, black 45%, transparent 100%)',
    WebkitMaskImage: 'linear-gradient(to top, black 0%, black 45%, transparent 100%)',
  },
} as const

/** Равномерный blur (legacy) — предпочтительнее gradient layer. */
export const mapFrostedBarStyle = {
  backdropFilter: MAP_FROST_BLUR,
  WebkitBackdropFilter: MAP_FROST_BLUR,
  bg: 'rgba(255,255,255,0.01)',
} as const
