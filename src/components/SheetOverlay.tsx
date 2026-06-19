import { useEffect, useState } from 'react'
import { Box } from '@chakra-ui/react'

const DURATION_MS = 280
const EASE = 'cubic-bezier(0.4, 0, 0.2, 1)'
const FADE_TRANSITION = `opacity ${DURATION_MS}ms ${EASE}`

type SheetOverlayProps = {
  open: boolean
  onClose: () => void
}

/** Затемнение под поповером / шитом (Figma node 238:988). */
export function SheetOverlay({ open, onClose }: SheetOverlayProps) {
  const [visible, setVisible] = useState(false)
  const [motionReady, setMotionReady] = useState(false)

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

  return (
    <Box
      position="absolute"
      inset={0}
      zIndex={9}
      bg="rgba(0,0,0,0.3)"
      opacity={visible ? 1 : 0}
      transition={motionReady ? FADE_TRANSITION : 'none'}
      pointerEvents={open || visible ? 'auto' : 'none'}
      onClick={onClose}
      aria-hidden
    />
  )
}
