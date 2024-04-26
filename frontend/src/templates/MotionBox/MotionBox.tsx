import { FC } from 'react'
import { BoxProps, chakra } from '@chakra-ui/react'
import { HTMLMotionProps, isValidMotionProp, motion } from 'framer-motion'
import { Merge } from 'type-fest'

export type MotionBoxProps = Merge<BoxProps, HTMLMotionProps<'div'>>
export const MotionBox: FC<MotionBoxProps> = chakra(motion.div, {
  shouldForwardProp: isValidMotionProp,
})
