import { BasicField, FormFieldDto } from '~shared/types'

import { isMyInfo } from '~features/myinfo/utils'

import { getDraftToSave, getRestoreDraftFormValues } from './saveDraft'

// Mock the isMyInfo function
vi.mock('~features/myinfo/utils', () => ({
  isMyInfo: vi.fn(),
}))

describe('saveDraft', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(Date, 'now').mockReturnValue(1234567890)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const createMockFormField = (
    id: string,
    fieldType: BasicField,
    isVerifiable = false,
  ): FormFieldDto => {
    const baseField = {
      _id: id,
      fieldType,
      title: `Field ${id}`,
      description: '',
      required: true,
      disabled: false,
      isVerifiable,
      titleTranslations: [],
      descriptionTranslations: [],
    }

    switch (fieldType) {
      case BasicField.ShortText:
        return {
          ...baseField,
          ValidationOptions: {
            customVal: null,
            selectedValidation: null,
          },
          allowPrefill: false,
          lockPrefill: false,
        } as FormFieldDto
      case BasicField.LongText:
        return {
          ...baseField,
          ValidationOptions: {
            customVal: null,
            selectedValidation: null,
          },
        } as FormFieldDto
      case BasicField.Email:
        return {
          ...baseField,
          autoReplyOptions: {
            hasAutoReply: false,
            includeFormSummary: false,
          },
          hasAllowedEmailDomains: false,
          allowedEmailDomains: [],
        } as FormFieldDto
      case BasicField.Mobile:
        return {
          ...baseField,
          allowIntlNumbers: false,
        } as FormFieldDto
      default:
        return baseField as FormFieldDto
    }
  }

  describe('getDraftToSave', () => {
    it('should create draft with current form field values', () => {
      const formFields = [
        createMockFormField('field1', BasicField.ShortText),
        createMockFormField('field2', BasicField.LongText),
      ]
      const formFieldValues = {
        field1: 'test value 1',
        field2: 'test value 2',
      }
      const dirtyFieldIds = ['field1', 'field2']

      vi.mocked(isMyInfo).mockReturnValue(false)

      const result = getDraftToSave({
        currentFormFieldValues: formFieldValues,
        dirtyFieldIds,
        formFields,
      })

      expect(result).toEqual({
        lastUpdated: 1234567890,
        draftResponses: {
          field1: 'test value 1',
          field2: 'test value 2',
        },
        fieldDefinitionsChecksum: {
          field1: JSON.stringify(formFields[0]),
          field2: JSON.stringify(formFields[1]),
        },
      })
    })

    it('should exclude non-fillable fields (Section and Statement)', () => {
      const formFields = [
        createMockFormField('field1', BasicField.ShortText),
        createMockFormField('section1', BasicField.Section),
        createMockFormField('statement1', BasicField.Statement),
        createMockFormField('field2', BasicField.LongText),
      ]
      const formFieldValues = {
        field1: 'test value 1',
        section1: 'section value',
        statement1: 'statement value',
        field2: 'test value 2',
      }
      const dirtyFieldIds = ['field1', 'section1', 'statement1', 'field2']

      vi.mocked(isMyInfo).mockReturnValue(false)

      const result = getDraftToSave({
        currentFormFieldValues: formFieldValues,
        dirtyFieldIds,
        formFields,
      })

      expect(result.draftResponses).toEqual({
        field1: 'test value 1',
        field2: 'test value 2',
      })
    })

    it('should exclude MyInfo fields', () => {
      const formFields = [
        createMockFormField('field1', BasicField.ShortText),
        createMockFormField('myinfo1', BasicField.ShortText),
        createMockFormField('field2', BasicField.LongText),
      ]
      const formFieldValues = {
        field1: 'test value 1',
        myinfo1: 'myinfo value',
        field2: 'test value 2',
      }
      const dirtyFieldIds = ['field1', 'myinfo1', 'field2']

      vi.mocked(isMyInfo)
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(false)

      const result = getDraftToSave({
        currentFormFieldValues: formFieldValues,
        dirtyFieldIds,
        formFields,
      })

      expect(result.draftResponses).toEqual({
        field1: 'test value 1',
        field2: 'test value 2',
      })
    })

    it('should remove signatures from verifiable fields and keep non-verifiable field signatures as undefined', () => {
      const formFields = [
        createMockFormField('field1', BasicField.ShortText),
        // verifiable fields
        createMockFormField('email1', BasicField.Email, true),
        createMockFormField('mobile1', BasicField.Mobile, true),
        // non-verifiable fields of the same type as the verifiable fields
        createMockFormField('email2', BasicField.Email, false),
        createMockFormField('mobile2', BasicField.Mobile, false),
      ]
      const formFieldValues = {
        field1: 'test value 1',
        email1: { value: 'test@example.com', signature: 'sig123' },
        mobile1: { value: '+6512345678', signature: 'sig456' },
        email2: { value: 'test2@example.com', signature: undefined },
        mobile2: { value: '+6587654321', signature: undefined },
      }
      const dirtyFieldIds = ['field1', 'email1', 'mobile1', 'email2', 'mobile2']

      vi.mocked(isMyInfo).mockReturnValue(false)

      const result = getDraftToSave({
        currentFormFieldValues: formFieldValues,
        dirtyFieldIds,
        formFields,
      })

      expect(result.draftResponses).toEqual({
        field1: 'test value 1',
        email1: { value: 'test@example.com', signature: undefined },
        mobile1: { value: '+6512345678', signature: undefined },
        email2: { value: 'test2@example.com', signature: undefined },
        mobile2: { value: '+6587654321', signature: undefined },
      })
    })

    it('should merge previous restored draft responses with current dirty values', () => {
      const formFields = [
        createMockFormField('field1', BasicField.ShortText),
        createMockFormField('field2', BasicField.LongText),
        createMockFormField('field3', BasicField.ShortText),
      ]
      const formFieldValues = {
        field1: 'new value 1',
        field2: 'new value 2',
        field3: 'new value 3',
      }
      const dirtyFieldIds = ['field1', 'field3']
      const previousRestoredDraftResponses = {
        field1: 'old value 1',
        field2: 'old value 2',
      }

      vi.mocked(isMyInfo).mockReturnValue(false)

      const result = getDraftToSave({
        previousRestoredDraftResponses,
        currentFormFieldValues: formFieldValues,
        dirtyFieldIds,
        formFields,
      })

      expect(result.draftResponses).toEqual({
        field1: 'new value 1',
        field2: 'old value 2',
        field3: 'new value 3',
      })
    })

    it('should return empty draft when no valid fields to save', () => {
      const formFields = [
        createMockFormField('section1', BasicField.Section),
        createMockFormField('statement1', BasicField.Statement),
      ]
      const formFieldValues = {
        section1: 'section value',
        statement1: 'statement value',
      }
      const dirtyFieldIds = ['section1', 'statement1']

      const result = getDraftToSave({
        currentFormFieldValues: formFieldValues,
        dirtyFieldIds,
        formFields,
      })

      expect(result).toEqual({
        lastUpdated: 1234567890,
        draftResponses: null,
        fieldDefinitionsChecksum: null,
      })
    })

    it('should handle null previousRestoredDraftResponses and only include affected dirty field(s)', () => {
      const formFields = [
        createMockFormField('field1', BasicField.ShortText),
        createMockFormField('field2', BasicField.LongText),
      ]
      const formFieldValues = {
        field1: 'test value 1',
        field2: 'test value 2',
      }
      const dirtyFieldIds = ['field1']

      vi.mocked(isMyInfo).mockReturnValue(false)

      const result = getDraftToSave({
        previousRestoredDraftResponses: null,
        currentFormFieldValues: formFieldValues,
        dirtyFieldIds,
        formFields,
      })

      expect(result.draftResponses).toEqual({
        field1: 'test value 1',
      })
    })
  })

  describe('getRestoreDraftFormValues', () => {
    it('should restore draft responses for unchanged fields', () => {
      const currentFormFields = [
        createMockFormField('field1', BasicField.ShortText),
        createMockFormField('field2', BasicField.LongText),
      ]
      const savedDraftSubmission = {
        draftResponses: {
          field1: 'saved value 1',
          field2: 'saved value 2',
        },
        fieldDefinitionsChecksum: {
          field1: JSON.stringify(currentFormFields[0]),
          field2: JSON.stringify(currentFormFields[1]),
        },
      }

      const result = getRestoreDraftFormValues({
        currentFormFields,
        savedDraftSubmission,
      })

      expect(result).toEqual({
        draftResponsesToRestore: {
          field1: 'saved value 1',
          field2: 'saved value 2',
        },
        changedFieldIds: [],
        unchangedFieldIds: ['field1', 'field2'],
      })
    })

    it('should identify changed fields and exclude them from restoration', () => {
      const currentFormFields = [
        createMockFormField('field1', BasicField.ShortText),
        createMockFormField('field2', BasicField.LongText),
      ]
      const savedDraftSubmission = {
        draftResponses: {
          field1: 'saved value 1',
          field2: 'saved value 2',
        },
        fieldDefinitionsChecksum: {
          field1: JSON.stringify({
            ...currentFormFields[0],
            title: 'Previous title that has been changed',
          }),
          field2: JSON.stringify(currentFormFields[1]),
        },
      }

      const result = getRestoreDraftFormValues({
        currentFormFields,
        savedDraftSubmission,
      })

      expect(result).toEqual({
        draftResponsesToRestore: {
          field2: 'saved value 2',
        },
        changedFieldIds: ['field1'],
        unchangedFieldIds: ['field2'],
      })
    })

    it('should handle fields that no longer exist in current form', () => {
      const currentFormFields = [
        createMockFormField('field1', BasicField.ShortText),
      ]
      const savedDraftSubmission = {
        draftResponses: {
          field1: 'saved value 1',
          field2: 'saved value 2',
        },
        fieldDefinitionsChecksum: {
          field1: JSON.stringify(currentFormFields[0]),
          field2: 'old checksum for non-existent field',
        },
      }

      const result = getRestoreDraftFormValues({
        currentFormFields,
        savedDraftSubmission,
      })

      expect(result).toEqual({
        draftResponsesToRestore: {
          field1: 'saved value 1',
        },
        changedFieldIds: ['field2'],
        unchangedFieldIds: ['field1'],
      })
    })

    it('should handle undefined savedDraftSubmission', () => {
      const currentFormFields = [
        createMockFormField('field1', BasicField.ShortText),
      ]

      const result = getRestoreDraftFormValues({
        currentFormFields,
        savedDraftSubmission: undefined,
      })

      expect(result).toEqual({
        draftResponsesToRestore: {},
        changedFieldIds: [],
        unchangedFieldIds: [],
      })
    })

    it('should handle null draftResponses', () => {
      const currentFormFields = [
        createMockFormField('field1', BasicField.ShortText),
      ]
      const savedDraftSubmission = {
        draftResponses: null,
        fieldDefinitionsChecksum: {
          field1: JSON.stringify(currentFormFields[0]),
        },
      }

      const result = getRestoreDraftFormValues({
        currentFormFields,
        savedDraftSubmission,
      })

      expect(result).toEqual({
        draftResponsesToRestore: {},
        changedFieldIds: [],
        unchangedFieldIds: ['field1'],
      })
    })

    it('should handle null fieldDefinitionsChecksum', () => {
      const currentFormFields = [
        createMockFormField('field1', BasicField.ShortText),
      ]
      const savedDraftSubmission = {
        draftResponses: {
          field1: 'saved value 1',
        },
        fieldDefinitionsChecksum: null,
      }

      const result = getRestoreDraftFormValues({
        currentFormFields,
        savedDraftSubmission,
      })

      expect(result).toEqual({
        draftResponsesToRestore: {},
        changedFieldIds: ['field1'],
        unchangedFieldIds: [],
      })
    })

    it('handles when saved draft does not have a field definition checksum for a field', () => {
      const currentFormFields = [
        createMockFormField('field1', BasicField.ShortText),
        createMockFormField('field2', BasicField.ShortText),
      ]
      const savedDraftSubmission = {
        draftResponses: {
          field1: 'saved value 1',
          field2: 'saved value 2',
        },
        fieldDefinitionsChecksum: {
          field1: JSON.stringify(currentFormFields[0]),
          // field2 missing from checksum
        },
      }

      const result = getRestoreDraftFormValues({
        currentFormFields,
        savedDraftSubmission,
      })

      expect(result).toEqual({
        draftResponsesToRestore: {
          field1: 'saved value 1',
        },
        changedFieldIds: ['field2'],
        unchangedFieldIds: ['field1'],
      })
    })
  })
})
