/* eslint-disable typesafe/no-throw-sync-func -- the harness throws on purpose:
   a reference it cannot build must abort loudly rather than be reported as a
   parity difference. */
/**
 * The differential byte-parity gate for #9984.
 *
 * `expect(JSON.stringify(B)).toBe(JSON.stringify(A))` where
 *   A = the storage-mode plaintext the SERVER encrypts, and
 *   B = the V4 -> V1 flatten's output for the same inputs.
 *
 * One assertion covers membership, order, key set, key order and values.
 * The comparison is on the JSON string rather than `Object.keys`, because a
 * verifiable field carries `signature: undefined` as a present key that
 * `JSON.stringify` drops — the delivered bytes are the JSON.
 *
 * THIS FILE IS EXPECTED TO FAIL until the flatten is rewritten. Every failure
 * here is a real parity gap: the harness below reproduces the production chain
 * rather than approximating it, and a harness that cannot build the reference
 * throws rather than reporting a difference.
 *
 * It lives in the backend because the reference value is only obtainable from
 * backend code (`ParsedResponsesObject`, `omitResponseKeys`); the frontend
 * halves are reached through the `~*` aliases mapped into `jest.config.js`.
 */
import { ObjectId } from 'bson'
import { BasicField, FormFieldDto, FormResponseMode } from 'formsg-shared/types'

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

import { flattenV4ToFormFields } from '~features/admin-form/responses/ResponsesPage/storage/utils/flattenV4ToFormFields'
import {
  ATTACHMENT_FILE_NAME,
  buildDifferentialAnsweredInput,
  buildDifferentialField,
  buildDifferentialFields,
  buildDifferentialInputs,
  buildOptionalDifferentialField,
  buildOptionalDifferentialFields,
  buildOptionalVerifiableField,
  buildQuarantineMap,
  buildUnansweredInputs,
  buildVerifiableAnsweredInput,
  buildVerifiableField,
  DIFFERENTIAL_FIELD_TYPES,
  FIELD_IDS,
  VERIFIABLE_FIELD_IDS,
  VERIFIABLE_FIELD_TYPES,
} from '~features/public-form/utils/__tests__/storageModeFixture'
import {
  createClearSubmissionWithVirusScanningFormData,
  createResponsesV4,
  MrfWireResponsesV4,
} from '~features/public-form/utils/createSubmission'
import { FormFieldValues } from '~templates/Field'

// `~/env` reads `import.meta`, which ts-jest's CommonJS output cannot parse.
// It is only reached transitively via `~utils/formSdk`, which none of the
// producers under test call. `jest.mock` is hoisted above the imports.
jest.mock('~/env', () => ({ env: { formsgSdkMode: 'test' } }))

const ATTACHMENT_CONTENT = Buffer.from('attachment contents')

/**
 * `makeSignatureValidator` really authenticates the OTP signature
 * (`field-validation/validators/common.ts:44-51`), so the reference can only
 * be built with one minted from the same secret key the server verifies with.
 */
const sign = (fieldId: string, answer: string): string =>
  formsgSdk.verification.generateSignature({
    transactionId: 'mock-transaction-id',
    formId: 'mock-form-id',
    fieldId,
    answer,
  })

/**
 * `getQuestion` is a mongoose instance method (`app/models/field/baseField.ts`),
 * so a POJO form definition has to carry it the way
 * `__tests__/unit/backend/helpers/generate-form-data.ts` already does. This is
 * the model's implementation verbatim, not an approximation.
 */
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
 * A = the array `encryptSubmission` hands to `formsgSdk.crypto.encrypt`.
 *
 * `validateStorageSubmission` discards the browser's array outright
 * (`req.body.responses = formatMyInfoStorageResponseData(...)`,
 * `encrypt-submission.middleware.ts:426`) and runs before `encryptSubmission`
 * in `handleStorageSubmission`, so the browser's array is only the input to
 * the server's, never the reference itself.
 */
const storageModeReference = (
  formFields: FormFieldDto[],
  formInputs: FormFieldValues,
): unknown[] => {
  // 1. The browser. `submitStorageModeForm` uses the virus-scanning variant.
  const formData = createClearSubmissionWithVirusScanningFormData(
    { formFields, formInputs },
    buildQuarantineMap(),
  )
  const body = formData.get('body')
  if (typeof body !== 'string') {
    throw new Error('harness: expected a string body from the browser producer')
  }
  const browserResponses = (JSON.parse(body) as { responses: FieldResponse[] })
    .responses

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
  if (parsed.isErr()) {
    throw new Error(
      `harness: the server rejected the browser's array — ${parsed.error.message}`,
    )
  }
  // No hashed fields: the fixture carries no MyInfo field, so this is identity.
  const serverResponses = formatMyInfoStorageResponseData(
    parsed.value.getAllResponses(),
    undefined,
  )

  // 4. `encryptSubmission`'s strip (`encrypt-submission.middleware.ts:485-495`).
  //    Note that the attachment branch does NOT call `omitResponseKeys`, so an
  //    attachment entry keeps `isVisible`.
  return serverResponses.map((response) =>
    isAttachmentResponse(response)
      ? { ...response, filename: undefined, content: undefined }
      : omitResponseKeys(response),
  )
}

/**
 * The MRF equivalent of step 2: `triggerGuardDutyScanThenDownloadCleanFileChainV4`
 * promotes the filename into `answer.value` (`submission.service.ts:1345-1362`),
 * and the middleware strips `content`/`filename` before encryption
 * (`multirespondent-submission.middleware.ts:897-909`). Applying it keeps the
 * attachment comparison about the flatten rather than about which producer got
 * a quarantine key.
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
): unknown[] =>
  flattenV4ToFormFields({
    v4Responses: scanV4Attachments(
      createResponsesV4(formFields, formInputs, buildQuarantineMap()),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ) as any,
    formFields,
  })

const expectByteParity = (
  formFields: FormFieldDto[],
  formInputs: FormFieldValues,
) => {
  const A = storageModeReference(formFields, formInputs)
  const B = flattenReference(formFields, formInputs)
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
      // The wire shape genuinely carries no question — the MRF middleware
      // strips it (`question: Joi.any().strip()`).
      expect(Object.values(v4Responses).every((r) => !('question' in r))).toBe(
        true,
      )

      const flattened = flattenV4ToFormFields({
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
          flattenV4ToFormFields({ v4Responses: poisoned as any, formFields }),
        ),
      ).toBe(JSON.stringify(flattenReference(formFields, inputs)))
    })
  })
})
