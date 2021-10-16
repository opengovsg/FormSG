import { ComponentMultiStyleConfig } from '@chakra-ui/react'

import { textStyles } from '~theme/textStyles'

export const TABLE_THEME_KEY = 'TableField'

const parts = ['label']
export const TableField: ComponentMultiStyleConfig = {
  parts,
  baseStyle: {
    label: {
      ...textStyles['caption-1'],
    },
  },
}
