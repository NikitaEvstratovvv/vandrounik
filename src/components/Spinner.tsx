import { Box } from '@chakra-ui/react'

type SpinnerProps = { size?: number }

/**
 * Индикатор загрузки — hugeicons/loading-03 (8 спиц).
 * Иконка 1:1 с Figma-ассетом; вращение через steps(8).
 */
export function Spinner({ size = 40 }: SpinnerProps) {
  return (
    <Box
      as="span"
      display="inline-flex"
      color="foreground"
      w={`${size}px`}
      h={`${size}px`}
      css={{
        animation: 'vandr-spin 0.9s steps(8) infinite',
        '@keyframes vandr-spin': {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
      }}
    >
      <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="M10 1V4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="1" />
        <path d="M16.3635 3.63574L14.2422 5.75706" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.875" />
        <path d="M19 10L16 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.75" />
        <path d="M16.3635 16.3635L14.2422 14.2422" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.625" />
        <path d="M10 16V19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
        <path d="M5.75804 14.2422L3.63672 16.3635" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.375" />
        <path d="M4 10L1 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.25" />
        <path d="M5.75804 5.75706L3.63672 3.63574" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.18" />
      </svg>
    </Box>
  )
}
