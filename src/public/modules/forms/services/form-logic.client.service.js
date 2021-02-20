const conditions = [
  {
    fieldType: 'dropdown',
    states: ['is equals to', 'is either'],
  },
  {
    fieldType: 'number',
    states: [
      'is equals to',
      'is less than or equal to',
      'is more than or equal to',
    ],
  },
  {
    fieldType: 'decimal',
    states: [
      'is equals to',
      'is less than or equal to',
      'is more than or equal to',
    ],
  },
  {
    fieldType: 'rating',
    states: [
      'is equals to',
      'is less than or equal to',
      'is more than or equal to',
    ],
  },
  {
    fieldType: 'yes_no',
    states: ['is equals to'],
  },
  {
    fieldType: 'radiobutton',
    states: ['is equals to', 'is either'],
  },
]

const FormLogic = {
  conditions,
  fieldTypes: conditions.map(function (condition) {
    return condition.fieldType
  }),
}

module.exports = FormLogic
