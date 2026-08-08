import { Box, Flex, Text, chakra } from '@chakra-ui/react'
import type { FormEvent, ReactNode } from 'react'
import { Screen } from '@/components/Screen'
import { GoogleIcon } from '@/components/icons'

type AuthShellProps = {
  children: ReactNode
}

/**
 * Общий каркас auth: splash-фон + frosted card снизу.
 * Figma authorization 304:2246 / card 320:1692.
 * Обводка карточки: linear #000→#fff→#000 @ 16%, stroke 2px.
 */
const AUTH_CARD_STROKE =
  'linear-gradient(90deg, rgba(0,0,0,0.16) 0%, rgba(255,255,255,0.16) 50%, rgba(0,0,0,0.16) 100%)'

export function AuthShell({ children }: AuthShellProps) {
  return (
    <Screen>
      <Box position="relative" flex="1" bg="background" overflow="hidden">
        <Box
          position="absolute"
          inset="0"
          backgroundImage="url('/figma/splash.png')"
          backgroundSize="cover"
          backgroundPosition="center"
        />

        <Box
          position="absolute"
          left="8px"
          right="8px"
          bottom="8px"
          p="2px"
          borderRadius="sheet"
          backgroundImage={AUTH_CARD_STROKE}
        >
          <Flex
            direction="column"
            gap="25px"
            px="16px"
            pt="24px"
            pb="16px"
            bg="rgba(255,255,255,0.8)"
            backdropFilter="blur(4px)"
            borderRadius="22px"
            overflow="hidden"
          >
            <Flex direction="column" gap="8px" w="full" color="black">
              <Text
                w="full"
                fontFamily="heading"
                fontWeight="bold"
                fontSize="wordmark"
                lineHeight="1"
              >
                VANDROǓNIK
              </Text>
              <Text w="full" fontFamily="heading" fontWeight="normal" fontSize="tagline" lineHeight="1">
                Создай свое путешествие
              </Text>
            </Flex>

            {children}
          </Flex>
        </Box>
      </Box>
    </Screen>
  )
}

type AuthFieldProps = {
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  placeholder: string
  type?: 'email' | 'text'
  autoComplete?: string
  invalid?: boolean
  inputMode?: 'email' | 'text' | 'numeric'
  'aria-label'?: string
}

export function AuthField({
  value,
  onChange,
  onBlur,
  placeholder,
  type = 'text',
  autoComplete,
  invalid = false,
  inputMode,
  'aria-label': ariaLabel,
}: AuthFieldProps) {
  return (
    <Box
      w="full"
      h="48px"
      bg="background"
      border="1px solid"
      borderColor={invalid ? 'destructive' : 'line'}
      borderRadius="pill"
      overflow="hidden"
      flexShrink={0}
      transition="border-color 150ms"
      _focusWithin={invalid ? undefined : { borderColor: 'primary' }}
    >
      <chakra.input
        value={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        type={type}
        autoComplete={autoComplete}
        inputMode={inputMode}
        aria-label={ariaLabel ?? placeholder}
        aria-invalid={invalid || undefined}
        w="full"
        h="full"
        px="15px"
        bg="transparent"
        border="none"
        outline="none"
        color="primary"
        fontFamily="body"
        fontSize="sm"
        fontWeight="normal"
        lineHeight="sm"
        _placeholder={{ color: 'muted' }}
      />
    </Box>
  )
}

type AuthFieldErrorProps = {
  children: string
}

/** Красный текст под полем — Figma 320:1734, без тултипа. */
export function AuthFieldError({ children }: AuthFieldErrorProps) {
  return (
    <Text
      w="full"
      fontFamily="body"
      fontSize="sm"
      fontWeight="normal"
      lineHeight="sm"
      color="destructive"
    >
      {children}
    </Text>
  )
}

type GoogleAuthButtonProps = {
  onClick: () => void
}

/**
 * Google CTA — 1:1 Figma 320:1699:
 * secondary bg, foreground border, h=46, radius 20, gap 10, remix/google 24.
 */
export function GoogleAuthButton({ onClick }: GoogleAuthButtonProps) {
  return (
    <chakra.button
      type="button"
      onClick={onClick}
      w="full"
      h="46px"
      display="flex"
      alignItems="center"
      justifyContent="center"
      gap="10px"
      px="16px"
      py="9px"
      bg="secondary"
      color="foreground"
      border="1px solid"
      borderColor="foreground"
      borderRadius="card"
      fontFamily="body"
      fontSize="base"
      fontWeight="medium"
      lineHeight="base"
      cursor="pointer"
      transition="opacity 150ms"
      _hover={{ opacity: 0.85 }}
    >
      <Box as="span" display="inline-flex" color="foreground" flexShrink={0} boxSize="24px">
        <GoogleIcon size={24} />
      </Box>
      Войти через Google
    </chakra.button>
  )
}

type AuthFormProps = {
  onSubmit: () => void
  children: ReactNode
}

export function AuthForm({ onSubmit, children }: AuthFormProps) {
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    onSubmit()
  }
  return (
    <chakra.form
      onSubmit={handleSubmit}
      noValidate
      display="flex"
      flexDirection="column"
      gap="16px"
      w="full"
    >
      {children}
    </chakra.form>
  )
}

type AuthSubmitProps = {
  children?: ReactNode
}

/**
 * Primary «Войти» — 1:1 Figma 320:1698:
 * primary fill, h=48, radius 20, shadow btn, без disabled-opacity в макете.
 */
export function AuthSubmit({ children = 'Войти' }: AuthSubmitProps) {
  return (
    <chakra.button
      type="submit"
      w="full"
      h="48px"
      display="flex"
      alignItems="center"
      justifyContent="center"
      px="16px"
      py="8px"
      bg="primary"
      color="primaryFg"
      border="none"
      fontFamily="body"
      fontSize="base"
      fontWeight="medium"
      lineHeight="base"
      borderRadius="card"
      boxShadow="btn"
      cursor="pointer"
      transition="opacity 150ms"
      _hover={{ opacity: 0.85 }}
    >
      {children}
    </chakra.button>
  )
}
