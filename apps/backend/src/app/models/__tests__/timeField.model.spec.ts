import dbHandler from '__tests__/unit/backend/helpers/jest-db'
import { ObjectId } from 'bson'
import { BasicField, FormResponseMode } from 'formsg-shared/types'
import mongoose from 'mongoose'

import getFormModel from 'src/app/models/form.server.model'

const Form = getFormModel(mongoose)
const ADMIN = new ObjectId()

describe('Time field mongoose schema', () => {
  beforeAll(async () => {
    await dbHandler.connect()
    await dbHandler.insertFormCollectionReqs({ userId: ADMIN })
  })
  afterAll(async () => {
    await dbHandler.clearDatabase()
    await dbHandler.closeDatabase()
  })

  it('should persist a time field with its display settings', async () => {
    const form = await Form.create({
      title: 'form with a time field',
      admin: ADMIN,
      responseMode: FormResponseMode.Email,
      emails: ['a@example.com'],
      form_fields: [
        {
          fieldType: BasicField.Time,
          title: 'Appointment time',
          required: true,
          includeSeconds: true,
          use24HourFormat: false,
        },
      ],
    })

    const saved = await Form.findById(form._id)
    const field = saved?.form_fields?.[0] as unknown as {
      fieldType: string
      includeSeconds: boolean
      use24HourFormat: boolean
    }
    expect(field.fieldType).toEqual(BasicField.Time)
    expect(field.includeSeconds).toEqual(true)
    expect(field.use24HourFormat).toEqual(false)
  })

  it('should default to 24-hour without seconds', async () => {
    const form = await Form.create({
      title: 'form with a default time field',
      admin: ADMIN,
      responseMode: FormResponseMode.Email,
      emails: ['a@example.com'],
      form_fields: [
        { fieldType: BasicField.Time, title: 'When?', required: true },
      ],
    })
    const field = (await Form.findById(form._id))
      ?.form_fields?.[0] as unknown as {
      includeSeconds: boolean
      use24HourFormat: boolean
    }
    expect(field.includeSeconds).toEqual(false)
    expect(field.use24HourFormat).toEqual(false)
  })
})
