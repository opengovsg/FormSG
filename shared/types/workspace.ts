import { Opaque } from 'type-fest'
import { FormId } from './form'
import { UserId } from './user'

export type WorkspaceId = Opaque<string, 'WorkspaceId'>

export type Workspace = {
  title: string
  count: number
  formIds: FormId[]
  admin: UserId
}

export type WorkspaceDto = Workspace
