import { IFieldSchema, IFormDocument } from '../../../types'

window.angular = {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  module: jest.fn(() => ({
    factory: jest.fn(),
  })),
}

// eslint-disable-next-line import/first
import * as BetaService from '../../modules/forms/services/betas.client.factory'

describe('BetaService', () => {
  const nonBetaFeature = 'nonBetaFeature'
  const featureOne = 'featureOne'
  const featureTwo = 'featureTwo'
  const betaFeaturesField = {
    [featureOne]: {
      flag: 'betaFlagOne',
      matches(field: IFieldSchema) {
        return field.title === featureOne
      },
    },
    [featureTwo]: {
      flag: 'betaFlagTwo',
      matches(field: IFieldSchema) {
        return field.title === featureTwo
      },
    },
  }
  const userWithFeatureOne = {
    betaFlags: {
      [betaFeaturesField[featureOne].flag]: true,
    },
  }
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
    } as IFormDocument
    it('lists the beta features that the user lacks', () => {
      const result = BetaService.getMissingFieldPermissions(
        userWithFeatureOne,
        form,
        betaFeaturesField,
      )
      expect(result).toStrictEqual([featureTwo])
    })
  })
})
