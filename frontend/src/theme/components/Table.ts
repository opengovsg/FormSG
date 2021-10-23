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
    tr: {
      '&:nth-of-type(odd)': {
        bg: { base: `${c}.100`, md: 'none' },
      },
      px: { base: '1.5rem', md: 0 },
      py: { base: '0.75rem', md: 0 },
      display: { base: 'block', md: 'table-row' },
      borderBottom: {
        base: 0,
        md: '1px solid var(--chakra-colors-neutral-300)',
      },
    },
    th: {
      textAlign: 'center',
      textTransform: 'initial',
      ...textStyles['subhead-2'],
      color: 'secondary.500',
      bg: { base: 'transparent', md: 'white' },
      '&:nth-of-type(odd)': {
        bg: { md: `${c}.100` },
      },
    },
    td: {
      bg: { base: 'transparent', md: 'white' },
      '&:nth-of-type(odd)': {
        bg: { md: `${c}.100` },
      },
    },
  }
}

const sizes: Record<string, ThemingPropsThunk<SystemStyleObjectRecord>> = {
  sm: {
    th: {
      fontSize: textStyles['subhead-2']['fontSize'],
      py: '0.625rem',
      px: '0.5rem',
    },
    td: {
      px: { base: 0, md: '0.5rem' },
      py: { base: '0.75rem', md: '0.375rem' },
    },
  },
}

export const Table: ComponentMultiStyleConfig = {
  parts,
  variants: {
    'column-stripe': variantColumnStripe,
  },
  sizes,
}
