/* eslint-disable @typescript-eslint/ban-ts-comment */
import { generateDefaultField } from '__tests__/unit/backend/helpers/generate-form-data'
import { PresignedPost } from 'aws-sdk/clients/s3'
import { ObjectId } from 'bson'
import { assignIn, cloneDeep, merge, omit, pick } from 'lodash'
import mongoose, { ClientSession } from 'mongoose'
import { err, errAsync, ok, okAsync } from 'neverthrow'
import { Workspace } from 'shared/types/workspace'
import {
  EncryptedStringsMessageContent,
  EncryptedStringsMessageContentWithMyPrivateKey,
} from 'shared/utils/crypto'

import config, { aws } from 'src/app/config/config'
import getAgencyModel from 'src/app/models/agency.server.model'
import getFormModel, {
  getEmailFormModel,
  getEncryptedFormModel,
} from 'src/app/models/form.server.model'
import getFormWhitelistSubmitterIdsModel from 'src/app/models/form_whitelist.server.model'
import { getWorkspaceModel } from 'src/app/models/workspace.server.model'
import {
  ApplicationError,
  DatabaseConflictError,
  DatabaseError,
  DatabasePayloadSizeError,
  DatabaseValidationError,
  MalformedParametersError,
} from 'src/app/modules/core/core.errors'
import { MissingUserError } from 'src/app/modules/user/user.errors'
import * as UserService from 'src/app/modules/user/user.service'
import { TwilioCredentials } from 'src/app/services/sms/sms.types'
import { CreatePresignedPostError } from 'src/app/utils/aws-s3'
import { formatErrorRecoveryMessage } from 'src/app/utils/handle-mongo-error'
import { EditFieldActions } from 'src/shared/constants'
import {
  FormLogicSchema,
  IEmailFormSchema,
  IFormDocument,
  IFormSchema,
  IPopulatedEncryptedForm,
  IPopulatedForm,
  IUserSchema,
  PickDuplicateForm,
} from 'src/types'
import { EditFormFieldParams } from 'src/types/api'

import {
  CONDITIONAL_ROUTING_EMAILS_OPTIONS_MISSING_ERROR_MESSAGE,
  CONDITIONAL_ROUTING_INVALID_CSV_FORMAT_ERROR_MESSAGE,
  CONDITIONAL_ROUTING_MISMATCHED_OPTIONS_ERROR_MESSAGE,
  FORM_WHITELIST_CONTAINS_EMPTY_ROWS_ERROR_MESSAGE,
  FORM_WHITELIST_SETTING_CONTAINS_DUPLICATES_ERROR_MESSAGE,
  FORM_WHITELIST_SETTING_CONTAINS_INVALID_FORMAT_SUBMITTERID_ERROR_MESSAGE,
} from '../../../../../../shared/constants/errors'
import { VALID_UPLOAD_FILE_TYPES } from '../../../../../../shared/constants/file'
import {
  AdminDashboardFormMetaDto,
  BasicField,
  CustomFormLogo,
  DuplicateFormBodyDto,
  FieldCreateDto,
  FieldUpdateDto,
  FormAuthType,
  FormColorTheme,
  FormEndPage,
  FormLogoState,
  FormResponseMode,
  FormSettings,
  FormStartPage,
  FormStatus,
  LogicDto,
  LogicType,
  PaymentChannel,
  PaymentType,
  SettingsUpdateDto,
} from '../../../../../../shared/types'
import * as SmsService from '../../../../services/sms/sms.service'
import {
  FormNotFoundError,
  LogicNotFoundError,
  TransferOwnershipError,
} from '../../form.errors'
import {
  EditFieldError,
  FieldNotFoundError,
  InvalidCollaboratorError,
  InvalidFileTypeError,
} from '../admin-form.errors'
import * as AdminFormService from '../admin-form.service'
import { OverrideProps } from '../admin-form.types'
import * as AdminFormUtils from '../admin-form.utils'

import { secretsManager } from './../admin-form.service'

const FormModel = getFormModel(mongoose)
const EmailFormModel = getEmailFormModel(mongoose)
const EncryptFormModel = getEncryptedFormModel(mongoose)
const AgencyModel = getAgencyModel(mongoose)
const WorkspaceModel = getWorkspaceModel(mongoose)
const FormWhitelistedSubmitterIdsModel =
  getFormWhitelistSubmitterIdsModel(mongoose)

jest.mock('src/app/modules/user/user.service')
const MockUserService = jest.mocked(UserService)

jest.mock('../../../../services/sms/sms.service')
const MockSmsService = jest.mocked(SmsService)

describe('admin-form.service', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
  })

  describe('getDashboardForms', () => {
    it('should return list of forms user is authorized to view', async () => {
      // Arrange
      const mockUserId = 'mockUserId'
      const mockUser = {
        email: 'MOCK_EMAIL@example.com',
        _id: mockUserId,
      } as IUserSchema
      const mockDashboardForms = [
        {
          admin: {},
          title: 'test form 1',
          _id: 'any',
          responseMode: FormResponseMode.Email,
        },
        {
          admin: {},
          title: 'test form 2',
          _id: 'any2',
          responseMode: FormResponseMode.Encrypt,
        },
      ] as AdminDashboardFormMetaDto[]
      // Mock user admin success.
      MockUserService.findUserById.mockReturnValueOnce(
        okAsync(mockUser as IUserSchema),
      )
      const getSpy = jest
        .spyOn(FormModel, 'getMetaByUserIdOrEmail')
        .mockResolvedValueOnce(mockDashboardForms)

      // Act
      const actualResult = await AdminFormService.getDashboardForms(mockUserId)

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
      const actualResult = await AdminFormService.getDashboardForms('any')

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
      const actualResult = await AdminFormService.getDashboardForms(mockUserId)

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
      const actualResult =
        await AdminFormService.createPresignedPostUrlForImages({
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
      const actualResult =
        await AdminFormService.createPresignedPostUrlForImages({
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

    it('should return CreatePresignedPostError when error occurs whilst creating presigned POST URL', async () => {
      // Arrange
      // Mock external service failure.
      const s3Spy = jest
        .spyOn(aws.s3, 'createPresignedPost')
        .mockImplementationOnce(() => {
          throw new Error('boom')
        })

      // Act
      const actualResult =
        await AdminFormService.createPresignedPostUrlForImages({
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
        new CreatePresignedPostError('Error occurred whilst uploading file'),
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
      const actualResult =
        await AdminFormService.createPresignedPostUrlForLogos({
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
      const actualResult =
        await AdminFormService.createPresignedPostUrlForLogos({
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

    it('should return CreatePresignedPostError when error occurs whilst creating presigned POST URL', async () => {
      // Arrange
      // Mock external service failure.
      const s3Spy = jest
        .spyOn(aws.s3, 'createPresignedPost')
        .mockImplementationOnce(() => {
          throw new Error('boom')
        })

      // Act
      const actualResult =
        await AdminFormService.createPresignedPostUrlForLogos({
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
        new CreatePresignedPostError('Error occurred whilst uploading file'),
      )
    })
  })

  describe('archiveForm', () => {
    it('should true when form is successfully archived', async () => {
      // Arrange
      const mockArchivedForm = {
        _id: new ObjectId(),
        admin: new ObjectId(),
        status: FormStatus.Archived,
      } as IEmailFormSchema
      const mockArchiveFn = jest.fn().mockResolvedValue(mockArchivedForm)
      const mockInitialForm = {
        archive: mockArchiveFn,
      } as unknown as IPopulatedForm

      // Act
      const actual = await AdminFormService.archiveForm(mockInitialForm)

      // Assert
      expect(actual.isOk()).toEqual(true)
      expect(actual._unsafeUnwrap()).toEqual(mockArchivedForm)
    })

    it('should return DatabaseError if any database errors occur', async () => {
      // Arrange
      const mockErrorString = 'database went wrong something'
      const mockArchiveFn = jest
        .fn()
        .mockRejectedValue(new Error(mockErrorString))
      const mockInitialForm = {
        archive: mockArchiveFn,
      } as unknown as IPopulatedForm

      // Act
      const actual = await AdminFormService.archiveForm(mockInitialForm)

      // Assert
      expect(actual.isErr()).toEqual(true)
      expect(actual._unsafeUnwrapErr()).toEqual(
        new DatabaseError(formatErrorRecoveryMessage(mockErrorString)),
      )
    })
  })

  describe('duplicateForm', () => {
    const MOCK_NEW_ADMIN_ID = new ObjectId().toHexString()
    const MOCK_VALID_FORM = {
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
        } as CustomFormLogo,
      },
    } as unknown as IFormDocument
    const MOCK_EMAIL_OVERRIDE_PARAMS: DuplicateFormBodyDto = {
      responseMode: FormResponseMode.Email,
      title: 'mock new title',
      emails: ['mockExample@example.com'],
    }
    const MOCK_ENCRYPT_OVERRIDE_PARAMS: DuplicateFormBodyDto = {
      responseMode: FormResponseMode.Encrypt,
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
      const actualResult = await AdminFormService.duplicateForm(
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

    // primary functionality of workspace transaction is tested in 'createForm'
    it('should use form to workspace transaction if duplicating form to workspace', async () => {
      // Arrange
      const mockWorkspaceId = new ObjectId().toHexString()
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
      const createFormInWorkspaceTransactionSpy = jest
        .spyOn(AdminFormService, 'createFormInWorkspaceTransaction')
        .mockResolvedValueOnce(expectedForm as never)

      // Act
      const actualResult = await AdminFormService.duplicateForm(
        mockForm,
        mockNewAdminId,
        MOCK_EMAIL_OVERRIDE_PARAMS,
        mockWorkspaceId,
      )

      // Assert
      expect(actualResult.isOk()).toEqual(true)
      expect(actualResult._unsafeUnwrap()).toEqual(expectedForm)
      expect(createFormInWorkspaceTransactionSpy).toHaveBeenCalledWith(
        expectedParams,
        mockWorkspaceId,
      )
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
      const actualResult = await AdminFormService.duplicateForm(
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
      const actualResult = await AdminFormService.duplicateForm(
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

      const mockUpdatedForm = {
        _id: new ObjectId(),
        admin: MOCK_CURRENT_OWNER,
        emails: [MOCK_NEW_OWNER_EMAIL],
        responseMode: FormResponseMode.Email,
        title: 'some mock form',
        populate: jest.fn().mockResolvedValue(expectedPopulateResult),
      } as unknown as IFormSchema

      const mockValidForm = {
        title: 'some mock form',
        admin: MOCK_CURRENT_OWNER,
        transferOwner: jest.fn().mockResolvedValue(mockUpdatedForm),
      } as unknown as IPopulatedForm

      MockUserService.findUserById.mockReturnValueOnce(
        okAsync(MOCK_CURRENT_OWNER),
      )
      MockUserService.findUserByEmail.mockReturnValueOnce(
        okAsync(MOCK_NEW_OWNER),
      )

      // Act
      const actualResult = await AdminFormService.transferFormOwnership(
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
      const mockValidForm = {
        title: 'some mock form',
        admin: MOCK_CURRENT_OWNER,
        transferOwner: jest.fn(),
      } as unknown as IPopulatedForm

      // Act
      const actualResult = await AdminFormService.transferFormOwnership(
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
      const mockValidForm = {
        title: 'some mock form',
        admin: MOCK_CURRENT_OWNER,
        transferOwner: jest.fn(),
      } as unknown as IPopulatedForm
      MockUserService.findUserById.mockReturnValueOnce(
        errAsync(new MissingUserError()),
      )

      // Act
      const actualResult = await AdminFormService.transferFormOwnership(
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
      const mockValidForm = {
        title: 'some mock form',
        admin: MOCK_CURRENT_OWNER,
        transferOwner: jest.fn(),
      } as unknown as IPopulatedForm
      MockUserService.findUserById.mockReturnValueOnce(
        errAsync(new DatabaseError()),
      )

      // Act
      const actualResult = await AdminFormService.transferFormOwnership(
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
      const mockValidForm = {
        title: 'some mock form',
        admin: MOCK_CURRENT_OWNER,
        transferOwner: jest.fn(),
      } as unknown as IPopulatedForm

      // Act
      const actualResult = await AdminFormService.transferFormOwnership(
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
      const mockValidForm = {
        title: 'some mock form',
        admin: MOCK_CURRENT_OWNER,
        transferOwner: jest.fn(),
      } as unknown as IPopulatedForm

      // Act
      const actualResult = await AdminFormService.transferFormOwnership(
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
      const mockUpdatedForm = {
        _id: new ObjectId(),
        admin: MOCK_CURRENT_OWNER,
        emails: [MOCK_NEW_OWNER_EMAIL],
        responseMode: FormResponseMode.Email,
        title: 'some mock form',
        populate: jest.fn().mockRejectedValue(new Error(mockPopulateErrorStr)),
      } as unknown as IFormSchema

      const mockValidForm = {
        title: 'some mock form',
        admin: MOCK_CURRENT_OWNER,
        transferOwner: jest.fn().mockResolvedValue(mockUpdatedForm),
      } as unknown as IPopulatedForm

      MockUserService.findUserById.mockReturnValueOnce(
        okAsync(MOCK_CURRENT_OWNER),
      )
      MockUserService.findUserByEmail.mockReturnValueOnce(
        okAsync(MOCK_NEW_OWNER),
      )

      // Act
      const actualResult = await AdminFormService.transferFormOwnership(
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
      const formParams: Parameters<typeof AdminFormService.createForm>[0] = {
        title: 'create form title',
        admin: new ObjectId().toHexString(),
        responseMode: FormResponseMode.Email,
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
      const actualResult = await AdminFormService.createForm(formParams)

      // Assert
      expect(actualResult._unsafeUnwrap()).toEqual(expectedForm)
      expect(createSpy).toHaveBeenCalledWith(formParams)
    })

    it('should return DatabaseValidationError on invalid form params whilst creating form', async () => {
      // Arrange
      const formParams: Parameters<typeof AdminFormService.createForm>[0] = {
        title: 'create form title',
        admin: new ObjectId().toHexString(),
        responseMode: FormResponseMode.Encrypt,
        publicKey: 'some key',
      }
      const createSpy = jest
        .spyOn(FormModel, 'create')

        // @ts-ignore
        .mockRejectedValueOnce(new mongoose.Error.ValidationError() as never)

      // Act
      const actualResult = await AdminFormService.createForm(formParams)

      // Assert
      expect(actualResult._unsafeUnwrapErr()).toBeInstanceOf(
        DatabaseValidationError,
      )
      expect(createSpy).toHaveBeenCalledWith(formParams)
    })

    it('should return DatabaseConflictError on mongoose version error', async () => {
      // Arrange
      const formParams: Parameters<typeof AdminFormService.createForm>[0] = {
        title: 'create form title',
        admin: new ObjectId().toHexString(),
        responseMode: FormResponseMode.Encrypt,
        publicKey: 'some key',
      }
      const createSpy = jest.spyOn(FormModel, 'create').mockRejectedValueOnce(
        // @ts-ignore
        new mongoose.Error.VersionError({}, 1, ['none']) as never,
      )

      // Act
      const actualResult = await AdminFormService.createForm(formParams)

      // Assert
      expect(actualResult._unsafeUnwrapErr()).toBeInstanceOf(
        DatabaseConflictError,
      )
      expect(createSpy).toHaveBeenCalledWith(formParams)
    })

    it('should return DatabasePayloadError on form size error', async () => {
      // Arrange
      const formParams: Parameters<typeof AdminFormService.createForm>[0] = {
        title: 'create form title',
        admin: new ObjectId().toHexString(),
        responseMode: FormResponseMode.Encrypt,
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
      const actualResult = await AdminFormService.createForm(formParams)

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
      const formParams: Parameters<typeof AdminFormService.createForm>[0] = {
        title: 'create form title',
        admin: new ObjectId().toHexString(),
        responseMode: FormResponseMode.Encrypt,
        publicKey: 'some key',
      }
      const mockErrorString = 'no'
      const createSpy = jest
        .spyOn(FormModel, 'create')
        .mockRejectedValueOnce(new Error(mockErrorString) as never)

      // Act
      const actualResult = await AdminFormService.createForm(formParams)

      // Assert
      expect(actualResult._unsafeUnwrapErr()).toEqual(
        new DatabaseError(formatErrorRecoveryMessage(mockErrorString)),
      )
      expect(createSpy).toHaveBeenCalledWith(formParams)
    })

    // Creating into Workspace tests
    it('should use form to workspace transaction if workspaceId is given', async () => {
      // Arrange
      const mockWorkspaceId = new ObjectId().toHexString()
      const formParams: Parameters<typeof AdminFormService.createForm>[0] = {
        title: 'create form title',
        admin: new ObjectId().toHexString(),
        responseMode: FormResponseMode.Email,
        emails: 'example@example.com',
      }
      const expectedForm = {
        _id: new ObjectId(),
        ...formParams,
      } as IFormSchema

      // We directly test the processing of form creation into a workspace
      // circumventing .withTransaction() in createFormInWorkspaceTransaction which is untestable
      const createFormInWorkspaceTransactionSpy = jest
        .spyOn(AdminFormService, 'createFormInWorkspaceTransaction')
        .mockImplementationOnce((formParams, workspaceId) =>
          AdminFormService.processCreateFormInWorkspace(
            formParams,
            workspaceId,
            null as unknown as ClientSession,
          ),
        )

      const createSpy = jest
        .spyOn(FormModel, 'create')
        .mockResolvedValueOnce([expectedForm] as never)
      const addFormIdsToWorkspaceSpy = jest
        .spyOn(WorkspaceModel, 'addFormIdsToWorkspace')
        .mockResolvedValueOnce(null as unknown as Workspace)

      // Act
      const actualResult = await AdminFormService.createForm(
        formParams,
        mockWorkspaceId,
      )

      // Assert
      expect(actualResult._unsafeUnwrap()).toEqual(expectedForm)
      expect(createFormInWorkspaceTransactionSpy).toHaveBeenCalledWith(
        formParams,
        mockWorkspaceId,
      )
      expect(createSpy).toHaveBeenCalledWith([formParams], { session: null })
      expect(addFormIdsToWorkspaceSpy).toHaveBeenCalledWith({
        workspaceId: mockWorkspaceId,
        formIds: [expectedForm._id],
        session: null,
      })
    })

    it('should return DatabaseError on database error whilst creating form in a workspace', async () => {
      // Arrange
      const mockWorkspaceId = new ObjectId().toHexString()
      const formParams: Parameters<typeof AdminFormService.createForm>[0] = {
        title: 'create form title',
        admin: new ObjectId().toHexString(),
        responseMode: FormResponseMode.Email,
        emails: 'example@example.com',
      }
      const createFormInWorkspaceTransactionSpy = jest
        .spyOn(AdminFormService, 'createFormInWorkspaceTransaction')
        .mockImplementationOnce((formParams, workspaceId) =>
          AdminFormService.processCreateFormInWorkspace(
            formParams,
            workspaceId,
            null as unknown as ClientSession,
          ),
        )
      const mockErrorString = 'no'
      const createSpy = jest
        .spyOn(FormModel, 'create')
        .mockRejectedValueOnce(new Error(mockErrorString) as never)

      // Act
      const actualResult = await AdminFormService.createForm(
        formParams,
        mockWorkspaceId,
      )

      // Assert
      expect(actualResult._unsafeUnwrapErr()).toEqual(
        new DatabaseError(formatErrorRecoveryMessage(mockErrorString)),
      )
      expect(createFormInWorkspaceTransactionSpy).toHaveBeenCalledWith(
        formParams,
        mockWorkspaceId,
      )
      expect(createSpy).toHaveBeenCalledWith([formParams], { session: null })
    })

    it('should return DatabaseError on database error whilst moving form into a workspace', async () => {
      // Arrange
      const mockWorkspaceId = new ObjectId().toHexString()
      const formParams: Parameters<typeof AdminFormService.createForm>[0] = {
        title: 'create form title',
        admin: new ObjectId().toHexString(),
        responseMode: FormResponseMode.Email,
        emails: 'example@example.com',
      }
      const expectedForm = {
        _id: new ObjectId(),
        ...formParams,
      } as IFormSchema
      const createFormInWorkspaceTransactionSpy = jest
        .spyOn(AdminFormService, 'createFormInWorkspaceTransaction')
        .mockImplementationOnce((formParams, workspaceId) =>
          AdminFormService.processCreateFormInWorkspace(
            formParams,
            workspaceId,
            null as unknown as ClientSession,
          ),
        )

      const createSpy = jest
        .spyOn(FormModel, 'create')
        .mockResolvedValueOnce([expectedForm] as never)
      const mockErrorString = 'no'
      const addFormIdsToWorkspaceSpy = jest
        .spyOn(WorkspaceModel, 'addFormIdsToWorkspace')
        .mockRejectedValueOnce(new Error(mockErrorString) as never)

      // Act
      const actualResult = await AdminFormService.createForm(
        formParams,
        mockWorkspaceId,
      )

      // Assert
      expect(actualResult._unsafeUnwrapErr()).toEqual(
        new DatabaseError(formatErrorRecoveryMessage(mockErrorString)),
      )
      expect(createFormInWorkspaceTransactionSpy).toHaveBeenCalledWith(
        formParams,
        mockWorkspaceId,
      )
      expect(createSpy).toHaveBeenCalledWith([formParams], { session: null })
      expect(addFormIdsToWorkspaceSpy).toHaveBeenCalledWith({
        workspaceId: mockWorkspaceId,
        formIds: [expectedForm._id],
        session: null,
      })
    })
  })

  describe('editFormFields', () => {
    const MOCK_UPDATED_FORM = {
      _id: new ObjectId(),
      admin: new ObjectId(),
      form_fields: [
        generateDefaultField(BasicField.Email),
        generateDefaultField(BasicField.Mobile),
        generateDefaultField(BasicField.Dropdown),
      ],
    } as unknown as IPopulatedForm

    const MOCK_INTIAL_FORM = jest.mocked({
      _id: MOCK_UPDATED_FORM._id,
      admin: MOCK_UPDATED_FORM.admin,
      form_fields: [
        generateDefaultField(BasicField.Email),
        generateDefaultField(BasicField.Mobile),
      ],
      save: jest.fn().mockResolvedValue(MOCK_UPDATED_FORM),
    } as unknown as IPopulatedForm)

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
      const actualResult = await AdminFormService.editFormFields(
        MOCK_INTIAL_FORM,
        createParams,
      )

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
      const actualResult = await AdminFormService.editFormFields(
        MOCK_INTIAL_FORM,
        reorderParams,
      )

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
      const actualResult = await AdminFormService.editFormFields(
        MOCK_INTIAL_FORM,
        deleteParams,
      )

      // Assert
      expect(actualResult._unsafeUnwrapErr()).toBeInstanceOf(
        DatabaseConflictError,
      )
      expect(updateSpy).toHaveBeenCalledTimes(1)
      expect(MOCK_INTIAL_FORM.save).toHaveBeenCalledTimes(1)
    })
  })

  describe('updateForm', () => {
    const MOCK_UPDATED_FORM = {
      _id: new ObjectId(),
      admin: new ObjectId(),
      status: FormStatus.Private,
      form_fields: [
        generateDefaultField(BasicField.Mobile),
        generateDefaultField(BasicField.Dropdown),
      ],
    } as unknown as IPopulatedForm

    const MOCK_INITIAL_FORM = jest.mocked({
      _id: MOCK_UPDATED_FORM._id,
      admin: MOCK_UPDATED_FORM.admin,
      status: FormStatus.Public,
      form_fields: MOCK_UPDATED_FORM.form_fields,
      save: jest.fn().mockResolvedValue(MOCK_UPDATED_FORM),
    } as unknown as IPopulatedForm)

    it('should successfully update given form keys', async () => {
      // Arrange
      const formUpdateParams: Parameters<
        typeof AdminFormService.updateForm
      >[1] = {
        status: FormStatus.Private,
      }

      // Act
      const actualResult = await AdminFormService.updateForm(
        MOCK_INITIAL_FORM,
        formUpdateParams,
      )

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
      const formUpdateParams: Parameters<
        typeof AdminFormService.updateForm
      >[1] = {
        esrvcId: 'MOCK-ESRVCID',
      }
      // Mock database failure.
      MOCK_INITIAL_FORM.save.mockRejectedValueOnce(
        new Error('some error') as never,
      )

      // Act
      const actualResult = await AdminFormService.updateForm(
        MOCK_INITIAL_FORM,
        formUpdateParams,
      )

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
    const MOCK_UPDATED_SETTINGS = {
      authType: FormAuthType.NIL,
      hasCaptcha: false,
      inactiveMessage: 'some inactive message',
      status: FormStatus.Private,
      submissionLimit: 42069,
      title: 'new title',
      webhook: {
        url: '',
        isRetryEnabled: false,
      },
    } as FormSettings

    const MOCK_UPDATED_FORM = {
      ...MOCK_UPDATED_SETTINGS,
      responseMode: FormResponseMode.Encrypt,
      publicKey: 'some public key',
      getSettings: jest.fn().mockReturnValue(MOCK_UPDATED_SETTINGS),
    } as unknown as IFormDocument

    const MOCK_EMAIL_FORM = jest.mocked({
      _id: new ObjectId(),
      status: FormStatus.Public,
      responseMode: FormResponseMode.Email,
    } as unknown as IPopulatedForm)
    const MOCK_ENCRYPT_FORM = jest.mocked({
      _id: new ObjectId(),
      status: FormStatus.Public,
      responseMode: FormResponseMode.Encrypt,
      payments_channel: {
        channel: PaymentChannel.Unconnected,
        target_account_id: '',
        publishable_key: '',
        payment_methods: [],
      },
      payments_field: {
        enabled: false,
        description: '',
        name: '',
        amount_cents: 0,
        min_amount: 0,
        max_amount: 0,
        payment_type: PaymentType.Products,
        global_min_amount_override: 0,
        gst_enabled: true,
        products: [],
        products_meta: {
          multi_product: false,
        },
      },
      getSettings: jest.fn(),
    } as unknown as IPopulatedForm)

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
        status: FormStatus.Private,
        title: 'new title',
      }

      // Act
      const actualResult = await AdminFormService.updateFormSettings(
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
      const actualResult = await AdminFormService.updateFormSettings(
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
      const actualResult = await AdminFormService.updateFormSettings(
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

    it('should not allow webhooks updates for MRF', async () => {
      const MOCK_MULTIRESPONDENT_FORM = jest.mocked({
        _id: new ObjectId(),
        status: FormStatus.Public,
        responseMode: FormResponseMode.Multirespondent,
      } as unknown as IPopulatedForm)
      const settingsToUpdate: SettingsUpdateDto = {
        webhook: {
          url: 'does not matter',
        },
      }

      // Act
      const actualResult = await AdminFormService.updateFormSettings(
        MOCK_MULTIRESPONDENT_FORM,
        settingsToUpdate,
      )

      // Assert
      expect(actualResult._unsafeUnwrapErr()).toBeInstanceOf(
        MalformedParametersError,
      )
    })

    it('should allow webhooks updates for encrypt form', async () => {
      const settingsToUpdate: SettingsUpdateDto = {
        webhook: {
          url: 'does not matter',
        },
      }

      // Act
      const actualResult = await AdminFormService.updateFormSettings(
        MOCK_ENCRYPT_FORM,
        settingsToUpdate,
      )

      // Assert
      expect(actualResult.isOk()).toBeTrue()
    })

    it('should not allow email updates for payment forms', async () => {
      // Arrange
      const settingsToUpdate: SettingsUpdateDto = {
        emails: ['test@example.com', 'test2@example.com'],
      }

      const PAYMENT_ENABLED_FORM_TYPE_1 = merge({}, MOCK_ENCRYPT_FORM, {
        payments_channel: {
          channel: PaymentChannel.Stripe,
        },
      })

      const PAYMENT_ENABLED_FORM_TYPE_2 = merge({}, MOCK_ENCRYPT_FORM, {
        payments_field: {
          enabled: true,
          amount_cents: 54.22,
          description: 'some payment',
          payment_type: null,
        },
      })

      // Act
      const actualResult = await AdminFormService.updateFormSettings(
        PAYMENT_ENABLED_FORM_TYPE_1,
        settingsToUpdate,
      )

      const actualResult2 = await AdminFormService.updateFormSettings(
        PAYMENT_ENABLED_FORM_TYPE_2,
        settingsToUpdate,
      )

      // Assert
      expect(actualResult.isErr()).toBeTrue()
      actualResult.mapErr((err) => {
        expect(err).toBeInstanceOf(MalformedParametersError)
      })

      expect(actualResult2.isErr()).toBeTrue()
      actualResult2.mapErr((err) => {
        expect(err).toBeInstanceOf(MalformedParametersError)
      })
    })

    it('should not allow isSingleSubmission update to true for payment forms', async () => {
      // Arrange
      const settingsToUpdate: SettingsUpdateDto = {
        isSingleSubmission: true,
      }

      // Act
      const PAYMENT_ENABLED_FORM_TYPE_1 = merge({}, MOCK_ENCRYPT_FORM, {
        payments_channel: {
          channel: PaymentChannel.Stripe,
        },
      })

      const PAYMENT_ENABLED_FORM_TYPE_2 = merge({}, MOCK_ENCRYPT_FORM, {
        payments_field: {
          enabled: true,
          amount_cents: 54.22,
          description: 'some payment',
          payment_type: null,
        },
      })

      // Assert
      const actualResult = await AdminFormService.updateFormSettings(
        PAYMENT_ENABLED_FORM_TYPE_1,
        settingsToUpdate,
      )

      const actualResult2 = await AdminFormService.updateFormSettings(
        PAYMENT_ENABLED_FORM_TYPE_2,
        settingsToUpdate,
      )

      expect(actualResult.isErr()).toBeTrue()
      actualResult.mapErr((err) => {
        expect(err).toBeInstanceOf(MalformedParametersError)
      })

      expect(actualResult2.isErr()).toBeTrue()
      actualResult2.mapErr((err) => {
        expect(err).toBeInstanceOf(MalformedParametersError)
      })
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
      const mockForm = {
        ...mockUpdatedForm,
        form_fields: [fieldToUpdate],
        updateFormFieldById: jest.fn().mockResolvedValue(mockUpdatedForm),
      } as unknown as IPopulatedForm

      // Act
      const actual = await AdminFormService.updateFormField(
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
      const mockForm = {
        title: 'another mock form',
        form_fields: [],
        updateFormFieldById: jest.fn().mockResolvedValue(null),
      } as unknown as IPopulatedForm

      const invalidFieldId = new ObjectId().toHexString()
      const mockNewField = generateDefaultField(
        BasicField.Number,
      ) as FieldUpdateDto

      // Act
      const actual = await AdminFormService.updateFormField(
        mockForm,
        invalidFieldId,
        mockNewField,
      )

      // Assert
      expect(actual._unsafeUnwrapErr()).toEqual(new FieldNotFoundError())
    })

    it('should return DatabaseValidationError when field model update throws a validation error', async () => {
      // Arrange
      const mockForm = {
        title: 'another another mock form',
        form_fields: [],
        updateFormFieldById: jest.fn().mockRejectedValue(
          // @ts-ignore
          new mongoose.Error.ValidationError(),
        ),
      } as unknown as IPopulatedForm

      const invalidFieldId = new ObjectId().toHexString()
      const mockNewField = generateDefaultField(
        BasicField.Number,
      ) as FieldUpdateDto

      // Act
      const actual = await AdminFormService.updateFormField(
        mockForm,
        invalidFieldId,
        mockNewField,
      )

      // Assert
      expect(actual._unsafeUnwrapErr()).toBeInstanceOf(DatabaseValidationError)
    })
  })

  describe('createFormField', () => {
    it('should return created form field', async () => {
      // Arrange
      const initialFields = [
        generateDefaultField(BasicField.Mobile),
        generateDefaultField(BasicField.Image),
      ]
      const expectedCreatedField = generateDefaultField(BasicField.Nric, {
        title: 'some nric title',
      })
      const mockUpdatedForm = {
        title: 'some mock form',
        // Append created field to end of form_fields.
        form_fields: [...initialFields, expectedCreatedField],
      }
      const mockForm = {
        title: 'some mock form',
        form_fields: initialFields,
        insertFormField: jest.fn().mockResolvedValue(mockUpdatedForm),
      } as unknown as IPopulatedForm
      const formCreateParams = pick(expectedCreatedField, [
        'title',
        'fieldType',
      ]) as FieldCreateDto

      // Act
      const actual = await AdminFormService.createFormField(
        mockForm,
        formCreateParams,
      )

      // Assert
      // Should return last element in form_field
      expect(actual._unsafeUnwrap()).toEqual(expectedCreatedField)
    })

    it('should return created form field when passing in positional argument', async () => {
      // Arrange
      const initialFields = [
        generateDefaultField(BasicField.Mobile),
        generateDefaultField(BasicField.Image),
      ]
      const expectedCreatedField = generateDefaultField(BasicField.Nric, {
        title: 'some nric title',
      })
      const mockUpdatedForm = {
        title: 'some mock form',
        // Prefix created field to start of form_fields.
        form_fields: [expectedCreatedField, ...initialFields],
      }
      const mockForm = {
        title: 'some mock form',
        form_fields: initialFields,
        insertFormField: jest.fn().mockResolvedValue(mockUpdatedForm),
      } as unknown as IPopulatedForm
      const formCreateParams = pick(expectedCreatedField, [
        'title',
        'fieldType',
      ]) as FieldCreateDto

      // Act
      const actual = await AdminFormService.createFormField(
        mockForm,
        formCreateParams,
        // Insert at beginning.
        0,
      )

      // Assert
      // Should return first element in form_field
      expect(actual._unsafeUnwrap()).toEqual(expectedCreatedField)
    })

    it('should return DatabaseValidationError when field model update throws a validation error', async () => {
      // Arrange
      const initialFields = [
        generateDefaultField(BasicField.Mobile),
        generateDefaultField(BasicField.Image),
      ]
      const mockForm = {
        title: 'some mock form',
        form_fields: initialFields,
        insertFormField: jest.fn().mockRejectedValue(
          // @ts-ignore
          new mongoose.Error.ValidationError({ errors: 'does not matter' }),
        ),
      } as unknown as IPopulatedForm
      const formCreateParams = {
        fieldType: BasicField.ShortText,
        title: 'some title',
      } as FieldCreateDto

      // Act
      const actual = await AdminFormService.createFormField(
        mockForm,
        formCreateParams,
      )

      // Assert
      expect(actual._unsafeUnwrapErr()).toBeInstanceOf(DatabaseValidationError)
    })
  })

  describe('deleteFormLogic', () => {
    const logicId = new ObjectId().toHexString()
    const mockFormLogic = {
      form_logics: [
        {
          _id: logicId,
          id: logicId,
        } as FormLogicSchema,
      ],
    }

    const DELETE_SPY = jest.spyOn(FormModel, 'deleteFormLogic')

    let mockEmailForm: IPopulatedForm, mockEncryptForm: IPopulatedForm

    beforeEach(() => {
      mockEmailForm = {
        _id: new ObjectId(),
        status: FormStatus.Public,
        responseMode: FormResponseMode.Email,
        ...mockFormLogic,
      } as unknown as IPopulatedForm
      mockEncryptForm = {
        _id: new ObjectId(),
        status: FormStatus.Public,
        responseMode: FormResponseMode.Encrypt,
        ...mockFormLogic,
      } as unknown as IPopulatedForm
    })

    it('should return ok(form) on successful form logic delete for email mode form', async () => {
      // Arrange
      const UPDATE_SPY = jest
        .spyOn(FormModel, 'findByIdAndUpdate')
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        .mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockEmailForm),
        })

      // Act
      const actualResult = await AdminFormService.deleteFormLogic(
        mockEmailForm,
        logicId,
      )

      // Assert
      expect(actualResult.isOk()).toEqual(true)
      expect(actualResult._unsafeUnwrap()).toEqual(mockEmailForm)

      expect(UPDATE_SPY).toHaveBeenCalledWith(
        String(mockEmailForm._id),
        {
          $pull: { form_logics: { _id: logicId } },
        },
        {
          new: true,
          runValidators: true,
        },
      )

      expect(DELETE_SPY).toHaveBeenCalledWith(
        String(mockEmailForm._id),
        logicId,
      )
    })

    it('should return ok(form) on successful form logic delete for encrypt mode form', async () => {
      // Arrange
      const UPDATE_SPY = jest
        .spyOn(FormModel, 'findByIdAndUpdate')
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        .mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockEncryptForm),
        })

      // Act
      const actualResult = await AdminFormService.deleteFormLogic(
        mockEncryptForm,
        logicId,
      )

      // Assert
      expect(actualResult.isOk()).toEqual(true)
      expect(actualResult._unsafeUnwrap()).toEqual(mockEncryptForm)

      expect(UPDATE_SPY).toHaveBeenCalledWith(
        String(mockEncryptForm._id),
        {
          $pull: { form_logics: { _id: logicId } },
        },
        {
          new: true,
          runValidators: true,
        },
      )

      expect(DELETE_SPY).toHaveBeenCalledWith(
        String(mockEncryptForm._id),
        logicId,
      )
    })

    it('should return LogicNotFoundError if logic does not exist on form', async () => {
      // Act
      const wrongLogicId = new ObjectId().toHexString()
      const actualResult = await AdminFormService.deleteFormLogic(
        mockEmailForm,
        wrongLogicId,
      )

      // Assert
      expect(actualResult.isErr()).toEqual(true)
      expect(actualResult._unsafeUnwrapErr()).toEqual(new LogicNotFoundError())
      expect(DELETE_SPY).not.toHaveBeenCalled()
    })
  })

  describe('duplicateFormField', () => {
    it('should return updated form when field duplication is successful', async () => {
      // Arrange
      const fieldToDuplicate = generateDefaultField(BasicField.Mobile)
      const duplicatedField = generateDefaultField(BasicField.Mobile)
      const mockUpdatedForm = {
        title: 'some mock form',
        // Append duplicated field to after target field to duplicate.
        form_fields: [fieldToDuplicate, duplicatedField],
      } as IFormSchema
      const mockForm = {
        title: 'some mock form',
        form_fields: [fieldToDuplicate],
        _id: new ObjectId(),
        duplicateFormFieldByIdAndIndex: jest
          .fn()
          .mockResolvedValue(mockUpdatedForm),
      } as unknown as IPopulatedForm

      // Act
      const actual = await AdminFormService.duplicateFormField(
        mockForm,
        String(fieldToDuplicate._id),
      )

      const actualDuplicatedField = omit(actual._unsafeUnwrap(), [
        '_id',
        'globalId',
      ])

      const expectedDuplicateFieldWithoutId = omit(duplicatedField, [
        '_id',
        'globalId',
      ])

      // Assert
      expect(actualDuplicatedField).toEqual(expectedDuplicateFieldWithoutId)
    })

    it('should return FormNotFoundError when field duplication returns null', async () => {
      // Arrange
      const fieldToDuplicate = generateDefaultField(BasicField.Mobile)
      const mockForm = {
        title: 'some mock form',
        form_fields: [fieldToDuplicate],
        _id: new ObjectId(),
        duplicateFormFieldByIdAndIndex: jest.fn().mockResolvedValue(null),
      } as unknown as IPopulatedForm

      // Act
      const actual = await AdminFormService.duplicateFormField(
        mockForm,
        fieldToDuplicate._id,
      )

      // Assert
      expect(actual._unsafeUnwrapErr()).toEqual(new FormNotFoundError())
    })

    it('should return DatabaseValidationError when field model update throws a validation error', async () => {
      // Arrange
      const initialFields = [generateDefaultField(BasicField.Mobile)]
      const mockForm = {
        title: 'some mock form',
        form_fields: initialFields,
        duplicateFormFieldByIdAndIndex: jest.fn().mockRejectedValue(
          // @ts-ignore
          new mongoose.Error.ValidationError({ errors: 'does not matter' }),
        ),
      } as unknown as IPopulatedForm

      // Act
      const actual = await AdminFormService.duplicateFormField(
        mockForm,
        initialFields[0]._id,
      )

      // Assert
      expect(actual._unsafeUnwrapErr()).toBeInstanceOf(DatabaseValidationError)
    })
  })

  describe('reorderFormField', () => {
    it('should return reordered fields successfully', async () => {
      // Arrange
      const mockFormFields = [
        generateDefaultField(BasicField.YesNo),
        generateDefaultField(BasicField.Date),
      ]
      const mockUpdatedForm = {
        form_fields: [mockFormFields[1], mockFormFields[0]],
      }
      const mockForm = {
        form_fields: mockFormFields,
        reorderFormFieldById: jest.fn().mockResolvedValue(mockUpdatedForm),
      } as unknown as IPopulatedForm
      const fieldToReorder = String(mockFormFields[0]._id)
      const newPosition = 1

      // Act
      const actual = await AdminFormService.reorderFormField(
        mockForm,
        fieldToReorder,
        newPosition,
      )

      // Assert
      expect(actual._unsafeUnwrap()).toEqual(mockUpdatedForm.form_fields)
      expect(mockForm.reorderFormFieldById).toHaveBeenCalledWith(
        fieldToReorder,
        newPosition,
      )
    })

    it('should return FieldNotFoundError when null is returned from the model instance method', async () => {
      // Arrange
      const mockForm = {
        form_fields: [generateDefaultField(BasicField.YesNo)],
        reorderFormFieldById: jest.fn().mockResolvedValue(null),
      } as unknown as IPopulatedForm
      const fieldToReorder = new ObjectId().toHexString()
      const newPosition = 2

      // Act
      const actual = await AdminFormService.reorderFormField(
        mockForm,
        fieldToReorder,
        newPosition,
      )

      // Assert
      expect(actual._unsafeUnwrapErr()).toEqual(new FieldNotFoundError())
      expect(mockForm.reorderFormFieldById).toHaveBeenCalledWith(
        fieldToReorder,
        newPosition,
      )
    })

    it('should return database error when error occurs whilst reordering fields', async () => {
      // Arrange
      const mockForm = {
        form_fields: [generateDefaultField(BasicField.YesNo)],
        // Rejection
        reorderFormFieldById: jest
          .fn()
          .mockRejectedValue(new Error('some error')),
      } as unknown as IPopulatedForm
      const fieldToReorder = new ObjectId().toHexString()
      const newPosition = 2

      // Act
      const actual = await AdminFormService.reorderFormField(
        mockForm,
        fieldToReorder,
        newPosition,
      )

      // Assert
      const actualError = actual._unsafeUnwrapErr()
      expect(actualError).toBeInstanceOf(DatabaseError)
      expect(actualError.message).toEqual(expect.stringContaining('some error'))
      expect(mockForm.reorderFormFieldById).toHaveBeenCalledWith(
        fieldToReorder,
        newPosition,
      )
    })
  })

  describe('updateFormCollaborators', () => {
    it('should return the list of collaborators when update is successful', async () => {
      // Arrange
      const findAgencySpy = jest.spyOn(AgencyModel, 'findOne')
      // Return a truthy value to ensure that the find is successful
      //@ts-ignore
      findAgencySpy.mockResolvedValueOnce({})

      const newCollaborators = [
        {
          email: `fakeuser@gov.sg`,
          write: false,
        },
      ]
      const mockForm = {
        title: 'some mock form',
        permissionList: [],
        updateFormCollaborators: jest
          .fn()
          .mockResolvedValue({ permissionList: newCollaborators }),
      } as unknown as IPopulatedForm

      // Act
      const actual = await AdminFormService.updateFormCollaborators(
        mockForm,
        newCollaborators,
      )

      // Assert
      expect(mockForm.updateFormCollaborators).toHaveBeenCalledWith(
        newCollaborators,
      )
      expect(actual._unsafeUnwrap()).toEqual(newCollaborators)
    })

    it('should return an application error when updating the form model fails', async () => {
      // Arrange
      const findAgencySpy = jest.spyOn(AgencyModel, 'findOne')
      // Return a truthy value to ensure that the find is successful
      //@ts-ignore
      findAgencySpy.mockResolvedValueOnce({})

      const newCollaborators = [
        {
          email: `fakeuser@gov.sg`,
          write: false,
        },
      ]
      const mockForm = {
        title: 'some mock form',
        permissionList: [],
        updateFormCollaborators: jest
          .fn()
          .mockRejectedValue(new DatabaseError()),
      } as unknown as IPopulatedForm

      // Act
      const actual = await AdminFormService.updateFormCollaborators(
        mockForm,
        newCollaborators,
      )

      // Assert
      expect(mockForm.updateFormCollaborators).toHaveBeenCalledWith(
        newCollaborators,
      )
      expect(actual._unsafeUnwrapErr()).toBeInstanceOf(ApplicationError)
    })

    it('should return InvalidCollaboratorError when the new collaborator has a non-whitelisted email', async () => {
      // Arrange
      const findAgencySpy = jest.spyOn(AgencyModel, 'findOne')
      findAgencySpy.mockResolvedValueOnce(null)

      const newCollaborators = [
        {
          email: `fakeuser@gov.sg`,
          write: false,
        },
      ]
      const mockForm = {
        title: 'some mock form',
        permissionList: [],
        updateFormCollaborators: jest
          .fn()
          .mockResolvedValue({ permissionList: newCollaborators }),
      } as unknown as IPopulatedForm

      // Act
      const actual = await AdminFormService.updateFormCollaborators(
        mockForm,
        newCollaborators,
      )

      // Assert
      expect(findAgencySpy).toHaveBeenCalledOnce()
      expect(mockForm.updateFormCollaborators).not.toHaveBeenCalled()
      expect(actual._unsafeUnwrapErr()).toBeInstanceOf(InvalidCollaboratorError)
    })
  })

  describe('createFormLogic', () => {
    const logicId1 = new ObjectId()
    const logicId2 = new ObjectId()
    const logicId3 = new ObjectId()
    const mockEmailFormId = new ObjectId()
    const mockEncryptFormId = new ObjectId()

    const mockFormLogicOld = {
      form_logics: [
        {
          _id: logicId1,
          logicType: LogicType.ShowFields,
        } as FormLogicSchema,
        {
          _id: logicId2,
          logicType: LogicType.ShowFields,
        } as FormLogicSchema,
      ],
    }

    const createLogicBody = {
      logicType: LogicType.PreventSubmit,
    } as LogicDto

    const mockFormLogicUpdated = {
      form_logics: [
        {
          _id: logicId1,
          logicType: LogicType.ShowFields,
        } as FormLogicSchema,
        {
          _id: logicId2,
          logicType: LogicType.ShowFields,
        } as FormLogicSchema,
        {
          _id: logicId3,
          logicType: LogicType.PreventSubmit,
        } as FormLogicSchema,
      ],
    }

    const CREATE_SPY = jest.spyOn(FormModel, 'createFormLogic')

    let mockEmailForm: IPopulatedForm,
      mockEncryptForm: IPopulatedForm,
      mockEmailFormUpdated: IPopulatedForm,
      mockEncryptFormUpdated: IPopulatedForm

    beforeEach(() => {
      mockEmailForm = {
        _id: mockEmailFormId,
        status: FormStatus.Public,
        responseMode: FormResponseMode.Email,
        ...mockFormLogicOld,
      } as unknown as IPopulatedForm
      mockEncryptForm = {
        _id: mockEncryptFormId,
        status: FormStatus.Public,
        responseMode: FormResponseMode.Encrypt,
        ...mockFormLogicOld,
      } as unknown as IPopulatedForm
      mockEmailFormUpdated = {
        ...mockEmailForm,
        ...mockFormLogicUpdated,
      } as unknown as IPopulatedForm
      mockEncryptFormUpdated = {
        ...mockEncryptForm,
        ...mockFormLogicUpdated,
      } as unknown as IPopulatedForm
    })

    it('should return ok(created logic) on successful form logic create for email mode form', async () => {
      // Arrange
      CREATE_SPY.mockResolvedValue(mockEmailFormUpdated as IFormDocument)

      // Act
      const actualResult = await AdminFormService.createFormLogic(
        mockEmailForm,
        createLogicBody,
      )

      // Assert
      expect(actualResult.isOk()).toEqual(true)
      expect(actualResult._unsafeUnwrap()).toEqual(
        expect.objectContaining(createLogicBody),
      )

      expect(CREATE_SPY).toHaveBeenCalledWith(
        mockEmailForm._id,
        createLogicBody,
      )
    })

    it('should return ok(created logic) on successful form logic create for encrypt mode form', async () => {
      // Arrange
      CREATE_SPY.mockResolvedValue(mockEncryptFormUpdated as IFormDocument)

      // Act
      const actualResult = await AdminFormService.createFormLogic(
        mockEncryptForm,
        createLogicBody,
      )

      // Assert
      expect(actualResult.isOk()).toEqual(true)
      expect(actualResult._unsafeUnwrap()).toEqual(
        expect.objectContaining(createLogicBody),
      )

      expect(CREATE_SPY).toHaveBeenCalledWith(
        mockEncryptFormId,
        createLogicBody,
      )
    })

    it('should return err(FormNotFoundError) if db does not return form object', async () => {
      // Arrange
      CREATE_SPY.mockResolvedValue(undefined as unknown as IFormDocument)

      // Act
      const actualResult = await AdminFormService.createFormLogic(
        mockEncryptForm,
        createLogicBody,
      )

      // Assert
      expect(actualResult.isErr()).toEqual(true)
      expect(actualResult._unsafeUnwrapErr()).toEqual(new FormNotFoundError())

      expect(CREATE_SPY).toHaveBeenCalledWith(
        mockEncryptFormId,
        createLogicBody,
      )
    })

    it('should return err(DatabaseError) if db returns form object that does not have form_logics array', async () => {
      // Arrange
      const updatedFormWithoutLogic = omit(
        mockEncryptFormUpdated,
        'form_logics',
      )
      CREATE_SPY.mockResolvedValue(updatedFormWithoutLogic as IFormDocument)

      // Act
      const actualResult = await AdminFormService.createFormLogic(
        mockEncryptForm,
        createLogicBody,
      )

      // Assert
      expect(actualResult.isErr()).toEqual(true)
      expect(actualResult._unsafeUnwrapErr()).toEqual(new DatabaseError())

      expect(CREATE_SPY).toHaveBeenCalledWith(
        mockEncryptFormId,
        createLogicBody,
      )
    })

    it('should return err(DatabaseError) if db returns form object that has empty form_logics array', async () => {
      // Arrange
      const updatedFormWithEmptyLogic = {
        ...mockEncryptFormUpdated,
        form_logics: [],
      }
      CREATE_SPY.mockResolvedValue(updatedFormWithEmptyLogic as IFormDocument)

      // Act
      const actualResult = await AdminFormService.createFormLogic(
        mockEncryptForm,
        createLogicBody,
      )

      // Assert
      expect(actualResult.isErr()).toEqual(true)
      expect(actualResult._unsafeUnwrapErr()).toEqual(new DatabaseError())

      expect(CREATE_SPY).toHaveBeenCalledWith(
        mockEncryptFormId,
        createLogicBody,
      )
    })
  })

  describe('deleteFormField', () => {
    let deleteSpy: jest.SpyInstance

    beforeEach(() => {
      deleteSpy = jest.spyOn(FormModel, 'deleteFormFieldById')
    })
    it('should return updated form when field deletion is successful', async () => {
      // Arrange
      const fieldToDelete = generateDefaultField(BasicField.Mobile)
      const initialFields = [
        fieldToDelete,
        generateDefaultField(BasicField.Image),
      ]
      const mockUpdatedForm = {
        title: 'some mock form',
        // Append created field to end of form_fields.
        form_fields: [initialFields[1]],
      } as IFormSchema
      const mockForm = {
        title: 'some mock form',
        form_fields: initialFields,
        _id: new ObjectId(),
      } as unknown as IPopulatedForm
      deleteSpy.mockResolvedValueOnce(mockUpdatedForm)

      // Act
      const actual = await AdminFormService.deleteFormField(
        mockForm,
        String(fieldToDelete._id),
      )

      // Assert
      expect(actual._unsafeUnwrap()).toEqual(mockUpdatedForm)
      expect(deleteSpy).toHaveBeenCalledWith(
        String(mockForm._id),
        fieldToDelete._id,
      )
    })

    it("should return FieldNotFoundError when the fieldId does not exist in the form's fields", async () => {
      // Arrange
      const mockForm = {
        title: 'some mock form',
        form_fields: [generateDefaultField(BasicField.Nric)],
        _id: new ObjectId(),
      } as unknown as IPopulatedForm

      // Act
      const actual = await AdminFormService.deleteFormField(
        mockForm,
        new ObjectId().toHexString(),
      )

      // Assert
      expect(actual._unsafeUnwrapErr()).toEqual(new FieldNotFoundError())
      expect(deleteSpy).not.toHaveBeenCalled()
    })

    it('should return FormNotFoundError when field deletion returns null', async () => {
      // Arrange
      const fieldToDelete = generateDefaultField(BasicField.Mobile)
      const mockForm = {
        title: 'some mock form',
        form_fields: [fieldToDelete],
        _id: new ObjectId(),
      } as unknown as IPopulatedForm
      deleteSpy.mockResolvedValueOnce(null)

      // Act
      const actual = await AdminFormService.deleteFormField(
        mockForm,
        fieldToDelete._id,
      )

      // Assert
      expect(actual._unsafeUnwrapErr()).toEqual(new FormNotFoundError())
      expect(deleteSpy).toHaveBeenCalledWith(
        String(mockForm._id),
        fieldToDelete._id,
      )
    })
  })

  describe('updateEndPage', () => {
    const updateSpy = jest.spyOn(FormModel, 'updateEndPageById')
    const MOCK_FORM_ID = new ObjectId().toHexString()
    const MOCK_NEW_END_PAGE: FormEndPage = {
      title: 'expected end page title',
      buttonLink: 'https://some-button-link.example.com',
      buttonText: 'expected button text',
      paragraph: 'some paragraph',
      paymentTitle: '',
      paymentParagraph: '',
    }

    it('should return updated end page when update is successful', async () => {
      // Arrange
      const mockUpdatedForm = {
        endPage: MOCK_NEW_END_PAGE,
      } as IFormDocument
      updateSpy.mockResolvedValueOnce(mockUpdatedForm)

      // Act
      const actual = await AdminFormService.updateEndPage(
        MOCK_FORM_ID,
        MOCK_NEW_END_PAGE,
      )

      // Assert
      expect(actual._unsafeUnwrap()).toEqual(MOCK_NEW_END_PAGE)
    })

    it('should return FormNotFoundError when form cannot be found', async () => {
      // Arrange
      updateSpy.mockResolvedValueOnce(null)

      // Act
      const actual = await AdminFormService.updateEndPage(
        MOCK_FORM_ID,
        MOCK_NEW_END_PAGE,
      )

      // Assert
      expect(actual._unsafeUnwrapErr()).toEqual(new FormNotFoundError())
    })

    it('should return DatabaseError when database model update throws an error', async () => {
      // Arrange
      const expectedErrorMsg = 'some error'
      updateSpy.mockRejectedValueOnce(new Error(expectedErrorMsg))

      // Act
      const actual = await AdminFormService.updateEndPage(
        MOCK_FORM_ID,
        MOCK_NEW_END_PAGE,
      )

      // Assert
      const actualError = actual._unsafeUnwrapErr()
      expect(actualError).toBeInstanceOf(DatabaseError)
      expect(actualError.message).toIncludeMultiple([
        expectedErrorMsg,
        'Please refresh and try again.',
      ])
    })
  })

  describe('updateStartPage', () => {
    const updateSpy = jest.spyOn(FormModel, 'updateStartPageById')
    const MOCK_FORM_ID = new ObjectId().toHexString()
    const MOCK_NEW_START_PAGE: FormStartPage = {
      colorTheme: FormColorTheme.Blue,
      paragraph: 'some paragraph',
      estTimeTaken: 10000000,
      logo: {
        state: FormLogoState.Default,
      },
    }

    it('should return updated start page when update is successful', async () => {
      // Arrange
      const mockUpdatedForm = {
        startPage: MOCK_NEW_START_PAGE,
      } as IFormDocument
      updateSpy.mockResolvedValueOnce(mockUpdatedForm)

      // Act
      const actual = await AdminFormService.updateStartPage(
        MOCK_FORM_ID,
        MOCK_NEW_START_PAGE,
      )

      // Assert
      expect(actual._unsafeUnwrap()).toEqual(MOCK_NEW_START_PAGE)
    })

    it('should return FormNotFoundError when form cannot be found', async () => {
      // Arrange
      updateSpy.mockResolvedValueOnce(null)

      // Act
      const actual = await AdminFormService.updateStartPage(
        MOCK_FORM_ID,
        MOCK_NEW_START_PAGE,
      )

      // Assert
      expect(actual._unsafeUnwrapErr()).toEqual(new FormNotFoundError())
    })

    it('should return DatabaseError when database model update throws an error', async () => {
      // Arrange
      const expectedErrorMsg = 'some error'
      updateSpy.mockRejectedValueOnce(new Error(expectedErrorMsg))

      // Act
      const actual = await AdminFormService.updateStartPage(
        MOCK_FORM_ID,
        MOCK_NEW_START_PAGE,
      )

      // Assert
      const actualError = actual._unsafeUnwrapErr()
      expect(actualError).toBeInstanceOf(DatabaseError)
      expect(actualError.message).toIncludeMultiple([
        expectedErrorMsg,
        'Please refresh and try again.',
      ])
    })
  })

  describe('updateFormLogic', () => {
    const logicId1 = new ObjectId()
    const logicId2 = new ObjectId()
    const mockEmailFormId = new ObjectId()
    const mockEncryptFormId = new ObjectId()

    const mockFormLogicOld = {
      form_logics: [
        {
          _id: logicId1,
          logicType: LogicType.ShowFields,
        } as FormLogicSchema,
        {
          _id: logicId2,
          logicType: LogicType.ShowFields,
        } as FormLogicSchema,
      ],
    }

    const updateLogicBody = {
      _id: String(logicId1),
      logicType: LogicType.PreventSubmit,
    } as LogicDto

    const updatedLogic = {
      _id: logicId1,
      logicType: LogicType.PreventSubmit,
    } as FormLogicSchema

    const mockFormLogicUpdated = {
      form_logics: [
        {
          _id: logicId1,
          logicType: LogicType.PreventSubmit,
        } as FormLogicSchema,
        {
          _id: logicId2,
          logicType: LogicType.ShowFields,
        } as FormLogicSchema,
      ],
    }

    const UPDATE_SPY = jest.spyOn(FormModel, 'updateFormLogic')

    let mockEmailForm: IPopulatedForm,
      mockEncryptForm: IPopulatedForm,
      mockEmailFormUpdated: IPopulatedForm,
      mockEncryptFormUpdated: IPopulatedForm

    beforeEach(() => {
      mockEmailForm = {
        _id: mockEmailFormId,
        status: FormStatus.Public,
        responseMode: FormResponseMode.Email,
        ...mockFormLogicOld,
      } as unknown as IPopulatedForm
      mockEncryptForm = {
        _id: mockEncryptFormId,
        status: FormStatus.Public,
        responseMode: FormResponseMode.Encrypt,
        ...mockFormLogicOld,
      } as unknown as IPopulatedForm
      mockEmailFormUpdated = {
        ...mockEmailForm,
        ...mockFormLogicUpdated,
      } as unknown as IPopulatedForm
      mockEncryptFormUpdated = {
        ...mockEncryptForm,
        ...mockFormLogicUpdated,
      } as unknown as IPopulatedForm
    })

    it('should return ok(updated logic) on successful form logic update for email mode form', async () => {
      // Arrange
      UPDATE_SPY.mockResolvedValue(mockEmailFormUpdated as IFormSchema)

      // Act
      const actualResult = await AdminFormService.updateFormLogic(
        mockEmailForm,
        logicId1.toHexString(),
        updateLogicBody,
      )

      // Assert
      expect(actualResult.isOk()).toEqual(true)
      expect(actualResult._unsafeUnwrap()).toEqual(updatedLogic)

      expect(UPDATE_SPY).toHaveBeenCalledWith(
        mockEmailForm._id.toHexString(),
        logicId1.toHexString(),
        updateLogicBody,
      )
    })

    it('should return ok(updated logic) on successful form logic update for encrypt mode form', async () => {
      // Arrange
      UPDATE_SPY.mockResolvedValue(mockEncryptFormUpdated as IFormSchema)

      // Act
      const actualResult = await AdminFormService.updateFormLogic(
        mockEncryptForm,
        logicId1.toHexString(),
        updateLogicBody,
      )

      // Assert
      expect(actualResult.isOk()).toEqual(true)
      expect(actualResult._unsafeUnwrap()).toEqual(updatedLogic)

      expect(UPDATE_SPY).toHaveBeenCalledWith(
        mockEncryptFormId.toHexString(),
        logicId1.toHexString(),
        updateLogicBody,
      )
    })

    it('should return LogicNotFoundError if logic does not exist on form', async () => {
      // Act
      const wrongLogicId = new ObjectId().toHexString()
      const actualResult = await AdminFormService.updateFormLogic(
        mockEmailForm,
        wrongLogicId,
        updateLogicBody,
      )

      // Assert
      expect(actualResult.isErr()).toEqual(true)
      expect(actualResult._unsafeUnwrapErr()).toEqual(new LogicNotFoundError())
      expect(UPDATE_SPY).not.toHaveBeenCalled()
    })
  })

  describe('getFormField', () => {
    it('should return the form field when retrieval is successful', async () => {
      // Arrange
      const MOCK_FIELD = generateDefaultField(BasicField.Image)
      const MOCK_FORM = {
        title: 'some mock form',
        // Append created field to end of form_fields.
        form_fields: [MOCK_FIELD],
        _id: new ObjectId(),
      } as IPopulatedForm

      // Act
      const actual = await AdminFormService.getFormField(
        MOCK_FORM,
        String(MOCK_FIELD._id),
      )

      // Assert
      expect(actual._unsafeUnwrap()).toEqual(MOCK_FIELD)
    })

    it("should return FieldNotFoundError when the fieldId does not exist in the form's fields", async () => {
      // Arrange
      const MOCK_ID = new ObjectId().toHexString()
      const MOCK_FORM = {
        title: 'some mock form',
        // Append created field to end of form_fields.
        form_fields: [],
        _id: new ObjectId(),
      } as unknown as IPopulatedForm
      const expectedError = new FieldNotFoundError(
        `Attempted to retrieve field ${MOCK_ID} from ${MOCK_FORM._id} but field was not present`,
      )

      // Act
      const actual = await AdminFormService.getFormField(MOCK_FORM, MOCK_ID)

      // Assert
      expect(actual._unsafeUnwrapErr()).toEqual(expectedError)
    })
  })

  describe('createTwilioCredentials', () => {
    const MOCK_FORM_ID = new mongoose.Types.ObjectId()
    const MOCK_ADMIN_ID = new mongoose.Types.ObjectId()

    const MOCK_FORM = {
      _id: MOCK_FORM_ID,
      admin: {
        _id: MOCK_ADMIN_ID,
      },
    } as unknown as IPopulatedForm

    const MOCK_ACCOUNT_SID = 'AC12345678'
    const MOCK_API_KEY_SID = 'SK12345678'
    const MOCK_API_KEY_SECRET = 'AZ12345678'
    const MOCK_MESSAGING_SERVICE_SID = 'MG12345678'

    const TWILIO_CREDENTIALS: TwilioCredentials = {
      accountSid: MOCK_ACCOUNT_SID,
      apiKey: MOCK_API_KEY_SID,
      apiSecret: MOCK_API_KEY_SECRET,
      messagingServiceSid: MOCK_MESSAGING_SERVICE_SID,
    }

    const sessionSpy = jest.spyOn(FormModel, 'startSession')

    it('should return undefined when Twilio credentials was created successfully', async () => {
      // Arrange
      sessionSpy.mockResolvedValueOnce({
        withTransaction: () => {
          return {
            then: () => undefined,
          }
        },
      } as any)

      // Act
      const actualResult = await AdminFormService.createTwilioCredentials(
        TWILIO_CREDENTIALS,
        MOCK_FORM,
      )

      // Assert
      expect(actualResult.isOk()).toEqual(true)
      expect(actualResult._unsafeUnwrap()).toEqual(undefined)

      expect(sessionSpy).toHaveBeenCalled()
    })
  })

  describe('updateTwilioCredentials', () => {
    const MOCK_FORM_ID = new mongoose.Types.ObjectId()

    const MOCK_ACCOUNT_SID = 'AC12345678'
    const MOCK_API_KEY_SID = 'SK12345678'
    const MOCK_API_KEY_SECRET = 'AZ12345678'
    const MOCK_MESSAGING_SERVICE_SID = 'MG12345678'

    const TWILIO_CREDENTIALS: TwilioCredentials = {
      accountSid: MOCK_ACCOUNT_SID,
      apiKey: MOCK_API_KEY_SID,
      apiSecret: MOCK_API_KEY_SECRET,
      messagingServiceSid: MOCK_MESSAGING_SERVICE_SID,
    }

    it('should return the response of performing PutSecretValue operation on the SecretsManager', async () => {
      // Arrange
      const msgSrvcName = `formsg/${config.secretEnv}/form/${MOCK_FORM_ID}/twilio`

      const getSecretsSpy = jest
        .spyOn(secretsManager, 'getSecretValue')
        .mockImplementationOnce(() => {
          return {
            promise: () => {
              return Promise.resolve({
                Name: msgSrvcName,
              })
            },
          } as any
        })

      const twilioCacheSpy = jest
        .spyOn(MockSmsService.twilioClientCache, 'del')
        .mockReturnValueOnce(1)

      const putSecretsSpy = jest
        .spyOn(secretsManager, 'putSecretValue')
        .mockImplementationOnce(() => {
          return {
            promise: () => {
              return Promise.resolve({
                Name: msgSrvcName,
              })
            },
          } as any
        })

      // Act

      const actualResult = await AdminFormService.updateTwilioCredentials(
        msgSrvcName,
        TWILIO_CREDENTIALS,
      )

      // Assert
      expect(actualResult.isOk()).toEqual(true)
      expect(actualResult._unsafeUnwrap()).toEqual(1)

      expect(getSecretsSpy).toHaveBeenCalledWith({
        SecretId: msgSrvcName,
      })
      expect(twilioCacheSpy).toHaveBeenCalledWith(msgSrvcName)
      expect(putSecretsSpy).toHaveBeenCalledWith({
        SecretId: msgSrvcName,
        SecretString: JSON.stringify(TWILIO_CREDENTIALS),
      })
    })
  })

  describe('deleteTwilioCredentials', () => {
    const MOCK_FORM_ID = new mongoose.Types.ObjectId()
    const sessionSpy = jest.spyOn(FormModel, 'startSession')
    const MSG_SRVC_NAME = `formsg/${config.secretEnv}/form/${MOCK_FORM_ID}/twilio`
    const MOCK_FORM = {
      _id: MOCK_FORM_ID,
      save: () => MOCK_FORM,
      msgSrvcName: MSG_SRVC_NAME,
    } as unknown as IPopulatedForm

    it('should return result of clearing TwilioCache entry when Twilio credentials was successfully deleted', async () => {
      // Arrange
      sessionSpy.mockResolvedValueOnce({
        withTransaction: () => {
          return {
            then: () => undefined,
          }
        },
      } as any)

      // formSpy.mockResolvedValueOnce(MOCK_FORM)

      const twilioCacheSpy = jest
        .spyOn(MockSmsService.twilioClientCache, 'del')
        .mockReturnValueOnce(1)

      // Act

      const actualResult =
        await AdminFormService.deleteTwilioCredentials(MOCK_FORM)

      // Assert
      expect(actualResult.isOk()).toEqual(true)
      expect(actualResult._unsafeUnwrap()).toEqual(1)

      expect(twilioCacheSpy).toHaveBeenCalledWith(MSG_SRVC_NAME)
    })
  })

  describe('checkIsWhitelistSettingValid', () => {
    const MOCK_VALID_UEN = '53244311W'
    const MOCK_VALID_FIN = 'F1612366T'
    const MOCK_VALID_NRIC = 'S7101844Z'

    it('should return isValid as true without invalidReason if whitelist setting contains valid submitterIds', () => {
      // Arrange
      const MOCK_WHITELIST_SETTING = [
        MOCK_VALID_NRIC,
        MOCK_VALID_FIN,
        MOCK_VALID_UEN,
      ]

      // Act
      const result = AdminFormService.checkIsWhitelistSettingValid(
        MOCK_WHITELIST_SETTING,
      )

      // Assert
      expect(result).toEqual({
        isValid: true,
      })
    })

    it('should return isValid as true without invalidReason if whitelist setting contains no submitterIds', () => {
      // Arrange
      const MOCK_WHITELIST_SETTING: string[] = []

      // Act
      const result = AdminFormService.checkIsWhitelistSettingValid(
        MOCK_WHITELIST_SETTING,
      )

      // Assert
      expect(result).toEqual({
        isValid: true,
      })
    })

    it('should return isValid as true without invalidReason if whitelist setting is null which means setting as isWhitelistEnabled to false', () => {
      // Arrange
      const MOCK_WHITELIST_SETTING = null

      // Act
      const result = AdminFormService.checkIsWhitelistSettingValid(
        MOCK_WHITELIST_SETTING,
      )

      // Assert
      expect(result).toEqual({
        isValid: true,
      })
    })

    it('should return duplicate submitter id error message if whitelist csv string has duplicate submitter ids', () => {
      // Arrange
      const MOCK_WHITELIST_SETTING = [
        MOCK_VALID_NRIC,
        MOCK_VALID_FIN,
        MOCK_VALID_UEN,
        MOCK_VALID_UEN,
      ]

      // Act
      const result = AdminFormService.checkIsWhitelistSettingValid(
        MOCK_WHITELIST_SETTING,
      )

      // Assert
      expect(result).toEqual({
        isValid: false,
        invalidReason: FORM_WHITELIST_SETTING_CONTAINS_DUPLICATES_ERROR_MESSAGE,
      })
    })

    it('should return empty row not allowed error message if whitelist csv string has empty rows', () => {
      // Arrange
      const MOCK_WHITELIST_SETTING = [
        MOCK_VALID_NRIC,
        MOCK_VALID_FIN,
        '',
        MOCK_VALID_UEN,
      ]

      // Act
      const result = AdminFormService.checkIsWhitelistSettingValid(
        MOCK_WHITELIST_SETTING,
      )

      // Assert
      expect(result).toEqual({
        isValid: false,
        invalidReason: FORM_WHITELIST_CONTAINS_EMPTY_ROWS_ERROR_MESSAGE,
      })
    })

    it('should return invalid submitter id error message if whitelist csv string has invalid submitter ids', () => {
      // Arrange
      const invalidSubmitterId = 'invalid'
      const MOCK_WHITELIST_SETTING = [
        MOCK_VALID_NRIC,
        MOCK_VALID_FIN,
        MOCK_VALID_UEN,
        invalidSubmitterId,
      ]

      // Act
      const result = AdminFormService.checkIsWhitelistSettingValid(
        MOCK_WHITELIST_SETTING,
      )

      // Assert
      expect(result).toEqual({
        isValid: false,
        invalidReason:
          FORM_WHITELIST_SETTING_CONTAINS_INVALID_FORMAT_SUBMITTERID_ERROR_MESSAGE(
            invalidSubmitterId,
          ),
      })
    })
  })

  describe('getFormWhitelistSetting', () => {
    it('should not include myPrivateKey when fetching the whitelist setting', async () => {
      // Arrange
      const MOCK_FORM_ID = new ObjectId()

      const MOCK_WHITELISTED_SUBMITTER_IDS_CONTENT: EncryptedStringsMessageContent =
        {
          myPublicKey: 'some public key',
          cipherTexts: ['abc', 'def'],
          nonce: 'some nonce',
        }
      const MOCK_WHITELISTED_SUBMITTER_IDS_CONTENT_WITH_PK: EncryptedStringsMessageContentWithMyPrivateKey =
        {
          ...MOCK_WHITELISTED_SUBMITTER_IDS_CONTENT,
          myPrivateKey: 'some private key',
        }

      const LEAN_WHITELISTED_SUBMITTER_IDS_DOC = {
        formId: MOCK_FORM_ID,
        ...MOCK_WHITELISTED_SUBMITTER_IDS_CONTENT_WITH_PK,
      }

      const MOCK_WHITELISTED_SUBMITTER_ID_QUERY = {
        exec: jest.fn().mockResolvedValue(LEAN_WHITELISTED_SUBMITTER_IDS_DOC),
      }

      const formWhitelistedSubmitterIdsModelCreateSpy = jest
        .spyOn(FormWhitelistedSubmitterIdsModel, 'findById')
        .mockReturnValueOnce({
          lean: jest
            .fn()
            .mockReturnValue(MOCK_WHITELISTED_SUBMITTER_ID_QUERY) as any,
        } as any)

      const MOCK_ENCRYPTED_WHITELIST_DOCUMENT_ID = new ObjectId()

      const MOCK_FORM_DOCUMENT = {
        getWhitelistedSubmitterIds: jest.fn().mockReturnValue({
          isWhitelistEnabled: true,
          encryptedWhitelistedSubmitterIds:
            MOCK_ENCRYPTED_WHITELIST_DOCUMENT_ID,
        }),
      } as unknown as IPopulatedEncryptedForm

      // Act
      const whitelistedSettingResult =
        await AdminFormService.getFormWhitelistSetting(MOCK_FORM_DOCUMENT)

      // Assert no error occurred
      expect(formWhitelistedSubmitterIdsModelCreateSpy).toHaveBeenCalledWith(
        MOCK_ENCRYPTED_WHITELIST_DOCUMENT_ID,
      )
      expect(whitelistedSettingResult.isOk()).toEqual(true)
      // Assert that the myPrivateKey is not included in the fetched whitelist settings
      expect(whitelistedSettingResult._unsafeUnwrap()).toEqual(
        MOCK_WHITELISTED_SUBMITTER_IDS_CONTENT,
      )
    })
  })

  describe('updateOptionsToRecipientsMap', () => {
    describe('validation of field', () => {
      it('should return error if field is not a dropdown field', async () => {
        // Arrange
        const mockFormFields = [
          {
            _id: 'fieldId',
            fieldType: BasicField.ShortText,
          },
        ]
        const mockForm = {
          _id: 'formId',
          form_fields: mockFormFields,
          updateFormFieldById: jest.fn().mockResolvedValue({
            form_fields: [mockFormFields],
          }),
        } as unknown as IPopulatedForm

        const optionsMap = {}

        // Act
        const result = await AdminFormService.updateOptionsToRecipientsMap(
          mockForm,
          'fieldId',
          optionsMap,
        )

        // Assert
        expect(result.isErr()).toBe(true)
        expect(result._unsafeUnwrapErr()).toBeInstanceOf(EditFieldError)
      })

      it('should allow operation if field is a dropdown field', async () => {
        // Arrange
        const mockFormFields = [
          {
            _id: 'fieldId',
            fieldType: BasicField.Dropdown,
            fieldOptions: ['option1'],
            toObject: jest.fn().mockReturnValue({
              _id: 'fieldId',
              fieldType: BasicField.Dropdown,
              fieldOptions: ['option1'],
            }),
          },
        ]

        const mockForm = {
          _id: 'formId',
          form_fields: mockFormFields,
          updateFormFieldById: jest.fn().mockResolvedValue({
            form_fields: mockFormFields,
          }),
        } as unknown as IPopulatedForm

        const optionsMap = {
          option1: ['test1@example.com'],
        }

        // Act
        const result = await AdminFormService.updateOptionsToRecipientsMap(
          mockForm,
          'fieldId',
          optionsMap,
        )

        // Assert
        expect(result.isOk()).toBe(true)
      })
    })

    describe('validation of options to recipients map', () => {
      it('should return error if options to recipients map has options that are not in the field options', async () => {
        // Arrange
        const mockForm = {
          _id: 'formId',
          form_fields: [
            {
              _id: 'fieldId',
              fieldType: BasicField.Dropdown,
              fieldOptions: ['option1', 'option2'],
            },
          ],
        } as unknown as IPopulatedForm

        const invalidOptionsMap = {
          option1: ['test1@example.com'],
          option2: ['test2@example.com'],
          option3: ['test3@example.com'],
        }

        // Act
        const result = await AdminFormService.updateOptionsToRecipientsMap(
          mockForm,
          'fieldId',
          invalidOptionsMap,
        )

        // Assert
        expect(result.isErr()).toBe(true)
        expect(result._unsafeUnwrapErr().message).toBe(
          CONDITIONAL_ROUTING_MISMATCHED_OPTIONS_ERROR_MESSAGE,
        )
      })

      it('should return error if options to recipients map does not have options that are in the field options', async () => {
        // Arrange
        const mockForm = {
          _id: 'formId',
          form_fields: [
            {
              _id: 'fieldId',
              fieldType: BasicField.Dropdown,
              fieldOptions: ['option1', 'option2'],
            },
          ],
        } as unknown as IPopulatedForm

        const incompleteOptionsMap = {
          option2: ['test2@example.com'],
        }

        // Act
        const result = await AdminFormService.updateOptionsToRecipientsMap(
          mockForm,
          'fieldId',
          incompleteOptionsMap,
        )

        // Assert
        expect(result.isErr()).toBe(true)
        expect(result._unsafeUnwrapErr().message).toBe(
          CONDITIONAL_ROUTING_MISMATCHED_OPTIONS_ERROR_MESSAGE,
        )
      })

      it('should return error if some options is empty string', async () => {
        // Arrange
        const mockForm = {
          _id: 'formId',
          form_fields: [
            {
              _id: 'fieldId',
              fieldType: BasicField.Dropdown,
              fieldOptions: ['option1', ''],
            },
          ],
        } as unknown as IPopulatedForm

        const emptyOptionsMap = {
          '': ['test@example.com'],
          option2: ['test2@example.com'],
        }

        // Act
        const result = await AdminFormService.updateOptionsToRecipientsMap(
          mockForm,
          'fieldId',
          emptyOptionsMap,
        )

        // Assert
        expect(result.isErr()).toBe(true)
        expect(result._unsafeUnwrapErr().message).toBe(
          CONDITIONAL_ROUTING_EMAILS_OPTIONS_MISSING_ERROR_MESSAGE,
        )
      })

      it('should return error if some recipients are invalid emails', async () => {
        // Arrange
        const mockForm = {
          _id: 'formId',
          form_fields: [
            {
              _id: 'fieldId',
              fieldType: BasicField.Dropdown,
              fieldOptions: ['option1'],
            },
          ],
        } as unknown as IPopulatedForm

        const invalidEmailsMap = {
          option1: ['invalid-email', 'valid-email@example.com'],
          option2: ['valid-email2@example.com'],
        }

        // Act
        const result = await AdminFormService.updateOptionsToRecipientsMap(
          mockForm,
          'fieldId',
          invalidEmailsMap,
        )

        // Assert
        expect(result.isErr()).toBe(true)
        expect(result._unsafeUnwrapErr().message).toBe(
          CONDITIONAL_ROUTING_INVALID_CSV_FORMAT_ERROR_MESSAGE,
        )
      })

      it('should save if the options to recipients map is valid', async () => {
        // Arrange
        const mockFormField = {
          _id: 'fieldId',
          fieldType: BasicField.Dropdown,
          fieldOptions: ['option1', 'option2'],
          toObject: jest.fn().mockReturnValue({
            _id: 'fieldId',
            fieldType: BasicField.Dropdown,
            fieldOptions: ['option1', 'option2'],
          }),
        }

        const mockForm = {
          _id: 'formId',
          form_fields: [mockFormField],
          updateFormFieldById: jest.fn().mockResolvedValue({
            form_fields: [mockFormField],
          }),
        }

        const validOptionsMap = {
          option1: ['test@example.com'],
          option2: [
            'test2@example.com',
            'test3@example.com',
            'test4@example.com',
          ],
        }

        // Act
        const result = await AdminFormService.updateOptionsToRecipientsMap(
          mockForm as unknown as IPopulatedForm,
          'fieldId',
          validOptionsMap,
        )

        // Assert
        expect(result.isOk()).toBe(true)
        expect(mockForm.updateFormFieldById).toHaveBeenCalledWith('fieldId', {
          _id: 'fieldId',
          fieldType: BasicField.Dropdown,
          fieldOptions: ['option1', 'option2'],
          optionsToRecipientsMap: validOptionsMap,
        })
      })

      it('should save if the options to recipients map is empty aka deleted', async () => {
        // Arrange
        const mockFormField = {
          _id: 'fieldId',
          fieldType: BasicField.Dropdown,
          fieldOptions: ['option1'],
          toObject: jest.fn().mockReturnValue({
            _id: 'fieldId',
            fieldType: BasicField.Dropdown,
            fieldOptions: ['option1'],
          }),
        }

        const mockForm = {
          _id: 'formId',
          form_fields: [mockFormField],
          updateFormFieldById: jest.fn().mockResolvedValue({
            form_fields: [mockFormField],
          }),
        }

        // Act
        const result = await AdminFormService.updateOptionsToRecipientsMap(
          mockForm as unknown as IPopulatedForm,
          'fieldId',
          {},
        )

        // Assert
        expect(result.isOk()).toBe(true)
        expect(mockForm.updateFormFieldById).toHaveBeenCalledWith('fieldId', {
          _id: 'fieldId',
          fieldType: BasicField.Dropdown,
          fieldOptions: ['option1'],
          optionsToRecipientsMap: {},
        })
      })
    })
  })
})
