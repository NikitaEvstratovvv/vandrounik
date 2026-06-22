import { useEffect, useRef, useState } from 'react'
import { Box, chakra, Flex, Image, Text } from '@chakra-ui/react'
import { Header } from '@/components/Header'
import { EmblemLoader } from '@/components/EmblemLoader'
import { SearchIcon, CloseCircleIcon } from '@/components/icons'
import { searchPlaces } from '@/data/places'
import { useWizard } from '@/store/wizard-context'
import { formatDistance } from '@/lib/format'
import type { Place } from '@/types'

type SearchState = 'empty' | 'loading' | 'results' | 'nothing' | 'error'

type LocationPanelProps = {
  point: 'origin' | 'destination'
  onClose: () => void
  /** Инкремент после завершения анимации открытия — фокус в поле поиска. */
  focusSeq?: number
}

/** S1 — Выбор направления (поиск «Откуда» / «Куда»). 1:1 с Figma (node 138:330 / 142:545). */
export function LocationPanel({ point, onClose, focusSeq = 0 }: LocationPanelProps) {
  const { state, setOrigin, setDestination } = useWizard()

  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<SearchState>('empty')
  const [results, setResults] = useState<Place[]>([])
  const reqId = useRef(0)
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setQuery('')
    setStatus('empty')
    setResults([])
    reqId.current++
    if (debounce.current) clearTimeout(debounce.current)
  }, [point])

  useEffect(() => {
    if (focusSeq === 0) return
    inputRef.current?.focus({ preventScroll: true })
  }, [focusSeq])

  const handleQueryChange = (value: string) => {
    setQuery(value)
    if (debounce.current) clearTimeout(debounce.current)

    const q = value.trim()
    if (!q) {
      reqId.current++
      setStatus('empty')
      setResults([])
      return
    }

    setStatus('loading')
    const current = ++reqId.current
    debounce.current = setTimeout(async () => {
      try {
        const near = point === 'destination' && state.origin ? state.origin : undefined
        const found = await searchPlaces(q, { near })
        if (current !== reqId.current) return
        setResults(found)
        setStatus(found.length > 0 ? 'results' : 'nothing')
      } catch {
        if (current !== reqId.current) return
        setResults([])
        setStatus('error')
      }
    }, 300)
  }

  const handleSelect = (place: Place) => {
    if (point === 'destination') setDestination(place)
    else setOrigin(place)
    onClose()
  }

  const emptyText =
    point === 'destination'
      ? 'Укажите место, куда хотите приехать'
      : 'Укажите место, откуда хотите начать поездку'

  return (
    <>
      <Header variant="back" title={point === 'destination' ? 'Куда' : 'Откуда'} onBack={onClose} />

      <Box px="16px" pb="16px">
        <Flex
          position="relative"
          align="center"
          h="48px"
          w="full"
          bg="background"
          borderWidth="1px"
          borderColor="line"
          borderRadius="pill"
          overflow="hidden"
        >
          <Box position="absolute" left="11px" color="primary" pointerEvents="none">
            <SearchIcon size={24} />
          </Box>
          <chakra.input
            ref={inputRef}
            value={query}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleQueryChange(e.target.value)}
            placeholder="Название города или улицы"
            w="full"
            h="full"
            pl="47px"
            pr="44px"
            border="none"
            outline="none"
            bg="transparent"
            color="primary"
            fontFamily="body"
            fontSize="sm"
            lineHeight="sm"
            _placeholder={{ color: 'muted' }}
          />
          {query && (
            <Box
              as="button"
              aria-label="Очистить"
              onClick={() => handleQueryChange('')}
              position="absolute"
              right="11px"
              color="muted"
              cursor="pointer"
              _hover={{ opacity: 0.7 }}
            >
              <CloseCircleIcon size={24} />
            </Box>
          )}
        </Flex>
      </Box>

      <Flex flex="1" minH="0" direction="column" px="16px" overflow="hidden">
        {(status === 'empty' || status === 'nothing' || status === 'loading' || status === 'error') && (
          <Flex flex="1" direction="column" align="center" justify="center" gap="16px">
            {status === 'empty' && <EmptyState text={emptyText} variant="empty" />}
            {status === 'nothing' && <EmptyState text="Ничего не найдено" variant="nothing" />}
            {status === 'loading' && <EmblemLoader size={64} />}
            {status === 'error' && <EmptyState text="Не удалось выполнить поиск. Проверьте интернет и попробуйте ещё раз" variant="nothing" />}
          </Flex>
        )}
        {status === 'results' && (
          <Box flex="1" minH="0" overflowY="auto">
            <Flex direction="column" gap="8px">
              {results.map((place, idx) => (
                <Box key={place.id}>
                  <Flex
                    as="button"
                    w="full"
                    direction="column"
                    align="flex-start"
                    gap="2px"
                    textAlign="left"
                    py="5px"
                    cursor="pointer"
                    onClick={() => handleSelect(place)}
                    _hover={{ opacity: 0.7 }}
                  >
                    <Text fontSize="sm" fontWeight="semibold" lineHeight="sm" color="primary" w="full">
                      {place.title}
                    </Text>
                    <Text fontSize="xs" fontWeight="normal" lineHeight="xs" color="muted" w="full">
                      {place.distanceKm && place.distanceKm > 0 ? formatDistance(place.distanceKm) : place.subtitle}
                    </Text>
                  </Flex>
                  {idx < results.length - 1 && <Box h="1px" w="full" bg="line" />}
                </Box>
              ))}
            </Flex>
          </Box>
        )}
      </Flex>
    </>
  )
}

function EmptyState({ text, variant }: { text: string; variant: 'empty' | 'nothing' }) {
  return (
    <>
      <Box boxSize="160px" position="relative" overflow="hidden" flexShrink={0}>
        {variant === 'nothing' ? (
          <Image src="/figma/nothing-found.png" alt="" boxSize="160px" objectFit="contain" />
        ) : (
          <Image
            src="/figma/illustration.png"
            alt=""
            position="absolute"
            w="380.2%"
            h="253.47%"
            left="-140.1%"
            top="-76.73%"
            maxW="none"
          />
        )}
      </Box>
      <Text fontSize="sm" fontWeight="normal" lineHeight="sm" color="primary" textAlign="center" w="159px">
        {text}
      </Text>
    </>
  )
}
