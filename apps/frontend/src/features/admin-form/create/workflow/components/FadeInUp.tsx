import { useEffect, useState } from 'react'
import { Box, usePrefersReducedMotion } from '@chakra-ui/react'

interface FadeInUpProps {
  /** Seconds. */
  duration?: number
  children: React.ReactNode
}

/**
 * Fades content in from 8px below on mount.
 *
 * Used for the sections a guided step reveals one at a time, and for the step
 * card that takes over when the welcome card hands off. Instant under
 * prefers-reduced-motion.
 */
export const FadeInUp = ({
  duration = 0.3,
  children,
}: FadeInUpProps): JSX.Element => {
  const prefersReducedMotion = usePrefersReducedMotion()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50)
    return () => clearTimeout(timer)
  }, [])

  if (prefersReducedMotion) return <>{children}</>

  return (
    <Box
      opacity={isVisible ? 1 : 0}
      transform={isVisible ? 'translateY(0)' : 'translateY(8px)'}
      transition={`opacity ${duration}s ease-out, transform ${duration}s ease-out`}
    >
      {children}
    </Box>
  )
}
