import { CLIENT_CHECKBOX_OTHERS_INPUT_VALUE } from 'formsg-shared/constants/form'
import { FORM_ORIGIN_OTHER_DETAIL_MAX_LENGTH } from 'formsg-shared/constants/form-origin'
import { FormOrigin } from 'formsg-shared/types'

import { clientMetadataValidator } from '../admin-form.controller'

const OTHERS = CLIENT_CHECKBOX_OTHERS_INPUT_VALUE

describe('clientMetadataValidator', () => {
  describe('accepts', () => {
    const acceptCases: Array<{ name: string; metadata: unknown }> = [
      {
        name: 'absent metadata entirely (flag off)',
        metadata: undefined,
      },
      {
        name: 'valid selection without "Other"',
        metadata: {
          formOrigins: {
            value: [FormOrigin.Paper, FormOrigin.DigitalSpreadsheet],
          },
        },
      },
      {
        name: 'valid selection with "Other" + non-empty text',
        metadata: {
          formOrigins: {
            value: [FormOrigin.Paper, OTHERS],
            othersInput: 'A custom origin',
          },
        },
      },
    ]

    it.each(acceptCases)('should accept $name', ({ metadata }) => {
      const { error } = clientMetadataValidator.validate(metadata)
      expect(error).toBeUndefined()
    })
  })

  describe('rejects', () => {
    const rejectCases: Array<{ name: string; metadata: unknown }> = [
      {
        name: 'empty value array',
        metadata: { formOrigins: { value: [] } },
      },
      {
        name: 'othersInput present without the sentinel',
        metadata: {
          formOrigins: {
            value: [FormOrigin.Paper],
            othersInput: 'should be forbidden',
          },
        },
      },
      {
        name: 'sentinel present with missing othersInput',
        metadata: {
          formOrigins: {
            value: [FormOrigin.Paper, OTHERS],
          },
        },
      },
      {
        name: 'sentinel present with empty othersInput',
        metadata: {
          formOrigins: {
            value: [FormOrigin.Paper, OTHERS],
            othersInput: '',
          },
        },
      },
      {
        name: 'sentinel present with whitespace-only othersInput',
        metadata: {
          formOrigins: {
            value: [FormOrigin.Paper, OTHERS],
            othersInput: '   ',
          },
        },
      },
      {
        name: 'over-length othersInput (>200)',
        metadata: {
          formOrigins: {
            value: [OTHERS],
            othersInput: 'a'.repeat(FORM_ORIGIN_OTHER_DETAIL_MAX_LENGTH + 1),
          },
        },
      },
    ]

    it.each(rejectCases)('should reject $name', ({ metadata }) => {
      const { error } = clientMetadataValidator.validate(metadata)
      expect(error).toBeDefined()
    })
  })
})
