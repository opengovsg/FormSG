import { BasicField } from 'src/types'

const conditions = [
  {
    fieldType: BasicField.Dropdown,
    states: ['is equals to', 'is either'],
  },
  {
    fieldType: BasicField.Number,
    states: [
      'is equals to',
      'is less than or equal to',
      'is more than or equal to',
    ],
  },
  {
    fieldType: BasicField.Decimal,
    states: [
      'is equals to',
      'is less than or equal to',
      'is more than or equal to',
    ],
  },
  {
    fieldType: BasicField.Rating,
    states: [
      'is equals to',
      'is less than or equal to',
      'is more than or equal to',
    ],
  },
  {
    fieldType: BasicField.YesNo,
    states: ['is equals to'],
  },
  {
    fieldType: BasicField.Radio,
    states: ['is equals to', 'is either'],
  },
]

const FormLogic = {
  conditions,
  fieldTypes: conditions.map(function (condition) {
    return condition.fieldType
  }),
}

export default FormLogic
