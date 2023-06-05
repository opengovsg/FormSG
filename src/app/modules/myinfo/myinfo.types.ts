import { FormAuthType, MyInfoAttribute } from '../../../../shared/types'
import { Environment, IFormSchema, IMyInfo } from '../../../types'
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
  encodedQuery?: string
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

export type MyInfoLoginCookiePayload = {
  uinFin: string
}

export enum MyInfoAuthCodeCookieState {
  Success = 'success',
  Error = 'error',
}

export type MyInfoAuthCodeSuccessPayload = {
  authCode: string
  state: MyInfoAuthCodeCookieState.Success
}

export type MyInfoAuthCodeCookiePayload =
  | MyInfoAuthCodeSuccessPayload
  | {
      state: Exclude<
        MyInfoAuthCodeCookieState,
        MyInfoAuthCodeCookieState.Success
      >
    }

/**
 * The stringified properties included in the state sent to MyInfo.
 */
export type MyInfoRelayState = {
  uuid: string
  formId: string
  encodedQuery?: string
}

export type MyInfoForm<T extends IFormSchema> = T & {
  authType: FormAuthType.MyInfo
  esrvcId: string
}
