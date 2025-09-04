import { FormAuthType } from '~shared/types'

/**
 * Only CorpPass requires esrvcid as other options will use FormSG's
 * supplied value to increase Singpass Myinfo adoption
 * @param authType
 * @returns
 */

export const isEsrvcidRequired = (authType: FormAuthType) => {
  switch (authType) {
    case FormAuthType.SP:
    case FormAuthType.CP:
      return true
    default:
      return false
  }
}
