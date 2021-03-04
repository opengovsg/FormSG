const FIELDS_TO_REJECT = require('../../../shared/resources/basic')
  .types.filter((f) => !f.submitted)
  .map((f) => f.name)

// deprecated
const ALLOWED_VALIDATORS = [
  'YesNoValidator',
  'TableValidator',
  'CheckboxValidator',
  // BaseFieldValidator can be constructed by the FieldValidatorFactory,
  // but is missing from this list.
  // 'BaseFieldValidator',
]

module.exports = {
  FIELDS_TO_REJECT,
  ALLOWED_VALIDATORS,
}
