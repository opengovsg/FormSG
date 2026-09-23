import {
  IPerson,
  IPersonResponse,
  MyInfoAttribute as ExternalAttr,
  MyInfoVehicleFull,
} from '@opengovsg/myinfo-gov-client'
import {
  FormResponseMode,
  MyInfoAttribute,
  MyInfoChildAttributes,
  MyInfoChildrenScope,
  MyInfoChildVaxxStatus,
} from 'formsg-shared/types'
import type { SetRequired } from 'type-fest'

import {
  internalAttrListToScopes,
  internalAttrToSponsoredChildScope,
  MyInfoData,
} from '../myinfo.adapter'
import { shouldFetchSponsoredChildren } from '../myinfo.util'

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

const ALL_CHILD_ATTRS = [
  MyInfoAttribute.ChildName,
  MyInfoAttribute.ChildBirthCertNo,
  MyInfoAttribute.ChildDateOfBirth,
  MyInfoAttribute.ChildVaxxStatus,
  MyInfoAttribute.ChildGender,
  MyInfoAttribute.ChildRace,
  MyInfoAttribute.ChildSecondaryRace,
  MyInfoAttribute.ChildType,
]

const META = { source: '1', classification: 'C', lastupdated: '2024-01-01' }

const BIRTH_RECORD = {
  ...META,
  name: { value: 'LOCAL CHILD' },
  birthcertno: { value: 'T1234567A' },
  dob: { value: '2015-01-02' },
  sex: { code: 'F', desc: 'FEMALE' },
  race: { code: 'CN', desc: 'CHINESE' },
  secondaryrace: { code: 'MY', desc: 'MALAY' },
  vaccinationrequirements: [
    { requirement: { code: '1M3D', desc: '' }, fulfilled: { value: true } },
  ],
}

const SPONSORED_RECORD = {
  ...META,
  nric: { value: 'T2345678B' },
  name: { value: 'SPONSORED CHILD' },
  dob: { value: '2016-03-04' },
  sex: { code: 'M', desc: 'MALE' },
  race: { code: 'IN', desc: 'INDIAN' },
  secondaryrace: { code: 'CN', desc: 'CHINESE' },
  vaccinationrequirements: [
    { requirement: { code: '1M3D', desc: '' }, fulfilled: { value: false } },
  ],
}

const toPersonResponse = (data: Record<string, unknown>): IPersonResponse => ({
  uinFin: MOCK_UINFIN,
  data: data as unknown as IPerson,
})

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
          const expected = '+6597324992'
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

    describe('getChildrenBirthRecords', () => {
      it('should append sponsored children after birth records and label scopes', () => {
        const data = new MyInfoData(
          toPersonResponse({
            childrenbirthrecords: [BIRTH_RECORD],
            sponsoredchildrenrecords: [SPONSORED_RECORD],
          }),
        )

        const result = data.getChildrenBirthRecords(ALL_CHILD_ATTRS)

        expect(result).toEqual({
          [MyInfoChildAttributes.ChildName]: ['LOCAL CHILD', 'SPONSORED CHILD'],
          // Sponsored children use their NRIC in place of a birth cert number.
          [MyInfoChildAttributes.ChildBirthCertNo]: ['T1234567A', 'T2345678B'],
          [MyInfoChildAttributes.ChildDateOfBirth]: [
            '2015-01-02',
            '2016-03-04',
          ],
          [MyInfoChildAttributes.ChildVaxxStatus]: [
            MyInfoChildVaxxStatus.ONEM3D_FULFILLED,
            MyInfoChildVaxxStatus.ONEM3D_NOT_FULFILLED,
          ],
          [MyInfoChildAttributes.ChildGender]: ['FEMALE', 'MALE'],
          [MyInfoChildAttributes.ChildRace]: ['CHINESE', 'INDIAN'],
          [MyInfoChildAttributes.ChildSecondaryRace]: ['MALAY', 'CHINESE'],
          [MyInfoChildAttributes.ChildType]: ['LOCAL', 'SPONSORED'],
          scopes: [MyInfoChildrenScope.Local, MyInfoChildrenScope.Sponsored],
        })
      })

      it('should fill the child type column for every record, including blank ones', () => {
        const data = new MyInfoData(
          toPersonResponse({
            childrenbirthrecords: [BIRTH_RECORD],
            sponsoredchildrenrecords: [{ source: '3' }],
          }),
        )

        const result = data.getChildrenBirthRecords([
          MyInfoAttribute.ChildName,
          MyInfoAttribute.ChildType,
        ])

        expect(result).toEqual({
          [MyInfoChildAttributes.ChildName]: ['LOCAL CHILD', ''],
          [MyInfoChildAttributes.ChildType]: ['LOCAL', 'SPONSORED'],
          scopes: [MyInfoChildrenScope.Local, MyInfoChildrenScope.Sponsored],
        })
      })

      it('should return sponsored children when there are no birth records', () => {
        const data = new MyInfoData(
          toPersonResponse({
            sponsoredchildrenrecords: [SPONSORED_RECORD],
          }),
        )

        const result = data.getChildrenBirthRecords([
          MyInfoAttribute.ChildName,
          MyInfoAttribute.ChildBirthCertNo,
        ])

        expect(result).toEqual({
          [MyInfoChildAttributes.ChildName]: ['SPONSORED CHILD'],
          [MyInfoChildAttributes.ChildBirthCertNo]: ['T2345678B'],
          scopes: [MyInfoChildrenScope.Sponsored],
        })
      })

      it('should keep birth-record-only behaviour when there are no sponsored records', () => {
        const data = new MyInfoData(
          toPersonResponse({
            childrenbirthrecords: [BIRTH_RECORD],
          }),
        )

        const result = data.getChildrenBirthRecords([MyInfoAttribute.ChildName])

        expect(result).toEqual({
          [MyInfoChildAttributes.ChildName]: ['LOCAL CHILD'],
          scopes: [MyInfoChildrenScope.Local],
        })
      })

      it('should emit blank values for not-applicable and NRIC-only sponsored records', () => {
        const data = new MyInfoData(
          toPersonResponse({
            childrenbirthrecords: [],
            sponsoredchildrenrecords: [
              { source: '3' },
              { ...META, nric: { value: 'T3456789C' } },
            ],
          }),
        )

        const result = data.getChildrenBirthRecords([
          MyInfoAttribute.ChildName,
          MyInfoAttribute.ChildBirthCertNo,
          MyInfoAttribute.ChildGender,
        ])

        expect(result).toEqual({
          [MyInfoChildAttributes.ChildName]: ['', ''],
          [MyInfoChildAttributes.ChildBirthCertNo]: ['', 'T3456789C'],
          [MyInfoChildAttributes.ChildGender]: ['', ''],
          scopes: [
            MyInfoChildrenScope.Sponsored,
            MyInfoChildrenScope.Sponsored,
          ],
        })
      })

      it('should return undefined when neither children data item is present', () => {
        const data = new MyInfoData(toPersonResponse({}))

        expect(data.getChildrenBirthRecords(ALL_CHILD_ATTRS)).toBeUndefined()
      })
    })
  })

  describe('internalAttrToSponsoredChildScope', () => {
    it('should map every child sub-field, using nric for birth cert number', () => {
      expect(internalAttrToSponsoredChildScope(MyInfoAttribute.ChildName)).toBe(
        'sponsoredchildrenrecords.name',
      )
      expect(
        internalAttrToSponsoredChildScope(MyInfoAttribute.ChildDateOfBirth),
      ).toBe('sponsoredchildrenrecords.dob')
      expect(
        internalAttrToSponsoredChildScope(MyInfoAttribute.ChildVaxxStatus),
      ).toBe('sponsoredchildrenrecords.vaccinationrequirements')
      expect(
        internalAttrToSponsoredChildScope(MyInfoAttribute.ChildGender),
      ).toBe('sponsoredchildrenrecords.sex')
      expect(internalAttrToSponsoredChildScope(MyInfoAttribute.ChildRace)).toBe(
        'sponsoredchildrenrecords.race',
      )
      expect(
        internalAttrToSponsoredChildScope(MyInfoAttribute.ChildSecondaryRace),
      ).toBe('sponsoredchildrenrecords.secondaryrace')
      expect(
        internalAttrToSponsoredChildScope(MyInfoAttribute.ChildBirthCertNo),
      ).toBe('sponsoredchildrenrecords.nric')
    })

    it('should return undefined for non-child attributes', () => {
      expect(
        internalAttrToSponsoredChildScope(MyInfoAttribute.Name),
      ).toBeUndefined()
    })

    it('should return undefined for the derived child type sub-field', () => {
      expect(
        internalAttrToSponsoredChildScope(MyInfoAttribute.ChildType),
      ).toBeUndefined()
    })
  })

  describe('internalAttrListToScopes', () => {
    const WITH_SPONSORED = { includeSponsoredChildren: true }

    it('should request the sponsored scope alongside each birth-record child scope when enabled', () => {
      const scopes = internalAttrListToScopes(
        [MyInfoAttribute.ChildName, MyInfoAttribute.ChildDateOfBirth],
        WITH_SPONSORED,
      )

      expect(scopes).toEqual(
        expect.arrayContaining([
          'childrenbirthrecords.name',
          'sponsoredchildrenrecords.name',
          'childrenbirthrecords.dob',
          'sponsoredchildrenrecords.dob',
          ExternalAttr.UinFin,
        ]),
      )
    })

    it('should not request any sponsored scope by default (v1 forms cannot record child provenance)', () => {
      const scopes = internalAttrListToScopes([
        MyInfoAttribute.ChildName,
        MyInfoAttribute.ChildDateOfBirth,
        MyInfoAttribute.ChildBirthCertNo,
      ])

      expect(scopes).toEqual(
        expect.arrayContaining([
          'childrenbirthrecords.name',
          'childrenbirthrecords.dob',
          'childrenbirthrecords.birthcertno',
          // MockPass-compatibility compound scope added under NODE_ENV=test.
          ExternalAttr.ChildrenBirthRecords,
          ExternalAttr.UinFin,
        ]),
      )
      expect(
        scopes.some((s) => s.startsWith(ExternalAttr.SponsoredChildrenRecords)),
      ).toBe(false)
    })

    it('should not request any sponsored scope when explicitly disabled', () => {
      const scopes = internalAttrListToScopes([MyInfoAttribute.ChildName], {
        includeSponsoredChildren: false,
      })

      expect(
        scopes.some((s) => s.startsWith(ExternalAttr.SponsoredChildrenRecords)),
      ).toBe(false)
    })

    it('should request the sponsored nric scope for birth cert number', () => {
      const scopes = internalAttrListToScopes(
        [MyInfoAttribute.ChildBirthCertNo],
        WITH_SPONSORED,
      )

      expect(scopes).toContain('childrenbirthrecords.birthcertno')
      expect(scopes).toContain('sponsoredchildrenrecords.nric')
      expect(scopes).not.toContain('sponsoredchildrenrecords.birthcertno')
    })

    it('should not request any sponsored scope when no child attribute is requested', () => {
      const scopes = internalAttrListToScopes(
        [MyInfoAttribute.Name, MyInfoAttribute.Sex],
        WITH_SPONSORED,
      )

      expect(
        scopes.some((s) => s.startsWith(ExternalAttr.SponsoredChildrenRecords)),
      ).toBe(false)
    })

    it('should request no extra scope for the derived child type sub-field', () => {
      const scopes = internalAttrListToScopes(
        [MyInfoAttribute.ChildName, MyInfoAttribute.ChildType],
        WITH_SPONSORED,
      )

      expect(scopes.sort()).toEqual(
        internalAttrListToScopes(
          [MyInfoAttribute.ChildName],
          WITH_SPONSORED,
        ).sort(),
      )
    })

    it('should not emit duplicate scopes', () => {
      const scopes = internalAttrListToScopes(
        [MyInfoAttribute.ChildName, MyInfoAttribute.ChildName],
        WITH_SPONSORED,
      )

      expect(scopes).toEqual(Array.from(new Set(scopes)))
    })
  })

  describe('shouldFetchSponsoredChildren', () => {
    it('should only allow Multirespondent forms, whose v4 responses carry a per-child type', () => {
      expect(
        shouldFetchSponsoredChildren(
          { responseMode: FormResponseMode.Multirespondent },
          true,
        ),
      ).toBe(true)
      expect(
        shouldFetchSponsoredChildren(
          { responseMode: FormResponseMode.Encrypt },
          true,
        ),
      ).toBe(false)
      expect(
        shouldFetchSponsoredChildren(
          { responseMode: FormResponseMode.Email },
          true,
        ),
      ).toBe(false)
    })

    it('should stay off for every response mode while the feature flag is off', () => {
      expect(
        shouldFetchSponsoredChildren(
          { responseMode: FormResponseMode.Multirespondent },
          false,
        ),
      ).toBe(false)
      expect(
        shouldFetchSponsoredChildren(
          { responseMode: FormResponseMode.Encrypt },
          false,
        ),
      ).toBe(false)
    })
  })
})
