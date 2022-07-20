import { Mongoose, Schema } from 'mongoose'
import { WorkspaceDto } from 'shared/types/workspace'

import { IUserSchema, IWorkspaceModel, IWorkspaceSchema } from '../../types'

export const WORKSPACE_SCHEMA_ID = 'Workspace'

const compileWorkspaceModel = (db: Mongoose): IWorkspaceModel => {
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
    { timestamps: true },
  )

  WorkspaceSchema.index({
    admin: 1,
  })

  WorkspaceSchema.virtual('count').get(function (this: IWorkspaceSchema) {
    return this.formIds.length
  })

  WorkspaceSchema.statics.getWorkspaces = async function (
    admin: IUserSchema['_id'],
  ): Promise<WorkspaceDto[]> {
    return this.find({ admin: admin }).sort('title').exec()
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
