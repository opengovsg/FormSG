import { Mongoose, Schema } from 'mongoose'

import { IWorkspaceModel, IWorkspaceSchema } from '../../types'

export const WORKSPACE_SCHEMA_ID = 'Workspace'

const compileWorkspaceModel = (db: Mongoose): IWorkspaceModel => {
  const WorkspaceSchema = new Schema<IWorkspaceSchema, IWorkspaceModel>({
    title: {
      type: String,
      validate: [
        /^[a-zA-Z0-9_\-./() &`;'"]*$/,
        'Workspace title cannot contain special characters',
      ],
      required: 'Workspace title cannot be blank',
      minlength: [4, 'Workspace title must be at least 4 characters'],
      maxlength: [200, 'Workspace title can have a maximum of 200 characters'],
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
  })

  WorkspaceSchema.index({
    admin: 1,
  })

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
