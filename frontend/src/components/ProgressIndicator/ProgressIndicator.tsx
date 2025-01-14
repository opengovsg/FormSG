import { useMemo } from 'react'
import { Box, BoxProps } from '@chakra-ui/react'

import { MotionBox } from '~templates/MotionBox'

const ActiveIndicator = (): JSX.Element => (
  <Box
    // Top required to align it with CircleIndicators
    top="0.125rem"
    width="1.5rem"
    height="0.5rem"
    borderRadius="full"
    backgroundColor="secondary.500"
    position="absolute"
  />
)

interface CircleIndicatorProps extends BoxProps {
  onClick: () => void
  isActiveIndicator: boolean
}

const CircleIndicator = ({
  onClick,
  isActiveIndicator,
  ...props
}: CircleIndicatorProps): JSX.Element => {
  return (
    <Box
      width="0.75rem"
      height="0.75rem"
      padding="0.125rem"
      borderRadius="full"
      backgroundColor="secondary.200"
      marginRight={isActiveIndicator ? '1.25rem' : '0.25rem'}
      onClick={onClick}
      _hover={{ backgroundColor: 'secondary.300' }}
      _focus={
        isActiveIndicator
          ? undefined
          : {
              backgroundColor: 'secondary.300',
              boxShadow: `0 0 0 1px var(--chakra-colors-secondary-400)`,
            }
      }
      backgroundClip="content-box"
      as="button"
      {...props}
    />
  )
}

interface ProgressIndicatorProps {
  numIndicators: number
  currActiveIdx: number
  onClick: (indicatorIdx: number) => void
}

export const ProgressIndicator = ({
  numIndicators,
  currActiveIdx,
  onClick,
}: ProgressIndicatorProps): JSX.Element => {
  const indicators = useMemo(
    () => Array(numIndicators).fill(1),
    [numIndicators],
  )

  const animationProps = useMemo(() => {
    return { x: `${currActiveIdx + 0.125}rem` }
  }, [currActiveIdx])

  return (
    <Box display="inline-flex" alignSelf="center">
      {indicators.map((_, idx) => (
        <CircleIndicator
          key={idx}
          isActiveIndicator={idx === currActiveIdx}
          onClick={() => onClick(idx)}
          aria-label={`Page ${idx + 1} of ${numIndicators}`}
        />
      ))}

      <MotionBox
        // Absolute positioning is required for the active progress indicator to slide over inactive ones
        pos="absolute"
        animate={animationProps}
        transition={{ stiffness: 100 }}
      >
        <ActiveIndicator />
      </MotionBox>
    </Box>
  )
}
