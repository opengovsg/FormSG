import { useMemo } from 'react'
import { Box, BoxProps } from '@chakra-ui/react'

import { MotionBox } from '~components/motion'

const ActiveIndicator = ({ ...props }: BoxProps): JSX.Element => (
  <Box
    width="1.5rem"
    height="0.5rem"
    borderRadius="full"
    backgroundColor="secondary.500"
    position="absolute"
    as="button"
    {...props}
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
      width="0.5rem"
      height="0.5rem"
      borderRadius="full"
      backgroundColor="secondary.200"
      marginRight={isActiveIndicator ? '1.5rem' : '0.5rem'}
      onClick={onClick}
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
    return { x: currActiveIdx.toString() + 'rem' }
  }, [currActiveIdx])

  return (
    <Box display="inline-flex" alignSelf="center">
      {indicators.map((_, idx) => (
        <CircleIndicator
          key={idx}
          isActiveIndicator={idx === currActiveIdx}
          onClick={() => onClick(idx)}
          aria-label={
            idx === currActiveIdx
              ? undefined
              : `Page ${idx + 1} of ${numIndicators}`
          }
        />
      ))}

      <MotionBox
        // Absolute positioning is required for the active progress indicator to slide over inactive ones
        pos="absolute"
        animate={animationProps}
        transition={{ stiffness: 100 }}
      >
        <ActiveIndicator
          aria-label={`Page ${currActiveIdx + 1} of ${numIndicators}`}
        />
      </MotionBox>
    </Box>
  )
}
