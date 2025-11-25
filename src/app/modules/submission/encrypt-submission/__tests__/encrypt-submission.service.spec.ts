/* eslint-disable @typescript-eslint/ban-ts-comment */
import dbHandler from '__tests__/unit/backend/helpers/jest-db'
import { ObjectId } from 'bson'
import mongoose from 'mongoose'
import { ok, okAsync } from 'neverthrow'
import {
  BasicField,
  EmailResponse, FormAuthType,
  FormResponseMode,
  MyInfoAttribute,
  PaymentChannel
} from 'shared/types'

import { getEncryptSubmissionModel } from 'src/app/models/submission.server.model'
import * as FormService from 'src/app/modules/form/form.service'
import MailService from 'src/app/services/mail/mail.service'
import * as MailUtils from 'src/app/services/mail/mail.utils'
import {
  FormFieldSchema,
  IAttachmentInfo,
  IEncryptedSubmissionSchema,
  IPopulatedEncryptedForm,
  SgidFieldTitle,
} from 'src/types'

import { ProcessedFieldResponse } from '../../submission.types'
import {
  createEncryptSubmissionWithoutSave,
  performEncryptPostSubmissionActions,
} from '../encrypt-submission.service'

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

    const MOCK_PAYMENT_ENCRYPT_FORM = {
      _id: new ObjectId(),
      title: 'Test Form',
      responseMode: FormResponseMode.Encrypt,
      authType: FormAuthType.NIL,
      form_fields: [] as FormFieldSchema[],
      emails: ['test@example.com'],
      getUniqueMyInfoAttrs: () => [] as MyInfoAttribute[],
      payments_channel: {
        channel: PaymentChannel.Stripe,
      },
      payments_field: {
        enabled: true,
      },
    } as IPopulatedEncryptedForm

    const MOCK_SUBMISSION_ATTACHMENTS = [
      {
        filename: 'test.pdf',
        content: 'something',
      },
      {
        filename: 'test2.pdf',
        content: 'something else',
      },
    ]
    const MOCK_NRIC = 'S1234567A'

    const MOCK_PDF_ATTACHMENT_BUFFER = Buffer.from('mock pdf buffer')
    const MOCK_PDF_ATTACHMENT = {
      filename: 'response.pdf',
      content: MOCK_PDF_ATTACHMENT_BUFFER,
    }

    describe('pdfAttachment generation and passing to sendSubmissionToAdmin and sendEmailConfirmations', () => {
      beforeEach(() => {
        jest.clearAllMocks()
        MockMailService.sendSubmissionToAdmin.mockReturnValue(okAsync(true))
        MockMailService.sendAutoReplyEmails.mockResolvedValue([
          {
            status: 'fulfilled',
            value: ok(true),
          },
        ])
        MockMailUtils.generateAutoreplyPdf.mockReturnValue(
          okAsync(MOCK_PDF_ATTACHMENT_BUFFER),
        )
      })

      it('should not generate pdf attachment if payment is enabled and not pass to either sendSubmissionToAdmin or sendEmailConfirmations', async () => {
        // Arrange
        const mockSubmission = {
          _id: new ObjectId(),
          form: new ObjectId(),
          created: new Date(),
        } as IEncryptedSubmissionSchema
        const mockResponses: ProcessedFieldResponse[] = [
          {
            _id: new ObjectId().toHexString(),
            question: SgidFieldTitle.SgidNric,
            answer: MOCK_NRIC,
            fieldType: BasicField.Nric,
          },
        ]
        MockFormService.retrieveFullFormById.mockReturnValue(
          okAsync(MOCK_PAYMENT_ENCRYPT_FORM),
        )

        // Act
        await performEncryptPostSubmissionActions({
          submission: mockSubmission,
          responses: mockResponses,
          emailFields: mockResponses,
          submissionAttachments: MOCK_SUBMISSION_ATTACHMENTS,
          respondentEmails: ['email1@example.com', 'email2@example.com'],
        })

        // Assert
        expect(MockMailUtils.generateAutoreplyPdf).not.toHaveBeenCalled()
        expect(MockMailService.sendSubmissionToAdmin).toHaveBeenCalledWith(
          expect.objectContaining({
            submissionAttachments: MOCK_SUBMISSION_ATTACHMENTS,
            pdfAttachment: undefined,
          }),
        )
        expect(MockMailService.sendAutoReplyEmails).toHaveBeenCalledWith(
          expect.objectContaining({
            submissionAttachments: MOCK_SUBMISSION_ATTACHMENTS,
            pdfAttachment: undefined,
          }),
        )
      })

      it('should generate pdf attachment and pass pdf attachment to both sendSubmissionToAdmin and sendEmailConfirmation if form summary is enabled and payment is not enabled', async () => {
        // Arrange
        const mockSubmission = {
          _id: new ObjectId(),
          form: new ObjectId(),
          created: new Date(),
        } as IEncryptedSubmissionSchema
        const mockResponses: ProcessedFieldResponse[] = [
          {
            _id: new ObjectId().toHexString(),
            question: SgidFieldTitle.SgidNric,
            answer: MOCK_NRIC,
            fieldType: BasicField.Nric,
          },
        ]
        MockFormService.retrieveFullFormById.mockReturnValue(
          okAsync(MOCK_NON_PAYMENT_ENCRYPT_FORM),
        )

        // Act
        await performEncryptPostSubmissionActions({
          submission: mockSubmission,
          responses: mockResponses,
          emailFields: mockResponses,
          submissionAttachments: MOCK_SUBMISSION_ATTACHMENTS,
          respondentEmails: ['email1@example.com', 'email2@example.com'], // presence of respondent emails means that form summary is enabled
        })

        // Assert
        expect(MockMailUtils.generateAutoreplyPdf).toHaveBeenCalledOnce()
        expect(MockMailService.sendSubmissionToAdmin).toHaveBeenCalledWith(
          expect.objectContaining({
            submissionAttachments: MOCK_SUBMISSION_ATTACHMENTS,
            pdfAttachment: MOCK_PDF_ATTACHMENT,
          }),
        )
        expect(MockMailService.sendAutoReplyEmails).toHaveBeenCalledWith(
          expect.objectContaining({
            submissionAttachments: MOCK_SUBMISSION_ATTACHMENTS,
            pdfAttachment: MOCK_PDF_ATTACHMENT,
          }),
        )
      })

      it('should generate pdf attachment and pass pdf attachment to only sendSubmissionToAdmin if form summary and payment both are not enabled', async () => {
        // Arrange
        const mockSubmission = {
          _id: new ObjectId(),
          form: new ObjectId(),
          created: new Date(),
        } as IEncryptedSubmissionSchema
        const mockResponsesWithoutAutoReplyEmailFields: ProcessedFieldResponse[] =
          [
            {
              _id: new ObjectId().toHexString(),
              question: SgidFieldTitle.SgidNric,
              answer: MOCK_NRIC,
              fieldType: BasicField.Nric,
            },
          ]
        MockFormService.retrieveFullFormById.mockReturnValue(
          okAsync(MOCK_NON_PAYMENT_ENCRYPT_FORM),
        )

        // Act
        await performEncryptPostSubmissionActions({
          submission: mockSubmission,
          responses: mockResponsesWithoutAutoReplyEmailFields,
          emailFields: mockResponsesWithoutAutoReplyEmailFields,
          submissionAttachments: MOCK_SUBMISSION_ATTACHMENTS,
          respondentEmails: [],
        })

        // Assert
        expect(MockMailUtils.generateAutoreplyPdf).toHaveBeenCalledOnce()
        expect(MockMailService.sendSubmissionToAdmin).toHaveBeenCalledWith(
          expect.objectContaining({
            pdfAttachment: MOCK_PDF_ATTACHMENT,
            submissionAttachments: MOCK_SUBMISSION_ATTACHMENTS,
          }),
        )
        expect(MockMailService.sendAutoReplyEmails).not.toHaveBeenCalled()
      })
    })

    describe('sendEmailConfirmations', () => {
      beforeEach(() => {
        jest.clearAllMocks()
        MockMailService.sendSubmissionToAdmin.mockReturnValue(okAsync(true))
        MockMailService.sendAutoReplyEmails.mockResolvedValue([
          {
            status: 'fulfilled',
            value: ok(true),
          },
        ])
        MockMailUtils.generateAutoreplyPdf.mockReturnValue(
          okAsync(MOCK_PDF_ATTACHMENT_BUFFER),
        )
      })

      it('should sendEmailConfirmations if there are respondent emails', async () => {
        // Arrange
        const mockSubmission = {
          _id: new ObjectId(),
          form: new ObjectId(),
          created: new Date(),
        } as IEncryptedSubmissionSchema
        const mockResponsesWithoutAutoReplyEmailFields: ProcessedFieldResponse[] =
          [
            {
              _id: new ObjectId().toHexString(),
              question: SgidFieldTitle.SgidNric,
              answer: MOCK_NRIC,
              fieldType: BasicField.Nric,
            },
          ]
        MockFormService.retrieveFullFormById.mockReturnValue(
          okAsync(MOCK_NON_PAYMENT_ENCRYPT_FORM),
        )

        // Act
        await performEncryptPostSubmissionActions({
          submission: mockSubmission,
          responses: mockResponsesWithoutAutoReplyEmailFields,
          emailFields: mockResponsesWithoutAutoReplyEmailFields,
          submissionAttachments: MOCK_SUBMISSION_ATTACHMENTS,
          respondentEmails: ['email1@example.com', 'email2@example.com'],
        })

        // Assert
        expect(MockMailUtils.generateAutoreplyPdf).toHaveBeenCalledOnce()
        expect(MockMailService.sendAutoReplyEmails).toHaveBeenCalledWith(
          expect.objectContaining({
            autoReplyMailDatas: [
              { email: 'email1@example.com', includeFormSummary: true },
              { email: 'email2@example.com', includeFormSummary: true },
            ],
          }),
        )
      })

      it('should sendEmailConfirmations if there are email fields with auto reply enabled', async () => {
        // Arrange
        const mockSubmission = {
          _id: new ObjectId(),
          form: new ObjectId(),
          created: new Date(),
        } as IEncryptedSubmissionSchema
        const emailFieldId = new ObjectId().toHexString()
        const emailResponse = {
          _id: emailFieldId,
          question: 'Email of respondent',
          answer: 'email1@example.com',
          fieldType: BasicField.Email,
        } as EmailResponse
        const emailFieldId2 = new ObjectId().toHexString()
        const emailResponse2 = {
          _id: emailFieldId2,
          question: 'Email of respondent',
          answer: 'email2@example.com',
          fieldType: BasicField.Email,
        } as EmailResponse
        const mockResponses: ProcessedFieldResponse[] = [
          {
            _id: new ObjectId().toHexString(),
            question: SgidFieldTitle.SgidNric,
            answer: MOCK_NRIC,
            fieldType: BasicField.Nric,
          },
          emailResponse,
          emailResponse2,
        ]

        const emailField = {
          _id: emailFieldId,
          fieldType: BasicField.Email,
          autoReplyOptions: {
            hasAutoReply: true,
            autoReplySubject: 'Test Subject',
            autoReplySender: 'test@example.com',
            autoReplyMessage: 'Test Message',
            includeFormSummary: true,
          },
        }

        const emailField2 = {
          _id: emailFieldId2,
          fieldType: BasicField.Email,
          autoReplyOptions: {
            hasAutoReply: true,
            autoReplySubject: 'Test Subject',
            autoReplySender: 'test@example.com',
            autoReplyMessage: 'Test Message',
            includeFormSummary: false,
          },
        }

        const mockNonPaymentEncryptFormWithEmailField = {
          ...MOCK_NON_PAYMENT_ENCRYPT_FORM,
          form_fields: [
            ...MOCK_NON_PAYMENT_ENCRYPT_FORM.form_fields,
            emailField,
            emailField2,
          ],
        } as IPopulatedEncryptedForm

        MockFormService.retrieveFullFormById.mockReturnValue(
          okAsync(mockNonPaymentEncryptFormWithEmailField),
        )

        // Act
        await performEncryptPostSubmissionActions({
          submission: mockSubmission,
          responses: mockResponses,
          emailFields: mockResponses,
          submissionAttachments: MOCK_SUBMISSION_ATTACHMENTS,
          respondentEmails: [],
        })

        // Assert
        expect(MockMailUtils.generateAutoreplyPdf).toHaveBeenCalledOnce()
        expect(MockMailService.sendAutoReplyEmails).toHaveBeenCalledWith(
          expect.objectContaining({
            submissionAttachments: MOCK_SUBMISSION_ATTACHMENTS,
            pdfAttachment: MOCK_PDF_ATTACHMENT,
            autoReplyMailDatas: [
              {
                body: emailField.autoReplyOptions.autoReplyMessage,
                email: emailResponse.answer,
                includeFormSummary:
                  emailField.autoReplyOptions.includeFormSummary,
                sender: emailField.autoReplyOptions.autoReplySender,
                subject: emailField.autoReplyOptions.autoReplySubject,
              },
              {
                body: emailField2.autoReplyOptions.autoReplyMessage,
                email: emailResponse2.answer,
                includeFormSummary:
                  emailField2.autoReplyOptions.includeFormSummary,
                sender: emailField2.autoReplyOptions.autoReplySender,
                subject: emailField2.autoReplyOptions.autoReplySubject,
              },
            ],
          }),
        )
      })

      it('should not sendEmailConfirmations if there are no respondent emails and no email fields with auto reply enabled', async () => {
        // Arrange
        const mockSubmission = {
          _id: new ObjectId(),
          form: new ObjectId(),
          created: new Date(),
        } as IEncryptedSubmissionSchema
        const mockResponsesWithoutAutoReplyEmailFields: ProcessedFieldResponse[] =
          [
            {
              _id: new ObjectId().toHexString(),
              question: SgidFieldTitle.SgidNric,
              answer: MOCK_NRIC,
              fieldType: BasicField.Nric,
            },
          ]
        MockFormService.retrieveFullFormById.mockReturnValue(
          okAsync(MOCK_NON_PAYMENT_ENCRYPT_FORM),
        )

        // Act
        await performEncryptPostSubmissionActions({
          submission: mockSubmission,
          responses: mockResponsesWithoutAutoReplyEmailFields,
          emailFields: mockResponsesWithoutAutoReplyEmailFields,
          submissionAttachments: MOCK_SUBMISSION_ATTACHMENTS,
          respondentEmails: [],
        })

        // Assert
        expect(MockMailService.sendAutoReplyEmails).not.toHaveBeenCalled()
      })
    })

    describe('sendSubmissionToAdmin', () => {
      beforeEach(() => {
        jest.clearAllMocks()
        MockMailService.sendSubmissionToAdmin.mockReturnValue(okAsync(true))
        MockFormService.retrieveFullFormById.mockReturnValue(
          okAsync(MOCK_NON_PAYMENT_ENCRYPT_FORM),
        )
        MockMailUtils.generateAutoreplyPdf.mockReturnValue(
          okAsync(Buffer.from('mock pdf buffer')),
        )
      })

      describe('emailFields', () => {
        it('should include nric field in notification email if provided', async () => {
          // Arrange
          const MOCK_NRIC = 'S1234567A'
          const mockSubmission = {
            _id: new ObjectId(),
            form: new ObjectId(),
            created: new Date(),
          } as IEncryptedSubmissionSchema

          const mockResponses: ProcessedFieldResponse[] = [
            {
              _id: new ObjectId().toHexString(),
              question: SgidFieldTitle.SgidNric,
              answer: MOCK_NRIC,
              fieldType: BasicField.Nric,
            },
          ]

          // Act
          const postSubmissionActionStatus =
            await performEncryptPostSubmissionActions({
              submission: mockSubmission,
              responses: mockResponses,
              emailFields: mockResponses,
              submissionAttachments: [],
              respondentEmails: [],
            })

          // Assert
          expect(postSubmissionActionStatus).toEqual(ok(true))

          expect(
            MockMailService.sendSubmissionToAdmin.mock.calls[0][0].formData,
          ).toEqual([
            {
              answer: MOCK_NRIC,
              fieldType: BasicField.Nric,
              answerTemplate: [MOCK_NRIC],
              question: SgidFieldTitle.SgidNric,
            },
          ])
        })
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
          const postSubmissionActionStatus =
            await performEncryptPostSubmissionActions({
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
