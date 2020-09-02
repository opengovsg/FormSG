import { ObjectID } from 'bson'
import { merge, omit } from 'lodash'
import mongoose from 'mongoose'

import getFormModel, {
  getEmailFormModel,
  getEncryptedFormModel,
} from 'src/app/models/form.server.model'
import {
  IAgencySchema,
  IEncryptedForm,
  IUserSchema,
  Permission,
  ResponseMode,
} from 'src/types'

import dbHandler from '../helpers/jest-db'

const Form = getFormModel(mongoose)
const EncryptedForm = getEncryptedFormModel(mongoose)
const EmailForm = getEmailFormModel(mongoose)

const MOCK_ADMIN_OBJ_ID = new ObjectID()
const MOCK_ADMIN_DOMAIN = 'example.com'
const MOCK_ADMIN_EMAIL = `test@${MOCK_ADMIN_DOMAIN}`

const MOCK_FORM_PARAMS = {
  title: 'Test Form',
  admin: MOCK_ADMIN_OBJ_ID,
}
const MOCK_ENCRYPTED_FORM_PARAMS = {
  ...MOCK_FORM_PARAMS,
  publicKey: 'mockPublicKey',
  responseMode: ResponseMode.Encrypt,
}
const MOCK_EMAIL_FORM_PARAMS = {
  ...MOCK_FORM_PARAMS,
  emails: [MOCK_ADMIN_EMAIL],
  responseMode: ResponseMode.Email,
}

const FORM_DEFAULTS = {
  authType: 'NIL',
  inactiveMessage:
    'If you think this is a mistake, please contact the agency that gave you the form link.',
  isListed: true,
  startPage: {
    colorTheme: 'blue',
  },
  endPage: {
    title: 'Thank you for filling out the form.',
    buttonText: 'Submit another form',
  },
  hasCaptcha: true,
  form_fields: [],
  form_logics: [],
  permissionList: [],
  webhook: {
    url: '',
  },
  status: 'PRIVATE',
}

describe('Form Model', () => {
  let preloadedAdmin: IUserSchema, preloadedAgency: IAgencySchema

  beforeAll(async () => await dbHandler.connect())
  beforeEach(async () => {
    const preloaded = await dbHandler.insertFormCollectionReqs({
      userId: MOCK_ADMIN_OBJ_ID,
      mailDomain: MOCK_ADMIN_DOMAIN,
    })

    preloadedAdmin = preloaded.user
    preloadedAgency = preloaded.agency
  })
  afterEach(async () => await dbHandler.clearDatabase())
  afterAll(async () => await dbHandler.closeDatabase())

  describe('Schema', () => {
    describe('Base Schema', () => {
      it('should create and save successfully', async () => {
        // Arrange + Act
        const validForm = new Form(MOCK_FORM_PARAMS)
        const saved = await validForm.save()

        // Assert
        // All fields should exist
        // Object Id should be defined when successfully saved to MongoDB.
        expect(saved._id).toBeDefined()
        expect(saved.created).toBeInstanceOf(Date)
        expect(saved.lastModified).toBeInstanceOf(Date)
        // Retrieve object and compare to params, remove indeterministic keys
        const actualSavedObject = omit(saved.toObject(), [
          '_id',
          'created',
          'lastModified',
          '__v',
        ])
        const expectedObject = merge({}, FORM_DEFAULTS, MOCK_FORM_PARAMS)
        expect(actualSavedObject).toEqual(expectedObject)
      })

      it('should save successfully, but not save fields that is not defined in the schema', async () => {
        // Arrange
        const formParamsWithExtra = merge({}, MOCK_FORM_PARAMS, {
          extra: 'somethingExtra',
        })

        // Act
        const validForm = new Form(formParamsWithExtra)
        const saved = await validForm.save()

        // Assert
        // All fields should exist
        // Object Id should be defined when successfully saved to MongoDB.
        expect(saved._id).toBeDefined()
        expect(saved.created).toBeInstanceOf(Date)
        expect(saved.lastModified).toBeInstanceOf(Date)
        // Retrieve object and compare to params, remove indeterministic keys
        const actualSavedObject = omit(saved.toObject(), [
          '_id',
          'created',
          'lastModified',
          '__v',
        ])
        const expectedObject = merge({}, FORM_DEFAULTS, MOCK_FORM_PARAMS)
        expect(actualSavedObject).toEqual(expectedObject)

        // Extra key should not be saved
        expect(Object.keys(saved)).not.toContain('extra')
      })

      it('should create and save successfully with valid permissionList emails', async () => {
        // Arrange
        // permissionList has email with valid domain
        // Write is also set to true
        const permissionList = [{ email: MOCK_ADMIN_EMAIL, write: true }]
        const formParams = merge({}, MOCK_FORM_PARAMS, {
          permissionList: permissionList,
        })

        const validForm = new Form(formParams)
        const saved = await validForm.save()

        // Assert
        // Object Id should be defined when successfully saved to MongoDB.
        expect(saved._id).toBeDefined()
        expect(saved.created).toBeInstanceOf(Date)
        expect(saved.lastModified).toBeInstanceOf(Date)
        // Retrieve object and compare to params, remove indeterministic keys
        // Remove permissionList too due to objects inside having
        // indeterministic IDs, check separately.
        const actualSavedObject = omit(saved.toObject(), [
          '_id',
          'created',
          'lastModified',
          '__v',
          'permissionList',
        ])
        const expectedObject = merge(
          {},
          omit(FORM_DEFAULTS, 'permissionList'),
          MOCK_FORM_PARAMS,
        )
        expect(actualSavedObject).toEqual(expectedObject)

        // Remove indeterministic id from actual permission list
        const actualPermissionList = saved
          .toObject()
          .permissionList!.map((permission: Permission[]) =>
            omit(permission, '_id'),
          )
        expect(actualPermissionList).toEqual(permissionList)
      })

      it('should reject when admin id is invalid', async () => {
        // Arrange
        const invalidAdminId = new ObjectID()
        const paramsWithInvalidAdmin = merge({}, MOCK_FORM_PARAMS, {
          admin: invalidAdminId,
        })

        // Act
        const invalidForm = new Form(paramsWithInvalidAdmin)

        // Assert
        await expect(invalidForm.save()).rejects.toThrowError(
          'Admin for this form is not found.',
        )
      })

      it('should reject when form title is missing', async () => {
        // Arrange
        const paramsWithoutTitle = omit(MOCK_FORM_PARAMS, 'title')

        // Act
        const invalidForm = new Form(paramsWithoutTitle)

        // Assert
        await expect(invalidForm.save()).rejects.toThrowError(
          mongoose.Error.ValidationError,
        )
      })

      it('should reject when form admin is missing', async () => {
        // Arrange
        const paramsWithoutAdmin = omit(MOCK_FORM_PARAMS, 'admin')

        // Act
        const invalidForm = new Form(paramsWithoutAdmin)

        // Assert
        await expect(invalidForm.save()).rejects.toThrowError(
          'Admin for this form is not found.',
        )
      })

      it('should reject when form permissionList[].email is missing', async () => {
        // Arrange
        // permissionList has missing email key
        const invalidPermissionList = [{ write: true }]
        const malformedParams = merge({}, MOCK_FORM_PARAMS, {
          permissionList: invalidPermissionList,
        })

        // Act
        const invalidForm = new Form(malformedParams)

        // Assert
        await expect(invalidForm.save()).rejects.toThrowError(
          mongoose.Error.ValidationError,
        )
      })

      it('should reject when form permissionList[].email is not in the Agency collection', async () => {
        // Arrange
        // permissionList has an email domain not inside Agency collection
        const invalidPermissionList = [
          { email: 'test@example2.com', write: true },
        ]
        const malformedParams = merge({}, MOCK_FORM_PARAMS, {
          permissionList: invalidPermissionList,
        })

        // Act
        const invalidForm = new Form(malformedParams)

        // Assert
        await expect(invalidForm.save()).rejects.toThrowError(
          mongoose.Error.ValidationError,
        )
      })
    })

    describe('Encrypted form schema', () => {
      const ENCRYPT_FORM_DEFAULTS = merge(
        { responseMode: 'encrypt' },
        FORM_DEFAULTS,
      )

      it('should create and save successfully', async () => {
        // Arrange + Act
        const validForm = new EncryptedForm(MOCK_ENCRYPTED_FORM_PARAMS)
        const saved = await validForm.save()

        // Assert
        // All fields should exist
        // Object Id should be defined when successfully saved to MongoDB.
        expect(saved._id).toBeDefined()
        expect(saved.created).toBeInstanceOf(Date)
        expect(saved.lastModified).toBeInstanceOf(Date)
        // Retrieve object and compare to params, remove indeterministic keys
        const actualSavedObject = omit(saved.toObject(), [
          '_id',
          'created',
          'lastModified',
          '__v',
        ])
        const expectedObject = merge(
          {},
          ENCRYPT_FORM_DEFAULTS,
          MOCK_ENCRYPTED_FORM_PARAMS,
        )
        expect(actualSavedObject).toEqual(expectedObject)
      })

      it('should save successfully, but not save fields that is not defined in the schema', async () => {
        // Arrange
        const formParamsWithExtra = merge({}, MOCK_ENCRYPTED_FORM_PARAMS, {
          extra: 'somethingExtra',
        })

        // Act
        const validForm = new EncryptedForm(formParamsWithExtra)
        const saved = await validForm.save()

        // Assert
        // All fields should exist
        // Object Id should be defined when successfully saved to MongoDB.
        expect(saved._id).toBeDefined()
        expect(saved.created).toBeInstanceOf(Date)
        expect(saved.lastModified).toBeInstanceOf(Date)
        // Retrieve object and compare to params, remove indeterministic keys
        const actualSavedObject = omit(saved.toObject(), [
          '_id',
          'created',
          'lastModified',
          '__v',
        ])
        const expectedObject = merge(
          {},
          ENCRYPT_FORM_DEFAULTS,
          MOCK_ENCRYPTED_FORM_PARAMS,
        )
        expect(actualSavedObject).toEqual(expectedObject)

        // Extra key should not be saved
        expect(Object.keys(saved)).not.toContain('extra')
      })

      it('should create and save successfully with valid permissionList emails', async () => {
        // Arrange
        // permissionList has email with valid domain
        // Write is also set to true
        const permissionList = [{ email: MOCK_ADMIN_EMAIL, write: true }]
        const formParams = merge({}, MOCK_ENCRYPTED_FORM_PARAMS, {
          permissionList: permissionList,
        })

        const validForm = new EncryptedForm(formParams)
        const saved = await validForm.save()

        // Assert
        // Object Id should be defined when successfully saved to MongoDB.
        expect(saved._id).toBeDefined()
        expect(saved.created).toBeInstanceOf(Date)
        expect(saved.lastModified).toBeInstanceOf(Date)
        // Retrieve object and compare to params, remove indeterministic keys
        // Remove permissionList too due to objects inside having
        // indeterministic IDs, check separately.
        const actualSavedObject = omit(saved.toObject(), [
          '_id',
          'created',
          'lastModified',
          '__v',
          'permissionList',
        ])
        const expectedObject = merge(
          {},
          omit(ENCRYPT_FORM_DEFAULTS, 'permissionList'),
          MOCK_ENCRYPTED_FORM_PARAMS,
        )
        expect(actualSavedObject).toEqual(expectedObject)

        // Remove indeterministic id from actual permission list
        const actualPermissionList = (saved.toObject() as IEncryptedForm).permissionList!.map(
          (permission) => omit(permission, '_id'),
        )
        expect(actualPermissionList).toEqual(permissionList)
      })

      it('should reject when publicKey is missing', async () => {
        // Arrange
        const paramsWithoutPublicKey = omit(
          MOCK_ENCRYPTED_FORM_PARAMS,
          'publicKey',
        )

        // Act
        const invalidForm = new EncryptedForm(paramsWithoutPublicKey)

        // Assert
        await expect(invalidForm.save()).rejects.toThrowError(
          mongoose.Error.ValidationError,
        )
      })

      it('should reject when admin id is invalid', async () => {
        // Arrange
        const invalidAdminId = new ObjectID()
        const paramsWithInvalidAdmin = merge({}, MOCK_ENCRYPTED_FORM_PARAMS, {
          admin: invalidAdminId,
        })

        // Act
        const invalidForm = new EncryptedForm(paramsWithInvalidAdmin)

        // Assert
        await expect(invalidForm.save()).rejects.toThrowError(
          'Admin for this form is not found.',
        )
      })

      it('should reject when form title is missing', async () => {
        // Arrange
        const paramsWithoutTitle = omit(MOCK_ENCRYPTED_FORM_PARAMS, 'title')

        // Act
        const invalidForm = new EncryptedForm(paramsWithoutTitle)

        // Assert
        await expect(invalidForm.save()).rejects.toThrowError(
          mongoose.Error.ValidationError,
        )
      })

      it('should reject when form admin is missing', async () => {
        // Arrange
        const paramsWithoutAdmin = omit(MOCK_ENCRYPTED_FORM_PARAMS, 'admin')

        // Act
        const invalidForm = new EncryptedForm(paramsWithoutAdmin)

        // Assert
        await expect(invalidForm.save()).rejects.toThrowError(
          'Admin for this form is not found.',
        )
      })

      it('should reject when form permissionList[].email is missing', async () => {
        // Arrange
        // permissionList has missing email key
        const invalidPermissionList = [{ write: true }]
        const malformedParams = merge({}, MOCK_ENCRYPTED_FORM_PARAMS, {
          permissionList: invalidPermissionList,
        })

        // Act
        const invalidForm = new EncryptedForm(malformedParams)

        // Assert
        await expect(invalidForm.save()).rejects.toThrowError(
          mongoose.Error.ValidationError,
        )
      })

      it('should reject when form permissionList[].email is not in the Agency collection', async () => {
        // Arrange
        // permissionList has an email domain not inside Agency collection
        const invalidPermissionList = [
          { email: 'test@example2.com', write: true },
        ]
        const malformedParams = merge({}, MOCK_ENCRYPTED_FORM_PARAMS, {
          permissionList: invalidPermissionList,
        })

        // Act
        const invalidForm = new EncryptedForm(malformedParams)

        // Assert
        await expect(invalidForm.save()).rejects.toThrowError(
          mongoose.Error.ValidationError,
        )
      })
    })

    describe('Email form schema', () => {
      const EMAIL_FORM_DEFAULTS = merge(
        { responseMode: 'email' },
        FORM_DEFAULTS,
      )

      it('should create and save successfully', async () => {
        // Arrange + Act
        const validForm = new EmailForm(MOCK_EMAIL_FORM_PARAMS)
        const saved = await validForm.save()

        // Assert
        // All fields should exist
        // Object Id should be defined when successfully saved to MongoDB.
        expect(saved._id).toBeDefined()
        expect(saved.created).toBeInstanceOf(Date)
        expect(saved.lastModified).toBeInstanceOf(Date)
        // Retrieve object and compare to params, remove indeterministic keys
        const actualSavedObject = omit(saved.toObject(), [
          '_id',
          'created',
          'lastModified',
          '__v',
        ])
        const expectedObject = merge(
          {},
          EMAIL_FORM_DEFAULTS,
          MOCK_EMAIL_FORM_PARAMS,
        )
        expect(actualSavedObject).toEqual(expectedObject)
      })

      it('should save successfully, but not save fields that is not defined in the schema', async () => {
        // Arrange
        const formParamsWithExtra = merge({}, MOCK_EMAIL_FORM_PARAMS, {
          extra: 'somethingExtra',
        })

        // Act
        const validForm = new EmailForm(formParamsWithExtra)
        const saved = await validForm.save()

        // Assert
        // All fields should exist
        // Object Id should be defined when successfully saved to MongoDB.
        expect(saved._id).toBeDefined()
        expect(saved.created).toBeInstanceOf(Date)
        expect(saved.lastModified).toBeInstanceOf(Date)
        // Retrieve object and compare to params, remove indeterministic keys
        const actualSavedObject = omit(saved.toObject(), [
          '_id',
          'created',
          'lastModified',
          '__v',
        ])
        const expectedObject = merge(
          {},
          EMAIL_FORM_DEFAULTS,
          MOCK_EMAIL_FORM_PARAMS,
        )
        expect(actualSavedObject).toEqual(expectedObject)

        // Extra key should not be saved
        expect(Object.keys(saved)).not.toContain('extra')
      })

      it('should create and save successfully with valid permissionList emails', async () => {
        // Arrange
        // permissionList has email with valid domain
        // Write is also set to true
        const permissionList = [{ email: MOCK_ADMIN_EMAIL, write: true }]
        const formParams = merge({}, MOCK_EMAIL_FORM_PARAMS, {
          permissionList: permissionList,
        })

        const validForm = new EmailForm(formParams)
        const saved = await validForm.save()

        // Assert
        // Object Id should be defined when successfully saved to MongoDB.
        expect(saved._id).toBeDefined()
        expect(saved.created).toBeInstanceOf(Date)
        expect(saved.lastModified).toBeInstanceOf(Date)
        // Retrieve object and compare to params, remove indeterministic keys
        // Remove permissionList too due to objects inside having
        // indeterministic IDs, check separately.
        const actualSavedObject = omit(saved.toObject(), [
          '_id',
          'created',
          'lastModified',
          '__v',
          'permissionList',
        ])
        const expectedObject = merge(
          {},
          omit(EMAIL_FORM_DEFAULTS, 'permissionList'),
          MOCK_EMAIL_FORM_PARAMS,
        )
        expect(actualSavedObject).toEqual(expectedObject)

        // Remove indeterministic id from actual permission list
        const actualPermissionList = saved
          .toObject()
          .permissionList!.map((permission: Permission[]) =>
            omit(permission, '_id'),
          )
        expect(actualPermissionList).toEqual(permissionList)
      })

      it('should reject when emails array is missing', async () => {
        // Arrange
        const paramsWithoutEmailsArray = omit(MOCK_EMAIL_FORM_PARAMS, 'emails')

        // Act
        const invalidForm = new EmailForm(paramsWithoutEmailsArray)

        // Assert
        await expect(invalidForm.save()).rejects.toThrowError(
          mongoose.Error.ValidationError,
        )
      })

      it('should reject when emails array is empty', async () => {
        // Arrange
        const paramsWithEmptyEmailsArray = {
          ...MOCK_EMAIL_FORM_PARAMS,
          emails: [],
        }

        // Act
        const invalidForm = new EmailForm(paramsWithEmptyEmailsArray)

        // Assert
        await expect(invalidForm.save()).rejects.toThrowError(
          mongoose.Error.ValidationError,
        )
      })

      it('should reject when admin id is invalid', async () => {
        // Arrange
        const invalidAdminId = new ObjectID()
        const paramsWithInvalidAdmin = merge({}, MOCK_EMAIL_FORM_PARAMS, {
          admin: invalidAdminId,
        })

        // Act
        const invalidForm = new EmailForm(paramsWithInvalidAdmin)

        // Assert
        await expect(invalidForm.save()).rejects.toThrowError(
          'Admin for this form is not found.',
        )
      })

      it('should reject when form title is missing', async () => {
        // Arrange
        const paramsWithoutTitle = omit(MOCK_EMAIL_FORM_PARAMS, 'title')

        // Act
        const invalidForm = new EmailForm(paramsWithoutTitle)

        // Assert
        await expect(invalidForm.save()).rejects.toThrowError(
          mongoose.Error.ValidationError,
        )
      })

      it('should reject when form admin is missing', async () => {
        // Arrange
        const paramsWithoutAdmin = omit(MOCK_EMAIL_FORM_PARAMS, 'admin')

        // Act
        const invalidForm = new EmailForm(paramsWithoutAdmin)

        // Assert
        await expect(invalidForm.save()).rejects.toThrowError(
          'Admin for this form is not found.',
        )
      })

      it('should reject when form permissionList[].email is missing', async () => {
        // Arrange
        // permissionList has missing email key
        const invalidPermissionList = [{ write: true }]
        const malformedParams = merge({}, MOCK_EMAIL_FORM_PARAMS, {
          permissionList: invalidPermissionList,
        })

        // Act
        const invalidForm = new EmailForm(malformedParams)

        // Assert
        await expect(invalidForm.save()).rejects.toThrowError(
          mongoose.Error.ValidationError,
        )
      })

      it('should reject when form permissionList[].email is not in the Agency collection', async () => {
        // Arrange
        // permissionList has an email domain not inside Agency collection
        const invalidPermissionList = [
          { email: 'test@example2.com', write: true },
        ]
        const malformedParams = merge({}, MOCK_EMAIL_FORM_PARAMS, {
          permissionList: invalidPermissionList,
        })

        // Act
        const invalidForm = new EmailForm(malformedParams)

        // Assert
        await expect(invalidForm.save()).rejects.toThrowError(
          mongoose.Error.ValidationError,
        )
      })
    })
  })

  describe('Statics', () => {
    describe('getFullFormById', () => {
      it('should return null when the formId is invalid', async () => {
        // Arrange
        const invalidFormId = new ObjectID()

        // Act
        const form = await Form.getFullFormById(String(invalidFormId))

        // Assert
        expect(form).toBeNull()
      })

      it('should return the populated email form when formId is valid', async () => {
        // Arrange
        const emailFormParams = merge({}, MOCK_EMAIL_FORM_PARAMS, {
          admin: preloadedAdmin,
        })
        // Create a form
        const form = (await Form.create(emailFormParams)).toObject()

        // Act
        const actualForm = (await Form.getFullFormById(form._id))!.toObject()

        // Assert
        // Form should be returned
        expect(actualForm).not.toBeNull()
        // Omit admin key since it is populated is not ObjectId anymore.
        expect(omit(actualForm, 'admin')).toEqual(omit(form, 'admin'))
        // Verify populated admin shape
        expect(actualForm.admin).not.toBeNull()
        expect(actualForm.admin.email).toEqual(preloadedAdmin.email)
        // Remove indeterministic keys
        const expectedAgency = omit(preloadedAgency.toObject(), [
          '_id',
          'created',
          'lastModified',
          '__v',
        ])
        expect(actualForm.admin.agency).toEqual(
          expect.objectContaining(expectedAgency),
        )
      })

      it('should return the populated encrypt form when formId is valid', async () => {
        // Arrange
        const encryptFormParams = merge({}, MOCK_ENCRYPTED_FORM_PARAMS, {
          admin: preloadedAdmin,
        })
        // Create a form
        const form = (await Form.create(encryptFormParams)).toObject()

        // Act
        const actualForm = (await Form.getFullFormById(form._id))!.toObject()

        // Assert
        // Form should be returned
        expect(actualForm).not.toBeNull()
        // Omit admin key since it is populated is not ObjectId anymore.
        expect(omit(actualForm, 'admin')).toEqual(omit(form, 'admin'))
        // Verify populated admin shape
        expect(actualForm.admin).not.toBeNull()
        expect(actualForm.admin.email).toEqual(preloadedAdmin.email)
        // Remove indeterministic keys
        const expectedAgency = omit(preloadedAgency.toObject(), [
          '_id',
          'created',
          'lastModified',
          '__v',
        ])
        expect(actualForm.admin.agency).toEqual(
          expect.objectContaining(expectedAgency),
        )
      })
    })

    describe('getOtpData', () => {
      it('should return null when formId does not exist', async () => {
        // Arrange
        const invalidFormId = new ObjectID()

        // Act
        const form = await Form.getOtpData(String(invalidFormId))

        // Assert
        expect(form).toBeNull()
      })

      it('should return otpData of an email form when formId is valid', async () => {
        // Arrange
        const emailFormParams = merge({}, MOCK_EMAIL_FORM_PARAMS, {
          msgSrvcName: 'mockSrvcName',
        })
        // Create a form with msgSrvcName
        const form = await Form.create(emailFormParams)

        // Act
        const actualOtpData = await Form.getOtpData(form._id)

        // Assert
        // OtpData should be returned
        expect(actualOtpData).not.toBeNull()
        // Check shape
        const expectedOtpData = {
          form: form._id,
          formAdmin: {
            email: preloadedAdmin.email,
            userId: preloadedAdmin._id,
          },
          msgSrvcName: emailFormParams.msgSrvcName,
        }
        expect(actualOtpData).toEqual(expectedOtpData)
      })

      it('should return otpData of an encrypt form when formId is valid', async () => {
        // Arrange
        const encryptFormParams = merge({}, MOCK_ENCRYPTED_FORM_PARAMS, {
          msgSrvcName: 'mockSrvcName',
        })
        // Create a form with msgSrvcName
        const form = await Form.create(encryptFormParams)

        // Act
        const actualOtpData = await Form.getOtpData(form._id)

        // Assert
        // OtpData should be returned
        expect(actualOtpData).not.toBeNull()
        // Check shape
        const expectedOtpData = {
          form: form._id,
          formAdmin: {
            email: preloadedAdmin.email,
            userId: preloadedAdmin._id,
          },
          msgSrvcName: encryptFormParams.msgSrvcName,
        }
        expect(actualOtpData).toEqual(expectedOtpData)
      })
    })
  })
})
