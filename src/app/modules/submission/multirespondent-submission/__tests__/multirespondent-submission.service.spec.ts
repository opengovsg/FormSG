import dbHandler from '__tests__/unit/backend/helpers/jest-db'
import { ObjectId } from 'bson'
import {
  BasicField,
  FieldResponsesV3,
  FormWorkflowStepDto,
  WorkflowType,
} from 'shared/types'

import MailService from 'src/app/services/mail/mail.service'
import { IPopulatedMultirespondentForm } from 'src/types'
import { MultirespondentSubmissionDto } from 'src/types/api'

import {
  performMultiRespondentPostSubmissionCreateActions,
  performMultiRespondentPostSubmissionUpdateActions,
} from '../multirespondent-submission.service'

jest.mock('src/app/modules/datadog/datadog.utils')

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
          workflow_type: WorkflowType.Dynamic,
          field: emailFieldId1,
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
        submissionId: mockSubmissionId,
        form: {
          _id: mockFormId,
          workflow: threeStepApprovalWorkflow,
          emails: [expectedEmails[1]],
          stepsToNotify: [stepOneId],
        } as IPopulatedMultirespondentForm,
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
      expect(sendMRFWorkflowStepEmailSpy.mock.calls[0][0].emails).toEqual(
        expectedEmails,
      )
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
          workflow_type: WorkflowType.Dynamic,
          field: emailFieldId1,
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
        submissionId: mockSubmissionId,
        form: {
          _id: mockFormId,
          workflow: threeStepApprovalWorkflow,
          emails: [expectedEmails[1]],
          stepsToNotify: [stepOneId],
        } as IPopulatedMultirespondentForm,
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
      expect(sendMrfApprovalEmailSpy.mock.calls[0][0].emails).toEqual(
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
          workflow_type: WorkflowType.Dynamic,
          field: emailFieldId1,
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
        submissionId: mockSubmissionId,
        form: {
          _id: mockFormId,
          workflow: threeStepApprovalWorkflow,
          emails: [expectedEmails[3]],
          stepsToNotify: [stepOneId, stepTwoId, stepThreeId],
        } as IPopulatedMultirespondentForm,
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
      expect(sendMrfApprovalEmailSpy.mock.calls[0][0].emails).toEqual(
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
          workflow_type: WorkflowType.Dynamic,
          field: emailFieldId1,
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
        submissionId: mockSubmissionId,
        form: {
          _id: mockFormId,
          workflow: threeStepApprovalWorkflow,
          emails: [expectedEmails[1]],
          stepsToNotify: [stepOneId],
        } as IPopulatedMultirespondentForm,
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
      expect(sendMrfApprovalEmailSpy.mock.calls[0][0].emails).toEqual(
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
          workflow_type: WorkflowType.Dynamic,
          field: emailFieldId1,
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
        submissionId: mockSubmissionId,
        form: {
          _id: mockFormId,
          workflow: threeStepApprovalWorkflow,
          emails: [expectedEmails[1]],
          stepsToNotify: [stepOneId],
        } as IPopulatedMultirespondentForm,
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
      expect(sendMrfApprovalEmailSpy.mock.calls[0][0].emails).toEqual(
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

      const fourStepApprovalWorkflow: FormWorkflowStepDto[] = [
        {
          _id: stepOneId,
          workflow_type: WorkflowType.Dynamic,
          field: emailFieldId1,
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

      const currentStepNumber = 1 // 2nd step of 3 steps workflow

      // Act
      await performMultiRespondentPostSubmissionUpdateActions({
        submissionId: mockSubmissionId,
        form: {
          _id: mockFormId,
          workflow: fourStepApprovalWorkflow,
          emails: [expectedEmails[1], expectedEmails[2]],
          stepsToNotify: [stepOneId, stepThreeId, stepFourId, stepFiveId],
        } as IPopulatedMultirespondentForm,
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
      expect(sendMrfApprovalEmailSpy.mock.calls[0][0].emails).toEqual(
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
          workflow_type: WorkflowType.Dynamic,
          field: emailFieldId1,
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
        submissionId: mockSubmissionId,
        form: {
          _id: mockFormId,
          workflow: threeStepApprovalWorkflow,
          emails: [expectedEmails[1]],
          stepsToNotify: [stepOneId],
        } as IPopulatedMultirespondentForm,
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
      expect(sendMrfApprovalEmailSpy.mock.calls[0][0].emails).toEqual(
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
      expect(sendMrfWorkflowCompletionEmailSpy.mock.calls[0][0].emails).toEqual(
        ['email1@example.com'],
      )
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
          workflow_type: WorkflowType.Dynamic,
          field: emailFieldId1,
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
        submissionId: mockSubmissionId,
        form: {
          _id: mockFormId,
          workflow: fourStepWorkflow,
          emails: [expectedEmails[3]],
          stepsToNotify: [stepOneId, stepFourId],
        } as IPopulatedMultirespondentForm,
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
      expect(sendMrfWorkflowCompletionEmailSpy.mock.calls[0][0].emails).toEqual(
        expectedEmails,
      )
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
          workflow_type: WorkflowType.Dynamic,
          field: emailFieldId1,
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
        submissionId: mockSubmissionId,
        form: {
          _id: mockFormId,
          workflow: fourStepWorkflow,
          emails: [selectedEmails[3]],
          stepsToNotify: [stepOneId, stepFourId],
        } as IPopulatedMultirespondentForm,
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
})
