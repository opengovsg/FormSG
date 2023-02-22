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
  FieldBase,
  HomenoFieldBase,
  ImageFieldBase,
  LongTextFieldBase,
  MobileFieldBase,
  NricFieldBase,
  NumberFieldBase,
  RadioFieldBase,
  RatingFieldBase,
  RatingShape,
  SectionFieldBase,
  ShortTextFieldBase,
  StatementFieldBase,
  TableFieldBase,
  UenFieldBase,
  YesNoFieldBase,
} from 'shared/types'

export const DATE_INPUT_FORMAT = 'dd/MM/yyyy'
export const DATE_RESPONSE_FORMAT = 'dd MMM yyyy'

export const NON_INPUT_FIELD_TYPES = [
  BasicField.Section,
  BasicField.Image,
  BasicField.Statement,
]

// Field creation data
type E2ePickFieldMetadata<T extends FieldBase, K extends keyof T> = Pick<
  T,
  'title' | 'fieldType' | K
> &
  Partial<Pick<T, 'description' | 'required'>>

// Field filling data
type E2eFieldSingleValue = { val: string }
type E2eFieldMultiValue = { val: string[] }
type E2eFieldTableValue = { val: string[][] }
type E2eFieldFilepath = { path: string } // Exception: this is used for image field creation too.

type E2eFieldHidden = { hidden?: boolean } // Flags the field to be hidden in the public form, so the submission util knows to ignore it.

export type E2eFieldMetadata =
  | (E2ePickFieldMetadata<AttachmentFieldBase, 'attachmentSize'> &
      E2eFieldSingleValue &
      E2eFieldFilepath &
      E2eFieldHidden)
  | (E2ePickFieldMetadata<
      CheckboxFieldBase,
      | 'fieldOptions'
      | 'othersRadioButton'
      | 'ValidationOptions'
      | 'validateByValue'
    > &
      E2eFieldMultiValue &
      E2eFieldHidden)
  | (E2ePickFieldMetadata<DateFieldBase, 'dateValidation'> &
      E2eFieldSingleValue &
      E2eFieldHidden)
  | (E2ePickFieldMetadata<
      DecimalFieldBase,
      'ValidationOptions' | 'validateByValue'
    > &
      E2eFieldSingleValue &
      E2eFieldHidden)
  | (E2ePickFieldMetadata<DropdownFieldBase, 'fieldOptions'> &
      E2eFieldSingleValue &
      E2eFieldHidden)
  | (E2ePickFieldMetadata<
      EmailFieldBase,
      | 'isVerifiable'
      | 'autoReplyOptions'
      | 'hasAllowedEmailDomains'
      | 'allowedEmailDomains'
    > &
      E2eFieldSingleValue &
      E2eFieldHidden)
  | (E2ePickFieldMetadata<HomenoFieldBase, 'fieldType'> &
      E2eFieldSingleValue &
      E2eFieldHidden)
  | (E2ePickFieldMetadata<ImageFieldBase, 'name'> &
      E2eFieldFilepath &
      E2eFieldHidden)
  | (E2ePickFieldMetadata<LongTextFieldBase, 'ValidationOptions'> &
      E2eFieldSingleValue &
      E2eFieldHidden)
  | (E2ePickFieldMetadata<MobileFieldBase, 'allowIntlNumbers'> & // Omit 'isVerfiable', since we can't test that.
      E2eFieldSingleValue &
      E2eFieldHidden)
  | (E2ePickFieldMetadata<NricFieldBase, never> &
      E2eFieldSingleValue &
      E2eFieldHidden)
  | (E2ePickFieldMetadata<NumberFieldBase, 'ValidationOptions'> &
      E2eFieldSingleValue &
      E2eFieldHidden)
  | (E2ePickFieldMetadata<
      RadioFieldBase,
      'fieldOptions' | 'othersRadioButton'
    > &
      E2eFieldSingleValue &
      E2eFieldHidden)
  | (E2ePickFieldMetadata<RatingFieldBase, 'ratingOptions'> &
      E2eFieldSingleValue &
      E2eFieldHidden)
  | (E2ePickFieldMetadata<SectionFieldBase, never> & E2eFieldHidden)
  | (E2ePickFieldMetadata<
      ShortTextFieldBase,
      'ValidationOptions' | 'allowPrefill'
    > &
      E2eFieldSingleValue &
      E2eFieldHidden)
  | (E2ePickFieldMetadata<StatementFieldBase, never> & E2eFieldHidden)
  | (E2ePickFieldMetadata<
      TableFieldBase,
      'minimumRows' | 'addMoreRows' | 'columns' | 'maximumRows'
    > &
      E2eFieldTableValue &
      E2eFieldHidden)
  | (E2ePickFieldMetadata<UenFieldBase, never> &
      E2eFieldSingleValue &
      E2eFieldHidden)
  | (E2ePickFieldMetadata<YesNoFieldBase, never> &
      E2eFieldSingleValue &
      E2eFieldHidden)

export const ALL_FIELDS: E2eFieldMetadata[] = [
  {
    title: 'Attachment',
    fieldType: BasicField.Attachment,
    attachmentSize: AttachmentSize.OneMb,
    path: '__tests__/e2e/files/att-folder-0/test-att.txt',
    val: 'test-att.txt',
  },
  {
    title: 'How did you hear about the event?',
    fieldType: BasicField.Checkbox,
    fieldOptions: ['School', 'Career Fairs / Talks', 'Online and Social Media'],
    othersRadioButton: true,
    ValidationOptions: { customMin: null, customMax: null },
    validateByValue: false,
    val: ['School', 'Mailing list'],
  },
  {
    title: 'Birthday',
    fieldType: BasicField.Date,
    val: format(new Date(), DATE_INPUT_FORMAT),
    dateValidation: {
      customMinDate: null,
      customMaxDate: null,
      selectedDateValidation: null,
    },
  },
  {
    title: 'Pi',
    fieldType: BasicField.Decimal,
    ValidationOptions: {
      customMin: null,
      customMax: null,
    },
    validateByValue: false,
    val: '3.1415926535',
  },
  {
    title: 'Favourite Food',
    fieldType: BasicField.Dropdown,
    fieldOptions: ['Rice', 'Chocolate', 'Ice-Cream'],
    val: 'Chocolate',
  },
  {
    title: 'Personal Email',
    fieldType: BasicField.Email,
    isVerifiable: true,
    autoReplyOptions: {
      hasAutoReply: false,
      autoReplyMessage: '',
      autoReplySender: '',
      autoReplySubject: '',
      includeFormSummary: false,
    },
    hasAllowedEmailDomains: false,
    allowedEmailDomains: [],
    val: 'test@test.gov.sg',
  },
  {
    title: 'Home Phone Number',
    fieldType: BasicField.HomeNo,
    val: '61234567',
  },
  // Hide for now, because it doesn't work unless we spin up localstack.
  // {
  //   title: 'Image',
  //   fieldType: BasicField.Image,
  //   path: '__tests__/e2e/files/logo.jpg',
  //   description: 'Logo for an organization.',
  //   name: 'logo.jpg',
  // },
  {
    title: 'Your Life Story',
    fieldType: BasicField.LongText,
    ValidationOptions: {
      selectedValidation: null,
      customVal: null,
    },
    val: 'Vestibulum sed facilisis nibh, vel semper nisl. Phasellus dictum sem et ligula vulputate malesuada. Phasellus posuere luctus sapien eu molestie. In euismod vestibulum orci ac blandit. Suspendisse est arcu, vestibulum id viverra sed, tempus in ligula. Maecenas consequat pharetra lorem, ac vulputate neque sodales non. Mauris vel lacus ipsum.',
  },
  {
    title: 'Mobile',
    fieldType: BasicField.Mobile,
    allowIntlNumbers: true,
    // Number should start with +(country code), if allowIntlNumbers. Otherwise, just the 8 digit input.
    val: '+6598889999',
  },
  {
    title: 'NRIC Number',
    fieldType: BasicField.Nric,
    val: 'S9991334G',
  },
  {
    title: 'Answer to life, the universe and everything?',
    fieldType: BasicField.Number,
    ValidationOptions: {
      selectedValidation: null,
      customVal: null,
    },
    val: '42',
  },
  {
    title: 'Mother Tongue Language',
    fieldType: BasicField.Radio,
    fieldOptions: ['Chinese', 'Malay', 'Tamil'],
    othersRadioButton: true,
    val: 'Klingon',
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
    title: 'About you',
    fieldType: BasicField.Section,
  },
  {
    title: 'Name',
    fieldType: BasicField.ShortText,
    ValidationOptions: {
      selectedValidation: null,
      customVal: null,
    },
    val: 'Lorem Ipsum',
  },
  {
    title: 'Statement',
    fieldType: BasicField.Statement,
    description: 'This is a statement. Read me!',
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
        title: 'Relationship',
        required: true,
        fieldOptions: ['Father', 'Mother', 'Sibling', 'Child', 'Other'],
        columnType: BasicField.Dropdown,
      },
    ],
    val: [
      ['John', 'Father'],
      ['Lisa', 'Mother'],
    ],
  },
  {
    title: 'Some UEN here please',
    fieldType: BasicField.Uen,
    val: 'T09LL0001B',
  },
  {
    title: 'Yes or No?',
    fieldType: BasicField.YesNo,
    val: 'Yes',
  },
]

export const SAMPLE_FIELD = keyBy(ALL_FIELDS, 'fieldType')
