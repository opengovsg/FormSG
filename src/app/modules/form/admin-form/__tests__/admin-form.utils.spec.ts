import { ObjectId } from 'bson-ext'

import { IPopulatedForm, IPopulatedUser, Permission, Status } from 'src/types'

import { ForbiddenFormError, FormDeletedError } from '../../form.errors'
import { assertHasReadPermissions } from '../admin-form.utils'

describe('admin-form.utils', () => {
  describe('assertHasReadPermissions', () => {
    const MOCK_VALID_ADMIN_ID = new ObjectId()
    const MOCK_VALID_ADMIN_EMAIL = 'test@example.com'
    const MOCK_USER = {
      _id: MOCK_VALID_ADMIN_ID,
      email: MOCK_VALID_ADMIN_EMAIL,
    } as IPopulatedUser

    it('should return true if user is form admin', async () => {
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

    it('should return true if user has read permissions', async () => {
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

    it('should return FormDeletedError when given form is archived', async () => {
      // Arrange
      // Form is archived.
      const mockForm = {
        title: 'mockForm',
        status: Status.Archived,
        _id: new ObjectId(),
        admin: MOCK_USER,
      } as IPopulatedForm

      // Act
      const actualResult = assertHasReadPermissions(MOCK_USER, mockForm)

      // Assert
      expect(actualResult.isErr()).toEqual(true)
      expect(actualResult._unsafeUnwrapErr()).toEqual(
        new FormDeletedError('Form has been archived'),
      )
    })

    it('should return ForbiddenFormError if user does not have read permissions', async () => {
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
})
