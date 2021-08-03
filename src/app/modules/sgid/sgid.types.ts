import { AuthType, IFormSchema } from 'src/types'

export type SgidForm<T extends IFormSchema> = T & {
  authType: AuthType.SGID
}
