import {
  BasicField,
  FormFieldDto,
  MyInfoChildAttributes,
} from 'formsg-shared/types'

import { FormFieldValues } from '~templates/Field'
import { CHECKBOX_OTHERS_INPUT_VALUE } from '~templates/Field/Checkbox/constants'
import { RADIO_OTHERS_INPUT_VALUE } from '~templates/Field/Radio/constants'

/**
 * One field of every `BasicField` type, plus answered and unanswered inputs for
 * each. Shared by the permanent per-field-type value-rule table and the
 * `[STEERING:T2a]` no-op snapshot so both drive exactly the same surface.
 */

const fieldId = (n: number) => n.toString(16).padStart(24, '0')

export const FIELD_IDS: Record<BasicField, string> = {
  [BasicField.Section]: fieldId(1),
  [BasicField.Statement]: fieldId(2),
  [BasicField.Email]: fieldId(3),
  [BasicField.Mobile]: fieldId(4),
  [BasicField.HomeNo]: fieldId(5),
  [BasicField.Number]: fieldId(6),
  [BasicField.Decimal]: fieldId(7),
  [BasicField.Image]: fieldId(8),
  [BasicField.ShortText]: fieldId(9),
  [BasicField.LongText]: fieldId(10),
  [BasicField.Dropdown]: fieldId(11),
  [BasicField.CountryRegion]: fieldId(12),
  [BasicField.YesNo]: fieldId(13),
  [BasicField.Checkbox]: fieldId(14),
  [BasicField.Radio]: fieldId(15),
  [BasicField.Attachment]: fieldId(16),
  [BasicField.Date]: fieldId(17),
  [BasicField.Rating]: fieldId(18),
  [BasicField.Nric]: fieldId(19),
  [BasicField.Table]: fieldId(20),
  [BasicField.Uen]: fieldId(21),
  [BasicField.Children]: fieldId(22),
  [BasicField.Address]: fieldId(23),
  [BasicField.Signature]: fieldId(24),
}

export const TABLE_COLUMN_IDS = ['col-a-id', 'col-b-id']
export const TABLE_COLUMN_TITLES = ['Col A', 'Col B']
export const TABLE_MINIMUM_ROWS = 2
export const CHILDREN_SUB_FIELDS = [
  MyInfoChildAttributes.ChildName,
  MyInfoChildAttributes.ChildBirthCertNo,
]

const extrasByFieldType: Partial<Record<BasicField, Record<string, unknown>>> =
  {
    [BasicField.Email]: {
      autoReplyOptions: { hasAutoReply: false },
      isVerifiable: false,
    },
    [BasicField.Mobile]: { isVerifiable: false },
    [BasicField.Checkbox]: {
      fieldOptions: ['a', 'b'],
      othersRadioButton: true,
      validateByValue: false,
    },
    [BasicField.Radio]: { fieldOptions: ['a', 'b'], othersRadioButton: true },
    [BasicField.Table]: {
      minimumRows: TABLE_MINIMUM_ROWS,
      addMoreRows: false,
      columns: TABLE_COLUMN_IDS.map((_id, i) => ({
        _id,
        title: TABLE_COLUMN_TITLES[i],
        required: true,
      })),
    },
    [BasicField.Children]: {
      childrenSubFields: CHILDREN_SUB_FIELDS,
    },
  }

export const buildField = (fieldType: BasicField): FormFieldDto =>
  ({
    _id: FIELD_IDS[fieldType],
    fieldType,
    title: `${fieldType} question`,
    description: '',
    required: true,
    disabled: false,
    ...extrasByFieldType[fieldType],
  }) as unknown as FormFieldDto

export const ALL_FIELD_TYPES = Object.values(BasicField)

export const buildAllFields = (): FormFieldDto[] =>
  ALL_FIELD_TYPES.map(buildField)

export const ATTACHMENT_FILE_NAME = 'my document.pdf'

/**
 * Deliberately padded / Others-bearing values, so the trim, the date reformat,
 * the table question composition and the checkbox Others repositioning are all
 * exercised rather than being invisible no-ops.
 *
 * `undefined` means "this field type takes no input" — the Attachment entry is
 * a special case, filled in with a real `File` by `buildAnsweredInputs`.
 */
export const ANSWERED_INPUT_BY_FIELD_TYPE: Record<BasicField, unknown> = {
  [BasicField.Section]: undefined,
  [BasicField.Statement]: undefined,
  [BasicField.Image]: undefined,
  [BasicField.Email]: { value: 'a@example.com', signature: 'email-signature' },
  [BasicField.Mobile]: { value: '+6598765432' },
  [BasicField.HomeNo]: '  +6561234567  ',
  [BasicField.Number]: '  42  ',
  [BasicField.Decimal]: '  4.2  ',
  [BasicField.ShortText]: '  padded value  ',
  [BasicField.LongText]: '  padded\nparagraph  ',
  [BasicField.Dropdown]: '  Option A  ',
  [BasicField.CountryRegion]: '  Singapore  ',
  [BasicField.YesNo]: 'Yes',
  [BasicField.Checkbox]: {
    value: ['a', CHECKBOX_OTHERS_INPUT_VALUE, 'b'],
    othersInput: 'my other',
  },
  [BasicField.Radio]: {
    value: RADIO_OTHERS_INPUT_VALUE,
    othersInput: 'my radio other',
  },
  [BasicField.Attachment]: undefined,
  [BasicField.Date]: '09/09/2026',
  [BasicField.Rating]: '  5  ',
  [BasicField.Nric]: '  S1234567D  ',
  [BasicField.Table]: [
    { [TABLE_COLUMN_IDS[0]]: ' cell a ', [TABLE_COLUMN_IDS[1]]: 'cell b' },
  ],
  [BasicField.Uen]: '  T09LL0001B  ',
  [BasicField.Children]: {
    child: [['Kid One', '01/01/2015']],
    childFields: CHILDREN_SUB_FIELDS,
  },
  [BasicField.Address]: {
    addressSubFields: {
      postalCode: '123456',
      blockNumber: '10',
      streetName: 'Main Street',
      buildingName: 'The Building',
      levelNumber: '05',
      unitNumber: '09',
    },
  },
  [BasicField.Signature]: {
    type: 'draw',
    value: [[[1, 2, 0.5]]],
  },
}

export const buildAnsweredInput = (fieldType: BasicField): unknown =>
  fieldType === BasicField.Attachment
    ? new File(['attachment contents'], ATTACHMENT_FILE_NAME, {
        type: 'application/pdf',
      })
    : ANSWERED_INPUT_BY_FIELD_TYPE[fieldType]

export const buildAnsweredInputs = (): FormFieldValues => {
  const inputs: Record<string, unknown> = {}
  for (const fieldType of ALL_FIELD_TYPES) {
    const input = buildAnsweredInput(fieldType)
    if (input !== undefined) inputs[FIELD_IDS[fieldType]] = input
  }
  return inputs as FormFieldValues
}

/** Every field left untouched — the unanswered path. */
export const buildUnansweredInputs = (): FormFieldValues =>
  ({}) as FormFieldValues

/* -------------------------------------------------------------------------- *
 * Differential (V4 -> V1 byte-parity) additions — #9984
 *
 * Everything below is additive. The exports above are frozen: the
 * `[STEERING:T2a]` no-op snapshots are keyed off them, and rewriting a snapshot
 * that exists to prove phase 1 changed nothing would defeat its purpose.
 *
 * The differential gate needs a stricter fixture than the snapshot does,
 * because its reference value runs through the server's `validateField`. The
 * frozen fixture was only ever fed to the browser producer, so several of its
 * values are ones a real server would reject outright — those are corrected
 * here rather than in place.
 * -------------------------------------------------------------------------- */

/**
 * OTP-verified email and mobile. The frozen fixture declares both with
 * `isVerifiable: false`, which is why the original 26-field probe never saw
 * `isUserVerified` — the server appends it only when `formField.isVerifiable`
 * (`ParsedResponsesObject.class.ts:150`).
 */
export const VERIFIABLE_FIELD_IDS: Record<
  BasicField.Email | BasicField.Mobile,
  string
> = {
  [BasicField.Email]: fieldId(0x101),
  [BasicField.Mobile]: fieldId(0x102),
}

export const VERIFIABLE_FIELD_TYPES = [
  BasicField.Email,
  BasicField.Mobile,
] as const

/**
 * Values only. The signature has to be minted at test time by whoever holds
 * the verification secret key: the backend's `makeSignatureValidator` really
 * does authenticate it, so a placeholder makes the storage-mode reference
 * unbuildable rather than merely unrealistic.
 */
export const VERIFIABLE_ANSWER_VALUE: Record<
  BasicField.Email | BasicField.Mobile,
  string
> = {
  [BasicField.Email]: 'verified@example.com',
  [BasicField.Mobile]: '+6591234567',
}

export const buildVerifiableAnsweredInput = (
  fieldType: BasicField.Email | BasicField.Mobile,
  sign: (fieldId: string, answer: string) => string,
): { value: string; signature: string } => {
  const value = VERIFIABLE_ANSWER_VALUE[fieldType]
  return { value, signature: sign(VERIFIABLE_FIELD_IDS[fieldType], value) }
}

/**
 * Field-definition corrections the server's validators require.
 * - Table columns need a `columnType`; `createAnswerFieldFromColumn` builds a
 *   per-cell validator from it and rejects the row without one.
 * - Attachment needs an `attachmentSize`; the size validator parses it into
 *   the byte limit, and `NaN` fails every file.
 * - the `ValidationOptions` / `ratingOptions` / `fieldOptions` sub-documents
 *   are dereferenced unguarded by their validators, so their absence is a
 *   `TypeError` rather than a rejection.
 */
const tableColumns = (required: boolean) =>
  TABLE_COLUMN_IDS.map((_id, i) => {
    const column = {
      _id,
      title: TABLE_COLUMN_TITLES[i],
      required,
      columnType: BasicField.ShortText,
      ValidationOptions: { selectedValidation: null, customVal: null },
    }
    // `createAnswerFieldFromColumn` calls `column.toObject()` — a column is a
    // mongoose subdocument in production.
    return { ...column, toObject: () => column }
  })

const DIFFERENTIAL_FIELD_OVERRIDES: Partial<
  Record<BasicField, Record<string, unknown>>
> = {
  [BasicField.Attachment]: { attachmentSize: '1' },
  [BasicField.Number]: {
    ValidationOptions: {
      selectedValidation: null,
      LengthValidationOptions: {
        selectedLengthValidation: null,
        customVal: null,
      },
      RangeValidationOptions: { customMin: null, customMax: null },
    },
  },
  [BasicField.Decimal]: {
    ValidationOptions: { customMin: null, customMax: null },
    validateByValue: false,
  },
  [BasicField.ShortText]: {
    ValidationOptions: { selectedValidation: null, customVal: null },
  },
  [BasicField.LongText]: {
    ValidationOptions: { selectedValidation: null, customVal: null },
  },
  [BasicField.Dropdown]: { fieldOptions: ['Option A', 'Option B'] },
  [BasicField.Checkbox]: {
    ValidationOptions: { customMin: null, customMax: null },
  },
  [BasicField.Rating]: { ratingOptions: { steps: 5, shape: 'Heart' } },
  [BasicField.Table]: { columns: tableColumns(true) },
}

export const buildDifferentialField = (fieldType: BasicField): FormFieldDto =>
  ({
    ...buildField(fieldType),
    ...DIFFERENTIAL_FIELD_OVERRIDES[fieldType],
  }) as unknown as FormFieldDto

export const buildVerifiableField = (
  fieldType: BasicField.Email | BasicField.Mobile,
): FormFieldDto =>
  ({
    ...buildDifferentialField(fieldType),
    _id: VERIFIABLE_FIELD_IDS[fieldType],
    title: `verified ${fieldType} question`,
    isVerifiable: true,
  }) as unknown as FormFieldDto

/**
 * Answer corrections the server's validators require. Each one is a value the
 * frozen fixture supplies that a real submission could never carry.
 * - `country_region` is upper-cased by `PublicFormProvider.handleSubmitForm`,
 *   and the validator only accepts the upper-case options.
 * - the frozen UEN fails its own check digit.
 * - the table declares `minimumRows: 2` with `addMoreRows: false`, so exactly
 *   two rows are admissible.
 */
const DIFFERENTIAL_ANSWERED_INPUT_OVERRIDES: Partial<
  Record<BasicField, unknown>
> = {
  [BasicField.CountryRegion]: '  SINGAPORE  ',
  [BasicField.Uen]: '  T16LL0604C  ',
  [BasicField.Table]: [
    { [TABLE_COLUMN_IDS[0]]: ' cell a ', [TABLE_COLUMN_IDS[1]]: 'cell b' },
    { [TABLE_COLUMN_IDS[0]]: ' cell c ', [TABLE_COLUMN_IDS[1]]: 'cell d' },
  ],
}

export const buildDifferentialAnsweredInput = (
  fieldType: BasicField,
): unknown =>
  fieldType in DIFFERENTIAL_ANSWERED_INPUT_OVERRIDES
    ? DIFFERENTIAL_ANSWERED_INPUT_OVERRIDES[fieldType]
    : buildAnsweredInput(fieldType)

/**
 * The unanswered path can only be measured on optional fields: the reference
 * runs `validateField`, which rejects a blank answer to a required field
 * before any array is produced. A table's columns carry their own `required`,
 * so they have to be relaxed too.
 */
export const buildOptionalDifferentialField = (
  fieldType: BasicField,
): FormFieldDto =>
  ({
    ...buildDifferentialField(fieldType),
    required: false,
    ...(fieldType === BasicField.Table ? { columns: tableColumns(false) } : {}),
  }) as unknown as FormFieldDto

export const buildOptionalVerifiableField = (
  fieldType: BasicField.Email | BasicField.Mobile,
): FormFieldDto =>
  ({
    ...buildVerifiableField(fieldType),
    required: false,
  }) as unknown as FormFieldDto

/**
 * Children is deliberately absent: storage mode expands one Children field
 * into one entry per child, while the target flatten is specified to throw on
 * it. Encoding that as an expected difference would enshrine a state that has
 * been decided cannot exist; exhaustiveness covers Children instead.
 *
 * MyInfo variants are absent too — storage mode prepends `[Myinfo] ` to their
 * question text, and #9975 owns reproducing that.
 */
export const DIFFERENTIAL_FIELD_TYPES: BasicField[] = ALL_FIELD_TYPES.filter(
  (fieldType) => fieldType !== BasicField.Children,
)

/** One field of every differential type, plus the two verifiable ones. */
export const buildDifferentialFields = (): FormFieldDto[] => [
  ...DIFFERENTIAL_FIELD_TYPES.map(buildDifferentialField),
  ...VERIFIABLE_FIELD_TYPES.map(buildVerifiableField),
]

/** The same form with every field optional, for the unanswered path. */
export const buildOptionalDifferentialFields = (): FormFieldDto[] => [
  ...DIFFERENTIAL_FIELD_TYPES.map(buildOptionalDifferentialField),
  ...VERIFIABLE_FIELD_TYPES.map(buildOptionalVerifiableField),
]

export const buildDifferentialInputs = (
  sign: (fieldId: string, answer: string) => string,
): FormFieldValues => {
  const inputs: Record<string, unknown> = {}
  for (const fieldType of DIFFERENTIAL_FIELD_TYPES) {
    const input = buildDifferentialAnsweredInput(fieldType)
    if (input !== undefined) inputs[FIELD_IDS[fieldType]] = input
  }
  for (const fieldType of VERIFIABLE_FIELD_TYPES) {
    inputs[VERIFIABLE_FIELD_IDS[fieldType]] = buildVerifiableAnsweredInput(
      fieldType,
      sign,
    )
  }
  return inputs as FormFieldValues
}

/**
 * The attachment upload is mediated by the quarantine bucket on both submit
 * paths, so both producers need the same map.
 */
export const ATTACHMENT_QUARANTINE_KEY = 'quarantine-bucket-key'

export const buildQuarantineMap = (): {
  fieldId: string
  quarantineBucketKey: string
}[] => [
  {
    fieldId: FIELD_IDS[BasicField.Attachment],
    quarantineBucketKey: ATTACHMENT_QUARANTINE_KEY,
  },
]
