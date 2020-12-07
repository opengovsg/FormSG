import { ObjectId } from 'bson-ext'

import {
  IPopulatedForm,
  IPopulatedUser,
  Permission,
  ResponseMode,
  Status,
} from 'src/types'

import { ForbiddenFormError } from '../../form.errors'
import { DuplicateFormBody, OverrideProps } from '../admin-form.types'
import {
  assertHasDeletePermissions,
  assertHasReadPermissions,
  assertHasWritePermissions,
  processDuplicateOverrideProps,
} from '../admin-form.utils'

describe('admin-form.utils', () => {
  const MOCK_VALID_ADMIN_ID = new ObjectId()
  const MOCK_VALID_ADMIN_EMAIL = 'test@example.com'
  const MOCK_USER = {
    _id: MOCK_VALID_ADMIN_ID,
    email: MOCK_VALID_ADMIN_EMAIL,
  } as IPopulatedUser

  describe('assertHasReadPermissions', () => {
    it('should return true when user is form admin', async () => {
      // Arrange
      const mockForm = {
        title: 'mockForm',
        status: Status.Private,
        _id: new ObjectId(),
        // User is form admin.
        admin: MOCK_USER,
      } as IPopulatedForm

      // Act
      const actualResult = assertHasReadPermissions(MOCK_USER, mockForm)

      // Assert
      expect(actualResult.isOk()).toEqual(true)
      expect(actualResult._unsafeUnwrap()).toEqual(true)
    })

    it('should return true when user has read permissions', async () => {
      // Arrange
      // Form is owned by another admin, but MOCK_USER has permissions.
      const mockForm = {
        title: 'mockForm',
        status: Status.Public,
        _id: new ObjectId(),
        // New admin.
        admin: {
          _id: new ObjectId(),
        } as IPopulatedUser,
        // But MOCK_USER has permissions..
        permissionList: [{ email: MOCK_USER.email }],
      } as IPopulatedForm

      // Act
      const actualResult = assertHasReadPermissions(MOCK_USER, mockForm)

      // Assert
      expect(actualResult.isOk()).toEqual(true)
      expect(actualResult._unsafeUnwrap()).toEqual(true)
    })

    it('should return ForbiddenFormError when user does not have read permissions', async () => {
      // Arrange
      // Form is owned by another admin, and MOCK_USER does not have
      // permissions.
      const mockForm = {
        title: 'mockForm',
        status: Status.Public,
        _id: new ObjectId(),
        // New admin, no permissionsList.
        admin: {
          _id: new ObjectId(),
        } as IPopulatedUser,
        permissionList: [] as Permission[],
      } as IPopulatedForm

      // Act
      const actualResult = assertHasReadPermissions(MOCK_USER, mockForm)

      // Assert
      expect(actualResult.isErr()).toEqual(true)
      expect(actualResult._unsafeUnwrapErr()).toEqual(
        new ForbiddenFormError(
          `User ${MOCK_USER.email} not authorized to perform read operation on Form ${mockForm._id} with title: ${mockForm.title}.`,
        ),
      )
    })
  })

  describe('assertHasWritePermissions', () => {
    it('should return true when user is form admin', async () => {
      // Arrange
      const mockForm = {
        title: 'mockForm',
        status: Status.Private,
        _id: new ObjectId(),
        // User is form admin.
        admin: MOCK_USER,
      } as IPopulatedForm

      // Act
      const actualResult = assertHasWritePermissions(MOCK_USER, mockForm)

      // Assert
      expect(actualResult.isOk()).toEqual(true)
      expect(actualResult._unsafeUnwrap()).toEqual(true)
    })

    it('should return true when user has write permissions', async () => {
      // Arrange
      // Form is owned by another admin, but MOCK_USER has permissions.
      const mockForm = {
        title: 'mockForm',
        status: Status.Public,
        _id: new ObjectId(),
        // New admin.
        admin: {
          _id: new ObjectId(),
        } as IPopulatedUser,
        // But MOCK_USER has write permissions.
        permissionList: [{ email: MOCK_USER.email, write: true }],
      } as IPopulatedForm

      // Act
      const actualResult = assertHasWritePermissions(MOCK_USER, mockForm)

      // Assert
      expect(actualResult.isOk()).toEqual(true)
      expect(actualResult._unsafeUnwrap()).toEqual(true)
    })

    it('should return ForbiddenFormError when user has read but not write permissions', async () => {
      // Arrange
      // Form is owned by another admin, and MOCK_USER does not have
      // permissions.
      const mockForm = {
        title: 'mockForm',
        status: Status.Public,
        _id: new ObjectId(),
        // New admin, no permissionsList.
        admin: {
          _id: new ObjectId(),
        } as IPopulatedUser,
        // Only read permissions.
        permissionList: [{ email: MOCK_USER.email }],
      } as IPopulatedForm

      // Act
      const actualResult = assertHasWritePermissions(MOCK_USER, mockForm)

      // Assert
      expect(actualResult.isErr()).toEqual(true)
      expect(actualResult._unsafeUnwrapErr()).toEqual(
        new ForbiddenFormError(
          `User ${MOCK_USER.email} not authorized to perform write operation on Form ${mockForm._id} with title: ${mockForm.title}.`,
        ),
      )
    })

    it('should return ForbiddenFormError when user does not exist in permission list', async () => {
      // Arrange
      // Form is owned by another admin, and MOCK_USER does not have
      // permissions.
      const mockForm = {
        title: 'mockForm',
        status: Status.Public,
        _id: new ObjectId(),
        // New admin, no permissionsList.
        admin: {
          _id: new ObjectId(),
        } as IPopulatedUser,
        permissionList: [] as Permission[],
      } as IPopulatedForm

      // Act
      const actualResult = assertHasWritePermissions(MOCK_USER, mockForm)

      // Assert
      expect(actualResult.isErr()).toEqual(true)
      expect(actualResult._unsafeUnwrapErr()).toEqual(
        new ForbiddenFormError(
          `User ${MOCK_USER.email} not authorized to perform write operation on Form ${mockForm._id} with title: ${mockForm.title}.`,
        ),
      )
    })
  })

  describe('assertHasDeletePermissions', () => {
    it('should return true when user is form admin', async () => {
      // Arrange
      const mockForm = {
        title: 'mockForm',
        status: Status.Private,
        _id: new ObjectId(),
        // User is form admin.
        admin: MOCK_USER,
      } as IPopulatedForm

      // Act
      const actualResult = assertHasDeletePermissions(MOCK_USER, mockForm)

      // Assert
      expect(actualResult.isOk()).toEqual(true)
      expect(actualResult._unsafeUnwrap()).toEqual(true)
    })

    it('should return ForbiddenFormError when user is not admin even with read permissions', async () => {
      // Arrange
      // Form is owned by another admin, but MOCK_USER has permissions.
      const mockForm = {
        title: 'mockForm',
        status: Status.Public,
        _id: new ObjectId(),
        // New admin.
        admin: {
          _id: new ObjectId(),
        } as IPopulatedUser,
        // But MOCK_USER has permissions..
        permissionList: [{ email: MOCK_USER.email }],
      } as IPopulatedForm

      // Act
      const actualResult = assertHasDeletePermissions(MOCK_USER, mockForm)

      // Assert
      expect(actualResult.isErr()).toEqual(true)
      expect(actualResult._unsafeUnwrapErr()).toEqual(
        new ForbiddenFormError(
          `User ${MOCK_USER.email} not authorized to perform delete operation on Form ${mockForm._id} with title: ${mockForm.title}.`,
        ),
      )
    })

    it('should return ForbiddenFormError when user is not admin even with write permissions', async () => {
      // Arrange
      // Form is owned by another admin, but MOCK_USER has permissions.
      const mockForm = {
        title: 'mockForm',
        status: Status.Public,
        _id: new ObjectId(),
        // New admin.
        admin: {
          _id: new ObjectId(),
        } as IPopulatedUser,
        // But MOCK_USER has permissions.
        permissionList: [{ email: MOCK_USER.email, write: true }],
      } as IPopulatedForm

      // Act
      const actualResult = assertHasDeletePermissions(MOCK_USER, mockForm)

      // Assert
      expect(actualResult.isErr()).toEqual(true)
      expect(actualResult._unsafeUnwrapErr()).toEqual(
        new ForbiddenFormError(
          `User ${MOCK_USER.email} not authorized to perform delete operation on Form ${mockForm._id} with title: ${mockForm.title}.`,
        ),
      )
    })
  })

  describe('processDuplicateOverrideProps', () => {
    it('should return processed props for ResponseMode.Encrypt', async () => {
      // Arrange
      const newAdminId = new ObjectId().toHexString()
      const params: DuplicateFormBody = {
        responseMode: ResponseMode.Encrypt,
        publicKey: 'some public key',
        title: 'some title',
      }

      // Act
      const actual = processDuplicateOverrideProps(params, newAdminId)

      // Assert
      const expected: OverrideProps = {
        responseMode: params.responseMode,
        title: params.title,
        admin: newAdminId,
        publicKey: params.publicKey,
      }
      expect(actual).toEqual(expected)
    })

    it('should return processed props for ResponseMode.Email', async () => {
      // Arrange
      const newAdminId = new ObjectId().toHexString()
      const params: DuplicateFormBody = {
        responseMode: ResponseMode.Email,
        emails: ['some@example.com', 'another@example.com'],
        title: 'some title',
      }

      // Act
      const actual = processDuplicateOverrideProps(params, newAdminId)

      // Assert
      const expected: OverrideProps = {
        responseMode: params.responseMode,
        title: params.title,
        admin: newAdminId,
        emails: params.emails,
      }
      expect(actual).toEqual(expected)
    })
  })
})
