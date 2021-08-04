import { FormAuthType, IFormSchema } from 'src/types'

export type SgidForm<T extends IFormSchema> = T & {
  authType: FormAuthType.SGID
}
