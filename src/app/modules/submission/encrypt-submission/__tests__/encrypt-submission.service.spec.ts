/* eslint-disable @typescript-eslint/ban-ts-comment */
import dbHandler from '__tests__/unit/backend/helpers/jest-db'
import { ObjectId } from 'bson'
import mongoose from 'mongoose'
import { okAsync } from 'neverthrow'

import { getEncryptSubmissionModel } from 'src/app/models/submission.server.model'
import { WebhookFactory } from 'src/app/modules/webhook/webhook.factory'
import { IEncryptedSubmissionSchema, IPopulatedEncryptedForm } from 'src/types'

import * as FormService from '../../../form/form.service'
import {
  createEncryptSubmissionWithoutSave,
  performEncryptPostSubmissionActions,
} from '../encrypt-submission.service'

const EncryptSubmission = getEncryptSubmissionModel(mongoose)

describe('encrypt-submission.service', () => {
  beforeAll(async () => await dbHandler.connect())
  beforeEach(async () => {
    await dbHandler.clearDatabase()
    jest.restoreAllMocks()
  })
  afterAll(async () => await dbHandler.closeDatabase())

  describe('createEncryptSubmissionWithoutSave', () => {
    const MOCK_FORM = {
      admin: new ObjectId(),
      _id: new ObjectId(),
      title: 'mock title',
      getUniqueMyInfoAttrs: () => [],
      authType: 'NIL',
    } as unknown as IPopulatedEncryptedForm
    const MOCK_ENCRYPTED_CONTENT = 'mockEncryptedContent'
    const MOCK_VERIFIED_CONTENT = 'mockVerifiedContent'
    const MOCK_VERSION = 1
    const MOCK_ATTACHMENT_METADATA = new Map([['a', 'b']])

    it('should create a new submission without saving it to the database', async () => {
      const result = createEncryptSubmissionWithoutSave({
        encryptedContent: MOCK_ENCRYPTED_CONTENT,
        form: MOCK_FORM,
        version: MOCK_VERSION,
        attachmentMetadata: MOCK_ATTACHMENT_METADATA,
        verifiedContent: MOCK_VERIFIED_CONTENT,
      })
      const foundInDatabase = await EncryptSubmission.findOne({
        _id: result._id,
      })

      expect(result.encryptedContent).toBe(MOCK_ENCRYPTED_CONTENT)
      expect(result.form).toEqual(MOCK_FORM._id)
      expect(result.verifiedContent).toEqual(MOCK_VERIFIED_CONTENT)
      expect(Object.fromEntries(result.attachmentMetadata!)).toEqual(
        Object.fromEntries(MOCK_ATTACHMENT_METADATA),
      )
      expect(result.version).toEqual(MOCK_VERSION)
      expect(foundInDatabase).toBeNull()
    })
  })

  describe('performEncryptPostSubmissionActions', () => {
    const webhookSpy = jest
      .spyOn(WebhookFactory, 'sendInitialWebhook')
      .mockReturnValue(okAsync(true))

    const MOCK_ENCRYPTED_CONTENT = 'mockEncryptedContent'
    const MOCK_VERIFIED_CONTENT = 'mockVerifiedContent'
    const MOCK_WEBHOOK_URL = 'https://example.com/webhook'

    const MOCK_FORM = {
      admin: new ObjectId(),
      _id: new ObjectId(),
      title: 'mock title',
      getUniqueMyInfoAttrs: () => [],
      authType: 'NIL',
      webhook: { url: MOCK_WEBHOOK_URL, isRetryEnabled: true },
    } as unknown as IPopulatedEncryptedForm

    const MOCK_SUBMISSION = {
      _id: 'submission123',
      form: MOCK_FORM._id,
      encryptedContent: MOCK_ENCRYPTED_CONTENT,
      verifiedContent: MOCK_VERIFIED_CONTENT,
    } as unknown as IEncryptedSubmissionSchema

    it('should call WebhookFactory.sendInitialWebhook with the correct arguments', async () => {
      const encryptedWebhookContent = 'mockEncryptedWebhookContent'

      jest
        .spyOn(FormService, 'retrieveFullFormById')
        .mockReturnValue(okAsync(MOCK_FORM))
      await performEncryptPostSubmissionActions({
        submission: { ...MOCK_SUBMISSION } as IEncryptedSubmissionSchema,
        responses: [],
        encryptedWebhookContent,
      }).map(() => {
        expect(webhookSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 'submission123',
            encryptedContent: encryptedWebhookContent,
            verifiedContent: MOCK_VERIFIED_CONTENT,
          }),
          MOCK_WEBHOOK_URL,
          true,
        )
      })
    })

    it('should not call WebhookFactory.sendInitialWebhook if encryptedWebhookContent is undefined', async () => {
      const encryptedWebhookContent = undefined

      jest
        .spyOn(FormService, 'retrieveFullFormById')
        .mockReturnValue(okAsync(MOCK_FORM))
      await performEncryptPostSubmissionActions({
        submission: { ...MOCK_SUBMISSION } as IEncryptedSubmissionSchema,
        responses: [],
        encryptedWebhookContent,
      }).map(() => {
        expect(webhookSpy).not.toHaveBeenCalled()
      })
    })
  })
})
