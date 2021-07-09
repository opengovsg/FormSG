import { AuthType, IField, IForm, IUser } from '../../../types'
import * as BetaService from '../BetaService'

describe('BetaService', () => {
  const nonBetaFeature = 'nonBetaFeature'
  const featureOne = 'featureOne'
  const featureTwo = 'featureTwo'
  const betaFeaturesField = {
    [featureOne]: {
      flag: 'betaFlagOne',
      matches(field: IField) {
        return field.title === featureOne
      },
    },
    [featureTwo]: {
      flag: 'betaFlagTwo',
      matches(field: IField) {
        return field.title === featureTwo
      },
    },
  }
  const userWithFeatureOne = {
    betaFlags: {
      [betaFeaturesField[featureOne].flag]: true,
    },
  } as IUser
  describe('isBetaField', () => {
    it('returns truthy for defined beta fields', () => {
      const result = BetaService.isBetaField(featureOne, betaFeaturesField)
      expect(result).toBeTruthy()
    })
    it('returns falsy for fields not defined as beta', () => {
      const result = BetaService.isBetaField(nonBetaFeature, betaFeaturesField)
      expect(result).toBeFalsy()
    })
  })
  describe('userHasAccessToFieldType', () => {
    it('returns true for features not defined as beta', () => {
      const result = BetaService.userHasAccessToFieldType(
        userWithFeatureOne,
        nonBetaFeature,
        betaFeaturesField,
      )
      expect(result).toBeTrue()
    })
    it('returns true for beta features that the user has access to', () => {
      const result = BetaService.userHasAccessToFieldType(
        userWithFeatureOne,
        featureOne,
        betaFeaturesField,
      )
      expect(result).toBeTrue()
    })
    it('returns false for beta features that the user lacks access to', () => {
      const result = BetaService.userHasAccessToFieldType(
        userWithFeatureOne,
        featureTwo,
        betaFeaturesField,
      )
      expect(result).toBeFalse()
    })
  })
  describe('getBetaFeaturesForFields', () => {
    const form = {
      form_fields: [{ title: featureTwo }],
      authType: AuthType.NIL,
    } as IForm
    it('lists the beta features that the user lacks', () => {
      const result = BetaService.getMissingPermissions(
        userWithFeatureOne,
        form,
        { field: betaFeaturesField },
      )
      expect(result).toStrictEqual([featureTwo])
    })
  })
})
