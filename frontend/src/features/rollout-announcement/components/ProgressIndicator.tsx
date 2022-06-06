import { useMemo } from 'react'
import { Box } from '@chakra-ui/react'
import { motion } from 'framer-motion'

import { MotionBox } from '~components/motion'

const ActiveIndicator = (): JSX.Element => (
  <Box
    width="1.5rem"
    height="0.5rem"
    borderRadius="full"
    backgroundColor="secondary.500"
  />
)

interface CircleIndicatorProps {
  onClick: () => void
  isActiveIndicator: boolean
}

const CircleIndicator = ({
  onClick,
  isActiveIndicator,
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
  const dummyValue = 1
  const indicators = useMemo(
    () => Array(numIndicators).fill(dummyValue),
    [numIndicators],
  )

  const animationTranslationDistInRem = 1
  const xTranslation = useMemo(
    () => animationTranslationDistInRem * currActiveIdx,
    [animationTranslationDistInRem, currActiveIdx],
  )
  const animationProps = useMemo(() => {
    return { x: xTranslation.toString() + 'rem' }
  }, [xTranslation])

  return (
    <Box display="inline-flex">
      {indicators.map((_, idx) => (
        <CircleIndicator
          isActiveIndicator={idx === currActiveIdx}
          onClick={() => onClick(idx)}
        />
      ))}

      <MotionBox
        pos="absolute"
        animate={animationProps}
        transition={{ stiffness: 100 }}
      >
        <ActiveIndicator />
      </MotionBox>
    </Box>
  )
}
