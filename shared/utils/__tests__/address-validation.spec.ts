import {
  validatePostalCode,
  validateNoSpecialCharacters,
  validateNoNonNumerical,
  validateLevelUnit,
  INVALID_POSTAL_CODE_ERROR,
  INVALID_BLOCK_UNIT_ERROR,
  INVALID_NON_NUMERICAL_ERROR,
  INVALID_LEVEL_UNIT_ERROR,
} from '../address-validation'

describe('address validation utils', () => {
  describe('invalid postal codes', () => {
    it('should return error if postal code is invalid', () => {
      const mockPostalCode1 = '123456a'
      const mockPostalCode2 = '12345'
      const mockPostalCode3 = '12345!'
      expect(validatePostalCode(mockPostalCode1)).toEqual(
        INVALID_POSTAL_CODE_ERROR,
      )
      expect(validatePostalCode(mockPostalCode2)).toEqual(
        INVALID_POSTAL_CODE_ERROR,
      )
      expect(validatePostalCode(mockPostalCode3)).toEqual(
        INVALID_POSTAL_CODE_ERROR,
      )
    })
    describe('invalid block and unit numbers', () => {
      it('should return error if block numbers are invalid', () => {
        const mockBlockNumber = '#12'
        const mockUnitNumber = '-05'
        expect(validateNoSpecialCharacters(mockBlockNumber)).toEqual(
          INVALID_BLOCK_UNIT_ERROR,
        )
        expect(validateNoSpecialCharacters(mockUnitNumber)).toEqual(
          INVALID_BLOCK_UNIT_ERROR,
        )
      })
    })
    describe('invalid level numbers', () => {
      it('should return error if level numbers are invalid', () => {
        const mockLevelNumber1 = '12A'
        const mockLevelNumber2 = '#12'
        expect(validateNoNonNumerical(mockLevelNumber1)).toEqual(
          INVALID_NON_NUMERICAL_ERROR,
        )
        expect(validateNoNonNumerical(mockLevelNumber2)).toEqual(
          INVALID_NON_NUMERICAL_ERROR,
        )
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
        ).toEqual(INVALID_LEVEL_UNIT_ERROR)
        expect(
          validateLevelUnit(unitLevelCombo2.levelNo, unitLevelCombo2.unitNo),
        ).toEqual(INVALID_LEVEL_UNIT_ERROR)
      })
    })
  })
})
