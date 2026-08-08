import { Box, Flex } from '@chakra-ui/react'

type Option<T extends string> = { value: T; label: string }

type SegmentedProps<T extends string> = {
  options: Option<T>[]
  value: T
  onChange: (value: T) => void
  ariaLabel?: string
  /** Рамка вокруг контейнера (используется в bottom sheet). */
  bordered?: boolean
}

/**
 * Segmented control. Контейнер white rounded-card(20) p-4.
 * Активный сегмент: primary fill, rounded-16, shadow. 1:1 с Figma (node 132:290).
 */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  bordered = false,
}: SegmentedProps<T>) {
  const activeIndex = Math.max(
    0,
    options.findIndex((opt) => opt.value === value),
  )

  return (
    <Flex
      role="tablist"
      aria-label={ariaLabel}
      position="relative"
      bg="background"
      borderRadius="card"
      p="4px"
      w="full"
      overflow="hidden"
      borderWidth={bordered ? '1px' : '0'}
      borderColor="line"
    >
      <Box
        aria-hidden
        position="absolute"
        top="4px"
        left="4px"
        h="36px"
        w={`calc((100% - 8px) / ${options.length})`}
        borderRadius="seg"
        bg="primary"
        boxShadow="btn"
        pointerEvents="none"
        zIndex={0}
        transform={`translateX(calc(${activeIndex} * 100%))`}
        transition="transform 280ms cubic-bezier(0.4, 0, 0.2, 1)"
      />

      {options.map((opt) => {
        const active = opt.value === value
        return (
          <Box
            key={opt.value}
            as="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            flex="1"
            minW="0"
            h="36px"
            display="flex"
            alignItems="center"
            justifyContent="center"
            px="16px"
            py="8px"
            position="relative"
            zIndex={1}
            fontFamily="body"
            fontSize="sm"
            fontWeight="medium"
            lineHeight="sm"
            whiteSpace="nowrap"
            cursor="pointer"
            bg="transparent"
            color={active ? 'primaryFg' : 'foreground'}
            borderRadius="seg"
            transition="color 280ms cubic-bezier(0.4, 0, 0.2, 1)"
          >
            {opt.label}
          </Box>
        )
      })}
    </Flex>
  )
}
