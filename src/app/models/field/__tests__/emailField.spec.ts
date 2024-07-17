import dbHandler from '__tests__/unit/backend/helpers/jest-db'
import merge from 'lodash/merge'
import { Model, Schema } from 'mongoose'

import { IEmailFieldSchema } from 'src/types'

import { EmailFieldBase, FormResponseMode } from '../../../../../shared/types'
import createEmailFieldSchema from '../emailField'

describe('models.fields.emailField', () => {
  // Required as the field validator has a this.parent() check for response mode.
  let MockParent: Model<{
    responseMode: FormResponseMode
    field: IEmailFieldSchema
  }>

  const EMAIL_FIELD_DEFAULTS: Partial<EmailFieldBase> = {
    autoReplyOptions: {
      hasAutoReply: true,
      autoReplySubject: '',
      autoReplySender: '',
      autoReplyMessage: '',
      includeFormSummary: false,
    },
    isVerifiable: false,
    hasAllowedEmailDomains: false,
    allowedEmailDomains: [],
  }

  beforeAll(async () => {
    const db = await dbHandler.connect()
    const emailFieldSchema = createEmailFieldSchema()
    MockParent = db.model(
      'mockParent',
      new Schema({
        responseMode: {
          type: String,
          enum: Object.values(FormResponseMode),
        },
        field: emailFieldSchema,
      }),
    )
  })
  beforeEach(async () => await dbHandler.clearDatabase())
  afterAll(async () => await dbHandler.closeDatabase())

  it('should set includeFormSummary to given value on ResponseMode.Encrypt forms', async () => {
    // Arrange
    const mockEmailField = {
      autoReplyOptions: {
        hasAutoReply: true,
        autoReplySubject: 'some subject',
        autoReplySender: 'some sender',
        autoReplyMessage: 'This is a test message',
        // Set includeFormSummary to true.
        includeFormSummary: true,
      },
    }
    // Act
    const actual = await MockParent.create({
      responseMode: FormResponseMode.Encrypt,
      field: mockEmailField,
    })

    // Assert
    const expected = merge(EMAIL_FIELD_DEFAULTS, mockEmailField, {
      _id: expect.anything(),
      autoReplyOptions: {
        includeFormSummary: true,
      },
    })
    expect(actual.field.toObject()).toEqual(expected)
  })

  it('should set includeFormSummary to given value on ResponseMode.Email forms', async () => {
    // Arrange
    const mockEmailField = {
      autoReplyOptions: {
        hasAutoReply: true,
        autoReplySubject: 'some subject',
        autoReplySender: 'some sender',
        autoReplyMessage: 'This is a test message',
        // Set includeFormSummary to true.
        includeFormSummary: true,
      },
    }
    // Act
    const actual = await MockParent.create({
      responseMode: FormResponseMode.Email,
      field: mockEmailField,
    })

    // Assert
    const expected = merge(EMAIL_FIELD_DEFAULTS, mockEmailField, {
      _id: expect.anything(),
      autoReplyOptions: {
        // Should be initial value (true)
        // Do not really need to declare here, but here just to be explicit.
        includeFormSummary: true,
      },
    })
    expect(actual.field.toObject()).toEqual(expected)
  })

  it('should set includeFormSummary to false on ResponseMode.Multirespondent forms', async () => {
    // Arrange
    const mockEmailField = {
      autoReplyOptions: {
        hasAutoReply: true,
        autoReplySubject: 'some subject',
        autoReplySender: 'some sender',
        autoReplyMessage: 'This is a test message',
        // Set includeFormSummary to true.
        includeFormSummary: true,
      },
    }
    // Act
    const actual = await MockParent.create({
      responseMode: FormResponseMode.Multirespondent,
      field: mockEmailField,
    })

    // Assert
    const expected = merge(EMAIL_FIELD_DEFAULTS, mockEmailField, {
      _id: expect.anything(),
      autoReplyOptions: {
        // Should be always set to false for MRF forms
        includeFormSummary: false,
      },
    })
    expect(actual.field.toObject()).toEqual(expected)
  })
})
