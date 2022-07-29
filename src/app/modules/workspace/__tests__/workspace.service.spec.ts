/* eslint-disable @typescript-eslint/ban-ts-comment */
import mongoose from 'mongoose'
import { FormId, UserId } from 'shared/types'
import { WorkspaceDto } from 'shared/types/workspace'

import { getWorkspaceModel } from 'src/app/models/workspace.server.model'
import * as WorkspaceService from 'src/app/modules/workspace/workspace.service'
import { formatErrorRecoveryMessage } from 'src/app/utils/handle-mongo-error'

import { DatabaseError, DatabaseValidationError } from '../../core/core.errors'

const WorkspaceModel = getWorkspaceModel(mongoose)

describe('workspace.service', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
  })

  describe('getWorkspaces', () => {
    it('should return an array of workspaces that belong to the user', async () => {
      const mockWorkspaces = [
        {
          admin: 'user' as UserId,
          title: 'workspace1',
          formIds: [] as FormId[],
        },
      ] as WorkspaceDto[]
      const mockUserId = 'mockUserId'
      const getSpy = jest
        .spyOn(WorkspaceModel, 'getWorkspaces')
        .mockResolvedValueOnce(mockWorkspaces)
      const actual = await WorkspaceService.getWorkspaces(mockUserId)

      expect(getSpy).toHaveBeenCalledWith(mockUserId)
      expect(actual.isOk()).toEqual(true)
      expect(actual._unsafeUnwrap()).toEqual(mockWorkspaces)
    })

    it('should return DatabaseError when error occurs whilst querying the database', async () => {
      const mockUserId = 'mockUserId'
      const mockErrorMessage = 'some error'

      const getSpy = jest
        .spyOn(WorkspaceModel, 'getWorkspaces')
        .mockRejectedValueOnce(new Error(mockErrorMessage))
      const actual = await WorkspaceService.getWorkspaces(mockUserId)

      expect(getSpy).toHaveBeenCalledWith(mockUserId)
      expect(actual.isErr()).toEqual(true)
      expect(actual._unsafeUnwrapErr()).toEqual(
        new DatabaseError(formatErrorRecoveryMessage(mockErrorMessage)),
      )
    })
  })

  describe('createWorkspace', () => {
    it('should successfully create workspace', async () => {
      const mockWorkspace = {
        admin: 'user' as UserId,
        title: 'workspace1',
        formIds: [] as FormId[],
      } as WorkspaceDto

      const createSpy = jest
        .spyOn(WorkspaceModel, 'createWorkspace')
        .mockResolvedValueOnce(mockWorkspace)
      const actual = await WorkspaceService.createWorkspace(
        mockWorkspace.admin,
        mockWorkspace.title,
      )

      expect(createSpy).toHaveBeenCalledWith(
        mockWorkspace.title,
        mockWorkspace.admin,
      )
      expect(actual.isOk()).toEqual(true)
      expect(actual._unsafeUnwrap()).toEqual(mockWorkspace)
    })

    it('should return DatabaseValidationError on invalid title whilst creating form', async () => {
      const mockTitle = 'mockTitle'
      const mockUserId = 'mockUserId'

      const createSpy = jest
        .spyOn(WorkspaceModel, 'createWorkspace')
        // @ts-ignore
        .mockRejectedValueOnce(new mongoose.Error.ValidationError())

      const actual = await WorkspaceService.createWorkspace(
        mockUserId,
        mockTitle,
      )

      expect(createSpy).toHaveBeenCalledWith(mockTitle, mockUserId)
      expect(actual._unsafeUnwrapErr()).toBeInstanceOf(DatabaseValidationError)
    })

    it('should return DatabaseError when error occurs whilst creating workspace', async () => {
      const mockTitle = 'mockTitle'
      const mockUserId = 'mockUserId'
      const mockErrorMessage = 'some error'

      const createSpy = jest
        .spyOn(WorkspaceModel, 'createWorkspace')
        .mockRejectedValueOnce(new Error(mockErrorMessage))
      const actual = await WorkspaceService.createWorkspace(
        mockUserId,
        mockTitle,
      )

      expect(createSpy).toHaveBeenCalledWith(mockTitle, mockUserId)
      expect(actual.isErr()).toEqual(true)
      expect(actual._unsafeUnwrapErr()).toEqual(
        new DatabaseError(formatErrorRecoveryMessage(mockErrorMessage)),
      )
    })
  })
})
