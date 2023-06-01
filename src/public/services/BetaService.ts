import { get } from 'lodash'

import { BasicField, FormDto, UserDto } from '../../../shared/types'

type BetaFeature = {
  // User-facing name for the feature
  name: string
  // Flag given to the feature in the User schema's betaFlags object
  flag: string
  // Function to match whether a form has this beta feature
  matches: (form: FormDto) => boolean
  /**
   * Some beta features are associated with specific field types.
   * If this is the case for a beta feature, this key indicates
   * the field type of the beta field.
   */
  fieldType: BasicField | null
}

const BETA_FEATURES: BetaFeature[] = [
  // This is an example of how to add fields to this object
  // {
  //   name: 'betaFlagName',
  //   flag: 'hasBetaFlag',
  //   matches: (form) => {
  //     return form.form_fields.some((field) =>
  //      field.fieldType === 'mobile' && field.isVerifiable
  //     )
  //   },
  //  fieldType: 'mobile',
  // },
]

const getBetaFeaturesForForm = (
  form: FormDto,
  betaFeaturesField: BetaFeature[],
): string[] => {
  const betaFeatures = new Set<string>()
  betaFeaturesField.forEach((feature) => {
    if (feature.matches(form)) {
      betaFeatures.add(feature.name)
    }
  })
  return Array.from(betaFeatures)
}

export const getMissingBetaPermissions = (
  user: UserDto,
  form: FormDto,
  betaFeaturesField = BETA_FEATURES,
): string[] => {
  const betaFeatures = getBetaFeaturesForForm(form, betaFeaturesField)
  return betaFeatures.filter((name) => {
    const flag = betaFeaturesField.find(
      (feature) => feature.name === name,
    )?.flag
    return flag && !get(user, ['betaFlags', flag], false)
  })
}

export const isBetaField = (
  fieldType: BasicField,
  betaFeaturesField = BETA_FEATURES,
): BetaFeature | undefined => {
  return betaFeaturesField.find((feature) => feature.fieldType === fieldType)
}

export const userHasAccessToFieldType = (
  user: UserDto,
  fieldType: BasicField,
  betaFeaturesField = BETA_FEATURES,
): boolean => {
  const flag = betaFeaturesField.find((feature) => {
    return feature.fieldType === fieldType
  })?.flag
  // No beta limitations on this field type
  if (!flag) return true
  return (
    !isBetaField(fieldType, betaFeaturesField) ||
    (Boolean(flag) && get(user, ['betaFlags', flag], false))
  )
}

export const userHasAccessToFeature = (
  user: UserDto,
  flag: string,
): boolean => {
  return get(user, ['betaFlags', flag], false)
}
