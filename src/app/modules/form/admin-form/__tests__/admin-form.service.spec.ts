/* eslint-disable @typescript-eslint/ban-ts-comment */
import { PresignedPost } from 'aws-sdk/clients/s3'
import { ObjectId } from 'bson-ext'
import { assignIn, cloneDeep, merge, omit } from 'lodash'
import mongoose from 'mongoose'
import { err, errAsync, ok, okAsync } from 'neverthrow'
import { mocked } from 'ts-jest/utils'

import { aws } from 'src/app/config/config'
import getFormModel, {
  getEmailFormModel,
  getEncryptedFormModel,
} from 'src/app/models/form.server.model'
import {
  DatabaseConflictError,
  DatabaseError,
  DatabasePayloadSizeError,
  DatabaseValidationError,
} from 'src/app/modules/core/core.errors'
import { MissingUserError } from 'src/app/modules/user/user.errors'
import * as UserService from 'src/app/modules/user/user.service'
import { formatErrorRecoveryMessage } from 'src/app/utils/handle-mongo-error'
import { EditFieldActions, VALID_UPLOAD_FILE_TYPES } from 'src/shared/constants'
import {
  AuthType,
  BasicField,
  FormLogoState,
  FormMetaView,
  FormSettings,
  ICustomFormLogo,
  IEmailFormSchema,
  IFormDocument,
  IFormSchema,
  IPopulatedForm,
  IPopulatedUser,
  IUserSchema,
  PickDuplicateForm,
  ResponseMode,
  Status,
} from 'src/types'
import { FieldUpdateDto, SettingsUpdateDto } from 'src/types/api'

import { generateDefaultField } from 'tests/unit/backend/helpers/generate-form-data'

import { TransferOwnershipError } from '../../form.errors'
import {
  CreatePresignedUrlError,
  EditFieldError,
  FieldNotFoundError,
  InvalidFileTypeError,
} from '../admin-form.errors'
import {
  archiveForm,
  createForm,
  createPresignedPostUrlForImages,
  createPresignedPostUrlForLogos,
  duplicateForm,
  editFormFields,
  getDashboardForms,
  transferFormOwnership,
  updateForm,
  updateFormField,
  updateFormSettings,
} from '../admin-form.service'
import {
  DuplicateFormBody,
  EditFormFieldParams,
  OverrideProps,
} from '../admin-form.types'
import * as AdminFormUtils from '../admin-form.utils'

const FormModel = getFormModel(mongoose)
const EmailFormModel = getEmailFormModel(mongoose)
const EncryptFormModel = getEncryptedFormModel(mongoose)

jest.mock('src/app/modules/user/user.service')
const MockUserService = mocked(UserService)

describe('admin-form.service', () => {
  beforeEach(() => jest.clearAllMocks())

  describe('getDashboardForms', () => {
    it('should return list of forms user is authorized to view', async () => {
      // Arrange
      const mockUserId = 'mockUserId'
      const mockUser = {
        email: 'MOCK_EMAIL@example.com',
        _id: mockUserId,
      } as IUserSchema
      const mockDashboardForms: FormMetaView[] = [
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
      MockUserService.findUserById.mockReturnValueOnce(
        okAsync(mockUser as IUserSchema),
      )
      const getSpy = jest
        .spyOn(FormModel, 'getMetaByUserIdOrEmail')
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
      MockUserService.findUserById.mockReturnValueOnce(errAsync(expectedError))

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
      MockUserService.findUserById.mockReturnValueOnce(
        okAsync(mockUser as IUserSchema),
      )
      const getSpy = jest
        .spyOn(FormModel, 'getMetaByUserIdOrEmail')
        .mockRejectedValueOnce(new Error('some error'))

      // Act
      const actualResult = await getDashboardForms(mockUserId)

      // Assert
      expect(getSpy).toHaveBeenCalledWith(mockUserId, mockUser.email)
      expect(actualResult.isErr()).toEqual(true)
      expect(actualResult._unsafeUnwrapErr()).toEqual(new DatabaseError())
    })
  })

  describe('createPresignedPostUrlForImages', () => {
    it('should successfully create presigned POST URL', async () => {
      // Arrange
      const expectedPresignedPostUrl: PresignedPost = {
        fields: {
          'X-Amz-Signature': 'some-amz-signature',
          Policy: 'some policy',
        },
        url: 'some url',
      }
      // Mock external service success.
      const s3Spy = jest
        .spyOn(aws.s3, 'createPresignedPost')

        // @ts-ignore
        .mockImplementationOnce((_obj, cb) => {
          cb(null, expectedPresignedPostUrl)
        })

      // Act
      const actualResult = await createPresignedPostUrlForImages({
        fileId: 'any id',
        fileMd5Hash: 'any hash',
        fileType: VALID_UPLOAD_FILE_TYPES[0],
      })

      // Assert
      // Check that the correct bucket was used.
      expect(s3Spy).toHaveBeenCalledWith(
        expect.objectContaining({ Bucket: aws.imageS3Bucket }),

        // @ts-ignore
        expect.any(Function),
      )
      expect(actualResult.isOk()).toEqual(true)
      expect(actualResult._unsafeUnwrap()).toEqual(expectedPresignedPostUrl)
    })

    it('should return InvalidFileTypeError when given file type is not supported', async () => {
      // Arrange
      const invalidFileType = 'something'
      expect(VALID_UPLOAD_FILE_TYPES.includes(invalidFileType)).toEqual(false)

      // Act
      const actualResult = await createPresignedPostUrlForImages({
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
      const actualResult = await createPresignedPostUrlForImages({
        fileId: 'any id',
        fileMd5Hash: 'any hash',
        fileType: VALID_UPLOAD_FILE_TYPES[0],
      })

      // Assert
      // Check that the correct bucket was used.
      expect(s3Spy).toHaveBeenCalledWith(
        expect.objectContaining({ Bucket: aws.imageS3Bucket }),

        // @ts-ignore
        expect.any(Function),
      )
      expect(actualResult.isErr()).toEqual(true)
      expect(actualResult._unsafeUnwrapErr()).toEqual(
        new CreatePresignedUrlError('Error occurred whilst uploading file'),
      )
    })
  })

  describe('createPresignedPostUrlForLogos', () => {
    it('should successfully create presigned POST URL', async () => {
      // Arrange
      const expectedPresignedPostUrl: PresignedPost = {
        fields: {
          'X-Amz-Signature': 'some-amz-signature',
          Policy: 'some policy',
        },
        url: 'some url',
      }
      // Mock external service success.
      const s3Spy = jest
        .spyOn(aws.s3, 'createPresignedPost')

        // @ts-ignore
        .mockImplementationOnce((_obj, cb) => {
          cb(null, expectedPresignedPostUrl)
        })

      // Act
      const actualResult = await createPresignedPostUrlForLogos({
        fileId: 'any id',
        fileMd5Hash: 'any hash',
        fileType: VALID_UPLOAD_FILE_TYPES[0],
      })

      // Assert
      // Check that the correct bucket was used.
      expect(s3Spy).toHaveBeenCalledWith(
        expect.objectContaining({ Bucket: aws.logoS3Bucket }),

        // @ts-ignore
        expect.any(Function),
      )
      expect(actualResult.isOk()).toEqual(true)
      expect(actualResult._unsafeUnwrap()).toEqual(expectedPresignedPostUrl)
    })

    it('should return InvalidFileTypeError when given file type is not supported', async () => {
      // Arrange
      const invalidFileType = 'something'
      expect(VALID_UPLOAD_FILE_TYPES.includes(invalidFileType)).toEqual(false)

      // Act
      const actualResult = await createPresignedPostUrlForLogos({
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
      const actualResult = await createPresignedPostUrlForLogos({
        fileId: 'any id',
        fileMd5Hash: 'any hash',
        fileType: VALID_UPLOAD_FILE_TYPES[0],
      })

      // Assert
      // Check that the correct bucket was used.
      expect(s3Spy).toHaveBeenCalledWith(
        expect.objectContaining({ Bucket: aws.logoS3Bucket }),

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
      } as unknown) as IPopulatedForm

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
      } as unknown) as IPopulatedForm

      // Act
      const actual = await archiveForm(mockInitialForm)

      // Assert
      expect(actual.isErr()).toEqual(true)
      expect(actual._unsafeUnwrapErr()).toEqual(
        new DatabaseError(formatErrorRecoveryMessage(mockErrorString)),
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
    } as unknown) as IFormDocument
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
      }) as IFormDocument

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
        .mockResolvedValueOnce(expectedForm as never)

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
      }) as IFormDocument

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
        .mockResolvedValueOnce(expectedForm as never)

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
        .mockRejectedValueOnce(new Error(mockErrorString) as never)
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
        new DatabaseError(formatErrorRecoveryMessage(mockErrorString)),
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

  describe('transferFormOwnership', () => {
    const MOCK_NEW_OWNER_EMAIL = 'random@example.com'
    const MOCK_CURRENT_OWNER = {
      _id: new ObjectId(),
      email: 'someemail@example.com',
    } as IUserSchema
    const MOCK_NEW_OWNER = {
      _id: new ObjectId(),
      email: MOCK_NEW_OWNER_EMAIL,
    } as IUserSchema

    it('should return updated form with new owner successfully', async () => {
      // Arrange
      const expectedPopulateResult = {
        title: 'mock populated form',
      } as IPopulatedForm

      const mockUpdatedForm = ({
        _id: new ObjectId(),
        admin: MOCK_CURRENT_OWNER,
        emails: [MOCK_NEW_OWNER_EMAIL],
        responseMode: ResponseMode.Email,
        title: 'some mock form',
        populate: jest.fn().mockReturnValue({
          execPopulate: jest.fn().mockResolvedValue(expectedPopulateResult),
        }),
      } as unknown) as IFormSchema

      const mockValidForm = ({
        title: 'some mock form',
        admin: MOCK_CURRENT_OWNER,
        transferOwner: jest.fn().mockResolvedValue(mockUpdatedForm),
      } as unknown) as IPopulatedForm

      MockUserService.findUserById.mockReturnValueOnce(
        okAsync(MOCK_CURRENT_OWNER),
      )
      MockUserService.findUserByEmail.mockReturnValueOnce(
        okAsync(MOCK_NEW_OWNER),
      )

      // Act
      const actualResult = await transferFormOwnership(
        mockValidForm,
        MOCK_NEW_OWNER_EMAIL,
      )

      // Assert
      expect(actualResult.isOk()).toEqual(true)
      expect(actualResult._unsafeUnwrap()).toEqual(expectedPopulateResult)
      expect(mockValidForm.transferOwner).toHaveBeenCalledWith(
        MOCK_CURRENT_OWNER,
        MOCK_NEW_OWNER,
      )
      expect(mockUpdatedForm.populate).toHaveBeenCalled()
    })

    it('should return TransferOwnershipError when new owner cannot be found in the database', async () => {
      // Arrange
      MockUserService.findUserById.mockReturnValueOnce(
        okAsync(MOCK_CURRENT_OWNER),
      )
      // Mock unable to retrieve new owner.
      MockUserService.findUserByEmail.mockReturnValueOnce(
        errAsync(new MissingUserError()),
      )
      const mockValidForm = ({
        title: 'some mock form',
        admin: MOCK_CURRENT_OWNER,
        transferOwner: jest.fn(),
      } as unknown) as IPopulatedForm

      // Act
      const actualResult = await transferFormOwnership(
        mockValidForm,
        MOCK_NEW_OWNER_EMAIL,
      )

      // Assert
      expect(actualResult.isErr()).toEqual(true)
      // Messaging should have been overridden.
      expect(actualResult._unsafeUnwrapErr()).toEqual(
        new TransferOwnershipError(
          `${MOCK_NEW_OWNER.email} must have logged in once before being added as Owner`,
        ),
      )
      expect(mockValidForm.transferOwner).not.toHaveBeenCalled()
    })

    it('should return MissingUserError when current form owner cannot be found in the database', async () => {
      // Arrange
      const mockValidForm = ({
        title: 'some mock form',
        admin: MOCK_CURRENT_OWNER,
        transferOwner: jest.fn(),
      } as unknown) as IPopulatedForm
      MockUserService.findUserById.mockReturnValueOnce(
        errAsync(new MissingUserError()),
      )

      // Act
      const actualResult = await transferFormOwnership(
        mockValidForm,
        MOCK_NEW_OWNER_EMAIL,
      )

      // Assert
      expect(actualResult.isErr()).toEqual(true)
      // Messaging should have been overridden.
      expect(actualResult._unsafeUnwrapErr()).toEqual(new MissingUserError())
      expect(mockValidForm.transferOwner).not.toHaveBeenCalled()
    })

    it('should return DatabaseError when database error occurs whilst retrieving current form owner', async () => {
      // Arrange
      const mockValidForm = ({
        title: 'some mock form',
        admin: MOCK_CURRENT_OWNER,
        transferOwner: jest.fn(),
      } as unknown) as IPopulatedForm
      MockUserService.findUserById.mockReturnValueOnce(
        errAsync(new DatabaseError()),
      )

      // Act
      const actualResult = await transferFormOwnership(
        mockValidForm,
        MOCK_NEW_OWNER_EMAIL,
      )

      // Assert
      expect(actualResult.isErr()).toEqual(true)
      // Messaging should have been overridden.
      expect(actualResult._unsafeUnwrapErr()).toEqual(new DatabaseError())
      expect(mockValidForm.transferOwner).not.toHaveBeenCalled()
    })

    it('should return DatabaseError when database error occurs whilst retrieving new owner', async () => {
      // Arrange
      MockUserService.findUserById.mockReturnValueOnce(
        okAsync(MOCK_CURRENT_OWNER),
      )
      MockUserService.findUserByEmail.mockReturnValueOnce(
        errAsync(new DatabaseError()),
      )
      const mockValidForm = ({
        title: 'some mock form',
        admin: MOCK_CURRENT_OWNER,
        transferOwner: jest.fn(),
      } as unknown) as IPopulatedForm

      // Act
      const actualResult = await transferFormOwnership(
        mockValidForm,
        MOCK_NEW_OWNER_EMAIL,
      )

      // Assert
      expect(actualResult.isErr()).toEqual(true)
      // Messaging should have been overridden.
      expect(actualResult._unsafeUnwrapErr()).toEqual(new DatabaseError())
      expect(mockValidForm.transferOwner).not.toHaveBeenCalled()
    })

    it('should return TransferOwnershipError when new owner is same as current owner', async () => {
      // Arrange
      MockUserService.findUserById.mockReturnValueOnce(
        okAsync(MOCK_CURRENT_OWNER),
      )
      const mockValidForm = ({
        title: 'some mock form',
        admin: MOCK_CURRENT_OWNER,
        transferOwner: jest.fn(),
      } as unknown) as IPopulatedForm

      // Act
      const actualResult = await transferFormOwnership(
        mockValidForm,
        // Should trigger error since new owner email is the same as current.
        MOCK_CURRENT_OWNER.email,
      )

      // Assert
      expect(actualResult.isErr()).toEqual(true)
      expect(actualResult._unsafeUnwrapErr()).toEqual(
        new TransferOwnershipError('You are already the owner of this form'),
      )
      expect(mockValidForm.transferOwner).not.toHaveBeenCalled()
      expect(MockUserService.findUserByEmail).not.toHaveBeenCalled()
    })

    it('should return DatabaseError when database error occurs during populating the updated form', async () => {
      // Arrange
      const mockPopulateErrorStr = 'population failed!'
      const mockUpdatedForm = ({
        _id: new ObjectId(),
        admin: MOCK_CURRENT_OWNER,
        emails: [MOCK_NEW_OWNER_EMAIL],
        responseMode: ResponseMode.Email,
        title: 'some mock form',
        populate: jest.fn().mockReturnValue({
          // Mock populate error.
          execPopulate: jest
            .fn()
            .mockRejectedValue(new Error(mockPopulateErrorStr)),
        }),
      } as unknown) as IFormSchema

      const mockValidForm = ({
        title: 'some mock form',
        admin: MOCK_CURRENT_OWNER,
        transferOwner: jest.fn().mockResolvedValue(mockUpdatedForm),
      } as unknown) as IPopulatedForm

      MockUserService.findUserById.mockReturnValueOnce(
        okAsync(MOCK_CURRENT_OWNER),
      )
      MockUserService.findUserByEmail.mockReturnValueOnce(
        okAsync(MOCK_NEW_OWNER),
      )

      // Act
      const actualResult = await transferFormOwnership(
        mockValidForm,
        MOCK_NEW_OWNER_EMAIL,
      )

      // Assert
      expect(actualResult.isErr()).toEqual(true)
      expect(actualResult._unsafeUnwrapErr()).toEqual(
        new DatabaseError(formatErrorRecoveryMessage(mockPopulateErrorStr)),
      )
      expect(mockValidForm.transferOwner).toHaveBeenCalledWith(
        MOCK_CURRENT_OWNER,
        MOCK_NEW_OWNER,
      )
      expect(mockUpdatedForm.populate).toHaveBeenCalled()
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
        .mockResolvedValueOnce(expectedForm as never)

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

        // @ts-ignore
        .mockRejectedValueOnce(new mongoose.Error.ValidationError() as never)

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
      const createSpy = jest.spyOn(FormModel, 'create').mockRejectedValueOnce(
        // @ts-ignore
        new mongoose.Error.VersionError({}, 1, ['none']) as never,
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
        .mockRejectedValueOnce(expectedError as never)

      // Act
      const actualResult = await createForm(formParams)

      // Assert
      expect(actualResult._unsafeUnwrapErr()).toEqual(
        new DatabasePayloadSizeError(
          formatErrorRecoveryMessage(mockErrorString),
        ),
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
        .mockRejectedValueOnce(new Error(mockErrorString) as never)

      // Act
      const actualResult = await createForm(formParams)

      // Assert
      expect(actualResult._unsafeUnwrapErr()).toEqual(
        new DatabaseError(formatErrorRecoveryMessage(mockErrorString)),
      )
      expect(createSpy).toHaveBeenCalledWith(formParams)
    })
  })

  describe('editFormFields', () => {
    const MOCK_UPDATED_FORM = ({
      _id: new ObjectId(),
      admin: new ObjectId(),
      form_fields: [
        generateDefaultField(BasicField.Email),
        generateDefaultField(BasicField.Mobile),
        generateDefaultField(BasicField.Dropdown),
      ],
    } as unknown) as IPopulatedForm

    const MOCK_INTIAL_FORM = mocked(({
      _id: MOCK_UPDATED_FORM._id,
      admin: MOCK_UPDATED_FORM.admin,
      form_fields: [
        generateDefaultField(BasicField.Email),
        generateDefaultField(BasicField.Mobile),
      ],
      save: jest.fn().mockResolvedValue(MOCK_UPDATED_FORM),
    } as unknown) as IPopulatedForm)

    it('should return updated form', async () => {
      // Arrange
      const newField = generateDefaultField(BasicField.Dropdown)
      const mockUpdatedFields = [...MOCK_INTIAL_FORM.form_fields, newField]
      const updateSpy = jest
        .spyOn(AdminFormUtils, 'getUpdatedFormFields')
        .mockReturnValueOnce(ok(mockUpdatedFields))

      const createParams: EditFormFieldParams = {
        action: { name: EditFieldActions.Create },
        field: newField,
      }

      // Act
      const actualResult = await editFormFields(MOCK_INTIAL_FORM, createParams)

      // Assert
      expect(actualResult._unsafeUnwrap()).toEqual(MOCK_UPDATED_FORM)
      expect(updateSpy).toHaveBeenCalledTimes(1)
      expect(MOCK_INTIAL_FORM.save).toHaveBeenCalledTimes(1)
    })

    it('should return EditFieldError without updating when invalid updates are being formed on form fields', async () => {
      // Arrange
      // Update service function should return error.
      const mockError = new EditFieldError('invalid update to field')
      const updateSpy = jest
        .spyOn(AdminFormUtils, 'getUpdatedFormFields')
        .mockReturnValueOnce(err(mockError))

      const reorderParams: EditFormFieldParams = {
        action: { name: EditFieldActions.Reorder, position: 2 },
        field: cloneDeep(MOCK_INTIAL_FORM.form_fields[1]),
      }

      // Act
      const actualResult = await editFormFields(MOCK_INTIAL_FORM, reorderParams)

      // Assert
      expect(actualResult._unsafeUnwrapErr()).toEqual(mockError)
      expect(updateSpy).toHaveBeenCalledTimes(1)
      expect(MOCK_INTIAL_FORM.save).not.toHaveBeenCalled()
    })

    it('should return DatabaseError when error occurs during saving of form', async () => {
      // Arrange
      const [, ...mockUpdatedFields] = MOCK_INTIAL_FORM.form_fields
      const updateSpy = jest
        .spyOn(AdminFormUtils, 'getUpdatedFormFields')
        .mockReturnValueOnce(ok(mockUpdatedFields))
      // Mock database save error.

      // @ts-ignore
      const mockError = new mongoose.Error.VersionError({}, 1, ['none'])
      MOCK_INTIAL_FORM.save.mockRejectedValueOnce(mockError as never)

      const deleteParams: EditFormFieldParams = {
        action: { name: EditFieldActions.Delete },
        field: cloneDeep(MOCK_INTIAL_FORM.form_fields[0]),
      }

      // Act
      const actualResult = await editFormFields(MOCK_INTIAL_FORM, deleteParams)

      // Assert
      expect(actualResult._unsafeUnwrapErr()).toBeInstanceOf(
        DatabaseConflictError,
      )
      expect(updateSpy).toHaveBeenCalledTimes(1)
      expect(MOCK_INTIAL_FORM.save).toHaveBeenCalledTimes(1)
    })
  })

  describe('updateForm', () => {
    const MOCK_UPDATED_FORM = ({
      _id: new ObjectId(),
      admin: new ObjectId(),
      status: Status.Private,
      form_fields: [
        generateDefaultField(BasicField.Mobile),
        generateDefaultField(BasicField.Dropdown),
      ],
    } as unknown) as IPopulatedForm

    const MOCK_INITIAL_FORM = mocked(({
      _id: MOCK_UPDATED_FORM._id,
      admin: MOCK_UPDATED_FORM.admin,
      status: Status.Public,
      form_fields: MOCK_UPDATED_FORM.form_fields,
      save: jest.fn().mockResolvedValue(MOCK_UPDATED_FORM),
    } as unknown) as IPopulatedForm)

    it('should successfully update given form keys', async () => {
      // Arrange
      const formUpdateParams: Parameters<typeof updateForm>[1] = {
        status: Status.Private,
      }

      // Act
      const actualResult = await updateForm(MOCK_INITIAL_FORM, formUpdateParams)

      // Assert
      expect(actualResult._unsafeUnwrap()).toEqual(MOCK_UPDATED_FORM)
      // .save should have been called with updated form.
      expect(MOCK_INITIAL_FORM.save.mock.instances[0]).toEqual(
        assignIn(cloneDeep(MOCK_INITIAL_FORM), formUpdateParams),
      )
      expect(MOCK_INITIAL_FORM.save).toHaveBeenCalledTimes(1)
    })

    it('should return DatabaseError when error occurs whilst updating form', async () => {
      // Arrange
      const formUpdateParams: Parameters<typeof updateForm>[1] = {
        esrvcId: 'MOCK-ESRVCID',
      }
      // Mock database failure.
      MOCK_INITIAL_FORM.save.mockRejectedValueOnce(
        new Error('some error') as never,
      )

      // Act
      const actualResult = await updateForm(MOCK_INITIAL_FORM, formUpdateParams)

      // Assert
      expect(actualResult._unsafeUnwrapErr()).toBeInstanceOf(DatabaseError)
      // .save should have been called with updated form.
      expect(MOCK_INITIAL_FORM.save.mock.instances[0]).toEqual(
        assignIn(cloneDeep(MOCK_INITIAL_FORM), formUpdateParams),
      )
      expect(MOCK_INITIAL_FORM.save).toHaveBeenCalledTimes(1)
    })
  })

  describe('updateFormSettings', () => {
    const MOCK_UPDATED_SETTINGS: FormSettings = {
      authType: AuthType.NIL,
      hasCaptcha: false,
      inactiveMessage: 'some inactive message',
      status: Status.Private,
      submissionLimit: 42069,
      title: 'new title',
      webhook: {
        url: '',
      },
    }

    const MOCK_UPDATED_FORM = ({
      ...MOCK_UPDATED_SETTINGS,
      responseMode: ResponseMode.Encrypt,
      publicKey: 'some public key',
      getSettings: jest.fn().mockReturnValue(MOCK_UPDATED_SETTINGS),
    } as unknown) as IFormDocument

    const MOCK_EMAIL_FORM = mocked(({
      _id: new ObjectId(),
      status: Status.Public,
      responseMode: ResponseMode.Email,
    } as unknown) as IPopulatedForm)
    const MOCK_ENCRYPT_FORM = mocked(({
      _id: new ObjectId(),
      status: Status.Public,
      responseMode: ResponseMode.Encrypt,
    } as unknown) as IPopulatedForm)

    const EMAIL_UPDATE_SPY = jest
      .spyOn(EmailFormModel, 'findByIdAndUpdate')

      // @ts-ignore
      .mockReturnValue({
        exec: jest.fn().mockResolvedValue(MOCK_UPDATED_FORM),
      })
    const ENCRYPT_UPDATE_SPY = jest
      .spyOn(EncryptFormModel, 'findByIdAndUpdate')

      // @ts-ignore
      .mockReturnValue({
        exec: jest.fn().mockResolvedValue(MOCK_UPDATED_FORM),
      })

    beforeEach(() => jest.clearAllMocks())

    it('should return updated form settings when successfully updating email form settings', async () => {
      // Arrange
      const settingsToUpdate: SettingsUpdateDto = {
        status: Status.Private,
        title: 'new title',
      }

      // Act
      const actualResult = await updateFormSettings(
        MOCK_EMAIL_FORM,
        settingsToUpdate,
      )

      // Assert
      expect(actualResult._unsafeUnwrap()).toEqual(MOCK_UPDATED_SETTINGS)
      expect(EMAIL_UPDATE_SPY).toHaveBeenCalledWith(
        MOCK_EMAIL_FORM._id,
        settingsToUpdate,
        { new: true, runValidators: true },
      )
      expect(MOCK_UPDATED_FORM.getSettings).toHaveBeenCalledTimes(1)
    })

    it('should return updated form settings when successfully updating encrypt form settings', async () => {
      // Arrange
      const settingsToUpdate: SettingsUpdateDto = {
        webhook: {
          url: 'https://example.com',
        },
      }
      // Act
      const actualResult = await updateFormSettings(
        MOCK_ENCRYPT_FORM,
        settingsToUpdate,
      )

      // Assert
      expect(actualResult._unsafeUnwrap()).toEqual(MOCK_UPDATED_SETTINGS)
      expect(ENCRYPT_UPDATE_SPY).toHaveBeenCalledWith(
        MOCK_ENCRYPT_FORM._id,
        // Should be dotified
        { 'webhook.url': 'https://example.com' },
        { new: true, runValidators: true },
      )
      expect(MOCK_UPDATED_FORM.getSettings).toHaveBeenCalledTimes(1)
    })

    it('should return DatabaseValidationError when validation error occurs whilst updating', async () => {
      // Arrange
      const settingsToUpdate: SettingsUpdateDto = {
        title: 'does not matter',
      }
      // Mock database error
      // @ts-ignore
      ENCRYPT_UPDATE_SPY.mockReturnValueOnce({
        exec: jest.fn().mockRejectedValue(
          // @ts-ignore
          new mongoose.Error.ValidationError({ errors: 'some error' }),
        ),
      })

      // Act
      const actualResult = await updateFormSettings(
        MOCK_ENCRYPT_FORM,
        settingsToUpdate,
      )

      // Assert
      expect(actualResult._unsafeUnwrapErr()).toBeInstanceOf(
        DatabaseValidationError,
      )
      expect(ENCRYPT_UPDATE_SPY).toHaveBeenCalledWith(
        MOCK_ENCRYPT_FORM._id,
        settingsToUpdate,
        { new: true, runValidators: true },
      )
      expect(MOCK_UPDATED_FORM.getSettings).toHaveBeenCalledTimes(0)
    })
  })

  describe('updateFormField', () => {
    it('should return updated form field', async () => {
      // Arrange
      const fieldToUpdate = generateDefaultField(BasicField.YesNo, {
        title: 'random title',
      })
      const mockNewField = {
        ...fieldToUpdate,
        title: 'new title',
      } as FieldUpdateDto

      const mockUpdatedForm = {
        title: 'some mock form',
        form_fields: [mockNewField],
      }
      const mockForm = ({
        ...mockUpdatedForm,
        form_fields: [fieldToUpdate],
        updateFormFieldById: jest.fn().mockResolvedValue(mockUpdatedForm),
      } as unknown) as IPopulatedForm

      // Act
      const actual = await updateFormField(
        mockForm,
        fieldToUpdate._id,
        mockNewField,
      )

      // Assert
      expect(actual._unsafeUnwrap()).toEqual(mockNewField)
      expect(mockForm.updateFormFieldById).toHaveBeenCalledWith(
        fieldToUpdate._id,
        mockNewField,
      )
    })

    it('should return FieldNotFoundError when field update returns null', async () => {
      // Arrange
      const mockForm = ({
        title: 'another mock form',
        form_fields: [],
        updateFormFieldById: jest.fn().mockResolvedValue(null),
      } as unknown) as IPopulatedForm

      const invalidFieldId = new ObjectId().toHexString()
      const mockNewField = generateDefaultField(
        BasicField.Number,
      ) as FieldUpdateDto

      // Act
      const actual = await updateFormField(
        mockForm,
        invalidFieldId,
        mockNewField,
      )

      // Assert
      expect(actual._unsafeUnwrapErr()).toEqual(new FieldNotFoundError())
    })

    it('should return DatabaseValidationError when field model update throws a validation error', async () => {
      // Arrange
      const mockForm = ({
        title: 'another another mock form',
        form_fields: [],
        updateFormFieldById: jest.fn().mockRejectedValue(
          // @ts-ignore
          new mongoose.Error.ValidationError(),
        ),
      } as unknown) as IPopulatedForm

      const invalidFieldId = new ObjectId().toHexString()
      const mockNewField = generateDefaultField(
        BasicField.Number,
      ) as FieldUpdateDto

      // Act
      const actual = await updateFormField(
        mockForm,
        invalidFieldId,
        mockNewField,
      )

      // Assert
      expect(actual._unsafeUnwrapErr()).toBeInstanceOf(DatabaseValidationError)
    })
  })
})
