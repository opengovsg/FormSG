import { times } from 'lodash'

import {
  BasicField,
  FormFieldDto,
  MyInfoAttribute,
  MyInfoChildAttributes,
} from 'formsg-shared/types'

import { FormFieldValues } from '~templates/Field'
import { CHECKBOX_OTHERS_INPUT_VALUE } from '~templates/Field/Checkbox/constants'
import { RADIO_OTHERS_INPUT_VALUE } from '~templates/Field/Radio/constants'

/**
 * One field of every `BasicField` type, plus answered and unanswered inputs
 * for each.
 *
 * RATIONALE: Lives in the frontend, not the backend, because the inputs are
 * `FormFieldValues` — what the respondent's browser actually holds. The
 * differential byte-parity gate
 * (`apps/backend/src/app/modules/submission/__tests__/flattenV4ToV1.parity.spec.ts`)
 * builds both comparison sides from this one surface.
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
 * RATIONALE: Values are deliberately padded and Others-bearing, so the trim,
 * date reformat, table question composition and checkbox Others
 * repositioning are all exercised rather than invisible no-ops.
 *
 * NOTE: `undefined` means the field type takes no input. Attachment is a
 * special case, filled in with a real `File` by `buildAnsweredInputs`.
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

/**
 * Every field rendered and left untouched, as react-hook-form actually holds
 * it.
 *
 * RATIONALE: Not `{}`. `{}` is a state no respondent's browser can be in — it
 * hid two parity gaps, because with no key at all both producers take their
 * `input === undefined` branch and agree by default.
 *
 * NOTE: `PublicFormProvider.tsx:339-349` seeds every field id with `''`,
 * except a table, seeded with `minimumRows` blank rows for `useFieldArray`.
 * A field component overwrites that on mount if its own `Controller` carries
 * a `defaultValue`:
 * - Address — six subfield `Controller`s at `${_id}.addressSubFields.*`,
 *   each `defaultValue=""` (`AddressField.tsx:160,209,240,275,304,331`) —
 *   ends up a present object of empty strings.
 * - Email — one `Controller` on the field id, `defaultValue={{ value: '' }}`
 *   (`EmailFieldInput.tsx:65`).
 * - Radio — a `Controller` on `${_id}.value`, `defaultValue=""`
 *   (`RadioField.tsx:92`).
 * Every other type keeps the bare `''`. Mobile has no mount-time default
 * either (`MobileFieldInput.tsx:46-49`), which is why it's absent above.
 */
const blankTableRow = (): Record<string, string> =>
  Object.fromEntries(TABLE_COLUMN_IDS.map((_id) => [_id, '']))

const untouchedInput = (fieldType: BasicField): unknown => {
  switch (fieldType) {
    case BasicField.Table:
      return times(TABLE_MINIMUM_ROWS, blankTableRow)
    case BasicField.Address:
      return {
        addressSubFields: {
          postalCode: '',
          blockNumber: '',
          streetName: '',
          buildingName: '',
          levelNumber: '',
          unitNumber: '',
        },
      }
    case BasicField.Email:
      return { value: '' }
    case BasicField.Radio:
      return { value: '' }
    default:
      return ''
  }
}

export const buildUnansweredInputs = (): FormFieldValues => {
  const inputs: Record<string, unknown> = {}
  for (const fieldType of ALL_FIELD_TYPES) {
    inputs[FIELD_IDS[fieldType]] = untouchedInput(fieldType)
  }
  for (const fieldType of VERIFIABLE_FIELD_TYPES) {
    inputs[VERIFIABLE_FIELD_IDS[fieldType]] = untouchedInput(fieldType)
  }
  return inputs as FormFieldValues
}

/* -------------------------------------------------------------------------- *
 * Differential (V4 -> V1 byte-parity) additions — #9984
 *
 * RATIONALE: Everything below is additive. The exports above were frozen for
 * the now-removed `[STEERING:T2a]` no-op snapshots, so the freeze is lifted;
 * `buildUnansweredInputs` is corrected in place to return what React Hook
 * Form really holds for a rendered-but-untouched field, which `{}` never was.
 *
 * RATIONALE: The differential gate needs a stricter fixture than the
 * snapshot, because its reference value runs through the server's
 * `validateField`. The frozen fixture was only ever fed to the browser
 * producer, so some of its values are ones a real server would reject —
 * those are corrected here, not in place.
 * -------------------------------------------------------------------------- */

/**
 * NOTE: The frozen fixture declares email and mobile with
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
 * RATIONALE: Values only, no signature. `makeSignatureValidator` really
 * authenticates the signature, so it must be minted at test time by whoever
 * holds the verification secret key — a placeholder would make the
 * storage-mode reference unbuildable, not merely unrealistic.
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
 * RATIONALE: Field-definition corrections the server's validators require.
 * - Table columns need `columnType`; `createAnswerFieldFromColumn` rejects a
 *   row without one.
 * - Attachment needs `attachmentSize`; `NaN` fails every file.
 * - `ValidationOptions` / `ratingOptions` / `fieldOptions` are dereferenced
 *   unguarded, so a missing sub-document throws a `TypeError`, not a
 *   rejection.
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
    // NOTE: `createAnswerFieldFromColumn` calls `column.toObject()` — a
    // column is a mongoose subdocument in production.
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
 * RATIONALE: Answer corrections the server's validators require — the frozen
 * fixture supplies values a real submission could never carry.
 * - `country_region` is upper-cased by `PublicFormProvider.handleSubmitForm`;
 *   the validator only accepts the upper-case options.
 * - The frozen UEN fails its own check digit.
 * - The table declares `minimumRows: 2` with `addMoreRows: false`, so exactly
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
 * RATIONALE: The unanswered path can only be measured on optional fields —
 * the reference runs `validateField`, which rejects a blank answer to a
 * required field before any array is produced. A table's columns carry their
 * own `required`, so they must be relaxed too.
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
 * RATIONALE: Children is absent from the generic loop because storage mode
 * only explodes it when hashedFields is present (a MyInfo form), which the
 * loop does not model. The dedicated `a MyInfo Children field` cases in the
 * parity spec cover it with hashedFields and provenance set.
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
 * A table the respondent added rows to and then submitted blank.
 *
 * RATIONALE: `buildUnansweredInputs` already covers `minimumRows` blank
 * rows, where both producers agree. They disagree on a row count the V4
 * wire cannot carry: `createResponsesV4` drops a table whose every cell is
 * falsy, so the flatten always re-synthesises `minimumRows` rows, while
 * storage mode keeps one row per row the respondent had on screen. Reaching
 * that state needs `addMoreRows`, which the frozen definition sets `false`.
 */
export const buildAddMoreRowsTableField = (): FormFieldDto =>
  ({
    ...buildOptionalDifferentialField(BasicField.Table),
    addMoreRows: true,
  }) as unknown as FormFieldDto

export const ADDED_TABLE_ROWS = TABLE_MINIMUM_ROWS + 1

export const buildBlankTableInputWithAddedRows = (): FormFieldValues =>
  ({
    [FIELD_IDS[BasicField.Table]]: times(ADDED_TABLE_ROWS, blankTableRow),
  }) as unknown as FormFieldValues

/**
 * NOTE: Both submit paths mediate the attachment upload through the
 * quarantine bucket, so both producers need the same map.
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

export const MYINFO_FIELD_TYPES = [
  BasicField.ShortText,
  BasicField.Date,
  BasicField.Dropdown,
  BasicField.Mobile,
] as const

export type MyInfoFieldType = (typeof MYINFO_FIELD_TYPES)[number]

export const MYINFO_FIELD_IDS: Record<MyInfoFieldType, string> = {
  [BasicField.ShortText]: fieldId(0x201),
  [BasicField.Date]: fieldId(0x202),
  [BasicField.Dropdown]: fieldId(0x203),
  [BasicField.Mobile]: fieldId(0x204),
}

export const MYINFO_ATTRS: Record<MyInfoFieldType, MyInfoAttribute> = {
  [BasicField.ShortText]: MyInfoAttribute.Name,
  [BasicField.Date]: MyInfoAttribute.DateOfBirth,
  [BasicField.Dropdown]: MyInfoAttribute.Sex,
  [BasicField.Mobile]: MyInfoAttribute.MobileNo,
}

const MYINFO_FIELD_OVERRIDES: Record<
  MyInfoFieldType,
  Record<string, unknown>
> = {
  [BasicField.ShortText]: {},
  [BasicField.Date]: {},
  [BasicField.Dropdown]: { fieldOptions: ['MALE', 'FEMALE'] },
  [BasicField.Mobile]: { allowIntlNumbers: false },
}

export const buildMyInfoField = (fieldType: MyInfoFieldType): FormFieldDto =>
  ({
    ...buildDifferentialField(fieldType),
    _id: MYINFO_FIELD_IDS[fieldType],
    title: `myinfo ${fieldType} question`,
    myInfo: { attr: MYINFO_ATTRS[fieldType] },
    ...MYINFO_FIELD_OVERRIDES[fieldType],
  }) as unknown as FormFieldDto

export const MYINFO_ANSWER_BY_FIELD_TYPE: Record<MyInfoFieldType, unknown> = {
  [BasicField.ShortText]: '  MISS SHARON TAN MEI LENG  ',
  [BasicField.Date]: '09/09/1990',
  [BasicField.Dropdown]: '  FEMALE  ',
  [BasicField.Mobile]: { value: '+6598765432' },
}

export const buildMyInfoFields = (): FormFieldDto[] =>
  MYINFO_FIELD_TYPES.map(buildMyInfoField)

export const buildMyInfoAnsweredInput = (fieldType: MyInfoFieldType): unknown =>
  MYINFO_ANSWER_BY_FIELD_TYPE[fieldType]

export const buildMyInfoInputs = (): FormFieldValues => {
  const inputs: Record<string, unknown> = {}
  for (const fieldType of MYINFO_FIELD_TYPES) {
    inputs[MYINFO_FIELD_IDS[fieldType]] = MYINFO_ANSWER_BY_FIELD_TYPE[fieldType]
  }
  return inputs as FormFieldValues
}

export const ALL_MYINFO_FIELD_IDS = (): string[] =>
  MYINFO_FIELD_TYPES.map((fieldType) => MYINFO_FIELD_IDS[fieldType])
