import { progressAnatomy as parts } from '@chakra-ui/anatomy'
import type {
  PartsStyleFunction,
  PartsStyleObject,
  SystemStyleFunction,
} from '@chakra-ui/theme-tools'
import { getColor } from '@chakra-ui/theme-tools'

const baseStyleTrack: SystemStyleFunction = ({ colorScheme: c }) => {
  return {
    bg: `${c}.200`,
    borderRadius: '1.25rem',
  }
}

const filledStyle: SystemStyleFunction = ({
  colorScheme: c,
  theme,
  isIndeterminate,
}) => {
  const bgColor = `${c}.500`

  const gradient = `linear-gradient(
    to right,
    transparent 0%,
    ${getColor(theme, bgColor)} 50%,
    transparent 100%
  )`

  return {
    ...(isIndeterminate ? { bgImage: gradient } : { bgColor }),
  }
}

const baseStyleFilledTrack: SystemStyleFunction = (props) => {
  return {
    transitionProperty: 'all',
    transitionDuration: 'slow',
    ...filledStyle(props),
  }
}

const baseStyle: PartsStyleFunction<typeof parts> = (props) => ({
  track: baseStyleTrack(props),
  filledTrack: baseStyleFilledTrack(props),
})

const sizes: Record<string, PartsStyleObject<typeof parts>> = {
  xl: {
    track: { h: '1.5rem' },
  },
}

export const Progress = {
  baseStyle,
  parts: parts.keys,
  sizes,
  defaultProps: {
    size: 'md',
    colorScheme: 'primary',
  },
}
