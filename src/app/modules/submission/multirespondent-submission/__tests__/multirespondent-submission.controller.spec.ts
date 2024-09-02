import dbHandler from '__tests__/unit/backend/helpers/jest-db'
import expressHandler from '__tests__/unit/backend/helpers/jest-express'
import { ObjectId } from 'bson'
import { merge } from 'lodash'
import mongoose from 'mongoose'
import { ok, okAsync } from 'neverthrow'
import { FormAuthType, FormWorkflowStepDto, WorkflowType } from 'shared/types'

import { getMultirespondentSubmissionModel } from 'src/app/models/submission.server.model'
import * as FormService from 'src/app/modules/form/form.service'
import MailService from 'src/app/services/mail/mail.service'

import {
  submitMultirespondentFormForTest,
  updateMultirespondentSubmissionForTest,
} from '../multirespondent-submission.controller'

jest.mock('src/app/modules/datadog/datadog.utils')

const MultiRespondentSubmission = getMultirespondentSubmissionModel(mongoose)

const MockFormService = jest.mocked(FormService)

describe('multirespondent-submission.controller', () => {
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
  const mockMrfForm = {
    _id: mockFormId,
    workflow: [],
  }

  const mockSubmissionId = new ObjectId().toHexString()

  describe('mrf approval email notification when approval step exists', () => {
    it('sends approved outcome email when mrf is approved for single step MRF', async () => {})

    it('sends approved outcome email when mrf is approved for multiple step MRF', async () => {})

    it('sends not approved outcome email when mrf is rejected for single step MRF', async () => {})

    it('sends not approved outcome email when mrf is rejected for multiple step MRF', async () => {})
  })

  describe('mrf completion email notification when no approval step exists', () => {
    beforeAll(() => {
      MockFormService.isFormPublic = jest.fn().mockReturnValue(ok(true))
      MockFormService.checkIsIntranetFormAccess = jest
        .fn()
        .mockReturnValue(false)
      MockFormService.checkFormSubmissionLimitAndDeactivateForm = jest
        .fn()
        .mockReturnValue(okAsync(mockMrfForm))
    })

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

      MockFormService.checkFormSubmissionLimitAndDeactivateForm = jest
        .fn()
        .mockReturnValue(okAsync(mockMrfForm))

      const mockReq = expressHandler.mockRequest({
        params: { formId: mockFormId },
        body: {} as any,
      })
      const mockSubmitMrfReq = merge(mockReq, {
        formsg: {
          formDef: {
            _id: mockFormId,
            authType: FormAuthType.NIL,
            getUniqueMyInfoAttrs: jest.fn().mockReturnValue([]),
            workflow: singleStepWorkflow,
            emails: ['email1@example.com'],
          },
          encryptedPayload: {
            encryptedContent: 'encryptedContent',
            version: 1,
            submissionPublicKey: 'submissionPublicKey',
            encryptedSubmissionSecretKey: 'encryptedSubmissionSecretKey',
          },
        } as any,
      })
      const mockRes = expressHandler.mockResponse({})

      // Act
      await submitMultirespondentFormForTest(mockSubmitMrfReq, mockRes)

      // Assert
      expect(sendMrfWorkflowCompletionEmailSpy).toHaveBeenCalledTimes(1)
      expect(
        sendMrfWorkflowCompletionEmailSpy.mock.calls[0][0].emails,
      ).toContainAllValues(['email1@example.com'])
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

      MockFormService.checkFormSubmissionLimitAndDeactivateForm = jest
        .fn()
        .mockReturnValue(okAsync(mockMrfForm))

      MultiRespondentSubmission.findById = jest.fn().mockReturnValue({
        save: () => true,
      })

      const mockReq = expressHandler.mockRequest({
        params: {
          formId: mockFormId,
          submissionId: mockSubmissionId,
        },
        body: {} as any,
      })
      const mockSubmitMrfReq = merge(mockReq, {
        formsg: {
          formDef: {
            _id: mockFormId,
            authType: FormAuthType.NIL,
            getUniqueMyInfoAttrs: jest.fn().mockReturnValue([]),
            workflow: fourStepWorkflow,
            emails: [expectedEmails[3]],
            stepsToNotify: [stepOneId, stepFourId],
          },
          encryptedPayload: {
            encryptedContent: 'encryptedContent',
            version: 1,
            submissionPublicKey: 'submissionPublicKey',
            encryptedSubmissionSecretKey: 'encryptedSubmissionSecretKey',
            responses: submissionResponses,
            workflowStep: fourStepWorkflow.length - 1, // last step
          },
        } as any,
      })
      const mockRes = expressHandler.mockResponse({})

      // Act
      await updateMultirespondentSubmissionForTest(mockSubmitMrfReq, mockRes)

      // Assert
      expect(sendMrfWorkflowCompletionEmailSpy).toHaveBeenCalledTimes(1)
      // The emails sent to should only be the expected emails exactly
      expect(
        sendMrfWorkflowCompletionEmailSpy.mock.calls[0][0].emails,
      ).toContainAllValues(expectedEmails)
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

      MockFormService.checkFormSubmissionLimitAndDeactivateForm = jest
        .fn()
        .mockReturnValue(okAsync(mockMrfForm))

      MultiRespondentSubmission.findById = jest.fn().mockReturnValue({
        save: () => true,
      })

      const mockReq = expressHandler.mockRequest({
        params: {
          formId: mockFormId,
          submissionId: mockSubmissionId,
        },
        body: {} as any,
      })
      const mockSubmitMrfReq = merge(mockReq, {
        formsg: {
          formDef: {
            _id: mockFormId,
            authType: FormAuthType.NIL,
            getUniqueMyInfoAttrs: jest.fn().mockReturnValue([]),
            workflow: fourStepWorkflow,
            emails: [selectedEmails[3]],
            stepsToNotify: [stepOneId, stepFourId],
          },
          encryptedPayload: {
            encryptedContent: 'encryptedContent',
            version: 1,
            submissionPublicKey: 'submissionPublicKey',
            encryptedSubmissionSecretKey: 'encryptedSubmissionSecretKey',
            responses: submissionResponses,
            workflowStep: fourStepWorkflow.length - 2, // not last step
          },
        } as any,
      })
      const mockRes = expressHandler.mockResponse({})

      // Act
      await updateMultirespondentSubmissionForTest(mockSubmitMrfReq, mockRes)

      // Assert
      expect(sendMrfWorkflowCompletionEmailSpy).not.toHaveBeenCalled()
    })
  })
})
