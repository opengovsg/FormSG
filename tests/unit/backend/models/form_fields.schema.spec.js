const { merge } = require('lodash')
const mongoose = require('mongoose')

const dbHandler = require('../helpers/db-handler')
const Form = require('../../../../dist/backend/app/models/form.server.model').default(
  mongoose,
)

describe('Form Field Schema', () => {
  let collections

  beforeAll(async () => await dbHandler.connect())
  beforeEach(async () => {
    collections = await dbHandler.preloadCollections({ saveForm: false })
  })
  afterEach(async () => await dbHandler.clearDatabase())
  afterAll(async () => await dbHandler.closeDatabase())

  describe('Methods', () => {
    describe('getQuestion', () => {
      it('should return field title when field type is not a table field', async () => {
        const {
          BasicFieldType,
        } = require('../../../../dist/backend/types/field/fieldTypes')

        // Arrange
        // Get all field types
        const fieldTypes = Object.values(BasicFieldType)

        // Asserts
        fieldTypes.forEach(async (type) => {
          // Skip table field.
          if (type === 'table') return
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

  const createAndReturnFormField = async (formFieldParams, formType) => {
    const MOCK_FORM_PARAMS = {
      title: 'Test Form',
      admin: collections.user,
    }
    const MOCK_ENCRYPTED_FORM_PARAMS = merge({}, MOCK_FORM_PARAMS, {
      publicKey: 'mockPublicKey',
      responseMode: 'encrypt',
    })
    const MOCK_EMAIL_FORM_PARAMS = merge({}, MOCK_FORM_PARAMS, {
      emails: ['test@example.com'],
      responseMode: 'email',
    })

    let baseParams

    switch (formType) {
      case 'email':
        baseParams = MOCK_EMAIL_FORM_PARAMS
        break
      case 'encrypt':
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
    const form = await new Form(formParam).save()

    return form.form_fields[0]
  }
})
