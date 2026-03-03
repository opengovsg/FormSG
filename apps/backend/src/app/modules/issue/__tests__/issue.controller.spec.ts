import expressHandler from '__tests__/unit/backend/helpers/jest-express'
import { ObjectId } from 'bson'
import { merge, omit } from 'lodash'
import { err, errAsync, ok, okAsync } from 'neverthrow'

import { FormStatus } from '../../../../../shared/types'
import { IFormIssueSchema, IPopulatedForm } from '../../../../types'
import { DatabaseError } from '../../core/core.errors'
import { FormNotFoundError, PrivateFormError } from '../../form/form.errors'
import * as FormService from '../../form/form.service'
import * as FormIssueController from '../issue.controller'
import * as IssueService from '../issue.service'

jest.mock('../../form/form.service')
const MockFormService = jest.mocked(FormService)
jest.mock('../../issue/issue.service')
const MockIssueService = jest.mocked(IssueService)

describe('issue.controller', () => {
  beforeEach(() => jest.clearAllMocks())
  describe('submitFormIssue', () => {
    const MOCK_ISSUE = 'The form keeps crashing whenever I try to submit it.'
    const MOCK_FORM_ID = new ObjectId().toHexString()
    const MOCK_ADMIN_EMAIL = 'admin@example.com'
    const MOCK_USER_EMAIL = 'complainer@example.com'
    const MOCK_REQ = expressHandler.mockRequest({
      params: {
        formId: MOCK_FORM_ID,
      },
      body: {
        issue: MOCK_ISSUE,
        email: MOCK_USER_EMAIL,
      },
    })
    const MOCK_FORM = {
      _id: MOCK_FORM_ID,
      title: 'mock title',
      inactiveMessage: 'inactivated',
      status: FormStatus.Public,
      permissionList: [MOCK_ADMIN_EMAIL],
      admin: { email: MOCK_ADMIN_EMAIL },
      hasIssueNotification: true,
    } as unknown as IPopulatedForm

    const MOCK_FORM_ISSUE = {} as unknown as IFormIssueSchema

    it('should return FormNotFoundError as formId is invalid', async () => {
      // Arrange
      const mockRes = expressHandler.mockResponse()
      // Mock fail response
      MockFormService.retrieveFormKeysById.mockReturnValueOnce(
        errAsync(new FormNotFoundError()),
      )
      // Act
      await FormIssueController.submitFormIssueForTesting(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )
      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith({
        message:
          'This form no longer exists, please contact the agency that gave you the form link if you wish to report an issue.',
      })
    })

    it('should return PrivateFormError as form is private', async () => {
      // Arrange
      const mockRes = expressHandler.mockResponse()
      MockFormService.retrieveFormKeysById.mockReturnValueOnce(
        okAsync({
          ...MOCK_FORM,
          status: FormStatus.Private,
        } as unknown as IPopulatedForm),
      )
      MockFormService.isFormPublic.mockReturnValueOnce(
        err(new PrivateFormError(MOCK_FORM.inactiveMessage, MOCK_FORM.title)),
      )
      // Act
      await FormIssueController.submitFormIssueForTesting(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )
      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith({
        formTitle: MOCK_FORM.title,
        isPageFound: true,
        message: MOCK_FORM.inactiveMessage,
      })
    })

    it('should return DatabaseError as insertion to database fails', async () => {
      // Arrange
      const mockRes = expressHandler.mockResponse()
      MockFormService.retrieveFormKeysById.mockReturnValueOnce(
        okAsync(MOCK_FORM),
      )
      MockFormService.isFormPublic.mockReturnValueOnce(ok(true))
      // Mock fail response
      MockIssueService.insertFormIssue.mockReturnValueOnce(
        errAsync(new DatabaseError()),
      )
      // Act
      await FormIssueController.submitFormIssueForTesting(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )
      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Sorry, something went wrong. Please refresh and try again.',
      })
    })

    it('should return ok as insertion to database succeeds', async () => {
      // Arrange
      const mockRes = expressHandler.mockResponse()
      MockFormService.retrieveFormKeysById.mockReturnValueOnce(
        okAsync(MOCK_FORM),
      )
      MockFormService.isFormPublic.mockReturnValueOnce(ok(true))
      MockIssueService.insertFormIssue.mockReturnValueOnce(
        okAsync(MOCK_FORM_ISSUE),
      )
      // Act
      await FormIssueController.submitFormIssueForTesting(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )
      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(MockIssueService.notifyFormAdmin).toHaveBeenCalledTimes(1)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Successfully submitted issue.',
      })
    })

    it('should return ok without sending email if notification is off', async () => {
      // Arrange
      const mockRes = expressHandler.mockResponse()
      const mockFormWithoutNoti = merge(
        omit(MOCK_FORM, 'hasIssueNotification'),
        { hasIssueNotification: false },
      )
      MockFormService.retrieveFormKeysById.mockReturnValueOnce(
        okAsync(mockFormWithoutNoti),
      )
      MockFormService.isFormPublic.mockReturnValueOnce(ok(true))
      MockIssueService.insertFormIssue.mockReturnValueOnce(
        okAsync(MOCK_FORM_ISSUE),
      )
      // Act
      await FormIssueController.submitFormIssueForTesting(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )
      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(MockIssueService.notifyFormAdmin).toHaveBeenCalledTimes(0)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Successfully submitted issue.',
      })
    })
  })
})
