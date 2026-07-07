import { PropsWithChildren } from 'react'
import { screen } from '@testing-library/react'

import { BasicField, FormResponseMode } from 'formsg-shared/types'

import { isMaskedInReplay, render } from '~/test-utils'

import { AugmentedDecryptedResponse } from '../ResponsesPage/storage/utils/augmentDecryptedResponses'

import { IndividualResponsePage } from './IndividualResponsePage'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
  Trans: ({ children }: PropsWithChildren) => children,
}))

vi.mock('react-router-dom', () => ({
  useParams: () => ({
    formId: 'mock-form-id',
    submissionId: 'mock-submission-id',
  }),
}))

vi.mock('~features/admin-form/common/queries', () => ({
  useAdminForm: () => ({
    data: { _id: 'mock-form-id', responseMode: FormResponseMode.Encrypt },
  }),
}))

vi.mock('~features/user/queries', () => ({
  useUser: () => ({ user: undefined }),
}))

vi.mock('../ResponsesPage/storage', () => ({
  useStorageResponsesContext: () => ({ secretKey: 'mock-secret-key' }),
}))

vi.mock('./IndividualResponseNavbar', () => ({
  IndividualResponseNavbar: () => <div data-testid="navbar" />,
}))

vi.mock('./mutations', () => ({
  useMutateDownloadAttachments: () => ({
    downloadAttachmentMutation: { mutate: vi.fn(), isLoading: false },
    downloadAttachmentsAsZipMutation: { mutate: vi.fn(), isLoading: false },
  }),
}))

const MOCK_DECRYPTED_ANSWER = 'mock decrypted answer text'
const MOCK_ATTACHMENT_FILENAME = 'mock-attachment.pdf'

const MOCK_RESPONSES: AugmentedDecryptedResponse[] = [
  {
    _id: 'field-1',
    fieldType: BasicField.ShortText,
    question: 'What is your name?',
    questionNumber: 1,
    answer: MOCK_DECRYPTED_ANSWER,
  },
  {
    _id: 'field-2',
    fieldType: BasicField.Attachment,
    question: 'Upload a document',
    questionNumber: 2,
    answer: MOCK_ATTACHMENT_FILENAME,
    downloadUrl: 'https://example.com/mock-download-url',
  },
] as AugmentedDecryptedResponse[]

vi.mock('./queries', () => ({
  useIndividualSubmission: () => ({
    data: {
      refNo: 'mock-submission-id',
      submissionTime: 'Mon, 6 Jul 2026, 12:00:00 pm',
      responses: MOCK_RESPONSES,
    },
    isLoading: false,
    isError: false,
  }),
}))

describe('IndividualResponsePage', () => {
  it('masks decrypted answers and attachment names in session replays', () => {
    render(<IndividualResponsePage />)

    const answer = screen.getByText(MOCK_DECRYPTED_ANSWER)
    expect(isMaskedInReplay(answer)).toBe(true)

    const attachmentName = screen.getByText(MOCK_ATTACHMENT_FILENAME)
    expect(isMaskedInReplay(attachmentName)).toBe(true)
  })
})
