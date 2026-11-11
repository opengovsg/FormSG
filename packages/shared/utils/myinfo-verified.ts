import {
  MyInfoVerifiedType,
  types as myInfoTypes,
} from '../constants/field/myinfo'
import { MyInfoAttribute } from '../types'

const VERIFIED_BY_ATTR = new Map<MyInfoAttribute, MyInfoVerifiedType[]>(
  myInfoTypes.map(({ name, verified }) => [name, verified]),
)

/**
 * Whether Myinfo returns a government-verified value for this attribute to
 * this type of respondent. Field settings show the same data as ticks and
 * crosses under "Verified for".
 */
export const isMyInfoVerifiedFor = (
  attr: MyInfoAttribute,
  type: MyInfoVerifiedType,
): boolean => VERIFIED_BY_ATTR.get(attr)?.includes(type) ?? false
