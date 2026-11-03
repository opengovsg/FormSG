import { delay as MswDelay, http, HttpResponse } from 'msw'

import {
  BasicField,
  StorageModeSubmissionDto,
  SubmissionId,
  SubmissionType,
} from 'formsg-shared/types'

import formsgSdk from '~utils/formSdk'

export const getAdminFormSubmissions = ({
  delay = 0,
  override,
}: {
  delay?: number | 'infinite'
  override?: number
} = {}) => {
  return http.get<{ formId: string }, never, number>(
    '/api/v3/admin/forms/:formId/submissions/count',
    async () => {
      await MswDelay(delay ?? 0)
      return HttpResponse.json(override ?? 20, { status: 200 })
    },
  )
}

// Field ids match MOCK_FORM_FIELDS so the answers line up with the form.
const MOCK_STORAGE_RESPONSES = [
  {
    _id: '5da04e8ce397fc0013f63c71',
    fieldType: BasicField.Section,
    question: 'Header',
    answer: '',
  },
  {
    _id: '5da04eb5e397fc0013f63c7e',
    fieldType: BasicField.YesNo,
    question: 'Yes/No',
    answer: 'Yes',
  },
  {
    _id: '5da0290b4073c800128388b4',
    fieldType: BasicField.Email,
    question: 'Email',
    answer: 'respondent@example.com',
  },
  {
    _id: '5da04ea3e397fc0013f63c78',
    fieldType: BasicField.Mobile,
    question: 'Mobile Number',
    answer: '+6598765432',
  },
  {
    _id: '624a7bb87da1c9ace14fa4ee',
    fieldType: BasicField.HomeNo,
    question: 'Home Number',
    answer: '+6561234567',
  },
]

const STREAMED_SUBMISSION_IDS = [
  '62a8a7476f4f3e005bcd5ab7',
  '62a8a7466f4f3e005bcd5aaa',
  '62a8a7456f4f3e005bcd5a9d',
]

/**
 * Serves the storage-mode download stream as NDJSON, each submission
 * encrypted for `publicKey` so the unlocked table can decrypt it.
 */
export const getStorageSubmissionsStream = ({
  publicKey,
  delay = 0,
}: {
  publicKey: string
  delay?: number | 'infinite'
}) => {
  return http.get(
    '/api/v3/admin/forms/:formId/submissions/download',
    async () => {
      await MswDelay(delay ?? 0)
      const body = STREAMED_SUBMISSION_IDS.map((_id) =>
        JSON.stringify({
          _id,
          submissionType: SubmissionType.Encrypt,
          encryptedContent: formsgSdk.crypto.encrypt(
            MOCK_STORAGE_RESPONSES,
            publicKey,
          ),
          attachmentMetadata: {},
          version: 1,
          created: '2022-06-14T15:20:39.000Z',
        }),
      ).join('\n')
      return new HttpResponse(body, {
        headers: { 'Content-Type': 'application/x-ndjson' },
      })
    },
  )
}

/**
 * Serves one storage-mode submission, encrypted for `publicKey` at request
 * time so the page can decrypt it with the matching secret key.
 */
export const getStorageSubmission = ({
  publicKey,
  delay = 0,
}: {
  publicKey: string
  delay?: number | 'infinite'
}) => {
  return http.get<
    { formId: string; submissionId: string },
    never,
    StorageModeSubmissionDto
  >(
    '/api/v3/admin/forms/:formId/submissions/:submissionId',
    async ({ params }) => {
      await MswDelay(delay ?? 0)
      return HttpResponse.json(
        {
          submissionType: SubmissionType.Encrypt,
          refNo: params.submissionId as SubmissionId,
          submissionTime: '14th Jun 2022, 11:20:39 pm',
          content: formsgSdk.crypto.encrypt(MOCK_STORAGE_RESPONSES, publicKey),
          attachmentMetadata: {},
          version: 1,
        },
        { status: 200 },
      )
    },
  )
}
