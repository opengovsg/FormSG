const BETA_FIELDS = ['mobile']

const userCanCreateField = (user, field) => {
  switch (field.fieldType) {
    // Add cases if there are beta fields
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
