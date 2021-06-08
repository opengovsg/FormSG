import { get } from 'lodash'

// Re-use the backend types for now so that we have some type safety.
// Given that this is used mostly by JavaScript modules, the lack of
// mongo-specific types should not present a problem.
// Change the types to frontend equivalents as and when available.
import { IField, IForm, IUser } from '../../types'

type BetaFeature = {
  flag: string
  matches: (field: IField) => boolean
}

type BetaFeaturesDictionary = { [featureName: string]: BetaFeature }

const BETA_FEATURES_FIELD: BetaFeaturesDictionary = {
  // This is an example of how to add fields to this object
  // featureName: {
  //   flag: 'betaFlagName',
  //   matches: (field) =>
  //     field.fieldType === 'mobile' &&
  //     (field.isVerifiable === true),
  // },
}

const getBetaFeaturesForFields = (
  formFields: IField[] | undefined,
  betaFeaturesField: BetaFeaturesDictionary,
): string[] => {
  const betaFeatures = new Set<string>()
  if (formFields) {
    for (const field of formFields) {
      for (const [name, feature] of Object.entries(betaFeaturesField)) {
        if (feature.matches(field)) {
          betaFeatures.add(name)
        }
      }
    }
  }
  return Array.from(betaFeatures)
}

export const getMissingFieldPermissions = (
  user: IUser,
  form: IForm,
  betaFeaturesField = BETA_FEATURES_FIELD,
): string[] => {
  const betaFeatures = getBetaFeaturesForFields(
    form.form_fields,
    betaFeaturesField,
  )
  return betaFeatures.filter((name) => {
    const flag = get(betaFeaturesField, [name, 'flag'])
    return flag && !get(user, ['betaFlags', flag], false)
  })
}

export const isBetaField = (
  fieldType: string,
  betaFeaturesField = BETA_FEATURES_FIELD,
): BetaFeature | undefined => {
  return betaFeaturesField[fieldType]
}

export const userHasAccessToFieldType = (
  user: IUser,
  fieldType: string,
  betaFeaturesField = BETA_FEATURES_FIELD,
): boolean => {
  const flag = get(betaFeaturesField, [fieldType, 'flag'])
  return (
    !isBetaField(fieldType, betaFeaturesField) ||
    (Boolean(flag) && get(user, ['betaFlags', flag], false))
  )
}
