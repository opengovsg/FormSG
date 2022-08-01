import { ObjectId } from 'bson-ext'
import mongoose from 'mongoose'
import supertest, { Session } from 'supertest-session'

import { getWorkspaceModel } from 'src/app/models/workspace.server.model'
import { WorkspacesRouter } from 'src/app/routes/api/v3/admin/workspaces'
import { formatErrorRecoveryMessage } from 'src/app/utils/handle-mongo-error'

import {
  createAuthedSession,
  logoutSession,
} from 'tests/integration/helpers/express-auth'
import { setupApp } from 'tests/integration/helpers/express-setup'
import dbHandler from 'tests/unit/backend/helpers/jest-db'

import {
  ForbiddenWorkspaceError,
  WorkspaceNotFoundError,
} from '../workspace.errors'

const WorkspaceModel = getWorkspaceModel(mongoose)

const app = setupApp('/workspaces', WorkspacesRouter, {
  setupWithAuth: true,
})

const MOCK_USER_ID = new ObjectId()
const MOCK_FORM_ID = new ObjectId()
const MOCK_WORKSPACE_ID = new ObjectId()
const MOCK_WORKSPACE_DOC = {
  _id: MOCK_WORKSPACE_ID,
  title: 'Workspace1',
  admin: MOCK_USER_ID,
  formIds: [MOCK_FORM_ID],
}

describe('workspace.form.routes', () => {
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

  describe('POST /workspaces/:workspaceId/forms/move', () => {
    const MOVE_FORM_WORKSPACE_ENDPOINT = `/workspaces/${MOCK_WORKSPACE_ID}/forms/move`
    const mockDestWorkspaceId = new ObjectId()
    const mockDestWorkspaceDoc = {
      _id: mockDestWorkspaceId,
      title: 'destWorkspace',
      admin: MOCK_USER_ID,
      formIds: [],
    }

    beforeEach(async () => {
      await WorkspaceModel.create(MOCK_WORKSPACE_DOC)
      await WorkspaceModel.create(mockDestWorkspaceDoc)
      jest
        .spyOn(WorkspaceModel, 'removeFormIdsFromWorkspace')
        .mockImplementationOnce(({ workspaceId, formIds }) =>
          WorkspaceModel.removeFormIdsFromWorkspace({
            workspaceId,
            formIds,
          }),
        )
      jest
        .spyOn(WorkspaceModel, 'addFormIdsToWorkspace')
        .mockImplementationOnce(({ workspaceId, formIds }) =>
          WorkspaceModel.addFormIdsToWorkspace({
            workspaceId,
            formIds,
          }),
        )
    })
    afterEach(async () => {
      await dbHandler.clearDatabase()
      jest.clearAllMocks()
    })

    it('should return 200 with destination workspace on successful update of form workspace', async () => {
      const updateFormWorkspaceParams = {
        destWorkspaceId: mockDestWorkspaceId.toHexString(),
        formIds: [MOCK_FORM_ID.toHexString()],
      }

      const response = await request
        .post(MOVE_FORM_WORKSPACE_ENDPOINT)
        .send(updateFormWorkspaceParams)
      const expected = {
        title: mockDestWorkspaceDoc.title,
        admin: MOCK_USER_ID.toHexString(),
        formIds: [MOCK_FORM_ID.toHexString()],
      }

      expect(response.status).toEqual(200)
      expect(response.body).toMatchObject(expected)
    })

    it('should return 401 when user is not logged in', async () => {
      await logoutSession(request)
      const response = await request.post(MOVE_FORM_WORKSPACE_ENDPOINT)

      expect(response.status).toEqual(401)
      expect(response.body).toEqual({ message: 'User is unauthorized.' })
    })

    it('should return 403 when user does not have permission to edit the source workspace', async () => {
      const otherWorkspace = {
        _id: new ObjectId(),
        title: 'Workspace1',
        admin: new ObjectId(),
        formIds: [],
      }
      await WorkspaceModel.create(otherWorkspace)

      const updateFormWorkspaceParams = {
        destWorkspaceId: mockDestWorkspaceId.toHexString(),
        formIds: [MOCK_FORM_ID.toHexString()],
      }

      const response = await request
        .post(`/workspaces/${otherWorkspace._id}/forms/move`)
        .send(updateFormWorkspaceParams)

      expect(response.status).toEqual(403)
      expect(response.body).toEqual({
        message: new ForbiddenWorkspaceError().message,
      })
    })

    it('should return 403 when user does not have permission to edit the destination workspace', async () => {
      const otherWorkspace = {
        _id: new ObjectId(),
        title: 'Workspace1',
        admin: new ObjectId(),
        formIds: [],
      }
      await WorkspaceModel.create(otherWorkspace)

      const updateFormWorkspaceParams = {
        destWorkspaceId: otherWorkspace._id.toHexString(),
        formIds: [MOCK_FORM_ID.toHexString()],
      }

      const response = await request
        .post(MOVE_FORM_WORKSPACE_ENDPOINT)
        .send(updateFormWorkspaceParams)

      expect(response.status).toEqual(403)
      expect(response.body).toEqual({
        message: new ForbiddenWorkspaceError().message,
      })
    })

    it('should return 404 when source workspace does not exist', async () => {
      const nonExistentWorkspaceId = new ObjectId()

      const updateFormWorkspaceParams = {
        destWorkspaceId: mockDestWorkspaceId.toHexString(),
        formIds: [MOCK_FORM_ID.toHexString()],
      }

      const response = await request
        .post(`/workspaces/${nonExistentWorkspaceId}/forms/move`)
        .send(updateFormWorkspaceParams)

      expect(response.status).toEqual(404)
      expect(response.body).toEqual({
        message: new WorkspaceNotFoundError().message,
      })
    })

    it('should return 404 when destination workspace does not exist', async () => {
      const nonExistentWorkspaceId = new ObjectId()

      const updateFormWorkspaceParams = {
        destWorkspaceId: nonExistentWorkspaceId.toHexString(),
        formIds: [MOCK_FORM_ID.toHexString()],
      }

      const response = await request
        .post(MOVE_FORM_WORKSPACE_ENDPOINT)
        .send(updateFormWorkspaceParams)

      expect(response.status).toEqual(404)
      expect(response.body).toEqual({
        message: new WorkspaceNotFoundError().message,
      })
    })

    it('should return 500 when database errors occur', async () => {
      const updateFormWorkspaceParams = {
        destWorkspaceId: mockDestWorkspaceId.toHexString(),
        formIds: [],
      }

      const mockErrorMessage = 'something went wrong'
      jest
        .spyOn(WorkspaceModel, 'removeFormIdsFromWorkspace')
        .mockRejectedValueOnce(new Error(mockErrorMessage))
      const response = await request
        .post(MOVE_FORM_WORKSPACE_ENDPOINT)
        .send(updateFormWorkspaceParams)

      expect(response.status).toEqual(500)
      expect(response.body).toEqual({
        message: formatErrorRecoveryMessage(mockErrorMessage),
      })
    })
  })
})
