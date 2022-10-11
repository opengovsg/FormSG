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
import { BasicField } from 'shared/types'

const allFieldInfo = [
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
  },
  {
    title: 'Happiness Score',
    fieldType: BasicField.Rating,
    ratingOptions: {
      steps: 5,
      shape: 'Heart',
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
    attachmentSize: '1',
    val: 'test-att.txt',
    path: '../files/att-folder-1/test-att.txt',
    content: 'att-folder-1',
  },
]

export const allFields = keyBy(allFieldInfo, 'fieldType')
