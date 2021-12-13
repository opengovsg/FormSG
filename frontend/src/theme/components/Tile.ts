import { anatomy, SystemStyleObject } from '@chakra-ui/theme-tools'

import { ComponentMultiStyleConfig } from '~theme/types'

const parts = anatomy('tile').parts('container', 'title', 'icon', 'subtitle')

const activeContainerStyle: SystemStyleObject = {
  bgColor: 'primary.200',
  borderColor: 'transparent',
  // NOTE: For the boxShadow styling, due to conflicts with the focus-visible package,
  // the !important is required to display the boxShadow styling correctly.
  boxShadow: '0 0 0 3px var(--chakra-colors-primary-500) !important',
  _hover: {
    bgColor: 'primary.200',
  },
}

const baseContainerStyle: SystemStyleObject = {
  color: 'inherit',
  borderRadius: '0.25rem',
  padding: '1.5rem',
  _hover: {
    bgColor: 'primary.100',
  },
  _focus: {
    borderColor: 'transparent',
    // NOTE: For the boxShadow styling, due to conflicts with the focus-visible package,
    // the !important is required to display the boxShadow styling correctly.
    boxShadow: '0 0 0 2px var(--chakra-colors-primary-500) !important',
  },
  _active: activeContainerStyle,
  bgColor: 'white',
  border: '1px solid',
  borderColor: 'neutral.300',
  whiteSpace: 'pre-line',
  flexDir: 'column',
  alignItems: 'flex-start',
  maxWidth: 'inherit',
  textAlign: 'left',
}

export const Tile: ComponentMultiStyleConfig<typeof parts> = {
  parts: parts.keys,
  baseStyle: ({ isActive }) => ({
    container: isActive
      ? { ...baseContainerStyle, ...activeContainerStyle }
      : baseContainerStyle,
    title: {
      color: 'secondary.700',
      textStyle: 'h4',
      mt: '1rem',
    },
    icon: {
      boxSize: '2.5rem',
    },
    subtitle: {
      color: 'secondary.500',
      textStyle: 'body-2',
    },
  }),
  variants: {
    complex: {
      title: {
        mb: 0,
      },
      subtitle: {
        mb: '1rem',
      },
    },
    simple: {
      title: { mb: '1rem' },
    },
  },
}
