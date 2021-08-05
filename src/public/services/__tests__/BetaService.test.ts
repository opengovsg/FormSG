import { BasicField, IForm, IUser } from '../../../types'
import * as BetaService from '../BetaService'

describe('BetaService', () => {
  const featureOne = 'featureOne'
  const featureOneFieldType = BasicField.ShortText
  const featureTwo = 'featureTwo'
  const betaFeaturesField = [
    {
      name: featureOne,
      flag: 'betaFlagOne',
      matches(form: IForm) {
        return (
          !!form.form_fields &&
          form.form_fields.some(
            (field) => field.fieldType === featureOneFieldType,
          )
        )
      },
      fieldType: featureOneFieldType,
    },
    {
      name: featureTwo,
      flag: 'betaFlagTwo',
      matches(form: IForm) {
        return form.title === featureTwo
      },
      fieldType: null,
    },
  ]
  const userWithFeatureOne = {
    betaFlags: {
      [betaFeaturesField[0].flag]: true,
    },
  } as IUser
  const userWithNoFeatures = {
    betaFlags: {},
  } as IUser
  describe('isBetaField', () => {
    it('returns truthy for defined beta fields', () => {
      const result = BetaService.isBetaField(
        featureOneFieldType,
        betaFeaturesField,
      )
      expect(result).toBeTruthy()
    })
    it('returns falsy for fields not defined as beta', () => {
      const result = BetaService.isBetaField(
        BasicField.Attachment,
        betaFeaturesField,
      )
      expect(result).toBeFalsy()
    })
  })
  describe('userHasAccessToFieldType', () => {
    it('returns true for features not defined as beta', () => {
      const result = BetaService.userHasAccessToFieldType(
        userWithFeatureOne,
        // in betaFeaturesField, ShortText is the only beta field type
        BasicField.Attachment,
        betaFeaturesField,
      )
      expect(result).toBeTrue()
    })
    it('returns true for beta features that the user has access to', () => {
      const result = BetaService.userHasAccessToFieldType(
        userWithFeatureOne,
        featureOneFieldType,
        betaFeaturesField,
      )
      expect(result).toBeTrue()
    })
    it('returns false for beta features that the user lacks access to', () => {
      const result = BetaService.userHasAccessToFieldType(
        userWithNoFeatures,
        featureOneFieldType,
        betaFeaturesField,
      )
      expect(result).toBeFalse()
    })
  })
  describe('getBetaFeaturesForFields', () => {
    // Form containing both feature one and feature two
    const form = {
      form_fields: [{ fieldType: featureOneFieldType }],
      title: featureTwo,
    } as IForm
    it('lists the beta features that the user lacks', () => {
      // User with access to only feature one
      const result = BetaService.getMissingBetaPermissions(
        userWithFeatureOne,
        form,
        betaFeaturesField,
      )
      expect(result).toStrictEqual([featureTwo])
    })
  })
})
