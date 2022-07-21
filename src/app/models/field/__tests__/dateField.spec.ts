import merge from 'lodash/merge'
import mongoose, { Model, Schema } from 'mongoose'
import { DateFieldBase, DaysOfTheWeek, FormResponseMode } from 'shared/types'

import { IDateFieldSchema } from 'src/types'

import dbHandler from 'tests/unit/backend/helpers/jest-db'

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

  it('should set default empty array for invalidDaysOfTheWeek when date field does not specify', async () => {
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
      invalidDaysOfTheWeek: [],
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

  it('should set expected array for invalidDaysOfTheWeek when date field specifies', async () => {
    // Arrange
    const mockInvalidDaysOfTheWeek = [
      DaysOfTheWeek.Monday,
      DaysOfTheWeek.Tuesday,
      DaysOfTheWeek.Wednesday,
    ]
    const mockDateField = {
      dateValidation: {
        selectedDateValidation: null,
        customMaxDate: null,
        customMinDate: null,
      },
      invalidDaysOfTheWeek: mockInvalidDaysOfTheWeek,
    }
    const expectedDateField: Partial<DateFieldBase> = {
      dateValidation: {
        selectedDateValidation: null,
        customMaxDate: null,
        customMinDate: null,
      },
      invalidDaysOfTheWeek: mockInvalidDaysOfTheWeek,
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

  it('should throw an error when invalid values are added to invalidDaysOfTheWeek attribute', async () => {
    // Arrange
    const mockInvalidDaysOfTheWeek = [10000]
    const mockDateField = {
      dateValidation: {
        selectedDateValidation: null,
        customMaxDate: null,
        customMinDate: null,
      },
      invalidDaysOfTheWeek: mockInvalidDaysOfTheWeek,
    }

    await expect(
      MockParent.create({
        responseMode: FormResponseMode.Encrypt,
        field: mockDateField,
      }),
    ).rejects.toThrowError(mongoose.Error.ValidationError)
  })

  it('should throw an error when null value is added to invalidDaysOfTheWeek attribute array', async () => {
    // Arrange
    const mockInvalidDaysOfTheWeek = [null]
    const mockDateField = {
      dateValidation: {
        selectedDateValidation: null,
        customMaxDate: null,
        customMinDate: null,
      },
      invalidDaysOfTheWeek: mockInvalidDaysOfTheWeek,
    }

    await expect(
      MockParent.create({
        responseMode: FormResponseMode.Encrypt,
        field: mockDateField,
      }),
    ).rejects.toThrowError(mongoose.Error.ValidationError)
  })

  it('should throw an error when null value is added to invalidDaysOfTheWeek attribute array with valid values', async () => {
    // Arrange
    const mockInvalidDaysOfTheWeek = [null, 1, 2, 3]
    const mockDateField = {
      dateValidation: {
        selectedDateValidation: null,
        customMaxDate: null,
        customMinDate: null,
      },
      invalidDaysOfTheWeek: mockInvalidDaysOfTheWeek,
    }

    await expect(
      MockParent.create({
        responseMode: FormResponseMode.Encrypt,
        field: mockDateField,
      }),
    ).rejects.toThrowError(mongoose.Error.ValidationError)
  })
})
