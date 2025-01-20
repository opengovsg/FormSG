import {
  validatePostalCode,
  validateNoSpecialCharacters,
  validateNoNonNumerical,
  validateLevelUnit,
} from '../address-validation'

describe('address validation utils', () => {
  describe('invalid postal codes', () => {
    it('should return error if postal code is invalid', () => {
      const mockPostalCode1 = '123456a'
      const mockPostalCode2 = '12345'
      const mockPostalCode3 = '12345!'
      expect(validatePostalCode(mockPostalCode1)).toEqual(false)
      expect(validatePostalCode(mockPostalCode2)).toEqual(false)
      expect(validatePostalCode(mockPostalCode3)).toEqual(false)
    })
    describe('invalid block and unit numbers', () => {
      it('should return error if block numbers are invalid', () => {
        const mockBlockNumber = '#12'
        const mockUnitNumber = '-05'
        expect(validateNoSpecialCharacters(mockBlockNumber)).toEqual(false)
        expect(validateNoSpecialCharacters(mockUnitNumber)).toEqual(false)
      })
    })
    describe('invalid level numbers', () => {
      it('should return error if level numbers are invalid', () => {
        const mockLevelNumber1 = '12A'
        const mockLevelNumber2 = '#12'
        expect(validateNoNonNumerical(mockLevelNumber1)).toEqual(false)
        expect(validateNoNonNumerical(mockLevelNumber2)).toEqual(false)
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
