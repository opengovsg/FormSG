import dbHandler from '__tests__/unit/backend/helpers/jest-db'
import { ObjectId } from 'bson'
import { FormResponseMode } from 'formsg-shared/types'
import mongoose from 'mongoose'

import getFormModel from 'src/app/models/form.server.model'

const Form = getFormModel(mongoose)
const ADMIN = new ObjectId()

describe('closeAt hydration on pre-existing documents', () => {
  beforeAll(async () => {
    await dbHandler.connect()
    await dbHandler.insertFormCollectionReqs({ userId: ADMIN })
  })
  afterAll(async () => {
    await dbHandler.clearDatabase()
    await dbHandler.closeDatabase()
  })

  it('should hydrate a document with no closeAt field as null, not undefined', async () => {
    const form = await Form.create({
      title: 'pre-existing form',
      admin: ADMIN,
      responseMode: FormResponseMode.Email,
      emails: ['a@example.com'],
    })

    // Simulate a document written before this feature existed.
    await Form.collection.updateOne(
      { _id: form._id },
      { $unset: { closeAt: '' } },
    )
    const raw = await Form.collection.findOne({ _id: form._id })
    expect('closeAt' in (raw ?? {})).toBe(false)

    const hydrated = await Form.findById(form._id)
    // The claim under test: mongoose materialises the schema default on read,
    // so consumers never see `undefined`.
    expect(hydrated?.closeAt).toBeNull()

    const settings = hydrated?.getSettings()
    expect(settings).toHaveProperty('closeAt')
    expect((settings as { closeAt: unknown }).closeAt).toBeNull()
  })

  it('should default closeAt to null on a newly created form', async () => {
    const form = await Form.create({
      title: 'brand new form',
      admin: ADMIN,
      responseMode: FormResponseMode.Email,
      emails: ['a@example.com'],
    })
    expect(form.closeAt).toBeNull()
  })
})
