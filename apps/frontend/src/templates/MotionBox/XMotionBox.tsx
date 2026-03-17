/** MotionBox that slides with the x-axis */

import { Key, useLayoutEffect, useState } from 'react'

import { MotionBox, MotionBoxProps } from './MotionBox'

interface XMotionBoxProps extends MotionBoxProps {
  /** To be passed to inner MotionBox component for rerendering */
  keyProp?: Key | null
  direction?: number
  animateFirstLoad?: boolean
}

const SCREEN_ANIMATION_VARIANT = {
  enter: (direction: number) => ({
    x: direction > 0 ? 1000 : -1000,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
}

export const XMotionBox = ({
  keyProp,
  animateFirstLoad,
  direction,
  variants = SCREEN_ANIMATION_VARIANT,
  ...props
}: XMotionBoxProps) => {
  const [isFirstRender, setIsFirstRender] = useState(!animateFirstLoad)

  useLayoutEffect(() => {
    if (isFirstRender) {
      setIsFirstRender(false)
    }
  }, [isFirstRender])

  return (
    <MotionBox
      // Required to force a rerender on direction change
      key={keyProp}
      custom={direction}
      variants={variants}
      initial={isFirstRender ? 'center' : 'enter'}
      animate="center"
      transition={{
        x: { type: 'spring', stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 },
      }}
      {...props}
    />
  )
}
