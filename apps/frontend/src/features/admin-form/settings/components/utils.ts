import { FormAuthType } from 'formsg-shared/types'

/**
 * Only CorpPass requires esrvcid as other options will use FormSG's
 * supplied value to increase Singpass Myinfo adoption
 * @param authType
 * @param isCorppassFormsgEsrvcIdEnabled whether Corppass uses FormSG's
 * e-service ID too
 * @returns
 */

export const isEsrvcidRequired = (
  authType: FormAuthType,
  isCorppassFormsgEsrvcIdEnabled: boolean,
) => {
  switch (authType) {
    case FormAuthType.CP:
      return !isCorppassFormsgEsrvcIdEnabled
    default:
      return false
  }
}
