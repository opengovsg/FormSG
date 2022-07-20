import { errAsync, okAsync } from 'neverthrow'
import { mocked } from 'ts-jest/utils'

import * as WorkspaceService from 'src/app/modules/workspace/workspace.service'

import expressHandler from 'tests/unit/backend/helpers/jest-express'

import { DatabaseError } from '../../core/core.errors'
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
})
