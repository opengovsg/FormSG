const FIELDS_TO_REJECT = require('../../../shared/resources/basic')
  .types.filter((f) => !f.submitted)
  .map((f) => f.name)

const ALLOWED_VALIDATORS = [
  'YesNoValidator',
  'EmailValidator',
  'DropdownValidator',
  'RadiobuttonValidator',
  'NricValidator',
  'AnswerNotAllowedValidator',
  'DecimalValidator',
  'NumberValidator',
  'MobileValidator',
  'HomeNoValidator',
  'RatingValidator',
  'TextValidator',
  'DateValidator',
  'TableValidator',
  'AttachmentValidator',
  'CheckboxValidator',
]

module.exports = {
  FIELDS_TO_REJECT,
  ALLOWED_VALIDATORS, // TODO: Remove after soft launch of validation. Should throw Error for all validators
}
