import { Box, Flex } from '@chakra-ui/react'
import { useEffect, useRef, useState, type ReactNode } from 'react'

const DURATION_MS = 280
const EASE = 'cubic-bezier(0.4, 0, 0.2, 1)'
const SHEET_TRANSITION = `transform ${DURATION_MS}ms ${EASE}`
const BACKDROP_TRANSITION = `opacity ${DURATION_MS}ms ${EASE}`

type BottomSheetProps = {
  open: boolean
  onExited?: () => void
  onEntered?: () => void
  onBackdropClick: () => void
  children: ReactNode
}

/** Bottom sheet со slide-in/out снизу и затемнением фона. */
export function BottomSheet({ open, onExited, onEntered, onBackdropClick, children }: BottomSheetProps) {
  const [visible, setVisible] = useState(false)
  const [motionReady, setMotionReady] = useState(false)
  const onExitedRef = useRef(onExited)
  const onEnteredRef = useRef(onEntered)

  useEffect(() => {
    onExitedRef.current = onExited
  }, [onExited])

  useEffect(() => {
    onEnteredRef.current = onEntered
  }, [onEntered])

  useEffect(() => {
    if (open) {
      setVisible(false)
      setMotionReady(false)
      const frame = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setMotionReady(true)
          setVisible(true)
        })
      })
      return () => cancelAnimationFrame(frame)
    }

    setMotionReady(true)
    setVisible(false)
  }, [open])

  const handleSheetTransitionEnd = (event: React.TransitionEvent) => {
    if (event.target !== event.currentTarget) return
    if (event.propertyName !== 'transform') return

    if (open) {
      onEnteredRef.current?.()
      return
    }

    onExitedRef.current?.()
  }

  return (
    <Box
      position="absolute"
      inset={0}
      zIndex={20}
      pointerEvents={open || visible ? 'auto' : 'none'}
      aria-hidden={!open && !visible}
    >
      <Box
        position="absolute"
        inset={0}
        bg="primary"
        opacity={visible ? 0.24 : 0}
        transition={motionReady ? BACKDROP_TRANSITION : 'none'}
        onClick={onBackdropClick}
      />

      <Flex
        direction="column"
        position="absolute"
        left={0}
        right={0}
        bottom={0}
        bg="background"
        borderTopRadius="sheet"
        overflow="hidden"
        transform={visible ? 'translate3d(0, 0, 0)' : 'translate3d(0, 100%, 0)'}
        transition={motionReady ? SHEET_TRANSITION : 'none'}
        willChange="transform"
        onTransitionEnd={handleSheetTransitionEnd}
      >
        {children}
      </Flex>
    </Box>
  )
}
