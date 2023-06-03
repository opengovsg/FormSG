import { ObjectId } from 'bson-ext'
import mongoose from 'mongoose'
import { UserId } from 'shared/types'
import { Workspace, WorkspaceId } from 'shared/types/workspace'
import supertest, { Session } from 'supertest-session'

import getFormModel from 'src/app/models/form.server.model'
import { getWorkspaceModel } from 'src/app/models/workspace.server.model'
import { WorkspacesRouter } from 'src/app/routes/api/v3/admin/workspaces'
import { formatErrorRecoveryMessage } from 'src/app/utils/handle-mongo-error'

import {
  createAuthedSession,
  logoutSession,
} from 'tests/integration/helpers/express-auth'
import { setupApp } from 'tests/integration/helpers/express-setup'
import { buildCelebrateError } from 'tests/unit/backend/helpers/celebrate'
import dbHandler from 'tests/unit/backend/helpers/jest-db'
import { jsonParseStringify } from 'tests/unit/backend/helpers/serialize-data'

import {
  ForbiddenWorkspaceError,
  WorkspaceNotFoundError,
} from '../workspace.errors'

const WorkspaceModel = getWorkspaceModel(mongoose)
const FormModel = getFormModel(mongoose)

const app = setupApp('/workspaces', WorkspacesRouter, {
  setupWithAuth: true,
})

const MOCK_USER_ID = new ObjectId()
const MOCK_FORM_ID = new ObjectId()
const MOCK_WORKSPACE_ID = new ObjectId().toHexString() as WorkspaceId
const MOCK_WORKSPACE_DOC = {
  _id: MOCK_WORKSPACE_ID,
  title: 'Workspace1',
  admin: MOCK_USER_ID.toHexString() as UserId,
  formIds: [],
}

describe('workspaces.routes', () => {
  let request: Session
  let connection: typeof mongoose

  beforeAll(async () => {
    connection = await dbHandler.connect()
    await connection.startSession()
  })
  beforeEach(async () => {
    request = supertest(app)
    const { user } = await dbHandler.insertEncryptForm({
      formId: MOCK_FORM_ID,
      userId: MOCK_USER_ID,
    })
    request = await createAuthedSession(user.email, request)
  })
  afterEach(async () => {
    await dbHandler.clearDatabase()
    jest.restoreAllMocks()
  })
  afterAll(async () => {
    await dbHandler.closeDatabase()
  })

  describe('GET /workspaces', () => {
    const GET_WORKSPACES_ENDPOINT = '/workspaces'

    it('should return 200 with an empty array when a user has no workspaces', async () => {
      const response = await request.get(GET_WORKSPACES_ENDPOINT)

      expect(response.status).toEqual(200)
      expect(response.body).toEqual([])
    })

    it("should return 200 with an array of the user's workspaces sorted by title", async () => {
      const workspaceIds = [
        MOCK_WORKSPACE_DOC._id,
        new ObjectId(),
        new ObjectId(),
      ]
      const workspaceDocs = [
        {
          _id: workspaceIds[1],
          title: 'aSecondInOrder',
          admin: MOCK_USER_ID,
          formIds: [],
        },
        {
          _id: workspaceIds[2],
          title: 'bThirdInOrder',
          admin: MOCK_USER_ID,
          formIds: [],
        },
        MOCK_WORKSPACE_DOC,
      ]
      await WorkspaceModel.insertMany(workspaceDocs)
      const response = await request.get(GET_WORKSPACES_ENDPOINT)
      const expected = await WorkspaceModel.find({ _id: { $in: workspaceIds } })
      const expectedWithVirtuals = expected.map((workspace) =>
        workspace.toJSON(),
      )

      expect(response.status).toEqual(200)
      expect(response.body).toEqual(jsonParseStringify(expectedWithVirtuals))
    })

    it('should return 401 when user is not logged in', async () => {
      await logoutSession(request)
      const response = await request.get(GET_WORKSPACES_ENDPOINT)

      expect(response.status).toEqual(401)
      expect(response.body).toEqual({ message: 'User is unauthorized.' })
    })

    it('should return 500 when database errors occur', async () => {
      const mockErrorMessage = 'something went wrong'
      jest
        .spyOn(WorkspaceModel, 'getWorkspaces')
        .mockRejectedValueOnce(new Error(mockErrorMessage))
      const response = await request.get(GET_WORKSPACES_ENDPOINT)

      expect(response.status).toEqual(500)
      expect(response.body).toEqual({
        message: formatErrorRecoveryMessage(mockErrorMessage),
      })
    })
  })

  describe('POST /workspaces', () => {
    const CREATE_WORKSPACE_ENDPOINT = '/workspaces'

    it('should return 200 with created workspace on successful creation', async () => {
      const createWorkspaceParam = {
        title: 'validWorkspace',
      }
      const response = await request
        .post(CREATE_WORKSPACE_ENDPOINT)
        .send(createWorkspaceParam)
      const expected = {
        title: createWorkspaceParam.title,
        admin: MOCK_USER_ID.toHexString(),
        formIds: [],
      }

      expect(response.status).toEqual(200)
      expect(response.body).toMatchObject(expected)
    })

    it('should return 400 when workspace title is invalid', async () => {
      const createInvalidWorkspaceParam = {
        title: 'a',
      }

      const response = await request
        .post(CREATE_WORKSPACE_ENDPOINT)
        .send(createInvalidWorkspaceParam)

      expect(response.status).toEqual(400)
      expect(response.body).toEqual(
        buildCelebrateError({
          body: {
            key: 'title',
            message: '"title" length must be at least 4 characters long',
          },
        }),
      )
    })

    it('should return 401 when user is not logged in', async () => {
      await logoutSession(request)
      const response = await request.post(CREATE_WORKSPACE_ENDPOINT)

      expect(response.status).toEqual(401)
      expect(response.body).toEqual({ message: 'User is unauthorized.' })
    })

    it('should return 500 when database errors occur', async () => {
      const createWorkspaceParam = {
        title: 'validWorkspace',
      }

      const mockErrorMessage = 'something went wrong'
      jest
        .spyOn(WorkspaceModel, 'createWorkspace')
        .mockRejectedValueOnce(new Error(mockErrorMessage))
      const response = await request
        .post(CREATE_WORKSPACE_ENDPOINT)
        .send(createWorkspaceParam)

      expect(response.status).toEqual(500)
      expect(response.body).toEqual({
        message: formatErrorRecoveryMessage(mockErrorMessage),
      })
    })
  })

  describe('PUT /workspaces/:workspaceId/title', () => {
    const UPDATE_WORKSPACE_ENDPOINT = `/workspaces/${MOCK_WORKSPACE_ID}/title`

    it('should return 200 with updated workspace on successful title update', async () => {
      await WorkspaceModel.create(MOCK_WORKSPACE_DOC)

      const updateWorkspaceParam = {
        title: 'newTitle',
      }
      const response = await request
        .put(UPDATE_WORKSPACE_ENDPOINT)
        .send(updateWorkspaceParam)
      const expected = {
        title: updateWorkspaceParam.title,
        admin: MOCK_USER_ID.toHexString(),
        formIds: [],
      }

      expect(response.status).toEqual(200)
      expect(response.body).toMatchObject(expected)
    })

    it('should return 400 when workspace title is invalid', async () => {
      const updateInvalidWorkspaceParam = {
        title: 'a',
      }

      const response = await request
        .put(UPDATE_WORKSPACE_ENDPOINT)
        .send(updateInvalidWorkspaceParam)

      expect(response.status).toEqual(400)
      expect(response.body).toEqual(
        buildCelebrateError({
          body: {
            key: 'title',
            message: '"title" length must be at least 4 characters long',
          },
        }),
      )
    })

    it('should return 401 when user is not logged in', async () => {
      await logoutSession(request)
      const response = await request.put(UPDATE_WORKSPACE_ENDPOINT)

      expect(response.status).toEqual(401)
      expect(response.body).toEqual({ message: 'User is unauthorized.' })
    })

    it('should return 403 when user has no permissions to update the workspace title', async () => {
      const updateWorkspaceParam = {
        title: 'validWorkspace',
      }
      const validWorkspaceId = new ObjectId()
      await WorkspaceModel.create({
        _id: validWorkspaceId,
        title: "Someone else's workspace",
        admin: new ObjectId(),
        formIds: [],
      })

      const response = await request
        .put(`/workspaces/${validWorkspaceId.toHexString()}/title`)
        .send(updateWorkspaceParam)

      expect(response.status).toEqual(403)
      expect(response.body).toEqual({
        message: new ForbiddenWorkspaceError().message,
      })
    })

    it('should return 404 when workspace is not found', async () => {
      const updateWorkspaceParam = {
        title: 'validWorkspace',
      }
      const invalidWorkspaceId = new ObjectId().toHexString()
      const response = await request
        .put(`/workspaces/${invalidWorkspaceId}/title`)
        .send(updateWorkspaceParam)

      expect(response.status).toEqual(404)
      expect(response.body).toEqual({
        message: new WorkspaceNotFoundError().message,
      })
    })

    it('should return 500 when database errors occur', async () => {
      await WorkspaceModel.create(MOCK_WORKSPACE_DOC)

      const updateWorkspaceParam = {
        title: 'validWorkspace',
      }
      const mockErrorMessage = 'something went wrong'

      jest
        .spyOn(WorkspaceModel, 'updateWorkspaceTitle')
        .mockRejectedValueOnce(new Error(mockErrorMessage))
      const response = await request
        .put(UPDATE_WORKSPACE_ENDPOINT)
        .send(updateWorkspaceParam)

      expect(response.status).toEqual(500)
      expect(response.body).toEqual({
        message: formatErrorRecoveryMessage(mockErrorMessage),
      })
    })
  })

  describe('DELETE /workspaces/:workspaceId', () => {
    const DELETE_WORKSPACE_ENDPOINT = `/workspaces/${MOCK_WORKSPACE_ID}`
    const DELETE_SUCCESS_MESSAGE = 'Successfully deleted workspace'
    const deleteWorkspaceParam = {
      shouldDeleteForms: true,
    }

    it('should return 200 with success message on successful deletion', async () => {
      await WorkspaceModel.create(MOCK_WORKSPACE_DOC)

      /**
       * We mock deleteWorkspace to run without use of mongoose session, i.e without a transaction
       * because the mocked mongoose MemoryDatabaseServer doesn't support transactions.
       * See issue #4503 for more details.
       **/
      jest
        .spyOn(WorkspaceModel, 'deleteWorkspace')
        .mockResolvedValueOnce(MOCK_WORKSPACE_DOC as Workspace)
      jest.spyOn(FormModel, 'archiveForms').mockResolvedValueOnce()

      const response = await request
        .delete(DELETE_WORKSPACE_ENDPOINT)
        .send(deleteWorkspaceParam)
      const expected = { message: DELETE_SUCCESS_MESSAGE }

      expect(response.status).toEqual(200)
      expect(response.body).toMatchObject(expected)
    })

    it('should return 401 when user is not logged in', async () => {
      await logoutSession(request)
      const response = await request
        .delete(DELETE_WORKSPACE_ENDPOINT)
        .send(deleteWorkspaceParam)

      expect(response.status).toEqual(401)
      expect(response.body).toEqual({ message: 'User is unauthorized.' })
    })

    it('should return 403 when user does not own the workspace', async () => {
      const otherUserId = new ObjectId()
      const otherWorkspaceId = new ObjectId()
      await dbHandler.insertUser({
        userId: otherUserId,
        agencyId: new ObjectId(),
        mailName: 'different',
      })
      const workspaceBelongingToOtherAdmin = {
        _id: otherWorkspaceId,
        title: 'Workspace2',
        admin: otherUserId,
        formIds: [],
      }
      await WorkspaceModel.create(workspaceBelongingToOtherAdmin)
      const response = await request
        .delete(`/workspaces/${otherWorkspaceId.toHexString()}`)
        .send(deleteWorkspaceParam)

      expect(response.status).toEqual(403)
      expect(response.body).toEqual({
        message: new ForbiddenWorkspaceError().message,
      })
    })

    it('should return 404 when workspace is not found', async () => {
      const response = await request
        .delete(`/workspaces/${new ObjectId().toHexString()}`)
        .send(deleteWorkspaceParam)

      expect(response.status).toEqual(404)
      expect(response.body).toEqual({
        message: new WorkspaceNotFoundError().message,
      })
    })

    it('should return 500 when database errors occur', async () => {
      await WorkspaceModel.create(MOCK_WORKSPACE_DOC)

      const mockErrorMessage = 'something went wrong'

      jest
        .spyOn(WorkspaceModel, 'deleteWorkspace')
        .mockRejectedValueOnce(new Error(mockErrorMessage))
      const response = await request
        .delete(DELETE_WORKSPACE_ENDPOINT)
        .send(deleteWorkspaceParam)

      expect(response.status).toEqual(500)
      expect(response.body).toEqual({
        message: formatErrorRecoveryMessage(mockErrorMessage),
      })
    })
  })

  describe('POST /workspaces/move', () => {
    const MOVE_WORKSPACE_ENDPOINT = `/workspaces/move`
    const FORM_ID_TO_MOVE = new ObjectId().toHexString()
    const moveWorkspaceParams = {
      formIds: [FORM_ID_TO_MOVE],
      destWorkspaceId: MOCK_WORKSPACE_ID.toString(),
    }

    it('should return 200 with the workspace when forms are successfully moved', async () => {
      await WorkspaceModel.create(MOCK_WORKSPACE_DOC)

      jest
        .spyOn(WorkspaceModel, 'removeFormIdsFromAllWorkspaces')
        .mockResolvedValueOnce()

      jest
        .spyOn(WorkspaceModel, 'addFormIdsToWorkspace')
        .mockImplementationOnce(async () => {
          await WorkspaceModel.updateOne(
            { _id: MOCK_WORKSPACE_ID },
            {
              $set: { formIds: [MOCK_FORM_ID.toHexString(), FORM_ID_TO_MOVE] },
            },
          )
          return (await WorkspaceModel.findOne({
            _id: MOCK_WORKSPACE_ID,
          })) as Workspace
        })

      const response = await request
        .post(MOVE_WORKSPACE_ENDPOINT)
        .send(moveWorkspaceParams)

      const expected = {
        title: MOCK_WORKSPACE_DOC.title,
        admin: MOCK_USER_ID.toHexString(),
        formIds: [MOCK_FORM_ID.toHexString(), FORM_ID_TO_MOVE],
      }

      expect(response.status).toEqual(200)
      expect(response.body).toMatchObject(expected)
    })

    it('should return 401 when user is not logged in', async () => {
      await logoutSession(request)
      const response = await request
        .post(MOVE_WORKSPACE_ENDPOINT)
        .send(moveWorkspaceParams)

      expect(response.status).toEqual(401)
      expect(response.body).toEqual({ message: 'User is unauthorized.' })
    })

    it('should return 403 when user does not own the workspace', async () => {
      const otherUserId = new ObjectId()
      const otherWorkspaceId = new ObjectId()
      await dbHandler.insertUser({
        userId: otherUserId,
        agencyId: new ObjectId(),
        mailName: 'different',
      })
      const workspaceBelongingToOtherAdmin = {
        _id: otherWorkspaceId,
        title: 'Workspace2',
        admin: otherUserId,
        formIds: [],
      }
      await WorkspaceModel.create(workspaceBelongingToOtherAdmin)
      const response = await request
        .post(MOVE_WORKSPACE_ENDPOINT)
        .send({ formIds: [FORM_ID_TO_MOVE], destWorkspaceId: otherWorkspaceId })

      expect(response.status).toEqual(403)
      expect(response.body).toEqual({
        message: new ForbiddenWorkspaceError().message,
      })
    })

    it('should return 500 when database errors occur for adding form to workspace', async () => {
      await WorkspaceModel.create(MOCK_WORKSPACE_DOC)

      const mockErrorMessage = 'something went wrong'

      jest
        .spyOn(WorkspaceModel, 'removeFormIdsFromAllWorkspaces')
        .mockResolvedValueOnce()

      jest
        .spyOn(WorkspaceModel, 'addFormIdsToWorkspace')
        .mockRejectedValueOnce(new Error(mockErrorMessage))

      const response = await request
        .post(MOVE_WORKSPACE_ENDPOINT)
        .send(moveWorkspaceParams)

      expect(response.status).toEqual(500)
      expect(response.body).toEqual({
        message: formatErrorRecoveryMessage(mockErrorMessage),
      })
    })

    it('should return 500 when database errors occur for removing form from workspace', async () => {
      await WorkspaceModel.create(MOCK_WORKSPACE_DOC)

      const mockErrorMessage = 'something went wrong'

      jest
        .spyOn(WorkspaceModel, 'removeFormIdsFromAllWorkspaces')
        .mockRejectedValueOnce(new Error(mockErrorMessage))

      const response = await request
        .post(MOVE_WORKSPACE_ENDPOINT)
        .send(moveWorkspaceParams)

      expect(response.status).toEqual(500)
      expect(response.body).toEqual({
        message: formatErrorRecoveryMessage(mockErrorMessage),
      })
    })
  })
})
