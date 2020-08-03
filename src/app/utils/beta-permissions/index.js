const allowSms = require('./sms')
const BETA_FIELDS = ['mobile']

const userCanCreateField = (user, field) => {
  switch (field.fieldType) {
    case 'mobile': // All users can create mobile field, only users with allowSms can use autoreply and verification
      return allowSms(user, field)
    default:
      return true
  }
}

const isBetaField = (field) => {
  // All MyInfo fields should not be a beta field.
  return !field.myInfo && BETA_FIELDS.includes(field.fieldType)
}

module.exports = {
  isBetaField,
  userCanCreateField,
}
