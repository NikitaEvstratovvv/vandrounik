import { Box, Flex } from '@chakra-ui/react'
import { useId } from 'react'
import { FlagIcon } from '@/components/icons'
import { isRouteEndpoint, routeStopLabel } from '@/lib/routing/routeStops'
import type { RouteStop } from '@/types'

/** Y-offset from marker top to geographic anchor (center of bottom dot). */
export const ENDPOINT_MARKER_ANCHOR_Y = 30

const MARKER_SHADOW = '0px 2px 4px -2px rgba(0,0,0,0.1), 0px 4px 6px -1px rgba(0,0,0,0.1)'

type MapWaypointMarkerProps = {
  stop: RouteStop
  isSelected: boolean
}

function EndpointFlagDisc({ filterId }: { filterId: string }) {
  return (
    <svg
      width={36}
      height={36}
      viewBox="0 0 36 36"
      fill="none"
      aria-hidden="true"
      style={{ display: 'block' }}
    >
      <g filter={`url(#${filterId})`}>
        <circle cx={18} cy={14} r={12} fill="#171717" />
        <circle cx={18} cy={14} r={12.5} stroke="white" />
      </g>
      <defs>
        <filter
          id={filterId}
          x={0}
          y={0}
          width={36}
          height={36}
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity={0} result="BackgroundImageFix" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feMorphology radius={2} operator="erode" in="SourceAlpha" result="effect1_dropShadow" />
          <feOffset dy={2} />
          <feGaussianBlur stdDeviation={2} />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.1 0" />
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha2"
          />
          <feMorphology radius={1} operator="erode" in="SourceAlpha" result="effect2_dropShadow" />
          <feOffset dy={4} />
          <feGaussianBlur stdDeviation={3} />
          <feComposite in2="hardAlpha2" operator="out" />
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.1 0" />
          <feBlend mode="normal" in2="effect1_dropShadow" result="effect2_dropShadow" />
          <feBlend mode="normal" in="SourceGraphic" in2="effect2_dropShadow" result="shape" />
        </filter>
      </defs>
    </svg>
  )
}

function EndpointAnchorDot({ filterId }: { filterId: string }) {
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      style={{ display: 'block', overflow: 'visible' }}
    >
      <g filter={`url(#${filterId})`}>
        <circle cx={8} cy={4} r={2} fill="#171717" />
        <circle cx={8} cy={4} r={2.5} stroke="white" />
      </g>
      <defs>
        <filter
          id={filterId}
          x={0}
          y={0}
          width={16}
          height={16}
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity={0} result="BackgroundImageFix" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feMorphology radius={2} operator="erode" in="SourceAlpha" result="effect1_dropShadow" />
          <feOffset dy={2} />
          <feGaussianBlur stdDeviation={2} />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.1 0" />
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha2"
          />
          <feMorphology radius={1} operator="erode" in="SourceAlpha" result="effect2_dropShadow" />
          <feOffset dy={4} />
          <feGaussianBlur stdDeviation={3} />
          <feComposite in2="hardAlpha2" operator="out" />
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.1 0" />
          <feBlend mode="normal" in2="effect1_dropShadow" result="effect2_dropShadow" />
          <feBlend mode="normal" in="SourceGraphic" in2="effect2_dropShadow" result="shape" />
        </filter>
      </defs>
    </svg>
  )
}

/** Маркер точки на интерактивной карте (Figma Waypoint Marker, node 263:808). */
export function MapWaypointMarker({ stop, isSelected }: MapWaypointMarkerProps) {
  const flagFilterId = `endpoint-flag-${useId().replace(/:/g, '')}`
  const dotFilterId = `endpoint-dot-${useId().replace(/:/g, '')}`

  const selectionOutline = isSelected
    ? { outline: '2px solid', outlineColor: 'primary', outlineOffset: '2px' }
    : {}

  if (isRouteEndpoint(stop)) {
    return (
      <Flex
        direction="column"
        align="center"
        w="24px"
        gap="4px"
        flexShrink={0}
        borderRadius="sm"
        {...selectionOutline}
      >
        <Box position="relative" w="24px" h="24px" flexShrink={0} overflow="visible">
          <Box position="absolute" top="-2px" left="50%" transform="translateX(-50%)" pointerEvents="none">
            <EndpointFlagDisc filterId={flagFilterId} />
          </Box>
          <Box
            position="absolute"
            left="4px"
            top="4px"
            w="16px"
            h="16px"
            display="flex"
            alignItems="center"
            justifyContent="center"
            color="primaryFg"
            pointerEvents="none"
          >
            <FlagIcon size={14} />
          </Box>
        </Box>
        <Box position="relative" w="24px" h="4px" flexShrink={0} overflow="visible">
          <Box position="absolute" top="-2px" left="50%" transform="translateX(-50%)" pointerEvents="none">
            <EndpointAnchorDot filterId={dotFilterId} />
          </Box>
        </Box>
      </Flex>
    )
  }

  return (
    <Box
      w="20px"
      h="20px"
      flexShrink={0}
      display="flex"
      alignItems="center"
      justifyContent="center"
      bg="primary"
      color="primaryFg"
      border="1px solid"
      borderColor="background"
      borderRadius="sm"
      fontSize="xs"
      fontWeight="medium"
      lineHeight="xs"
      boxShadow={MARKER_SHADOW}
      {...selectionOutline}
    >
      {routeStopLabel(stop)}
    </Box>
  )
}
