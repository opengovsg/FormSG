import { Mongoose, Schema } from 'mongoose'

import { IWorkspaceModel, IWorkspaceSchema } from '../../types'

import getFormModel from './form.server.model'
import getUserModel from './user.server.model'

export const WORKSPACE_SCHEMA_ID = 'Workspace'

const compileWorkspaceModel = (db: Mongoose): IWorkspaceModel => {
  const Form = getFormModel(db)
  const User = getUserModel(db)

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
        maxlength: [
          200,
          'Workspace title can have a maximum of 200 characters',
        ],
        trim: true,
      },
      admin: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: 'Workspace must have an Admin',
      },
      formIds: {
        type: [Schema.Types.ObjectId],
        validate: {
          async validator(this: IWorkspaceSchema) {
            if (this.formIds.length === 0) return true

            const user = await User.findById(this.admin)
            if (!user) return false

            for (const formId of this.formIds) {
              const form = await Form.findById(formId)
              if (!form) return false

              const isUserFormAdmin = form.admin.equals(this.admin)
              const isUserFormCollaborator =
                form?.permissionList?.find(
                  (permission) => permission.email === user.email,
                ) != undefined

              const doesUserHaveFormAccess =
                isUserFormAdmin || isUserFormCollaborator
              const isFormIdUnique = this.formIds.includes(formId)
              const isFormIdValid = doesUserHaveFormAccess && isFormIdUnique

              if (!isFormIdValid) return false
            }

            return true
          },
        },
        message: "Failed to update workspace document's formIds",
      },
    },
    {
      timestamps: {
        createdAt: 'created',
        updatedAt: 'lastModified',
      },
    },
  )

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
