/**
 * Byte-parity gate: compares the storage-mode plaintext the server encrypts
 * against the V4 -> V1 flatten's output for the same inputs.
 *
 * NOTE: The test compares JSON strings, not object keys since JSON is the
 * data that the server encrypts.
 */
import { ObjectId } from 'bson'
import { BasicField, FormFieldDto, FormResponseMode } from 'formsg-shared/types'
import { flattenV4ToFormFields } from 'formsg-shared/utils/flatten-v4-to-v1'
import { applyMyInfoPrefix } from 'formsg-shared/utils/myinfo-prefix'

import {
  FieldResponse,
  FormFieldSchema,
  IFormDocument,
} from '../../../../types'
import formsgSdk from '../../../config/formsg-sdk'
import {
  formatMyInfoStorageResponseData,
  omitResponseKeys,
} from '../encrypt-submission/encrypt-submission.utils'
import ParsedResponsesObject from '../ParsedResponsesObject.class'
import { isAttachmentResponse } from '../submission.utils'

import {
  ALL_MYINFO_FIELD_IDS,
  ATTACHMENT_FILE_NAME,
  buildAddMoreRowsTableField,
  buildBlankTableInputWithAddedRows,
  buildDifferentialAnsweredInput,
  buildDifferentialField,
  buildDifferentialFields,
  buildDifferentialInputs,
  buildMyInfoAnsweredInput,
  buildMyInfoField,
  buildMyInfoFields,
  buildMyInfoInputs,
  buildOptionalDifferentialField,
  buildOptionalDifferentialFields,
  buildOptionalVerifiableField,
  buildQuarantineMap,
  buildUnansweredInputs,
  buildVerifiableAnsweredInput,
  buildVerifiableField,
  DIFFERENTIAL_FIELD_TYPES,
  FIELD_IDS,
  MYINFO_FIELD_IDS,
  MYINFO_FIELD_TYPES,
  VERIFIABLE_FIELD_IDS,
  VERIFIABLE_FIELD_TYPES,
} from '~features/public-form/utils/__tests__/storageModeFixture'
import {
  createClearSubmissionWithVirusScanningFormData,
  createResponsesV4,
  MrfWireResponsesV4,
} from '~features/public-form/utils/createSubmission'
import { FormFieldValues } from '~templates/Field'

jest.mock('~/env', () => ({ env: { formsgSdkMode: 'test' } }))

const ATTACHMENT_CONTENT = Buffer.from('attachment contents')

const sign = (fieldId: string, answer: string): string =>
  formsgSdk.verification.generateSignature({
    transactionId: 'mock-transaction-id',
    formId: 'mock-form-id',
    fieldId,
    answer,
  })

const asFormFieldSchema = (field: FormFieldDto): FormFieldSchema =>
  ({
    ...field,
    getQuestion: () =>
      field.fieldType === BasicField.Table
        ? `${field.title} (${(
            field as unknown as { columns: { title: string }[] }
          ).columns
            .map((col) => col.title)
            .join(', ')})`
        : field.title,
  }) as unknown as FormFieldSchema

const asFormDocument = (formFields: FormFieldDto[]): IFormDocument =>
  ({
    _id: new ObjectId(),
    responseMode: FormResponseMode.Encrypt,
    form_fields: formFields.map(asFormFieldSchema),
    form_logics: [],
  }) as unknown as IFormDocument

/**
 * Builds A: the array `encryptSubmission` hands to `formsgSdk.crypto.encrypt`.
 */
const storageModeReference = (
  formFields: FormFieldDto[],
  formInputs: FormFieldValues,
  hashedFields?: Set<string>,
): unknown[] => {
  // 1. Browser: `submitStorageModeForm`, virus-scanning variant.
  const formData = createClearSubmissionWithVirusScanningFormData(
    { formFields, formInputs },
    buildQuarantineMap(),
  )
  const body = formData.get('body')
  expect(typeof body).toBe('string')
  const browserResponses = (
    JSON.parse(body as string) as {
      responses: FieldResponse[]
    }
  ).responses

  // 2. `addAttachmentToResponses` appends `filename` and `content` from the
  //    multipart parts (`receiver.utils.ts:120-130`), then
  //    `scanAndRetrieveAttachments` swaps the quarantine key in `answer` for
  //    the filename and the content for the clean buffer
  //    (`submission.service.ts:1280-1285`).
  const scannedResponses = browserResponses.map((response) =>
    response.fieldType === BasicField.Attachment && response.answer
      ? {
          ...response,
          answer: ATTACHMENT_FILE_NAME,
          filename: ATTACHMENT_FILE_NAME,
          content: ATTACHMENT_CONTENT,
        }
      : response,
  )

  // 3. `validateStorageSubmission`.
  const parsed = ParsedResponsesObject.parseResponses(
    asFormDocument(formFields),
    scannedResponses as FieldResponse[],
  )
  // Surfaces the server's own rejection reason: `_unsafeUnwrap` on its own
  // would report "Called `_unsafeUnwrap` on an Err" and nothing about why.
  expect(parsed.isErr() ? parsed.error.message : null).toBeNull()
  // `hashedFields` is the set of field ids whose answers were read-only MyInfo
  // values for this respondent. `undefined` (no MyInfo auth) makes this step
  // the identity; a non-empty set is what rewrites the question text.
  const serverResponses = formatMyInfoStorageResponseData(
    parsed._unsafeUnwrap().getAllResponses(),
    hashedFields,
  )

  // 4. `encryptSubmission`'s strip from the encrypt-submission middleware.
  return serverResponses.map((response) =>
    isAttachmentResponse(response)
      ? { ...response, filename: undefined, content: undefined }
      : omitResponseKeys(response),
  )
}

/**
 * MRF equivalent of step 2. `triggerGuardDutyScanThenDownloadCleanFileChainV4`
 * promotes the filename into `answer.value`; the middleware strips
 * `content`/`filename` before encryption
 *
 * RATIONALE: Applying this keeps the attachment comparison about the
 * flatten, not about which producer got a quarantine key.
 */
const scanV4Attachments = (
  v4Responses: MrfWireResponsesV4,
): MrfWireResponsesV4 => {
  const scanned: MrfWireResponsesV4 = {}
  for (const [id, response] of Object.entries(v4Responses)) {
    scanned[id] =
      response.fieldType === BasicField.Attachment
        ? {
            ...response,
            answer: {
              ...(response.answer as object),
              value: ATTACHMENT_FILE_NAME,
            },
          }
        : response
  }
  return scanned as MrfWireResponsesV4
}

const flattenReference = (
  formFields: FormFieldDto[],
  formInputs: FormFieldValues,
  readOnlyFieldIds: string[] = [],
): unknown[] =>
  applyMyInfoPrefix(
    flattenV4ToFormFields({
      formLogics: [],
      v4Responses: scanV4Attachments(
        createResponsesV4(formFields, formInputs, buildQuarantineMap()),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ) as any,
      formFields,
    }),
    readOnlyFieldIds,
  )

const expectByteParity = (
  formFields: FormFieldDto[],
  formInputs: FormFieldValues,
  readOnlyFieldIds: string[] = [],
) => {
  const A = storageModeReference(
    formFields,
    formInputs,
    readOnlyFieldIds.length > 0 ? new Set(readOnlyFieldIds) : undefined,
  )
  const B = flattenReference(formFields, formInputs, readOnlyFieldIds)
  expect(JSON.stringify(B)).toBe(JSON.stringify(A))
}

describe('V4 -> V1 flatten is byte-identical to the storage-mode producer', () => {
  describe('per field type', () => {
    describe.each(DIFFERENTIAL_FIELD_TYPES)('%s', (fieldType) => {
      const formFields = [buildDifferentialField(fieldType)]
      const answeredInput = buildDifferentialAnsweredInput(fieldType)
      const answeredInputs = (
        answeredInput === undefined
          ? {}
          : { [FIELD_IDS[fieldType]]: answeredInput }
      ) as FormFieldValues

      it('answered', () => {
        expectByteParity(formFields, answeredInputs)
      })

      it('unanswered', () => {
        expectByteParity(
          [buildOptionalDifferentialField(fieldType)],
          buildUnansweredInputs(),
        )
      })
    })
  })

  describe.each(VERIFIABLE_FIELD_TYPES)('OTP-verified %s', (fieldType) => {
    const formFields = [buildVerifiableField(fieldType)]

    it('answered', () => {
      expectByteParity(formFields, {
        [VERIFIABLE_FIELD_IDS[fieldType]]: buildVerifiableAnsweredInput(
          fieldType,
          sign,
        ),
      } as unknown as FormFieldValues)
    })

    it('unanswered', () => {
      expectByteParity(
        [buildOptionalVerifiableField(fieldType)],
        buildUnansweredInputs(),
      )
    })
  })

  describe('over a form mixing every type', () => {
    it('answered', () => {
      expectByteParity(buildDifferentialFields(), buildDifferentialInputs(sign))
    })

    it('unanswered', () => {
      expectByteParity(
        buildOptionalDifferentialFields(),
        buildUnansweredInputs(),
      )
    })
  })

  /**
   * Accepted divergence.
   *
   * Divergence:
   * - V4 payload omits respondent added unfilled optional rows.
   * - V1 captures this.
   *
   *  Why this divergence is accepted:
   * - We cannot reconstruct the respondent's added rows without modifying the V4 payload.
   * - Thus, we use the next best thing: the field's own `minimumRows`.
   */
  describe('a blank table the respondent added rows to', () => {
    const tableField = buildAddMoreRowsTableField()
    // RATIONALE: Read `minimumRows` off the field, not a fixture constant,
    // so the pin tracks the definition the flatten re-synthesises from.
    const { minimumRows } = tableField as unknown as { minimumRows: number }
    const formInputs = buildBlankTableInputWithAddedRows()

    let A: unknown[]
    let B: unknown[]
    beforeAll(() => {
      A = storageModeReference([tableField], formInputs)
      B = flattenReference([tableField], formInputs)
    })

    const rowsOf = (entries: unknown[]): string[][] =>
      (entries as { answerArray: string[][] }[])[0].answerArray
    const withoutRows = (entries: unknown[]): unknown[] =>
      (entries as Record<string, unknown>[]).map((entry) => {
        const rest = { ...entry }
        delete rest.answerArray
        return rest
      })
    const isBlankRow = (row: string[]) => row.every((cell) => cell === '')

    it("emits the field's minimumRows, not the rows the respondent saw", () => {
      expect(rowsOf(B)).toHaveLength(minimumRows)
      expect(rowsOf(A).length).toBeGreaterThan(minimumRows)
    })

    it('loses no answer, because every cell is blank on both sides', () => {
      expect(rowsOf(A).every(isBlankRow)).toBe(true)
      expect(rowsOf(B).every(isBlankRow)).toBe(true)
    })

    it('is byte-identical in every respect other than the row count', () => {
      expect(JSON.stringify(withoutRows(B))).toBe(
        JSON.stringify(withoutRows(A)),
      )
    })
  })

  /**
   * The `[Myinfo] ` question prefix (#9975). Storage mode rewrites the question
   * text of a MyInfo field whose attribute was read-only for this respondent,
   * so the flatten's output has to be run through the shared prefix rule with
   * the same set of field ids before it can match.
   *
   * Asserted with the same plain equality as every other case: no
   * normalisation and no declared exception, because with the prefix
   * reproduced the parity is real and an exception would hide it.
   */
  describe('MyInfo fields', () => {
    describe.each(MYINFO_FIELD_TYPES)('%s', (fieldType) => {
      const formFields = [buildMyInfoField(fieldType)]
      const inputs = {
        [MYINFO_FIELD_IDS[fieldType]]: buildMyInfoAnsweredInput(fieldType),
      } as FormFieldValues

      it('read-only for this respondent', () => {
        expectByteParity(formFields, inputs, [MYINFO_FIELD_IDS[fieldType]])
      })

      it('user-provided for this respondent', () => {
        expectByteParity(formFields, inputs, [])
      })
    })

    describe('over a form of every MyInfo field type', () => {
      it('all attributes read-only', () => {
        expectByteParity(
          buildMyInfoFields(),
          buildMyInfoInputs(),
          ALL_MYINFO_FIELD_IDS(),
        )
      })

      it('no attribute read-only', () => {
        expectByteParity(buildMyInfoFields(), buildMyInfoInputs(), [])
      })

      it('some attributes read-only', () => {
        expectByteParity(buildMyInfoFields(), buildMyInfoInputs(), [
          MYINFO_FIELD_IDS[BasicField.ShortText],
          MYINFO_FIELD_IDS[BasicField.Date],
        ])
      })
    })

    /**
     * Guards the gate itself: plain equality between two unprefixed arrays
     * would pass for the wrong reason, so assert that the reference really does
     * carry the prefix in the read-only case and really does not otherwise.
     */
    describe('the gate is not passing vacuously', () => {
      it('the storage-mode reference carries the prefix when read-only', () => {
        const questions = storageModeReference(
          buildMyInfoFields(),
          buildMyInfoInputs(),
          new Set(ALL_MYINFO_FIELD_IDS()),
        ).map((entry) => (entry as { question: string }).question)
        expect(questions).toHaveLength(MYINFO_FIELD_TYPES.length)
        expect(
          questions.every((question) => question.startsWith('[Myinfo] ')),
        ).toBe(true)
      })

      it('and carries none when nothing was read-only', () => {
        const questions = storageModeReference(
          buildMyInfoFields(),
          buildMyInfoInputs(),
          undefined,
        ).map((entry) => (entry as { question: string }).question)
        expect(
          questions.some((question) => question.includes('[Myinfo]')),
        ).toBe(false)
      })
    })
  })

  describe('question text comes from the form-definition snapshot', () => {
    it('is emitted for every entry even though the V4 responses carry none', () => {
      const formFields = buildDifferentialFields()
      const v4Responses = scanV4Attachments(
        createResponsesV4(
          formFields,
          buildDifferentialInputs(sign),
          buildQuarantineMap(),
        ),
      )
      // RATIONALE: The received V4 responses carries no question — the MRF middleware strips it
      expect(Object.values(v4Responses).every((r) => !('question' in r))).toBe(
        true,
      )

      const flattened = flattenV4ToFormFields({
        formLogics: [],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        v4Responses: v4Responses as any,
        formFields,
      })
      expect(
        flattened.filter((entry) => typeof entry.question !== 'string'),
      ).toEqual([])
    })

    it('ignores a question carried on the V4 response in favour of the snapshot', () => {
      const formFields = buildDifferentialFields()
      const inputs = buildDifferentialInputs(sign)
      const v4Responses = scanV4Attachments(
        createResponsesV4(formFields, inputs, buildQuarantineMap()),
      )
      const poisoned = Object.fromEntries(
        Object.entries(v4Responses).map(([id, response]) => [
          id,
          { ...response, question: 'a question the respondent supplied' },
        ]),
      )
      expect(
        JSON.stringify(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          flattenV4ToFormFields({
            formLogics: [],
            v4Responses: poisoned as any,
            formFields,
          }),
        ),
      ).toBe(JSON.stringify(flattenReference(formFields, inputs)))
    })
  })
})
