import { ObjectId } from 'bson-ext'
import mongoose from 'mongoose'
import { errAsync } from 'neverthrow'
import supertest, { Session } from 'supertest-session'
import { mocked } from 'ts-jest/utils'

import config from 'src/app/config/config'
import getFormModel from 'src/app/models/form.server.model'
import getUserModel from 'src/app/models/user.server.model'
import { SecretsManagerError } from 'src/app/modules/core/core.errors'
import { IPopulatedForm } from 'src/types'

import {
  createAuthedSession,
  logoutSession,
} from 'tests/integration/helpers/express-auth'
import { setupApp } from 'tests/integration/helpers/express-setup'
import dbHandler from 'tests/unit/backend/helpers/jest-db'

import * as AdminFormService from '../../../../../../../app/modules/form/admin-form/admin-form.service'
import { secretsManager } from '../../../../../../../app/modules/form/admin-form/admin-form.service'
import * as SmsService from '../../../../../../services/sms/sms.service'
import { AdminFormsRouter } from '../admin-forms.routes'

import { generateTwilioCredSecretKeyName } from './../../../../../../modules/form/admin-form/admin-form.utils'
import { TwilioCredentials } from './../../../../../../services/sms/sms.types'

// Prevent rate limiting.
jest.mock('src/app/utils/limit-rate')

// Avoid async refresh calls
jest.mock('src/app/modules/spcp/spcp.oidc.client.ts')

const MockAdminFormService = mocked(AdminFormService)

const app = setupApp('/admin/forms', AdminFormsRouter, {
  setupWithAuth: true,
})

const UserModel = getUserModel(mongoose)
const FormModel = getFormModel(mongoose)

describe('admin-form.twilio.routes', () => {
  let request: Session

  beforeAll(async () => await dbHandler.connect())
  beforeEach(async () => {
    request = supertest(app)
  })
  afterEach(async () => {
    await dbHandler.clearDatabase()
    jest.clearAllMocks()
  })
  afterAll(async () => await dbHandler.closeDatabase())

  describe('PUT /admin/forms/:formId/twilio', () => {
    const MOCK_FORM_ID = new ObjectId().toHexString()

    const MOCK_ACCOUNT_SID = 'AC12345678'
    const MOCK_API_KEY_SID = 'SK12345678'
    const MOCK_API_KEY_SECRET = 'AZ12345678'
    const MOCK_MESSAGING_SERVICE_SID = 'MG12345678'

    const TWILIO_CREDENTIALS: TwilioCredentials = {
      accountSid: MOCK_ACCOUNT_SID,
      apiKey: MOCK_API_KEY_SID,
      apiSecret: MOCK_API_KEY_SECRET,
      messagingServiceSid: MOCK_MESSAGING_SERVICE_SID,
    }

    const MOCK_INVALID_ACCOUNT_SID = 'ZZ12345678' // Invalid AC prefix

    const INVALID_TWILIO_CREDENTIALS: TwilioCredentials = {
      accountSid: MOCK_INVALID_ACCOUNT_SID,
      apiKey: MOCK_API_KEY_SID,
      apiSecret: MOCK_API_KEY_SECRET,
      messagingServiceSid: MOCK_MESSAGING_SERVICE_SID,
    }

    const MOCK_SUCCESSFUL_UPDATE = {
      message: 'Successfully updated Twilio credentials',
    }

    const MOCK_FORM = {
      _id: MOCK_FORM_ID,
      save: () => MOCK_FORM,
    } as unknown as IPopulatedForm

    it('should return 200 on successful twilio credentials addition', async () => {
      const { form: formToUpdate, user } = await dbHandler.insertEmailForm()
      const session = await createAuthedSession(user.email, request)
      const msgSrvcName = `formsg/${config.secretEnv}/form/${formToUpdate._id}/twilio`

      const createSecretsSpy = jest
        .spyOn(secretsManager, 'createSecret')
        .mockImplementationOnce(() => {
          return {
            promise: () => {
              return Promise.resolve({
                Name: msgSrvcName,
              })
            },
          } as any
        })

      const formSpy = jest
        .spyOn(FormModel.prototype, 'save')
        .mockImplementationOnce(() => null)

      // Actual
      const response = await session
        .put(`/admin/forms/${formToUpdate._id}/twilio`)
        .send(TWILIO_CREDENTIALS)

      // Assert
      expect(createSecretsSpy).toHaveBeenCalled()
      expect(formSpy).toHaveBeenCalled()
      expect(response.status).toEqual(200)
      expect(response.body).toEqual(MOCK_SUCCESSFUL_UPDATE)
    })

    it('should return 200 on successful twilio credentials update', async () => {
      const { form: formToUpdate, user } =
        await dbHandler.insertFormWithMsgSrvcName()
      const session = await createAuthedSession(user.email, request)
      const msgSrvcName = formToUpdate.msgSrvcName

      const getSecretsSpy = jest
        .spyOn(secretsManager, 'getSecretValue')
        .mockImplementationOnce(() => {
          return {
            promise: () => {
              return Promise.resolve({
                Name: msgSrvcName,
              })
            },
          } as any
        })

      const twilioCacheSpy = jest
        .spyOn(SmsService.twilioClientCache, 'del')
        .mockReturnValueOnce(1)

      const putSecretsSpy = jest
        .spyOn(secretsManager, 'putSecretValue')
        .mockImplementationOnce(() => {
          return {
            promise: () => {
              return Promise.resolve({
                Name: msgSrvcName,
              })
            },
          } as any
        })

      const response = await session
        .put(`/admin/forms/${formToUpdate._id}/twilio`)
        .send(TWILIO_CREDENTIALS)

      expect(response.status).toEqual(200)
      expect(response.body).toEqual(MOCK_SUCCESSFUL_UPDATE)

      expect(getSecretsSpy).toHaveBeenCalledWith({
        SecretId: msgSrvcName,
      })
      expect(twilioCacheSpy).toHaveBeenCalledWith(msgSrvcName)
      expect(putSecretsSpy).toHaveBeenCalledWith({
        SecretId: msgSrvcName,
        SecretString: JSON.stringify(TWILIO_CREDENTIALS),
      })
    })

    it('should return 400 when twilio credentials are invalid', async () => {
      const { form: formToUpdate, user } = await dbHandler.insertEmailForm()
      const session = await createAuthedSession(user.email, request)

      // Actual
      const response = await session
        .put(`/admin/forms/${formToUpdate._id}/twilio`)
        .send(INVALID_TWILIO_CREDENTIALS)

      // Assert
      expect(response.status).toEqual(400)
    })

    it('should return 401 when user is not logged in', async () => {
      const { form: formToUpdate, user } = await dbHandler.insertEmailForm()
      const session = await createAuthedSession(user.email, request)
      await logoutSession(request)

      const response = await session
        .put(`/admin/forms/${formToUpdate._id}/twilio`)
        .send(TWILIO_CREDENTIALS)

      expect(response.status).toEqual(401)
      expect(response.body).toEqual({ message: 'User is unauthorized.' })
    })

    it('should return 403 when user does not have permissions to update form', async () => {
      const { user } = await dbHandler.insertFormCollectionReqs()
      const session = await createAuthedSession(user.email, request)

      // Create separate user
      const collabUser = (
        await dbHandler.insertFormCollectionReqs({
          userId: new ObjectId(),
          mailName: 'collab-user',
          shortName: 'collabUser',
        })
      ).user

      const randomForm = await FormModel.create({
        title: 'form that user has no write access to',
        admin: collabUser._id,
        publicKey: 'some random key',
        // Current user only has read access.
        permissionList: [{ email: user.email }],
        _id: MOCK_FORM_ID,
      })

      const response = await session
        .put(`/admin/forms/${randomForm._id}/twilio`)
        .send(TWILIO_CREDENTIALS)

      expect(response.status).toEqual(403)
      expect(response.body).toEqual({
        message: `User ${user.email} not authorized to perform write operation on Form ${randomForm._id} with title: ${randomForm.title}.`,
      })
    })

    it('should return 404 when form to update cannot be found', async () => {
      const { user } = await dbHandler.insertFormCollectionReqs()
      const session = await createAuthedSession(user.email, request)
      const invalidFormId = MOCK_FORM_ID

      const response = await session
        .put(`/admin/forms/${invalidFormId}/twilio`)
        .send(TWILIO_CREDENTIALS)

      expect(response.status).toEqual(404)
      expect(response.body).toEqual({ message: 'Form not found' })
    })

    it('should return 422 when id of user adding twilio credentials is not found', async () => {
      const { form: formToUpdate, user } = await dbHandler.insertEmailForm()
      const session = await createAuthedSession(user.email, request)

      // Delete user after login.
      await dbHandler.clearCollection(UserModel.collection.name)

      const response = await session
        .put(`/admin/forms/${formToUpdate._id}/twilio`)
        .send(TWILIO_CREDENTIALS)

      expect(response.status).toEqual(422)
      expect(response.body).toEqual({ message: 'User not found' })
    })

    it('should return 500 when SecretsManagerError occurs whilst updating credentials', async () => {
      const { form: formToUpdate, user } = await dbHandler.insertEmailForm()
      const session = await createAuthedSession(user.email, request)

      jest
        .spyOn(MockAdminFormService, 'createTwilioCredentials')
        .mockReturnValueOnce(errAsync(new SecretsManagerError()))

      const response = await session
        .put(`/admin/forms/${formToUpdate._id}/twilio`)
        .send(TWILIO_CREDENTIALS)

      expect(response.status).toEqual(500)
      expect(response.body).toEqual({
        message: 'Something went wrong. Please try again.',
      })
    })
  })

  describe('DELETE /admin/forms/:formId/twilio', () => {
    const MOCK_FORM_ID = new ObjectId()
    const MOCK_MSG_SRVC_NAME = generateTwilioCredSecretKeyName(
      MOCK_FORM_ID.toHexString(),
    )

    const MOCK_SUCCESSFUL_DELETE_RESPONSE = {
      message: 'Successfully deleted Twilio credentials',
    }

    it('should return 200 on successful twilio credentials deletion', async () => {
      const { form, user } = await dbHandler.insertFormWithMsgSrvcName({
        formId: MOCK_FORM_ID,
        msgSrvcName: MOCK_MSG_SRVC_NAME,
      })
      const session = await createAuthedSession(user.email, request)
      const msgSrvcName = form.msgSrvcName

      const formSpy = jest
        .spyOn(FormModel.prototype, 'save')
        .mockImplementationOnce(() => null)

      const twilioCacheSpy = jest
        .spyOn(SmsService.twilioClientCache, 'del')
        .mockReturnValueOnce(1)

      const deleteSecretSpy = jest
        .spyOn(secretsManager, 'deleteSecret')
        .mockImplementationOnce(() => {
          return {
            promise: () => {
              return Promise.resolve({
                Name: msgSrvcName,
              })
            },
          } as any
        })

      // Actual
      const response = await session.delete(`/admin/forms/${form._id}/twilio`)

      // Assert
      expect(twilioCacheSpy).toHaveBeenCalledWith(msgSrvcName)
      expect(formSpy).toHaveBeenCalled()
      expect(deleteSecretSpy).toHaveBeenCalledWith({
        SecretId: msgSrvcName,
      })
      expect(response.status).toEqual(200)
      expect(response.body).toEqual(MOCK_SUCCESSFUL_DELETE_RESPONSE)
    })

    it('should return 401 when user is not logged in', async () => {
      const { form, user } = await dbHandler.insertEmailForm()
      const session = await createAuthedSession(user.email, request)
      await logoutSession(request)

      const response = await session.delete(`/admin/forms/${form._id}/twilio`)

      expect(response.status).toEqual(401)
      expect(response.body).toEqual({ message: 'User is unauthorized.' })
    })

    it('should return 403 when user does not have permissions to delete credentials', async () => {
      const { user } = await dbHandler.insertFormCollectionReqs()
      const session = await createAuthedSession(user.email, request)

      // Create separate user
      const collabUser = (
        await dbHandler.insertFormCollectionReqs({
          userId: new ObjectId(),
          mailName: 'collab-user',
          shortName: 'collabUser',
        })
      ).user

      const randomForm = await FormModel.create({
        title: 'form that user has no write access to',
        admin: collabUser._id,
        publicKey: 'some random key',
        // Current user only has read access.
        permissionList: [{ email: user.email }],
        _id: MOCK_FORM_ID,
      })

      const response = await session.delete(
        `/admin/forms/${randomForm._id}/twilio`,
      )

      expect(response.status).toEqual(403)
      expect(response.body).toEqual({
        message: `User ${user.email} not authorized to perform delete operation on Form ${randomForm._id} with title: ${randomForm.title}.`,
      })
    })

    it('should return 404 when form whose Twilio credentials should be deleted cannot be found', async () => {
      const { user } = await dbHandler.insertFormCollectionReqs()
      const session = await createAuthedSession(user.email, request)
      const invalidFormId = MOCK_FORM_ID

      const response = await session.delete(
        `/admin/forms/${invalidFormId}/twilio`,
      )

      expect(response.status).toEqual(404)
      expect(response.body).toEqual({ message: 'Form not found' })
    })

    it('should return 422 when id of user adding twilio credentials is not found', async () => {
      const { form, user } = await dbHandler.insertEmailForm()
      const session = await createAuthedSession(user.email, request)

      // Delete user after login.
      await dbHandler.clearCollection(UserModel.collection.name)

      const response = await session.delete(`/admin/forms/${form._id}/twilio`)

      expect(response.status).toEqual(422)
      expect(response.body).toEqual({ message: 'User not found' })
    })

    it('should return 500 when SecretsManagerError occurs whilst updating credentials', async () => {
      const { form, user } = await dbHandler.insertFormWithMsgSrvcName()
      const session = await createAuthedSession(user.email, request)

      jest
        .spyOn(MockAdminFormService, 'deleteTwilioCredentials')
        .mockReturnValueOnce(errAsync(new SecretsManagerError()))

      const response = await session.delete(`/admin/forms/${form._id}/twilio`)

      expect(response.status).toEqual(500)
      expect(response.body).toEqual({
        message: 'Something went wrong. Please try again.',
      })
    })
  })
})
