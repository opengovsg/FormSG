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
const MOCK_WORKSPACE_DOC = {
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

    await Workspace.create(MOCK_WORKSPACE_DOC)
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

    it('should fail when title length is more than 50 characters', async () => {
      const workspaceObject = {
        title: new Array(52).join('a'),
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

    describe('getWorkspaces', () => {
      it('should return empty array when user has no workspaces', async () => {
        const mockUserId = new ObjectId()
        const actual = await Workspace.getWorkspaces(mockUserId)

        expect(actual).toEqual([])
      })

      it('should return array of workspaces belonging to user sorted by workspace title', async () => {
        const mockUserId = FORM_ADMIN_USER._id
        const mockWorkspaces = [
          {
            _id: new ObjectId(),
            title: 'aThird',
            admin: MOCK_USER_ID,
            formIds: [],
          },
          {
            _id: new ObjectId(),
            title: 'bFourth',
            admin: MOCK_USER_ID,
            formIds: [],
          },
          {
            _id: new ObjectId(),
            title: '9First',
            admin: MOCK_USER_ID,
            formIds: [],
          },
          {
            _id: new ObjectId(),
            title: 'ZSecond',
            admin: MOCK_USER_ID,
            formIds: [],
          },
        ]

        await Workspace.insertMany(mockWorkspaces)
        const actual = await Workspace.getWorkspaces(mockUserId)
        const expected = await Workspace.find({ admin: mockUserId }).sort(
          'title',
        )

        expect(actual).toEqual(expected)
      })
    })

    describe('createWorkspace', () => {
      it('should return created workspace upon successful workspace creation', async () => {
        const mockUserId = FORM_ADMIN_USER._id
        const mockWorkspaceTitle = 'Workspace'

        const actual = await Workspace.createWorkspace(
          mockWorkspaceTitle,
          mockUserId,
        )

        expect(actual.title).toEqual(mockWorkspaceTitle)
        expect(actual.formIds.length).toEqual(0)
        expect(actual.admin).toEqual(mockUserId)
      })
    })
  })
})
