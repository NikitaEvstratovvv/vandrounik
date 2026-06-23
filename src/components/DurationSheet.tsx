import { useEffect, useRef, useState } from 'react'
import { Box, chakra, Flex, Text } from '@chakra-ui/react'
import { BottomSheet } from '@/components/BottomSheet'
import { Segmented } from '@/components/Segmented'
import { PrimaryButton } from '@/components/PrimaryButton'
import { SquareButton } from '@/components/SquareButton'
import { CloseCircleIcon, CloseIcon } from '@/components/icons'
import { fetchDirectRouteKm } from '@/lib/routing/directRouteKm'
import { getRouteTarget } from '@/lib/routing/generateRoutes'
import { completeDurationForTransport, kmToHours } from '@/lib/transport/speed'
import { useWizard } from '@/store/wizard-context'
import type { DurationUnit } from '@/types'

type DurationSheetProps = {
  open: boolean
  onClose: () => void
}

function parseDurationInput(value: string): number | null {
  const numeric = Number(value)
  if (value.trim() === '' || !Number.isFinite(numeric) || numeric <= 0) return null
  return Math.round(numeric)
}

/** BS1 — bottom sheet выбора длительности. 1:1 с Figma (node 148:447). */
export function DurationSheet({ open, onClose }: DurationSheetProps) {
  const { state, setDuration } = useWizard()
  const [unit, setUnit] = useState<DurationUnit>('hours')
  const [hoursValue, setHoursValue] = useState('')
  const [kmValue, setKmValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return

    const duration = state.duration
    const hasExplicitDuration = getRouteTarget(state) !== null

    if (hasExplicitDuration && duration) {
      setUnit(duration.unit)
      setHoursValue(duration.hours != null ? String(duration.hours) : '')
      setKmValue(duration.km != null ? String(duration.km) : '')
      return
    }

    setUnit('km')
    setHoursValue('')
    setKmValue('')

    const origin = state.origin
    const destination = state.destination
    if (!origin || !destination) return

    let cancelled = false

    fetchDirectRouteKm(origin, destination, state.transport).then((routeKm) => {
      if (cancelled || routeKm === null) return
      setKmValue(String(routeKm))
      setHoursValue(String(kmToHours(routeKm, state.transport)))
    })

    return () => {
      cancelled = true
    }
  }, [open, state.duration, state.origin, state.destination, state.transport])

  const focusInput = () => {
    inputRef.current?.focus({ preventScroll: true })
  }

  const value = unit === 'hours' ? hoursValue : kmValue
  const setValue = unit === 'hours' ? setHoursValue : setKmValue
  const unitLabel = unit === 'hours' ? 'ч' : 'км'

  const apply = () => {
    const hours = parseDurationInput(hoursValue)
    const km = parseDurationInput(kmValue)
    const activeValue = unit === 'hours' ? hours : km

    if (activeValue === null) {
      setDuration(null)
    } else {
      setDuration(
        completeDurationForTransport(
          {
            unit,
            hours,
            km,
          },
          state.transport,
        ),
      )
    }
    onClose()
  }

  return (
    <BottomSheet open={open} onEntered={focusInput} onBackdropClick={onClose}>
      <Flex align="center" gap="16px" p="16px">
        <Text
          flex="1"
          minW="0"
          fontFamily="heading"
          fontWeight="semibold"
          fontSize="sheetTitle"
          lineHeight="title"
          color="black"
          textTransform="uppercase"
        >
          Длительность поездки
        </Text>
        <SquareButton variant="ghost" ariaLabel="Закрыть" onClick={onClose}>
          <CloseIcon size={20} />
        </SquareButton>
      </Flex>

      <Flex direction="column" gap="16px" pt="8px" pb="40px" px="16px">
        <Segmented<DurationUnit>
          bordered
          ariaLabel="Единица длительности"
          value={unit}
          onChange={setUnit}
          options={[
            { value: 'hours', label: 'В часах' },
            { value: 'km', label: 'В километрах' },
          ]}
        />

        <Flex
          position="relative"
          h="48px"
          w="full"
          align="center"
          pl="15px"
          pr={value ? '44px' : '15px'}
          bg="background"
          borderWidth="1px"
          borderColor="line"
          borderRadius="pill"
          cursor="text"
          onClick={() => inputRef.current?.focus()}
          _focusWithin={{ borderColor: 'primary' }}
        >
          <Flex align="center" gap="4px" minW="0">
            <chakra.input
              ref={inputRef}
              type="number"
              min={1}
              inputMode="numeric"
              value={value}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setValue(e.target.value)}
              placeholder="0"
              w={`${Math.max(1, value.length || 1)}ch`}
              minW="1ch"
              maxW="full"
              h="full"
              border="none"
              outline="none"
              bg="transparent"
              color={value ? 'primary' : 'muted'}
              fontFamily="body"
              fontSize="sm"
              lineHeight="sm"
              _placeholder={{ color: 'muted' }}
            />
            <Text fontSize="sm" lineHeight="sm" color="muted" flexShrink={0}>
              {unitLabel}
            </Text>
          </Flex>
          {value && (
            <Box
              as="button"
              aria-label="Очистить"
              position="absolute"
              right="11px"
              color="muted"
              cursor="pointer"
              onClick={(e) => {
                e.stopPropagation()
                setValue('')
                inputRef.current?.focus()
              }}
              _hover={{ opacity: 0.7 }}
            >
              <CloseCircleIcon size={24} />
            </Box>
          )}
        </Flex>
      </Flex>

      <Box p="16px">
        <PrimaryButton onClick={apply}>Сохранить</PrimaryButton>
      </Box>
    </BottomSheet>
  )
}
