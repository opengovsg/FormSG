// Exports data for all basic field types.
const { makeField } = require('./util')
const moment = require('moment-timezone')
const DATE = 17
const allFieldInfo = [
  {
    title: 'Name',
    fieldType: 'textfield',
    val: 'Lorem Ipsum',
  },
  {
    title: 'Your Life Story',
    fieldType: 'textarea',
    val:
      'Vestibulum sed facilisis nibh, vel semper nisl. Phasellus dictum sem et ligula vulputate malesuada. Phasellus posuere luctus sapien eu molestie. In euismod vestibulum orci ac blandit. Suspendisse est arcu, vestibulum id viverra sed, tempus in ligula. Maecenas consequat pharetra lorem, ac vulputate neque sodales non. Mauris vel lacus ipsum.',
  },
  {
    title: 'Personal Email',
    fieldType: 'email',
    isVerifiable: false,
    val: 'test@test.gov.sg',
  },
  {
    title: 'Phone Number',
    fieldType: 'number',
    val: '61234567',
  },
  {
    title: 'NRIC Number',
    fieldType: 'nric',
    val: 'S9991334G',
  },
  {
    title: 'Yes or No?',
    fieldType: 'yes_no',
    val: 'Yes',
  },
  {
    title: 'Favourite Food',
    fieldType: 'dropdown',
    fieldOptions: ['Rice', 'Chocolate', 'Ice-Cream'],
    val: 'Chocolate',
  },
  {
    title: 'Birthday',
    fieldType: 'date',
    val: moment().set('date', DATE).format('DD MMM YYYY'),
  },
  {
    title: 'Happiness Score',
    fieldType: 'rating',
    ratingOptions: {
      steps: 5,
      shape: 'Heart',
    },
    val: '3',
  },
  {
    title: 'Family Members',
    fieldType: 'table',
    minimumRows: 2,
    addMoreRows: false,
    columns: [
      {
        title: 'Name',
        required: true,
        columnType: 'textfield',
      },
      {
        title: 'Gender',
        required: true,
        fieldOptions: ['Male', 'Female'],
        columnType: 'dropdown',
      },
    ],
    val: [
      ['John', 'Male'],
      ['Lisa', 'Female'],
    ],
  },
  {
    title: 'Pi',
    fieldType: 'decimal',
    ValidationOptions: {
      customMin: 3,
      customMax: null,
    },
    validateByValue: true,
    val: '3.1415926535',
  },
  {
    title: 'Mobile',
    fieldType: 'mobile',
    val: '+6598889999',
  },
  {
    title: 'How did you hear about the event?',
    fieldType: 'checkbox',
    fieldOptions: ['School', 'Career Fairs / Talks', 'Online and Social Media'],
    othersRadioButton: true,
    val: ['School', 'Mailing list'],
  },
  {
    title: 'Mother Tongue Language',
    fieldType: 'radiobutton',
    fieldOptions: ['Chinese', 'Malay', 'Tamil'],
    othersRadioButton: true,
    val: 'Klingon',
  },
  {
    title: 'Attachment',
    fieldType: 'attachment',
    attachmentSize: '1',
    val: 'test-att.txt',
    path: '../files/att-folder-1/test-att.txt',
    content: 'att-folder-1',
  },
]
const allFields = allFieldInfo.map(makeField)
module.exports = {
  allFields,
  allFieldsEncrypt: allFields.filter(
    (field) => field.fieldType !== 'attachment',
  ),
}
