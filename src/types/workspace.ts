import { Document, Model } from 'mongoose'

import { IFormSchema } from './form'
import { IUserSchema } from './user'

type IWorkspace = {
  title: string
  admin: IUserSchema['_id']
  formIds: IFormSchema['_id'][]
}

export interface IWorkspaceSchema extends IWorkspace, Document {
  created?: Date
  lastModified?: Date
}

interface IWorkspaceDocument extends IWorkspaceSchema {
  title: Required<IWorkspaceSchema['title']>
  admin: Required<IWorkspaceSchema['admin']>
  formIds: Required<IWorkspaceSchema['formIds']>
}

export interface IWorkspaceModel extends Model<IWorkspaceSchema> {
  getWorkspaces(admin: IUserSchema['_id']): Promise<IWorkspaceDocument[]>

  // TODO (hans): Add workspace methods here
}
