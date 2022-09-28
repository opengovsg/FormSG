import { accordionAnatomy as parts } from '@chakra-ui/anatomy'
import type {
  PartsStyleFunction,
  PartsStyleObject,
  SystemStyleObject,
} from '@chakra-ui/theme-tools'

const baseStyleButton: SystemStyleObject = {
  px: '1rem',
  py: '0.5rem',
}

const variantMedium: PartsStyleFunction<typeof parts> = ({
  colorScheme: c,
}) => {
  return {
    button: {
      p: '1rem',
      _hover: {
        color: `${c}.600`,
        bg: 'initial',
      },
      _active: {
        color: `${c}.700`,
      },
      _focus: {
        boxShadow: `0 0 0 2px var(--chakra-colors-${c}-500)`,
      },
    },
  }
}

const baseStyle: PartsStyleObject<typeof parts> = {
  button: baseStyleButton,
}

const variants = {
  medium: variantMedium,
}

export const Accordion = {
  baseStyle,
  variants,
  defaultProps: {
    colorScheme: 'primary',
  },
}
