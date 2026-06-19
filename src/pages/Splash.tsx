import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Flex, Text } from '@chakra-ui/react'
import { Screen } from '@/components/Screen'
import { EmblemLoader } from '@/components/EmblemLoader'

/** E0 — Splash / загрузка PWA. 1:1 с Figma (node 120:361). Авто-переход на /plan. */
export function Splash() {
  const navigate = useNavigate()

  useEffect(() => {
    const t = setTimeout(() => navigate('/plan', { replace: true }), 1800)
    return () => clearTimeout(t)
  }, [navigate])

  return (
    <Screen>
      <Box position="relative" flex="1" bg="background" overflow="hidden">
        {/* Фоновое изображение */}
        <Box
          position="absolute"
          inset="0"
          backgroundImage="url('/figma/splash.png')"
          backgroundSize="cover"
          backgroundPosition="center"
        />

        {/* Нижняя панель с размытием */}
        <Flex
          position="absolute"
          left="0"
          right="0"
          bottom="0"
          direction="column"
          align="flex-end"
          gap="8px"
          px="16px"
          py="24px"
          bg="rgba(255,255,255,0.8)"
          backdropFilter="blur(2px)"
          overflow="hidden"
        >
          <Text
            w="full"
            fontFamily="heading"
            fontWeight="bold"
            fontSize="wordmark"
            lineHeight="1"
            color="black"
          >
            VANDROǓNIK
          </Text>

          <Box position="absolute" right="16px" top="22px">
            <EmblemLoader size={56} />
          </Box>

          <Text w="full" fontFamily="heading" fontWeight="normal" fontSize="tagline" lineHeight="1" color="black">
            Создай свое путешествие
          </Text>
        </Flex>
      </Box>
    </Screen>
  )
}
