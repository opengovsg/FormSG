// /**
//  * Creates a field for e2e tests with default options (visible, required, not blank).
//  * @param {Object} fieldObj Custom options of the field.
//  * @param {string} fieldObj.title Mandatory title of field
//  * @param {string} fieldObj.fieldType Type of field. Mandatory unless makeField is
//  * being called to create an artificial field for verified SingPass/CorpPass data.
//  * @param {string} fieldObj.val Mandatory answer to field
//  */
// function makeField(fieldObj) {
//   return Object.assign(
//     {
//       required: true,
//       isVisible: true,
//       isLeftBlank: false,
//     },
//     fieldObj,
//   )
// }

import { format } from 'date-fns'
import { keyBy } from 'lodash'
import {
  AttachmentFieldBase,
  AttachmentSize,
  BasicField,
  CheckboxFieldBase,
  DateFieldBase,
  DecimalFieldBase,
  DropdownFieldBase,
  EmailFieldBase,
  HomenoFieldBase,
  LongTextFieldBase,
  MobileFieldBase,
  NricFieldBase,
  RadioFieldBase,
  RatingFieldBase,
  RatingShape,
  SectionFieldBase,
  ShortTextFieldBase,
  TableFieldBase,
  YesNoFieldBase,
} from 'shared/types'

type E2eFieldBaseMetadata = {
  title: string
  required?: boolean
  fieldType: BasicField
}

type E2eFieldBaseValue = { val: string }

export type E2eFieldMetadata = E2eFieldBaseMetadata &
  (
    | (E2eFieldBaseValue & Pick<RatingFieldBase, 'fieldType' | 'ratingOptions'>)
    | (E2eFieldBaseValue & Pick<EmailFieldBase, 'fieldType' | 'isVerifiable'>)
    | (E2eFieldBaseValue &
        Pick<DropdownFieldBase, 'fieldType' | 'fieldOptions'>)
    | (E2eFieldBaseValue & Pick<DateFieldBase, 'fieldType' | 'dateValidation'>)
    | ({ val: string[][] } & Pick<
        TableFieldBase,
        'fieldType' | 'minimumRows' | 'addMoreRows' | 'columns' | 'maximumRows'
      >)
    | (E2eFieldBaseValue &
        Pick<
          DecimalFieldBase,
          'fieldType' | 'ValidationOptions' | 'validateByValue'
        >)
    | ({ val: string[] } & Pick<
        CheckboxFieldBase,
        'fieldType' | 'fieldOptions' | 'othersRadioButton'
      >)
    | (E2eFieldBaseValue &
        Pick<
          RadioFieldBase,
          'fieldType' | 'fieldOptions' | 'othersRadioButton'
        >)
    | (E2eFieldBaseValue & {
        path: string
        content: string
      } & Pick<AttachmentFieldBase, 'fieldType' | 'attachmentSize'>)
    | (E2eFieldBaseValue & Pick<ShortTextFieldBase, 'fieldType'>)
    | (E2eFieldBaseValue & Pick<LongTextFieldBase, 'fieldType'>)
    | (E2eFieldBaseValue & Pick<HomenoFieldBase, 'fieldType'>)
    | (E2eFieldBaseValue & Pick<NricFieldBase, 'fieldType'>)
    | (E2eFieldBaseValue & Pick<YesNoFieldBase, 'fieldType'>)
    | (E2eFieldBaseValue & Pick<MobileFieldBase, 'fieldType'>)
    | Pick<SectionFieldBase, 'fieldType'>
  )

const allFieldInfo: E2eFieldMetadata[] = [
  {
    title: 'About you',
    fieldType: BasicField.Section,
  },
  {
    title: 'Name',
    fieldType: BasicField.ShortText,
    val: 'Lorem Ipsum',
  },
  {
    title: 'Your Life Story',
    fieldType: BasicField.LongText,
    val: 'Vestibulum sed facilisis nibh, vel semper nisl. Phasellus dictum sem et ligula vulputate malesuada. Phasellus posuere luctus sapien eu molestie. In euismod vestibulum orci ac blandit. Suspendisse est arcu, vestibulum id viverra sed, tempus in ligula. Maecenas consequat pharetra lorem, ac vulputate neque sodales non. Mauris vel lacus ipsum.',
  },
  {
    title: 'Personal Email',
    fieldType: BasicField.Email,
    isVerifiable: false,
    val: 'test@test.gov.sg',
  },
  {
    title: 'Home Phone Number',
    fieldType: BasicField.HomeNo,
    val: '61234567',
  },
  {
    title: 'NRIC Number',
    fieldType: BasicField.Nric,
    val: 'S9991334G',
  },
  {
    title: 'Yes or No?',
    fieldType: BasicField.YesNo,
    val: 'Yes',
  },
  {
    title: 'Favourite Food',
    fieldType: BasicField.Dropdown,
    fieldOptions: ['Rice', 'Chocolate', 'Ice-Cream'],
    val: 'Chocolate',
  },
  {
    title: 'Birthday',
    fieldType: BasicField.Date,
    val: format(17, 'dd MMM yyyy'),
    dateValidation: {
      customMaxDate: null,
      customMinDate: null,
      selectedDateValidation: null,
    },
  },
  {
    title: 'Happiness Score',
    fieldType: BasicField.Rating,
    ratingOptions: {
      steps: 5,
      shape: RatingShape.Heart,
    },
    val: '3',
  },
  {
    title: 'Family Members',
    fieldType: BasicField.Table,
    minimumRows: 2,
    addMoreRows: false,
    columns: [
      {
        title: 'Name',
        required: true,
        columnType: BasicField.ShortText,
        ValidationOptions: {
          customVal: null,
          selectedValidation: null,
        },
      },
      {
        title: 'Gender',
        required: true,
        fieldOptions: ['Male', 'Female'],
        columnType: BasicField.Dropdown,
      },
    ],
    val: [
      ['John', 'Male'],
      ['Lisa', 'Female'],
    ],
  },
  {
    title: 'Pi',
    fieldType: BasicField.Decimal,
    ValidationOptions: {
      customMin: 3,
      customMax: null,
    },
    validateByValue: true,
    val: '3.1415926535',
  },
  {
    title: 'Mobile',
    fieldType: BasicField.Mobile,
    val: '+6598889999',
  },
  {
    title: 'How did you hear about the event?',
    fieldType: BasicField.Checkbox,
    fieldOptions: ['School', 'Career Fairs / Talks', 'Online and Social Media'],
    othersRadioButton: true,
    val: ['School', 'Mailing list'],
  },
  {
    title: 'Mother Tongue Language',
    fieldType: BasicField.Radio,
    fieldOptions: ['Chinese', 'Malay', 'Tamil'],
    othersRadioButton: true,
    val: 'Klingon',
  },
  {
    title: 'Attachment',
    fieldType: BasicField.Attachment,
    attachmentSize: AttachmentSize.OneMb,
    val: 'test-att.txt',
    path: '../files/att-folder-1/test-att.txt',
    content: 'att-folder-1',
  },
]

export const allFields = keyBy(allFieldInfo, 'fieldType')
