import { ObjectID } from 'bson'
import mongoose from 'mongoose'

import getFormModel from 'src/app/models/form.server.model'
import { BasicFieldType, ResponseMode } from 'src/types'

import dbHandler from '../helpers/jest-db'

const Form = getFormModel(mongoose)

const MOCK_ADMIN_ID = new ObjectID()
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
  beforeAll(async () => {
    await dbHandler.connect()
    await dbHandler.insertFormCollectionReqs(MOCK_ADMIN_ID)
  })
  afterAll(async () => await dbHandler.closeDatabase())

  describe('Methods', () => {
    describe('getQuestion', () => {
      it('should return field title when field type is not a table field', async () => {
        // Arrange
        // Get all field types
        const fieldTypes = Object.values(BasicFieldType)

        // Asserts
        fieldTypes.forEach(async (type) => {
          // Skip table field.
          if (type === BasicFieldType.Table) return
          const fieldTitle = `test ${type} field title`
          const field = await createAndReturnFormField({
            fieldType: type,
            title: fieldTitle,
          })

          // Assert
          expect(field.getQuestion()).toEqual(fieldTitle)
        })
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
  formType: ResponseMode = ResponseMode.Email,
) => {
  let baseParams

  switch (formType) {
    case ResponseMode.Email:
      baseParams = MOCK_EMAIL_FORM_PARAMS
      break
    case ResponseMode.Encrypt:
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
      url: 'http://example.com',
      fileMd5Hash: 'some hash',
      name: 'test image name',
      size: 'some size',
      ...formFieldParams,
    }
  }

  const formParam = {
    ...baseParams,
    form_fields: [formFieldParams],
  }
  const form = await Form.create(formParam)

  return form.form_fields[0]
}
