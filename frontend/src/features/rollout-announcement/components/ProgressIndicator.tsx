import { Box } from '@chakra-ui/react'
import { motion } from 'framer-motion'

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
      cursor="pointer"
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

  const animationTranslationDistInRem = 1
  const xTranslation = animationTranslationDistInRem * currActiveIdx
  const animationProps = { x: xTranslation.toString() + 'rem' }

  return (
    <Box display="inline-flex">
      {Array(numIndicators)
        .fill(dummyValue)
        .map((_, idx) => (
          <CircleIndicator
            isActiveIndicator={idx === currActiveIdx}
            onClick={() => onClick(idx)}
          />
        ))}

      <motion.div
        style={{ position: 'absolute' }}
        animate={animationProps}
        transition={{ stiffness: 100 }}
      >
        <ActiveIndicator />
      </motion.div>
    </Box>
  )
}
