import { ObjectId } from 'bson'
import mongoose from 'mongoose'
import dbHandler from 'tests/unit/backend/helpers/jest-db'

import getFormModel from 'src/app/models/form.server.model'
// eslint-disable-next-line import/first
import { deactivateForm } from 'src/app/modules/form/form.service'

const MOCK_FORM_ID = new ObjectId()
const Form = getFormModel(mongoose)

describe('FormService', () => {
  beforeAll(async () => await dbHandler.connect())

  afterAll(async () => {
    await dbHandler.clearDatabase()
    await dbHandler.closeDatabase()
  })

  describe('deactivateForm', () => {
    it('should call Form.deactivateById', async () => {
      const mock = jest.spyOn(Form, 'deactivateById')
      await deactivateForm(String(MOCK_FORM_ID))
      expect(mock).toHaveBeenCalledWith(String(MOCK_FORM_ID))
    })
  })
})
