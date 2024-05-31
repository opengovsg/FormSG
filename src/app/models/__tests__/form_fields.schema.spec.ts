import dbHandler from '__tests__/unit/backend/helpers/jest-db'
import mongoose, { Types } from 'mongoose'
import {
  BasicField,
  FormResponseMode,
  NumberSelectedLengthValidation,
  NumberSelectedValidation,
} from 'shared/types'

import getFormModel from 'src/app/models/form.server.model'
import { IFieldSchema } from 'src/types'

import { aws } from '../../config/config'

const Form = getFormModel(mongoose)

const MOCK_ADMIN_ID = new Types.ObjectId()
const MOCK_FORM_PARAMS = {
  title: 'Test Form',
  admin: MOCK_ADMIN_ID,
}
const MOCK_ENCRYPTED_FORM_PARAMS = {
  ...MOCK_FORM_PARAMS,
  publicKey: 'mockPublicKey',
  responseMode: 'encrypt',
}
const MOCK_EMAIL_FORM_PARAMS = {
  ...MOCK_FORM_PARAMS,
  emails: ['test@example.com'],
  responseMode: 'email',
}

describe('Form Field Schema', () => {
  beforeAll(async () => await dbHandler.connect())
  beforeEach(
    async () =>
      await dbHandler.insertFormCollectionReqs({ userId: MOCK_ADMIN_ID }),
  )
  afterEach(async () => await dbHandler.clearDatabase())
  afterAll(async () => await dbHandler.closeDatabase())

  describe('Email Field', () => {
    describe('restrict email domains', () => {
      it('should allow email field with isVerifiable true and hasAllowedEmailDomains false with empty allowedEmailDomains', async () => {
        // Arrange
        const field = await createAndReturnFormField({
          fieldType: BasicField.Email,
          isVerifiable: true,
          hasAllowedEmailDomains: false,
          allowedEmailDomains: [],
        })

        // Assert
        const fieldObj = field.toObject()
        expect(fieldObj).toHaveProperty('isVerifiable', true)
        expect(fieldObj).toHaveProperty('hasAllowedEmailDomains', false)
        expect(fieldObj).toHaveProperty('allowedEmailDomains', [])
      })

      it('should allow email field with isVerifiable true and hasAllowedEmailDomains true with non-empty allowedEmailDomains', async () => {
        // Arrange
        const field = await createAndReturnFormField({
          fieldType: BasicField.Email,
          isVerifiable: true,
          hasAllowedEmailDomains: true,
          allowedEmailDomains: ['@example.com'],
        })

        // Assert
        const fieldObj = field.toObject()
        expect(fieldObj).toHaveProperty('isVerifiable', true)
        expect(fieldObj).toHaveProperty('hasAllowedEmailDomains', true)
        expect(fieldObj).toHaveProperty('allowedEmailDomains', ['@example.com'])
      })

      it('should throw an error for email field with isVerifiable true and hasAllowedEmailDomains false with non-empty allowedEmailDomains', async () => {
        // Arrange
        const createField = async () => {
          const field = await createAndReturnFormField({
            fieldType: BasicField.Email,
            isVerifiable: true,
            hasAllowedEmailDomains: false,
            allowedEmailDomains: ['@example.com'],
          })
          return field
        }

        // Assert
        await expect(createField).rejects.toThrow(
          'List of allowed email domains should be empty if restrict email domains is disabled',
        )
      })

      it('should throw an error for email field with isVerifiable true and hasAllowedEmailDomains true with empty allowedEmailDomains', async () => {
        // Arrange
        const createField = async () => {
          const field = await createAndReturnFormField({
            fieldType: BasicField.Email,
            isVerifiable: true,
            hasAllowedEmailDomains: true,
            allowedEmailDomains: [],
          })
          return field
        }

        // Assert
        await expect(createField).rejects.toThrow(
          'List of allowed email domains should not be empty if restrict email domains is enabled',
        )
      })

      it('should allow email field with isVerifiable false and hasAllowedEmailDomains false with empty allowedEmailDomains', async () => {
        // Arrange
        const field = await createAndReturnFormField({
          fieldType: BasicField.Email,
          isVerifiable: false,
          hasAllowedEmailDomains: false,
          allowedEmailDomains: [],
        })

        // Assert
        const fieldObj = field.toObject()
        expect(fieldObj).toHaveProperty('isVerifiable', false)
        expect(fieldObj).toHaveProperty('hasAllowedEmailDomains', false)
        expect(fieldObj).toHaveProperty('allowedEmailDomains', [])
      })

      it('should throw an error for email field with isVerifiable false and hasAllowedEmailDomains false with non-empty allowedEmailDomains', async () => {
        // Arrange
        const createField = async () => {
          const field = await createAndReturnFormField({
            fieldType: BasicField.Email,
            isVerifiable: false,
            hasAllowedEmailDomains: false,
            allowedEmailDomains: ['@example.com'],
          })
          return field
        }

        // Assert
        await expect(createField).rejects.toThrow(
          'List of allowed email domains should be empty if restrict email domains is disabled',
        )
      })

      it('should throw an error for email field with isVerifiable false and hasAllowedEmailDomains true with empty allowedEmailDomains', async () => {
        // Arrange
        const createField = async () => {
          const field = await createAndReturnFormField({
            fieldType: BasicField.Email,
            isVerifiable: false,
            hasAllowedEmailDomains: true,
            allowedEmailDomains: [],
          })
          return field
        }

        // Assert
        await expect(createField).rejects.toThrow(
          'List of allowed email domains should not be empty if restrict email domains is enabled',
        )
      })

      it('should allow email field with isVerifiable false and hasAllowedEmailDomains true with non-empty allowedEmailDomains', async () => {
        // Arrange
        const field = await createAndReturnFormField({
          fieldType: BasicField.Email,
          isVerifiable: false,
          hasAllowedEmailDomains: true,
          allowedEmailDomains: ['@example.com'],
        })

        // Assert
        const fieldObj = field.toObject()
        expect(fieldObj).toHaveProperty('isVerifiable', false)
        expect(fieldObj).toHaveProperty('hasAllowedEmailDomains', true)
        expect(fieldObj).toHaveProperty('allowedEmailDomains', ['@example.com'])
      })

      it('should allow email field with wildcard domains', async () => {
        // Arrange
        const field = await createAndReturnFormField({
          fieldType: BasicField.Email,
          isVerifiable: true,
          hasAllowedEmailDomains: true,
          allowedEmailDomains: ['@*.gov.sg', '@*.asia'],
        })

        // Assert
        const fieldObj = field.toObject()
        expect(fieldObj).toHaveProperty('isVerifiable', true)
        expect(fieldObj).toHaveProperty('hasAllowedEmailDomains', true)
        expect(fieldObj).toHaveProperty('allowedEmailDomains', [
          '@*.gov.sg',
          '@*.asia',
        ])
      })
    })
  })

  describe('Short Text Field', () => {
    describe('prefill', () => {
      it('should allow creation of short text field with no prefill setting and populate prefill settings with default', async () => {
        // Arrange
        const field = await createAndReturnFormField({
          fieldType: BasicField.ShortText,
        })

        // Assert
        const fieldObj = field.toObject()
        expect(fieldObj).toHaveProperty('allowPrefill', false)
        expect(fieldObj).toHaveProperty('lockPrefill', false)
      })

      it('should allow creation of short text field with allowPrefill = false setting and populate lockPrefill settings with default', async () => {
        // Arrange
        const field = await createAndReturnFormField({
          fieldType: BasicField.ShortText,
          allowPrefill: false,
        })

        // Assert
        const fieldObj = field.toObject()
        expect(fieldObj).toHaveProperty('allowPrefill', false)
        expect(fieldObj).toHaveProperty('lockPrefill', false)
      })

      it('should allow creation of short text field with allowPrefill = true setting and populate lockPrefill settings with default', async () => {
        // Arrange
        const field = await createAndReturnFormField({
          fieldType: BasicField.ShortText,
          allowPrefill: true,
        })

        // Assert
        const fieldObj = field.toObject()
        expect(fieldObj).toHaveProperty('allowPrefill', true)
        expect(fieldObj).toHaveProperty('lockPrefill', false)
      })

      it('should allow creation of short text field with allowPrefill = true and lockPrefill = true settings', async () => {
        // Arrange
        const field = await createAndReturnFormField({
          fieldType: BasicField.ShortText,
          allowPrefill: true,
          lockPrefill: true,
        })

        // Assert
        const fieldObj = field.toObject()
        expect(fieldObj).toHaveProperty('allowPrefill', true)
        expect(fieldObj).toHaveProperty('lockPrefill', true)
      })

      it('should not allow creation of short text field with allowPrefill = false and lockPrefill = true settings', async () => {
        // Arrange
        const createField = async () => {
          const field = await createAndReturnFormField({
            fieldType: BasicField.ShortText,
            allowPrefill: false,
            lockPrefill: true,
          })

          return field
        }

        // Act
        const createFieldPromise = createField()

        // Assert
        await expect(createFieldPromise).rejects.toThrow(
          'Cannot lock prefill if prefill is not enabled',
        )
      })
    })
  })

  describe('Number Field', () => {
    it('should allow creation of default number field', async () => {
      const defaultNumberValidationOptions = {
        ValidationOptions: {
          selectedValidation: null,
          LengthValidationOptions: {
            selectedLengthValidation: null,
            customVal: null,
          },
          RangeValidationOptions: {
            customMin: null,
            customMax: null,
          },
        },
      }

      const createDefaultNumberField = async () =>
        await createAndReturnFormField({
          fieldType: BasicField.Number,
        })

      await expect(createDefaultNumberField()).resolves.toMatchObject(
        defaultNumberValidationOptions,
      )
    })

    it('should not allow creation of number field with selectedLengthValidation but no customVal', async () => {
      const createInvalidNumberField = async () =>
        await createAndReturnFormField({
          fieldType: BasicField.Number,
          ValidationOptions: {
            selectedValidation: NumberSelectedValidation.Length,
            LengthValidationOptions: {
              selectedLengthValidation: NumberSelectedLengthValidation.Min,
            },
          },
        })

      await expect(createInvalidNumberField()).rejects.toThrow(
        'Please enter a customVal',
      )
    })

    it('should not allow creation of number field with selectedValidation.Length but no selectedLengthValidation', async () => {
      const createInvalidNumberField = async () =>
        await createAndReturnFormField({
          fieldType: BasicField.Number,
          ValidationOptions: {
            selectedValidation: NumberSelectedValidation.Length,
          },
        })

      await expect(createInvalidNumberField()).rejects.toThrow(
        'Please select the type of length validation',
      )
    })

    it('should not allow creation of number field with selected range validation but invalid range', async () => {
      const createInvalidNumberField = async () =>
        await createAndReturnFormField({
          fieldType: BasicField.Number,
          ValidationOptions: {
            selectedValidation: NumberSelectedValidation.Range,
            RangeValidationOptions: {
              customMin: 10,
              customMax: 5,
            },
          },
        })

      await expect(createInvalidNumberField()).rejects.toThrow(
        'Please enter a valid range',
      )
    })

    it('should not allow creation of number field with selected range validation but missing range', async () => {
      const createInvalidNumberField = async () =>
        await createAndReturnFormField({
          fieldType: BasicField.Number,
          ValidationOptions: {
            selectedValidation: NumberSelectedValidation.Range,
          },
        })

      await expect(createInvalidNumberField()).rejects.toThrow(
        'Please enter a valid range',
      )
    })
  })

  describe('Methods', () => {
    describe('getQuestion', () => {
      it('should return field title when field type is not a table field', async () => {
        // Arrange
        // Get all field types
        const fieldTypes = Object.values(BasicField)
        for (const fieldType of fieldTypes) {
          if (fieldType === BasicField.Table) return

          // Act
          const fieldTitle = `test ${fieldType} field title`
          const field = await createAndReturnFormField({
            fieldType,
            title: fieldTitle,
          })

          // Assert
          expect(field.getQuestion()).toEqual(fieldTitle)
        }
      })

      it('should return table title concatenated with all column titles when field type is a table field', async () => {
        // Arrange
        const tableFieldParams = {
          title: 'testTableTitle',
          minimumRows: 1,
          columns: [
            {
              title: 'Test Column Title 1',
              required: true,
              columnType: 'textfield',
            },
            {
              title: 'Test Column Title 2',
              required: true,
              columnType: 'dropdown',
            },
          ],
          fieldType: 'table',
        }

        // Act
        const tableField = await createAndReturnFormField(tableFieldParams)

        // Assert
        const expectedQuestionString = `${
          tableFieldParams.title
        } (${tableFieldParams.columns.map((col) => col.title).join(', ')})`
        expect(tableField.getQuestion()).toEqual(expectedQuestionString)
      })
    })
  })
})

const createAndReturnFormField = async (
  formFieldParams: Record<string, any>,
  formType: FormResponseMode = FormResponseMode.Email,
) => {
  let baseParams

  switch (formType) {
    case FormResponseMode.Email:
      baseParams = MOCK_EMAIL_FORM_PARAMS
      break
    case FormResponseMode.Encrypt:
      baseParams = MOCK_ENCRYPTED_FORM_PARAMS
      break
    default:
      baseParams = MOCK_FORM_PARAMS
  }

  // Insert required params if they do not exist.
  if (formFieldParams.fieldType === 'attachment') {
    formFieldParams = { attachmentSize: 3, ...formFieldParams }
  }
  if (formFieldParams.fieldType === 'image') {
    formFieldParams = {
      url: `${aws.imageBucketUrl}/test-image.jpg`,
      fileMd5Hash: 'some hash',
      name: 'test image name',
      size: 'some size',
      ...formFieldParams,
    }
  }

  const formParam = {
    ...baseParams,
    responseMode: formType,
    form_fields: [formFieldParams] as IFieldSchema[],
  }
  const form = await Form.create(formParam)

  return form.form_fields![0]
}
