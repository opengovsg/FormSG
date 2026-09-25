import { FormField } from '@opengovsg/formsg-sdk/dist/types'

import { BasicField } from 'formsg-shared/types'
import { handleAddressResponseDisplay } from 'formsg-shared/utils/address'

export const formatResponseForCell = (response?: FormField): string => {
  if (!response) return ''

  if (response.fieldType === BasicField.Address && response.answerArray) {
    return handleAddressResponseDisplay(response.answerArray as string[]).join(
      ', ',
    )
  }

  if (response.answerArray) {
    return response.answerArray
      .map((entry) => (Array.isArray(entry) ? entry.join(', ') : entry))
      .join('; ')
  }

  return response.answer ?? ''
}
