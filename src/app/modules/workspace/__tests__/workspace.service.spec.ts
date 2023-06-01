/* eslint-disable @typescript-eslint/ban-ts-comment */
import { ObjectId } from 'bson-ext'
import mongoose from 'mongoose'
import { FormId, FormStatus, UserId } from 'shared/types'
import { WorkspaceDto, WorkspaceId } from 'shared/types/workspace'

import getFormModel from 'src/app/models/form.server.model'
import { getWorkspaceModel } from 'src/app/models/workspace.server.model'
import * as WorkspaceService from 'src/app/modules/workspace/workspace.service'
import { formatErrorRecoveryMessage } from 'src/app/utils/handle-mongo-error'

import dbHandler from 'tests/unit/backend/helpers/jest-db'

import { DatabaseError, DatabaseValidationError } from '../../core/core.errors'
import {
  ForbiddenWorkspaceError,
  WorkspaceNotFoundError,
} from '../workspace.errors'

const WorkspaceModel = getWorkspaceModel(mongoose)
const FormModel = getFormModel(mongoose)

describe('workspace.service', () => {
  beforeAll(() => dbHandler.connect())
  afterAll(() => dbHandler.closeDatabase())
  afterEach(async () => {
    await dbHandler.clearDatabase()
  })
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
        _id: 'workspaceId' as WorkspaceId,
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

  describe('updateWorkspaceTitle', () => {
    const mockWorkspace = {
      _id: 'workspaceId' as WorkspaceId,
      admin: 'user' as UserId,
      title: 'workspace1',
      formIds: [] as FormId[],
    }

    it('should successfully update workspace title', async () => {
      const updateSpy = jest
        .spyOn(WorkspaceModel, 'updateWorkspaceTitle')
        .mockResolvedValueOnce(mockWorkspace)
      const actual = await WorkspaceService.updateWorkspaceTitle({
        workspaceId: mockWorkspace._id,
        title: mockWorkspace.title,
      })

      expect(updateSpy).toHaveBeenCalledWith({
        workspaceId: mockWorkspace._id,
        title: mockWorkspace.title,
      })
      expect(actual.isOk()).toEqual(true)
      expect(actual._unsafeUnwrap()).toEqual(mockWorkspace)
    })

    it('should return DatabaseValidationError on invalid title whilst creating form', async () => {
      const updateSpy = jest
        .spyOn(WorkspaceModel, 'updateWorkspaceTitle')
        // @ts-ignore
        .mockRejectedValueOnce(new mongoose.Error.ValidationError())

      const actual = await WorkspaceService.updateWorkspaceTitle({
        workspaceId: mockWorkspace._id,
        title: mockWorkspace.title,
      })

      expect(updateSpy).toHaveBeenCalledWith({
        workspaceId: mockWorkspace._id,
        title: mockWorkspace.title,
      })
      expect(actual._unsafeUnwrapErr()).toBeInstanceOf(DatabaseValidationError)
    })

    it('should return WorkspaceNotFoundError on invalid workspaceId', async () => {
      const updateSpy = jest
        .spyOn(WorkspaceModel, 'updateWorkspaceTitle')
        .mockResolvedValueOnce(null)

      const actual = await WorkspaceService.updateWorkspaceTitle({
        workspaceId: mockWorkspace._id,
        title: mockWorkspace.title,
      })

      expect(updateSpy).toHaveBeenCalledWith({
        workspaceId: mockWorkspace._id,
        title: mockWorkspace.title,
      })
      expect(actual._unsafeUnwrapErr()).toBeInstanceOf(WorkspaceNotFoundError)
    })

    it('should return DatabaseError when error occurs whilst creating workspace', async () => {
      const mockErrorMessage = 'some error'

      const updateSpy = jest
        .spyOn(WorkspaceModel, 'updateWorkspaceTitle')
        .mockRejectedValueOnce(new Error(mockErrorMessage))
      const actual = await WorkspaceService.updateWorkspaceTitle({
        workspaceId: mockWorkspace._id,
        title: mockWorkspace.title,
      })

      expect(updateSpy).toHaveBeenCalledWith({
        workspaceId: mockWorkspace._id,
        title: mockWorkspace.title,
      })
      expect(actual.isErr()).toEqual(true)
      expect(actual._unsafeUnwrapErr()).toEqual(
        new DatabaseError(formatErrorRecoveryMessage(mockErrorMessage)),
      )
    })
  })

  describe('verifyWorkspaceAdmin', () => {
    const mockWorkspaceId = new ObjectId()
    const mockAdmin = new ObjectId()
    const mockWorkspace = {
      _id: mockWorkspaceId.toHexString() as WorkspaceId,
      title: 'Workspace1',
      formIds: [],
      admin: mockAdmin.toHexString() as UserId,
    }

    it('should return true when user is workspace admin', async () => {
      await WorkspaceModel.create(mockWorkspace)

      const actual = await WorkspaceService.verifyWorkspaceAdmin(
        mockWorkspace,
        mockAdmin.toHexString(),
      )

      expect(actual.isOk()).toEqual(true)
      expect(actual._unsafeUnwrap()).toEqual(true)
    })

    it('should return false when user is not workspace admin', async () => {
      const mockNotAdmin = new ObjectId()
      await WorkspaceModel.create(mockWorkspace)
      const actual = await WorkspaceService.verifyWorkspaceAdmin(
        mockWorkspace,
        mockNotAdmin.toHexString(),
      )

      expect(actual.isErr()).toEqual(true)
      expect(actual._unsafeUnwrapErr()).toBeInstanceOf(ForbiddenWorkspaceError)
    })
  })

  describe('getWorkspace', () => {
    const mockWorkspaceId = new ObjectId()
    const mockWorkspace = {
      _id: mockWorkspaceId,
      title: 'Workspace1',
      formIds: [],
      admin: new ObjectId(),
    }
    it('should return workspace when workspace exists in the database', async () => {
      await WorkspaceModel.create(mockWorkspace)

      const saved = await WorkspaceService.getWorkspace(
        mockWorkspaceId.toHexString(),
      )

      expect(saved.isOk()).toEqual(true)
      expect(saved._unsafeUnwrap()._id).toEqual(mockWorkspaceId)
    })

    it('should return WorkspaceNotFoundError when workspace is not in database', async () => {
      await WorkspaceModel.create(mockWorkspace)
      const actual = await WorkspaceService.getWorkspace(
        new ObjectId().toHexString(),
      )

      expect(actual.isErr()).toEqual(true)
      expect(actual._unsafeUnwrapErr()).toBeInstanceOf(WorkspaceNotFoundError)
    })
  })

  describe('deleteWorkspace', () => {
    const mockFormId = new ObjectId().toHexString() as FormId
    const mockWorkspace = {
      _id: new ObjectId().toHexString() as WorkspaceId,
      admin: new ObjectId().toHexString() as UserId,
      title: 'workspace1',
      formIds: [mockFormId],
    }

    it('should return workspace when successfully deleted workspace', async () => {
      jest
        .spyOn(WorkspaceModel, 'deleteWorkspace')
        .mockResolvedValueOnce(mockWorkspace)

      const actual = await WorkspaceService.deleteWorkspace({
        workspaceId: mockWorkspace._id,
        userId: mockWorkspace.admin,
        shouldDeleteForms: false,
      })

      expect(actual.isOk()).toEqual(true)
      expect(actual._unsafeUnwrap()).toEqual(mockWorkspace)
    })

    it('should return null when failed to delete workspace', async () => {
      jest.spyOn(WorkspaceModel, 'deleteWorkspace').mockResolvedValueOnce(null)

      const actual = await WorkspaceService.deleteWorkspace({
        workspaceId: mockWorkspace._id,
        userId: mockWorkspace.admin,
        shouldDeleteForms: false,
      })

      expect(actual.isOk()).toEqual(true)
      expect(actual._unsafeUnwrap()).toEqual(null)
    })

    it('should not archive forms in the workspace when shouldDeleteForms is false', async () => {
      await dbHandler.insertEncryptForm({
        formId: new ObjectId(mockFormId),
        userId: new ObjectId(mockWorkspace.admin),
      })
      const createdWorkspace = await WorkspaceModel.create(mockWorkspace)

      jest
        .spyOn(WorkspaceModel, 'findOne')
        .mockResolvedValueOnce(createdWorkspace)
      jest
        .spyOn(WorkspaceModel, 'deleteWorkspace')
        .mockResolvedValueOnce(mockWorkspace)

      const actual = await WorkspaceService.deleteWorkspace({
        workspaceId: mockWorkspace._id,
        userId: mockWorkspace.admin,
        shouldDeleteForms: false,
      })
      const form = await FormModel.findById(mockFormId)

      expect(actual.isOk()).toEqual(true)
      expect(actual._unsafeUnwrap()).toEqual(mockWorkspace)
      expect(form).not.toBeNull()
      expect(form?.status).not.toEqual(FormStatus.Archived)
    })

    it('should archive forms in the workspace when shouldDeleteForms is true', async () => {
      await dbHandler.insertEncryptForm({
        formId: new ObjectId(mockFormId),
        userId: new ObjectId(mockWorkspace.admin),
      })
      const createdWorkspace = await WorkspaceModel.create(mockWorkspace)

      jest
        .spyOn(WorkspaceModel, 'findOne')
        .mockResolvedValueOnce(createdWorkspace)
      jest
        .spyOn(WorkspaceModel, 'deleteWorkspace')
        .mockResolvedValueOnce(mockWorkspace)
      jest
        .spyOn(FormModel, 'archiveForms')
        .mockImplementationOnce((formIds) => FormModel.archiveForms(formIds))

      const actual = await WorkspaceService.deleteWorkspace({
        workspaceId: mockWorkspace._id,
        userId: mockWorkspace.admin,
        shouldDeleteForms: true,
      })
      const form = await FormModel.findById(mockFormId)

      expect(actual.isOk()).toEqual(true)
      expect(actual._unsafeUnwrap()).toEqual(mockWorkspace)
      expect(form).not.toBeNull()
      expect(form?.status).toEqual(FormStatus.Archived)
    })

    it('should return DatabaseError when error occurs whilst creating workspace', async () => {
      const mockErrorMessage = 'some error'

      jest
        .spyOn(WorkspaceModel, 'deleteWorkspace')
        .mockRejectedValueOnce(new Error(mockErrorMessage))

      const actual = await WorkspaceService.deleteWorkspace({
        workspaceId: mockWorkspace._id,
        userId: mockWorkspace.admin,
        shouldDeleteForms: false,
      })

      expect(actual.isErr()).toEqual(true)
      expect(actual._unsafeUnwrapErr()).toBeInstanceOf(DatabaseError)
    })
  })
})
