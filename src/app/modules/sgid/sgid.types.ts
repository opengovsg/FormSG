import { FormAuthType } from '../../../../shared/types'
import { IFormSchema } from '../../../types'

export type SgidForm<T extends IFormSchema> = T & {
  authType: FormAuthType.SGID
}

export type SGIDScopeToValue = Record<string, string>
