import dbHandler from '__tests__/unit/backend/helpers/jest-db'
import { ObjectId } from 'bson'
import { omit } from 'lodash'
import mongoose from 'mongoose'
import { FormStatus } from 'shared/types'

import { getWorkspaceModel } from 'src/app/models/workspace.server.model'
import { IUserSchema } from 'src/types'

import getFormModel from '../form.server.model'

const Form = getFormModel(mongoose)
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

//
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
      await expect(invalidWorkspace.save()).rejects.toThrow(
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
      await expect(invalidWorkspace.save()).rejects.toThrow(
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
      await expect(invalidWorkspace.save()).rejects.toThrow(
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
      await expect(invalidWorkspace.save()).rejects.toThrow(
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

    describe('updateWorkspaceTitle', () => {
      it('should return updated workspace upon successful workspace title update', async () => {
        const newWorkspaceTitle = 'Workspace'

        const actual = await Workspace.updateWorkspaceTitle({
          title: newWorkspaceTitle,
          workspaceId: MOCK_WORKSPACE_ID,
        })

        expect(actual).toBeObject()
        expect(actual?.title).toEqual(newWorkspaceTitle)
      })

      it('should return null upon unsuccessful update due to invalid workspace id', async () => {
        const newWorkspaceTitle = 'Workspace'
        const invalidWorkspaceId = new ObjectId()

        const actual = await Workspace.updateWorkspaceTitle({
          title: newWorkspaceTitle,
          workspaceId: invalidWorkspaceId,
        })

        expect(actual).toBeNull()
      })
    })

    describe('deleteWorkspace', () => {
      it('should correctly remove workspace from database when deleted', async () => {
        await Workspace.deleteWorkspace({
          workspaceId: MOCK_WORKSPACE_ID,
        })

        const actual = await Workspace.exists({ _id: MOCK_WORKSPACE_ID })
        expect(actual).toBeNull()
      })

      it('should not archive forms when workspace is deleted', async () => {
        await Workspace.updateOne(
          { _id: MOCK_WORKSPACE_ID },
          { $addToSet: { formIds: MOCK_FORM_ID } },
        )
        await Workspace.deleteWorkspace({
          workspaceId: MOCK_WORKSPACE_ID,
        })

        const actual = await Workspace.exists({ _id: MOCK_WORKSPACE_ID })
        const doesFormExist = await Form.exists({ _id: MOCK_FORM_ID })
        const isFormArchived = await Form.exists({
          _id: MOCK_FORM_ID,
          status: FormStatus.Archived,
        })

        expect(actual).toBeNull()
        expect(doesFormExist).toBeTruthy()
        expect(isFormArchived).toBeNull()
      })
    })

    describe('removeFormIdsFromAllWorkspaces', () => {
      it('should correctly remove formIds from all workspaces', async () => {
        await Workspace.removeFormIdsFromAllWorkspaces({
          admin: MOCK_USER_ID,
          formIds: [MOCK_FORM_ID],
        })

        const actual = await Workspace.find({
          admin: MOCK_USER_ID,
          formIds: { $elemMatch: { $eq: MOCK_FORM_ID } },
        })

        expect(actual.length).toEqual(0)
      })
    })

    describe('addFormIdsToWorkspaces', () => {
      it('should correctly add form id to workspace when workspace id is specified', async () => {
        await Workspace.addFormIdsToWorkspace({
          workspaceId: MOCK_WORKSPACE_ID,
          formIds: [MOCK_FORM_ID],
        })

        const actual = await Workspace.findOne({
          _id: MOCK_USER_ID,
          formIds: { $elemMatch: { $eq: MOCK_FORM_ID } },
        })

        expect(actual).toBeDefined()
      })
    })
  })
})
