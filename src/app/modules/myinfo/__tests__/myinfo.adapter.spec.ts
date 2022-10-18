import {
  IPerson,
  IPersonResponse,
  MyInfoVehicleFull,
} from '@opengovsg/myinfo-gov-client'
import type { SetRequired } from 'type-fest'

import { MyInfoAttribute } from '../../../../../shared/types'
import { MyInfoData } from '../myinfo.adapter'

import { MOCK_UINFIN } from './myinfo.test.constants'
import {
  MYINFO_BASIC_AVAILABLE,
  MYINFO_BASIC_NA,
  MYINFO_BASIC_UNAVAILABLE,
  MYINFO_DESCRIPTION_AVAILABLE,
  MYINFO_DESCRIPTION_NA,
  MYINFO_DESCRIPTION_UNAVAILABLE,
  MYINFO_MOBILENO_AVAILABLE,
  MYINFO_MOBILENO_UNAVAILABLE,
  MYINFO_OCCUPATION_CODE,
  MYINFO_OCCUPATION_UNAVAILABLE,
  MYINFO_OCCUPATION_VALUE,
  MYINFO_PASSSTATUS_AVAILABLE,
  MYINFO_PASSSTATUS_NA,
  MYINFO_PASSSTATUS_UNAVAILABLE,
  MYINFO_REGADD_AVAILABLE,
  MYINFO_REGADD_NA,
  MYINFO_REGADD_UNAVAILABLE,
  MYINFO_VEHNO_AVAILABLE,
  MYINFO_VEHNO_UNAVAILABLE,
} from './myinfo.test.data'

describe('myinfo.adapter', () => {
  describe('MyInfoData', () => {
    describe('getFieldValueForAttr', () => {
      describe('Phone numbers', () => {
        it('should return empty string and readonly as false when key is not present', () => {
          const response: IPersonResponse = {
            uinFin: MOCK_UINFIN,
            data: {},
          }
          const myInfoData = new MyInfoData(response)

          // Act
          const actual = myInfoData.getFieldValueForAttr(
            MyInfoAttribute.MobileNo,
          )

          // Assert
          expect(actual.fieldValue).toEqual('')
          expect(actual.isReadOnly).toEqual(false)
        })

        it('should return empty string and readonly as false when data is unavailable', () => {
          const response: IPersonResponse = {
            uinFin: MOCK_UINFIN,
            data: MYINFO_MOBILENO_UNAVAILABLE,
          }
          const myInfoData = new MyInfoData(response)

          // Act
          const actual = myInfoData.getFieldValueForAttr(
            MyInfoAttribute.MobileNo,
          )

          // Assert
          expect(actual.fieldValue).toEqual('')
          expect(actual.isReadOnly).toEqual(false)
        })

        it('should correctly return formatted mobile phone numbers if valid', () => {
          // Arrange
          // code: '65',
          // prefix: '+',
          // nbr: '97324992',
          const expected = '+65 97324992'
          const response: IPersonResponse = {
            uinFin: MOCK_UINFIN,
            data: MYINFO_MOBILENO_AVAILABLE,
          }
          const myInfoData = new MyInfoData(response)
          // Act
          const actual = myInfoData.getFieldValueForAttr(
            MyInfoAttribute.MobileNo,
          )

          // Assert
          expect(actual.fieldValue).toEqual(expected)
          expect(actual.isReadOnly).toEqual(true)
        })
      })

      describe('Addresses', () => {
        it('should return empty string and readonly as false when key is not present', () => {
          const response: IPersonResponse = {
            uinFin: MOCK_UINFIN,
            data: {},
          }
          const myInfoData = new MyInfoData(response)

          // Act
          const actual = myInfoData.getFieldValueForAttr(
            MyInfoAttribute.RegisteredAddress,
          )

          // Assert
          expect(actual.fieldValue).toEqual('')
          expect(actual.isReadOnly).toEqual(false)
        })

        it('should return empty string and readonly as false when data is not applicable', () => {
          const response: IPersonResponse = {
            uinFin: MOCK_UINFIN,
            data: MYINFO_REGADD_NA,
          }
          const myInfoData = new MyInfoData(response)

          // Act
          const actual = myInfoData.getFieldValueForAttr(
            MyInfoAttribute.RegisteredAddress,
          )

          // Assert
          expect(actual.fieldValue).toEqual('')
          expect(actual.isReadOnly).toEqual(false)
        })

        it('should return empty string and readonly as false when data is unavailable', () => {
          const response: IPersonResponse = {
            uinFin: MOCK_UINFIN,
            data: MYINFO_REGADD_UNAVAILABLE,
          }
          const myInfoData = new MyInfoData(response)

          // Act
          const actual = myInfoData.getFieldValueForAttr(
            MyInfoAttribute.RegisteredAddress,
          )

          // Assert
          expect(actual.fieldValue).toEqual('')
          expect(actual.isReadOnly).toEqual(false)
        })

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
            uinFin: MOCK_UINFIN,
            data: MYINFO_REGADD_AVAILABLE,
          }
          const myInfoData = new MyInfoData(response)
          // Act
          const actual = myInfoData.getFieldValueForAttr(
            MyInfoAttribute.RegisteredAddress,
          )

          // Assert
          expect(actual.fieldValue).toEqual(expected)
          expect(actual.isReadOnly).toEqual(true)
        })
      })

      describe('Vehicle numbers', () => {
        it('should return empty string and readonly as false when key is not present', () => {
          const response: IPersonResponse = {
            uinFin: MOCK_UINFIN,
            data: {},
          }
          const myInfoData = new MyInfoData(response)

          // Act
          const actual = myInfoData.getFieldValueForAttr(
            MyInfoAttribute.VehicleNo,
          )

          // Assert
          expect(actual.fieldValue).toEqual('')
          expect(actual.isReadOnly).toEqual(false)
        })

        it('should return empty string and readonly as false when data is unavailable', () => {
          const response: IPersonResponse = {
            uinFin: MOCK_UINFIN,
            data: MYINFO_VEHNO_UNAVAILABLE,
          }
          const myInfoData = new MyInfoData(response)

          // Act
          const actual = myInfoData.getFieldValueForAttr(
            MyInfoAttribute.VehicleNo,
          )

          // Assert
          expect(actual.fieldValue).toEqual('')
          expect(actual.isReadOnly).toEqual(false)
        })

        it('should correctly return single vehicle numbers', () => {
          // Grab first vehicle number
          const expected = (
            MYINFO_VEHNO_AVAILABLE.vehicles![0] as SetRequired<
              MyInfoVehicleFull,
              'vehicleno'
            >
          ).vehicleno.value
          const response: IPersonResponse = {
            uinFin: MOCK_UINFIN,
            data: {
              vehicles: [MYINFO_VEHNO_AVAILABLE.vehicles![0]],
            },
          }
          const myInfoData = new MyInfoData(response)
          // Act
          const actual = myInfoData.getFieldValueForAttr(
            MyInfoAttribute.VehicleNo,
          )

          // Assert
          expect(actual.fieldValue).toEqual(expected)
          expect(actual.isReadOnly).toEqual(false)
        })

        it('should correctly return multiple vehicle numbers', () => {
          // Join all vehicle numbers
          const expected = MYINFO_VEHNO_AVAILABLE.vehicles!.map(
            (vehicle) =>
              (vehicle as SetRequired<MyInfoVehicleFull, 'vehicleno'>).vehicleno
                .value,
          ).join(', ')
          const response: IPersonResponse = {
            uinFin: MOCK_UINFIN,
            data: MYINFO_VEHNO_AVAILABLE,
          }
          const myInfoData = new MyInfoData(response)
          // Act
          const actual = myInfoData.getFieldValueForAttr(
            MyInfoAttribute.VehicleNo,
          )

          // Assert
          expect(actual.fieldValue).toEqual(expected)
          expect(actual.isReadOnly).toEqual(false)
        })
      })

      describe('Occupation', () => {
        it('should return empty string and readonly as false when key is not present', () => {
          const response: IPersonResponse = {
            uinFin: MOCK_UINFIN,
            data: {},
          }
          const myInfoData = new MyInfoData(response)

          // Act
          const actual = myInfoData.getFieldValueForAttr(
            MyInfoAttribute.Occupation,
          )

          // Assert
          expect(actual.fieldValue).toEqual('')
          expect(actual.isReadOnly).toEqual(false)
        })

        it('should return empty string and readonly as false when data is unavailable', () => {
          const response: IPersonResponse = {
            uinFin: MOCK_UINFIN,
            data: MYINFO_OCCUPATION_UNAVAILABLE,
          }
          const myInfoData = new MyInfoData(response)

          // Act
          const actual = myInfoData.getFieldValueForAttr(
            MyInfoAttribute.Occupation,
          )

          // Assert
          expect(actual.fieldValue).toEqual('')
          expect(actual.isReadOnly).toEqual(false)
        })

        it('should correctly return value and readonly as true when occupation is given as code', () => {
          const expected = (MYINFO_OCCUPATION_CODE.occupation as any).desc
          const response: IPersonResponse = {
            uinFin: MOCK_UINFIN,
            data: MYINFO_OCCUPATION_CODE,
          }
          const myInfoData = new MyInfoData(response)
          // Act
          const actual = myInfoData.getFieldValueForAttr(
            MyInfoAttribute.Occupation,
          )

          // Assert
          expect(actual.fieldValue).toEqual(expected)
          expect(actual.isReadOnly).toEqual(true)
        })

        it('should correctly return value and readonly as false when occupation is user-provided', () => {
          const expected = (MYINFO_OCCUPATION_VALUE as any).occupation.value
          const response: IPersonResponse = {
            uinFin: MOCK_UINFIN,
            data: MYINFO_OCCUPATION_VALUE,
          }
          const myInfoData = new MyInfoData(response)
          // Act
          const actual = myInfoData.getFieldValueForAttr(
            MyInfoAttribute.Occupation,
          )

          // Assert
          expect(actual.fieldValue).toEqual(expected)
          expect(actual.isReadOnly).toEqual(false)
        })
      })

      describe('Code/description fields', () => {
        it('should return empty string and readonly as false when key is not present', () => {
          const response: IPersonResponse = {
            uinFin: MOCK_UINFIN,
            data: {},
          }
          const myInfoData = new MyInfoData(response)

          // Act
          const actual = myInfoData.getFieldValueForAttr(
            MyInfoAttribute.ResidentialStatus,
          )

          // Assert
          expect(actual.fieldValue).toEqual('')
          expect(actual.isReadOnly).toEqual(false)
        })

        it('should return empty string and readonly as false when data is unavailable', () => {
          const response: IPersonResponse = {
            uinFin: MOCK_UINFIN,
            data: MYINFO_DESCRIPTION_UNAVAILABLE,
          }
          const myInfoData = new MyInfoData(response)

          // Act
          const actual = myInfoData.getFieldValueForAttr(MyInfoAttribute.Sex)

          // Assert
          expect(actual.fieldValue).toEqual('')
          expect(actual.isReadOnly).toEqual(false)
        })

        it('should return empty string and readonly as false when data is not applicable', () => {
          const response: IPersonResponse = {
            uinFin: MOCK_UINFIN,
            data: MYINFO_DESCRIPTION_NA,
          }
          const myInfoData = new MyInfoData(response)
          // Act
          const actual = myInfoData.getFieldValueForAttr(
            MyInfoAttribute.ResidentialStatus,
          )

          // Assert
          expect(actual.fieldValue).toEqual('')
          expect(actual.isReadOnly).toEqual(false)
        })

        it('should correctly return value and readonly as true when data is present and verified', () => {
          const expected = (MYINFO_DESCRIPTION_AVAILABLE as any).sex.desc
          const response: IPersonResponse = {
            uinFin: MOCK_UINFIN,
            data: MYINFO_DESCRIPTION_AVAILABLE,
          }
          const myInfoData = new MyInfoData(response)
          // Act
          const actual = myInfoData.getFieldValueForAttr(MyInfoAttribute.Sex)

          // Assert
          expect(actual.fieldValue).toEqual(expected)
          expect(actual.isReadOnly).toEqual(true)
        })
      })

      describe('Workpass status', () => {
        it('should return empty string and readonly as false when key is not present', () => {
          const response: IPersonResponse = {
            uinFin: MOCK_UINFIN,
            data: {},
          }
          const myInfoData = new MyInfoData(response)

          // Act
          const actual = myInfoData.getFieldValueForAttr(
            MyInfoAttribute.WorkpassStatus,
          )

          // Assert
          expect(actual.fieldValue).toEqual('')
          expect(actual.isReadOnly).toEqual(false)
        })

        it('should return empty string and readonly as false when data is unavailable', () => {
          const response: IPersonResponse = {
            uinFin: MOCK_UINFIN,
            data: MYINFO_PASSSTATUS_UNAVAILABLE,
          }
          const myInfoData = new MyInfoData(response)

          // Act
          const actual = myInfoData.getFieldValueForAttr(
            MyInfoAttribute.WorkpassStatus,
          )

          // Assert
          expect(actual.fieldValue).toEqual('')
          expect(actual.isReadOnly).toEqual(false)
        })

        it('should return empty string and readonly as false when data is not applicable', () => {
          const response: IPersonResponse = {
            uinFin: MOCK_UINFIN,
            data: MYINFO_PASSSTATUS_NA,
          }
          const myInfoData = new MyInfoData(response)
          // Act
          const actual = myInfoData.getFieldValueForAttr(
            MyInfoAttribute.WorkpassStatus,
          )

          // Assert
          expect(actual.fieldValue).toEqual('')
          expect(actual.isReadOnly).toEqual(false)
        })

        it('should correctly return value and readonly as true when data is present and verified', () => {
          const expected = (MYINFO_PASSSTATUS_AVAILABLE as any).passstatus.value
          const response: IPersonResponse = {
            uinFin: MOCK_UINFIN,
            data: MYINFO_PASSSTATUS_AVAILABLE,
          }
          const myInfoData = new MyInfoData(response)
          // Act
          const actual = myInfoData.getFieldValueForAttr(
            MyInfoAttribute.WorkpassStatus,
          )

          // Assert
          expect(actual.fieldValue).toEqual(expected)
          expect(actual.isReadOnly).toEqual(true)
        })

        it('should correctly convert value to TitleCase', () => {
          const expected = (MYINFO_PASSSTATUS_AVAILABLE as any).passstatus
            .value as string
          const uppercasedData = {
            passstatus: {
              ...MYINFO_PASSSTATUS_AVAILABLE.passstatus!,
              value: expected.toUpperCase(),
            },
          } as IPerson
          const response: IPersonResponse = {
            uinFin: MOCK_UINFIN,
            data: uppercasedData,
          }
          const myInfoData = new MyInfoData(response)
          // Act
          const actual = myInfoData.getFieldValueForAttr(
            MyInfoAttribute.WorkpassStatus,
          )

          // Assert
          expect(actual.fieldValue).toEqual(expected)
          expect(actual.isReadOnly).toEqual(true)
        })
      })

      describe('Basic value fields', () => {
        it('should return empty string and readonly as false when key is not present', () => {
          const response: IPersonResponse = {
            uinFin: MOCK_UINFIN,
            data: {},
          }
          const myInfoData = new MyInfoData(response)

          // Act
          const actual = myInfoData.getFieldValueForAttr(MyInfoAttribute.Name)

          // Assert
          expect(actual.fieldValue).toEqual('')
          expect(actual.isReadOnly).toEqual(false)
        })

        it('should return empty string and readonly as false when data is unavailable', () => {
          const response: IPersonResponse = {
            uinFin: MOCK_UINFIN,
            data: MYINFO_BASIC_UNAVAILABLE,
          }
          const myInfoData = new MyInfoData(response)

          // Act
          const actual = myInfoData.getFieldValueForAttr(MyInfoAttribute.Name)

          // Assert
          expect(actual.fieldValue).toEqual('')
          expect(actual.isReadOnly).toEqual(false)
        })

        it('should return empty string and readonly as false when data is not applicable', () => {
          const response: IPersonResponse = {
            uinFin: MOCK_UINFIN,
            data: MYINFO_BASIC_NA,
          }
          const myInfoData = new MyInfoData(response)
          // Act
          const actual = myInfoData.getFieldValueForAttr(
            MyInfoAttribute.DivorceDate,
          )

          // Assert
          expect(actual.fieldValue).toEqual('')
          expect(actual.isReadOnly).toEqual(false)
        })

        it('should correctly return value and readonly as true when data is present and verified', () => {
          const expected = (MYINFO_BASIC_AVAILABLE as any).name.value
          const response: IPersonResponse = {
            uinFin: MOCK_UINFIN,
            data: MYINFO_BASIC_AVAILABLE,
          }
          const myInfoData = new MyInfoData(response)
          // Act
          const actual = myInfoData.getFieldValueForAttr(MyInfoAttribute.Name)

          // Assert
          expect(actual.fieldValue).toEqual(expected)
          expect(actual.isReadOnly).toEqual(true)
        })
      })
    })
  })
})
