import { ClientSession, Document, Model } from 'mongoose'
import { WorkspaceDto } from 'shared/types/workspace'

import { IFormSchema } from './form'
import { IUserSchema } from './user'

type IWorkspace = {
  title: string
  admin: IUserSchema['_id']
  formIds: IFormSchema['_id'][]
}

export interface IWorkspaceSchema extends IWorkspace, Document {}

export interface IWorkspaceModel extends Model<IWorkspaceSchema> {
  getWorkspaces(admin: IUserSchema['_id']): Promise<WorkspaceDto[]>

  getWorkspace(workspaceId: IWorkspaceSchema['_id']): Promise<WorkspaceDto>

  createWorkspace(
    title: string,
    admin: IUserSchema['_id'],
  ): Promise<WorkspaceDto>

  updateWorkspaceTitle({
    title,
    workspaceId,
  }: {
    title: string
    workspaceId: IWorkspaceSchema['_id']
  }): Promise<WorkspaceDto | null>

  deleteWorkspace({
    workspaceId,
    session,
  }: {
    workspaceId: IWorkspaceSchema['_id']
    session?: ClientSession
  }): Promise<boolean>

  removeFormIdsFromWorkspace({
    workspaceId,
    formIds,
    session,
  }: {
    workspaceId: IWorkspaceSchema['_id']
    formIds: IFormSchema['_id'][]
    session?: ClientSession
  }): Promise<void>

  addFormIdsToWorkspace({
    workspaceId,
    formIds,
    session,
  }: {
    workspaceId: IWorkspaceSchema['_id']
    formIds: IFormSchema['_id'][]
    session?: ClientSession
  }): Promise<void>
}
