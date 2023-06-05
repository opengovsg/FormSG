import { ClientSession, Mongoose, Schema } from 'mongoose'

import {
  IFormSchema,
  IUserSchema,
  IWorkspaceModel,
  IWorkspaceSchema,
} from '../../types'

export const WORKSPACE_SCHEMA_ID = 'Workspace'

const compileWorkspaceModel = (db: Mongoose): IWorkspaceModel => {
  const schemaOptions = {
    id: false,
    timestamps: true,
  }

  const WorkspaceSchema = new Schema<IWorkspaceSchema, IWorkspaceModel>(
    {
      title: {
        type: String,
        validate: [
          /^[a-zA-Z0-9_\-./() &`;'"]*$/,
          'Workspace title cannot contain special characters',
        ],
        required: 'Workspace title cannot be blank',
        minlength: [4, 'Workspace title must be at least 4 characters'],
        maxlength: [50, 'Workspace title can have a maximum of 50 characters'],
        trim: true,
      },
      admin: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: 'Workspace must have an Admin',
      },
      formIds: {
        type: [Schema.Types.ObjectId],
        validate: (v: Schema.Types.ObjectId[]) => new Set(v).size === v.length,
        message: "Failed to update workspace document's formIds",
      },
    },
    schemaOptions,
  )

  WorkspaceSchema.index({
    admin: 1,
  })

  WorkspaceSchema.statics.getWorkspace = async function (
    workspaceId: IWorkspaceSchema['_id'],
  ) {
    return this.findById(workspaceId).exec()
  }

  WorkspaceSchema.statics.getWorkspaces = async function (
    admin: IUserSchema['_id'],
  ) {
    return this.find({ admin: admin }).sort('title').exec()
  }

  WorkspaceSchema.statics.createWorkspace = async function (
    title: string,
    admin: IUserSchema['_id'],
  ) {
    return this.create({ title, admin, formIds: [] })
  }

  WorkspaceSchema.statics.updateWorkspaceTitle = async function ({
    title,
    workspaceId,
  }: {
    title: string
    workspaceId: IWorkspaceSchema['_id']
  }) {
    return this.findOneAndUpdate({ _id: workspaceId }, { title }, { new: true })
  }

  WorkspaceSchema.statics.deleteWorkspace = async function ({
    workspaceId,
    session,
  }: {
    workspaceId: IWorkspaceSchema['_id']
    session: ClientSession
  }) {
    return this.findOneAndDelete(
      {
        _id: workspaceId,
      },
      { session },
    )
  }

  WorkspaceSchema.statics.removeFormIdsFromAllWorkspaces = async function ({
    admin,
    formIds,
    session,
  }: {
    admin: IUserSchema['_id']
    formIds: IFormSchema['_id'][]
    session?: ClientSession
  }) {
    return await this.updateMany(
      { admin },
      { $pullAll: { formIds } },
      { session },
    )
  }

  WorkspaceSchema.statics.addFormIdsToWorkspace = async function ({
    workspaceId,
    formIds,
    session,
  }: {
    workspaceId: IWorkspaceSchema['_id']
    formIds: IFormSchema['_id'][]
    session?: ClientSession
  }) {
    return await this.findOneAndUpdate(
      { _id: workspaceId },
      { $addToSet: { formIds: { $each: formIds } } },
      { session, new: true },
    )
  }

  return db.model<IWorkspaceSchema, IWorkspaceModel>(
    WORKSPACE_SCHEMA_ID,
    WorkspaceSchema,
  )
}

export const getWorkspaceModel = (db: Mongoose): IWorkspaceModel => {
  try {
    return db.model(WORKSPACE_SCHEMA_ID) as IWorkspaceModel
  } catch {
    return compileWorkspaceModel(db)
  }
}
