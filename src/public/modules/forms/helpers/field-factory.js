const {
  AttachmentField,
  CheckboxField,
  DateField,
  DecimalField,
  DropdownField,
  EmailField,
  HeaderField,
  MobileField,
  HomeNoField,
  NumberField,
  NoAnswerField,
  RadioField,
  RatingField,
  SingleAnswerField,
  TableField,
  TextAreaField,
  TextField,
} = require('../viewmodels/Fields')
const { types: basicTypes } = require('../../../../shared/resources/basic')

const createFieldFromData = (fieldData) => {
  const fieldClass = getClass(fieldData.fieldType)
  return new fieldClass(fieldData)
}

const createDefaultBasicField = (fieldType) => {
  const name = getFieldName(fieldType)
  const fieldData = {
    fieldName: name,
    title: name,
    fieldType,
  }
  return createFieldFromData(fieldData)
}

const getFieldName = (fieldType) => {
  const field = basicTypes.find((f) => f.name === fieldType)
  if (field) return field.value
  return undefined
}

const getClass = (fieldType) => {
  switch (fieldType) {
    case 'attachment':
      return AttachmentField
    case 'checkbox':
      return CheckboxField
    case 'date':
      return DateField
    case 'decimal':
      return DecimalField
    case 'dropdown':
      return DropdownField
    case 'email':
      return EmailField
    case 'homeno':
      return HomeNoField
    case 'mobile':
      return MobileField
    case 'number':
      return NumberField
    case 'radiobutton':
      return RadioField
    case 'rating':
      return RatingField
    case 'section':
      return HeaderField
    case 'table':
      return TableField
    case 'textarea':
      return TextAreaField
    case 'textfield':
      return TextField
    case 'nric':
    case 'yes_no':
      return SingleAnswerField
    case 'image':
    case 'statement':
      return NoAnswerField
    default:
      throw new Error('Invalid fieldtype passed to createFieldFromData.')
  }
}

module.exports = {
  createFieldFromData,
  createDefaultBasicField,
}
