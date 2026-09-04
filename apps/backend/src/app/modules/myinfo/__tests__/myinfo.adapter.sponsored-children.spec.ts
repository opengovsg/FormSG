import {
  IPerson,
  IPersonResponse,
  MyInfoAttribute as ExternalAttr,
} from '@opengovsg/myinfo-gov-client'
import {
  MyInfoAttribute as InternalAttr,
  MyInfoChildAttributes,
} from 'formsg-shared/types'

import {
  hasBirthRecordOnlyChildAttr,
  internalAttrListToScopes,
  MyInfoData,
} from '../myinfo.adapter'

import { MOCK_UINFIN } from './myinfo.test.constants'

const BIRTH_RECORD_CHILD = {
  name: { value: 'Born Child' },
  birthcertno: { value: 'T1234567A' },
  dob: { value: '2019-04-01' },
  sex: { code: 'F', desc: 'FEMALE' },
  race: { code: 'CN', desc: 'CHINESE' },
  secondaryrace: { code: 'MY', desc: 'MALAY' },
  vaccinationrequirements: [
    { requirement: { code: '1M3D', desc: '1M3D' }, fulfilled: { value: true } },
  ],
}

const SPONSORED_CHILD = {
  nric: { value: 'S9812379B' },
  name: { value: 'Sponsored Child' },
  dob: { value: '2021-08-09' },
  sex: { code: 'M', desc: 'MALE' },
  race: { code: 'IN', desc: 'INDIAN' },
  secondaryrace: { code: 'EU', desc: 'EURASIAN' },
}

const buildPerson = (person: {
  childrenbirthrecords?: unknown[]
  sponsoredchildrenrecords?: unknown[]
}): IPersonResponse =>
  ({ uinFin: MOCK_UINFIN, data: person as IPerson }) as IPersonResponse

const ALL_CHILD_ATTRS_EXCEPT_BIRTH_RECORD_ONLY = [
  InternalAttr.ChildName,
  InternalAttr.ChildDateOfBirth,
  InternalAttr.ChildGender,
  InternalAttr.ChildRace,
  InternalAttr.ChildSecondaryRace,
]

describe('myinfo.adapter sponsored children', () => {
  describe('hasBirthRecordOnlyChildAttr', () => {
    it('should be true only for childbirthcertno and childvaxxstatus', () => {
      expect(
        hasBirthRecordOnlyChildAttr([InternalAttr.ChildBirthCertNo]),
      ).toEqual(true)
      expect(
        hasBirthRecordOnlyChildAttr([InternalAttr.ChildVaxxStatus]),
      ).toEqual(true)
      expect(
        hasBirthRecordOnlyChildAttr(ALL_CHILD_ATTRS_EXCEPT_BIRTH_RECORD_ONLY),
      ).toEqual(false)
      expect(hasBirthRecordOnlyChildAttr([])).toEqual(false)
    })
  })

  describe('internalAttrListToScopes', () => {
    it('should request both birth record and sponsored scopes for a child attribute', () => {
      const scopes = internalAttrListToScopes([InternalAttr.ChildName])

      expect(scopes).toContain(`${ExternalAttr.ChildrenBirthRecords}.name`)
      expect(scopes).toContain(`${ExternalAttr.SponsoredChildrenRecords}.name`)
    })

    it('should request neither when the form has no child attributes', () => {
      const scopes = internalAttrListToScopes([
        InternalAttr.Name,
        InternalAttr.MobileNo,
      ])

      expect(
        scopes.filter((scope) =>
          scope.startsWith(ExternalAttr.ChildrenBirthRecords),
        ),
      ).toEqual([])
      expect(
        scopes.filter((scope) =>
          scope.startsWith(ExternalAttr.SponsoredChildrenRecords),
        ),
      ).toEqual([])
    })

    it('should map every sponsored sub-field the table covers', () => {
      const scopes = internalAttrListToScopes(
        ALL_CHILD_ATTRS_EXCEPT_BIRTH_RECORD_ONLY,
      )

      expect(
        scopes
          .filter((scope) =>
            scope.startsWith(`${ExternalAttr.SponsoredChildrenRecords}.`),
          )
          .sort(),
      ).toEqual(
        [
          `${ExternalAttr.SponsoredChildrenRecords}.name`,
          `${ExternalAttr.SponsoredChildrenRecords}.dob`,
          `${ExternalAttr.SponsoredChildrenRecords}.sex`,
          `${ExternalAttr.SponsoredChildrenRecords}.race`,
          `${ExternalAttr.SponsoredChildrenRecords}.secondaryrace`,
        ].sort(),
      )
    })

    it('should request no sponsored scope when the form collects childbirthcertno', () => {
      const scopes = internalAttrListToScopes([
        InternalAttr.ChildName,
        InternalAttr.ChildBirthCertNo,
      ])

      expect(scopes).toContain(`${ExternalAttr.ChildrenBirthRecords}.name`)
      expect(
        scopes.filter((scope) =>
          scope.startsWith(ExternalAttr.SponsoredChildrenRecords),
        ),
      ).toEqual([])
    })

    it('should request no sponsored scope when the form collects childvaxxstatus', () => {
      const scopes = internalAttrListToScopes([
        InternalAttr.ChildName,
        InternalAttr.ChildVaxxStatus,
      ])

      expect(
        scopes.filter((scope) =>
          scope.startsWith(ExternalAttr.SponsoredChildrenRecords),
        ),
      ).toEqual([])
    })

    it('should not return duplicate scopes', () => {
      const scopes = internalAttrListToScopes([
        InternalAttr.ChildName,
        InternalAttr.ChildrenBirthRecords,
      ])

      expect(scopes).toEqual(Array.from(new Set(scopes)))
    })
  })

  describe('getChildrenBirthRecords', () => {
    it('should read value for name and dob and desc for sex and race', () => {
      const myInfoData = new MyInfoData(
        buildPerson({ sponsoredchildrenrecords: [SPONSORED_CHILD] }),
      )

      const actual = myInfoData.getChildrenBirthRecords([
        ...ALL_CHILD_ATTRS_EXCEPT_BIRTH_RECORD_ONLY,
      ])

      expect(actual).toEqual({
        [MyInfoChildAttributes.ChildName]: ['Sponsored Child'],
        [MyInfoChildAttributes.ChildDateOfBirth]: ['2021-08-09'],
        [MyInfoChildAttributes.ChildGender]: ['MALE'],
        [MyInfoChildAttributes.ChildRace]: ['INDIAN'],
        [MyInfoChildAttributes.ChildSecondaryRace]: ['EURASIAN'],
      })
    })

    it('should yield empty strings for a sponsored child when the form collects childbirthcertno', () => {
      const myInfoData = new MyInfoData(
        buildPerson({
          childrenbirthrecords: [BIRTH_RECORD_CHILD],
          sponsoredchildrenrecords: [SPONSORED_CHILD],
        }),
      )

      const actual = myInfoData.getChildrenBirthRecords([
        InternalAttr.ChildName,
        InternalAttr.ChildBirthCertNo,
      ])

      expect(actual).toEqual({
        [MyInfoChildAttributes.ChildName]: ['Born Child'],
        [MyInfoChildAttributes.ChildBirthCertNo]: ['T1234567A'],
      })
    })

    it('should place birth records at the leading indices and keep every column the same length', () => {
      const myInfoData = new MyInfoData(
        buildPerson({
          childrenbirthrecords: [BIRTH_RECORD_CHILD, BIRTH_RECORD_CHILD],
          sponsoredchildrenrecords: [SPONSORED_CHILD],
        }),
      )

      const actual = myInfoData.getChildrenBirthRecords([
        ...ALL_CHILD_ATTRS_EXCEPT_BIRTH_RECORD_ONLY,
      ])

      expect(actual).toEqual({
        [MyInfoChildAttributes.ChildName]: [
          'Born Child',
          'Born Child',
          'Sponsored Child',
        ],
        [MyInfoChildAttributes.ChildDateOfBirth]: [
          '2019-04-01',
          '2019-04-01',
          '2021-08-09',
        ],
        [MyInfoChildAttributes.ChildGender]: ['FEMALE', 'FEMALE', 'MALE'],
        [MyInfoChildAttributes.ChildRace]: ['CHINESE', 'CHINESE', 'INDIAN'],
        [MyInfoChildAttributes.ChildSecondaryRace]: [
          'MALAY',
          'MALAY',
          'EURASIAN',
        ],
      })
      const lengths = Object.values(actual as Record<string, string[]>).map(
        (column) => column.length,
      )
      expect(new Set(lengths)).toEqual(new Set([3]))
    })

    it('should return only birth records when there are no sponsored children', () => {
      const myInfoData = new MyInfoData(
        buildPerson({ childrenbirthrecords: [BIRTH_RECORD_CHILD] }),
      )

      const actual = myInfoData.getChildrenBirthRecords([
        InternalAttr.ChildName,
      ])

      expect(actual).toEqual({
        [MyInfoChildAttributes.ChildName]: ['Born Child'],
      })
    })

    it('should return undefined when the respondent has neither source', () => {
      const myInfoData = new MyInfoData(buildPerson({}))

      expect(
        myInfoData.getChildrenBirthRecords([InternalAttr.ChildName]),
      ).toBeUndefined()
    })

    it('should return empty columns when both sources are empty arrays', () => {
      const myInfoData = new MyInfoData(
        buildPerson({ childrenbirthrecords: [], sponsoredchildrenrecords: [] }),
      )

      const actual = myInfoData.getChildrenBirthRecords([
        InternalAttr.ChildName,
        InternalAttr.ChildGender,
      ])

      expect(actual).toEqual({
        [MyInfoChildAttributes.ChildName]: [],
        [MyInfoChildAttributes.ChildGender]: [],
      })
    })

    it('should yield empty strings for degenerate sponsored entries', () => {
      const myInfoData = new MyInfoData(
        buildPerson({
          sponsoredchildrenrecords: [
            { source: '3' },
            { nric: { value: 'S1234567D' } },
          ],
        }),
      )

      const actual = myInfoData.getChildrenBirthRecords([
        ...ALL_CHILD_ATTRS_EXCEPT_BIRTH_RECORD_ONLY,
      ])

      expect(actual).toEqual({
        [MyInfoChildAttributes.ChildName]: ['', ''],
        [MyInfoChildAttributes.ChildDateOfBirth]: ['', ''],
        [MyInfoChildAttributes.ChildGender]: ['', ''],
        [MyInfoChildAttributes.ChildRace]: ['', ''],
        [MyInfoChildAttributes.ChildSecondaryRace]: ['', ''],
      })
    })
  })
})
