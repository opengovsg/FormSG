import {
  generateSingleAnswerAutoreply,
  generateSingleAnswerFormData,
  generateSingleAnswerJson,
} from '__tests__/unit/backend/helpers/generate-email-data'
import {
  generateNewAttachmentResponse,
  generateNewCheckboxResponse,
  generateNewSingleAnswerResponse,
  generateNewTableResponse,
} from '__tests__/unit/backend/helpers/generate-form-data'
import { ObjectId } from 'bson'

import { types as basicTypes } from '../../../../../../shared/constants/field/basic'
import {
  BasicField,
  FormAuthType,
  MyInfoAttribute,
  TableRow,
} from '../../../../../../shared/types'
import { SingleAnswerFieldResponse, SPCPFieldTitle } from '../../../../../types'
import { ProcessedFieldResponse } from '../../submission.types'
import {
  ATTACHMENT_PREFIX,
  MYINFO_PREFIX,
  TABLE_PREFIX,
  VERIFIED_PREFIX,
} from '../email-submission.constants'
import { ResponseFormattedForEmail } from '../email-submission.types'
import {
  getFormDataPrefixedQuestion,
  getJsonPrefixedQuestion,
  SubmissionEmailObj,
} from '../email-submission.util'

const MOCK_ANSWER = 'mockAnswer'

const getResponse = (_id: string, answer: string): SingleAnswerFieldResponse =>
  ({
    _id,
    fieldType: BasicField.Attachment,
    question: 'mockQuestion',
    answer,
  }) as unknown as SingleAnswerFieldResponse

const ALL_SINGLE_SUBMITTED_RESPONSES = basicTypes
  // Attachments are special cases, requiring filename and content
  // Section fields are not submitted
  .filter(
    (t) =>
      !t.answerArray &&
      ![BasicField.Attachment, BasicField.Section].includes(t.name),
  )
  .map((t) => generateNewSingleAnswerResponse(t.name))

describe('email-submission.util', () => {
  describe('Submission Email Object', () => {
    const response1 = getResponse(
      String(new ObjectId()),
      MOCK_ANSWER,
    ) as ProcessedFieldResponse

    const response2 = getResponse(
      String(new ObjectId()),
      '',
    ) as ProcessedFieldResponse

    response1.fieldType = BasicField.YesNo
    response2.fieldType = BasicField.YesNo
    response1.isVisible = true
    response2.isVisible = false

    const hashedFields = new Set([
      new ObjectId().toHexString(),
      new ObjectId().toHexString(),
    ])
    const authType = FormAuthType.NIL
    const submissionEmailObj = new SubmissionEmailObj(
      [response1, response2],
      hashedFields,
      authType,
    )

    it('should return email data correctly for all single answer field types', () => {
      const emailData = new SubmissionEmailObj(
        ALL_SINGLE_SUBMITTED_RESPONSES,
        new Set(),
        FormAuthType.NIL,
      )
      const expectedAutoReplyData = ALL_SINGLE_SUBMITTED_RESPONSES.map(
        generateSingleAnswerAutoreply,
      )
      const expectedDataCollationData = ALL_SINGLE_SUBMITTED_RESPONSES.map(
        generateSingleAnswerJson,
      )
      const expectedFormData = ALL_SINGLE_SUBMITTED_RESPONSES.map(
        generateSingleAnswerFormData,
      )
      expect(emailData.autoReplyData).toEqual(expectedAutoReplyData)
      expect(emailData.dataCollationData).toEqual(expectedDataCollationData)
      expect(emailData.formData).toEqual(expectedFormData)
    })

    it('should exclude section fields from JSON data', () => {
      const response = generateNewSingleAnswerResponse(BasicField.Section)

      const emailData = new SubmissionEmailObj(
        [response],
        new Set(),
        FormAuthType.NIL,
      )
      expect(emailData.dataCollationData).toEqual([])
      expect(emailData.autoReplyData).toEqual([
        generateSingleAnswerAutoreply(response),
      ])
      expect(emailData.formData).toEqual([
        generateSingleAnswerFormData(response),
      ])
    })

    it('should exclude non-visible fields from autoreply data', () => {
      const response = generateNewSingleAnswerResponse(BasicField.ShortText, {
        isVisible: false,
      })

      const emailData = new SubmissionEmailObj(
        [response],
        new Set(),
        FormAuthType.NIL,
      )

      expect(emailData.dataCollationData).toEqual([
        generateSingleAnswerJson(response),
      ])
      expect(emailData.autoReplyData).toEqual([])
      expect(emailData.formData).toEqual([
        generateSingleAnswerFormData(response),
      ])
    })

    it('should include undefined isVisible fields from autoreply data', async () => {
      // Arrange
      const response = generateNewSingleAnswerResponse(BasicField.ShortText, {
        isVisible: undefined,
      })

      // Assert
      const emailData = new SubmissionEmailObj(
        [response],
        new Set(),
        FormAuthType.NIL,
      )

      // Assert
      expect(emailData.dataCollationData).toEqual([
        generateSingleAnswerJson(response),
      ])
      expect(emailData.autoReplyData).toEqual([
        generateSingleAnswerAutoreply(response),
      ])
      expect(emailData.formData).toEqual([
        generateSingleAnswerFormData(response),
      ])
    })

    it('should include isVisible true fields from autoreply data', async () => {
      // Arrange
      const response = generateNewSingleAnswerResponse(BasicField.ShortText, {
        isVisible: true,
      })

      // Assert
      const emailData = new SubmissionEmailObj(
        [response],
        new Set(),
        FormAuthType.NIL,
      )

      // Assert
      expect(emailData.dataCollationData).toEqual([
        generateSingleAnswerJson(response),
      ])
      expect(emailData.autoReplyData).toEqual([
        generateSingleAnswerAutoreply(response),
      ])
      expect(emailData.formData).toEqual([
        generateSingleAnswerFormData(response),
      ])
    })

    it('should generate table answers with [table] prefix in form and JSON data', () => {
      const response = generateNewTableResponse()

      const emailData = new SubmissionEmailObj(
        [response],
        new Set(),
        FormAuthType.NIL,
      )

      const question = response.question
      const firstRow = response.answerArray[0].join(',')
      const secondRow = response.answerArray[1].join(',')

      const expectedDataCollationData = [
        { question: `${TABLE_PREFIX}${question}`, answer: firstRow },
        { question: `${TABLE_PREFIX}${question}`, answer: secondRow },
      ]

      const expectedAutoReplyData = [
        { question, answerTemplate: [firstRow] },
        { question, answerTemplate: [secondRow] },
      ]

      const expectedFormData = [
        {
          question: `${TABLE_PREFIX}${question}`,
          answer: firstRow,
          answerTemplate: [firstRow],
          fieldType: BasicField.Table,
        },
        {
          question: `${TABLE_PREFIX}${question}`,
          answer: secondRow,
          answerTemplate: [secondRow],
          fieldType: BasicField.Table,
        },
      ]

      expect(emailData.dataCollationData).toEqual(expectedDataCollationData)
      expect(emailData.autoReplyData).toEqual(expectedAutoReplyData)
      expect(emailData.formData).toEqual(expectedFormData)
    })

    it('should generate checkbox answers correctly', () => {
      const response = generateNewCheckboxResponse()

      const emailData = new SubmissionEmailObj(
        [response],
        new Set(),
        FormAuthType.NIL,
      )

      const question = response.question
      const answer = response.answerArray.join(', ')

      const expectedDataCollationData = [{ question, answer }]
      const expectedAutoReplyData = [{ question, answerTemplate: [answer] }]
      const expectedFormData = [
        {
          question,
          answer,
          answerTemplate: [answer],
          fieldType: BasicField.Checkbox,
        },
      ]

      expect(emailData.dataCollationData).toEqual(expectedDataCollationData)
      expect(emailData.autoReplyData).toEqual(expectedAutoReplyData)
      expect(emailData.formData).toEqual(expectedFormData)
    })

    it('should generate attachment answers with [attachment] prefix in form and JSON data', () => {
      const response = generateNewAttachmentResponse()

      const emailData = new SubmissionEmailObj(
        [response],
        new Set(),
        FormAuthType.NIL,
      )

      const question = response.question
      const answer = response.answer

      const expectedDataCollationData = [
        { question: `${ATTACHMENT_PREFIX}${question}`, answer },
      ]
      const expectedAutoReplyData = [{ question, answerTemplate: [answer] }]
      const expectedFormData = [
        {
          question: `${ATTACHMENT_PREFIX}${question}`,
          answer,
          answerTemplate: [answer],
          fieldType: BasicField.Attachment,
        },
      ]

      expect(emailData.dataCollationData).toEqual(expectedDataCollationData)
      expect(emailData.autoReplyData).toEqual(expectedAutoReplyData)
      expect(emailData.formData).toEqual(expectedFormData)
    })

    it('should split single answer fields by newline', () => {
      const answer = 'first line\nsecond line'
      const response = generateNewSingleAnswerResponse(BasicField.ShortText, {
        answer,
      })

      const emailData = new SubmissionEmailObj(
        [response],
        new Set(),
        FormAuthType.NIL,
      )

      const question = response.question

      const expectedDataCollationData = [{ question, answer }]
      const expectedAutoReplyData = [
        { question, answerTemplate: answer.split('\n') },
      ]
      const expectedFormData = [
        {
          question,
          answer,
          answerTemplate: answer.split('\n'),
          fieldType: BasicField.ShortText,
        },
      ]

      expect(emailData.dataCollationData).toEqual(expectedDataCollationData)
      expect(emailData.autoReplyData).toEqual(expectedAutoReplyData)
      expect(emailData.formData).toEqual(expectedFormData)
    })

    it('should split table answers by newline', () => {
      const answerArray = [
        ['firstLine\nsecondLine', 'thirdLine\nfourthLine'],
      ] as TableRow[]
      const response = generateNewTableResponse({ answerArray })

      const emailData = new SubmissionEmailObj(
        [response],
        new Set(),
        FormAuthType.NIL,
      )

      const question = response.question
      const answer = answerArray[0].join(',')

      const expectedDataCollationData = [
        { question: `${TABLE_PREFIX}${question}`, answer },
      ]
      const expectedAutoReplyData = [
        { question, answerTemplate: answer.split('\n') },
      ]
      const expectedFormData = [
        {
          question: `${TABLE_PREFIX}${question}`,
          answer,
          answerTemplate: answer.split('\n'),
          fieldType: BasicField.Table,
        },
      ]

      expect(emailData.dataCollationData).toEqual(expectedDataCollationData)
      expect(emailData.autoReplyData).toEqual(expectedAutoReplyData)
      expect(emailData.formData).toEqual(expectedFormData)
    })

    it('should split checkbox answers by newline', () => {
      const answerArray = ['firstLine\nsecondLine', 'thirdLine\nfourtLine']
      const response = generateNewCheckboxResponse({ answerArray })

      const emailData = new SubmissionEmailObj(
        [response],
        new Set(),
        FormAuthType.NIL,
      )

      const question = response.question
      const answer = answerArray.join(', ')

      const expectedDataCollationData = [{ question, answer }]
      const expectedAutoReplyData = [
        { question, answerTemplate: answer.split('\n') },
      ]
      const expectedFormData = [
        {
          question,
          answer,
          answerTemplate: answer.split('\n'),
          fieldType: BasicField.Checkbox,
        },
      ]

      expect(emailData.dataCollationData).toEqual(expectedDataCollationData)
      expect(emailData.autoReplyData).toEqual(expectedAutoReplyData)
      expect(emailData.formData).toEqual(expectedFormData)
    })

    it('should prefix verified fields with [verified] only in form data', () => {
      const response = generateNewSingleAnswerResponse(BasicField.Email, {
        isUserVerified: true,
      })

      const emailData = new SubmissionEmailObj(
        [response],
        new Set(),
        FormAuthType.NIL,
      )

      const question = response.question
      const answer = response.answer

      const expectedDataCollationData = [{ question, answer }]
      const expectedAutoReplyData = [{ question, answerTemplate: [answer] }]
      const expectedFormData = [
        {
          question: `${VERIFIED_PREFIX}${question}`,
          answer,
          answerTemplate: [answer],
          fieldType: BasicField.Email,
        },
      ]

      expect(emailData.dataCollationData).toEqual(expectedDataCollationData)
      expect(emailData.autoReplyData).toEqual(expectedAutoReplyData)
      expect(emailData.formData).toEqual(expectedFormData)
    })

    it('should prefix MyInfo-verified fields with [MyInfo] only in form data', () => {
      // MyInfo-verified
      const nameResponse = generateNewSingleAnswerResponse(
        BasicField.ShortText,
        {
          myInfo: { attr: MyInfoAttribute.Name },
          answer: 'name',
        },
      )

      // MyInfo field but not MyInfo-verified
      const vehicleResponse = generateNewSingleAnswerResponse(
        BasicField.ShortText,
        {
          myInfo: { attr: MyInfoAttribute.VehicleNo },
          answer: 'vehiclenumber',
        },
      )

      const emailData = new SubmissionEmailObj(
        [nameResponse, vehicleResponse],
        new Set([nameResponse._id]),
        FormAuthType.MyInfo,
      )

      const expectedDataCollationData = [
        { question: nameResponse.question, answer: nameResponse.answer },
        {
          question: vehicleResponse.question,
          answer: vehicleResponse.answer,
        },
      ]
      const expectedAutoReplyData = [
        {
          question: nameResponse.question,
          answerTemplate: [nameResponse.answer],
        },
        {
          question: vehicleResponse.question,
          answerTemplate: [vehicleResponse.answer],
        },
      ]
      const expectedFormData = [
        {
          // Prefixed because its ID was in the Set
          question: `${MYINFO_PREFIX}${nameResponse.question}`,
          answer: nameResponse.answer,
          answerTemplate: [nameResponse.answer],
          fieldType: BasicField.ShortText,
        },
        {
          // Not prefixed because ID not in Set
          question: vehicleResponse.question,
          answer: vehicleResponse.answer,
          answerTemplate: [vehicleResponse.answer],
          fieldType: BasicField.ShortText,
        },
      ]

      expect(emailData.dataCollationData).toEqual(expectedDataCollationData)
      expect(emailData.autoReplyData).toEqual(expectedAutoReplyData)
      expect(emailData.formData).toEqual(expectedFormData)
    })

    it('should return the response in correct json format when dataCollationData() method is called', () => {
      const correctJson = [
        {
          question: getJsonPrefixedQuestion(
            response1 as ResponseFormattedForEmail,
          ),
          answer: (response1 as ResponseFormattedForEmail).answer,
        },
        {
          question: getJsonPrefixedQuestion(
            response2 as ResponseFormattedForEmail,
          ),
          answer: (response2 as ResponseFormattedForEmail).answer,
        },
      ]
      expect(submissionEmailObj.dataCollationData).toEqual(correctJson)
    })

    it('should return the response in correct admin response format when formData() method is called', () => {
      const correctFormData = [
        {
          question: getFormDataPrefixedQuestion(
            response1 as ResponseFormattedForEmail,
            hashedFields,
          ),
          answerTemplate: (response1 as ResponseFormattedForEmail).answer.split(
            '\n',
          ),
          answer: (response1 as ResponseFormattedForEmail).answer,
          fieldType: response1.fieldType,
        },
        {
          question: getFormDataPrefixedQuestion(
            response2 as ResponseFormattedForEmail,
            hashedFields,
          ),
          answerTemplate: (response2 as ResponseFormattedForEmail).answer.split(
            '\n',
          ),
          answer: (response2 as ResponseFormattedForEmail).answer,
          fieldType: response2.fieldType,
        },
      ]
      expect(submissionEmailObj.formData).toEqual(correctFormData)
    })

    it('should return the response in correct email confirmation format when autoReplyData() method is called', () => {
      const correctConfirmation = [
        {
          question: response1.question,
          answerTemplate: (response1 as ResponseFormattedForEmail).answer.split(
            '\n',
          ),
        },
        // Note that response2 is not shown in Email Confirmation as isVisible is false
      ]
      expect(submissionEmailObj.autoReplyData).toEqual(correctConfirmation)
    })

    it('should mask corppass UID if FormAuthType is Corppass and autoReplyData() method is called', () => {
      const responseCPUID = getResponse(
        String(new ObjectId()),
        'S1234567A',
      ) as ProcessedFieldResponse

      responseCPUID.question = SPCPFieldTitle.CpUid
      responseCPUID.isVisible = true

      const submissionEmailObjCP = new SubmissionEmailObj(
        [response1, response2, responseCPUID],
        hashedFields,
        FormAuthType.CP,
      )
      const correctConfirmation = [
        {
          question: response1.question,
          answerTemplate: (response1 as ResponseFormattedForEmail).answer.split(
            '\n',
          ),
        },
        // Note that response2 is not shown in Email Confirmation as isVisible is false
        {
          question: responseCPUID.question,
          answerTemplate: ['*****567A'],
        },
      ]
      expect(submissionEmailObjCP.autoReplyData).toEqual(correctConfirmation)
    })
  })
})
