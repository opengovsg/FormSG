import { FormAuthType, FormStatus } from 'shared/types'

export type Collaborator = {
  email: string
  write: boolean
}

export type E2eSettingsOptions = {
  status: FormStatus
  collaborators: Collaborator[]
  isSubmitterIdCollectionEnabled: boolean
  responseLimit?: number
  closedFormMessage?: string
  emails?: string[]
  authType: FormAuthType
  /** If authType is SPCP/MyInfo, eserviceId is required. */
  esrvcId?: string
  /**
   * Represents singpass/corppass validated nric.
   * If authType is non-NIL, nric is required. */
  nric?: string
  /**
   * Represents corppass validated uen.
   * If authType is CP, uen is required. */
  uen?: string
}
