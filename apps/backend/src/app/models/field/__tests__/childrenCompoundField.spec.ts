import dbHandler from '__tests__/unit/backend/helpers/jest-db'
import {
  ChildrenFieldVersion,
  FormResponseMode,
  MyInfoChildAttributes,
} from 'formsg-shared/types'
import { Model, Schema } from 'mongoose'

import { IChildrenCompoundFieldSchema } from 'src/types'

import createChildrenCompoundFieldSchema from '../childrenCompoundField'

describe('models.fields.childrenCompoundField', () => {
  let MockParent: Model<{
    responseMode: FormResponseMode
    field: IChildrenCompoundFieldSchema
  }>

  beforeAll(async () => {
    const db = await dbHandler.connect()
    MockParent = db.model(
      'mockChildrenParent',
      new Schema({
        responseMode: {
          type: String,
          enum: Object.values(FormResponseMode),
        },
        field: createChildrenCompoundFieldSchema(),
      }),
    )
  })
  beforeEach(async () => await dbHandler.clearDatabase())
  afterAll(async () => await dbHandler.closeDatabase())

  const baseField = {
    childrenSubFields: [MyInfoChildAttributes.ChildName],
    allowMultiple: false,
  }

  it('persists the v2 schema version', async () => {
    const actual = await MockParent.create({
      responseMode: FormResponseMode.Encrypt,
      field: { ...baseField, version: ChildrenFieldVersion.V2 },
    })

    expect(actual.field.toObject().version).toBe(ChildrenFieldVersion.V2)
  })

  it('leaves version unset for a legacy field', async () => {
    const actual = await MockParent.create({
      responseMode: FormResponseMode.Encrypt,
      field: baseField,
    })

    expect(actual.field.toObject().version).toBeUndefined()
  })
})
