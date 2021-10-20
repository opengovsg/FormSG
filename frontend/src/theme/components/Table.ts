import {
  ComponentMultiStyleConfig,
  SystemStyleObjectRecord,
  ThemingPropsThunk,
} from '@chakra-ui/theme'

import { textStyles } from '../textStyles'

const parts = ['table', 'th', 'td', 'caption']

const variantColumnStripe: ThemingPropsThunk<SystemStyleObjectRecord> = ({
  colorScheme: c,
}) => {
  return {
    th: {
      borderBottom: '1px',
      borderColor: 'neutral.300',
      textAlign: 'center',
      textTransform: 'initial',
      ...textStyles['caption-1'],
      color: 'secondary.500',
      bg: 'white',
      '&:nth-of-type(odd)': {
        bg: `${c}.100`,
      },
    },
    td: {
      borderBottom: '1px',
      borderColor: 'neutral.300',
      bg: 'white',
      '&:nth-of-type(odd)': {
        bg: `${c}.100`,
      },
    },
  }
}

const sizes: Record<string, ThemingPropsThunk<SystemStyleObjectRecord>> = {
  sm: {
    th: {
      fontSize: textStyles['caption-1']['fontSize'],
      py: '0.625rem',
      px: '0.5rem',
    },
    td: {
      px: '0.5rem',
      py: '0.375rem',
    },
  },
}

export const Table: ComponentMultiStyleConfig = {
  parts,
  variants: {
    'column-stripe': variantColumnStripe,
  },
  sizes,
  defaultProps: {
    variant: 'column-stripe',
    colorScheme: 'primary',
    size: 'sm',
  },
}
