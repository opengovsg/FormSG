const { get, forEach } = require('lodash')

angular.module('forms').factory('Betas', [Betas])

function Betas() {
  const BETA_FEATURES_FIELD = {
    // This is an example of how to add fields to this object
    // featureName: {
    //   flag: 'betaFlagName',
    //   matches: (field) =>
    //     field.fieldType === 'mobile' &&
    //     (field.isVerifiable === true),
    // },
  }

  const getBetaFeaturesForFields = (formFields) => {
    let betaFeatures = new Set()
    forEach(formFields, (field) => {
      forEach(BETA_FEATURES_FIELD, (feature, name) => {
        if (feature.matches(field)) betaFeatures.add(name)
      })
    })
    return Array.from(betaFeatures)
  }

  const getMissingFieldPermissions = (user, form) => {
    const betaFeatures = getBetaFeaturesForFields(form.form_fields)
    return betaFeatures.filter((name) => {
      const flag = get(BETA_FEATURES_FIELD, [name, 'flag'])
      return flag && !get(user, ['betaFlags', flag], false)
    })
  }

  const isBetaField = (fieldType) => {
    return BETA_FEATURES_FIELD[fieldType]
  }

  const userHasAccessToFieldType = (user, fieldType) => {
    const flag = get(BETA_FEATURES_FIELD, [fieldType, 'flag'])
    return (
      !isBetaField(fieldType) || (flag && get(user, ['betaFlags', flag], false))
    )
  }

  return {
    getMissingFieldPermissions,
    isBetaField,
    userHasAccessToFieldType,
  }
}
