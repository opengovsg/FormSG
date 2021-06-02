const { get, forEach } = require('lodash')

angular.module('forms').factory('Betas', [Betas])

const BETA_FEATURES_FIELD = {
  // This is an example of how to add fields to this object
  // featureName: {
  //   flag: 'betaFlagName',
  //   matches: (field) =>
  //     field.fieldType === 'mobile' &&
  //     (field.isVerifiable === true),
  // },
}

const getBetaFeaturesForFields = (formFields, betaFeaturesField) => {
  let betaFeatures = new Set()
  forEach(formFields, (field) => {
    forEach(betaFeaturesField, (feature, name) => {
      if (feature.matches(field)) betaFeatures.add(name)
    })
  })
  return Array.from(betaFeatures)
}

const getMissingFieldPermissions = (
  user,
  form,
  betaFeaturesField = BETA_FEATURES_FIELD,
) => {
  const betaFeatures = getBetaFeaturesForFields(
    form.form_fields,
    betaFeaturesField,
  )
  return betaFeatures.filter((name) => {
    const flag = get(betaFeaturesField, [name, 'flag'])
    return flag && !get(user, ['betaFlags', flag], false)
  })
}

const isBetaField = (fieldType, betaFeaturesField = BETA_FEATURES_FIELD) => {
  return betaFeaturesField[fieldType]
}

const userHasAccessToFieldType = (
  user,
  fieldType,
  betaFeaturesField = BETA_FEATURES_FIELD,
) => {
  const flag = get(betaFeaturesField, [fieldType, 'flag'])
  return (
    !isBetaField(fieldType, betaFeaturesField) ||
    (flag && get(user, ['betaFlags', flag], false))
  )
}

function Betas() {
  return {
    getMissingFieldPermissions,
    isBetaField,
    userHasAccessToFieldType,
  }
}

module.exports = {
  getMissingFieldPermissions,
  isBetaField,
  userHasAccessToFieldType,
}
