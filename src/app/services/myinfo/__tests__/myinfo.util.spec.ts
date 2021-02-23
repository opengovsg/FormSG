import { IPersonBasic } from '@opengovsg/myinfo-gov-client'
import { cloneDeep } from 'lodash'

import { MyInfoAttribute } from 'src/types'

import { getMyInfoValue } from '../myinfo.util'

import { MOCK_MYINFO_FORMAT_DATA } from './myinfo.test.constants'

describe('myinfo.util', () => {
  describe('getMyInfoValue', () => {
    it('should return empty string if valid myInfoAttr does not exist in invalid myInfoData', () => {
      // Arrange
      const invalidData = {}

      // Act
      const actual = getMyInfoValue(
        'workpassexpirydate' as MyInfoAttribute.WorkpassExpiryDate,
        invalidData as IPersonBasic,
      )

      // Assert
      expect(actual).toEqual('')
    })

    it('should return empty string if invalid myInfoAttr does not exist in valid myInfoData', () => {
      // Act
      const actual = getMyInfoValue(
        'invalid' as MyInfoAttribute,
        (MOCK_MYINFO_FORMAT_DATA as unknown) as IPersonBasic,
      )

      // Assert
      expect(actual).toEqual('')
    })

    it('should correctly return attr.value', () => {
      // Act
      const actual = getMyInfoValue(
        'workpassexpirydate' as MyInfoAttribute.WorkpassExpiryDate,
        (MOCK_MYINFO_FORMAT_DATA as unknown) as IPersonBasic,
      )

      // Assert
      expect(actual).toEqual(MOCK_MYINFO_FORMAT_DATA.workpassexpirydate.value)
    })

    describe('Phone numbers', () => {
      it('should correctly return formatted mobile phone numbers if valid', () => {
        // Arrange
        // code: '65',
        // prefix: '+',
        // nbr: '97324992',
        const expected = '+65 97324992'

        // Act
        const actual = getMyInfoValue(
          'mobileno' as MyInfoAttribute.MobileNo,
          (MOCK_MYINFO_FORMAT_DATA as unknown) as IPersonBasic,
        )

        // Assert
        expect(actual).toEqual(expected)
      })
    })

    describe('Addresses', () => {
      it('should correctly return formatted registered addresses', () => {
        // Arrange
        // unit: '128',
        // street: 'BEDOK NORTH AVENUE 1',
        // block: '548',
        // postal: '460548',
        // floor: '09',
        // building: '',
        const expected = '548 BEDOK NORTH AVENUE 1, #09-128, SINGAPORE 460548'

        // Act
        const actual = getMyInfoValue(
          'regadd' as MyInfoAttribute.RegisteredAddress,
          (MOCK_MYINFO_FORMAT_DATA as unknown) as IPersonBasic,
        )

        // Assert
        expect(actual).toEqual(expected)
      })

      it('should return empty string if address missing one of [block, street, country, postal] keys', () => {
        // Arrange
        const mockAddress = cloneDeep(MOCK_MYINFO_FORMAT_DATA.regadd)
        mockAddress.block = ''

        // Act
        const actual = getMyInfoValue(
          'regadd' as MyInfoAttribute.RegisteredAddress,
          ({
            regAdd: mockAddress,
          } as unknown) as IPersonBasic,
        )

        // Assert
        expect(actual).toEqual('')
      })
    })
  })
})
