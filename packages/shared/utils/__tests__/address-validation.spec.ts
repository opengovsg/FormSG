import {
  validatePostalCode,
  validateNoSpecialCharacters,
  validateNoNonNumerical,
  validateLevelUnit,
} from '../address-validation'

describe('address validation utils', () => {
  describe('invalid postal codes', () => {
    it('should return error if postal code is invalid', () => {
      const alphanumericInput = '123456a'
      const notSixDigitsInput = '12345'
      const specialCharInput = '12345!'
      expect(validatePostalCode(alphanumericInput)).toEqual(false)
      expect(validatePostalCode(notSixDigitsInput)).toEqual(false)
      expect(validatePostalCode(specialCharInput)).toEqual(false)
    })
    describe('invalid block and unit numbers', () => {
      it('should return error if block numbers are invalid', () => {
        const blockNumberSpecialChars = '#12'
        const unitNumberSpecialChars = '-05'
        expect(validateNoSpecialCharacters(blockNumberSpecialChars)).toEqual(
          false,
        )
        expect(validateNoSpecialCharacters(unitNumberSpecialChars)).toEqual(
          false,
        )
      })
    })
    describe('invalid level numbers', () => {
      it('should return error if level numbers are invalid', () => {
        const levelNumberAlphaNumeric = '12A'
        const unitNumberSpecialChar = '#12'
        expect(validateNoNonNumerical(levelNumberAlphaNumeric)).toEqual(false)
        expect(validateNoNonNumerical(unitNumberSpecialChar)).toEqual(false)
      })
    })
    describe('invalid level and unit numbers', () => {
      it('should return error if unit and level numbers are either or populated', () => {
        const unitLevelCombo1 = {
          levelNo: '1',
          unitNo: '',
        }
        const unitLevelCombo2 = {
          levelNo: '',
          unitNo: '24',
        }
        expect(
          validateLevelUnit(unitLevelCombo1.levelNo, unitLevelCombo1.unitNo),
        ).toEqual(true)
        expect(
          validateLevelUnit(unitLevelCombo1.unitNo, unitLevelCombo1.levelNo),
        ).toEqual(false)
        expect(
          validateLevelUnit(unitLevelCombo2.levelNo, unitLevelCombo2.unitNo),
        ).toEqual(false)
      })
    })
  })
})
