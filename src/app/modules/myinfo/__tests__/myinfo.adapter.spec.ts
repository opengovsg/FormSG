import { IPerson, IPersonResponse } from '@opengovsg/myinfo-gov-client'

import { MyInfoAttribute } from 'src/types'

import { MyInfoData } from '../myinfo.adapter'

import { MOCK_MYINFO_FORMAT_DATA } from './myinfo.test.constants'

const MOCK_UIN_FIN = 'S9912370B'

describe('myinfo.adapter', () => {
  describe('MyInfoData', () => {
    describe('getFieldValueForAttr', () => {
      it('should return empty string and readonly as false if valid myInfoAttr does not exist in valid myInfoData', () => {
        // Arrange
        const response: IPersonResponse = {
          uinFin: MOCK_UIN_FIN,
          data: {},
        }
        const myInfoData = new MyInfoData(response)

        // Act
        const actual = myInfoData.getFieldValueForAttr(
          MyInfoAttribute.WorkpassExpiryDate,
        )

        // Assert
        expect(actual).toEqual({
          fieldValue: '',
          isReadOnly: false,
        })
      })

      it('should correctly return attr.value', () => {
        const response: IPersonResponse = {
          uinFin: MOCK_UIN_FIN,
          data: MOCK_MYINFO_FORMAT_DATA as IPerson,
        }
        const myInfoData = new MyInfoData(response)
        // Act
        const actual = myInfoData.getFieldValueForAttr(
          MyInfoAttribute.WorkpassExpiryDate,
        )

        // Assert
        expect(actual.fieldValue).toEqual(
          MOCK_MYINFO_FORMAT_DATA.passexpirydate.value,
        )
      })

      describe('Phone numbers', () => {
        it('should correctly return formatted mobile phone numbers if valid', () => {
          // Arrange
          // code: '65',
          // prefix: '+',
          // nbr: '97324992',
          const expected = '+65 97324992'
          const response: IPersonResponse = {
            uinFin: MOCK_UIN_FIN,
            data: MOCK_MYINFO_FORMAT_DATA as IPerson,
          }
          const myInfoData = new MyInfoData(response)
          // Act
          const actual = myInfoData.getFieldValueForAttr(
            MyInfoAttribute.MobileNo,
          )

          // Assert
          expect(actual.fieldValue).toEqual(expected)
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
          const response: IPersonResponse = {
            uinFin: MOCK_UIN_FIN,
            data: MOCK_MYINFO_FORMAT_DATA as IPerson,
          }
          const myInfoData = new MyInfoData(response)
          // Act
          const actual = myInfoData.getFieldValueForAttr(
            MyInfoAttribute.RegisteredAddress,
          )

          // Assert
          expect(actual.fieldValue).toEqual(expected)
        })
      })
    })
  })
})
