import {
  MYINFO_ATTRIBUTE_MAP,
  MyInfoVerifiedType,
} from '~shared/constants/field/myinfo'
import { MyInfoAttribute, MyInfoField } from '~shared/types'

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
  const verificationArray = MYINFO_ATTRIBUTE_MAP[myInfoFieldType]['verified']
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
      MYINFO_ATTRIBUTE_MAP[field.myInfo.attr].source,
    ),
    verifiedFor: extractVerifiedFor(field.myInfo.attr),
    details: MYINFO_ATTRIBUTE_MAP[field.myInfo.attr].description,
  }
}
