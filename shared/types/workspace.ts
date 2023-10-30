import { Opaque } from 'type-fest'
import { FormId } from './form'
import { UserId } from './user'

export type WorkspaceId = Opaque<string, 'WorkspaceId'>

export type Workspace = {
  _id: WorkspaceId
  title: string
  formIds: FormId[]
  admin: UserId
}

export type WorkspaceDto = Workspace
