import { ComponentStyleConfig } from '~theme/types'

import { textStyles } from '../textStyles'

export const Tooltip: ComponentStyleConfig = {
  baseStyle: {
    // overriding --tooltip-bg since Chakra UI does it this way -
    // see https://github.com/chakra-ui/chakra-ui/blob/main/packages/theme/src/components/tooltip.ts
    '--tooltip-bg': 'var(--chakra-colors-secondary-700)',
    bg: 'brand.secondary.700',
    px: '0.75rem',
    py: '0.5rem',
    color: 'white',
    borderRadius: '0.25rem',
    textAlign: 'left',
    margin: '0.25rem',
    maxWidth: '19.5rem',
    // For some reason textStyle prop is not accepted, so just
    // pass all required styles
    ...textStyles['body-2'],
  },
}
