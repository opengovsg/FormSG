const { omit, merge } = require('lodash')
const mongoose = require('mongoose')
const { ObjectId } = require('bson-ext')

const dbHandler = require('../helpers/db-handler')
const Form = spec('dist/backend/app/models/form.server.model').default(mongoose)
const EncryptedForm = mongoose.model('encrypt')
const EmailForm = mongoose.model('email')
const Agency = spec('dist/backend/app/models/agency.server.model').default(
  mongoose,
)
const User = spec('dist/backend/app/models/user.server.model').default(mongoose)

const MOCK_ADMIN_OBJ_ID = new ObjectId()
const MOCK_ADMIN_EMAIL = 'test@example.com'

const MOCK_FORM_PARAMS = {
  title: 'Test Form',
  admin: MOCK_ADMIN_OBJ_ID,
}
const MOCK_ENCRYPTED_FORM_PARAMS = merge({}, MOCK_FORM_PARAMS, {
  publicKey: 'mockPublicKey',
  responseMode: 'encrypt',
})
const MOCK_EMAIL_FORM_PARAMS = merge({}, MOCK_FORM_PARAMS, {
  emails: ['test@example.com'],
  responseMode: 'email',
})

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
  beforeAll(async () => await dbHandler.connect())
  afterEach(async () => await dbHandler.clearDatabase())
  afterAll(async () => await dbHandler.closeDatabase())

  describe('Schema', () => {
    beforeEach(async () => await preloadUserAndAgency())

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
        expect(saved.extra).toBeUndefined()
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
          .permissionList.map((permission) => omit(permission, '_id'))
        expect(actualPermissionList).toEqual(permissionList)
      })

      it('should reject when admin id is invalid', async () => {
        // Arrange
        const invalidAdminId = new ObjectId()
        const paramsWithInvalidAdmin = merge({}, MOCK_FORM_PARAMS, {
          admin: invalidAdminId,
        })

        // Act
        const invalidForm = new Form(paramsWithInvalidAdmin)

        // Assert
        await expectAsync(invalidForm.save()).toBeRejected()
      })

      it('should reject when form title is missing', async () => {
        // Arrange
        const paramsWithoutTitle = omit(MOCK_FORM_PARAMS, 'title')

        // Act
        const invalidForm = new Form(paramsWithoutTitle)

        // Assert
        await expectAsync(invalidForm.save()).toBeRejectedWithError(
          mongoose.Error.ValidationError,
        )
      })

      it('should reject when form admin is missing', async () => {
        // Arrange
        const paramsWithoutAdmin = omit(MOCK_FORM_PARAMS, 'admin')

        // Act
        const invalidForm = new Form(paramsWithoutAdmin)

        // Assert
        await expectAsync(invalidForm.save()).toBeRejected()
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
        await expectAsync(invalidForm.save()).toBeRejectedWithError(
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
        await expectAsync(invalidForm.save()).toBeRejectedWithError(
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
        expect(saved.extra).toBeUndefined()
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
        const actualPermissionList = saved
          .toObject()
          .permissionList.map((permission) => omit(permission, '_id'))
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
        await expectAsync(invalidForm.save()).toBeRejectedWithError(
          mongoose.Error.ValidationError,
        )
      })

      it('should reject when admin id is invalid', async () => {
        // Arrange
        const invalidAdminId = new ObjectId()
        const paramsWithInvalidAdmin = merge({}, MOCK_ENCRYPTED_FORM_PARAMS, {
          admin: invalidAdminId,
        })

        // Act
        const invalidForm = new EncryptedForm(paramsWithInvalidAdmin)

        // Assert
        await expectAsync(invalidForm.save()).toBeRejected()
      })

      it('should reject when form title is missing', async () => {
        // Arrange
        const paramsWithoutTitle = omit(MOCK_ENCRYPTED_FORM_PARAMS, 'title')

        // Act
        const invalidForm = new EncryptedForm(paramsWithoutTitle)

        // Assert
        await expectAsync(invalidForm.save()).toBeRejectedWithError(
          mongoose.Error.ValidationError,
        )
      })

      it('should reject when form admin is missing', async () => {
        // Arrange
        const paramsWithoutAdmin = omit(MOCK_ENCRYPTED_FORM_PARAMS, 'admin')

        // Act
        const invalidForm = new EncryptedForm(paramsWithoutAdmin)

        // Assert
        await expectAsync(invalidForm.save()).toBeRejected()
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
        await expectAsync(invalidForm.save()).toBeRejectedWithError(
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
        await expectAsync(invalidForm.save()).toBeRejectedWithError(
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
        expect(saved.extra).toBeUndefined()
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
          .permissionList.map((permission) => omit(permission, '_id'))
        expect(actualPermissionList).toEqual(permissionList)
      })

      it('should reject when emails array is missing', async () => {
        // Arrange
        const paramsWithoutEmailsArray = omit(MOCK_EMAIL_FORM_PARAMS, 'emails')

        // Act
        const invalidForm = new EmailForm(paramsWithoutEmailsArray)

        // Assert
        await expectAsync(invalidForm.save()).toBeRejectedWithError(
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
        await expectAsync(invalidForm.save()).toBeRejectedWithError(
          mongoose.Error.ValidationError,
        )
      })

      it('should reject when admin id is invalid', async () => {
        // Arrange
        const invalidAdminId = new ObjectId()
        const paramsWithInvalidAdmin = merge({}, MOCK_EMAIL_FORM_PARAMS, {
          admin: invalidAdminId,
        })

        // Act
        const invalidForm = new EmailForm(paramsWithInvalidAdmin)

        // Assert
        await expectAsync(invalidForm.save()).toBeRejected()
      })

      it('should reject when form title is missing', async () => {
        // Arrange
        const paramsWithoutTitle = omit(MOCK_EMAIL_FORM_PARAMS, 'title')

        // Act
        const invalidForm = new EmailForm(paramsWithoutTitle)

        // Assert
        await expectAsync(invalidForm.save()).toBeRejectedWithError(
          mongoose.Error.ValidationError,
        )
      })

      it('should reject when form admin is missing', async () => {
        // Arrange
        const paramsWithoutAdmin = omit(MOCK_EMAIL_FORM_PARAMS, 'admin')

        // Act
        const invalidForm = new EmailForm(paramsWithoutAdmin)

        // Assert
        await expectAsync(invalidForm.save()).toBeRejected()
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
        await expectAsync(invalidForm.save()).toBeRejectedWithError(
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
        await expectAsync(invalidForm.save()).toBeRejectedWithError(
          mongoose.Error.ValidationError,
        )
      })
    })
  })

  describe('Statics', () => {
    let preloadedAdmin, preloadedAgency

    beforeEach(async () => {
      const preloaded = await preloadUserAndAgency()
      preloadedAdmin = preloaded.admin
      preloadedAgency = preloaded.agency
    })

    describe('getFullFormById', () => {
      it('should return null when the formId is invalid', async () => {
        // Arrange
        const invalidFormId = new ObjectId()

        // Act
        const form = await Form.getFullFormById(invalidFormId)

        // Assert
        expect(form).toBeNull()
      })

      it('should return the populated form when formId is valid', async () => {
        // Arrange
        const formParams = merge({}, MOCK_FORM_PARAMS, {
          admin: preloadedAdmin,
        })
        // Create a form
        const form = (await Form.create(formParams)).toObject()

        // Act
        const actualForm = (await Form.getFullFormById(form._id)).toObject()

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
          jasmine.objectContaining(expectedAgency),
        )
      })
    })

    describe('getOtpData', () => {
      it('should return null when formId does not exist', async () => {
        // Arrange
        const invalidFormId = new ObjectId()

        // Act
        const form = await Form.getOtpData(invalidFormId)

        // Assert
        expect(form).toBeNull()
      })

      it('should return otpData when formId is valid', async () => {
        // Arrange
        const formParams = merge({}, MOCK_FORM_PARAMS, {
          msgSrvcName: 'mockSrvcName',
        })
        // Create a form with msgSrvcName
        const form = await Form.create(formParams)

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
          msgSrvcName: formParams.msgSrvcName,
        }
        expect(actualOtpData).toEqual(expectedOtpData)
      })
    })
  })
})

const preloadUserAndAgency = async () => {
  const agency = await Agency.create({
    shortName: 'mock',
    fullName: 'Mock Agency',
    emailDomain: ['example.com'],
    logo: 'mock',
  })

  const admin = await User.create({
    email: MOCK_ADMIN_EMAIL,
    agency: agency._id,
    _id: MOCK_ADMIN_OBJ_ID,
  })

  return { agency, admin }
}
