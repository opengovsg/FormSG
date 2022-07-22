import { ObjectId } from 'bson-ext'
import { omit } from 'lodash'
import mongoose from 'mongoose'

import { getWorkspaceModel } from 'src/app/models/workspace.server.model'
import { IUserSchema } from 'src/types'

import dbHandler from 'tests/unit/backend/helpers/jest-db'

const Workspace = getWorkspaceModel(mongoose)

const MOCK_USER_ID = new ObjectId()
const MOCK_FORM_ID = new ObjectId()
const MOCK_WORKSPACE_ID = new ObjectId()
const MOCK_WORKSPACE_FIELDS = {
  _id: MOCK_WORKSPACE_ID,
  title: 'Workspace1',
  admin: MOCK_USER_ID,
  formIds: [],
}

describe('Workspace Model', () => {
  let FORM_ADMIN_USER: IUserSchema

  beforeAll(async () => await dbHandler.connect())
  beforeEach(async () => {
    const { user: adminUser } = await dbHandler.insertEncryptForm({
      formId: MOCK_FORM_ID,
      userId: MOCK_USER_ID,
    })

    await Workspace.create(MOCK_WORKSPACE_FIELDS)
    FORM_ADMIN_USER = adminUser
  })
  afterEach(async () => await dbHandler.clearDatabase())
  afterAll(async () => await dbHandler.closeDatabase())

  describe('Schema', () => {
    it('should create and save successfully', async () => {
      const { user: existentUser } = await dbHandler.insertFormCollectionReqs({
        userId: new ObjectId(),
        mailName: 'userThatExists',
      })
      const expectedWorkspaceObject = {
        title: 'Workspace2',
        admin: existentUser._id,
        formIds: [],
      }
      const validWorkspace = new Workspace(expectedWorkspaceObject)
      const saved = await validWorkspace.save()
      const actualSavedObject = omit(saved.toObject(), [
        '_id',
        'createdAt',
        'updatedAt',
        '__v',
      ])

      expect(saved._id).toBeDefined()
      expect(saved.createdAt).toBeInstanceOf(Date)
      expect(saved.updatedAt).toBeInstanceOf(Date)
      expect(actualSavedObject).toEqual(expectedWorkspaceObject)
    })

    it('should fail when formId in is not unique', async () => {
      const duplicateFormId = new ObjectId()
      const workspaceObject = {
        title: 'Workspace2',
        admin: FORM_ADMIN_USER,
        formIds: [duplicateFormId, duplicateFormId],
      }
      const invalidWorkspace = new Workspace(workspaceObject)
      await expect(invalidWorkspace.save()).rejects.toThrowError(
        mongoose.Error.ValidationError,
      )
    })

    it('should fail when title length is less than 4 characters', async () => {
      const workspaceObject = {
        title: 'aaa',
        admin: FORM_ADMIN_USER,
        formIds: [],
      }
      const invalidWorkspace = new Workspace(workspaceObject)
      await expect(invalidWorkspace.save()).rejects.toThrowError(
        mongoose.Error.ValidationError,
      )
    })

    it('should fail when title length is more than 200 characters', async () => {
      const workspaceObject = {
        title: new Array(202).join('a'),
        admin: FORM_ADMIN_USER,
        formIds: [],
      }
      const invalidWorkspace = new Workspace(workspaceObject)
      await expect(invalidWorkspace.save()).rejects.toThrowError(
        mongoose.Error.ValidationError,
      )
    })

    it('should fail when title has special characters', async () => {
      const workspaceObject = {
        title: 'titleI$',
        admin: FORM_ADMIN_USER,
        formIds: [],
      }
      const invalidWorkspace = new Workspace(workspaceObject)
      await expect(invalidWorkspace.save()).rejects.toThrowError(
        mongoose.Error.ValidationError,
      )
    })
  })
})
