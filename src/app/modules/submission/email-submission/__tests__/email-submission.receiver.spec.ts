import Busboy from 'busboy'
import { IncomingHttpHeaders } from 'http'
import { omit } from 'lodash'
import { mocked } from 'ts-jest/utils'

import { generateNewAttachmentResponse } from 'tests/unit/backend/helpers/generate-form-data'

import { InitialiseMultipartReceiverError } from '../email-submission.errors'
import * as EmailSubmissionReceiver from '../email-submission.receiver'
import * as EmailSubmissionUtil from '../email-submission.util'

jest.mock('../email-submission.util')
const MockEmailSubmissionUtil = mocked(EmailSubmissionUtil, true)

jest.mock('busboy')
const MockBusboy = mocked(Busboy, true)

const MOCK_HEADERS = { key: 'value' }

const MOCK_BUSBOY_ON = jest.fn().mockReturnThis()
const MOCK_BUSBOY = ({
  on: MOCK_BUSBOY_ON,
} as unknown) as busboy.Busboy

describe('email-submission.receiver', () => {
  describe('createMultipartReceiver', () => {
    it('should call Busboy constructor with the correct params', () => {
      MockBusboy.mockReturnValueOnce(MOCK_BUSBOY)

      const result = EmailSubmissionReceiver.createMultipartReceiver(
        MOCK_HEADERS as IncomingHttpHeaders,
      )

      expect(MockBusboy).toHaveBeenCalledWith({
        headers: MOCK_HEADERS,
        limits: {
          fieldSize: 3 * 1048576,
          fileSize: 7 * 1048576,
        },
      })
      expect(result._unsafeUnwrap()).toEqual(MOCK_BUSBOY)
    })

    it('should return error when busboy constructor errors', () => {
      MockBusboy.mockImplementationOnce(() => {
        throw new Error()
      })

      const result = EmailSubmissionReceiver.createMultipartReceiver(
        MOCK_HEADERS as IncomingHttpHeaders,
      )

      expect(MockBusboy).toHaveBeenCalledWith({
        headers: MOCK_HEADERS,
        limits: {
          fieldSize: 3 * 1048576,
          fileSize: 7 * 1048576,
        },
      })
      expect(result._unsafeUnwrapErr()).toEqual(
        new InitialiseMultipartReceiverError(),
      )
    })
  })

  describe('configureMultipartReceiver', () => {
    it('should receive and store attachments in responses', async () => {
      const mockFile = jest.fn().mockReturnThis()
      const mockFileStream = { on: mockFile, resume: jest.fn() }
      const mockBuffer = Buffer.from('buffer1')
      const mockFieldId = 'fieldId'
      const mockFilename = 'filename'
      const mockResponse = omit(generateNewAttachmentResponse(), [
        'isVisible',
        'isUserVerified',
        'filename',
        'content',
        'answer',
      ])
      const mockBody = { responses: [mockResponse] }

      const resultPromise = EmailSubmissionReceiver.configureMultipartReceiver(
        MOCK_BUSBOY,
      )
      // Call event handlers to test behaviour
      // Starting with streaming an attachment
      const fileHandler = MOCK_BUSBOY_ON.mock.calls.find(
        (args) => args[0] === 'file',
      )[1]
      fileHandler(mockFilename, mockFileStream, mockFieldId)
      const fileDataHandler = mockFile.mock.calls.find(
        (args) => args[0] === 'data',
      )[1]
      fileDataHandler(mockBuffer)
      const fileEndHandler = mockFile.mock.calls.find(
        (args) => args[0] === 'end',
      )[1]
      fileEndHandler()

      // Then stream form data
      const fieldHandler = MOCK_BUSBOY_ON.mock.calls.find(
        (args) => args[0] === 'field',
      )[1]
      fieldHandler('body', JSON.stringify(mockBody))

      // Then finish the stream
      const finishHandler = MOCK_BUSBOY_ON.mock.calls.find(
        (args) => args[0] === 'finish',
      )[1]
      finishHandler()

      const expectedResponses = [mockResponse]
      const expectedAttachments = [
        {
          filename: mockFilename,
          content: Buffer.concat([mockBuffer]),
          fieldId: mockFieldId,
        },
      ]

      const result = await resultPromise
      expect(
        MockEmailSubmissionUtil.handleDuplicatesInAttachments,
      ).toHaveBeenCalledWith(expectedAttachments)
      expect(
        MockEmailSubmissionUtil.addAttachmentToResponses,
      ).toHaveBeenCalledWith(expectedResponses, expectedAttachments)
      expect(result._unsafeUnwrap()).toEqual(mockBody)
    })
  })
})
