import { Box, Flex } from '@chakra-ui/react'
import { useEffect, useRef, useState, type ReactNode } from 'react'

const DURATION_MS = 280
const EASE = 'cubic-bezier(0.4, 0, 0.2, 1)'
const SHEET_TRANSITION = `transform ${DURATION_MS}ms ${EASE}`
const BACKDROP_TRANSITION = `opacity ${DURATION_MS}ms ${EASE}`
/** Inset sheet floats 8px above the bottom — exit must clear this gap too. */
const INSET_OFFSET_PX = 8
const DISMISS_DISTANCE_PX = 96
const DISMISS_VELOCITY_PX_MS = 0.55

type BottomSheetProps = {
  open: boolean
  onExited?: () => void
  onEntered?: () => void
  onBackdropClick: () => void
  /**
   * `flush` — full-bleed, top corners only (default).
   * `inset` — floating card: 8px sides/bottom, full radius + shadow (Figma 317:1883).
   */
  variant?: 'flush' | 'inset'
  /** Полоска сверху + свайп вниз для закрытия. */
  dragToDismiss?: boolean
  /** Растянуть панель на всю высоту контейнера. */
  fullHeight?: boolean
  children: ReactNode
}

/** Bottom sheet со slide-in/out снизу и затемнением фона. */
export function BottomSheet({
  open,
  onExited,
  onEntered,
  onBackdropClick,
  variant = 'flush',
  dragToDismiss = false,
  fullHeight = false,
  children,
}: BottomSheetProps) {
  const [visible, setVisible] = useState(false)
  const [motionReady, setMotionReady] = useState(false)
  const [dragY, setDragY] = useState(0)
  const [dragging, setDragging] = useState(false)
  const onExitedRef = useRef(onExited)
  const onEnteredRef = useRef(onEntered)
  const onBackdropClickRef = useRef(onBackdropClick)
  const dragRef = useRef<{
    pointerId: number
    startY: number
    startT: number
  } | null>(null)
  const inset = variant === 'inset'

  useEffect(() => {
    onExitedRef.current = onExited
  }, [onExited])

  useEffect(() => {
    onEnteredRef.current = onEntered
  }, [onEntered])

  useEffect(() => {
    onBackdropClickRef.current = onBackdropClick
  }, [onBackdropClick])

  useEffect(() => {
    if (open) {
      setVisible(false)
      setMotionReady(false)
      setDragY(0)
      setDragging(false)
      dragRef.current = null
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
    setDragY(0)
    setDragging(false)
    dragRef.current = null
  }, [open])

  const handleSheetTransitionEnd = (event: React.TransitionEvent) => {
    if (event.target !== event.currentTarget) return
    if (event.propertyName !== 'transform') return
    if (dragging) return

    if (open) {
      onEnteredRef.current?.()
      return
    }

    onExitedRef.current?.()
  }

  const onHandlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragToDismiss || !open || !visible) return
    dragRef.current = {
      pointerId: e.pointerId,
      startY: e.clientY,
      startT: performance.now(),
    }
    setDragging(true)
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const onHandlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== e.pointerId) return
    setDragY(Math.max(0, e.clientY - drag.startY))
  }

  const endHandleDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== e.pointerId) return

    const dy = Math.max(0, e.clientY - drag.startY)
    const totalMs = Math.max(16, performance.now() - drag.startT)
    const avgVelocity = dy / totalMs

    dragRef.current = null
    setDragging(false)

    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }

    // Short tap on the handle also dismisses; longer drag needs distance/velocity.
    if (dy < 8 || dy >= DISMISS_DISTANCE_PX || avgVelocity >= DISMISS_VELOCITY_PX_MS) {
      setDragY(0)
      onBackdropClickRef.current()
      return
    }

    setDragY(0)
  }

  const backdropOpacity = visible
    ? Math.max(0, 0.24 * (1 - Math.min(1, dragY / 240)))
    : 0

  const sheetTransform = visible
    ? `translate3d(0, ${dragY}px, 0)`
    : inset
      ? `translate3d(0, calc(100% + ${INSET_OFFSET_PX}px), 0)`
      : 'translate3d(0, 100%, 0)'

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
        opacity={backdropOpacity}
        transition={dragging || !motionReady ? 'none' : BACKDROP_TRANSITION}
        onClick={onBackdropClick}
      />

      <Flex
        direction="column"
        position="absolute"
        left={inset ? `${INSET_OFFSET_PX}px` : 0}
        right={inset ? `${INSET_OFFSET_PX}px` : 0}
        bottom={inset ? `${INSET_OFFSET_PX}px` : 0}
        top={fullHeight ? (inset ? `${INSET_OFFSET_PX}px` : '40px') : undefined}
        bg="background"
        borderTopRadius={inset ? undefined : 'sheet'}
        borderRadius={inset ? 'tab' : undefined}
        boxShadow={inset ? 'lg' : undefined}
        overflow="hidden"
        transform={sheetTransform}
        transition={dragging || !motionReady ? 'none' : SHEET_TRANSITION}
        willChange="transform"
        onTransitionEnd={handleSheetTransitionEnd}
      >
        {dragToDismiss ? (
          <Flex
            role="button"
            aria-label="Потяни вниз, чтобы свернуть"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onBackdropClick()
              }
            }}
            w="full"
            justify="center"
            pt="10px"
            pb="8px"
            cursor="grab"
            flexShrink={0}
            touchAction="none"
            onPointerDown={onHandlePointerDown}
            onPointerMove={onHandlePointerMove}
            onPointerUp={endHandleDrag}
            onPointerCancel={endHandleDrag}
            _active={{ cursor: 'grabbing' }}
          >
            <Box w="40px" h="4px" borderRadius="full" bg="line" pointerEvents="none" />
          </Flex>
        ) : null}
        {children}
      </Flex>
    </Box>
  )
}
