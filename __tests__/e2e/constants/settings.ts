import { FormAuthType, FormStatus } from 'shared/types'

export type Collaborator = {
  email: string
  write: boolean
}

export type E2eSettingsOptions = {
  status: FormStatus
  collaborators: Collaborator[]
  responseLimit?: number
  closedFormMessage?: string
  emails?: string[]
  authType: FormAuthType
  esrvcId?: string
}
