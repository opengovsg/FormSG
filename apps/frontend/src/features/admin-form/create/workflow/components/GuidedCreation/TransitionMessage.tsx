import { useCallback, useEffect, useState } from 'react'
import { Box, Divider, Text } from '@chakra-ui/react'

interface TransitionMessageProps {
  message: string
  onRevealed?: () => void
}

export const TransitionMessage = ({
  message,
  onRevealed,
}: TransitionMessageProps): JSX.Element => {
  const [isVisible, setIsVisible] = useState(false)

  const onRevealedRef = useCallback(() => {
    onRevealed?.()
  }, [onRevealed])

  useEffect(() => {
    // Trigger the reveal on mount
    const revealTimer = setTimeout(() => setIsVisible(true), 0)

    return () => clearTimeout(revealTimer)
  }, [])

  useEffect(() => {
    if (!isVisible) return

    // Call onRevealed after the 300ms transition completes
    const timer = setTimeout(onRevealedRef, 300)
    return () => clearTimeout(timer)
  }, [isVisible, onRevealedRef])

  return (
    <Box>
      <Divider borderColor="neutral.300" />
      <Box
        py="0.75rem"
        px={{ base: '1.5rem', md: '2rem' }}
        opacity={isVisible ? 1 : 0}
        transform={isVisible ? 'translateY(0)' : 'translateY(8px)'}
        transition="opacity 300ms ease-out, transform 300ms ease-out"
      >
        <Text textStyle="body-1" color="secondary.500">
          {message}
        </Text>
      </Box>
    </Box>
  )
}
