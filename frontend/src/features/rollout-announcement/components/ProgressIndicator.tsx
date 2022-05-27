import { Box } from '@chakra-ui/react'
import { motion } from 'framer-motion'

const ActiveIndicator = (): JSX.Element => (
  <Box
    width="1.5rem"
    height="0.5rem"
    borderRadius="full"
    backgroundColor="#5D6785"
  />
)

interface InactiveIndicatorProps {
  onClick?: () => void
  isActiveIndicator: boolean
}

const CircleIndicator = (props: InactiveIndicatorProps): JSX.Element => {
  const { onClick, isActiveIndicator } = props
  return (
    <Box
      width="0.5rem"
      height="0.5rem"
      borderRadius="full"
      backgroundColor="#BABECB"
      marginRight={isActiveIndicator ? '1.5rem' : '0.5rem'}
      onClick={onClick}
    />
  )
}

interface ProgressIndicatorProps {
  numIndicators: number
  currActiveIdx: number
  onClick?: (indicatorIdx: number) => void
}

export const ProgressIndicator = (
  props: ProgressIndicatorProps,
): JSX.Element => {
  const { numIndicators, currActiveIdx, onClick } = props
  const dummyValue = 1

  const animationTranslationDistInRem = 1
  const xTranslation = animationTranslationDistInRem * currActiveIdx
  const animationProps = { x: xTranslation.toString() + 'rem' }

  return (
    <Box display="inline-flex">
      {Array(numIndicators)
        .fill(dummyValue)
        .map((_, idx) => {
          const isActiveIndicator = idx === currActiveIdx
          return (
            <CircleIndicator
              isActiveIndicator={isActiveIndicator}
              onClick={() => onClick && onClick(idx)}
            />
          )
        })}

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
