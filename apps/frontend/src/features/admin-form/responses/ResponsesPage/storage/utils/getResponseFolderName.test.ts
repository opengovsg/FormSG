import { FormField } from '@opengovsg/formsg-sdk/dist/types'

import { getResponseFolderName } from './getResponseFolderName'

const NAME_FIELD_ID = '611b94dfbb9e300012f702a7'
const submissionId = '6a98f1b62d506e83eb536ba1'

const nameAnswer = (answer: string): FormField[] => [
  {
    _id: NAME_FIELD_ID,
    question: 'Name',
    fieldType: 'textfield',
    answer,
  },
]

describe('getResponseFolderName', () => {
  it('puts the chosen answer before the Response ID', () => {
    expect(
      getResponseFolderName({
        submissionId,
        responses: nameAnswer('Tan Ah Kow'),
        fieldId: NAME_FIELD_ID,
      }),
    ).toBe('Tan Ah Kow - RefNo 6a98f1b62d506e83eb536ba1')
  })

  it('strips characters Windows and macOS reject, and extra spaces', () => {
    expect(
      getResponseFolderName({
        submissionId,
        responses: nameAnswer(' Tan/Ah:Kow*?  "Jr" <ok>| \\ '),
        fieldId: NAME_FIELD_ID,
      }),
    ).toBe('Tan Ah Kow Jr ok - RefNo 6a98f1b62d506e83eb536ba1')
  })

  it('caps a long answer at 50 characters', () => {
    expect(
      getResponseFolderName({
        submissionId,
        responses: nameAnswer(
          'Ministry of Sustainability and the Environment Headquarters Unit',
        ),
        fieldId: NAME_FIELD_ID,
      }),
    ).toBe(
      'Ministry of Sustainability and the Environment Hea - RefNo 6a98f1b62d506e83eb536ba1',
    )
  })

  it('falls back to the Response ID when the answer is blank or missing', () => {
    expect(
      getResponseFolderName({
        submissionId,
        responses: nameAnswer(' / '),
        fieldId: NAME_FIELD_ID,
      }),
    ).toBe('RefNo 6a98f1b62d506e83eb536ba1')
    expect(
      getResponseFolderName({
        submissionId,
        responses: [],
        fieldId: NAME_FIELD_ID,
      }),
    ).toBe('RefNo 6a98f1b62d506e83eb536ba1')
  })
})
