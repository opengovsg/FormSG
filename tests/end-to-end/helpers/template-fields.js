// Exports data for all basic field types.
const { makeField } = require('./util')

const templateFieldsInfo = [
  {
    title: 'Personal Particulars',
    fieldType: 'section',
    val: '',
  },
  {
    title: 'Full Name',
    fieldType: 'textfield',
    val: 'Lorem Ipsum',
  },
  {
    title: 'Email Address',
    fieldType: 'email',
    val: 'user@domain.com',
  },
  {
    title: 'Contact Number',
    fieldType: 'mobile',
    val: '+6581234567',
  },
  {
    title: 'Residential Address',
    fieldType: 'textarea',
    val: 'some place i am living',
  },
  {
    title: 'Postal Code',
    fieldType: 'number',
    val: '123456',
  },
  {
    title: 'Availability',
    fieldType: 'section',
    val: '',
  },
  {
    fieldOptions: [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday',
    ],
    title: 'Preferred Days',
    fieldType: 'checkbox',
    fieldValue: [false, false, false, false, false, false, false, false],
    val: ['Monday'],
  },
  {
    fieldOptions: ['1 Jul 2020', '2 Jul 2020', '3 Jul 2020'],
    title: 'Preferred Dates',
    fieldType: 'checkbox',
    fieldValue: [false, false, false, false],
    val: ['1 Jul 2020'],
  },
  {
    fieldOptions: ['9.00am - 12.00pm', '1.00pm - 4.00pm', '6.00pm - 9.00pm'],
    title: 'Preferred Timeslots',
    fieldType: 'checkbox',
    fieldValue: [false, false, false, false],
    val: ['9.00am - 12.00pm'],
  },
  {
    fieldOptions: ['North', 'South', 'East', 'West', 'Central'],
    title: 'Preferred Locations',
    fieldType: 'checkbox',
    fieldValue: [false, false, false, false, false, false],
    val: ['North'],
  },
  {
    title: 'Health Declaration',
    fieldType: 'section',
    val: '',
  },
  {
    title: 'Have you, or anyone living with you, been diagnosed with COVID-19?',
    fieldType: 'yes_no',
    val: 'No',
  },
  {
    title:
      'Are you, or anyone living with you, experiencing respiratory or flu-like symptoms?',
    fieldType: 'yes_no',
    val: 'No',
  },
  {
    title:
      'Are you, or anyone living with you, under a Home Quarantine Order, Stay Home Notice, or Leave of Absence?',
    fieldType: 'yes_no',
    val: 'No',
  },
  {
    title:
      'Within the past 14 days, have you or anyone living with you had close contact with',
    fieldType: 'yes_no',
    val: 'No',
  },
]
const templateFields = templateFieldsInfo.map(makeField)
module.exports = { templateFields }
