import { Box, Flex, Image, Text, chakra } from '@chakra-ui/react'
import { PrimaryButton } from '@/components/PrimaryButton'
import { ProfileFadeIn } from '@/components/ProfileChrome'

type TripCompletedPanelProps = {
  onNewRoute: () => void
  onBackToRoute: () => void
}

/** Celebration after all POIs visited (Figma 305:2410). */
export function TripCompletedPanel({ onNewRoute, onBackToRoute }: TripCompletedPanelProps) {
  return (
    <Flex direction="column" h="full" minH="0" bg="screen">
      <ProfileFadeIn
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
            Поездка завершена
          </Text>
          <Text
            fontSize="sm"
            fontWeight="normal"
            lineHeight="sm"
            color="primary"
            textAlign="center"
            w="full"
          >
            Возвращайтесь по скорее и&nbsp;отправляйтесь в&nbsp;новое путешествие
          </Text>
        </Flex>

        <Flex direction="column" gap="8px" w="full" flexShrink={0}>
          <PrimaryButton onClick={onNewRoute}>Подобрать новый маршрут</PrimaryButton>
          <chakra.button
            type="button"
            onClick={onBackToRoute}
            w="full"
            h="48px"
            display="flex"
            alignItems="center"
            justifyContent="center"
            px="16px"
            py="12px"
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
            Вернуться к маршруту
          </chakra.button>
        </Flex>
      </ProfileFadeIn>
    </Flex>
  )
}
