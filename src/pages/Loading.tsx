import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Flex, Text } from '@chakra-ui/react'
import { Screen } from '@/components/Screen'
import { Header } from '@/components/Header'
import { EmblemLoader } from '@/components/EmblemLoader'
import { generateMockRoutes } from '@/lib/routing/generateMockRoutes'
import { saveGeneration } from '@/lib/storage/generation'
import { useWizard } from '@/store/wizard-context'

const LOADER_TEXTS = ['Ищем места...', 'Строим маршрут...', 'Почти готово...']
const MIN_LOADING_MS = 2500

/** L1 — Загрузка / генерация маршрута. 1:1 с Figma (node 149:838). */
export function Loading() {
  const navigate = useNavigate()
  const { state, canGenerate } = useWizard()
  const [textIndex, setTextIndex] = useState(0)
  const startedRef = useRef(false)

  useEffect(() => {
    if (!canGenerate) {
      navigate('/plan', { replace: true })
    }
  }, [canGenerate, navigate])

  useEffect(() => {
    const interval = setInterval(() => {
      setTextIndex((i) => (i + 1) % LOADER_TEXTS.length)
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!canGenerate || startedRef.current) return
    startedRef.current = true

    const startedAt = Date.now()

    const run = async () => {
      const result = generateMockRoutes(state)
      const elapsed = Date.now() - startedAt
      const remaining = Math.max(0, MIN_LOADING_MS - elapsed)
      if (remaining > 0) {
        await new Promise((resolve) => setTimeout(resolve, remaining))
      }
      saveGeneration(result)
      navigate('/plan/results', { replace: true })
    }

    void run()
  }, [canGenerate, navigate, state])

  return (
    <Screen>
      <Header variant="main" />

      <Flex direction="column" flex="1" minH="0" align="center" justify="center" gap="16px" px="16px" pb="16px">
        <EmblemLoader size={64} />
        <Text
          key={textIndex}
          w="328px"
          maxW="full"
          fontSize="sm"
          fontWeight="normal"
          lineHeight="sm"
          color="primary"
          textAlign="center"
          css={{
            animation: 'vandr-fade-in 300ms ease-out',
            '@keyframes vandr-fade-in': { from: { opacity: 0 }, to: { opacity: 1 } },
          }}
        >
          {LOADER_TEXTS[textIndex]}
        </Text>
      </Flex>
    </Screen>
  )
}
