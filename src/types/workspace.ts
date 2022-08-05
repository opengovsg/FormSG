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
    /**
     * Session is optional so that we can mock this function in our tests to test it without a session.
     * Reason is our mocked mongo database does not support transactions.
     * See issue #4503 for more details.
     */
    session?: ClientSession
  }): Promise<WorkspaceDto | null>

  removeFormIdsFromAllWorkspaces({
    admin,
    formIds,
    session,
  }: {
    admin: IUserSchema['_id']
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
  }): Promise<WorkspaceDto | null>
}
