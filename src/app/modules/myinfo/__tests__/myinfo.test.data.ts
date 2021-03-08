import {
  IPerson,
  MyInfoAddressType,
  MyInfoDataClassification,
  MyInfoSource,
  MyInfoVehicle,
} from '@opengovsg/myinfo-gov-client'

export const MYINFO_MOBILENO_AVAILABLE: IPerson = {
  mobileno: {
    areacode: { value: '65' },
    prefix: { value: '+' },
    lastupdated: '2017-12-13',
    source: MyInfoSource.GovtVerified,
    classification: MyInfoDataClassification.Confidential,
    nbr: { value: '97324992' },
  },
}

export const MYINFO_MOBILENO_UNAVAILABLE: IPerson = {
  mobileno: {
    lastupdated: '2017-12-13',
    source: MyInfoSource.GovtVerified,
    classification: MyInfoDataClassification.Confidential,
    unavailable: true,
  },
}

export const MYINFO_REGADD_AVAILABLE: IPerson = {
  regadd: {
    type: MyInfoAddressType.Singapore,
    country: { code: 'SG', desc: 'SINGAPORE' },
    unit: { value: '128' },
    street: { value: 'BEDOK NORTH AVENUE 1' },
    lastupdated: '2016-03-11',
    block: { value: '548' },
    source: MyInfoSource.GovtVerified,
    postal: { value: '460548' },
    classification: MyInfoDataClassification.Confidential,
    floor: { value: '09' },
    building: { value: '' },
  },
}

export const MYINFO_REGADD_NA: IPerson = {
  regadd: {
    source: MyInfoSource.NotApplicable,
  },
}

export const MYINFO_REGADD_UNAVAILABLE: IPerson = {
  regadd: {
    lastupdated: '2016-03-11',
    source: MyInfoSource.GovtVerified,
    classification: MyInfoDataClassification.Confidential,
    unavailable: true,
  },
}

export const MYINFO_VEHNO_AVAILABLE: IPerson = {
  vehicles: [
    {
      lastupdated: '2016-03-11',
      source: MyInfoSource.GovtVerified,
      classification: MyInfoDataClassification.Confidential,
      vehicleno: { value: 'mockVehicleNo1' },
    } as MyInfoVehicle,
    {
      lastupdated: '2016-03-11',
      source: MyInfoSource.GovtVerified,
      classification: MyInfoDataClassification.Confidential,
      vehicleno: { value: 'mockVehicleNo2' },
    } as MyInfoVehicle,
  ],
}

export const MYINFO_VEHNO_UNAVAILABLE: IPerson = {
  vehicles: [
    {
      lastupdated: '2016-03-11',
      source: MyInfoSource.GovtVerified,
      classification: MyInfoDataClassification.Confidential,
      unavailable: true,
    },
  ],
}

export const MYINFO_OCCUPATION_CODE: IPerson = {
  occupation: {
    lastupdated: '2016-03-11',
    source: MyInfoSource.GovtVerified,
    classification: MyInfoDataClassification.Confidential,
    code: 'occupationCode',
    desc: 'occupationDesc',
  },
}

export const MYINFO_OCCUPATION_VALUE: IPerson = {
  occupation: {
    lastupdated: '2016-03-11',
    source: MyInfoSource.UserProvided,
    classification: MyInfoDataClassification.Confidential,
    value: 'occupationValue',
  },
}

export const MYINFO_OCCUPATION_UNAVAILABLE: IPerson = {
  occupation: {
    lastupdated: '2016-03-11',
    source: MyInfoSource.GovtVerified,
    classification: MyInfoDataClassification.Confidential,
    unavailable: true,
  },
}

export const MYINFO_DESCRIPTION_NA: IPerson = {
  residentialstatus: {
    source: MyInfoSource.NotApplicable,
  },
}

export const MYINFO_DESCRIPTION_AVAILABLE: IPerson = {
  sex: {
    lastupdated: '2016-03-11',
    source: MyInfoSource.GovtVerified,
    classification: MyInfoDataClassification.Confidential,
    code: 'sexCode',
    desc: 'sexDesc',
  },
}

export const MYINFO_DESCRIPTION_UNAVAILABLE: IPerson = {
  sex: {
    lastupdated: '2016-03-11',
    source: MyInfoSource.GovtVerified,
    classification: MyInfoDataClassification.Confidential,
    unavailable: true,
  },
}

export const MYINFO_PASSSTATUS_AVAILABLE: IPerson = {
  passstatus: {
    lastupdated: '2016-03-11',
    source: MyInfoSource.GovtVerified,
    classification: MyInfoDataClassification.Confidential,
    value: 'Live',
  },
}

export const MYINFO_PASSSTATUS_NA: IPerson = {
  passstatus: {
    source: MyInfoSource.NotApplicable,
  },
}

export const MYINFO_PASSSTATUS_UNAVAILABLE: IPerson = {
  passstatus: {
    lastupdated: '2016-03-11',
    source: MyInfoSource.GovtVerified,
    classification: MyInfoDataClassification.Confidential,
    unavailable: true,
  },
}

export const MYINFO_BASIC_AVAILABLE: IPerson = {
  name: {
    lastupdated: '2016-03-11',
    source: MyInfoSource.GovtVerified,
    classification: MyInfoDataClassification.Confidential,
    value: 'name',
  },
}

export const MYINFO_BASIC_NA: IPerson = {
  divorcedate: {
    source: MyInfoSource.NotApplicable,
  },
}

export const MYINFO_BASIC_UNAVAILABLE: IPerson = {
  name: {
    lastupdated: '2016-03-11',
    source: MyInfoSource.GovtVerified,
    classification: MyInfoDataClassification.Confidential,
    unavailable: true,
  },
}
