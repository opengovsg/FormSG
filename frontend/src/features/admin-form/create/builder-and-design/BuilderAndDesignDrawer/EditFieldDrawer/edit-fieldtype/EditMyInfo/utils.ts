import { MyInfoVerifiedType } from '~shared/constants/field/myinfo'
import { MyInfoAttribute, MyInfoField } from '~shared/types'

import { MYINFO_FIELD_CONSTANTS } from '~features/admin-form/create/builder-and-design/constants'
import {
  MyInfoDataSource,
  MyInfoPreviewMeta,
  VerifiedFor,
} from '~features/myinfo/types'

const MYINFO_VERIFICATION_TYPE_MAPPINGS: {
  [K in MyInfoVerifiedType]: VerifiedFor
} = {
  F: VerifiedFor.ForeignersWithSingpass,
  PR: VerifiedFor.PermanentResidents,
  SG: VerifiedFor.Singaporeans,
}

type VerifiedForMappings = {
  [K in VerifiedFor]: boolean
}

const convertMyInfoDataSource = (source: string): MyInfoDataSource[] => {
  return source
    .split('/')
    .map((dataSource) => dataSource.trim() as MyInfoDataSource)
}

const extractVerifiedFor = (
  myInfoFieldType: MyInfoAttribute,
): VerifiedForMappings => {
  const verificationArray = MYINFO_FIELD_CONSTANTS[myInfoFieldType]['verified']
  const baseVerifiedFor = {
    [VerifiedFor.Singaporeans]: false,
    [VerifiedFor.PermanentResidents]: false,
    [VerifiedFor.ForeignersWithSingpass]: false,
  }

  verificationArray.forEach((element) => {
    baseVerifiedFor[MYINFO_VERIFICATION_TYPE_MAPPINGS[element]] = true
  })

  return baseVerifiedFor
}

export const extendWithMyInfo = (field: MyInfoField): MyInfoPreviewMeta => {
  return {
    dataSource: convertMyInfoDataSource(
      MYINFO_FIELD_CONSTANTS[field.myInfo.attr].source,
    ),
    verifiedFor: extractVerifiedFor(field.myInfo.attr),
    details: MYINFO_FIELD_CONSTANTS[field.myInfo.attr].description,
  }
}
