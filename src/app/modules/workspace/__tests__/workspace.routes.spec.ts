import { ObjectId } from 'bson-ext'
import mongoose from 'mongoose'
import supertest, { Session } from 'supertest-session'

import { getWorkspaceModel } from 'src/app/models/workspace.server.model'
import { WorkspacesRouter } from 'src/app/routes/api/v3/admin/workspaces'

import {
  createAuthedSession,
  logoutSession,
} from 'tests/integration/helpers/express-auth'
import { setupApp } from 'tests/integration/helpers/express-setup'
import dbHandler from 'tests/unit/backend/helpers/jest-db'
import { jsonParseStringify } from 'tests/unit/backend/helpers/serialize-data'

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
  formIds: [],
}

describe('workspaces.routes', () => {
  let request: Session

  beforeAll(async () => await dbHandler.connect())
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
  afterAll(async () => await dbHandler.closeDatabase())

  describe('GET /workspaces', () => {
    const GET_WORKSPACES_ENDPOINT = '/workspaces'

    it('should return 200 with an empty array when a user has no workspaces', async () => {
      const response = await request.get('/workspaces')

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
      jest
        .spyOn(WorkspaceModel, 'getWorkspaces')
        .mockRejectedValueOnce(new Error('something went wrong'))
      const response = await request.get(GET_WORKSPACES_ENDPOINT)

      expect(response.status).toEqual(500)
      expect(response.body).toEqual({
        message: 'Something went wrong. Please try again.',
      })
    })
  })
})
