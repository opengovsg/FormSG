import { get } from 'lodash'

// Re-use the backend types for now so that we have some type safety.
// Given that this is used mostly by JavaScript modules, the lack of
// mongo-specific types should not present a problem.
// Change the types to frontend equivalents as and when available.
import { AuthType, IField, IForm, IUser } from '../../types'

type BetaFieldInfo = {
  flag: string
  matches: (field: IField) => boolean
}

type BetaFormInfo = {
  flag: string
  matches: (form: IForm) => boolean
}

type BetaFieldFeaturesDictionary = { [featureName: string]: BetaFieldInfo }

type BetaFormFeaturesDictionary = { [featureName: string]: BetaFormInfo }

const BETA_FEATURES_FIELD: BetaFieldFeaturesDictionary = {
  // This is an example of how to add fields to this object
  // featureName: {
  //   flag: 'betaFlagName',
  //   matches: (field) =>
  //     field.fieldType === 'mobile' &&
  //     (field.isVerifiable === true),
  // },
}

const BETA_FEATURES_FORM: BetaFormFeaturesDictionary = {
  // sgID: an authentication mechanism similar to Singpass
  sgid: {
    flag: 'sgid',
    // Given that it's a _form_ level feature and not a
    // _field_ level feature, always return true regardless
    // of form field presented
    matches: (form) => form.authType === AuthType.SGID,
  },
}

const getBetaFeaturesForForm = (
  form: IForm,
  fieldFeatures: BetaFieldFeaturesDictionary,
  formFeatures: BetaFormFeaturesDictionary,
): string[] => {
  const betaFeatures = new Set<string>()
  const { form_fields: formFields } = form
  if (formFields) {
    for (const field of formFields) {
      for (const [name, feature] of Object.entries(fieldFeatures)) {
        if (feature.matches(field)) {
          betaFeatures.add(name)
        }
      }
    }
  }
  for (const [name, feature] of Object.entries(formFeatures)) {
    if (feature.matches(form)) {
      betaFeatures.add(name)
    }
  }
  return Array.from(betaFeatures)
}

export const getMissingPermissions = (
  user: IUser,
  form: IForm,
  betaFeatureInfo: {
    field?: BetaFieldFeaturesDictionary
    form?: BetaFormFeaturesDictionary
  } = {},
): string[] => {
  const {
    field: fieldSpec = BETA_FEATURES_FIELD,
    form: formSpec = BETA_FEATURES_FORM,
  } = betaFeatureInfo

  const betaFeatures = getBetaFeaturesForForm(form, fieldSpec, formSpec)
  return betaFeatures.filter((name) => {
    const fieldFlag = get(fieldSpec, [name, 'flag'])
    if (fieldFlag) {
      return !get(user, ['betaFlags', fieldFlag], false)
    }
    const formFlag = get(formSpec, [name, 'flag'])
    return formFlag && !get(user, ['betaFlags', formFlag], false)
  })
}

export const isBetaField = (
  fieldType: string,
  betaFeaturesField = BETA_FEATURES_FIELD,
): BetaFieldInfo | undefined => {
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
