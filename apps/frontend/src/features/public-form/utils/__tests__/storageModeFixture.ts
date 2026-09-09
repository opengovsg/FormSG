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
