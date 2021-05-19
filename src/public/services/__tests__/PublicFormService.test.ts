/* eslint-disable @typescript-eslint/ban-ts-comment */
import MockAxios from 'jest-mock-axios'

import { BasicField } from 'src/types'
import { EmailSubmissionDto, SubmissionResponseDto } from 'src/types/api'

import * as SubmissionUtil from '../../utils/submission'
import { submitEmailModeFormSubmission } from '../PublicFormService'

jest.mock('axios', () => MockAxios)

describe('PublicFormService', () => {
  describe('submitEmailModeFormSubmission', () => {
    const MOCK_FORM_ID = 'mock–form-id'
    const MOCK_RESPONSE: SubmissionResponseDto = {
      message: 'some mock response',
      submissionId: 'created submission id',
    }
    const MOCK_CONTENT: EmailSubmissionDto = {
      responses: [
        {
          question: 'some question',
          answer: 'some answer',
          fieldType: BasicField.ShortText,
          _id: 'some_id',
        },
      ],
    }

    it('should call api with correct form data and params successfully when captcha is provided', async () => {
      // Arrange
      const mockCaptcha = 'some captcha response'
      const expectedFormData = 'form data returned imagine this is a form data'
      const createFormDataSpy = jest
        .spyOn(SubmissionUtil, 'createEmailSubmissionFormData')
        // Ignore wrong type; just checking that the util is ran and returns expected.
        // @ts-ignore
        .mockReturnValueOnce(expectedFormData)

      // Act
      const actual = submitEmailModeFormSubmission({
        formId: MOCK_FORM_ID,
        content: MOCK_CONTENT,
        captchaResponse: mockCaptcha,
      })
      MockAxios.mockResponse({ data: MOCK_RESPONSE })

      // Assert
      await expect(actual).resolves.toEqual(MOCK_RESPONSE)
      expect(
        MockAxios.post,
      ).toHaveBeenCalledWith(
        `/api/v3/forms/${MOCK_FORM_ID}/submissions/email`,
        expectedFormData,
        { params: { captchaResponse: mockCaptcha } },
      )
      expect(createFormDataSpy).toHaveBeenCalledWith({
        content: MOCK_CONTENT,
      })
    })

    it('should call api with correct form data and params successfully when captcha is not provided', async () => {
      // Arrange
      const expectedFormData =
        'form data returned imagine this is another form data'
      const createFormDataSpy = jest
        .spyOn(SubmissionUtil, 'createEmailSubmissionFormData')
        // Ignore wrong type; just checking that the util is ran and returns expected.
        // @ts-ignore
        .mockReturnValueOnce(expectedFormData)

      // Act
      const actual = submitEmailModeFormSubmission({
        formId: MOCK_FORM_ID,
        content: MOCK_CONTENT,
        // No captcha entered
      })
      MockAxios.mockResponse({ data: MOCK_RESPONSE })

      // Assert
      await expect(actual).resolves.toEqual(MOCK_RESPONSE)
      expect(MockAxios.post).toHaveBeenCalledWith(
        `/api/v3/forms/${MOCK_FORM_ID}/submissions/email`,
        expectedFormData,
        // Should default to stringified null
        { params: { captchaResponse: 'null' } },
      )
      expect(createFormDataSpy).toHaveBeenCalledWith({
        content: MOCK_CONTENT,
      })
    })
  })
})
