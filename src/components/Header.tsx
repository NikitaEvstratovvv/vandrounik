import { Box, Flex, Image, Text } from '@chakra-ui/react'
import { ChevronLeft } from '@/components/icons'

type HeaderProps =
  | { variant: 'main' }
  | { variant: 'title'; title: string }
  | { variant: 'back'; title: string; onBack: () => void }

/**
 * Шапка экрана.
 * main — логотип-надпись (240×48), title — Oswald uppercase без назад,
 * back — стрелка + заголовок Oswald uppercase.
 * Высота 80px, px-16 py-20 (1:1 с Figma node 126:129 / 145:443 / 272:1206).
 */
export function Header(props: HeaderProps) {
  if (props.variant === 'main') {
    return (
      <Flex as="header" h="80px" align="center" px="16px" py="20px" flexShrink={0}>
        <Image src="/figma/logo.svg" alt="Vandrounik" h="48px" w="240px" />
      </Flex>
    )
  }

  if (props.variant === 'title') {
    return (
      <Flex as="header" h="80px" align="center" gap="12px" px="16px" py="20px" flexShrink={0}>
        <Text
          flex="1"
          minW="0"
          fontFamily="heading"
          fontWeight="semibold"
          fontSize="title"
          lineHeight="title"
          color="primary"
          textTransform="uppercase"
          truncate
        >
          {props.title}
        </Text>
      </Flex>
    )
  }

  return (
    <Flex as="header" h="80px" align="center" gap="12px" px="16px" py="20px" flexShrink={0}>
      <Box
        as="button"
        aria-label="Назад"
        onClick={props.onBack}
        py="6px"
        color="primary"
        cursor="pointer"
        display="inline-flex"
        alignItems="center"
        _hover={{ opacity: 0.7 }}
      >
        <ChevronLeft size={24} />
      </Box>
      <Text
        flex="1"
        minW="0"
        fontFamily="heading"
        fontWeight="semibold"
        fontSize="title"
        lineHeight="title"
        color="primary"
        textTransform="uppercase"
        truncate
      >
        {props.title}
      </Text>
    </Flex>
  )
}
