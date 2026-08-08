import { Box, Flex, Text, VStack, chakra } from '@chakra-ui/react'
import { BottomSheet } from '@/components/BottomSheet'
import { CloseIcon } from '@/components/icons'
import { PrimaryButton } from '@/components/PrimaryButton'
import { SquareButton } from '@/components/SquareButton'

type TripManageMenuProps = {
  open: boolean
  onClose: () => void
  onCancelTrip: () => void
  onDeleteTrip: () => void
}

/** Overflow menu for in-progress trip (Figma 317:1883). */
export function TripManageMenu({ open, onClose, onCancelTrip, onDeleteTrip }: TripManageMenuProps) {
  return (
    <BottomSheet open={open} onBackdropClick={onClose} variant="inset">
      <Flex direction="column" gap="8px" px="16px" py="8px">
        <chakra.button
          type="button"
          w="full"
          py="12px"
          display="flex"
          alignItems="center"
          justifyContent="flex-start"
          borderRadius="card"
          fontSize="base"
          fontWeight="medium"
          lineHeight="base"
          color="foreground"
          cursor="pointer"
          transition="opacity 150ms"
          _hover={{ opacity: 0.85 }}
          onClick={onCancelTrip}
        >
          Отменить поездку
        </chakra.button>
        <chakra.button
          type="button"
          w="full"
          py="12px"
          display="flex"
          alignItems="center"
          justifyContent="flex-start"
          borderRadius="card"
          fontSize="base"
          fontWeight="medium"
          lineHeight="base"
          color="foreground"
          cursor="pointer"
          transition="opacity 150ms"
          _hover={{ opacity: 0.85 }}
          onClick={onDeleteTrip}
        >
          Удалить маршрут
        </chakra.button>
      </Flex>
    </BottomSheet>
  )
}

type TripConfirmSheetProps = {
  open: boolean
  title: string
  body: string
  confirmLabel: string
  onClose: () => void
  onConfirm: () => void
}

/** Delete / cancel confirmation sheet (Figma 305:2665 / 317:1963). */
export function TripConfirmSheet({
  open,
  title,
  body,
  confirmLabel,
  onClose,
  onConfirm,
}: TripConfirmSheetProps) {
  return (
    <BottomSheet open={open} onBackdropClick={onClose}>
      <Box px="16px" pt="16px" pb="16px">
        <Flex gap="8px" align="flex-start" mb="16px">
          <VStack align="stretch" gap="12px" flex="1" minW="0">
            <Text
              fontFamily="heading"
              fontWeight="semibold"
              fontSize="sheetTitle"
              lineHeight="title"
              color="primary"
              textTransform="uppercase"
            >
              {title}
            </Text>
            <Text fontSize="sm" fontWeight="normal" lineHeight="sm" color="muted">
              {body}
            </Text>
          </VStack>
          <SquareButton ariaLabel="Закрыть" onClick={onClose}>
            <CloseIcon size={16} />
          </SquareButton>
        </Flex>
        <Flex direction="column" gap="8px">
          <PrimaryButton onClick={onConfirm}>{confirmLabel}</PrimaryButton>
          <chakra.button
            type="button"
            w="full"
            h="46px"
            display="flex"
            alignItems="center"
            justifyContent="center"
            px="16px"
            bg="secondary"
            color="foreground"
            borderRadius="card"
            fontSize="base"
            fontWeight="medium"
            lineHeight="base"
            cursor="pointer"
            transition="opacity 150ms"
            _hover={{ opacity: 0.85 }}
            onClick={onClose}
          >
            Отмена
          </chakra.button>
        </Flex>
      </Box>
    </BottomSheet>
  )
}
