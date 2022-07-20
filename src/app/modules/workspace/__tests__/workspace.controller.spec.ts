import { ObjectId } from 'bson-ext'
import { errAsync, okAsync } from 'neverthrow'
import { mocked } from 'ts-jest/utils'

import * as WorkspaceService from 'src/app/modules/workspace/workspace.service'
import { IUserSchema } from 'src/types'

import expressHandler from 'tests/unit/backend/helpers/jest-express'

import { DatabaseConflictError, DatabaseError } from '../../core/core.errors'
import * as WorkspaceController from '../workspace.controller'

jest.mock('../workspace.service')
const MockWorkspaceService = mocked(WorkspaceService)

describe('workspace.controller', () => {
  beforeEach(() => jest.clearAllMocks())

  describe('getWorkspaces', () => {
    const MOCK_REQ = expressHandler.mockRequest({
      session: {
        user: {
          _id: 'exists',
        },
      },
    })

    it('should return 200 with an array of workspaces', async () => {
      const mockRes = expressHandler.mockResponse()
      MockWorkspaceService.getWorkspaces.mockReturnValueOnce(okAsync([]))
      await WorkspaceController.getWorkspaces(MOCK_REQ, mockRes, jest.fn())

      expect(mockRes.json).toHaveBeenCalledWith([])
    })

    it('should return 409 when database conflict error occurs', async () => {
      const mockRes = expressHandler.mockResponse()
      const mockErrorString = 'something went wrong'
      MockWorkspaceService.getWorkspaces.mockReturnValueOnce(
        errAsync(new DatabaseConflictError(mockErrorString)),
      )
      await WorkspaceController.getWorkspaces(MOCK_REQ, mockRes, jest.fn())

      expect(mockRes.status).toBeCalledWith(409)
      expect(mockRes.json).toBeCalledWith({ message: mockErrorString })
    })

    it('should return 500 when database error occurs', async () => {
      const mockRes = expressHandler.mockResponse()
      const mockErrorString = 'something went wrong'
      MockWorkspaceService.getWorkspaces.mockReturnValueOnce(
        errAsync(new DatabaseError(mockErrorString)),
      )
      await WorkspaceController.getWorkspaces(MOCK_REQ, mockRes, jest.fn())

      expect(mockRes.status).toBeCalledWith(500)
      expect(mockRes.json).toBeCalledWith({ message: mockErrorString })
    })
  })

  describe('createWorkspace', () => {
    const MOCK_WORKSPACE = {
      title: 'Workspace1',
      admin: new ObjectId() as IUserSchema['_id'],
      formIds: [],
      count: 0,
    }
    const MOCK_REQ = expressHandler.mockRequest({
      session: {
        user: {
          _id: 'exists',
        },
      },
      body: {
        title: MOCK_WORKSPACE.title,
      },
    })

    it('should return 200 with the created workspace', async () => {
      const mockRes = expressHandler.mockResponse()
      MockWorkspaceService.createWorkspace.mockReturnValueOnce(
        okAsync(MOCK_WORKSPACE),
      )
      await WorkspaceController.handleCreateWorkspace(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      expect(mockRes.json).toHaveBeenCalledWith(MOCK_WORKSPACE)
    })

    it('should return 500 when database error occurs', async () => {
      const mockRes = expressHandler.mockResponse()
      const mockErrorString = 'something went wrong'
      MockWorkspaceService.createWorkspace.mockReturnValueOnce(
        errAsync(new DatabaseError(mockErrorString)),
      )
      await WorkspaceController.handleCreateWorkspace(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      expect(mockRes.status).toBeCalledWith(500)
      expect(mockRes.json).toBeCalledWith({ message: mockErrorString })
    })
  })
})
