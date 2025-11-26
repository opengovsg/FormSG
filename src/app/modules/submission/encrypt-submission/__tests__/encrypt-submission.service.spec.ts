/* eslint-disable @typescript-eslint/ban-ts-comment */
import dbHandler from '__tests__/unit/backend/helpers/jest-db'
import { ObjectId } from 'bson'
import mongoose from 'mongoose'

import { getEncryptSubmissionModel } from 'src/app/models/submission.server.model'
import { FormFieldSchema, IAttachmentInfo, IEncryptedSubmissionSchema, IPopulatedEncryptedForm } from 'src/types'

import { ok, okAsync } from 'neverthrow'
import * as FormService from 'src/app/modules/form/form.service'
import MailService from 'src/app/services/mail/mail.service'
import { createEncryptSubmissionWithoutSave, performEncryptPostSubmissionActions } from '../encrypt-submission.service'
import { BasicField, FieldResponse, FormAuthType, FormResponseMode, MyInfoAttribute, PaymentChannel } from 'shared/types'
import * as MailUtils from 'src/app/services/mail/mail.utils'
import { ProcessedFieldResponse } from '../../submission.types'

const EncryptSubmission = getEncryptSubmissionModel(mongoose)

jest.mock('src/app/services/mail/mail.service')
jest.mock('src/app/modules/form/form.service')
jest.mock('src/app/services/mail/mail.utils')
const MockMailService = jest.mocked(MailService)
const MockFormService = jest.mocked(FormService)
const MockMailUtils = jest.mocked(MailUtils)

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

    const MOCK_NON_PAYMENT_ENCRYPT_FORM = {
      _id: new ObjectId(),
      title: 'Test Form',
      responseMode: FormResponseMode.Encrypt,
      authType: FormAuthType.NIL,
      form_fields: [] as FormFieldSchema[],
      emails: ['test@example.com'],
      getUniqueMyInfoAttrs: () => [] as MyInfoAttribute[],
      payments_channel: {
        channel: PaymentChannel.Unconnected,
      },
      payments_field: {
        enabled: false,
      },
    } as IPopulatedEncryptedForm

    describe('sendSubmissionToAdmin is provided with the correct payload', () => {
      beforeEach(() => {
        jest.clearAllMocks()
        MockMailService.sendSubmissionToAdmin.mockReturnValue(okAsync(true))
        MockFormService.retrieveFullFormById.mockReturnValue(okAsync(MOCK_NON_PAYMENT_ENCRYPT_FORM))
        MockMailUtils.generateAutoreplyPdf.mockReturnValue(okAsync(Buffer.from('mock pdf buffer')))
      })

      describe('pdfAttachment', () => {
        it('should generate pdf attachment if required and pass to sendSubmissionToAdmin', async () => {})

        it('should not generate pdf attachment if not required and not pass to sendSubmissionToAdmin', async () => {})
      })

      describe('submissionAttachments', () => {
        it('should call sendSubmissionToAdmin with no submission attachments submission has no attachments', async () => {
          // Arrange
          const noAttachments: IAttachmentInfo[] = []

          const mockSubmission = {
            _id: new ObjectId(),
            form: new ObjectId(),
            created: new Date(),
          } as IEncryptedSubmissionSchema

          // Act
          const postSubmissionActionStatus = await performEncryptPostSubmissionActions({
            submission: mockSubmission,
            responses: [],
            emailFields: [],
            submissionAttachments: noAttachments,
            respondentEmails: [],
          })


          // Assert
          expect(postSubmissionActionStatus).toEqual(ok(true))

          expect(MockMailService.sendSubmissionToAdmin).toHaveBeenCalledWith(
            expect.objectContaining({
              submissionAttachments: noAttachments,
            }),
          )
        })

        it('should call sendSubmissionToAdmin with submmission attachments when submission has attachments', async () => {
          // Arrange
          const twoAttachments: IAttachmentInfo[] = [
            {
              filename: 'test.pdf',
              content: Buffer.from('this is a test file'),
              fieldId: 'test-field-id',
            },
          ]

          const mockSubmission = {
            _id: new ObjectId(),
            form: new ObjectId(),
            created: new Date(),
          } as IEncryptedSubmissionSchema

          // Act
          await performEncryptPostSubmissionActions({
            submission: mockSubmission,
            responses: [],
            emailFields: [],
            submissionAttachments: twoAttachments,
            respondentEmails: [],
          })

          // Assert
          expect(MockMailService.sendSubmissionToAdmin).toHaveBeenCalledWith(
            expect.objectContaining({
              submissionAttachments: twoAttachments,
            }),
          )
        })
      })


      describe('dataCollationData', () => {
        it('should pass expected dataCollationData to sendSubmissionToAdmin', async () => {
          // Arrange  
          const mockResponses: ProcessedFieldResponse[] = [
            {
              _id: new ObjectId().toHexString(),
              question: '[MyInfo] Test Question',
              answer: 'Test Answer',
              fieldType: BasicField.ShortText,
            },
            {
              _id: new ObjectId().toHexString(),
              question: 'Signature Question',
              answerArray: ['draw', '[[[10,20,0.5]],[[40,40,0.5]]]'],
              fieldType: BasicField.Signature,
            },
          ]

          const mockSubmission = {
            _id: new ObjectId(),
            form: new ObjectId(),
            created: new Date(),
          } as IEncryptedSubmissionSchema

          // Act
          await performEncryptPostSubmissionActions({
            submission: mockSubmission,
            responses: mockResponses,
            emailFields: mockResponses,
            submissionAttachments: [],
            respondentEmails: [],
          })

          // Assert
          expect(MockMailService.sendSubmissionToAdmin).toHaveBeenCalledWith(
            expect.objectContaining({
              dataCollationData: expect.arrayContaining([
                expect.objectContaining({
                  question: 'Test Question',
                  answer: 'Test Answer',
                }),
                expect.objectContaining({
                  question: '[signature] Signature Question',
                  answer: `Signature captured`,
                }),
              ]),
            }),
          )
        })

        it('should strip [MyInfo] prefix from expected dataCollationData to sendSubmissionToAdmin', async () => {
          // Arrange
          const mockResponses: ProcessedFieldResponse[] = [
            {
              _id: new ObjectId().toHexString(),
              question: '[MyInfo] Name',
              answer: 'Test Answer',
              fieldType: BasicField.ShortText,
              isVisible: true,
            },
          ]

          const mockSubmission = {
            _id: new ObjectId(),
            form: new ObjectId(),
            created: new Date(),
          } as IEncryptedSubmissionSchema

          // Act
          await performEncryptPostSubmissionActions({
            submission: mockSubmission,
            responses: mockResponses,
            emailFields: mockResponses,
            submissionAttachments: [],
            respondentEmails: [],
          })

          // Assert
          expect(MockMailService.sendSubmissionToAdmin).toHaveBeenCalledWith(
            expect.objectContaining({
              dataCollationData: expect.arrayContaining([
                expect.objectContaining({
                  question: 'Name',
                  answer: 'Test Answer',
                }),
              ]),
            }),
          )
        })
      })
    })
  })
})
