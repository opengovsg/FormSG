import { useCallback, useEffect, useImperativeHandle, useRef } from 'react'
import lottie, { type AnimationItem } from 'lottie-web'

import animationData from './workflow-intro-animation.json'

export interface WorkflowIntroAnimationHandle {
  playForward: () => void
  playReverse: () => void
}

interface WorkflowIntroAnimationProps {
  handleRef: React.Ref<WorkflowIntroAnimationHandle>
}

export const WorkflowIntroAnimation = ({
  handleRef,
}: WorkflowIntroAnimationProps): JSX.Element => {
  const containerRef = useRef<HTMLDivElement>(null)
  const animRef = useRef<AnimationItem | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const anim = lottie.loadAnimation({
      container: containerRef.current,
      renderer: 'svg',
      loop: false,
      autoplay: false,
      animationData,
    })

    anim.setSpeed(1.5)
    animRef.current = anim

    return () => {
      anim.destroy()
      animRef.current = null
    }
  }, [])

  const playForward = useCallback(() => {
    const anim = animRef.current
    if (!anim) return
    anim.setDirection(1)
    anim.play()
  }, [])

  const playReverse = useCallback(() => {
    const anim = animRef.current
    if (!anim) return
    anim.setDirection(-1)
    anim.play()
  }, [])

  useImperativeHandle(handleRef, () => ({ playForward, playReverse }), [
    playForward,
    playReverse,
  ])

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        maxWidth: '300px',
        border: '2px solid #E2E6F0',
        borderRadius: '16px',
        overflow: 'hidden',
      }}
    />
  )
}
