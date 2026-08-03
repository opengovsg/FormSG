import dbHandler from '__tests__/unit/backend/helpers/jest-db'
import { ObjectId } from 'bson'
import {
  BasicField,
  FieldResponsesV3,
  FormAuthType,
  FormFieldDto,
  FormResponseMode,
  FormWorkflowStepDto,
  SubmissionType,
  WorkflowStatus,
  WorkflowType,
} from 'formsg-shared/types'
import mongoose from 'mongoose'
import { errAsync, okAsync } from 'neverthrow'

import { getMultirespondentSubmissionModel } from 'src/app/models/submission.server.model'
import { WebhookFactory } from 'src/app/modules/webhook/webhook.factory'
import { webhookStatsdClient } from 'src/app/modules/webhook/webhook.statsd-client'
import { AutoreplyPdfGenerationError } from 'src/app/services/mail/mail.errors'
import MailService from 'src/app/services/mail/mail.service'
import * as MailUtils from 'src/app/services/mail/mail.utils'
import {
  IMultirespondentSubmissionSchema,
  IPopulatedMultirespondentForm,
  WebhookView,
} from 'src/types'
import { MultirespondentSubmissionDto, SnapshottedFormDef } from 'src/types/api'

import { DatabaseConflictError } from '../../../core/core.errors'
import { FormRespondentSingleSubmissionValidationError } from '../../../form/form.errors'
import {
  MrfReminderInvalidWorkflowStepError,
  MrfReminderRecipientEmailsEmptyError,
  SubmissionSaveError,
} from '../../submission.errors'
import { mapRouteError } from '../../submission.utils'
import * as MultirespondentSubmissionService from '../multirespondent-submission.service'
import {
  createMultiRespondentFormSubmission,
  getPendingStepRecipientEmailsFromSubmittedStepsMeta,
  performMultiRespondentPostSubmissionCreateActions,
  performMultiRespondentPostSubmissionUpdateActions,
  sendNextStepReminderEmail,
  updateMultiRespondentFormSubmission,
} from '../multirespondent-submission.service'
import * as stepToken from '../step-token'
import {
  SnapshotDataIntegrityError,
  SnapshotWriteError,
} from '../webhook/submission-snapshot.errors'
import * as SnapshotStore from '../webhook/submission-snapshot.store'

jest.mock('src/app/modules/datadog/datadog.utils')
jest.mock('src/app/services/mail/mail.utils')

// Mock only the S3 snapshot I/O so call order/args can be asserted and reads
// can be steered; keep the real error classes (SnapshotWriteError etc.).
jest.mock('../webhook/submission-snapshot.store', () => {
  const actual = jest.requireActual('../webhook/submission-snapshot.store')
  return {
    ...actual,
    writeV4Snapshot: jest.fn(),
    readV4Snapshot: jest.fn(),
  }
})
const MockSnapshotStore = jest.mocked(SnapshotStore)

const mockFormId = new ObjectId().toHexString()
const mockSubmissionId = new ObjectId().toHexString()

const MockMailUtils = jest.mocked(MailUtils)
const MOCK_PDF_ATTACHMENT_BUFFER = Buffer.from('mock pdf buffer')
const EXPECTED_MOCK_PDF_ATTACHMENT = {
  filename: `RefNo ${mockSubmissionId}.pdf`,
  content: MOCK_PDF_ATTACHMENT_BUFFER,
}
const MOCK_SUBMISSION_ATTACHMENTS = [
  {
    filename: 'attachment_1.pdf',
    content: Buffer.from('mock pdf buffer'),
    fieldId: new ObjectId().toHexString(),
  },
]

describe('multirespondent-submission.service', () => {
  beforeAll(async () => {
    await dbHandler.connect()
  })

  beforeEach(() => {
    MockMailUtils.generateAutoreplyPdf.mockReturnValue(
      okAsync(Buffer.from('mock pdf buffer')),
    )
  })

  afterEach(async () => {
    jest.clearAllMocks()
    await dbHandler.clearDatabase()
  })

  afterAll(async () => {
    await dbHandler.closeDatabase()
  })

  describe('single submission per submitterId', () => {
    const singleSubmissionFieldId = new ObjectId().toHexString()
    const singleSubmissionFormId = new ObjectId().toHexString()
    const mockHashedSubmitterId = 'mock-hashed-submitter-id'

    const buildMinimalMrfForm = (
      overrides: Partial<IPopulatedMultirespondentForm> = {},
    ): IPopulatedMultirespondentForm =>
      ({
        _id: singleSubmissionFormId,
        authType: FormAuthType.NIL,
        responseMode: FormResponseMode.Multirespondent,
        title: 'Test form',
        form_fields: [
          {
            _id: singleSubmissionFieldId,
            fieldType: BasicField.ShortText,
            title: 'Q1',
          },
        ],
        form_logics: [],
        workflow: [
          {
            _id: new ObjectId().toHexString(),
            workflow_type: WorkflowType.Static,
            emails: [],
            edit: [singleSubmissionFieldId],
          },
        ],
        isSingleSubmission: false,
        getUniqueMyInfoAttrs: jest.fn().mockReturnValue([]),
        ...overrides,
      }) as unknown as IPopulatedMultirespondentForm

    const buildMinimalEncryptedPayload = (
      overrides: Partial<MultirespondentSubmissionDto> = {},
    ): MultirespondentSubmissionDto => ({
      submissionPublicKey: 'submission-public-key',
      encryptedSubmissionSecretKey: 'encrypted-submission-secret-key',
      encryptedContent: 'encrypted-content',
      submissionSecretKey: 'submission-secret-key',
      version: 2,
      workflowStep: 0,
      responses: {
        [singleSubmissionFieldId]: {
          fieldType: BasicField.ShortText,
          answer: 'answer',
        },
      },
      mrfVersion: 1,
      ...overrides,
    })

    it('should check for submissions with duplicate hashedSubmitterId if isSingleSubmission is enabled and save successfully if no duplicates are found', async () => {
      const MultirespondentSubmission =
        getMultirespondentSubmissionModel(mongoose)
      const mockSavedDoc = {
        _id: new ObjectId(),
      } as IMultirespondentSubmissionSchema & { _id: mongoose.Types.ObjectId }

      const saveIfSpy = jest
        .spyOn(MultirespondentSubmission, 'saveIfSubmitterIdIsUnique')
        .mockResolvedValue(mockSavedDoc)
      const saveProtoSpy = jest
        .spyOn(MultirespondentSubmission.prototype, 'save')
        .mockImplementation(function (this: IMultirespondentSubmissionSchema) {
          return Promise.resolve(this)
        })

      const form = buildMinimalMrfForm({
        isSingleSubmission: true,
        authType: FormAuthType.MyInfo,
      })
      const encryptedPayload = buildMinimalEncryptedPayload({
        hashedSubmitterId: mockHashedSubmitterId,
      })

      const result = await createMultiRespondentFormSubmission({
        form,
        encryptedPayload,
        logMeta: { action: 'createMultiRespondentFormSubmission' },
      })

      expect(saveIfSpy).toHaveBeenCalledWith(
        singleSubmissionFormId,
        mockHashedSubmitterId,
        0,
        expect.objectContaining({
          form: singleSubmissionFormId,
          workflowStep: 0,
          mrfVersion: 1,
          submittedSteps: expect.arrayContaining([
            expect.objectContaining({
              submitterId: mockHashedSubmitterId,
            }),
          ]),
        }),
      )
      expect(saveProtoSpy).not.toHaveBeenCalled()
      expect(result.isOk()).toBe(true)
      expect(result._unsafeUnwrap()).toEqual(mockSavedDoc)

      saveIfSpy.mockRestore()
      saveProtoSpy.mockRestore()
    })

    it('should save successfully without checking for duplicate hashedSubmitterId if isSingleSubmission is disabled', async () => {
      const MultirespondentSubmission =
        getMultirespondentSubmissionModel(mongoose)
      const saveIfSpy = jest.spyOn(
        MultirespondentSubmission,
        'saveIfSubmitterIdIsUnique',
      )
      const expectedSavedSubmissionId = new ObjectId().toHexString()
      const mockSavedSubmission = {
        _id: expectedSavedSubmissionId,
        form: singleSubmissionFormId,
        workflowStep: 0,
        mrfVersion: 1,
      } as IMultirespondentSubmissionSchema & { _id: mongoose.Types.ObjectId }
      const saveProtoSpy = jest
        .spyOn(MultirespondentSubmission.prototype, 'save')
        .mockResolvedValue(mockSavedSubmission)

      const form = buildMinimalMrfForm({ isSingleSubmission: false })
      const encryptedPayload = buildMinimalEncryptedPayload({
        hashedSubmitterId: mockHashedSubmitterId,
      })

      const result = await createMultiRespondentFormSubmission({
        form,
        encryptedPayload,
        logMeta: { action: 'createMultiRespondentFormSubmission' },
      })

      expect(saveIfSpy).not.toHaveBeenCalled()
      expect(saveProtoSpy).toHaveBeenCalled()
      expect(result.isOk()).toBe(true)
      const savedSubmission = result._unsafeUnwrap()
      expect(savedSubmission).toEqual(mockSavedSubmission)

      saveIfSpy.mockRestore()
      saveProtoSpy.mockRestore()
    })

    it('should throw error if submission with duplicate hashedSubmitterId is found and isSingleSubmission is enabled', async () => {
      const MultirespondentSubmission =
        getMultirespondentSubmissionModel(mongoose)
      const saveIfSpy = jest
        .spyOn(MultirespondentSubmission, 'saveIfSubmitterIdIsUnique')
        .mockResolvedValue(null)

      const form = buildMinimalMrfForm({
        isSingleSubmission: true,
        authType: FormAuthType.MyInfo,
      })
      const encryptedPayload = buildMinimalEncryptedPayload({
        hashedSubmitterId: mockHashedSubmitterId,
      })

      const result = await createMultiRespondentFormSubmission({
        form,
        encryptedPayload,
        logMeta: { action: 'createMultiRespondentFormSubmission' },
      })

      expect(saveIfSpy).toHaveBeenCalled()
      expect(result.isErr()).toBe(true)
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        FormRespondentSingleSubmissionValidationError,
      )

      saveIfSpy.mockRestore()
    })

    it('should throw error if hashedSubmitterId is not set and isSingleSubmission is enabled', async () => {
      const MultirespondentSubmission =
        getMultirespondentSubmissionModel(mongoose)
      const saveIfSpy = jest.spyOn(
        MultirespondentSubmission,
        'saveIfSubmitterIdIsUnique',
      )

      const form = buildMinimalMrfForm({
        isSingleSubmission: true,
        authType: FormAuthType.MyInfo,
      })
      const encryptedPayload = buildMinimalEncryptedPayload()

      const result = await createMultiRespondentFormSubmission({
        form,
        encryptedPayload,
        logMeta: { action: 'createMultiRespondentFormSubmission' },
      })

      expect(saveIfSpy).not.toHaveBeenCalled()
      expect(result.isErr()).toBe(true)
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(SubmissionSaveError)

      saveIfSpy.mockRestore()
    })

    it('should not throw error if hashedSubmitterId is not set and isSingleSubmission is disabled', async () => {
      const MultirespondentSubmission =
        getMultirespondentSubmissionModel(mongoose)
      const saveIfSpy = jest.spyOn(
        MultirespondentSubmission,
        'saveIfSubmitterIdIsUnique',
      )
      const saveProtoSpy = jest
        .spyOn(MultirespondentSubmission.prototype, 'save')
        .mockImplementation(function (this: IMultirespondentSubmissionSchema) {
          return Promise.resolve(this)
        })

      const form = buildMinimalMrfForm({ isSingleSubmission: false })
      const encryptedPayload = buildMinimalEncryptedPayload()

      const result = await createMultiRespondentFormSubmission({
        form,
        encryptedPayload,
        logMeta: { action: 'createMultiRespondentFormSubmission' },
      })

      expect(saveIfSpy).not.toHaveBeenCalled()
      expect(saveProtoSpy).toHaveBeenCalled()
      expect(result.isOk()).toBe(true)

      saveIfSpy.mockRestore()
      saveProtoSpy.mockRestore()
    })
  })

  describe('pdf attachment', () => {
    describe('pdf attachment is not generated when not needed', () => {
      describe('first step', () => {
        it('should not generate pdf when there is no active form summary included email field and workflow is incomplete', async () => {
          // Arrange
          const emailFieldWithoutFormSummaryStep1 = {
            _id: new ObjectId().toHexString(),
            fieldType: BasicField.Email,
            title: 'Step 1 Email Field',
            autoReplyOptions: {
              hasAutoReply: true,
              includeFormSummary: false,
              autoReplySubject: 'Test Subject',
              autoReplyMessage: 'Test Message',
              autoReplySender: 'Test Sender',
            },
          }
          const emailFieldWithFormSummaryStep2 = {
            _id: new ObjectId().toHexString(),
            fieldType: BasicField.Email,
            title: 'Step 2 Email Field',
            autoReplyOptions: {
              hasAutoReply: true,
              includeFormSummary: true,
              autoReplySubject: 'Test Subject',
              autoReplyMessage: 'Test Message',
              autoReplySender: 'Test Sender',
            },
          }

          const workflow = [
            {
              _id: new ObjectId().toHexString(),
              workflow_type: WorkflowType.Static,
              emails: [],
              edit: [emailFieldWithoutFormSummaryStep1._id],
            },
            {
              _id: new ObjectId().toHexString(),
              workflow_type: WorkflowType.Static,
              emails: ['step2_respondent_email@example.com'],
              edit: [emailFieldWithFormSummaryStep2._id],
            },
          ]

          // Act
          await performMultiRespondentPostSubmissionCreateActions({
            submission: {
              id: mockSubmissionId,
            } as unknown as IMultirespondentSubmissionSchema,
            submissionId: mockSubmissionId,
            form: {
              _id: mockFormId,
              title: 'Test Form',
              form_fields: [
                emailFieldWithoutFormSummaryStep1,
                emailFieldWithFormSummaryStep2,
              ],
              stepsToNotify: [workflow[0]._id, workflow[1]._id],
              workflow,
              admin: {
                agency: {
                  fullName: 'Government Technology Agency',
                },
              },
            } as unknown as IPopulatedMultirespondentForm,
            encryptedPayload: {
              encryptedContent: 'encryptedContent',
              version: 1,
              submissionPublicKey: 'submissionPublicKey',
              encryptedSubmissionSecretKey: 'encryptedSubmissionSecretKey',
              responses: {
                [emailFieldWithoutFormSummaryStep1._id]: {
                  fieldType: BasicField.Email,
                  answer: {
                    value: 'expected1@example.com',
                  },
                },
              },
            } as MultirespondentSubmissionDto,
            logMeta: {} as any,
            attachments: MOCK_SUBMISSION_ATTACHMENTS,
          })

          // Assert
          expect(MockMailUtils.generateAutoreplyPdf).not.toHaveBeenCalled()
        })
        it('should not generate pdf when there is no active form summary included email field and workflow is complete but has no emails to notify for outcome', async () => {
          // Arrange
          const emailFieldWithoutFormSummaryStep1 = {
            _id: new ObjectId().toHexString(),
            fieldType: BasicField.Email,
            title: 'Step 1 Email Field',
            autoReplyOptions: {
              hasAutoReply: true,
              includeFormSummary: false,
              autoReplySubject: 'Test Subject',
              autoReplyMessage: 'Test Message',
              autoReplySender: 'Test Sender',
            },
          }

          const workflow = [
            {
              _id: new ObjectId().toHexString(),
              workflow_type: WorkflowType.Static,
              emails: [], // step 1 has no emails to notify for outcome
              edit: [emailFieldWithoutFormSummaryStep1._id],
            },
          ]

          const step1Id = new ObjectId().toHexString()

          // Act
          await performMultiRespondentPostSubmissionCreateActions({
            submission: {
              id: mockSubmissionId,
            } as unknown as IMultirespondentSubmissionSchema,
            submissionId: mockSubmissionId,
            form: {
              _id: mockFormId,
              title: 'Test Form',
              form_fields: [emailFieldWithoutFormSummaryStep1],
              stepsToNotify: [step1Id],
              workflow,
              admin: {
                agency: {
                  fullName: 'Government Technology Agency',
                },
              },
            } as unknown as IPopulatedMultirespondentForm,
            encryptedPayload: {
              encryptedContent: 'encryptedContent',
              version: 1,
              submissionPublicKey: 'submissionPublicKey',
              encryptedSubmissionSecretKey: 'encryptedSubmissionSecretKey',
              responses: {
                [emailFieldWithoutFormSummaryStep1._id]: {
                  fieldType: BasicField.Email,
                  answer: {
                    value: 'expected1@example.com',
                  },
                },
              },
            } as MultirespondentSubmissionDto,
            logMeta: {} as any,
            attachments: MOCK_SUBMISSION_ATTACHMENTS,
          })

          // Assert
          expect(MockMailUtils.generateAutoreplyPdf).not.toHaveBeenCalled()
        })
      })

      describe('subsequent steps', () => {
        it('should not generate pdf when there is no active form summary included email field and workflow is incomplete', async () => {
          // Arrange
          const emailFieldWithFormSummaryStep1 = {
            _id: new ObjectId().toHexString(),
            fieldType: BasicField.Email,
            title: 'Step 1 Email Field',
            autoReplyOptions: {
              hasAutoReply: true,
              includeFormSummary: true,
              autoReplySubject: 'Test Subject',
              autoReplyMessage: 'Test Message',
              autoReplySender: 'Test Sender',
            },
          }
          const emailFieldWithoutFormSummaryStep2 = {
            _id: new ObjectId().toHexString(),
            fieldType: BasicField.Email,
            title: 'Step 2 Email Field',
            autoReplyOptions: {
              hasAutoReply: true,
              includeFormSummary: false,
              autoReplySubject: 'Test Subject',
              autoReplyMessage: 'Test Message',
              autoReplySender: 'Test Sender',
            },
          }

          const workflow = [
            {
              _id: new ObjectId().toHexString(),
              workflow_type: WorkflowType.Static,
              emails: [],
              edit: [emailFieldWithFormSummaryStep1._id],
            },
            {
              _id: new ObjectId().toHexString(),
              workflow_type: WorkflowType.Static,
              emails: ['step2_respondent_email@example.com'],
              edit: [emailFieldWithoutFormSummaryStep2._id],
            },
            {
              _id: new ObjectId().toHexString(),
              workflow_type: WorkflowType.Static,
              emails: ['step3_respondent_email@example.com'],
              edit: [emailFieldWithFormSummaryStep1._id],
            },
          ]

          // Act
          await performMultiRespondentPostSubmissionUpdateActions({
            submission: {
              id: mockSubmissionId,
            } as unknown as IMultirespondentSubmissionSchema,
            submissionId: mockSubmissionId,
            snapshottedFormDef: {
              _id: mockFormId,
              title: 'Test Form',
              form_fields: [
                emailFieldWithFormSummaryStep1,
                emailFieldWithoutFormSummaryStep2,
              ],
              stepsToNotify: [workflow[1]._id],
              workflow,
              admin: {
                agency: {
                  fullName: 'Government Technology Agency',
                },
              },
            } as unknown as SnapshottedFormDef,
            currentStepNumber: 1, // submitted step 2
            encryptedPayload: {
              encryptedContent: 'encryptedContent',
              version: 1,
              submissionPublicKey: 'submissionPublicKey',
              encryptedSubmissionSecretKey: 'encryptedSubmissionSecretKey',
              responses: {
                [emailFieldWithFormSummaryStep1._id]: {
                  fieldType: BasicField.Email,
                  answer: {
                    value: 'expected1@example.com',
                  },
                },
                [emailFieldWithoutFormSummaryStep2._id]: {
                  fieldType: BasicField.Email,
                  answer: {
                    value: 'expected2@example.com',
                  },
                },
              },
            } as MultirespondentSubmissionDto,
            logMeta: {} as any,
            attachments: MOCK_SUBMISSION_ATTACHMENTS,
          })

          // Assert
          expect(MockMailUtils.generateAutoreplyPdf).not.toHaveBeenCalled()
        })

        it('should not generate pdf when there is no active form summary included email field and workflow is complete but has no emails to notify for outcome', async () => {
          // Arrange
          const emailFieldWithFormSummaryStep1 = {
            _id: new ObjectId().toHexString(),
            fieldType: BasicField.Email,
            title: 'Step 1 Email Field',
            autoReplyOptions: {
              hasAutoReply: true,
              includeFormSummary: true,
              autoReplySubject: 'Test Subject',
              autoReplyMessage: 'Test Message',
              autoReplySender: 'Test Sender',
            },
          }
          const emailFieldWithoutFormSummaryStep2 = {
            _id: new ObjectId().toHexString(),
            fieldType: BasicField.Email,
            title: 'Step 2 Email Field',
            autoReplyOptions: {
              hasAutoReply: true,
              includeFormSummary: false,
              autoReplySubject: 'Test Subject',
              autoReplyMessage: 'Test Message',
              autoReplySender: 'Test Sender',
            },
          }

          const workflow = [
            {
              _id: new ObjectId().toHexString(),
              workflow_type: WorkflowType.Static,
              emails: [],
              edit: [emailFieldWithFormSummaryStep1._id],
            },
            {
              _id: new ObjectId().toHexString(),
              workflow_type: WorkflowType.Static,
              emails: ['step2_respondent_email@example.com'],
              edit: [emailFieldWithoutFormSummaryStep2._id],
            },
          ]

          // Act
          await performMultiRespondentPostSubmissionUpdateActions({
            submission: {
              id: mockSubmissionId,
            } as unknown as IMultirespondentSubmissionSchema,
            submissionId: mockSubmissionId,
            snapshottedFormDef: {
              _id: mockFormId,
              title: 'Test Form',
              form_fields: [
                emailFieldWithFormSummaryStep1,
                emailFieldWithoutFormSummaryStep2,
              ],
              stepsToNotify: [],
              emails: [],
              workflow,
              admin: {
                agency: {
                  fullName: 'Government Technology Agency',
                },
              },
            } as unknown as SnapshottedFormDef,
            currentStepNumber: 1, // submitted step 2
            encryptedPayload: {
              encryptedContent: 'encryptedContent',
              version: 1,
              submissionPublicKey: 'submissionPublicKey',
              encryptedSubmissionSecretKey: 'encryptedSubmissionSecretKey',
              responses: {
                [emailFieldWithFormSummaryStep1._id]: {
                  fieldType: BasicField.Email,
                  answer: {
                    value: 'expected1@example.com',
                  },
                },
                [emailFieldWithoutFormSummaryStep2._id]: {
                  fieldType: BasicField.Email,
                  answer: {
                    value: 'expected2@example.com',
                  },
                },
              },
            } as MultirespondentSubmissionDto,
            logMeta: {} as any,
            attachments: MOCK_SUBMISSION_ATTACHMENTS,
          })

          // Assert
          expect(MockMailUtils.generateAutoreplyPdf).not.toHaveBeenCalled()
        })
      })
    })
  })

  describe('respondent copy emails are sent', () => {
    describe('first step', () => {
      it('sends respondent copy without pdf when email field auto reply enabled but form summary is not included', async () => {
        // Arrange
        const sendMrfRespondentCopyEmailSpy = jest.spyOn(
          MailService,
          'sendRespondentCopyEmail',
        )

        const emailFieldWithoutFormSummaryStep1 = {
          _id: new ObjectId().toHexString(),
          fieldType: BasicField.Email,
          title: 'Step 1 Email Field',
          autoReplyOptions: {
            hasAutoReply: true,
            includeFormSummary: false,
            autoReplySubject: 'Test Subject',
            autoReplyMessage: 'Test Message',
            autoReplySender: 'Test Sender',
          },
        }
        const emailFieldWithFormSummaryStep2 = {
          _id: new ObjectId().toHexString(),
          fieldType: BasicField.Email,
          title: 'Step 2 Email Field',
          autoReplyOptions: {
            hasAutoReply: true,
            includeFormSummary: true,
            autoReplySubject: 'Test Subject',
            autoReplyMessage: 'Test Message',
            autoReplySender: 'Test Sender',
          },
        }

        const workflow = [
          {
            _id: new ObjectId().toHexString(),
            workflow_type: WorkflowType.Static,
            emails: [],
            edit: [emailFieldWithoutFormSummaryStep1._id],
          },
          {
            _id: new ObjectId().toHexString(),
            workflow_type: WorkflowType.Static,
            emails: ['step2_respondent_email@example.com'],
            edit: [emailFieldWithFormSummaryStep2._id],
          },
        ]

        // Act
        await performMultiRespondentPostSubmissionCreateActions({
          submission: {
            id: mockSubmissionId,
          } as unknown as IMultirespondentSubmissionSchema,
          submissionId: mockSubmissionId,
          form: {
            _id: mockFormId,
            title: 'Test Form',
            form_fields: [
              emailFieldWithoutFormSummaryStep1,
              emailFieldWithFormSummaryStep2,
            ],
            stepsToNotify: [workflow[0]._id, workflow[1]._id],
            workflow,
            admin: {
              agency: {
                fullName: 'Government Technology Agency',
              },
            },
          } as unknown as IPopulatedMultirespondentForm,
          encryptedPayload: {
            encryptedContent: 'encryptedContent',
            version: 1,
            submissionPublicKey: 'submissionPublicKey',
            encryptedSubmissionSecretKey: 'encryptedSubmissionSecretKey',
            responses: {
              [emailFieldWithoutFormSummaryStep1._id]: {
                fieldType: BasicField.Email,
                answer: {
                  value: 'expected1@example.com',
                },
              },
            },
          } as MultirespondentSubmissionDto,
          logMeta: {} as any,
          attachments: MOCK_SUBMISSION_ATTACHMENTS,
        })

        // Assert
        // that sent to correct destination emails
        expect(sendMrfRespondentCopyEmailSpy).toHaveBeenCalledTimes(1)
        expect(
          sendMrfRespondentCopyEmailSpy.mock.calls[0][0].autoReplyMailData
            .email,
        ).toEqual('expected1@example.com')
        // does not attach pdf and submission attachments since form summary is not included for active respondent copy email field
        expect(
          sendMrfRespondentCopyEmailSpy.mock.calls[0][0].attachments,
        ).toEqual([])
      })
      it('sends respondent copy emails with pdf when email field auto reply enabled and form summary is included', async () => {
        // Arrange
        const sendMrfRespondentCopyEmailSpy = jest.spyOn(
          MailService,
          'sendRespondentCopyEmail',
        )

        const emailFieldWithFormSummaryStep1 = {
          _id: new ObjectId().toHexString(),
          fieldType: BasicField.Email,
          title: 'Step 1 Email Field',
          autoReplyOptions: {
            hasAutoReply: true,
            includeFormSummary: true,
            autoReplySubject: 'Test Subject',
            autoReplyMessage: 'Test Message',
            autoReplySender: 'Test Sender',
          },
        }
        const emailFieldWithFormSummaryStep2 = {
          _id: new ObjectId().toHexString(),
          fieldType: BasicField.Email,
          title: 'Step 2 Email Field',
          autoReplyOptions: {
            hasAutoReply: true,
            includeFormSummary: true,
            autoReplySubject: 'Test Subject',
            autoReplyMessage: 'Test Message',
            autoReplySender: 'Test Sender',
          },
        }

        const workflow = [
          {
            _id: new ObjectId().toHexString(),
            workflow_type: WorkflowType.Static,
            emails: [],
            edit: [emailFieldWithFormSummaryStep1._id],
          },
          {
            _id: new ObjectId().toHexString(),
            workflow_type: WorkflowType.Static,
            emails: ['step2_respondent_email@example.com'],
            edit: [emailFieldWithFormSummaryStep2._id],
          },
        ]

        // Act
        await performMultiRespondentPostSubmissionCreateActions({
          submission: {
            id: mockSubmissionId,
          } as unknown as IMultirespondentSubmissionSchema,
          submissionId: mockSubmissionId,
          form: {
            _id: mockFormId,
            title: 'Test Form',
            form_fields: [
              emailFieldWithFormSummaryStep1,
              emailFieldWithFormSummaryStep2,
            ],
            stepsToNotify: [workflow[0]._id, workflow[1]._id],
            workflow,
            admin: {
              agency: {
                fullName: 'Government Technology Agency',
              },
            },
          } as unknown as IPopulatedMultirespondentForm,
          encryptedPayload: {
            encryptedContent: 'encryptedContent',
            version: 1,
            submissionPublicKey: 'submissionPublicKey',
            encryptedSubmissionSecretKey: 'encryptedSubmissionSecretKey',
            responses: {
              [emailFieldWithFormSummaryStep1._id]: {
                fieldType: BasicField.Email,
                answer: {
                  value: 'expected1@example.com',
                },
              },
            },
          } as MultirespondentSubmissionDto,
          logMeta: {} as any,
          attachments: MOCK_SUBMISSION_ATTACHMENTS,
        })

        // Assert
        // that sent to correct destination emails
        expect(sendMrfRespondentCopyEmailSpy).toHaveBeenCalledTimes(1)
        expect(
          sendMrfRespondentCopyEmailSpy.mock.calls[0][0].autoReplyMailData
            .email,
        ).toEqual('expected1@example.com')
        // attaches pdf and submission attachments
        expect(
          sendMrfRespondentCopyEmailSpy.mock.calls[0][0].attachments,
        ).toEqual([
          ...MOCK_SUBMISSION_ATTACHMENTS,
          EXPECTED_MOCK_PDF_ATTACHMENT,
        ])
      })
      it('does not send respondent copy emails when email field auto reply is not enabled', async () => {
        // Arrange
        const sendMrfRespondentCopyEmailSpy = jest.spyOn(
          MailService,
          'sendRespondentCopyEmail',
        )

        const emailFieldWithoutAutoReplyStep1 = {
          _id: new ObjectId().toHexString(),
          fieldType: BasicField.Email,
          title: 'Step 1 Email Field',
          autoReplyOptions: {
            hasAutoReply: false,
            includeFormSummary: false,
            autoReplySubject: 'Test Subject',
            autoReplyMessage: 'Test Message',
            autoReplySender: 'Test Sender',
          },
        }
        const emailFieldWithFormSummaryStep2 = {
          _id: new ObjectId().toHexString(),
          fieldType: BasicField.Email,
          title: 'Step 2 Email Field',
          autoReplyOptions: {
            hasAutoReply: true,
            includeFormSummary: true,
            autoReplySubject: 'Test Subject',
            autoReplyMessage: 'Test Message',
            autoReplySender: 'Test Sender',
          },
        }

        const workflow = [
          {
            _id: new ObjectId().toHexString(),
            workflow_type: WorkflowType.Static,
            emails: [],
            edit: [emailFieldWithoutAutoReplyStep1._id],
          },
          {
            _id: new ObjectId().toHexString(),
            workflow_type: WorkflowType.Static,
            emails: ['step2_respondent_email@example.com'],
            edit: [emailFieldWithFormSummaryStep2._id],
          },
        ]

        // Act
        await performMultiRespondentPostSubmissionCreateActions({
          submission: {
            id: mockSubmissionId,
          } as unknown as IMultirespondentSubmissionSchema,
          submissionId: mockSubmissionId,
          form: {
            _id: mockFormId,
            title: 'Test Form',
            form_fields: [
              emailFieldWithoutAutoReplyStep1,
              emailFieldWithFormSummaryStep2,
            ],
            stepsToNotify: [workflow[0]._id, workflow[1]._id],
            workflow,
            admin: {
              agency: {
                fullName: 'Government Technology Agency',
              },
            },
          } as unknown as IPopulatedMultirespondentForm,
          encryptedPayload: {
            encryptedContent: 'encryptedContent',
            version: 1,
            submissionPublicKey: 'submissionPublicKey',
            encryptedSubmissionSecretKey: 'encryptedSubmissionSecretKey',
            responses: {
              [emailFieldWithoutAutoReplyStep1._id]: {
                fieldType: BasicField.Email,
                answer: {
                  value: 'expected1@example.com',
                },
              },
            },
          } as MultirespondentSubmissionDto,
          logMeta: {} as any,
          attachments: MOCK_SUBMISSION_ATTACHMENTS,
        })

        // Assert
        expect(sendMrfRespondentCopyEmailSpy).not.toHaveBeenCalled()
      })

      it('sends respondent copy despite pdf generation error', async () => {
        // Arrange
        MockMailUtils.generateAutoreplyPdf.mockReturnValue(
          errAsync(new AutoreplyPdfGenerationError()),
        )
        const sendMrfRespondentCopyEmailSpy = jest.spyOn(
          MailService,
          'sendRespondentCopyEmail',
        )
        const emailFieldWithFormSummaryStep1 = {
          _id: new ObjectId().toHexString(),
          fieldType: BasicField.Email,
          title: 'Step 1 Email Field',
          autoReplyOptions: {
            hasAutoReply: true,
            includeFormSummary: true,
            autoReplySubject: 'Test Subject',
            autoReplyMessage: 'Test Message',
            autoReplySender: 'Test Sender',
          },
        }

        const workflow = [
          {
            _id: new ObjectId().toHexString(),
            workflow_type: WorkflowType.Static,
            emails: [],
            edit: [emailFieldWithFormSummaryStep1._id],
          },
        ]

        // Act
        await performMultiRespondentPostSubmissionCreateActions({
          submission: {
            id: mockSubmissionId,
          } as unknown as IMultirespondentSubmissionSchema,
          submissionId: mockSubmissionId,
          form: {
            _id: mockFormId,
            title: 'Test Form',
            form_fields: [emailFieldWithFormSummaryStep1],
            stepsToNotify: [workflow[0]._id],
            workflow,
            admin: {
              agency: {
                fullName: 'Government Technology Agency',
              },
            },
          } as unknown as IPopulatedMultirespondentForm,
          encryptedPayload: {
            encryptedContent: 'encryptedContent',
            version: 1,
            submissionPublicKey: 'submissionPublicKey',
            encryptedSubmissionSecretKey: 'encryptedSubmissionSecretKey',
            responses: {
              [emailFieldWithFormSummaryStep1._id]: {
                fieldType: BasicField.Email,
                answer: {
                  value: 'expected1@example.com',
                },
              },
            },
          } as MultirespondentSubmissionDto,
          logMeta: {} as any,
          attachments: MOCK_SUBMISSION_ATTACHMENTS,
        })

        // Assert
        // that sent to correct destination emails
        expect(sendMrfRespondentCopyEmailSpy).toHaveBeenCalledTimes(1)
        expect(
          sendMrfRespondentCopyEmailSpy.mock.calls[0][0].autoReplyMailData
            .email,
        ).toEqual('expected1@example.com')
        // still sends without pdf attachment
        expect(
          sendMrfRespondentCopyEmailSpy.mock.calls[0][0].attachments,
        ).toEqual([...MOCK_SUBMISSION_ATTACHMENTS])
      })

      it('sends respondent copy + workflow completion email when workflow has 0 steps', async () => {
        // Arrange
        const sendMrfRespondentCopyEmailSpy = jest.spyOn(
          MailService,
          'sendRespondentCopyEmail',
        )
        const sendMrfWorkflowCompletionEmailSpy = jest.spyOn(
          MailService,
          'sendMrfWorkflowCompletionEmail',
        )

        const emailFieldWithFormSummaryStep1 = {
          _id: new ObjectId().toHexString(),
          fieldType: BasicField.Email,
          title: 'Step 1 Email Field',
          autoReplyOptions: {
            hasAutoReply: true,
            includeFormSummary: true,
            autoReplySubject: 'Test Subject',
            autoReplyMessage: 'Test Message',
            autoReplySender: 'Test Sender',
          },
        }

        const workflow: FormWorkflowStepDto[] = []

        // Act
        await performMultiRespondentPostSubmissionCreateActions({
          submission: {
            id: mockSubmissionId,
          } as unknown as IMultirespondentSubmissionSchema,
          submissionId: mockSubmissionId,
          form: {
            _id: mockFormId,
            title: 'Test Form',
            form_fields: [emailFieldWithFormSummaryStep1],
            stepsToNotify: [],
            workflow,
            emails: ['expected2@example.com'],
            stepOneEmailNotificationFieldId: emailFieldWithFormSummaryStep1._id,
            admin: {
              agency: {
                fullName: 'Government Technology Agency',
              },
            },
          } as unknown as IPopulatedMultirespondentForm,
          encryptedPayload: {
            encryptedContent: 'encryptedContent',
            version: 1,
            submissionPublicKey: 'submissionPublicKey',
            encryptedSubmissionSecretKey: 'encryptedSubmissionSecretKey',
            responses: {
              [emailFieldWithFormSummaryStep1._id]: {
                fieldType: BasicField.Email,
                answer: {
                  value: 'expected1@example.com',
                },
              },
            },
          } as MultirespondentSubmissionDto,
          logMeta: {} as any,
          attachments: MOCK_SUBMISSION_ATTACHMENTS,
        })

        // Assert
        // that respondent copy is sent to correct destination emails
        expect(sendMrfRespondentCopyEmailSpy).toHaveBeenCalledTimes(1)
        expect(
          sendMrfRespondentCopyEmailSpy.mock.calls[0][0].autoReplyMailData
            .email,
        ).toEqual('expected1@example.com')
        // that workflow completion email is also sent to correct destination emails
        expect(
          sendMrfWorkflowCompletionEmailSpy.mock.calls[0][0].emails,
        ).toContainValues(['expected1@example.com', 'expected2@example.com'])
        expect(
          sendMrfWorkflowCompletionEmailSpy.mock.calls[0][0].emails.length,
        ).toBe(2)
      })
    })

    describe('subsequent steps', () => {
      it('sends respondent copy without pdf when email field auto reply enabled but form summary is not included', async () => {
        // Arrange
        const sendMrfRespondentCopyEmailSpy = jest.spyOn(
          MailService,
          'sendRespondentCopyEmail',
        )

        const emailFieldWithFormSummaryStep1 = {
          _id: new ObjectId().toHexString(),
          fieldType: BasicField.Email,
          title: 'Step 1 Email Field',
          autoReplyOptions: {
            hasAutoReply: true,
            includeFormSummary: true,
            autoReplySubject: 'Test Subject',
            autoReplyMessage: 'Test Message',
            autoReplySender: 'Test Sender',
          },
        }
        const emailFieldWithoutFormSummaryStep2 = {
          _id: new ObjectId().toHexString(),
          fieldType: BasicField.Email,
          title: 'Step 2 Email Field',
          autoReplyOptions: {
            hasAutoReply: true,
            includeFormSummary: false,
            autoReplySubject: 'Test Subject',
            autoReplyMessage: 'Test Message',
            autoReplySender: 'Test Sender',
          },
        }

        const workflow = [
          {
            _id: new ObjectId().toHexString(),
            workflow_type: WorkflowType.Static,
            emails: [],
            edit: [emailFieldWithFormSummaryStep1._id],
          },
          {
            _id: new ObjectId().toHexString(),
            workflow_type: WorkflowType.Static,
            emails: ['step2_respondent_email@example.com'],
            edit: [emailFieldWithoutFormSummaryStep2._id],
          },
        ]

        // Act
        await performMultiRespondentPostSubmissionUpdateActions({
          submission: {
            id: mockSubmissionId,
          } as unknown as IMultirespondentSubmissionSchema,
          submissionId: mockSubmissionId,
          snapshottedFormDef: {
            _id: mockFormId,
            title: 'Test Form',
            form_fields: [
              emailFieldWithFormSummaryStep1,
              emailFieldWithoutFormSummaryStep2,
            ],
            stepsToNotify: [workflow[0]._id, workflow[1]._id],
            workflow,
            admin: {
              agency: {
                fullName: 'Government Technology Agency',
              },
            },
          } as unknown as SnapshottedFormDef,
          currentStepNumber: 1, // step 2
          encryptedPayload: {
            encryptedContent: 'encryptedContent',
            version: 1,
            submissionPublicKey: 'submissionPublicKey',
            encryptedSubmissionSecretKey: 'encryptedSubmissionSecretKey',
            responses: {
              [emailFieldWithFormSummaryStep1._id]: {
                fieldType: BasicField.Email,
                answer: {
                  value: 'expected1@example.com',
                },
              },
              [emailFieldWithoutFormSummaryStep2._id]: {
                fieldType: BasicField.Email,
                answer: {
                  value: 'expected2@example.com',
                },
              },
            },
          } as MultirespondentSubmissionDto,
          logMeta: {} as any,
          attachments: MOCK_SUBMISSION_ATTACHMENTS,
        })

        // Assert
        // that sent to correct destination emails
        expect(sendMrfRespondentCopyEmailSpy).toHaveBeenCalledTimes(1)
        expect(
          sendMrfRespondentCopyEmailSpy.mock.calls[0][0].autoReplyMailData
            .email,
        ).toEqual('expected2@example.com')
        // does not attach pdf and submission attachments since form summary is not included for active respondent copy email field
        expect(
          sendMrfRespondentCopyEmailSpy.mock.calls[0][0].attachments,
        ).toEqual([])
      })
      it('sends respondent copy emails with pdf when email field auto reply enabled and form summary is included', async () => {
        // Arrange
        const sendMrfRespondentCopyEmailSpy = jest.spyOn(
          MailService,
          'sendRespondentCopyEmail',
        )

        const emailFieldWithFormSummaryStep1 = {
          _id: new ObjectId().toHexString(),
          fieldType: BasicField.Email,
          title: 'Step 1 Email Field',
          autoReplyOptions: {
            hasAutoReply: true,
            includeFormSummary: true,
            autoReplySubject: 'Test Subject',
            autoReplyMessage: 'Test Message',
            autoReplySender: 'Test Sender',
          },
        }
        const emailFieldWithFormSummaryStep2 = {
          _id: new ObjectId().toHexString(),
          fieldType: BasicField.Email,
          title: 'Step 2 Email Field',
          autoReplyOptions: {
            hasAutoReply: true,
            includeFormSummary: true,
            autoReplySubject: 'Test Subject',
            autoReplyMessage: 'Test Message',
            autoReplySender: 'Test Sender',
          },
        }

        const emailField2WithFormSummaryStep2 = {
          _id: new ObjectId().toHexString(),
          fieldType: BasicField.Email,
          title: 'Step 2 Email Field',
          autoReplyOptions: {
            hasAutoReply: true,
            includeFormSummary: true,
            autoReplySubject: 'Test Subject',
            autoReplyMessage: 'Test Message',
            autoReplySender: 'Test Sender',
          },
        }

        const workflow = [
          {
            _id: new ObjectId().toHexString(),
            workflow_type: WorkflowType.Static,
            emails: [],
            edit: [emailFieldWithFormSummaryStep1._id],
          },
          {
            _id: new ObjectId().toHexString(),
            workflow_type: WorkflowType.Static,
            emails: ['step2_respondent_email@example.com'],
            edit: [
              emailField2WithFormSummaryStep2._id,
              emailFieldWithFormSummaryStep2._id,
            ],
          },
        ]

        // Act
        await performMultiRespondentPostSubmissionUpdateActions({
          submission: {
            id: mockSubmissionId,
          } as unknown as IMultirespondentSubmissionSchema,
          submissionId: mockSubmissionId,
          snapshottedFormDef: {
            _id: mockFormId,
            title: 'Test Form',
            form_fields: [
              emailFieldWithFormSummaryStep1,
              emailField2WithFormSummaryStep2,
              emailFieldWithFormSummaryStep2,
            ],
            stepsToNotify: [workflow[0]._id, workflow[1]._id],
            workflow,
            admin: {
              agency: {
                fullName: 'Government Technology Agency',
              },
            },
          } as unknown as SnapshottedFormDef,
          currentStepNumber: 1, // step 2
          encryptedPayload: {
            encryptedContent: 'encryptedContent',
            version: 1,
            submissionPublicKey: 'submissionPublicKey',
            encryptedSubmissionSecretKey: 'encryptedSubmissionSecretKey',
            responses: {
              [emailFieldWithFormSummaryStep1._id]: {
                fieldType: BasicField.Email,
                answer: {
                  value: 'expected1@example.com',
                },
              },
              [emailField2WithFormSummaryStep2._id]: {
                fieldType: BasicField.Email,
                answer: {
                  value: 'expected2@example.com',
                },
              },
              [emailFieldWithFormSummaryStep2._id]: {
                fieldType: BasicField.Email,
                answer: {
                  value: 'expected3@example.com',
                },
              },
            },
          } as MultirespondentSubmissionDto,
          logMeta: {} as any,
          attachments: MOCK_SUBMISSION_ATTACHMENTS,
        })

        // Assert
        // that sent to correct destination emails
        expect(sendMrfRespondentCopyEmailSpy).toHaveBeenCalledTimes(2)
        expect(
          sendMrfRespondentCopyEmailSpy.mock.calls.map(
            (call) => call[0].autoReplyMailData.email,
          ),
        ).toContainValues(['expected2@example.com', 'expected3@example.com'])
        // attaches pdf and submission attachments
        expect(
          sendMrfRespondentCopyEmailSpy.mock.calls[0][0].attachments,
        ).toEqual([
          ...MOCK_SUBMISSION_ATTACHMENTS,
          EXPECTED_MOCK_PDF_ATTACHMENT,
        ])
        expect(
          sendMrfRespondentCopyEmailSpy.mock.calls[1][0].attachments,
        ).toEqual([
          ...MOCK_SUBMISSION_ATTACHMENTS,
          EXPECTED_MOCK_PDF_ATTACHMENT,
        ])
      })
      it('does not send respondent copy emails when email field auto reply is not enabled', async () => {
        // Arrange
        const sendMrfRespondentCopyEmailSpy = jest.spyOn(
          MailService,
          'sendRespondentCopyEmail',
        )

        const emailFieldWithFormSummaryStep1 = {
          _id: new ObjectId().toHexString(),
          fieldType: BasicField.Email,
          title: 'Step 1 Email Field',
          autoReplyOptions: {
            hasAutoReply: true,
            includeFormSummary: true,
            autoReplySubject: 'Test Subject',
            autoReplyMessage: 'Test Message',
            autoReplySender: 'Test Sender',
          },
        }
        const emailFieldNoAutoReplyStep2 = {
          _id: new ObjectId().toHexString(),
          fieldType: BasicField.Email,
          title: 'Step 2 Email Field',
        }

        const emailFieldWithFormSummaryStep2 = {
          _id: new ObjectId().toHexString(),
          fieldType: BasicField.Email,
          title: 'Step 2 Email Field',
          autoReplyOptions: {
            hasAutoReply: true,
            includeFormSummary: true,
            autoReplySubject: 'Test Subject',
            autoReplyMessage: 'Test Message',
            autoReplySender: 'Test Sender',
          },
          required: false,
        }

        const workflow = [
          {
            _id: new ObjectId().toHexString(),
            workflow_type: WorkflowType.Static,
            emails: [],
            edit: [emailFieldWithFormSummaryStep1._id],
          },
          {
            _id: new ObjectId().toHexString(),
            workflow_type: WorkflowType.Static,
            emails: ['step2_respondent_email@example.com'],
            edit: [
              emailFieldWithFormSummaryStep2._id,
              emailFieldNoAutoReplyStep2._id,
            ],
          },
        ]

        // Act
        await performMultiRespondentPostSubmissionUpdateActions({
          submission: {
            id: mockSubmissionId,
          } as unknown as IMultirespondentSubmissionSchema,
          submissionId: mockSubmissionId,
          snapshottedFormDef: {
            _id: mockFormId,
            title: 'Test Form',
            form_fields: [
              emailFieldWithFormSummaryStep1,
              emailFieldNoAutoReplyStep2,
              emailFieldWithFormSummaryStep2,
            ],
            stepsToNotify: [workflow[0]._id, workflow[1]._id],
            workflow,
            admin: {
              agency: {
                fullName: 'Government Technology Agency',
              },
            },
          } as unknown as SnapshottedFormDef,
          currentStepNumber: 1, // step 2
          encryptedPayload: {
            encryptedContent: 'encryptedContent',
            version: 1,
            submissionPublicKey: 'submissionPublicKey',
            encryptedSubmissionSecretKey: 'encryptedSubmissionSecretKey',
            responses: {
              [emailFieldWithFormSummaryStep1._id]: {
                fieldType: BasicField.Email,
                answer: {
                  value: 'expected1@example.com',
                },
              },
              [emailFieldNoAutoReplyStep2._id]: {
                fieldType: BasicField.Email,
                answer: {
                  value: 'expected2@example.com',
                },
              },
            },
          } as MultirespondentSubmissionDto,
          logMeta: {} as any,
          attachments: MOCK_SUBMISSION_ATTACHMENTS,
        })

        // Assert
        expect(sendMrfRespondentCopyEmailSpy).not.toHaveBeenCalled()
      })
    })
  })

  describe('mrf approval email notification when approval step exists', () => {
    it('workflow continues and does not send approved outcome email when mrf is approved for mid step of multiple step MRF', async () => {
      // Arrange
      const sendMrfWorkflowCompletionEmailSpy = jest.spyOn(
        MailService,
        'sendMrfWorkflowCompletionEmail',
      )
      const sendMrfApprovalEmailSpy = jest.spyOn(
        MailService,
        'sendMrfApprovalEmail',
      )
      const sendMRFWorkflowStepEmailSpy = jest.spyOn(
        MailService,
        'sendMRFWorkflowStepEmail',
      )

      const expectedEmails = ['expected1@example.com']

      const stepOneId = new ObjectId().toHexString()
      const stepTwoId = new ObjectId().toHexString()
      const stepThreeId = new ObjectId().toHexString()

      const emailFieldId1 = new ObjectId().toHexString()
      const emailFieldId2 = new ObjectId().toHexString()

      const yesNoFieldId1 = new ObjectId().toHexString()
      const yesNoFieldId2 = new ObjectId().toHexString()

      const submissionResponses = {
        [emailFieldId1]: {
          fieldType: BasicField.Email,
          answer: {
            value: 'not_expected_1@example.com',
          },
        },
        [emailFieldId2]: {
          fieldType: BasicField.Email,
          answer: {
            value: expectedEmails[0],
          },
        },
        [yesNoFieldId1]: {
          fieldType: BasicField.YesNo,
          answer: { value: 'Yes' },
        },
        [yesNoFieldId2]: {
          fieldType: BasicField.YesNo,
          answer: { value: 'No' },
        },
      } as FieldResponsesV3

      const threeStepApprovalWorkflow: FormWorkflowStepDto[] = [
        {
          _id: stepOneId,
          workflow_type: WorkflowType.Static,
          emails: [],
          edit: [],
        },
        {
          _id: stepTwoId,
          workflow_type: WorkflowType.Static,
          emails: ['not_expected_2@example.com'],
          edit: [yesNoFieldId1],
          approval_field: yesNoFieldId1,
        },
        {
          _id: stepThreeId,
          workflow_type: WorkflowType.Dynamic,
          field: emailFieldId2,
          edit: [yesNoFieldId2],
          // no approval field for last step
        },
      ]

      const currentStepNumber = 1 // 2nd step of 3 steps workflow

      // Act
      await performMultiRespondentPostSubmissionUpdateActions({
        submission: {
          id: mockSubmissionId,
        } as unknown as IMultirespondentSubmissionSchema,
        submissionId: mockSubmissionId,
        snapshottedFormDef: {
          _id: mockFormId,
          workflow: threeStepApprovalWorkflow,
          emails: [expectedEmails[0]],
          stepOneEmailNotificationFieldId: emailFieldId1,
          admin: {
            agency: {
              fullName: 'Government Technology Agency',
            },
          },
          form_fields: [
            {
              _id: emailFieldId1,
              fieldType: BasicField.Email,
              title: 'Email Field 1',
            },
            {
              _id: emailFieldId2,
              fieldType: BasicField.Email,
              title: 'Email Field 2',
            },
            {
              _id: yesNoFieldId1,
              fieldType: BasicField.YesNo,
              title: 'Yes/No Field 1',
            },
            {
              _id: yesNoFieldId2,
              fieldType: BasicField.YesNo,
              title: 'Yes/No Field 2',
            },
          ] as FormFieldDto[],
        } as SnapshottedFormDef,
        currentStepNumber: currentStepNumber,
        encryptedPayload: {
          encryptedContent: 'encryptedContent',
          version: 1,
          submissionPublicKey: 'submissionPublicKey',
          encryptedSubmissionSecretKey: 'encryptedSubmissionSecretKey',
          responses: submissionResponses,
          workflowStep: currentStepNumber,
        } as MultirespondentSubmissionDto,
        logMeta: {} as any,
      })
      // Assert
      // next workflow step email is sent only
      expect(sendMrfApprovalEmailSpy).not.toHaveBeenCalled()
      expect(sendMrfWorkflowCompletionEmailSpy).not.toHaveBeenCalled()
      expect(sendMRFWorkflowStepEmailSpy).toHaveBeenCalledTimes(1)
      // destination emails are correct
      expect(
        sendMRFWorkflowStepEmailSpy.mock.calls[0][0].emails,
      ).toContainValues(expectedEmails)
      expect(sendMRFWorkflowStepEmailSpy.mock.calls[0][0].emails.length).toBe(
        expectedEmails.length,
      )
    })

    it('sends approved outcome email when mrf has approval step earlier but last step is not approval step', async () => {
      // Arrange
      const sendMrfWorkflowCompletionEmailSpy = jest.spyOn(
        MailService,
        'sendMrfWorkflowCompletionEmail',
      )
      const sendMrfApprovalEmailSpy = jest.spyOn(
        MailService,
        'sendMrfApprovalEmail',
      )
      const sendMRFWorkflowStepEmailSpy = jest.spyOn(
        MailService,
        'sendMRFWorkflowStepEmail',
      )

      const expectedEmails = ['expected1@example.com', 'expected2@example.com']

      const stepOneId = new ObjectId().toHexString()
      const stepTwoId = new ObjectId().toHexString()
      const stepThreeId = new ObjectId().toHexString()

      const emailFieldId1 = new ObjectId().toHexString()
      const emailFieldId2 = new ObjectId().toHexString()

      const yesNoFieldId1 = new ObjectId().toHexString()
      const yesNoFieldId2 = new ObjectId().toHexString()

      const submissionResponses = {
        [emailFieldId1]: {
          fieldType: BasicField.Email,
          answer: {
            value: expectedEmails[0],
          },
        },
        [emailFieldId2]: {
          fieldType: BasicField.Email,
          answer: {
            value: 'not_expected_1@example.com',
          },
        },
        [yesNoFieldId1]: {
          fieldType: BasicField.YesNo,
          answer: { value: 'Yes' },
        },
        [yesNoFieldId2]: {
          fieldType: BasicField.YesNo,
          answer: { value: 'No' },
        },
      } as FieldResponsesV3

      const threeStepApprovalWorkflow: FormWorkflowStepDto[] = [
        {
          _id: stepOneId,
          workflow_type: WorkflowType.Static,
          emails: [],
          edit: [],
        },
        {
          _id: stepTwoId,
          workflow_type: WorkflowType.Static,
          emails: ['not_expected_2@example.com'],
          edit: [yesNoFieldId1],
          approval_field: yesNoFieldId1,
        },
        {
          _id: stepThreeId,
          workflow_type: WorkflowType.Dynamic,
          field: emailFieldId2,
          edit: [yesNoFieldId2],
          // no approval field for last step
        },
      ]

      const currentWorkflowStep = 2 // last step of 3 step workflow

      // Act
      await performMultiRespondentPostSubmissionUpdateActions({
        submission: {
          id: mockSubmissionId,
        } as unknown as IMultirespondentSubmissionSchema,
        submissionId: mockSubmissionId,
        snapshottedFormDef: {
          _id: mockFormId,
          workflow: threeStepApprovalWorkflow,
          emails: [expectedEmails[1]],
          stepOneEmailNotificationFieldId: emailFieldId1,
          admin: {
            agency: {
              fullName: 'Government Technology Agency',
            },
          },
          form_fields: [
            {
              _id: emailFieldId1,
              fieldType: BasicField.Email,
              title: 'Email Field 1',
            },
            {
              _id: emailFieldId2,
              fieldType: BasicField.Email,
              title: 'Email Field 2',
            },
            {
              _id: yesNoFieldId1,
              fieldType: BasicField.YesNo,
              title: 'Yes/No Field 1',
            },
            {
              _id: yesNoFieldId2,
              fieldType: BasicField.YesNo,
              title: 'Yes/No Field 2',
            },
          ] as FormFieldDto[],
        } as SnapshottedFormDef,
        currentStepNumber: currentWorkflowStep,
        attachments: MOCK_SUBMISSION_ATTACHMENTS,
        encryptedPayload: {
          encryptedContent: 'encryptedContent',
          version: 1,
          submissionPublicKey: 'submissionPublicKey',
          encryptedSubmissionSecretKey: 'encryptedSubmissionSecretKey',
          responses: submissionResponses,
          workflowStep: currentWorkflowStep,
        } as MultirespondentSubmissionDto,
        logMeta: {} as any,
      })
      // Assert
      // approval email is sent instead of completion email
      expect(sendMrfApprovalEmailSpy).toHaveBeenCalledTimes(1)
      expect(sendMrfWorkflowCompletionEmailSpy).not.toHaveBeenCalled()
      expect(sendMRFWorkflowStepEmailSpy).not.toHaveBeenCalled()
      // pdf generation is invoked
      expect(MockMailUtils.generateAutoreplyPdf).toHaveBeenCalledTimes(1)
      // pdf attachment is included and submission attachments are correct
      expect(sendMrfApprovalEmailSpy.mock.calls[0][0].attachments).toEqual([
        ...MOCK_SUBMISSION_ATTACHMENTS,
        EXPECTED_MOCK_PDF_ATTACHMENT,
      ])
      // is approve email and destination emails are correct
      expect(sendMrfApprovalEmailSpy.mock.calls[0][0].isRejected).toBeFalse()
      expect(sendMrfApprovalEmailSpy.mock.calls[0][0].emails).toContainValues(
        expectedEmails,
      )
      expect(sendMrfApprovalEmailSpy.mock.calls[0][0].emails.length).toBe(
        expectedEmails.length,
      )
    })

    it('sends approved outcome email to all specified steps including last step of workflow for approval', async () => {
      // Arrange
      const sendMrfWorkflowCompletionEmailSpy = jest.spyOn(
        MailService,
        'sendMrfWorkflowCompletionEmail',
      )
      const sendMrfApprovalEmailSpy = jest.spyOn(
        MailService,
        'sendMrfApprovalEmail',
      )
      const sendMRFWorkflowStepEmailSpy = jest.spyOn(
        MailService,
        'sendMRFWorkflowStepEmail',
      )

      const expectedEmails = [
        'expected1@example.com',
        'expected2@example.com',
        'expected3@example.com',
        'expected4@example.com',
      ]

      const stepOneId = new ObjectId().toHexString()
      const stepTwoId = new ObjectId().toHexString()
      const stepThreeId = new ObjectId().toHexString()

      const emailFieldId1 = new ObjectId().toHexString()
      const emailFieldId2 = new ObjectId().toHexString()

      const yesNoFieldId1 = new ObjectId().toHexString()
      const yesNoFieldId2 = new ObjectId().toHexString()

      const submissionResponses = {
        [emailFieldId1]: {
          fieldType: BasicField.Email,
          answer: {
            value: expectedEmails[0],
          },
        },
        [emailFieldId2]: {
          fieldType: BasicField.Email,
          answer: {
            value: expectedEmails[2],
          },
        },
        [yesNoFieldId1]: {
          fieldType: BasicField.YesNo,
          answer: { value: 'Yes' },
        },
        [yesNoFieldId2]: {
          fieldType: BasicField.YesNo,
          answer: { value: 'No' },
        },
      } as FieldResponsesV3

      const threeStepApprovalWorkflow: FormWorkflowStepDto[] = [
        {
          _id: stepOneId,
          workflow_type: WorkflowType.Static,
          emails: [],
          edit: [],
        },
        {
          _id: stepTwoId,
          workflow_type: WorkflowType.Static,
          emails: [expectedEmails[1]],
          edit: [yesNoFieldId1],
          approval_field: yesNoFieldId1,
        },
        {
          _id: stepThreeId,
          workflow_type: WorkflowType.Dynamic,
          field: emailFieldId2,
          edit: [yesNoFieldId2],
          // no approval field for last step
        },
      ]

      const currentWorkflowStep = 2 // last step of 3 step workflow

      // Act
      await performMultiRespondentPostSubmissionUpdateActions({
        submission: {
          id: mockSubmissionId,
        } as unknown as IMultirespondentSubmissionSchema,
        submissionId: mockSubmissionId,
        snapshottedFormDef: {
          _id: mockFormId,
          workflow: threeStepApprovalWorkflow,
          emails: [expectedEmails[3]],
          stepsToNotify: [stepTwoId, stepThreeId],
          stepOneEmailNotificationFieldId: emailFieldId1,
          admin: {
            agency: {
              fullName: 'Government Technology Agency',
            },
          },
          form_fields: [
            {
              _id: emailFieldId1,
              fieldType: BasicField.Email,
              title: 'Email Field 1',
            },
            {
              _id: emailFieldId2,
              fieldType: BasicField.Email,
              title: 'Email Field 2',
            },
            {
              _id: yesNoFieldId1,
              fieldType: BasicField.YesNo,
              title: 'Yes/No Field 1',
            },
            {
              _id: yesNoFieldId2,
              fieldType: BasicField.YesNo,
              title: 'Yes/No Field 2',
            },
          ] as FormFieldDto[],
        } as SnapshottedFormDef,
        currentStepNumber: currentWorkflowStep,
        encryptedPayload: {
          encryptedContent: 'encryptedContent',
          version: 1,
          submissionPublicKey: 'submissionPublicKey',
          encryptedSubmissionSecretKey: 'encryptedSubmissionSecretKey',
          responses: submissionResponses,
          workflowStep: currentWorkflowStep,
        } as MultirespondentSubmissionDto,
        logMeta: {} as any,
      })
      // Assert
      // approval email is sent instead of completion email
      expect(sendMrfApprovalEmailSpy).toHaveBeenCalledTimes(1)
      expect(sendMrfWorkflowCompletionEmailSpy).not.toHaveBeenCalled()
      expect(sendMRFWorkflowStepEmailSpy).not.toHaveBeenCalled()
      // pdf generation is invoked
      expect(MockMailUtils.generateAutoreplyPdf).toHaveBeenCalledTimes(1)
      // pdf attachment is included and submission attachments are correct
      expect(sendMrfApprovalEmailSpy.mock.calls[0][0].attachments).toEqual([
        EXPECTED_MOCK_PDF_ATTACHMENT,
      ])
      // is approve email and destination emails are correct
      expect(sendMrfApprovalEmailSpy.mock.calls[0][0].isRejected).toBeFalse()
      expect(sendMrfApprovalEmailSpy.mock.calls[0][0].emails).toContainValues(
        expectedEmails,
      )
      expect(sendMrfApprovalEmailSpy.mock.calls[0][0].emails.length).toBe(
        expectedEmails.length,
      )
    })

    it('sends approved outcome email when mrf is approved for last step of multiple step MRF', async () => {
      // Arrange
      const sendMrfWorkflowCompletionEmailSpy = jest.spyOn(
        MailService,
        'sendMrfWorkflowCompletionEmail',
      )
      const sendMrfApprovalEmailSpy = jest.spyOn(
        MailService,
        'sendMrfApprovalEmail',
      )
      const sendMRFWorkflowStepEmailSpy = jest.spyOn(
        MailService,
        'sendMRFWorkflowStepEmail',
      )

      const expectedEmails = ['expected1@example.com', 'expected2@example.com']

      const stepOneId = new ObjectId().toHexString()
      const stepTwoId = new ObjectId().toHexString()
      const stepThreeId = new ObjectId().toHexString()

      const emailFieldId1 = new ObjectId().toHexString()
      const emailFieldId2 = new ObjectId().toHexString()

      const yesNoFieldId1 = new ObjectId().toHexString()
      const yesNoFieldId2 = new ObjectId().toHexString()

      const submissionResponses = {
        [emailFieldId1]: {
          fieldType: BasicField.Email,
          answer: {
            value: expectedEmails[0],
          },
        },
        [emailFieldId2]: {
          fieldType: BasicField.Email,
          answer: {
            value: 'not_expected_1@example.com',
          },
        },
        [yesNoFieldId1]: {
          fieldType: BasicField.YesNo,
          answer: { value: 'Yes' },
        },
        [yesNoFieldId2]: {
          fieldType: BasicField.YesNo,
          answer: { value: 'Yes' },
        },
      }

      const threeStepApprovalWorkflow: FormWorkflowStepDto[] = [
        {
          _id: stepOneId,
          workflow_type: WorkflowType.Static,
          emails: [],
          edit: [],
        },
        {
          _id: stepTwoId,
          workflow_type: WorkflowType.Static,
          emails: ['not_expected_2@example.com'],
          edit: [yesNoFieldId1],
          approval_field: yesNoFieldId1,
        },
        {
          _id: stepThreeId,
          workflow_type: WorkflowType.Dynamic,
          field: emailFieldId2,
          edit: [yesNoFieldId2],
          approval_field: yesNoFieldId2,
        },
      ]

      const currentWorkflowStep = 2 // last step of 3 step workflow

      // Act
      await performMultiRespondentPostSubmissionUpdateActions({
        submission: {
          id: mockSubmissionId,
        } as unknown as IMultirespondentSubmissionSchema,
        submissionId: mockSubmissionId,
        snapshottedFormDef: {
          _id: mockFormId,
          workflow: threeStepApprovalWorkflow,
          emails: [expectedEmails[1]],
          stepOneEmailNotificationFieldId: emailFieldId1,
          admin: {
            agency: {
              fullName: 'Government Technology Agency',
            },
          },
          form_fields: [
            {
              _id: emailFieldId1,
              fieldType: BasicField.Email,
              title: 'Email Field 1',
            },
            {
              _id: emailFieldId2,
              fieldType: BasicField.Email,
              title: 'Email Field 2',
            },
            {
              _id: yesNoFieldId1,
              fieldType: BasicField.YesNo,
              title: 'Yes/No Field 1',
            },
            {
              _id: yesNoFieldId2,
              fieldType: BasicField.YesNo,
              title: 'Yes/No Field 2',
            },
          ] as FormFieldDto[],
        } as SnapshottedFormDef,
        currentStepNumber: currentWorkflowStep,
        encryptedPayload: {
          encryptedContent: 'encryptedContent',
          version: 1,
          submissionPublicKey: 'submissionPublicKey',
          encryptedSubmissionSecretKey: 'encryptedSubmissionSecretKey',
          responses: submissionResponses,
          workflowStep: threeStepApprovalWorkflow.length - 1, // last step
        } as MultirespondentSubmissionDto,
        logMeta: {} as any,
      })
      // Assert
      // approval email is sent instead of completion email
      expect(sendMrfApprovalEmailSpy).toHaveBeenCalledTimes(1)
      expect(sendMrfWorkflowCompletionEmailSpy).not.toHaveBeenCalled()
      expect(sendMRFWorkflowStepEmailSpy).not.toHaveBeenCalled()
      // pdf generation is invoked
      expect(MockMailUtils.generateAutoreplyPdf).toHaveBeenCalledTimes(1)
      // pdf attachment is included and submission attachments are correct
      expect(sendMrfApprovalEmailSpy.mock.calls[0][0].attachments).toEqual([
        EXPECTED_MOCK_PDF_ATTACHMENT,
      ])
      // is approve email and destination emails are correct
      expect(sendMrfApprovalEmailSpy.mock.calls[0][0].isRejected).toBeFalse()
      expect(sendMrfApprovalEmailSpy.mock.calls[0][0].emails).toContainValues(
        expectedEmails,
      )
      expect(sendMrfApprovalEmailSpy.mock.calls[0][0].emails.length).toBe(
        expectedEmails.length,
      )
    })

    it('workflow terminates and sends not approved outcome email when mrf is rejected for mid step of multiple step MRF', async () => {
      // Arrange
      const sendMrfWorkflowCompletionEmailSpy = jest.spyOn(
        MailService,
        'sendMrfWorkflowCompletionEmail',
      )
      const sendMrfApprovalEmailSpy = jest.spyOn(
        MailService,
        'sendMrfApprovalEmail',
      )
      const sendMRFWorkflowStepEmailSpy = jest.spyOn(
        MailService,
        'sendMRFWorkflowStepEmail',
      )

      const expectedEmails = ['expected1@example.com', 'expected2@example.com']

      const stepOneId = new ObjectId().toHexString()
      const stepTwoId = new ObjectId().toHexString()
      const stepThreeId = new ObjectId().toHexString()

      const emailFieldId1 = new ObjectId().toHexString()
      const emailFieldId2 = new ObjectId().toHexString()

      const yesNoFieldId1 = new ObjectId().toHexString()
      const yesNoFieldId2 = new ObjectId().toHexString()

      const submissionResponses = {
        [emailFieldId1]: {
          fieldType: BasicField.Email,
          answer: {
            value: expectedEmails[0],
          },
        },
        [emailFieldId2]: {
          fieldType: BasicField.Email,
          answer: {
            value: 'not_expected_1@example.com',
          },
        },
        [yesNoFieldId1]: {
          fieldType: BasicField.YesNo,
          answer: { value: 'No' },
        },
      } as FieldResponsesV3

      const threeStepApprovalWorkflow: FormWorkflowStepDto[] = [
        {
          _id: stepOneId,
          workflow_type: WorkflowType.Static,
          emails: [],
          edit: [],
        },
        {
          _id: stepTwoId,
          workflow_type: WorkflowType.Static,
          emails: ['not_expected_2@example.com'],
          edit: [yesNoFieldId1],
          approval_field: yesNoFieldId1,
        },
        {
          _id: stepThreeId,
          workflow_type: WorkflowType.Dynamic,
          field: emailFieldId2,
          edit: [yesNoFieldId2],
          approval_field: yesNoFieldId2,
        },
      ]

      const currentStepNumber = 1 // 2nd step of 3 steps workflow

      // Act
      await performMultiRespondentPostSubmissionUpdateActions({
        submission: {
          id: mockSubmissionId,
        } as unknown as IMultirespondentSubmissionSchema,
        submissionId: mockSubmissionId,
        snapshottedFormDef: {
          _id: mockFormId,
          workflow: threeStepApprovalWorkflow,
          emails: [expectedEmails[1]],
          stepOneEmailNotificationFieldId: emailFieldId1,
          admin: {
            agency: {
              fullName: 'Government Technology Agency',
            },
          },
          form_fields: [
            {
              _id: emailFieldId1,
              fieldType: BasicField.Email,
              title: 'Email Field 1',
            },
            {
              _id: emailFieldId2,
              fieldType: BasicField.Email,
              title: 'Email Field 2',
            },
            {
              _id: yesNoFieldId1,
              fieldType: BasicField.YesNo,
              title: 'Yes/No Field 1',
            },
            {
              _id: yesNoFieldId2,
              fieldType: BasicField.YesNo,
              title: 'Yes/No Field 2',
            },
          ] as FormFieldDto[],
        } as SnapshottedFormDef,
        currentStepNumber: currentStepNumber,
        attachments: MOCK_SUBMISSION_ATTACHMENTS,
        encryptedPayload: {
          encryptedContent: 'encryptedContent',
          version: 1,
          submissionPublicKey: 'submissionPublicKey',
          encryptedSubmissionSecretKey: 'encryptedSubmissionSecretKey',
          responses: submissionResponses,
          workflowStep: currentStepNumber,
        } as MultirespondentSubmissionDto,
        logMeta: {} as any,
      })
      // Assert
      // approval email is sent instead of completion email
      expect(sendMrfApprovalEmailSpy).toHaveBeenCalledTimes(1)
      expect(sendMrfWorkflowCompletionEmailSpy).not.toHaveBeenCalled()
      expect(sendMRFWorkflowStepEmailSpy).not.toHaveBeenCalled()
      // pdf generation is invoked
      expect(MockMailUtils.generateAutoreplyPdf).toHaveBeenCalledTimes(1)
      // pdf attachment is included and submission attachments are correct
      expect(sendMrfApprovalEmailSpy.mock.calls[0][0].attachments).toEqual([
        ...MOCK_SUBMISSION_ATTACHMENTS,
        EXPECTED_MOCK_PDF_ATTACHMENT,
      ])
      // is rejected email and destination emails are correct
      expect(sendMrfApprovalEmailSpy.mock.calls[0][0].isRejected).toBeTrue()
      expect(sendMrfApprovalEmailSpy.mock.calls[0][0].emails).toContainValues(
        expectedEmails,
      )
      expect(sendMrfApprovalEmailSpy.mock.calls[0][0].emails.length).toBe(
        expectedEmails.length,
      )
    })

    it('workflow terminates and sends not approved outcome email only to steps before and including current step when mrf is rejected for mid step of multiple step MRF', async () => {
      // Arrange
      const sendMrfWorkflowCompletionEmailSpy = jest.spyOn(
        MailService,
        'sendMrfWorkflowCompletionEmail',
      )
      const sendMrfApprovalEmailSpy = jest.spyOn(
        MailService,
        'sendMrfApprovalEmail',
      )
      const sendMRFWorkflowStepEmailSpy = jest.spyOn(
        MailService,
        'sendMRFWorkflowStepEmail',
      )

      const expectedEmails = [
        'expected1@example.com',
        'expected2@example.com',
        'expected3@example.com',
      ]

      const stepOneId = new ObjectId().toHexString()
      const stepTwoId = new ObjectId().toHexString()
      const stepThreeId = new ObjectId().toHexString()
      const stepFourId = new ObjectId().toHexString()
      const stepFiveId = new ObjectId().toHexString()

      const emailFieldId1 = new ObjectId().toHexString()
      const emailFieldId2 = new ObjectId().toHexString()

      const yesNoFieldId1 = new ObjectId().toHexString()
      const yesNoFieldId2 = new ObjectId().toHexString()

      const submissionResponses = {
        [emailFieldId1]: {
          fieldType: BasicField.Email,
          answer: {
            value: expectedEmails[0],
          },
        },
        [emailFieldId2]: {
          fieldType: BasicField.Email,
          answer: {
            value: 'not_expected_1@example.com',
          },
        },
        [yesNoFieldId1]: {
          fieldType: BasicField.YesNo,
          answer: { value: 'No' },
        },
      } as FieldResponsesV3

      const fiveStepApprovalWorkflow: FormWorkflowStepDto[] = [
        {
          _id: stepOneId,
          workflow_type: WorkflowType.Static,
          emails: [],
          edit: [],
        },
        {
          _id: stepTwoId,
          workflow_type: WorkflowType.Static,
          emails: ['not_expected_2@example.com'],
          edit: [yesNoFieldId1],
          approval_field: yesNoFieldId1,
        },
        {
          _id: stepThreeId,
          workflow_type: WorkflowType.Dynamic,
          field: emailFieldId2,
          edit: [yesNoFieldId2],
          approval_field: yesNoFieldId2,
        },
        {
          _id: stepFourId,
          workflow_type: WorkflowType.Static,
          emails: [expectedEmails[2]],
          edit: [],
        },
        {
          _id: stepFiveId,
          workflow_type: WorkflowType.Static,
          emails: ['not_expected_3@example.com'],
          edit: [],
        },
      ]

      const currentStepNumber = 1 // 2nd step of 5 steps workflow

      // Act
      await performMultiRespondentPostSubmissionUpdateActions({
        submission: {
          id: mockSubmissionId,
        } as unknown as IMultirespondentSubmissionSchema,
        submissionId: mockSubmissionId,
        snapshottedFormDef: {
          _id: mockFormId,
          workflow: fiveStepApprovalWorkflow,
          emails: [expectedEmails[1], expectedEmails[2]],
          stepsToNotify: [stepThreeId, stepFourId, stepFiveId],
          stepOneEmailNotificationFieldId: emailFieldId1,
          admin: {
            agency: {
              fullName: 'Government Technology Agency',
            },
          },
          form_fields: [
            {
              _id: emailFieldId1,
              fieldType: BasicField.Email,
              title: 'Email Field 1',
            },
            {
              _id: emailFieldId2,
              fieldType: BasicField.Email,
              title: 'Email Field 2',
            },
            {
              _id: yesNoFieldId1,
              fieldType: BasicField.YesNo,
              title: 'Yes/No Field 1',
            },
            {
              _id: yesNoFieldId2,
              fieldType: BasicField.YesNo,
              title: 'Yes/No Field 2',
            },
          ] as FormFieldDto[],
        } as SnapshottedFormDef,
        currentStepNumber: currentStepNumber,
        encryptedPayload: {
          encryptedContent: 'encryptedContent',
          version: 1,
          submissionPublicKey: 'submissionPublicKey',
          encryptedSubmissionSecretKey: 'encryptedSubmissionSecretKey',
          responses: submissionResponses,
          workflowStep: currentStepNumber,
        } as MultirespondentSubmissionDto,
        logMeta: {} as any,
      })
      // Assert
      // approval email is sent instead of completion email
      expect(sendMrfApprovalEmailSpy).toHaveBeenCalledTimes(1)
      expect(sendMrfWorkflowCompletionEmailSpy).not.toHaveBeenCalled()
      expect(sendMRFWorkflowStepEmailSpy).not.toHaveBeenCalled()
      // pdf generation is invoked
      expect(MockMailUtils.generateAutoreplyPdf).toHaveBeenCalledTimes(1)
      // pdf attachment is included and submission attachments are correct
      expect(sendMrfApprovalEmailSpy.mock.calls[0][0].attachments).toEqual([
        EXPECTED_MOCK_PDF_ATTACHMENT,
      ])
      // is rejected email and destination emails are correct
      expect(sendMrfApprovalEmailSpy.mock.calls[0][0].isRejected).toBeTrue()
      expect(sendMrfApprovalEmailSpy.mock.calls[0][0].emails).toContainValues(
        expectedEmails,
      )
      expect(sendMrfApprovalEmailSpy.mock.calls[0][0].emails.length).toBe(
        expectedEmails.length,
      )
    })

    it('workflow terminates and sends not approved outcome email when mrf is rejected for last step of multiple step MRF', async () => {
      // Arrange
      const sendMrfWorkflowCompletionEmailSpy = jest.spyOn(
        MailService,
        'sendMrfWorkflowCompletionEmail',
      )
      const sendMrfApprovalEmailSpy = jest.spyOn(
        MailService,
        'sendMrfApprovalEmail',
      )
      const sendMRFWorkflowStepEmailSpy = jest.spyOn(
        MailService,
        'sendMRFWorkflowStepEmail',
      )

      const expectedEmails = ['expected1@example.com', 'expected2@example.com']

      const stepOneId = new ObjectId().toHexString()
      const stepTwoId = new ObjectId().toHexString()
      const stepThreeId = new ObjectId().toHexString()

      const emailFieldId1 = new ObjectId().toHexString()
      const emailFieldId2 = new ObjectId().toHexString()

      const yesNoFieldId1 = new ObjectId().toHexString()
      const yesNoFieldId2 = new ObjectId().toHexString()

      const submissionResponses = {
        [emailFieldId1]: {
          fieldType: BasicField.Email,
          answer: {
            value: expectedEmails[0],
          },
        },
        [emailFieldId2]: {
          fieldType: BasicField.Email,
          answer: {
            value: 'not_expected_1@example.com',
          },
        },
        [yesNoFieldId1]: {
          fieldType: BasicField.YesNo,
          answer: { value: 'Yes' },
        },
        [yesNoFieldId2]: {
          fieldType: BasicField.YesNo,
          answer: { value: 'No' },
        },
      }

      const threeStepApprovalWorkflow: FormWorkflowStepDto[] = [
        {
          _id: stepOneId,
          workflow_type: WorkflowType.Static,
          emails: [],
          edit: [],
        },
        {
          _id: stepTwoId,
          workflow_type: WorkflowType.Static,
          emails: ['not_expected_2@example.com'],
          edit: [yesNoFieldId1],
          approval_field: yesNoFieldId1,
        },
        {
          _id: stepThreeId,
          workflow_type: WorkflowType.Dynamic,
          field: emailFieldId2,
          edit: [yesNoFieldId2],
          approval_field: yesNoFieldId2,
        },
      ]

      const currentStepNumber = 2 // last step of 3 step workflow

      // Act
      await performMultiRespondentPostSubmissionUpdateActions({
        submission: {
          id: mockSubmissionId,
        } as unknown as IMultirespondentSubmissionSchema,
        submissionId: mockSubmissionId,
        snapshottedFormDef: {
          _id: mockFormId,
          workflow: threeStepApprovalWorkflow,
          emails: [expectedEmails[1]],
          stepOneEmailNotificationFieldId: emailFieldId1,
          admin: {
            agency: {
              fullName: 'Government Technology Agency',
            },
          },
          form_fields: [
            {
              _id: emailFieldId1,
              fieldType: BasicField.Email,
              title: 'Email Field 1',
            },
            {
              _id: emailFieldId2,
              fieldType: BasicField.Email,
              title: 'Email Field 2',
            },
            {
              _id: yesNoFieldId1,
              fieldType: BasicField.YesNo,
              title: 'Yes/No Field 1',
            },
            {
              _id: yesNoFieldId2,
              fieldType: BasicField.YesNo,
              title: 'Yes/No Field 2',
            },
          ] as FormFieldDto[],
        } as SnapshottedFormDef,
        currentStepNumber,
        encryptedPayload: {
          encryptedContent: 'encryptedContent',
          version: 1,
          submissionPublicKey: 'submissionPublicKey',
          encryptedSubmissionSecretKey: 'encryptedSubmissionSecretKey',
          responses: submissionResponses,
          workflowStep: threeStepApprovalWorkflow.length - 1, // last step
        } as MultirespondentSubmissionDto,
        logMeta: {} as any,
      })
      // Assert
      // approval email is sent instead of completion email
      expect(sendMrfApprovalEmailSpy).toHaveBeenCalledTimes(1)
      expect(sendMrfWorkflowCompletionEmailSpy).not.toHaveBeenCalled()
      expect(sendMRFWorkflowStepEmailSpy).not.toHaveBeenCalled()
      // pdf generation is invoked
      expect(MockMailUtils.generateAutoreplyPdf).toHaveBeenCalledTimes(1)
      // pdf attachment is included and submission attachments are correct
      expect(sendMrfApprovalEmailSpy.mock.calls[0][0].attachments).toEqual([
        EXPECTED_MOCK_PDF_ATTACHMENT,
      ])
      // is rejected email and destination emails are correct
      expect(sendMrfApprovalEmailSpy.mock.calls[0][0].isRejected).toBeTrue()
      expect(sendMrfApprovalEmailSpy.mock.calls[0][0].emails).toContainValues(
        expectedEmails,
      )
      expect(sendMrfApprovalEmailSpy.mock.calls[0][0].emails.length).toBe(
        expectedEmails.length,
      )
    })
  })

  describe('mrf completion email notification when no approval step exists', () => {
    it('sends completion email without pdf attachment when pdf generation fails', async () => {
      // Arrange
      MockMailUtils.generateAutoreplyPdf.mockReturnValue(
        errAsync(new AutoreplyPdfGenerationError()),
      )
      const sendMrfWorkflowCompletionEmailSpy = jest.spyOn(
        MailService,
        'sendMrfWorkflowCompletionEmail',
      )
      const singleStepWorkflow: FormWorkflowStepDto[] = [
        {
          _id: new ObjectId().toHexString(),
          workflow_type: WorkflowType.Static,
          emails: [],
          edit: [],
        },
      ]

      // Act
      await performMultiRespondentPostSubmissionCreateActions({
        submission: {
          id: mockSubmissionId,
        } as unknown as IMultirespondentSubmissionSchema,
        submissionId: mockSubmissionId,
        form: {
          _id: mockFormId,
          workflow: singleStepWorkflow,
          emails: ['email1@example.com'],
        } as IPopulatedMultirespondentForm,
        encryptedPayload: {
          encryptedContent: 'encryptedContent',
          version: 1,
          submissionPublicKey: 'submissionPublicKey',
          encryptedSubmissionSecretKey: 'encryptedSubmissionSecretKey',
        } as MultirespondentSubmissionDto,
        attachments: MOCK_SUBMISSION_ATTACHMENTS,
        logMeta: {} as any,
      })

      // Assert
      expect(sendMrfWorkflowCompletionEmailSpy).toHaveBeenCalledTimes(1)
      // pdf generation is invoked
      expect(MockMailUtils.generateAutoreplyPdf).toHaveBeenCalledTimes(1)
      // submission attachments is sent without pdf attachment
      expect(
        sendMrfWorkflowCompletionEmailSpy.mock.calls[0][0].attachments,
      ).toEqual([...MOCK_SUBMISSION_ATTACHMENTS])
      // the correct destination emails are included
      expect(
        sendMrfWorkflowCompletionEmailSpy.mock.calls[0][0].emails,
      ).toContainValues(['email1@example.com'])
      expect(
        sendMrfWorkflowCompletionEmailSpy.mock.calls[0][0].emails.length,
      ).toBe(1)
    })

    it('sends completion email with pdf attachment when single step mrf is completed', async () => {
      // Arrange
      const sendMrfWorkflowCompletionEmailSpy = jest.spyOn(
        MailService,
        'sendMrfWorkflowCompletionEmail',
      )

      const singleStepWorkflow: FormWorkflowStepDto[] = [
        {
          _id: new ObjectId().toHexString(),
          workflow_type: WorkflowType.Static,
          emails: [],
          edit: [],
        },
      ]

      // Act
      await performMultiRespondentPostSubmissionCreateActions({
        submission: {
          id: mockSubmissionId,
        } as unknown as IMultirespondentSubmissionSchema,
        submissionId: mockSubmissionId,
        form: {
          _id: mockFormId,
          workflow: singleStepWorkflow,
          emails: ['email1@example.com'],
        } as IPopulatedMultirespondentForm,
        encryptedPayload: {
          encryptedContent: 'encryptedContent',
          version: 1,
          submissionPublicKey: 'submissionPublicKey',
          encryptedSubmissionSecretKey: 'encryptedSubmissionSecretKey',
        } as MultirespondentSubmissionDto,
        attachments: MOCK_SUBMISSION_ATTACHMENTS,
        logMeta: {} as any,
      })

      // Assert
      expect(sendMrfWorkflowCompletionEmailSpy).toHaveBeenCalledTimes(1)
      // pdf generation is invoked
      expect(MockMailUtils.generateAutoreplyPdf).toHaveBeenCalledTimes(1)
      // pdf attachment is included and submission attachments are correct
      expect(
        sendMrfWorkflowCompletionEmailSpy.mock.calls[0][0].attachments,
      ).toEqual([...MOCK_SUBMISSION_ATTACHMENTS, EXPECTED_MOCK_PDF_ATTACHMENT])
      // the correct destination emails are included
      expect(
        sendMrfWorkflowCompletionEmailSpy.mock.calls[0][0].emails,
      ).toContainValues(['email1@example.com'])
      expect(
        sendMrfWorkflowCompletionEmailSpy.mock.calls[0][0].emails.length,
      ).toBe(1)
    })

    it('sends completion email when multi-step mrf is completed and only to specified steps only and also static emails', async () => {
      // Arrange
      const sendMrfWorkflowCompletionEmailSpy = jest.spyOn(
        MailService,
        'sendMrfWorkflowCompletionEmail',
      )

      const expectedEmails = [
        'expected1@example.com',
        'expected2@example.com',
        'expected3@example.com',
        'expected4@example.com',
      ]

      const stepOneId = new ObjectId().toHexString()
      const stepTwoId = new ObjectId().toHexString()
      const stepThreeId = new ObjectId().toHexString()
      const stepFourId = new ObjectId().toHexString()

      const emailFieldId1 = new ObjectId().toHexString()
      const emailFieldId2 = new ObjectId().toHexString()

      const submissionResponses = {
        [emailFieldId1]: {
          fieldType: 'email',
          answer: {
            value: expectedEmails[0],
          },
        },
        [emailFieldId2]: {
          fieldType: 'email',
          answer: {
            value: 'not_expected_1@example.com',
          },
        },
      } as FieldResponsesV3

      const fourStepWorkflow: FormWorkflowStepDto[] = [
        {
          _id: stepOneId,
          workflow_type: WorkflowType.Static,
          emails: [],
          edit: [],
        },
        {
          _id: stepTwoId,
          workflow_type: WorkflowType.Static,
          emails: ['not_expected_2@example.com'],
          edit: [],
        },
        {
          _id: stepThreeId,
          workflow_type: WorkflowType.Dynamic,
          field: emailFieldId2,
          edit: [],
        },
        {
          _id: stepFourId,
          workflow_type: WorkflowType.Static,
          emails: [expectedEmails[1], expectedEmails[2]],
          edit: [],
        },
      ]

      const currentStepNumber = fourStepWorkflow.length - 1 // last step of 4 steps workflow

      // Act
      await performMultiRespondentPostSubmissionUpdateActions({
        submission: {
          id: mockSubmissionId,
        } as unknown as IMultirespondentSubmissionSchema,
        submissionId: mockSubmissionId,
        snapshottedFormDef: {
          _id: mockFormId,
          workflow: fourStepWorkflow,
          emails: [expectedEmails[3]],
          stepsToNotify: [stepFourId],
          stepOneEmailNotificationFieldId: emailFieldId1,
        } as SnapshottedFormDef,
        currentStepNumber,
        encryptedPayload: {
          encryptedContent: 'encryptedContent',
          version: 1,
          submissionPublicKey: 'submissionPublicKey',
          encryptedSubmissionSecretKey: 'encryptedSubmissionSecretKey',
          responses: submissionResponses,
          workflowStep: currentStepNumber,
        } as MultirespondentSubmissionDto,
        logMeta: {} as any,
      })

      // Assert
      expect(sendMrfWorkflowCompletionEmailSpy).toHaveBeenCalledTimes(1)
      // pdf generation is invoked
      expect(MockMailUtils.generateAutoreplyPdf).toHaveBeenCalledTimes(1)
      // pdf attachment is included and submission attachments are correct
      expect(
        sendMrfWorkflowCompletionEmailSpy.mock.calls[0][0].attachments,
      ).toEqual([EXPECTED_MOCK_PDF_ATTACHMENT])
      // The emails sent to should only be the expected emails exactly
      expect(
        sendMrfWorkflowCompletionEmailSpy.mock.calls[0][0].emails,
      ).toContainValues(expectedEmails)
      expect(
        sendMrfWorkflowCompletionEmailSpy.mock.calls[0][0].emails.length,
      ).toBe(expectedEmails.length)
    })

    it('does not send completion email when step number >0 and mrf not completed', async () => {
      // Arrange
      const sendMrfWorkflowCompletionEmailSpy = jest.spyOn(
        MailService,
        'sendMrfWorkflowCompletionEmail',
      )

      const selectedEmails = [
        'seelcted1@example.com',
        'seelcted2@example.com',
        'seelcted3@example.com',
        'seelcted4@example.com',
      ]

      const stepOneId = new ObjectId().toHexString()
      const stepTwoId = new ObjectId().toHexString()
      const stepThreeId = new ObjectId().toHexString()
      const stepFourId = new ObjectId().toHexString()

      const emailFieldId1 = new ObjectId().toHexString()
      const emailFieldId2 = new ObjectId().toHexString()

      const submissionResponses = {
        [emailFieldId1]: {
          fieldType: 'email',
          answer: {
            value: selectedEmails[0],
          },
        },
        [emailFieldId2]: {
          fieldType: 'email',
          answer: {
            value: 'not_selected_1@example.com',
          },
        },
      }

      const fourStepWorkflow: FormWorkflowStepDto[] = [
        {
          _id: stepOneId,
          workflow_type: WorkflowType.Static,
          emails: [],
          edit: [],
        },
        {
          _id: stepTwoId,
          workflow_type: WorkflowType.Static,
          emails: ['not_selected_2@example.com'],
          edit: [],
        },
        {
          _id: stepThreeId,
          workflow_type: WorkflowType.Dynamic,
          field: emailFieldId2,
          edit: [],
        },
        {
          _id: stepFourId,
          workflow_type: WorkflowType.Static,
          emails: [selectedEmails[1], selectedEmails[2]],
          edit: [],
        },
      ]

      const currentStepNumber = fourStepWorkflow.length - 2 // not last step of 4 steps workflow

      // Act
      await performMultiRespondentPostSubmissionUpdateActions({
        submission: {
          id: mockSubmissionId,
        } as unknown as IMultirespondentSubmissionSchema,
        submissionId: mockSubmissionId,
        snapshottedFormDef: {
          _id: mockFormId,
          workflow: fourStepWorkflow,
          emails: [selectedEmails[3]],
          stepsToNotify: [stepFourId],
          stepOneEmailNotificationFieldId: emailFieldId1,
        } as SnapshottedFormDef,
        currentStepNumber,
        encryptedPayload: {
          encryptedContent: 'encryptedContent',
          version: 1,
          submissionPublicKey: 'submissionPublicKey',
          encryptedSubmissionSecretKey: 'encryptedSubmissionSecretKey',
          responses: submissionResponses,
          workflowStep: currentStepNumber,
        } as MultirespondentSubmissionDto,
        logMeta: {} as any,
      })

      // Assert
      expect(sendMrfWorkflowCompletionEmailSpy).not.toHaveBeenCalled()
    })
  })

  describe('step one email notification field id', () => {
    const mockFormId = new ObjectId().toHexString()

    it('sends completion email to step one email notification field id, stepsToNotify and static emails when step one email notification field id is set', async () => {
      // Arrange
      const sendMrfWorkflowCompletionEmailSpy = jest.spyOn(
        MailService,
        'sendMrfWorkflowCompletionEmail',
      )
      const stepOneEmailNotificationFieldId = new ObjectId().toHexString()
      const stepOneEditEmailFieldId = new ObjectId().toHexString()

      const expectedStepOneEmail = 'expected_step_one_email@example.com'
      const notExpectedStepOneEmail = 'not_expected_step_one_email@example.com'
      const expectedStaticEmail = 'expected_static_email@example.com'
      const expectedStepTwoEmail = 'expected_step_two_static_email@example.com'

      const expectedEmails = [
        expectedStepOneEmail,
        expectedStaticEmail,
        expectedStepTwoEmail,
      ]

      const stepOneId = new ObjectId().toHexString()
      const stepTwoId = new ObjectId().toHexString()

      const workflow: FormWorkflowStepDto[] = [
        {
          _id: stepOneId,
          workflow_type: WorkflowType.Dynamic,
          field: stepOneEditEmailFieldId,
          edit: [stepOneEditEmailFieldId],
        },
        {
          _id: stepTwoId,
          workflow_type: WorkflowType.Static,
          emails: [expectedStepTwoEmail],
          edit: [],
        },
      ]

      const snapshottedFormDef = {
        _id: mockFormId,
        workflow,
        emails: [expectedStaticEmail],
        stepsToNotify: [stepOneId, stepTwoId], // Including step one in stepsToNotify
        stepOneEmailNotificationFieldId,
      } as SnapshottedFormDef

      const submissionResponses: FieldResponsesV3 = {
        [stepOneEmailNotificationFieldId]: {
          fieldType: BasicField.Email,
          answer: {
            value: expectedStepOneEmail,
          },
        },
        [stepOneEditEmailFieldId]: {
          fieldType: BasicField.Email,
          answer: {
            value: notExpectedStepOneEmail,
          },
        },
      }

      // Act
      await performMultiRespondentPostSubmissionUpdateActions({
        submission: {
          id: mockSubmissionId,
        } as unknown as IMultirespondentSubmissionSchema,
        submissionId: mockSubmissionId,
        snapshottedFormDef,
        currentStepNumber: workflow.length - 1,
        encryptedPayload: {
          encryptedContent: 'encryptedContent',
          version: 1,
          submissionPublicKey: 'submissionPublicKey',
          encryptedSubmissionSecretKey: 'encryptedSubmissionSecretKey',
          responses: submissionResponses,
          workflowStep: workflow.length - 1,
        } as MultirespondentSubmissionDto,
        logMeta: {} as any,
      })

      // Assert
      expect(sendMrfWorkflowCompletionEmailSpy).toHaveBeenCalledTimes(1)
      // pdf generation is invoked
      expect(MockMailUtils.generateAutoreplyPdf).toHaveBeenCalledTimes(1)
      // pdf attachment is included and submission attachments are correct
      expect(
        sendMrfWorkflowCompletionEmailSpy.mock.calls[0][0].attachments,
      ).toEqual([EXPECTED_MOCK_PDF_ATTACHMENT])
      expect(
        sendMrfWorkflowCompletionEmailSpy.mock.calls[0][0].emails,
      ).toContainValues(expectedEmails)
      expect(
        sendMrfWorkflowCompletionEmailSpy.mock.calls[0][0].emails.length,
      ).toBe(expectedEmails.length)
      expect(
        sendMrfWorkflowCompletionEmailSpy.mock.calls[0][0].emails.includes(
          notExpectedStepOneEmail,
        ),
      ).toBe(false)
    })

    it('does not send completion to step one email notification field id but still sends to stepsToNotify and static emails when step one email notification field id is not set', async () => {
      // Arrange
      const sendMrfWorkflowCompletionEmailSpy = jest.spyOn(
        MailService,
        'sendMrfWorkflowCompletionEmail',
      )
      const staticEmail = 'expected_static_email@example.com'
      const stepTwoEmail = 'expected_step_two_static_email@example.com'
      const expectedEmails = [staticEmail, stepTwoEmail]

      const stepOneId = new ObjectId().toHexString()
      const stepTwoId = new ObjectId().toHexString()

      const workflow: FormWorkflowStepDto[] = [
        {
          _id: stepOneId,
          workflow_type: WorkflowType.Static,
          emails: [],
          edit: [],
        },
        {
          _id: stepTwoId,
          workflow_type: WorkflowType.Static,
          emails: [stepTwoEmail],
          edit: [],
        },
      ]

      const snapshottedFormDef = {
        _id: mockFormId,
        workflow,
        emails: [staticEmail],
        stepsToNotify: [stepTwoId],
      } as SnapshottedFormDef

      // Act
      await performMultiRespondentPostSubmissionUpdateActions({
        submission: {
          id: mockSubmissionId,
        } as unknown as IMultirespondentSubmissionSchema,
        submissionId: mockSubmissionId,
        snapshottedFormDef,
        currentStepNumber: workflow.length - 1,
        encryptedPayload: {
          encryptedContent: 'encryptedContent',
          version: 1,
          submissionPublicKey: 'submissionPublicKey',
          encryptedSubmissionSecretKey: 'encryptedSubmissionSecretKey',
          workflowStep: workflow.length - 1,
        } as MultirespondentSubmissionDto,
        logMeta: {} as any,
        attachments: MOCK_SUBMISSION_ATTACHMENTS,
      })

      // Assert
      expect(sendMrfWorkflowCompletionEmailSpy).toHaveBeenCalledTimes(1)
      // pdf generation is invoked
      expect(MockMailUtils.generateAutoreplyPdf).toHaveBeenCalledTimes(1)
      // pdf attachment is included and submission attachments are correct
      expect(
        sendMrfWorkflowCompletionEmailSpy.mock.calls[0][0].attachments,
      ).toEqual([...MOCK_SUBMISSION_ATTACHMENTS, EXPECTED_MOCK_PDF_ATTACHMENT])
      expect(
        sendMrfWorkflowCompletionEmailSpy.mock.calls[0][0].emails,
      ).toContainValues(expectedEmails)
      expect(
        sendMrfWorkflowCompletionEmailSpy.mock.calls[0][0].emails.length,
      ).toBe(expectedEmails.length)
    })

    it('does not send completion email to step one email notification field id but still sends to stepsToNotify and static emails when it is deleted', async () => {
      // Arrange
      const sendMrfWorkflowCompletionEmailSpy = jest.spyOn(
        MailService,
        'sendMrfWorkflowCompletionEmail',
      )
      const stepOneEmailNotificationFieldId = new ObjectId().toHexString()
      const staticEmail = 'expected_static_email@example.com'
      const stepTwoEmail = 'expected_step_two_static_email@example.com'

      const stepOneId = new ObjectId().toHexString()
      const stepTwoId = new ObjectId().toHexString()
      const expectedEmails = [staticEmail, stepTwoEmail]

      const workflow: FormWorkflowStepDto[] = [
        {
          _id: stepOneId,
          workflow_type: WorkflowType.Static,
          emails: [],
          edit: [],
        },
        {
          _id: stepTwoId,
          workflow_type: WorkflowType.Static,
          emails: [stepTwoEmail],
          edit: [],
        },
      ]

      const snapshottedFormDef = {
        _id: mockFormId,
        workflow,
        emails: [staticEmail],
        stepsToNotify: [stepTwoId],
        stepOneEmailNotificationFieldId,
      } as SnapshottedFormDef

      const submissionResponses: FieldResponsesV3 = {
        // stepOneEmailNotificationFieldId is not present in responses
      }

      // Act
      await performMultiRespondentPostSubmissionUpdateActions({
        submission: {
          id: mockSubmissionId,
        } as unknown as IMultirespondentSubmissionSchema,
        submissionId: mockSubmissionId,
        snapshottedFormDef,
        currentStepNumber: workflow.length - 1,
        encryptedPayload: {
          encryptedContent: 'encryptedContent',
          version: 1,
          submissionPublicKey: 'submissionPublicKey',
          encryptedSubmissionSecretKey: 'encryptedSubmissionSecretKey',
          responses: submissionResponses,
          workflowStep: workflow.length - 1,
        } as MultirespondentSubmissionDto,
        logMeta: {} as any,
      })

      // Assert
      expect(sendMrfWorkflowCompletionEmailSpy).toHaveBeenCalledTimes(1)
      // pdf generation is invoked
      expect(MockMailUtils.generateAutoreplyPdf).toHaveBeenCalledTimes(1)
      // pdf attachment is included and submission attachments are correct
      expect(
        sendMrfWorkflowCompletionEmailSpy.mock.calls[0][0].attachments,
      ).toEqual([EXPECTED_MOCK_PDF_ATTACHMENT])
      expect(
        sendMrfWorkflowCompletionEmailSpy.mock.calls[0][0].emails,
      ).toContainValues(expectedEmails)
      expect(
        sendMrfWorkflowCompletionEmailSpy.mock.calls[0][0].emails.length,
      ).toBe(expectedEmails.length)
    })

    it('does not send duplicate completion email to step one in stepsToNotify', async () => {
      // Arrange
      const sendMrfWorkflowCompletionEmailSpy = jest.spyOn(
        MailService,
        'sendMrfWorkflowCompletionEmail',
      )
      const stepOneEmailNotificationFieldId = new ObjectId().toHexString()
      const emailFieldId2 = new ObjectId().toHexString()

      const expectedStepOneEmail = 'expected_step_one_email@example.com'
      const notExpectedStepOneEmail = 'not_expected_step_one_email@example.com'
      const expectedStaticEmail = 'expected_static_email@example.com'
      const expectedStepTwoEmail = 'expected_step_two_static_email@example.com'

      const expectedEmails = [
        expectedStepOneEmail,
        expectedStaticEmail,
        expectedStepTwoEmail,
      ]

      const stepOneId = new ObjectId().toHexString()
      const stepTwoId = new ObjectId().toHexString()

      const workflow: FormWorkflowStepDto[] = [
        {
          _id: stepOneId,
          workflow_type: WorkflowType.Dynamic,
          field: emailFieldId2,
          edit: [emailFieldId2],
        },
        {
          _id: stepTwoId,
          workflow_type: WorkflowType.Static,
          emails: [expectedStepTwoEmail],
          edit: [],
        },
      ]

      const snapshottedFormDef = {
        _id: mockFormId,
        workflow,
        emails: [expectedStaticEmail],
        stepsToNotify: [stepOneId, stepTwoId], // Including step one in stepsToNotify
        stepOneEmailNotificationFieldId,
      } as SnapshottedFormDef

      const submissionResponses: FieldResponsesV3 = {
        [stepOneEmailNotificationFieldId]: {
          fieldType: BasicField.Email,
          answer: {
            value: expectedStepOneEmail,
          },
        },
        [emailFieldId2]: {
          fieldType: BasicField.Email,
          answer: {
            value: notExpectedStepOneEmail,
          },
        },
      }

      // Act
      await performMultiRespondentPostSubmissionUpdateActions({
        submission: {
          id: mockSubmissionId,
        } as unknown as IMultirespondentSubmissionSchema,
        submissionId: mockSubmissionId,
        snapshottedFormDef,
        currentStepNumber: workflow.length - 1,
        encryptedPayload: {
          encryptedContent: 'encryptedContent',
          version: 1,
          submissionPublicKey: 'submissionPublicKey',
          encryptedSubmissionSecretKey: 'encryptedSubmissionSecretKey',
          responses: submissionResponses,
          workflowStep: workflow.length - 1,
        } as MultirespondentSubmissionDto,
        logMeta: {} as any,
      })

      // Assert
      expect(sendMrfWorkflowCompletionEmailSpy).toHaveBeenCalledTimes(1)
      // pdf generation is invoked
      expect(MockMailUtils.generateAutoreplyPdf).toHaveBeenCalledTimes(1)
      // pdf attachment is included and submission attachments are correct
      expect(
        sendMrfWorkflowCompletionEmailSpy.mock.calls[0][0].attachments,
      ).toEqual([EXPECTED_MOCK_PDF_ATTACHMENT])
      // the correct destination emails are included
      expect(
        sendMrfWorkflowCompletionEmailSpy.mock.calls[0][0].emails,
      ).toContainValues(expectedEmails)
      expect(
        sendMrfWorkflowCompletionEmailSpy.mock.calls[0][0].emails.length,
      ).toBe(expectedEmails.length)
      expect(
        sendMrfWorkflowCompletionEmailSpy.mock.calls[0][0].emails.includes(
          notExpectedStepOneEmail,
        ),
      ).toBe(false)
    })
  })

  describe('sendNextStepReminderEmail', () => {
    it('invokes the sendMRFWorkflowStepEmail function with isReminder set to true and correct recipient emails', async () => {
      // Arrange
      const mockEmails = ['test@example.com', 'test2@example.com']
      const sendMRFWorkflowStepEmailSpy = jest
        .spyOn(MailService, 'sendMRFWorkflowStepEmail')
        .mockReturnValue(okAsync(true))

      // Act
      await sendNextStepReminderEmail({
        submissionId: 'submissionId',
        emails: mockEmails,
        formTitle: 'Test Form',
        responseUrl: 'http://test.com',
        formId: 'formId',
        reminderStepNumber: 1,
        senderEmail: 'senderEmail@example.com',
      })

      // Assert
      expect(sendMRFWorkflowStepEmailSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          emails: mockEmails,
          isReminder: true,
        }),
      )
    })
  })

  describe('getPendingStepRecipientEmailsFromSubmittedStepsMeta', () => {
    it('gets correct recipient emails for 2nd step of 5-step mrf submission', async () => {
      // Arrange
      const mockEmails = ['test@example.com']
      const mockSubmission = {
        workflow: [{}, {}, {}, {}, {}],
        submittedSteps: [
          {
            nextStepRecipientEmails: mockEmails,
          },
        ],
      } as unknown as IMultirespondentSubmissionSchema

      jest
        .spyOn(MultirespondentSubmissionService, 'getMultirespondentSubmission')
        .mockReturnValue(okAsync(mockSubmission))

      // Act
      const result = await getPendingStepRecipientEmailsFromSubmittedStepsMeta({
        submissionId: 'submissionId',
      })

      // Assert
      expect(result.isOk()).toBe(true)
      expect(result._unsafeUnwrap().recipientEmails).toEqual(mockEmails)
      expect(result._unsafeUnwrap().reminderStepNumber).toBe(2)
    })

    it('gets correct recipient email for 3rd step of 4-step mrf submission', async () => {
      // Arrange
      const mockEmails = ['test@example.com', 'test2@example.com']
      const mockSubmission = {
        workflow: [{}, {}, {}, {}],
        submittedSteps: [
          { nextStepRecipientEmails: ['old@example.com'] },
          {
            nextStepRecipientEmails: mockEmails,
            isApproval: true,
            status: WorkflowStatus.APPROVED,
          },
        ],
      } as unknown as IMultirespondentSubmissionSchema

      jest
        .spyOn(MultirespondentSubmissionService, 'getMultirespondentSubmission')
        .mockReturnValue(okAsync(mockSubmission))

      // Act
      const result = await getPendingStepRecipientEmailsFromSubmittedStepsMeta({
        submissionId: 'submissionId',
      })

      // Assert
      expect(result.isOk()).toBe(true)
      expect(result._unsafeUnwrap().recipientEmails).toEqual(mockEmails)
      expect(result._unsafeUnwrap().reminderStepNumber).toBe(3)
    })

    it('gets correct recipient email for last step of 2-step mrf submission', async () => {
      // Arrange
      const mockEmails = ['test@example.com']
      const mockSubmission = {
        workflow: [{}, {}],
        submittedSteps: [
          {
            nextStepRecipientEmails: mockEmails,
          },
        ],
      } as unknown as IMultirespondentSubmissionSchema

      jest
        .spyOn(MultirespondentSubmissionService, 'getMultirespondentSubmission')
        .mockReturnValue(okAsync(mockSubmission))

      // Act
      const result = await getPendingStepRecipientEmailsFromSubmittedStepsMeta({
        submissionId: 'submissionId',
      })

      // Assert
      expect(result.isOk()).toBe(true)
      expect(result._unsafeUnwrap().recipientEmails).toEqual(mockEmails)
      expect(result._unsafeUnwrap().reminderStepNumber).toBe(2)
    })

    it('gets correct recipient email for last step of 4-step mrf submission', async () => {
      // Arrange
      const mockEmails = ['test@example.com']
      const mockSubmission = {
        workflow: [{}, {}, {}, {}],
        submittedSteps: [
          { nextStepRecipientEmails: ['old1@example.com'] },
          { nextStepRecipientEmails: ['old2@example.com'] },
          { nextStepRecipientEmails: mockEmails },
        ],
      } as unknown as IMultirespondentSubmissionSchema

      jest
        .spyOn(MultirespondentSubmissionService, 'getMultirespondentSubmission')
        .mockReturnValue(okAsync(mockSubmission))

      // Act
      const result = await getPendingStepRecipientEmailsFromSubmittedStepsMeta({
        submissionId: 'submissionId',
      })

      // Assert
      expect(result.isOk()).toBe(true)
      expect(result._unsafeUnwrap().recipientEmails).toEqual(mockEmails)
      expect(result._unsafeUnwrap().reminderStepNumber).toBe(4)
    })

    it('throws pending step not found error for 2nd step where it is rejected ie, completed workflow', async () => {
      // Arrange
      const mockSubmission = {
        workflow: [{}, {}, {}],
        submittedSteps: [
          { nextStepRecipientEmails: ['old1@example.com'] },
          {
            status: WorkflowStatus.REJECTED,
            isApproval: true,
          },
        ],
      } as unknown as IMultirespondentSubmissionSchema

      jest
        .spyOn(MultirespondentSubmissionService, 'getMultirespondentSubmission')
        .mockReturnValue(okAsync(mockSubmission))

      // Act
      const result = await getPendingStepRecipientEmailsFromSubmittedStepsMeta({
        submissionId: 'submissionId',
      })

      // Assert
      expect(result.isErr()).toBe(true)
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        MrfReminderInvalidWorkflowStepError,
      )
    })

    it('throws pending step not found for all steps submitted ie, commpleted workflow', async () => {
      // Arrange
      const mockSubmission = {
        workflow: [{}, {}],
        submittedSteps: [
          { nextStepRecipientEmails: ['old1@example.com'] },
          { nextStepRecipientEmails: ['old2@example.com'] },
        ],
      } as unknown as IMultirespondentSubmissionSchema

      jest
        .spyOn(MultirespondentSubmissionService, 'getMultirespondentSubmission')
        .mockReturnValue(okAsync(mockSubmission))

      // Act
      const result = await getPendingStepRecipientEmailsFromSubmittedStepsMeta({
        submissionId: 'submissionId',
      })

      // Assert
      expect(result.isErr()).toBe(true)
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        MrfReminderInvalidWorkflowStepError,
      )
    })

    it('throws recipient email not found for valid pending step ie 3rd step of 4-step mrf submission but recipient emails is not found in pending step metadata', async () => {
      // Arrange
      const mockSubmission = {
        workflow: [{}, {}, {}, {}],
        submittedSteps: [{ nextStepRecipientEmails: ['old@example.com'] }, {}],
      } as unknown as IMultirespondentSubmissionSchema

      jest
        .spyOn(MultirespondentSubmissionService, 'getMultirespondentSubmission')
        .mockReturnValue(okAsync(mockSubmission))

      // Act
      const result = await getPendingStepRecipientEmailsFromSubmittedStepsMeta({
        submissionId: 'submissionId',
      })

      // Assert
      expect(result.isErr()).toBe(true)
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        MrfReminderRecipientEmailsEmptyError,
      )
    })
  })

  describe('step-token lifecycle', () => {
    const fieldId = new ObjectId().toHexString()
    const stepId0 = new ObjectId().toHexString()
    const stepId1 = new ObjectId().toHexString()

    const twoStepWorkflow: FormWorkflowStepDto[] = [
      {
        _id: stepId0,
        workflow_type: WorkflowType.Static,
        emails: [],
        edit: [fieldId],
      },
      {
        _id: stepId1,
        workflow_type: WorkflowType.Static,
        emails: ['next@example.com'],
        edit: [fieldId],
      },
    ]

    const buildForm = (): IPopulatedMultirespondentForm =>
      ({
        _id: mockFormId,
        authType: FormAuthType.NIL,
        responseMode: FormResponseMode.Multirespondent,
        title: 'Test form',
        form_fields: [
          { _id: fieldId, fieldType: BasicField.ShortText, title: 'Q1' },
        ],
        form_logics: [],
        workflow: twoStepWorkflow,
        isSingleSubmission: false,
        getUniqueMyInfoAttrs: jest.fn().mockReturnValue([]),
      }) as unknown as IPopulatedMultirespondentForm

    const buildSnapshottedFormDef = (): SnapshottedFormDef =>
      ({
        _id: mockFormId,
        title: 'Test form',
        form_fields: [
          { _id: fieldId, fieldType: BasicField.ShortText, title: 'Q1' },
        ],
        form_logics: [],
        workflow: twoStepWorkflow,
      }) as unknown as SnapshottedFormDef

    const buildPayload = (
      overrides: Partial<MultirespondentSubmissionDto> = {},
    ): MultirespondentSubmissionDto => ({
      submissionPublicKey: 'submission-public-key',
      encryptedSubmissionSecretKey: 'encrypted-submission-secret-key',
      encryptedContent: 'encrypted-content',
      submissionSecretKey: 'submission-secret-key',
      version: 2,
      workflowStep: 0,
      responses: {
        [fieldId]: { fieldType: BasicField.ShortText, answer: 'answer' },
      },
      mrfVersion: 1,
      ...overrides,
    })

    it('persists stepTokenHash and encryptedStepToken on create', async () => {
      const raw = stepToken.generate()
      const result = await createMultiRespondentFormSubmission({
        form: buildForm(),
        encryptedPayload: buildPayload({
          stepToken: raw,
          stepTokenHash: stepToken.hash(raw),
          encryptedStepToken: 'wrapped-token-A',
        }),
        logMeta: { action: 'test' },
      })

      expect(result.isOk()).toBe(true)
      const saved = await getMultirespondentSubmissionModel(mongoose).findById(
        result._unsafeUnwrap()._id,
      )
      expect(saved?.stepTokenHash).toBe(stepToken.hash(raw))
      expect(saved?.encryptedStepToken).toBe('wrapped-token-A')
    })

    it('clears token fields on update when the next step does not generate one', async () => {
      const Model = getMultirespondentSubmissionModel(mongoose)
      // Row already carries the previous step's token (minted under flag ON).
      const prevRaw = stepToken.generate()
      const row = await Model.create({
        form: mockFormId,
        submissionType: SubmissionType.Multirespondent,
        form_fields: [],
        form_logics: [],
        workflow: twoStepWorkflow,
        submissionPublicKey: 'pk',
        encryptedSubmissionSecretKey: 'esk',
        encryptedContent: 'ec',
        version: 2,
        workflowStep: 0,
        submittedSteps: [
          { isApproval: false, submittedAt: new Date().toISOString() },
        ],
        stepTokenHash: stepToken.hash(prevRaw),
        encryptedStepToken: 'wrapped-token-prev',
      })
      expect(row.stepTokenHash).toBe(stepToken.hash(prevRaw))
      expect(row.encryptedStepToken).toBe('wrapped-token-prev')

      // Flag OFF advance: middleware omits both token fields from the payload.
      const result = await updateMultiRespondentFormSubmission({
        submissionId: row._id.toString(),
        snapshottedFormDef: buildSnapshottedFormDef(),
        encryptedPayload: buildPayload({ workflowStep: 1 }),
        logMeta: { action: 'test' },
      })

      expect(result.isOk()).toBe(true)
      const saved = await Model.findById(row._id).lean()
      expect(saved?.stepTokenHash).toBeUndefined()
      expect(saved?.encryptedStepToken).toBeUndefined()
      expect('stepTokenHash' in (saved as object)).toBe(false)
      expect('encryptedStepToken' in (saved as object)).toBe(false)
    })

    it('rotates the token on advance, upgrading a legacy row that carried no hash (migration)', async () => {
      const Model = getMultirespondentSubmissionModel(mongoose)
      // Legacy in-flight row: no stepTokenHash / encryptedStepToken.
      const legacy = await Model.create({
        form: mockFormId,
        submissionType: SubmissionType.Multirespondent,
        form_fields: [],
        form_logics: [],
        workflow: twoStepWorkflow,
        submissionPublicKey: 'pk',
        encryptedSubmissionSecretKey: 'esk',
        encryptedContent: 'ec',
        version: 2,
        workflowStep: 0,
        submittedSteps: [
          { isApproval: false, submittedAt: new Date().toISOString() },
        ],
      })
      expect(legacy.stepTokenHash).toBeUndefined()

      const nextRaw = stepToken.generate()
      const result = await updateMultiRespondentFormSubmission({
        submissionId: legacy._id.toString(),
        snapshottedFormDef: buildSnapshottedFormDef(),
        encryptedPayload: buildPayload({
          workflowStep: 1,
          stepToken: nextRaw,
          stepTokenHash: stepToken.hash(nextRaw),
          encryptedStepToken: 'wrapped-token-B',
        }),
        logMeta: { action: 'test' },
      })

      expect(result.isOk()).toBe(true)
      const saved = await Model.findById(legacy._id)
      expect(saved?.stepTokenHash).toBe(stepToken.hash(nextRaw))
      expect(saved?.encryptedStepToken).toBe('wrapped-token-B')
      // The freshly minted token verifies against the rotated hash (loop-back:
      // a stale/previous token would not).
      expect(stepToken.verify(nextRaw, saved?.stepTokenHash as string)).toBe(
        true,
      )
      expect(
        stepToken.verify(stepToken.generate(), saved?.stepTokenHash as string),
      ).toBe(false)
    })

    it('rotates both token fields on a flag-on advance from a row that already carried a token (D1)', async () => {
      const Model = getMultirespondentSubmissionModel(mongoose)
      const prevRaw = stepToken.generate()
      const row = await Model.create({
        form: mockFormId,
        submissionType: SubmissionType.Multirespondent,
        form_fields: [],
        form_logics: [],
        workflow: twoStepWorkflow,
        submissionPublicKey: 'pk',
        encryptedSubmissionSecretKey: 'esk',
        encryptedContent: 'ec',
        version: 2,
        workflowStep: 0,
        submittedSteps: [
          { isApproval: false, submittedAt: new Date().toISOString() },
        ],
        stepTokenHash: stepToken.hash(prevRaw),
        encryptedStepToken: 'wrapped-token-prev',
      })

      const nextRaw = stepToken.generate()
      const result = await updateMultiRespondentFormSubmission({
        submissionId: row._id.toString(),
        snapshottedFormDef: buildSnapshottedFormDef(),
        encryptedPayload: buildPayload({
          workflowStep: 1,
          stepToken: nextRaw,
          stepTokenHash: stepToken.hash(nextRaw),
          encryptedStepToken: 'wrapped-token-next',
        }),
        logMeta: { action: 'test' },
      })

      expect(result.isOk()).toBe(true)
      const saved = await Model.findById(row._id)
      expect(saved?.stepTokenHash).toBe(stepToken.hash(nextRaw))
      expect(saved?.encryptedStepToken).toBe('wrapped-token-next')
      // New token verifies; the previous step's token must not.
      expect(stepToken.verify(nextRaw, saved?.stepTokenHash as string)).toBe(
        true,
      )
      expect(stepToken.verify(prevRaw, saved?.stepTokenHash as string)).toBe(
        false,
      )
    })

    it('leaves a legacy no-hash row absent after a flag-off advance (no stale key introduced) (D1)', async () => {
      const Model = getMultirespondentSubmissionModel(mongoose)
      // Legacy in-flight row: no token fields at all.
      const legacy = await Model.create({
        form: mockFormId,
        submissionType: SubmissionType.Multirespondent,
        form_fields: [],
        form_logics: [],
        workflow: twoStepWorkflow,
        submissionPublicKey: 'pk',
        encryptedSubmissionSecretKey: 'esk',
        encryptedContent: 'ec',
        version: 2,
        workflowStep: 0,
        submittedSteps: [
          { isApproval: false, submittedAt: new Date().toISOString() },
        ],
      })

      const result = await updateMultiRespondentFormSubmission({
        submissionId: legacy._id.toString(),
        snapshottedFormDef: buildSnapshottedFormDef(),
        encryptedPayload: buildPayload({ workflowStep: 1 }),
        logMeta: { action: 'test' },
      })

      expect(result.isOk()).toBe(true)
      const saved = await Model.findById(legacy._id).lean()
      expect(saved?.stepTokenHash).toBeUndefined()
      expect(saved?.encryptedStepToken).toBeUndefined()
      expect('stepTokenHash' in (saved as object)).toBe(false)
      expect('encryptedStepToken' in (saved as object)).toBe(false)
    })

    it('surfaces a lost concurrent-write race as a 409 conflict, not a 500', async () => {
      const Model = getMultirespondentSubmissionModel(mongoose)
      const doc = await Model.create({
        form: mockFormId,
        submissionType: SubmissionType.Multirespondent,
        form_fields: [],
        form_logics: [],
        workflow: twoStepWorkflow,
        submissionPublicKey: 'pk',
        encryptedSubmissionSecretKey: 'esk',
        encryptedContent: 'ec',
        version: 2,
        workflowStep: 0,
        submittedSteps: [
          { isApproval: false, submittedAt: new Date().toISOString() },
        ],
      })

      // Simulate the optimistic-concurrency loser: the save rejects with a
      // Mongoose VersionError (__v mismatch on the submittedSteps array).
      const versionError = new mongoose.Error.VersionError(
        doc as any,
        (doc as any).__v,
        ['submittedSteps'],
      )
      const saveSpy = jest
        .spyOn(Model.prototype, 'save')
        .mockRejectedValueOnce(versionError)

      const result = await updateMultiRespondentFormSubmission({
        submissionId: doc._id.toString(),
        snapshottedFormDef: buildSnapshottedFormDef(),
        encryptedPayload: buildPayload({ workflowStep: 1 }),
        logMeta: { action: 'test' },
      })

      expect(result.isErr()).toBe(true)
      const error = result._unsafeUnwrapErr()
      expect(error).toBeInstanceOf(DatabaseConflictError)
      // Non-retryable 409, not a 5xx default.
      expect(mapRouteError(error).statusCode).toBe(409)

      saveSpy.mockRestore()
    })

    it('threads the raw step token into the next respondent magic link on create', async () => {
      const raw = stepToken.generate()
      const sendSpy = jest
        .spyOn(MailService, 'sendMRFWorkflowStepEmail')
        .mockReturnValue(okAsync(true))

      await performMultiRespondentPostSubmissionCreateActions({
        submission: {
          id: mockSubmissionId,
          submittedSteps: [
            { isApproval: false, submittedAt: new Date().toISOString() },
          ],
        } as unknown as IMultirespondentSubmissionSchema,
        submissionId: mockSubmissionId,
        form: buildForm(),
        encryptedPayload: buildPayload({ stepToken: raw }),
        logMeta: { action: 'test' } as any,
      })

      expect(sendSpy).toHaveBeenCalled()
      expect(sendSpy.mock.calls[0][0].responseUrl).toContain(
        `&token=${encodeURIComponent(raw)}`,
      )
    })
  })

  describe('S4 MRF v4 webhook snapshot integration', () => {
    const PLUMBER_URL = 'https://plumber.gov.sg/webhooks/x'
    const GENERIC_URL = 'https://example.com/hook'
    const fieldId = new ObjectId().toHexString()
    const stepId0 = new ObjectId().toHexString()
    const stepId1 = new ObjectId().toHexString()

    const twoStepWorkflow: FormWorkflowStepDto[] = [
      {
        _id: stepId0,
        workflow_type: WorkflowType.Static,
        emails: [],
        edit: [fieldId],
      },
      {
        _id: stepId1,
        workflow_type: WorkflowType.Static,
        emails: ['next@example.com'],
        edit: [fieldId],
      },
    ]

    const flushPromises = () => new Promise((resolve) => setImmediate(resolve))

    const growthbookWith = (enableMrfWebhooks: boolean) =>
      ({
        isOn: jest.fn().mockReturnValue(enableMrfWebhooks),
        getFeatureValue: jest.fn((_flag: string, def: unknown) => def),
      }) as any

    const buildV4Form = (
      overrides: Partial<IPopulatedMultirespondentForm> = {},
    ): IPopulatedMultirespondentForm =>
      ({
        _id: mockFormId,
        authType: FormAuthType.NIL,
        responseMode: FormResponseMode.Multirespondent,
        title: 'Test form',
        form_fields: [
          { _id: fieldId, fieldType: BasicField.ShortText, title: 'Q1' },
        ],
        form_logics: [],
        workflow: twoStepWorkflow,
        isSingleSubmission: false,
        webhook: { url: PLUMBER_URL, isRetryEnabled: true },
        getUniqueMyInfoAttrs: jest.fn().mockReturnValue([]),
        ...overrides,
      }) as unknown as IPopulatedMultirespondentForm

    const buildSnapshottedFormDef = (
      overrides: Partial<SnapshottedFormDef> = {},
    ): SnapshottedFormDef =>
      ({
        _id: mockFormId,
        title: 'Test form',
        form_fields: [
          { _id: fieldId, fieldType: BasicField.ShortText, title: 'Q1' },
        ],
        form_logics: [],
        workflow: twoStepWorkflow,
        webhook: { url: PLUMBER_URL, isRetryEnabled: true },
        ...overrides,
      }) as unknown as SnapshottedFormDef

    const buildV4Payload = (
      overrides: Partial<MultirespondentSubmissionDto> = {},
    ): MultirespondentSubmissionDto => ({
      submissionPublicKey: 'submission-public-key',
      encryptedSubmissionSecretKey: 'wrapped-read-key-v4',
      encryptedContent: 'v4-encrypted-content',
      verifiedContent: 'v4-verified-content',
      submissionSecretKey: 'submission-secret-key',
      version: 2,
      workflowStep: 0,
      responses: {
        [fieldId]: {
          fieldType: BasicField.ShortText,
          answer: { value: 'answer' },
          question: 'Q1',
          provenance: {},
        },
      },
      mrfVersion: 2,
      ...overrides,
    })

    const buildSnapshot = (overrides: Record<string, unknown> = {}) =>
      ({
        _v: 1,
        contentFormat: 'v4',
        formId: mockFormId,
        submissionId: 'snap-submission-id',
        submissionIndex: 0,
        workflowStep: 0,
        encryptedContent: 'frozen-content',
        encryptedSubmissionSecretKey: 'frozen-read-key',
        verifiedContent: 'frozen-verified',
        createdAt: new Date().toISOString(),
        ...overrides,
      }) as any

    const buildLiveWebhookView = (): WebhookView =>
      ({
        data: {
          formId: mockFormId,
          submissionId: 'live-submission-id',
          encryptedContent: 'live-content',
          encryptedSubmissionSecretKey: 'live-read-key',
          verifiedContent: 'live-verified',
          version: 2,
          created: new Date(),
          attachmentDownloadUrls: {},
          paymentContent: {},
          workflowContent: {
            workflow: twoStepWorkflow,
            workflowStep: 0,
            submittedSteps: [
              { isApproval: false, submittedAt: new Date().toISOString() },
            ],
          },
        },
      }) as unknown as WebhookView

    const buildSubmissionWithToken = (
      token: string | undefined,
      view: WebhookView = buildLiveWebhookView(),
    ): IMultirespondentSubmissionSchema =>
      ({
        _id: new ObjectId(),
        submittedSteps: [
          {
            isApproval: false,
            submittedAt: new Date().toISOString(),
            snapshotToken: token,
          },
        ],
        getWebhookView: jest.fn().mockResolvedValue(view),
      }) as unknown as IMultirespondentSubmissionSchema

    beforeEach(() => {
      MockSnapshotStore.writeV4Snapshot.mockReturnValue(
        okAsync({ token: 'default-token', key: 'default-key' }),
      )
      MockSnapshotStore.readV4Snapshot.mockReturnValue(okAsync(buildSnapshot()))
      jest
        .spyOn(webhookStatsdClient, 'increment')
        .mockImplementation(() => undefined as any)
      jest
        .spyOn(WebhookFactory, 'sendInitialWebhook')
        .mockReturnValue(okAsync(true))
    })

    // ---- Committed-step-has-a-readable-snapshot (write side) ----

    it('writes a v4 snapshot matching the committed step and records the token on create', async () => {
      MockSnapshotStore.writeV4Snapshot.mockReturnValue(
        okAsync({ token: 'tok-create', key: 'key-create' }),
      )

      const result = await createMultiRespondentFormSubmission({
        form: buildV4Form(),
        encryptedPayload: buildV4Payload(),
        logMeta: { action: 'test' },
      })

      expect(result.isOk()).toBe(true)
      expect(MockSnapshotStore.writeV4Snapshot).toHaveBeenCalledTimes(1)
      const snapshot = MockSnapshotStore.writeV4Snapshot.mock.calls[0][0]
      expect(snapshot.submissionIndex).toBe(0)
      expect(snapshot.workflowStep).toBe(0)
      expect(snapshot.encryptedContent).toBe('v4-encrypted-content')
      expect(snapshot.encryptedSubmissionSecretKey).toBe('wrapped-read-key-v4')

      const saved = await getMultirespondentSubmissionModel(mongoose).findById(
        result._unsafeUnwrap()._id,
      )
      expect(saved?.submittedSteps?.[0]?.snapshotToken).toBe('tok-create')
    })

    it('writes a v4 snapshot for the appended step and records the token on update', async () => {
      const Model = getMultirespondentSubmissionModel(mongoose)
      const row = await Model.create({
        form: mockFormId,
        submissionType: SubmissionType.Multirespondent,
        form_fields: [],
        form_logics: [],
        workflow: twoStepWorkflow,
        submissionPublicKey: 'pk',
        encryptedSubmissionSecretKey: 'esk',
        encryptedContent: 'ec',
        version: 2,
        workflowStep: 0,
        submittedSteps: [
          { isApproval: false, submittedAt: new Date().toISOString() },
        ],
      })
      MockSnapshotStore.writeV4Snapshot.mockReturnValue(
        okAsync({ token: 'tok-update', key: 'key-update' }),
      )

      const result = await updateMultiRespondentFormSubmission({
        submissionId: row._id.toString(),
        snapshottedFormDef: buildSnapshottedFormDef(),
        encryptedPayload: buildV4Payload({ workflowStep: 1 }),
        logMeta: { action: 'test' },
      })

      expect(result.isOk()).toBe(true)
      expect(MockSnapshotStore.writeV4Snapshot).toHaveBeenCalledTimes(1)
      const snapshot = MockSnapshotStore.writeV4Snapshot.mock.calls[0][0]
      expect(snapshot.submissionIndex).toBe(1)
      expect(snapshot.workflowStep).toBe(1)
      expect(snapshot.encryptedContent).toBe('v4-encrypted-content')

      const saved = await Model.findById(row._id)
      expect(saved?.submittedSteps?.[1]?.snapshotToken).toBe('tok-update')
    })

    it('does not write a snapshot when the write-condition is false (mrfVersion 1)', async () => {
      const result = await createMultiRespondentFormSubmission({
        form: buildV4Form(),
        encryptedPayload: buildV4Payload({ mrfVersion: 1 }),
        logMeta: { action: 'test' },
      })

      expect(result.isOk()).toBe(true)
      expect(MockSnapshotStore.writeV4Snapshot).not.toHaveBeenCalled()
    })

    it('does not write a snapshot when retries are disabled', async () => {
      const result = await createMultiRespondentFormSubmission({
        form: buildV4Form({
          webhook: { url: PLUMBER_URL, isRetryEnabled: false } as any,
        }),
        encryptedPayload: buildV4Payload(),
        logMeta: { action: 'test' },
      })

      expect(result.isOk()).toBe(true)
      expect(MockSnapshotStore.writeV4Snapshot).not.toHaveBeenCalled()
    })

    it('aborts the save (fail-loud) when the snapshot write fails', async () => {
      MockSnapshotStore.writeV4Snapshot.mockReturnValue(
        errAsync(new SnapshotWriteError()),
      )
      const saveSpy = jest.spyOn(
        getMultirespondentSubmissionModel(mongoose).prototype,
        'save',
      )

      const result = await createMultiRespondentFormSubmission({
        form: buildV4Form(),
        encryptedPayload: buildV4Payload(),
        logMeta: { action: 'test' },
      })

      expect(result.isErr()).toBe(true)
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(SnapshotWriteError)
      expect(saveSpy).not.toHaveBeenCalled()
      saveSpy.mockRestore()
    })

    // ---- Send gate table ----

    it.each`
      label                | url            | flagOn   | expectSent
      ${'plumber+flagOff'} | ${PLUMBER_URL} | ${false} | ${true}
      ${'plumber+flagOn'}  | ${PLUMBER_URL} | ${true}  | ${true}
      ${'generic+flagOff'} | ${GENERIC_URL} | ${false} | ${false}
      ${'generic+flagOn'}  | ${GENERIC_URL} | ${true}  | ${true}
    `(
      'send gate: $label -> sent=$expectSent',
      async ({ url, flagOn, expectSent }) => {
        const sendSpy = jest.mocked(WebhookFactory.sendInitialWebhook)
        // No recorded token -> legacy path for both consumer types.
        const submission = buildSubmissionWithToken(undefined)

        await performMultiRespondentPostSubmissionCreateActions({
          submission,
          submissionId: submission._id.toString(),
          form: buildV4Form({ webhook: { url, isRetryEnabled: true } as any }),
          encryptedPayload: buildV4Payload(),
          logMeta: {} as any,
          growthbook: growthbookWith(flagOn),
        })
        await flushPromises()

        expect(sendSpy).toHaveBeenCalledTimes(expectSent ? 1 : 0)
      },
    )

    // ---- Reconstruction wired ----

    it('passes a reconstructed pre-built view for a plumber v4 send', async () => {
      const sendSpy = jest.mocked(WebhookFactory.sendInitialWebhook)
      MockSnapshotStore.readV4Snapshot.mockReturnValue(
        okAsync(
          buildSnapshot({ encryptedSubmissionSecretKey: 'frozen-read-key' }),
        ),
      )
      const submission = buildSubmissionWithToken('tok-A')

      await performMultiRespondentPostSubmissionCreateActions({
        submission,
        submissionId: submission._id.toString(),
        form: buildV4Form(),
        encryptedPayload: buildV4Payload(),
        logMeta: {} as any,
        growthbook: growthbookWith(true),
      })
      await flushPromises()

      expect(sendSpy).toHaveBeenCalledTimes(1)
      const view = sendSpy.mock.calls[0][3]
      expect(view).toBeDefined()
      expect(view?.data.version).toBe(3)
      expect(view?.data.encryptedSubmissionSecretKey).toBe('frozen-read-key')
      // frozen content wins over the live row.
      expect(view?.data.encryptedContent).toBe('frozen-content')
    })

    it('takes the legacy path (no 4th arg) for a plumber send without a recorded token', async () => {
      const sendSpy = jest.mocked(WebhookFactory.sendInitialWebhook)
      const submission = buildSubmissionWithToken(undefined)

      await performMultiRespondentPostSubmissionCreateActions({
        submission,
        submissionId: submission._id.toString(),
        form: buildV4Form(),
        encryptedPayload: buildV4Payload(),
        logMeta: {} as any,
        growthbook: growthbookWith(false),
      })
      await flushPromises()

      expect(sendSpy).toHaveBeenCalledTimes(1)
      expect(sendSpy.mock.calls[0][3]).toBeUndefined()
      expect(MockSnapshotStore.readV4Snapshot).not.toHaveBeenCalled()
    })

    // ---- Fail-loud on data-integrity ----

    it('fails loud and does not send when the snapshot read errs with a data-integrity error', async () => {
      const sendSpy = jest.mocked(WebhookFactory.sendInitialWebhook)
      const incrSpy = jest.mocked(webhookStatsdClient.increment)
      MockSnapshotStore.readV4Snapshot.mockReturnValue(
        errAsync(new SnapshotDataIntegrityError('missing')),
      )
      const submission = buildSubmissionWithToken('tok-A')

      await performMultiRespondentPostSubmissionUpdateActions({
        submission,
        submissionId: submission._id.toString(),
        snapshottedFormDef: buildSnapshottedFormDef(),
        currentStepNumber: 0,
        encryptedPayload: buildV4Payload(),
        logMeta: {} as any,
        growthbook: growthbookWith(true),
      })
      await flushPromises()

      expect(sendSpy).not.toHaveBeenCalled()
      expect(incrSpy).toHaveBeenCalledWith('mrf.snapshot.data_integrity_error')
    })

    // ---- No outbound size guard: large payloads still go on the wire ----

    it('sends a reconstructed view regardless of its size', async () => {
      const sendSpy = jest.mocked(WebhookFactory.sendInitialWebhook)
      const hugeContent = 'x'.repeat(1_000_001)
      MockSnapshotStore.readV4Snapshot.mockReturnValue(
        okAsync(buildSnapshot({ encryptedContent: hugeContent })),
      )
      const submission = buildSubmissionWithToken('tok-A')

      await performMultiRespondentPostSubmissionCreateActions({
        submission,
        submissionId: submission._id.toString(),
        form: buildV4Form(),
        encryptedPayload: buildV4Payload(),
        logMeta: {} as any,
        growthbook: growthbookWith(true),
      })
      await flushPromises()

      expect(sendSpy).toHaveBeenCalledTimes(1)
      expect(sendSpy.mock.calls[0][3]?.data.encryptedContent).toBe(hugeContent)
    })

    // ---- Case A winner / 409 ----

    it('records the winner token which reconstruction then reads (Case A / 409 winner)', async () => {
      const Model = getMultirespondentSubmissionModel(mongoose)
      const row = await Model.create({
        form: mockFormId,
        submissionType: SubmissionType.Multirespondent,
        form_fields: [],
        form_logics: [],
        workflow: twoStepWorkflow,
        submissionPublicKey: 'pk',
        encryptedSubmissionSecretKey: 'esk',
        encryptedContent: 'ec',
        version: 2,
        workflowStep: 0,
        submittedSteps: [
          { isApproval: false, submittedAt: new Date().toISOString() },
        ],
      })
      MockSnapshotStore.writeV4Snapshot.mockReturnValue(
        okAsync({ token: 'winner-token', key: 'winner-key' }),
      )

      const result = await updateMultiRespondentFormSubmission({
        submissionId: row._id.toString(),
        snapshottedFormDef: buildSnapshottedFormDef(),
        encryptedPayload: buildV4Payload({ workflowStep: 1 }),
        logMeta: { action: 'test' },
      })
      expect(result.isOk()).toBe(true)
      const winner = result._unsafeUnwrap()
      expect(winner.submittedSteps?.[1]?.snapshotToken).toBe('winner-token')

      // The send path reads exactly the winner's recorded token.
      const sendSpy = jest.mocked(WebhookFactory.sendInitialWebhook)
      await performMultiRespondentPostSubmissionUpdateActions({
        submission: winner,
        submissionId: winner._id.toString(),
        snapshottedFormDef: buildSnapshottedFormDef(),
        currentStepNumber: 1,
        encryptedPayload: buildV4Payload({ workflowStep: 1 }),
        logMeta: {} as any,
        growthbook: growthbookWith(true),
      })
      await flushPromises()

      expect(MockSnapshotStore.readV4Snapshot).toHaveBeenCalledWith(
        expect.objectContaining({ submissionIndex: 1, token: 'winner-token' }),
      )
      expect(sendSpy).toHaveBeenCalledTimes(1)
      expect(sendSpy.mock.calls[0][3]).toBeDefined()
    })

    it('surfaces a lost concurrent-write race as a 409 even after a successful snapshot write', async () => {
      const Model = getMultirespondentSubmissionModel(mongoose)
      const doc = await Model.create({
        form: mockFormId,
        submissionType: SubmissionType.Multirespondent,
        form_fields: [],
        form_logics: [],
        workflow: twoStepWorkflow,
        submissionPublicKey: 'pk',
        encryptedSubmissionSecretKey: 'esk',
        encryptedContent: 'ec',
        version: 2,
        workflowStep: 0,
        submittedSteps: [
          { isApproval: false, submittedAt: new Date().toISOString() },
        ],
      })
      const versionError = new mongoose.Error.VersionError(
        doc as any,
        (doc as any).__v,
        ['submittedSteps'],
      )
      const saveSpy = jest
        .spyOn(Model.prototype, 'save')
        .mockRejectedValueOnce(versionError)

      const result = await updateMultiRespondentFormSubmission({
        submissionId: doc._id.toString(),
        snapshottedFormDef: buildSnapshottedFormDef(),
        encryptedPayload: buildV4Payload({ workflowStep: 1 }),
        logMeta: { action: 'test' },
      })

      expect(MockSnapshotStore.writeV4Snapshot).toHaveBeenCalledTimes(1)
      expect(result.isErr()).toBe(true)
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(DatabaseConflictError)
      expect(mapRouteError(result._unsafeUnwrapErr()).statusCode).toBe(409)
      saveSpy.mockRestore()
    })

    // ---- Case B/C benign orphan ----

    it('leaves the snapshot as a benign orphan (no delete) when the save fails after a successful write, and a resubmit writes a NEW token', async () => {
      const Model = getMultirespondentSubmissionModel(mongoose)
      const row = await Model.create({
        form: mockFormId,
        submissionType: SubmissionType.Multirespondent,
        form_fields: [],
        form_logics: [],
        workflow: twoStepWorkflow,
        submissionPublicKey: 'pk',
        encryptedSubmissionSecretKey: 'esk',
        encryptedContent: 'ec',
        version: 2,
        workflowStep: 0,
        submittedSteps: [
          { isApproval: false, submittedAt: new Date().toISOString() },
        ],
      })
      MockSnapshotStore.writeV4Snapshot.mockReturnValueOnce(
        okAsync({ token: 'orphan-token-1', key: 'orphan-key-1' }),
      )
      const saveSpy = jest
        .spyOn(Model.prototype, 'save')
        .mockRejectedValueOnce(new Error('transient write failure'))

      const failed = await updateMultiRespondentFormSubmission({
        submissionId: row._id.toString(),
        snapshottedFormDef: buildSnapshottedFormDef(),
        encryptedPayload: buildV4Payload({ workflowStep: 1 }),
        logMeta: { action: 'test' },
      })

      expect(failed.isErr()).toBe(true)
      // The store exposes no delete/wipe primitive at all — an orphan is never
      // reclaimed inline.
      expect(
        (SnapshotStore as Record<string, unknown>).deleteV4Snapshot,
      ).toBeUndefined()
      expect(
        (SnapshotStore as Record<string, unknown>).removeV4Snapshot,
      ).toBeUndefined()

      saveSpy.mockRestore()

      // Resubmit: a fresh write mints a NEW token, recorded on the row.
      MockSnapshotStore.writeV4Snapshot.mockReturnValueOnce(
        okAsync({ token: 'orphan-token-2', key: 'orphan-key-2' }),
      )
      const resubmit = await updateMultiRespondentFormSubmission({
        submissionId: row._id.toString(),
        snapshottedFormDef: buildSnapshottedFormDef(),
        encryptedPayload: buildV4Payload({ workflowStep: 1 }),
        logMeta: { action: 'test' },
      })

      expect(resubmit.isOk()).toBe(true)
      const saved = await Model.findById(row._id)
      expect(saved?.submittedSteps?.[1]?.snapshotToken).toBe('orphan-token-2')
    })

    // ---- Regression / byte-identity ----

    it('legacy plumber create (flag off, mrfVersion 1) sends via getWebhookView with no 4th arg and no snapshot', async () => {
      const sendSpy = jest.mocked(WebhookFactory.sendInitialWebhook)
      const submission = buildSubmissionWithToken(undefined)

      await performMultiRespondentPostSubmissionCreateActions({
        submission,
        submissionId: submission._id.toString(),
        form: buildV4Form(),
        encryptedPayload: buildV4Payload({ mrfVersion: 1 }),
        logMeta: {} as any,
        growthbook: growthbookWith(false),
      })
      await flushPromises()

      expect(sendSpy).toHaveBeenCalledTimes(1)
      expect(sendSpy.mock.calls[0][3]).toBeUndefined()
      expect(MockSnapshotStore.readV4Snapshot).not.toHaveBeenCalled()
    })

    // ---- Steering: S3-first ordering at the seam ----
    // @steering-gate: delete after S4 verified & merged
    describe('[STEERING:S4] S3-first ordering at the seam', () => {
      it('invokes writeV4Snapshot -> submission.save -> sendInitialWebhook in that order', async () => {
        const Model = getMultirespondentSubmissionModel(mongoose)
        const saveSpy = jest.spyOn(Model.prototype, 'save')
        const sendSpy = jest.mocked(WebhookFactory.sendInitialWebhook)
        MockSnapshotStore.writeV4Snapshot.mockReturnValue(
          okAsync({ token: 'order-token', key: 'order-key' }),
        )
        MockSnapshotStore.readV4Snapshot.mockReturnValue(
          okAsync(buildSnapshot()),
        )

        const created = await createMultiRespondentFormSubmission({
          form: buildV4Form(),
          encryptedPayload: buildV4Payload(),
          logMeta: { action: 'test' },
        })
        expect(created.isOk()).toBe(true)
        const submission = created._unsafeUnwrap()

        await performMultiRespondentPostSubmissionCreateActions({
          submission,
          submissionId: submission._id.toString(),
          form: buildV4Form(),
          encryptedPayload: buildV4Payload(),
          logMeta: {} as any,
          growthbook: growthbookWith(true),
        })
        await flushPromises()

        const writeOrder =
          MockSnapshotStore.writeV4Snapshot.mock.invocationCallOrder[0]
        const saveOrder = saveSpy.mock.invocationCallOrder[0]
        const sendOrder = sendSpy.mock.invocationCallOrder[0]

        expect(writeOrder).toBeLessThan(saveOrder)
        expect(saveOrder).toBeLessThan(sendOrder)

        saveSpy.mockRestore()
      })
    })
  })
})
