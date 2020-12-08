import { PresignedPost } from 'aws-sdk/clients/s3'
import { ObjectId } from 'bson-ext'
import { merge, omit } from 'lodash'
import mongoose, { Document } from 'mongoose'
import { errAsync, okAsync } from 'neverthrow'
import { mocked } from 'ts-jest/utils'

import getFormModel from 'src/app/models/form.server.model'
import {
  DatabaseConflictError,
  DatabaseError,
  DatabasePayloadSizeError,
  DatabaseValidationError,
} from 'src/app/modules/core/core.errors'
import { MissingUserError } from 'src/app/modules/user/user.errors'
import * as UserService from 'src/app/modules/user/user.service'
import { aws } from 'src/config/config'
import { VALID_UPLOAD_FILE_TYPES } from 'src/shared/constants'
import {
  DashboardFormView,
  FormLogoState,
  ICustomFormLogo,
  IEmailFormSchema,
  IEncryptedFormSchema,
  IFormSchema,
  IPopulatedUser,
  IUserSchema,
  PickDuplicateForm,
  ResponseMode,
  Status,
} from 'src/types'

import {
  CreatePresignedUrlError,
  InvalidFileTypeError,
} from '../admin-form.errors'
import {
  archiveForm,
  createForm,
  createPresignedPostForImages,
  createPresignedPostForLogos,
  duplicateForm,
  getDashboardForms,
} from '../admin-form.service'
import { DuplicateFormBody, OverrideProps } from '../admin-form.types'
import * as AdminFormUtils from '../admin-form.utils'

const FormModel = getFormModel(mongoose)

jest.mock('src/app/modules/user/user.service')
const MockUserService = mocked(UserService)

describe('admin-form.service', () => {
  beforeEach(() => jest.restoreAllMocks())
  describe('getDashboardForms', () => {
    it('should return list of forms user is authorized to view', async () => {
      // Arrange
      const mockUserId = 'mockUserId'
      const mockUser = {
        email: 'MOCK_EMAIL@example.com',
        _id: mockUserId,
      } as IUserSchema
      const mockDashboardForms: DashboardFormView[] = [
        {
          admin: {} as IPopulatedUser,
          title: 'test form 1',
          _id: 'any',
          responseMode: ResponseMode.Email,
        },
        {
          admin: {} as IPopulatedUser,
          title: 'test form 2',
          _id: 'any2',
          responseMode: ResponseMode.Encrypt,
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
      const mockUser = {
        email: 'MOCK_EMAIL@example.com',
        _id: mockUserId,
      } as IUserSchema
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
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
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
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
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
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
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
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
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
  describe('duplicateForm', () => {
    const MOCK_NEW_ADMIN_ID = new ObjectId().toHexString()
    const MOCK_VALID_FORM = ({
      _id: new ObjectId(),
      admin: new ObjectId(),
      endPage: {
        buttonLink: 'original form endpage link',
      },
      startPage: {
        logo: {
          state: FormLogoState.Custom,
          fileId: 'some file_id',
          fileName: 'some file name',
          fileSizeInBytes: 10000,
        } as ICustomFormLogo,
      },
    } as unknown) as IFormSchema
    const MOCK_EMAIL_OVERRIDE_PARAMS: DuplicateFormBody = {
      responseMode: ResponseMode.Email,
      title: 'mock new title',
      emails: ['mockExample@example.com'],
    }
    const MOCK_ENCRYPT_OVERRIDE_PARAMS: DuplicateFormBody = {
      responseMode: ResponseMode.Encrypt,
      title: 'mock new title',
      publicKey: 'some public key',
    }

    const createMockForm = (expectedParams: OverrideProps) =>
      merge({}, MOCK_VALID_FORM, {
        getDuplicateParams: jest.fn().mockReturnValue(expectedParams),
      }) as IFormSchema

    it('should successfully duplicate form', async () => {
      // Arrange
      const mockNewAdminId = new ObjectId().toHexString()
      const expectedParams: PickDuplicateForm & OverrideProps = {
        admin: MOCK_NEW_ADMIN_ID,
        ...MOCK_ENCRYPT_OVERRIDE_PARAMS,
      }
      const mockForm = createMockForm(expectedParams)

      // Mock util return
      const expectedOverrideProps = { title: 'new title' } as OverrideProps
      jest
        .spyOn(AdminFormUtils, 'processDuplicateOverrideProps')
        .mockReturnValueOnce(expectedOverrideProps)
      const expectedForm = createMockForm(expectedOverrideProps)
      const createSpy = jest
        .spyOn(FormModel, 'create')
        .mockResolvedValueOnce(expectedForm)

      // Act
      const actualResult = await duplicateForm(
        mockForm,
        mockNewAdminId,
        MOCK_EMAIL_OVERRIDE_PARAMS,
      )

      // Assert
      expect(actualResult.isOk()).toEqual(true)
      expect(actualResult._unsafeUnwrap()).toEqual(expectedForm)
      expect(createSpy).toHaveBeenCalledWith(expectedParams)
      expect(mockForm.getDuplicateParams).toHaveBeenCalledWith({
        ...expectedOverrideProps,
        // Should now have start page set to default
        startPage: {
          logo: {
            state: FormLogoState.Default,
          },
        },
      })
    })

    it('should omit buttonLink if original form link is to the form itself', async () => {
      // Arrange
      const mockNewAdminId = new ObjectId().toHexString()
      const expectedParams: PickDuplicateForm & OverrideProps = {
        admin: MOCK_NEW_ADMIN_ID,
        ...omit(MOCK_ENCRYPT_OVERRIDE_PARAMS, 'isTemplate'),
      }
      const mockForm = merge({}, MOCK_VALID_FORM, {
        endPage: {
          // Legacy: buttonLink is hashed link.
          buttonLink: `#!/${MOCK_VALID_FORM._id}`,
        },
        getDuplicateParams: jest.fn().mockReturnValue(expectedParams),
      }) as IFormSchema

      // Mock util return
      const expectedOverrideProps = {
        endPage: { buttonLink: 'has button link' },
      } as OverrideProps
      jest
        .spyOn(AdminFormUtils, 'processDuplicateOverrideProps')
        .mockReturnValueOnce(expectedOverrideProps)
      const expectedForm = createMockForm(expectedOverrideProps)
      const createSpy = jest
        .spyOn(FormModel, 'create')
        .mockResolvedValueOnce(expectedForm)

      // Act
      const actualResult = await duplicateForm(
        mockForm,
        mockNewAdminId,
        MOCK_EMAIL_OVERRIDE_PARAMS,
      )

      // Assert
      expect(actualResult.isOk()).toEqual(true)
      expect(actualResult._unsafeUnwrap()).toEqual(expectedForm)
      expect(createSpy).toHaveBeenCalledWith(expectedParams)
      expect(mockForm.getDuplicateParams).toHaveBeenCalledWith({
        // No more button link.
        endPage: {},
        startPage: {
          logo: {
            state: FormLogoState.Default,
          },
        },
      })
    })

    it('should return DatabaseError if error occurred during the duplication', async () => {
      // Arrange
      const mockNewAdminId = new ObjectId().toHexString()
      const expectedParams: PickDuplicateForm & OverrideProps = {
        admin: MOCK_NEW_ADMIN_ID,
        ...omit(MOCK_ENCRYPT_OVERRIDE_PARAMS, 'isTemplate'),
      }
      const mockForm = createMockForm(expectedParams)

      const mockErrorString = 'something went wrong!'
      const createSpy = jest
        .spyOn(FormModel, 'create')
        .mockRejectedValueOnce(new Error(mockErrorString))
      // Mock util return
      const expectedOverrideProps = { title: 'new title' } as OverrideProps
      jest
        .spyOn(AdminFormUtils, 'processDuplicateOverrideProps')
        .mockReturnValueOnce(expectedOverrideProps)

      // Act
      const actualResult = await duplicateForm(
        mockForm,
        mockNewAdminId,
        MOCK_EMAIL_OVERRIDE_PARAMS,
      )

      // Assert
      expect(actualResult.isErr()).toEqual(true)
      expect(actualResult._unsafeUnwrapErr()).toEqual(
        new DatabaseError(mockErrorString),
      )
      expect(createSpy).toHaveBeenCalledWith(expectedParams)
      expect(mockForm.getDuplicateParams).toHaveBeenCalledWith({
        ...expectedOverrideProps,
        // Should now have start page set to default
        startPage: {
          logo: {
            state: FormLogoState.Default,
          },
        },
      })
    })
  })

  describe('createForm', () => {
    it('should successfully create form', async () => {
      // Arrange
      const formParams: Parameters<typeof createForm>[0] = {
        title: 'create form title',
        admin: new ObjectId().toHexString(),
        responseMode: ResponseMode.Email,
        emails: 'example@example.com',
      }
      const expectedForm = {
        _id: new ObjectId(),
        ...formParams,
      } as IFormSchema
      const createSpy = jest
        .spyOn(FormModel, 'create')
        .mockResolvedValueOnce(expectedForm)

      // Act
      const actualResult = await createForm(formParams)

      // Assert
      expect(actualResult._unsafeUnwrap()).toEqual(expectedForm)
      expect(createSpy).toHaveBeenCalledWith(formParams)
    })

    it('should return DatabaseValidationError on invalid form params whilst creating form', async () => {
      // Arrange
      const formParams: Parameters<typeof createForm>[0] = {
        title: 'create form title',
        admin: new ObjectId().toHexString(),
        responseMode: ResponseMode.Encrypt,
        publicKey: 'some key',
      }
      const createSpy = jest
        .spyOn(FormModel, 'create')
        .mockRejectedValueOnce(new mongoose.Error.ValidationError())

      // Act
      const actualResult = await createForm(formParams)

      // Assert
      expect(actualResult._unsafeUnwrapErr()).toBeInstanceOf(
        DatabaseValidationError,
      )
      expect(createSpy).toHaveBeenCalledWith(formParams)
    })

    it('should return DatabaseConflictError on mongoose version error', async () => {
      // Arrange
      const formParams: Parameters<typeof createForm>[0] = {
        title: 'create form title',
        admin: new ObjectId().toHexString(),
        responseMode: ResponseMode.Encrypt,
        publicKey: 'some key',
      }
      const createSpy = jest
        .spyOn(FormModel, 'create')
        .mockRejectedValueOnce(
          new mongoose.Error.VersionError({} as Document, 1, ['none']),
        )

      // Act
      const actualResult = await createForm(formParams)

      // Assert
      expect(actualResult._unsafeUnwrapErr()).toBeInstanceOf(
        DatabaseConflictError,
      )
      expect(createSpy).toHaveBeenCalledWith(formParams)
    })

    it('should return DatabasePayloadError on form size error', async () => {
      // Arrange
      const formParams: Parameters<typeof createForm>[0] = {
        title: 'create form title',
        admin: new ObjectId().toHexString(),
        responseMode: ResponseMode.Encrypt,
        publicKey: 'some key',
      }
      const mockErrorString = 'some payload size error'
      const expectedError = Object.assign(new Error(mockErrorString), {
        name: 'FormSizeError',
      })
      const createSpy = jest
        .spyOn(FormModel, 'create')
        .mockRejectedValueOnce(expectedError)

      // Act
      const actualResult = await createForm(formParams)

      // Assert
      expect(actualResult._unsafeUnwrapErr()).toEqual(
        new DatabasePayloadSizeError(mockErrorString),
      )
      expect(createSpy).toHaveBeenCalledWith(formParams)
    })

    it('should return DatabaseError on database error whilst creating form', async () => {
      // Arrange
      const formParams: Parameters<typeof createForm>[0] = {
        title: 'create form title',
        admin: new ObjectId().toHexString(),
        responseMode: ResponseMode.Encrypt,
        publicKey: 'some key',
      }
      const mockErrorString = 'no'
      const createSpy = jest
        .spyOn(FormModel, 'create')
        .mockRejectedValueOnce(new Error(mockErrorString))

      // Act
      const actualResult = await createForm(formParams)

      // Assert
      expect(actualResult._unsafeUnwrapErr()).toEqual(
        new DatabaseError(mockErrorString),
      )
      expect(createSpy).toHaveBeenCalledWith(formParams)
    })
  })
})
