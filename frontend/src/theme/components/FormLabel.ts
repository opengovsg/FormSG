import { ComponentStyleConfig } from '~theme/types'

import { textStyles } from '../textStyles'

export const FormLabel: ComponentStyleConfig = {
  baseStyle: {
    ...textStyles['subhead-1'],
    mb: '0.75rem',
  },
}
