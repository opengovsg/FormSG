import dbHandler from '__tests__/unit/backend/helpers/jest-db'
import { ObjectId } from 'bson'
import { okAsync } from 'neverthrow'
import {
  BasicField,
  FieldResponsesV3,
  FormFieldDto,
  FormWorkflowStepDto,
  WorkflowStatus,
  WorkflowType,
} from 'shared/types'

import MailService from 'src/app/services/mail/mail.service'
import * as MailUtils from 'src/app/services/mail/mail.utils'
import {
  IMultirespondentSubmissionSchema,
  IPopulatedMultirespondentForm,
} from 'src/types'
import { MultirespondentSubmissionDto, SnapshottedFormDef } from 'src/types/api'

import {
  MrfReminderInvalidWorkflowStepError,
  MrfReminderRecipientEmailsEmptyError,
} from '../../submission.errors'
import * as MultirespondentSubmissionService from '../multirespondent-submission.service'
import {
  getPendingStepRecipientEmailsFromSubmittedStepsMeta,
  performMultiRespondentPostSubmissionCreateActions,
  performMultiRespondentPostSubmissionUpdateActions,
  sendNextStepReminderEmail,
} from '../multirespondent-submission.service'

jest.mock('src/app/modules/datadog/datadog.utils')
jest.mock('src/app/services/mail/mail.utils')

const MockMailUtils = jest.mocked(MailUtils)
MockMailUtils.generateAutoreplyPdf.mockReturnValue(
  okAsync(Buffer.from('mock pdf buffer')),
)

describe('multirespondent-submission.service', () => {
  beforeAll(async () => {
    await dbHandler.connect()
  })

  afterEach(async () => {
    jest.clearAllMocks()
    await dbHandler.clearDatabase()
  })

  afterAll(async () => {
    await dbHandler.closeDatabase()
  })

  const mockFormId = new ObjectId().toHexString()
  const mockSubmissionId = new ObjectId().toHexString()

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
          answer: 'Yes',
        },
        [yesNoFieldId2]: {
          fieldType: BasicField.YesNo,
          answer: 'No',
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
          _id: mockSubmissionId,
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
          answer: 'Yes',
        },
        [yesNoFieldId2]: {
          fieldType: BasicField.YesNo,
          answer: 'No',
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
          _id: mockSubmissionId,
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
          workflowStep: currentWorkflowStep,
        } as MultirespondentSubmissionDto,
        logMeta: {} as any,
      })
      // Assert
      // approval email is sent instead of completion email
      expect(sendMrfApprovalEmailSpy).toHaveBeenCalledTimes(1)
      expect(sendMrfWorkflowCompletionEmailSpy).not.toHaveBeenCalled()
      expect(sendMRFWorkflowStepEmailSpy).not.toHaveBeenCalled()
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
          answer: 'Yes',
        },
        [yesNoFieldId2]: {
          fieldType: BasicField.YesNo,
          answer: 'No',
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
          _id: mockSubmissionId,
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
          answer: 'Yes',
        },
        [yesNoFieldId2]: {
          fieldType: BasicField.YesNo,
          answer: 'Yes',
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
          _id: mockSubmissionId,
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
          answer: 'No',
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
          _id: mockSubmissionId,
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
          answer: 'No',
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
          _id: mockSubmissionId,
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
          answer: 'Yes',
        },
        [yesNoFieldId2]: {
          fieldType: BasicField.YesNo,
          answer: 'No',
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
          _id: mockSubmissionId,
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
    it('sends completion email when single step mrf is completed', async () => {
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
          _id: mockSubmissionId,
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
        logMeta: {} as any,
      })

      // Assert
      expect(sendMrfWorkflowCompletionEmailSpy).toHaveBeenCalledTimes(1)
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
          _id: mockSubmissionId,
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
          _id: mockSubmissionId,
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
    const mockSubmissionId = new ObjectId().toHexString()

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
          _id: mockSubmissionId,
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
          _id: mockSubmissionId,
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
      })

      // Assert
      expect(sendMrfWorkflowCompletionEmailSpy).toHaveBeenCalledTimes(1)
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
          _id: mockSubmissionId,
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
          _id: mockSubmissionId,
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
})
