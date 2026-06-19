import { Flex } from '@chakra-ui/react'
import { useEffect, useRef, useState, type ReactNode } from 'react'

const DURATION_MS = 280
const EASE = 'cubic-bezier(0.4, 0, 0.2, 1)'
const TRANSITION = `transform ${DURATION_MS}ms ${EASE}`

function initialMotionState(open: boolean, animateEnter: boolean) {
  const shown = open && !animateEnter
  return { visible: shown, motionReady: shown }
}

type SlideOverlayProps = {
  open: boolean
  onExited: () => void
  onEntered?: () => void
  /** false — без slide-in при первом появлении (только slide-out при закрытии). */
  animateEnter?: boolean
  zIndex?: number
  children: ReactNode
}

/** Полноэкранная панель со slide-in/out справа (stack navigation). */
export function SlideOverlay({
  open,
  onExited,
  onEntered,
  animateEnter = true,
  zIndex = 15,
  children,
}: SlideOverlayProps) {
  const [visible, setVisible] = useState(() => initialMotionState(open, animateEnter).visible)
  const [motionReady, setMotionReady] = useState(() => initialMotionState(open, animateEnter).motionReady)
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
      if (!animateEnter) {
        setMotionReady(true)
        setVisible(true)
        return
      }

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
  }, [open, animateEnter])

  const handleTransitionEnd = (event: React.TransitionEvent) => {
    if (event.propertyName !== 'transform') return

    if (open) {
      onEnteredRef.current?.()
      return
    }

    onExitedRef.current()
  }

  return (
    <Flex
      position="absolute"
      inset={0}
      zIndex={zIndex}
      direction="column"
      bg="screen"
      overflow="hidden"
      pointerEvents={open || visible ? 'auto' : 'none'}
      aria-hidden={!open && !visible}
      transform={visible ? 'translate3d(0, 0, 0)' : 'translate3d(100%, 0, 0)'}
      transition={motionReady ? TRANSITION : 'none'}
      willChange="transform"
      onTransitionEnd={handleTransitionEnd}
    >
      {children}
    </Flex>
  )
}
