import dbHandler from '__tests__/unit/backend/helpers/jest-db'
import merge from 'lodash/merge'
import mongoose, { Model, Schema } from 'mongoose'
import {
  DateFieldBase,
  FormResponseMode,
  InvalidDaysOptions,
} from 'shared/types'

import { IDateFieldSchema } from 'src/types'

import createDateFieldSchema from '../dateField'

describe('models.fields.dateField', () => {
  // Required as the field validator has a this.parent() check for response mode.
  let MockParent: Model<{
    responseMode: FormResponseMode
    field: IDateFieldSchema
  }>

  beforeAll(async () => {
    const db = await dbHandler.connect()
    const dateFieldSchema = createDateFieldSchema()
    MockParent = db.model(
      'mockParent',
      new Schema({
        responseMode: {
          type: String,
          enum: Object.values(FormResponseMode),
        },
        field: dateFieldSchema,
      }),
    )
  })
  beforeEach(async () => await dbHandler.clearDatabase())
  afterAll(async () => await dbHandler.closeDatabase())

  it('should set default empty array for invalidDays when date field does not specify', async () => {
    // Arrange
    const mockDateField = {
      dateValidation: {
        selectedDateValidation: null,
        customMaxDate: null,
        customMinDate: null,
      },
    }
    const expectedDateField: Partial<DateFieldBase> = {
      dateValidation: {
        selectedDateValidation: null,
        customMaxDate: null,
        customMinDate: null,
      },
      invalidDays: [],
    }

    // Act
    const actual = await MockParent.create({
      responseMode: FormResponseMode.Encrypt,
      field: mockDateField,
    })

    // Assert
    const expected = merge(expectedDateField, mockDateField, {
      _id: expect.anything(),
    })
    expect(actual.field.toObject()).toEqual(expected)
  })

  it('should successfully assign an array with valid values to invalidDays attribute', async () => {
    // Arrange
    const mockInvalidDays = [
      InvalidDaysOptions.Monday,
      InvalidDaysOptions.Tuesday,
      InvalidDaysOptions.Wednesday,
    ]
    const mockDateField = {
      dateValidation: {
        selectedDateValidation: null,
        customMaxDate: null,
        customMinDate: null,
      },
      invalidDays: mockInvalidDays,
    }
    const expectedDateField: Partial<DateFieldBase> = {
      dateValidation: {
        selectedDateValidation: null,
        customMaxDate: null,
        customMinDate: null,
      },
      invalidDays: mockInvalidDays,
    }

    // Act
    const actual = await MockParent.create({
      responseMode: FormResponseMode.Encrypt,
      field: mockDateField,
    })

    // Assert
    const expected = merge(expectedDateField, mockDateField, {
      _id: expect.anything(),
    })
    expect(actual.field.toObject()).toEqual(expected)
  })

  it('should throw an error when an array with invalid values are assigned to invalidDays attribute', async () => {
    // Arrange
    const mockInvalidDays = ['January']
    const mockDateField = {
      dateValidation: {
        selectedDateValidation: null,
        customMaxDate: null,
        customMinDate: null,
      },
      invalidDays: mockInvalidDays,
    }

    await expect(
      MockParent.create({
        responseMode: FormResponseMode.Encrypt,
        field: mockDateField,
      }),
    ).rejects.toThrow(mongoose.Error.ValidationError)
  })

  it('should throw an error when an array with null value is assigned to invalidDays attribute array', async () => {
    // Arrange
    const mockInvalidDays = [null]
    const mockDateField = {
      dateValidation: {
        selectedDateValidation: null,
        customMaxDate: null,
        customMinDate: null,
      },
      invalidDays: mockInvalidDays,
    }

    await expect(
      MockParent.create({
        responseMode: FormResponseMode.Encrypt,
        field: mockDateField,
      }),
    ).rejects.toThrow(mongoose.Error.ValidationError)
  })

  it('should throw an error when an array with null value and valid values are assigned to invalidDays attribute array', async () => {
    // Arrange
    const mockInvalidDays = [
      null,
      InvalidDaysOptions.Monday,
      InvalidDaysOptions.Tuesday,
      InvalidDaysOptions.Wednesday,
    ]
    const mockDateField = {
      dateValidation: {
        selectedDateValidation: null,
        customMaxDate: null,
        customMinDate: null,
      },
      invalidDays: mockInvalidDays,
    }

    await expect(
      MockParent.create({
        responseMode: FormResponseMode.Encrypt,
        field: mockDateField,
      }),
    ).rejects.toThrow(mongoose.Error.ValidationError)
  })
})
