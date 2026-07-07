import { screen } from '@testing-library/react'

import { BasicField } from 'formsg-shared/types'

import { isMaskedInReplay, render } from '~/test-utils'

import { AugmentedDecryptedResponse } from '../ResponsesPage/storage/utils/augmentDecryptedResponses'

import { PrintableResponse } from './PrintableResponse'

const MOCK_DECRYPTED_ANSWER = 'mock printable answer text'

const MOCK_RESPONSES: AugmentedDecryptedResponse[] = [
  {
    _id: 'field-1',
    fieldType: BasicField.ShortText,
    question: 'What is your name?',
    questionNumber: 1,
    answer: MOCK_DECRYPTED_ANSWER,
  },
] as AugmentedDecryptedResponse[]

describe('PrintableResponse', () => {
  it('masks decrypted answers in session replays', () => {
    render(
      <PrintableResponse
        formTitle="Mock form"
        formId="mock-form-id"
        decryptedResponses={MOCK_RESPONSES}
        responseId="mock-submission-id"
        submissionTime="Mon, 6 Jul 2026, 12:00:00 pm"
      />,
    )

    const answer = screen.getByText(MOCK_DECRYPTED_ANSWER)
    expect(isMaskedInReplay(answer)).toBe(true)
  })
})
