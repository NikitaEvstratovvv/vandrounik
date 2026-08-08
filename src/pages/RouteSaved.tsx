import { Box, Flex, Image, Text, chakra } from '@chakra-ui/react'
import { PrimaryButton } from '@/components/PrimaryButton'
import type { SavedTrip } from '@/lib/storage/trips'

type RouteSavedPanelProps = {
  trip: SavedTrip
  onClose: () => void
  onOpenTrip?: (trip: SavedTrip) => void
  onGoToTrips?: () => void
}

/** E4 — маршрут сохранён. Figma 301:1140. */
export function RouteSavedPanel({ trip, onClose, onOpenTrip, onGoToTrips }: RouteSavedPanelProps) {
  const title = trip.variant.title

  return (
    <Flex direction="column" h="full" minH="0" bg="screen">
      <Flex
        flex="1"
        direction="column"
        align="center"
        justify="center"
        p="16px"
        gap="40px"
        minH="0"
        overflow="hidden"
      >
        <Flex
          flex="1"
          direction="column"
          align="center"
          justify="center"
          gap="16px"
          minH="0"
          w="full"
        >
          <Box boxSize="200px" flexShrink={0} overflow="hidden">
            <Image
              src="/figma/route-saved-stork.png"
              alt=""
              w="full"
              h="full"
              objectFit="contain"
            />
          </Box>
          <Text
            fontFamily="heading"
            fontWeight="semibold"
            fontSize="sheetTitle"
            lineHeight="title"
            color="primary"
            textAlign="center"
            textTransform="uppercase"
            w="full"
          >
            {`Маршрут ${title} сохранен`}
          </Text>
          <Text
            fontSize="sm"
            fontWeight="normal"
            lineHeight="sm"
            color="primary"
            textAlign="center"
            w="full"
          >
            Можете начать поездку или посмотреть все&nbsp;сохраненные маршруты
          </Text>
        </Flex>

        <Flex direction="column" gap="8px" w="full" flexShrink={0}>
          <PrimaryButton onClick={() => (onOpenTrip ? onOpenTrip(trip) : onClose())}>
            Открыть маршрут
          </PrimaryButton>
          <chakra.button
            type="button"
            onClick={() => (onGoToTrips ? onGoToTrips() : onClose())}
            w="full"
            h="46px"
            display="flex"
            alignItems="center"
            justifyContent="center"
            px="16px"
            py="9px"
            bg="secondary"
            color="foreground"
            borderRadius="card"
            fontFamily="body"
            fontSize="base"
            fontWeight="medium"
            lineHeight="base"
            cursor="pointer"
            transition="opacity 150ms"
            _hover={{ opacity: 0.85 }}
          >
            Перейти к моим маршрутам
          </chakra.button>
        </Flex>
      </Flex>
    </Flex>
  )
}
