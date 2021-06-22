import {
  AuthType,
  Environment,
  IFormSchema,
  IMyInfo,
  MyInfoAttribute,
} from '../../../types'
import { ISpcpMyInfo } from '../../config/features/spcp-myinfo.config'
import { ProcessedFieldResponse } from '../submission/submission.types'

export interface IMyInfoServiceConfig {
  spcpMyInfoConfig: ISpcpMyInfo
  nodeEnv: Environment
  appUrl: string
}

export interface IMyInfoRedirectURLArgs {
  formId: string
  formEsrvcId: string
  requestedAttributes: MyInfoAttribute[]
}

export type MyInfoHashPromises = Partial<
  Record<MyInfoAttribute, Promise<string>>
>

export type VisibleMyInfoResponse = ProcessedFieldResponse & {
  myInfo: IMyInfo
  isVisible: true
  answer: string
}

export type MyInfoComparePromises = Map<string, Promise<boolean>>

export enum MyInfoCookieState {
  Success = 'success',
  Error = 'error',
}

export type MyInfoSuccessfulCookiePayload = {
  accessToken: string
  usedCount: number
  state: MyInfoCookieState.Success
}

export type MyInfoCookiePayload =
  | MyInfoSuccessfulCookiePayload
  | { state: Exclude<MyInfoCookieState, MyInfoCookieState.Success> }

/**
 * The stringified properties included in the state sent to MyInfo.
 */
export type MyInfoRelayState = {
  uuid: string
  formId: string
}

/**
 * RelayState with additional properties derived from parsing it.
 */
export type MyInfoParsedRelayState = MyInfoRelayState & {
  cookieDuration: number
}

export type MyInfoForm<T extends IFormSchema> = T & {
  authType: AuthType.MyInfo
  esrvcId: string
}
