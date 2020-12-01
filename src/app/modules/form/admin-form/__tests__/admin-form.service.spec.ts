import { PresignedPost } from 'aws-sdk/clients/s3'
import { ObjectId } from 'bson-ext'
import mongoose from 'mongoose'
import { errAsync, okAsync } from 'neverthrow'
import { mocked } from 'ts-jest/utils'

import getFormModel from 'src/app/models/form.server.model'
import { DatabaseError } from 'src/app/modules/core/core.errors'
import { MissingUserError } from 'src/app/modules/user/user.errors'
import * as UserService from 'src/app/modules/user/user.service'
import { aws } from 'src/config/config'
import { VALID_UPLOAD_FILE_TYPES } from 'src/shared/constants'
import {
  DashboardFormView,
  IEmailFormSchema,
  IEncryptedFormSchema,
  IPopulatedUser,
  IUserSchema,
  Status,
} from 'src/types'

import {
  CreatePresignedUrlError,
  InvalidFileTypeError,
} from '../admin-form.errors'
import {
  archiveForm,
  createPresignedPostForImages,
  createPresignedPostForLogos,
  getDashboardForms,
} from '../admin-form.service'

const FormModel = getFormModel(mongoose)

jest.mock('src/app/modules/user/user.service')
const MockUserService = mocked(UserService)

describe('admin-form.service', () => {
  beforeEach(() => jest.restoreAllMocks())
  describe('getDashboardForms', () => {
    it('should return list of forms user is authorized to view', async () => {
      // Arrange
      const mockUserId = 'mockUserId'
      const mockUser: Partial<IUserSchema> = {
        email: 'MOCK_EMAIL@example.com',
        _id: mockUserId,
      }
      const mockDashboardForms: DashboardFormView[] = [
        {
          admin: {} as IPopulatedUser,
          title: 'test form 1',
        },
        {
          admin: {} as IPopulatedUser,
          title: 'test form 2',
        },
      ]
      // Mock user admin success.
      MockUserService.findAdminById.mockReturnValueOnce(
        okAsync(mockUser as IUserSchema),
      )
      const getSpy = jest
        .spyOn(FormModel, 'getDashboardForms')
        .mockResolvedValueOnce(mockDashboardForms)

      // Act
      const actualResult = await getDashboardForms(mockUserId)

      // Assert
      expect(getSpy).toHaveBeenCalledWith(mockUserId, mockUser.email)
      expect(actualResult.isOk()).toEqual(true)
      expect(actualResult._unsafeUnwrap()).toEqual(mockDashboardForms)
    })

    it('should return MissingUserError when user with userId does not exist', async () => {
      // Arrange
      const expectedError = new MissingUserError('not found')
      MockUserService.findAdminById.mockReturnValueOnce(errAsync(expectedError))

      // Act
      const actualResult = await getDashboardForms('any')

      // Assert
      expect(actualResult.isErr()).toEqual(true)
      // Error should passthrough.
      expect(actualResult._unsafeUnwrapErr()).toEqual(expectedError)
    })

    it('should return DatabaseError when error occurs whilst querying the database', async () => {
      // Arrange
      const mockUserId = 'mockUserId'
      const mockUser: Partial<IUserSchema> = {
        email: 'MOCK_EMAIL@example.com',
        _id: mockUserId,
      }
      // Mock user admin success.
      MockUserService.findAdminById.mockReturnValueOnce(
        okAsync(mockUser as IUserSchema),
      )
      const getSpy = jest
        .spyOn(FormModel, 'getDashboardForms')
        .mockRejectedValueOnce(new Error('some error'))

      // Act
      const actualResult = await getDashboardForms(mockUserId)

      // Assert
      expect(getSpy).toHaveBeenCalledWith(mockUserId, mockUser.email)
      expect(actualResult.isErr()).toEqual(true)
      expect(actualResult._unsafeUnwrapErr()).toEqual(new DatabaseError())
    })
  })

  describe('createPresignedPostForImages', () => {
    it('should successfully create presigned POST URL', async () => {
      // Arrange
      const expectedPresignedPost: PresignedPost = {
        fields: {
          'X-Amz-Signature': 'some-amz-signature',
          Policy: 'some policy',
        },
        url: 'some url',
      }
      // Mock external service success.
      const s3Spy = jest
        .spyOn(aws.s3, 'createPresignedPost')
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        .mockImplementationOnce((_obj, cb) => {
          cb(null, expectedPresignedPost)
        })

      // Act
      const actualResult = await createPresignedPostForImages({
        fileId: 'any id',
        fileMd5Hash: 'any hash',
        fileType: VALID_UPLOAD_FILE_TYPES[0],
      })

      // Assert
      // Check that the correct bucket was used.
      expect(s3Spy).toHaveBeenCalledWith(
        expect.objectContaining({ Bucket: aws.imageS3Bucket }),
        expect.any(Function),
      )
      expect(actualResult.isOk()).toEqual(true)
      expect(actualResult._unsafeUnwrap()).toEqual(expectedPresignedPost)
    })

    it('should return InvalidFileTypeError when given file type is not supported', async () => {
      // Arrange
      const invalidFileType = 'something'
      expect(VALID_UPLOAD_FILE_TYPES.includes(invalidFileType)).toEqual(false)

      // Act
      const actualResult = await createPresignedPostForImages({
        fileId: 'any id',
        fileMd5Hash: 'any hash',
        fileType: invalidFileType,
      })

      // Assert
      expect(actualResult.isErr()).toEqual(true)
      expect(actualResult._unsafeUnwrapErr()).toEqual(
        new InvalidFileTypeError(
          `"${invalidFileType}" is not a supported file type`,
        ),
      )
    })

    it('should return CreatePresignedUrlError when error occurs whilst creating presigned POST URL', async () => {
      // Arrange
      // Mock external service failure.
      const s3Spy = jest
        .spyOn(aws.s3, 'createPresignedPost')
        .mockImplementationOnce(() => {
          throw new Error('boom')
        })

      // Act
      const actualResult = await createPresignedPostForImages({
        fileId: 'any id',
        fileMd5Hash: 'any hash',
        fileType: VALID_UPLOAD_FILE_TYPES[0],
      })

      // Assert
      // Check that the correct bucket was used.
      expect(s3Spy).toHaveBeenCalledWith(
        expect.objectContaining({ Bucket: aws.imageS3Bucket }),
        expect.any(Function),
      )
      expect(actualResult.isErr()).toEqual(true)
      expect(actualResult._unsafeUnwrapErr()).toEqual(
        new CreatePresignedUrlError('Error occurred whilst uploading file'),
      )
    })
  })

  describe('createPresignedPostForLogos', () => {
    it('should successfully create presigned POST URL', async () => {
      // Arrange
      const expectedPresignedPost: PresignedPost = {
        fields: {
          'X-Amz-Signature': 'some-amz-signature',
          Policy: 'some policy',
        },
        url: 'some url',
      }
      // Mock external service success.
      const s3Spy = jest
        .spyOn(aws.s3, 'createPresignedPost')
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        .mockImplementationOnce((_obj, cb) => {
          cb(null, expectedPresignedPost)
        })

      // Act
      const actualResult = await createPresignedPostForLogos({
        fileId: 'any id',
        fileMd5Hash: 'any hash',
        fileType: VALID_UPLOAD_FILE_TYPES[0],
      })

      // Assert
      // Check that the correct bucket was used.
      expect(s3Spy).toHaveBeenCalledWith(
        expect.objectContaining({ Bucket: aws.logoS3Bucket }),
        expect.any(Function),
      )
      expect(actualResult.isOk()).toEqual(true)
      expect(actualResult._unsafeUnwrap()).toEqual(expectedPresignedPost)
    })

    it('should return InvalidFileTypeError when given file type is not supported', async () => {
      // Arrange
      const invalidFileType = 'something'
      expect(VALID_UPLOAD_FILE_TYPES.includes(invalidFileType)).toEqual(false)

      // Act
      const actualResult = await createPresignedPostForLogos({
        fileId: 'any id',
        fileMd5Hash: 'any hash',
        fileType: invalidFileType,
      })

      // Assert
      expect(actualResult.isErr()).toEqual(true)
      expect(actualResult._unsafeUnwrapErr()).toEqual(
        new InvalidFileTypeError(
          `"${invalidFileType}" is not a supported file type`,
        ),
      )
    })

    it('should return CreatePresignedUrlError when error occurs whilst creating presigned POST URL', async () => {
      // Arrange
      // Mock external service failure.
      const s3Spy = jest
        .spyOn(aws.s3, 'createPresignedPost')
        .mockImplementationOnce(() => {
          throw new Error('boom')
        })

      // Act
      const actualResult = await createPresignedPostForLogos({
        fileId: 'any id',
        fileMd5Hash: 'any hash',
        fileType: VALID_UPLOAD_FILE_TYPES[0],
      })

      // Assert
      // Check that the correct bucket was used.
      expect(s3Spy).toHaveBeenCalledWith(
        expect.objectContaining({ Bucket: aws.logoS3Bucket }),
        expect.any(Function),
      )
      expect(actualResult.isErr()).toEqual(true)
      expect(actualResult._unsafeUnwrapErr()).toEqual(
        new CreatePresignedUrlError('Error occurred whilst uploading file'),
      )
    })
  })

  describe('archiveForm', () => {
    it('should true when form is successfully archived', async () => {
      // Arrange
      const mockArchivedForm = {
        _id: new ObjectId(),
        admin: new ObjectId(),
        status: Status.Archived,
      } as IEmailFormSchema
      const mockArchiveFn = jest.fn().mockResolvedValue(mockArchivedForm)
      const mockInitialForm = ({
        archive: mockArchiveFn,
      } as unknown) as IEmailFormSchema

      // Act
      const actual = await archiveForm(mockInitialForm)

      // Assert
      expect(actual.isOk()).toEqual(true)
      expect(actual._unsafeUnwrap()).toEqual(true)
    })

    it('should return DatabaseError if any database errors occur', async () => {
      // Arrange
      const mockErrorString = 'database went wrong something'
      const mockArchiveFn = jest
        .fn()
        .mockRejectedValue(new Error(mockErrorString))
      const mockInitialForm = ({
        archive: mockArchiveFn,
      } as unknown) as IEncryptedFormSchema

      // Act
      const actual = await archiveForm(mockInitialForm)

      // Assert
      expect(actual.isErr()).toEqual(true)
      expect(actual._unsafeUnwrapErr()).toEqual(
        new DatabaseError(mockErrorString),
      )
    })
  })
})
