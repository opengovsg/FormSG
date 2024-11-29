/* eslint-disable @typescript-eslint/ban-ts-comment */
import { generateDefaultField } from '__tests__/unit/backend/helpers/generate-form-data'
import dbHandler from '__tests__/unit/backend/helpers/jest-db'
import { ObjectId } from 'bson'
import { cloneDeep, map, merge, omit, orderBy, pick } from 'lodash'
import mongoose, { Types } from 'mongoose'
import {
  EMAIL_PUBLIC_FORM_FIELDS,
  STORAGE_PUBLIC_FORM_FIELDS,
} from 'shared/constants/form'
import {
  BasicField,
  FormAuthType,
  FormColorTheme,
  FormEndPage,
  FormField,
  FormFieldDto,
  FormLogoState,
  FormPermission,
  FormResponseMode,
  FormStartPage,
  FormStatus,
  LogicDto,
  LogicType,
  PaymentChannel,
  PaymentType,
  StorageFormSettings,
  WhitelistedSubmitterIdsWithReferenceOid,
  WorkflowType,
} from 'shared/types'

import getFormModel, {
  getEmailFormModel,
  getEncryptedFormModel,
  getMultirespondentFormModel,
} from 'src/app/models/form.server.model'
import {
  IEncryptedForm,
  IFieldSchema,
  IFormDocument,
  IFormSchema,
  ILogicSchema,
  IPopulatedUser,
} from 'src/types'

const Form = getFormModel(mongoose)
const EncryptedForm = getEncryptedFormModel(mongoose)
const EmailForm = getEmailFormModel(mongoose)
const MultirespondentForm = getMultirespondentFormModel(mongoose)

const MOCK_ADMIN_OBJ_ID = new ObjectId()
const MOCK_ADMIN_DOMAIN = 'example.com'
const MOCK_ADMIN_EMAIL = `test@${MOCK_ADMIN_DOMAIN}`

const MOCK_FORM_PARAMS = {
  title: 'Test Form',
  admin: MOCK_ADMIN_OBJ_ID,
}
const MOCK_ENCRYPTED_FORM_PARAMS = {
  ...MOCK_FORM_PARAMS,
  publicKey: 'mockPublicKey',
  responseMode: FormResponseMode.Encrypt,
}
const MOCK_EMAIL_FORM_PARAMS = {
  ...MOCK_FORM_PARAMS,
  emails: [MOCK_ADMIN_EMAIL],
  responseMode: FormResponseMode.Email,
}
const MOCK_MULTIRESPONDENT_FORM_PARAMS = {
  ...MOCK_FORM_PARAMS,
  publicKey: 'mockPublicKey',
  responseMode: FormResponseMode.Multirespondent,
}

const FORM_DEFAULTS = {
  authType: 'NIL',
  isSubmitterIdCollectionEnabled: false,
  isSingleSubmission: false,
  inactiveMessage:
    'If you require further assistance, please contact the agency that gave you the form link.',
  isListed: true,
  startPage: {
    colorTheme: 'blue',
    logo: {
      state: FormLogoState.Default,
    },
  },
  endPage: {
    title: 'Thank you for filling out the form.',
    buttonText: 'Submit another response',
    paymentTitle: 'Thank you, your payment has been made successfully.',
    paymentParagraph: 'Your form has been submitted and payment has been made.',
  },
  hasCaptcha: true,
  hasIssueNotification: true,
  form_fields: [],
  form_logics: [],
  permissionList: [],
  webhook: {
    url: '',
    isRetryEnabled: false,
  },
  status: 'PRIVATE',
  submissionLimit: null,
  goLinkSuffix: '',
}

const ENCRYPT_MODE_SETTINGS_DEFAULTS = {
  emails: [],
  whitelistedSubmitterIds: {
    isWhitelistEnabled: false,
  },
}

const PAYMENTS_DEFAULTS = {
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
}

describe('Form Model', () => {
  let populatedAdmin: IPopulatedUser

  beforeAll(async () => await dbHandler.connect())
  beforeEach(async () => {
    const preloaded = await dbHandler.insertFormCollectionReqs({
      userId: MOCK_ADMIN_OBJ_ID,
      mailDomain: MOCK_ADMIN_DOMAIN,
    })

    populatedAdmin = merge(preloaded.user, {
      agency: preloaded.agency,
    }) as IPopulatedUser
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

      it('should create and save successfully with valid esrvcId', async () => {
        // Arrange
        const validEsrvcId = 'validEsrvcId'
        const validFormParams = merge({}, MOCK_FORM_PARAMS, {
          esrvcId: validEsrvcId,
        })

        // Act
        const validForm = new Form(validFormParams)
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
        const expectedObject = merge({}, FORM_DEFAULTS, validFormParams)
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

      it('should create and save successfully with form_logics that reference nonexistent form_fields', async () => {
        // Arrange
        const FORM_LOGICS = {
          form_logics: [
            {
              conditions: [
                {
                  _id: '',
                  field: new ObjectId(),
                  state: 'is equals to',
                  value: '',
                  ifValueType: 'number',
                },
              ],
              logicType: 'preventSubmit',
              preventSubmitMessage: '',
            },
          ],
        }
        const formParamsWithLogic = merge({}, MOCK_FORM_PARAMS, FORM_LOGICS)

        // Act
        const validForm = new Form(formParamsWithLogic)
        const saved = await validForm.save()

        // Assert
        // All fields should exist
        // Object Id should be defined when successfully saved to MongoDB.
        expect(saved._id).toBeDefined()
        expect(saved.created).toBeInstanceOf(Date)
        expect(saved.lastModified).toBeInstanceOf(Date)
        // Retrieve object and compare to params, remove indeterministic keys
        const actualSavedObject = omit(saved.toObject<IFormDocument>(), [
          '_id',
          'created',
          'lastModified',
          '__v',
        ])
        // @ts-ignore
        actualSavedObject.form_logics = actualSavedObject.form_logics?.map(
          (logic) => omit(logic, '_id'),
        )
        const expectedObject = merge(
          {},
          FORM_DEFAULTS,
          MOCK_FORM_PARAMS,
          FORM_LOGICS,
        )
        expect(actualSavedObject).toEqual(expectedObject)
      })

      it('should create and save successfully with valid permissionList emails', async () => {
        // Arrange
        // permissionList has email with valid domain
        // Write is also set to true
        const permissionList = [{ email: 'newEmail@example.com', write: true }]
        const formParams = merge({}, MOCK_FORM_PARAMS, {
          permissionList,
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
        // Should become lowercased email.
        const expectedPermissionList = permissionList.map((permission) => {
          return {
            ...permission,
            email: permission.email.toLowerCase(),
          }
        })

        // Remove indeterministic id from actual permission list
        const actualPermissionList = saved
          .toObject()
          .permissionList?.map((permission: FormPermission) =>
            omit(permission, '_id'),
          )
        expect(actualPermissionList).toEqual(expectedPermissionList)
      })

      it('should save new admin successfully but remove new admin from permissionList', async () => {
        // Arrange
        const newAdmin = await dbHandler.insertUser({
          agencyId: populatedAdmin.agency._id,
          mailDomain: MOCK_ADMIN_DOMAIN,
          mailName: 'newAdmin',
        })
        // Create new form with newAdmin as collaborator
        const validForm = await new Form({
          ...MOCK_FORM_PARAMS,
          permissionList: [{ email: newAdmin.email, write: false }],
        }).save()

        // Act
        validForm.admin = newAdmin._id
        const updatedForm = (await validForm.save()).toObject()

        // Assert
        expect(updatedForm.admin).toEqual(newAdmin._id)
        // PermissionList should now be empty.
        expect(updatedForm.permissionList).toEqual([])
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
        await expect(invalidForm.save()).rejects.toThrow(
          'Admin for this form is not found.',
        )
      })

      it('should reject when form title is missing', async () => {
        // Arrange
        const paramsWithoutTitle = omit(MOCK_FORM_PARAMS, 'title')

        // Act
        const invalidForm = new Form(paramsWithoutTitle)

        // Assert
        await expect(invalidForm.save()).rejects.toThrow(
          mongoose.Error.ValidationError,
        )
      })

      it('should reject when form admin is missing', async () => {
        // Arrange
        const paramsWithoutAdmin = omit(MOCK_FORM_PARAMS, 'admin')

        // Act
        const invalidForm = new Form(paramsWithoutAdmin)

        // Assert
        await expect(invalidForm.save()).rejects.toThrow(
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
        await expect(invalidForm.save()).rejects.toThrow(
          mongoose.Error.ValidationError,
        )
      })

      it('should reject when form permissionList[].email is not a valid email', async () => {
        // Arrange
        // permissionList has an email domain not inside Agency collection
        const invalidPermissionList = [{ email: 'not an email', write: true }]
        const malformedParams = merge({}, MOCK_FORM_PARAMS, {
          permissionList: invalidPermissionList,
        })

        // Act
        const invalidForm = new Form(malformedParams)

        // Assert
        await expect(invalidForm.save()).rejects.toThrow(
          mongoose.Error.ValidationError,
        )
      })

      it('should reject when esrvcId id has whitespace', async () => {
        // Arrange
        const whitespaceEsrvcId = 'whitespace\tesrvcId'
        const paramsWithWhitespaceEsrvcId = merge({}, MOCK_FORM_PARAMS, {
          esrvcId: whitespaceEsrvcId,
        })

        // Act
        const invalidForm = new Form(paramsWithWhitespaceEsrvcId)

        // Assert
        await expect(invalidForm.save()).rejects.toThrow(
          'Form validation failed: esrvcId: e-service ID must not contain whitespace',
        )
      })
    })

    describe('Encrypted form schema', () => {
      const ENCRYPT_FORM_DEFAULTS = merge(
        { responseMode: 'encrypt' },
        FORM_DEFAULTS,
        ENCRYPT_MODE_SETTINGS_DEFAULTS,
        PAYMENTS_DEFAULTS,
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

      it('should create and save successfully if encrypt mode form has webhook', async () => {
        // Arrange + Act

        const MOCK_ENCRYPTED_FORM_PARAMS_WITH_WEBHOOK = {
          ...MOCK_ENCRYPTED_FORM_PARAMS,
          webhook: { url: 'https://www.form.gov.sg' },
        }

        const validForm = new EncryptedForm(
          MOCK_ENCRYPTED_FORM_PARAMS_WITH_WEBHOOK,
        )

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
          MOCK_ENCRYPTED_FORM_PARAMS_WITH_WEBHOOK,
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
        const permissionList = [{ email: 'newEmail2@example.com', write: true }]
        const formParams = merge({}, MOCK_ENCRYPTED_FORM_PARAMS, {
          permissionList,
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
        // Should become lowercased email.
        const expectedPermissionList = permissionList.map((permission) => {
          return {
            ...permission,
            email: permission.email.toLowerCase(),
          }
        })

        // Remove indeterministic id from actual permission list
        const actualPermissionList = (
          saved.toObject() as unknown as IEncryptedForm
        ).permissionList?.map((permission) => omit(permission, '_id'))
        expect(actualPermissionList).toEqual(expectedPermissionList)
      })

      it('should save new admin successfully but remove new admin from permissionList', async () => {
        // Arrange
        const newAdmin = await dbHandler.insertUser({
          agencyId: populatedAdmin.agency._id,
          mailDomain: MOCK_ADMIN_DOMAIN,
          mailName: 'newAdmin',
        })
        // Create new form with newAdmin as collaborator
        const validForm = await new Form({
          ...MOCK_ENCRYPTED_FORM_PARAMS,
          permissionList: [{ email: newAdmin.email, write: false }],
        }).save()

        // Act
        validForm.admin = newAdmin._id
        const updatedForm = (await validForm.save()).toObject()

        // Assert
        expect(updatedForm.admin).toEqual(newAdmin._id)
        // PermissionList should now be empty.
        expect(updatedForm.permissionList).toEqual([])
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
        await expect(invalidForm.save()).rejects.toThrow(
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
        await expect(invalidForm.save()).rejects.toThrow(
          'Admin for this form is not found.',
        )
      })

      it('should reject when form title is missing', async () => {
        // Arrange
        const paramsWithoutTitle = omit(MOCK_ENCRYPTED_FORM_PARAMS, 'title')

        // Act
        const invalidForm = new EncryptedForm(paramsWithoutTitle)

        // Assert
        await expect(invalidForm.save()).rejects.toThrow(
          mongoose.Error.ValidationError,
        )
      })

      it('should reject when form admin is missing', async () => {
        // Arrange
        const paramsWithoutAdmin = omit(MOCK_ENCRYPTED_FORM_PARAMS, 'admin')

        // Act
        const invalidForm = new EncryptedForm(paramsWithoutAdmin)

        // Assert
        await expect(invalidForm.save()).rejects.toThrow(
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
        await expect(invalidForm.save()).rejects.toThrow(
          mongoose.Error.ValidationError,
        )
      })

      it('should reject when form permissionList[].email is not a valid email', async () => {
        // Arrange
        // permissionList has an email domain not inside Agency collection
        const invalidPermissionList = [{ email: 'not an email', write: true }]
        const malformedParams = merge({}, MOCK_ENCRYPTED_FORM_PARAMS, {
          permissionList: invalidPermissionList,
        })

        // Act
        const invalidForm = new EncryptedForm(malformedParams)

        // Assert
        await expect(invalidForm.save()).rejects.toThrow(
          mongoose.Error.ValidationError,
        )
      })

      // Ensure that encrypted sgID forms can be created since they could not before
      it('should set authType to SGID when given authType is SGID', async () => {
        // Arrange
        const encryptFormParams = merge({}, MOCK_ENCRYPTED_FORM_PARAMS, {
          authType: FormAuthType.SGID,
        })

        // Act
        const sgidForm = await EncryptedForm.create(encryptFormParams)

        // Assert
        await expect(sgidForm.authType).toBe(FormAuthType.SGID)
      })

      // Ensure that encrypted MyInfo forms can be created since they could not before
      it('should set authType to MyInfo when given authType is MyInfo', async () => {
        // Arrange
        const encryptFormParams = merge({}, MOCK_ENCRYPTED_FORM_PARAMS, {
          authType: FormAuthType.MyInfo,
        })

        // Act
        const myInfoForm = await EncryptedForm.create(encryptFormParams)

        // Assert
        await expect(myInfoForm.authType).toBe(FormAuthType.MyInfo)
      })

      // Ensure that encrypted SGID MyInfo forms can be created since they could not before
      it('should set authType to SGID MyInfo when given authType is SGID MyInfo', async () => {
        // Arrange
        const encryptFormParams = merge({}, MOCK_ENCRYPTED_FORM_PARAMS, {
          authType: FormAuthType.SGID_MyInfo,
        })

        // Act
        const sgidMyInfoForm = await EncryptedForm.create(encryptFormParams)

        // Assert
        await expect(sgidMyInfoForm.authType).toBe(FormAuthType.SGID_MyInfo)
      })

      it('should save with default payments settings', async () => {
        // Arrange + Act
        const validForm = new Form(MOCK_ENCRYPTED_FORM_PARAMS)
        const saved = await validForm.save()

        // Assert
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

      it('should create and save successfully with valid payments_field settings', async () => {
        // Arrange
        const validFormParams = merge({}, MOCK_ENCRYPTED_FORM_PARAMS, {
          payments_field: {
            enabled: true,
            amount_cents: 50,
            payment_type: PaymentType.Products,
            description: 'some payment',
          },
        })

        // Act
        const validForm = new Form(validFormParams)
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
        const expectedObject = merge({}, ENCRYPT_FORM_DEFAULTS, validFormParams)
        expect(actualSavedObject).toEqual(expectedObject)
      })

      it('should reject when target account id has whitespace', async () => {
        // Arrange
        const invalidFormParams = merge({}, MOCK_ENCRYPTED_FORM_PARAMS, {
          payments_channel: {
            target_account_id: 'some Id',
          },
        })

        // Act
        const invalidForm = new Form(invalidFormParams)

        // Assert
        await expect(invalidForm.save()).rejects.toThrow(
          'target_account_id must not contain whitespace.',
        )
      })

      it('should reject when amount is negative', async () => {
        // Arrange
        const invalidFormParams = merge({}, MOCK_ENCRYPTED_FORM_PARAMS, {
          payments_field: {
            enabled: true,
            amount_cents: -50,
            description: 'some payment',
          },
        })

        // Act
        const invalidForm = new Form(invalidFormParams)

        // Assert
        await expect(invalidForm.save()).rejects.toThrow(
          'amount_cents must be a non-negative integer.',
        )
      })

      it('should reject when amount has decimals', async () => {
        // Arrange
        const invalidFormParams = merge({}, MOCK_ENCRYPTED_FORM_PARAMS, {
          payments_field: {
            enabled: true,
            amount_cents: 54.22,
            description: 'some payment',
          },
        })

        // Act
        const invalidForm = new Form(invalidFormParams)

        // Assert
        await expect(invalidForm.save()).rejects.toThrow(
          'amount_cents must be a non-negative integer.',
        )
      })

      it('should reject when payment type is missing', async () => {
        const invalidFormParams = merge({}, MOCK_ENCRYPTED_FORM_PARAMS, {
          payments_field: {
            enabled: true,
            amount_cents: 54.22,
            description: 'some payment',
            payment_type: null,
          },
        })

        // Act
        const invalidForm = new Form(invalidFormParams)

        // Assert
        await expect(invalidForm.save()).rejects.toThrow(
          '`null` is not a valid enum value for path `payments_field.payment_type`',
        )
      })

      it('should not get full list of whitelisted submitter id when getSettings', async () => {
        // Arrange
        const whitelistData = {
          whitelistedSubmitterIds: {
            isWhitelistEnabled: true,
            encryptedWhitelistedSubmitterIds: new ObjectId(),
          },
        }
        const MOCK_ENCRYPTED_FORM_PARAMS_WITH_WHITELIST = {
          ...MOCK_ENCRYPTED_FORM_PARAMS,
          ...whitelistData,
        }

        const validForm = new EncryptedForm(
          MOCK_ENCRYPTED_FORM_PARAMS_WITH_WHITELIST,
        )

        // Act
        const settings = validForm.getSettings() as StorageFormSettings

        // Assert
        expect(settings.whitelistedSubmitterIds).toEqual(
          pick(whitelistData.whitelistedSubmitterIds, 'isWhitelistEnabled'),
        )
      })
    })

    describe('Multirespondent form schema', () => {
      const MULTIRESPONDENT_FORM_DEFAULTS = merge(
        {
          responseMode: 'multirespondent',
          stepsToNotify: [],
          emails: [],
          stepOneEmailNotificationFieldId: '',
        },
        FORM_DEFAULTS,
      )

      it('should create and save successfully with a workflow', async () => {
        // Arrange
        const emailFieldObjectId = new ObjectId()
        const validFormObj = {
          ...MOCK_MULTIRESPONDENT_FORM_PARAMS,
          workflow: [
            {
              _id: new ObjectId(),
              workflow_type: WorkflowType.Static,
              emails: ['test@open.gov.sg'],
              edit: [new ObjectId(), emailFieldObjectId],
            },
            {
              _id: new ObjectId(),
              workflow_type: WorkflowType.Dynamic,
              field: emailFieldObjectId,
              edit: [new ObjectId()],
            },
          ],
        }

        const validForm = new MultirespondentForm(validFormObj)

        // Act
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
          MULTIRESPONDENT_FORM_DEFAULTS,
          validFormObj,
        )
        expect(actualSavedObject).toEqual(expectedObject)
      })

      it('should reject when a workflow contains missing keys', async () => {
        // Arrange
        const invalidFormObj = {
          ...MOCK_MULTIRESPONDENT_FORM_PARAMS,
          workflow: [
            {
              _id: new ObjectId(),
              workflow_type: WorkflowType.Dynamic,
              // Missing "field"
            },
          ],
        }

        const invalidForm = new MultirespondentForm(invalidFormObj)

        // Act + Assert
        await expect(invalidForm.save()).rejects.toThrow(
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

      it('should coerce comma-separated email string into an array of emails', async () => {
        // Arrange + Act
        const mockEmailsString = 'test1@b.com, test2@b.com'
        const mockEmailsArray = ['test1@b.com', 'test2@b.com']
        const formParams = merge({}, MOCK_EMAIL_FORM_PARAMS, {
          emails: mockEmailsString,
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
          'emails',
          'permissionList',
        ])
        const expectedObject = merge(
          {},
          omit(EMAIL_FORM_DEFAULTS, 'permissionList'),
          omit(MOCK_EMAIL_FORM_PARAMS, 'emails'),
        )
        expect(actualSavedObject).toEqual(expectedObject)

        const actualEmails = saved.toObject().emails
        expect(actualEmails).toEqual(mockEmailsArray)
      })

      it('should create and save successfully with valid permissionList emails', async () => {
        // Arrange
        // permissionList has email with valid domain
        // Write is also set to true
        const permissionList = [{ email: 'another1@example.com', write: true }]
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
          .permissionList?.map((permission: FormPermission) =>
            omit(permission, '_id'),
          )
        expect(actualPermissionList).toEqual(permissionList)
      })

      it('should save new admin successfully but remove new admin from permissionList', async () => {
        // Arrange
        const newAdmin = await dbHandler.insertUser({
          agencyId: populatedAdmin.agency._id,
          mailDomain: MOCK_ADMIN_DOMAIN,
          mailName: 'newAdmin',
        })
        // Create new form with newAdmin as collaborator
        const validForm = await new Form({
          ...MOCK_EMAIL_FORM_PARAMS,
          permissionList: [{ email: newAdmin.email, write: true }],
        }).save()

        // Act
        validForm.admin = newAdmin._id
        const updatedForm = (await validForm.save()).toObject()

        // Assert
        expect(updatedForm.admin).toEqual(newAdmin._id)
        // PermissionList should now be empty.
        expect(updatedForm.permissionList).toEqual([])
      })

      it('should reject when webhook url exists in email mode form', async () => {
        // Arrange
        const MOCK_EMAIL_FORM_PARAMS_WITH_WEBHOOK = {
          ...MOCK_EMAIL_FORM_PARAMS,
          webhook: { url: 'https://www.form.gov.sg' },
        }

        // Act
        const invalidForm = new EmailForm(MOCK_EMAIL_FORM_PARAMS_WITH_WEBHOOK)

        // Assert
        await expect(invalidForm.save()).rejects.toThrow(
          mongoose.Error.ValidationError,
        )
      })

      it('should reject when emails array is missing', async () => {
        // Arrange
        const paramsWithoutEmailsArray = omit(MOCK_EMAIL_FORM_PARAMS, 'emails')

        // Act
        const invalidForm = new EmailForm(paramsWithoutEmailsArray)

        // Assert
        await expect(invalidForm.save()).rejects.toThrow(
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
        await expect(invalidForm.save()).rejects.toThrow(
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
        await expect(invalidForm.save()).rejects.toThrow(
          'Admin for this form is not found.',
        )
      })

      it('should reject when form title is missing', async () => {
        // Arrange
        const paramsWithoutTitle = omit(MOCK_EMAIL_FORM_PARAMS, 'title')

        // Act
        const invalidForm = new EmailForm(paramsWithoutTitle)

        // Assert
        await expect(invalidForm.save()).rejects.toThrow(
          mongoose.Error.ValidationError,
        )
      })

      it('should reject when form admin is missing', async () => {
        // Arrange
        const paramsWithoutAdmin = omit(MOCK_EMAIL_FORM_PARAMS, 'admin')

        // Act
        const invalidForm = new EmailForm(paramsWithoutAdmin)

        // Assert
        await expect(invalidForm.save()).rejects.toThrow(
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
        await expect(invalidForm.save()).rejects.toThrow(
          mongoose.Error.ValidationError,
        )
      })

      it('should reject when form permissionList[].email is not a valid email', async () => {
        // Arrange
        // permissionList has an email domain not inside Agency collection
        const invalidPermissionList = [{ email: 'not an email', write: true }]
        const malformedParams = merge({}, MOCK_EMAIL_FORM_PARAMS, {
          permissionList: invalidPermissionList,
        })

        // Act
        const invalidForm = new EmailForm(malformedParams)

        // Assert
        await expect(invalidForm.save()).rejects.toThrow(
          mongoose.Error.ValidationError,
        )
      })
    })
  })

  describe('Statics', () => {
    describe('deactivateById', () => {
      it('should correctly deactivate form for valid ID', async () => {
        const formParams = merge({}, MOCK_EMAIL_FORM_PARAMS, {
          admin: populatedAdmin,
          status: FormStatus.Public,
        })
        const form = await Form.create(formParams)
        await Form.deactivateById(form._id)
        const updated = await Form.findById(form._id)
        expect(updated?.status).toBe('PRIVATE')
      })

      it('should not deactivate archived form', async () => {
        const formParams = merge({}, MOCK_EMAIL_FORM_PARAMS, {
          admin: populatedAdmin,
          status: FormStatus.Archived,
        })
        const form = await Form.create(formParams)
        await Form.deactivateById(form._id)
        const updated = await Form.findById(form._id)
        expect(updated?.status).toBe('ARCHIVED')
      })

      it('should return null for invalid form ID', async () => {
        const returned = await Form.deactivateById(String(new ObjectId()))
        expect(returned).toBeNull()
      })
    })

    describe('getFullFormById', () => {
      it('should return null when the formId is invalid', async () => {
        // Arrange
        const invalidFormId = new ObjectId()

        // Act
        const form = await Form.getFullFormById(String(invalidFormId))

        // Assert
        expect(form).toBeNull()
      })

      it('should return the populated email form when formId is valid', async () => {
        // Arrange
        const emailFormParams = merge({}, MOCK_EMAIL_FORM_PARAMS, {
          admin: populatedAdmin,
        })
        // Create a form
        const form = (
          await Form.create(emailFormParams)
        ).toObject<IFormDocument>()

        // Act
        const actualForm = (await Form.getFullFormById(form._id))?.toObject()

        // Assert
        // Form should be returned
        expect(actualForm).not.toBeNull()
        // Omit admin key since it is populated is not ObjectId anymore.
        expect(omit(actualForm, 'admin')).toEqual(omit(form, 'admin'))
        // Verify populated admin shape
        expect(actualForm?.admin).not.toBeNull()
        expect(actualForm?.admin.email).toEqual(populatedAdmin.email)
        // Remove indeterministic keys
        const expectedAgency = omit(populatedAdmin.agency.toObject(), [
          '_id',
          'created',
          'lastModified',
          '__v',
        ])
        expect(actualForm?.admin.agency).toEqual(
          expect.objectContaining(expectedAgency),
        )
      })

      it('should return the populated encrypt form when formId is valid', async () => {
        // Arrange
        const encryptFormParams = merge({}, MOCK_ENCRYPTED_FORM_PARAMS, {
          admin: populatedAdmin,
        })
        // Create a form
        const form = (
          await Form.create(encryptFormParams)
        ).toObject<IFormDocument>()

        // Act
        const actualForm = (await Form.getFullFormById(form._id))?.toObject()

        // Assert
        // Form should be returned
        expect(actualForm).not.toBeNull()
        // Omit admin key since it is populated is not ObjectId anymore.
        expect(omit(actualForm, 'admin')).toEqual(omit(form, 'admin'))
        // Verify populated admin shape
        expect(actualForm?.admin).not.toBeNull()
        expect(actualForm?.admin.email).toEqual(populatedAdmin.email)
        // Remove indeterministic keys
        const expectedAgency = omit(populatedAdmin.agency.toObject(), [
          '_id',
          'created',
          'lastModified',
          '__v',
        ])
        expect(actualForm?.admin.agency).toEqual(
          expect.objectContaining(expectedAgency),
        )
      })
    })

    describe('getOtpData', () => {
      it('should return null when formId does not exist', async () => {
        // Arrange
        const invalidFormId = new ObjectId()

        // Act
        const form = await Form.getOtpData(String(invalidFormId))

        // Assert
        expect(form).toBeNull()
      })

      it('should return otpData of an email form when formId is valid', async () => {
        // Arrange
        const form = await Form.create(MOCK_EMAIL_FORM_PARAMS)

        // Act
        const actualOtpData = await Form.getOtpData(form._id)

        // Assert
        // OtpData should be returned
        expect(actualOtpData).not.toBeNull()
        // Check shape
        const expectedOtpData = {
          form: form._id,
          formAdmin: {
            email: populatedAdmin.email,
            userId: populatedAdmin._id,
          },
        }
        expect(actualOtpData).toEqual(expectedOtpData)
      })

      it('should return otpData of an encrypt form when formId is valid', async () => {
        // Arrange
        const form = await Form.create(MOCK_ENCRYPTED_FORM_PARAMS)

        // Act
        const actualOtpData = await Form.getOtpData(form._id)

        // Assert
        // OtpData should be returned
        expect(actualOtpData).not.toBeNull()
        // Check shape
        const expectedOtpData = {
          form: form._id,
          formAdmin: {
            email: populatedAdmin.email,
            userId: populatedAdmin._id,
          },
        }
        expect(actualOtpData).toEqual(expectedOtpData)
      })
    })

    describe('getMetaByUserIdOrEmail', () => {
      it('should return empty array when user has no forms to view', async () => {
        // Arrange
        const randomUserId = new ObjectId()
        const invalidEmail = 'not-valid@example.com'

        // Act
        const actual = await Form.getMetaByUserIdOrEmail(
          randomUserId,
          invalidEmail,
        )

        // Assert
        expect(actual).toEqual([])
      })

      it('should return array of forms user is permitted to view', async () => {
        // Arrange
        // Add additional user.
        const differentUserId = new ObjectId()
        const diffPreload = await dbHandler.insertFormCollectionReqs({
          userId: differentUserId,
          mailName: 'something-else',
          mailDomain: MOCK_ADMIN_DOMAIN,
        })
        const diffPopulatedAdmin = merge(diffPreload.user, {
          agency: diffPreload.agency,
        })
        // Populate multiple forms with different permissions.
        // Is admin.
        const userOwnedForm = await Form.create(MOCK_EMAIL_FORM_PARAMS)
        // Has write permissions.
        const userWritePermissionForm = await Form.create({
          ...MOCK_ENCRYPTED_FORM_PARAMS,
          admin: diffPopulatedAdmin._id,
          permissionList: [{ email: populatedAdmin.email, write: true }],
        })
        // Has read permissions.
        const userReadPermissionForm = await Form.create({
          ...MOCK_ENCRYPTED_FORM_PARAMS,
          admin: diffPopulatedAdmin._id,
          // Only read permissions, no write permission.
          permissionList: [{ email: populatedAdmin.email, write: false }],
        })
        // Should not be fetched since form is archived.
        await Form.create({
          ...MOCK_ENCRYPTED_FORM_PARAMS,
          status: FormStatus.Archived,
        })
        // Should not be fetched (not collab or admin).
        await Form.create({
          ...MOCK_ENCRYPTED_FORM_PARAMS,
          admin: differentUserId,
          // currentUser does not have permissions.
        })

        // Act
        const actual = await Form.getMetaByUserIdOrEmail(
          populatedAdmin._id,
          populatedAdmin.email,
        )

        // Assert
        // Coerce into expected shape.
        const keysToPick = [
          '_id',
          'title',
          'lastModified',
          'status',
          'responseMode',
        ]
        const expected = orderBy(
          [
            // Should return form with admin themselves.
            merge(pick(userOwnedForm.toObject(), keysToPick), {
              admin: populatedAdmin.toObject(),
            }),
            // Should return form where admin has write permission.
            merge(pick(userWritePermissionForm.toObject(), keysToPick), {
              admin: diffPopulatedAdmin.toObject(),
            }),
            // Should return form where admin has read permission.
            merge(pick(userReadPermissionForm.toObject(), keysToPick), {
              admin: diffPopulatedAdmin.toObject(),
            }),
          ],
          'lastModified',
          'desc',
        )
        // Should return list containing only three forms:
        // (admin, read perms, write perms),
        // even though there are 5 forms in the collection.
        await expect(Form.countDocuments()).resolves.toEqual(5)
        expect(actual.length).toEqual(3)
        expect(actual).toEqual(expected)
      })
    })

    describe('createFormLogic', () => {
      const logicId = new ObjectId().toHexString()

      const mockExistingFormLogic = {
        form_logics: [
          {
            _id: logicId,
            logicType: LogicType.ShowFields,
          } as ILogicSchema,
        ],
      }

      const mockNewFormLogic = {
        logicType: LogicType.PreventSubmit,
      } as LogicDto

      it('should return form upon successful create logic if form_logic is currently empty', async () => {
        // arrange
        const formParams = merge({}, MOCK_EMAIL_FORM_PARAMS, {
          admin: populatedAdmin,
          status: FormStatus.Public,
          responseMode: FormResponseMode.Email,
          form_logics: [],
        })
        const form = await Form.create(formParams)

        // act
        const modifiedForm = await Form.createFormLogic(
          form._id,
          mockNewFormLogic,
        )

        // assert
        // Form should be returned
        expect(modifiedForm).not.toBeNull()

        // Form should have correct status, responsemode
        expect(modifiedForm?.responseMode).not.toBeNull()
        expect(modifiedForm?.responseMode).toEqual(FormResponseMode.Email)
        expect(modifiedForm?.status).not.toBeNull()
        expect(modifiedForm?.status).toEqual(FormStatus.Public)

        // Check that form logic has been added
        expect(modifiedForm?.form_logics).toBeDefined()
        expect(modifiedForm?.form_logics).toHaveLength(1)
        expect(modifiedForm?.form_logics[0].logicType).toEqual(
          LogicType.PreventSubmit,
        )
      })

      it('should allow the same logic to be added more than once and then return form if createLogic is called more than once', async () => {
        // arrange
        const formParams = merge({}, MOCK_EMAIL_FORM_PARAMS, {
          admin: populatedAdmin,
          status: FormStatus.Public,
          responseMode: FormResponseMode.Email,
          form_logics: [],
        })
        const form = await Form.create(formParams)

        // act
        await Form.createFormLogic(form._id, mockNewFormLogic)

        const modifiedFormRepeat = await Form.createFormLogic(
          form._id,
          mockNewFormLogic,
        )

        // assert
        // Form should be returned
        expect(modifiedFormRepeat).not.toBeNull()

        // Form should have correct status, responsemode
        expect(modifiedFormRepeat?.responseMode).not.toBeNull()
        expect(modifiedFormRepeat?.responseMode).toEqual(FormResponseMode.Email)
        expect(modifiedFormRepeat?.status).not.toBeNull()
        expect(modifiedFormRepeat?.status).toEqual(FormStatus.Public)

        // Check that form logic has been added
        expect(modifiedFormRepeat?.form_logics).toBeDefined()
        expect(modifiedFormRepeat?.form_logics).toHaveLength(2)
        expect(modifiedFormRepeat?.form_logics[0].logicType).toEqual(
          LogicType.PreventSubmit,
        )
        expect(modifiedFormRepeat?.form_logics[1].logicType).toEqual(
          LogicType.PreventSubmit,
        )
      })

      it('should return form upon successful create logic if form_logic has existing elements', async () => {
        // arrange
        const formParams = merge({}, MOCK_EMAIL_FORM_PARAMS, {
          admin: populatedAdmin,
          status: FormStatus.Public,
          responseMode: FormResponseMode.Email,
          ...mockExistingFormLogic,
        })
        const form = await Form.create(formParams)

        // act
        const modifiedForm = await Form.createFormLogic(
          form._id,
          mockNewFormLogic,
        )

        // assert
        // Form should be returned
        expect(modifiedForm).not.toBeNull()

        // Form should have correct status, responsemode
        expect(modifiedForm?.responseMode).not.toBeNull()
        expect(modifiedForm?.responseMode).toEqual(FormResponseMode.Email)
        expect(modifiedForm?.status).not.toBeNull()
        expect(modifiedForm?.status).toEqual(FormStatus.Public)

        // Check that form logic has been added
        expect(modifiedForm?.form_logics).toBeDefined()
        expect(modifiedForm?.form_logics).toHaveLength(2)
        expect(modifiedForm?.form_logics[0].logicType).toEqual(
          LogicType.ShowFields,
        )
        expect(modifiedForm?.form_logics[1].logicType).toEqual(
          LogicType.PreventSubmit,
        )
      })

      it('should return null if formId is invalid', async () => {
        // arrange

        const invalidFormId = new ObjectId().toHexString()

        // act
        const modifiedForm = await Form.createFormLogic(
          invalidFormId,
          mockNewFormLogic,
        )

        // assert
        // should return null
        expect(modifiedForm).toBeNull()
      })
    })

    describe('deleteFormLogic', () => {
      const logicId = new ObjectId().toHexString()
      const mockFormLogic = {
        form_logics: [
          {
            _id: logicId,
            id: logicId,
          } as ILogicSchema,
        ],
      }

      it('should return form upon successful delete', async () => {
        // arrange
        const formParams = merge({}, MOCK_EMAIL_FORM_PARAMS, {
          admin: populatedAdmin,
          status: FormStatus.Public,
          responseMode: FormResponseMode.Email,
          ...mockFormLogic,
        })
        const form = await Form.create(formParams)

        // act
        const modifiedForm = await Form.deleteFormLogic(form._id, logicId)

        // assert
        // Form should be returned
        expect(modifiedForm).not.toBeNull()

        // Form should have correct status, responsemode
        expect(modifiedForm?.responseMode).not.toBeNull()
        expect(modifiedForm?.responseMode).toEqual(FormResponseMode.Email)
        expect(modifiedForm?.status).not.toBeNull()
        expect(modifiedForm?.status).toEqual(FormStatus.Public)

        // Check that form logic has been deleted
        expect(modifiedForm?.form_logics).toBeEmpty()
      })

      it('should return form with remaining logic upon successful delete of one logic', async () => {
        // arrange

        const logicId2 = new ObjectId().toHexString()
        const mockFormLogicMultiple = {
          form_logics: [
            {
              _id: logicId,
              id: logicId,
            } as ILogicSchema,
            {
              _id: logicId2,
              id: logicId2,
            } as ILogicSchema,
          ],
        }

        const formParams = merge({}, MOCK_EMAIL_FORM_PARAMS, {
          admin: populatedAdmin,
          status: FormStatus.Public,
          responseMode: FormResponseMode.Email,
          ...mockFormLogicMultiple,
        })
        const form = await Form.create(formParams)

        // act
        const modifiedForm = await Form.deleteFormLogic(form._id, logicId)

        // assert
        // Form should be returned
        expect(modifiedForm).not.toBeNull()

        // Form should have correct status, responsemode
        expect(modifiedForm?.responseMode).not.toBeNull()
        expect(modifiedForm?.responseMode).toEqual(FormResponseMode.Email)
        expect(modifiedForm?.status).not.toBeNull()
        expect(modifiedForm?.status).toEqual(FormStatus.Public)

        // Check that correct form logic has been deleted
        expect(modifiedForm?.form_logics).toBeDefined()
        expect(modifiedForm?.form_logics).toHaveLength(1)
        const logic = modifiedForm?.form_logics || ['some logic']
        expect((logic[0] as unknown as any)['_id'].toString()).toEqual(logicId2)
      })

      it('should return null if formId is invalid', async () => {
        // arrange

        const invalidFormId = new ObjectId().toHexString()

        // act
        const modifiedForm = await Form.deleteFormLogic(invalidFormId, logicId)

        // assert
        // should return null
        expect(modifiedForm).toBeNull()
      })
    })

    describe('deleteFormFieldById', () => {
      it('should return form with deleted field', async () => {
        // Arrange
        const fieldToDelete = generateDefaultField(BasicField.Decimal)
        const formParams = merge({}, MOCK_EMAIL_FORM_PARAMS, {
          admin: populatedAdmin,
          form_fields: [fieldToDelete, generateDefaultField(BasicField.Mobile)],
        })
        const form = await Form.create(formParams)

        // Act
        const actual = await Form.deleteFormFieldById(
          form._id,
          fieldToDelete._id,
        )

        // Assert
        // Only non-deleted form field remains
        const expectedFormFields = [
          form.toObject<IFormDocument>().form_fields[1],
        ]
        const retrievedForm = await Form.findById(form._id).lean()
        // Check return shape.
        expect(actual?.toObject().form_fields).toEqual(expectedFormFields)
        // Check db state
        expect(retrievedForm).not.toBeNull()
        expect(retrievedForm?.form_fields).toEqual(expectedFormFields)
      })

      it('should return form unchanged when field id is invalid', async () => {
        const formParams = merge({}, MOCK_ENCRYPTED_FORM_PARAMS, {
          admin: MOCK_ADMIN_OBJ_ID,
          form_fields: [
            generateDefaultField(BasicField.Date),
            generateDefaultField(BasicField.Mobile),
          ],
        })
        const form = await Form.create(formParams)

        // Act
        const actual = await Form.deleteFormFieldById(
          form._id,
          new ObjectId().toHexString(),
        )

        // Assert
        expect(actual?.toObject()).toEqual({
          ...form.toObject(),
          lastModified: expect.any(Date),
        })
      })
    })

    describe('updateEndPageById', () => {
      it('should update end page and return updated form when successful', async () => {
        // Arrange
        const formParams = merge({}, MOCK_EMAIL_FORM_PARAMS, {
          admin: MOCK_ADMIN_OBJ_ID,
          endPage: {
            title: 'old title',
          },
        })
        const form = (await Form.create(formParams)).toObject<IFormDocument>()
        const updatedEndPage: FormEndPage = {
          title: 'some new title',
          paragraph: 'some description paragraph',
          buttonText: 'custom button text',
          paymentParagraph:
            'Your form has been submitted and payment has been made.',
          paymentTitle: 'Thank you, your payment has been made successfully.',
        }

        // Act
        const actual = await Form.updateEndPageById(form._id, updatedEndPage)

        // Assert
        // Should have defaults populated but also replace the endpage with the new params
        expect(actual?.toObject()).toEqual({
          ...form,
          lastModified: expect.any(Date),
          endPage: { ...updatedEndPage },
        })
      })

      it('should update end page with defaults when optional values are not provided', async () => {
        // Arrange
        const formParams = merge({}, MOCK_EMAIL_FORM_PARAMS, {
          admin: MOCK_ADMIN_OBJ_ID,
        })
        const form = (await Form.create(formParams)).toObject()
        const updatedEndPage: Partial<FormEndPage> = {
          paragraph: 'some description paragraph',
        }

        // Act
        // @ts-ignore
        const actual = await Form.updateEndPageById(form._id, updatedEndPage)

        // Assert
        // Should have defaults populated but also replace the endpage with the new params
        expect(actual?.toObject()).toEqual({
          ...form,
          lastModified: expect.any(Date),
          endPage: {
            ...updatedEndPage,
            // Defaults should be populated and returned
            buttonText: 'Submit another response',
            title: 'Thank you for filling out the form.',
            paymentParagraph:
              'Your form has been submitted and payment has been made.',
            paymentTitle: 'Thank you, your payment has been made successfully.',
          },
        })
      })

      it('should return null when formId given is not in the database', async () => {
        // Arrange
        await expect(Form.countDocuments()).resolves.toEqual(0)
        const updatedEndPage: FormEndPage = {
          buttonText: 'custom button text',
          title: 'some new title',
          paragraph: 'does not really matter',
          paymentParagraph:
            'Your form has been submitted and payment has been made.',
          paymentTitle: 'Thank you, your payment has been made successfully.',
        }

        // Act
        const actual = await Form.updateEndPageById(
          new ObjectId().toHexString(),
          updatedEndPage,
        )

        // Assert
        expect(actual).toEqual(null)
        await expect(Form.countDocuments()).resolves.toEqual(0)
      })
    })

    describe('updateFormLogic', () => {
      const logicId1 = new ObjectId().toHexString()
      const logicId2 = new ObjectId().toHexString()

      const mockExistingFormLogic = {
        form_logics: [
          {
            _id: logicId1,
            logicType: LogicType.ShowFields,
          } as ILogicSchema,
          {
            _id: logicId2,
            logicType: LogicType.ShowFields,
          } as ILogicSchema,
        ],
      }

      const mockUpdatedFormLogic = {
        _id: logicId1,
        logicType: LogicType.PreventSubmit,
      } as LogicDto

      it('should return form upon successful update of logic when there is one logic', async () => {
        // arrange
        const mockExistingFormLogicSingle = {
          form_logics: [
            {
              _id: logicId1,
              logicType: LogicType.ShowFields,
            } as ILogicSchema,
          ],
        }

        const formParams = merge({}, MOCK_EMAIL_FORM_PARAMS, {
          admin: populatedAdmin,
          status: FormStatus.Public,
          responseMode: FormResponseMode.Email,
          ...mockExistingFormLogicSingle,
        })
        const form = await Form.create(formParams)

        // act
        const modifiedForm = await Form.updateFormLogic(
          form._id,
          logicId1,
          mockUpdatedFormLogic,
        )

        // assert
        // Form should be returned
        expect(modifiedForm).not.toBeNull()

        // Form should have correct status, responsemode
        expect(modifiedForm?.responseMode).not.toBeNull()
        expect(modifiedForm?.responseMode).toEqual(FormResponseMode.Email)
        expect(modifiedForm?.status).not.toBeNull()
        expect(modifiedForm?.status).toEqual(FormStatus.Public)

        // Check that form logic has been updated
        expect(modifiedForm?.form_logics).toBeDefined()
        expect(modifiedForm?.form_logics).toHaveLength(1)
        expect(modifiedForm?.form_logics?.[0].logicType).toEqual(
          LogicType.PreventSubmit,
        )
      })

      it('should return form upon successful update of logic when there are more than one logics', async () => {
        // arrange
        const formParams = merge({}, MOCK_EMAIL_FORM_PARAMS, {
          admin: populatedAdmin,
          status: FormStatus.Public,
          responseMode: FormResponseMode.Email,
          ...mockExistingFormLogic,
        })
        const form = await Form.create(formParams)

        // act
        const modifiedForm = await Form.updateFormLogic(
          form._id,
          logicId1,
          mockUpdatedFormLogic,
        )

        // assert
        // Form should be returned
        expect(modifiedForm).not.toBeNull()

        // Form should have correct status, responsemode
        expect(modifiedForm?.responseMode).not.toBeNull()
        expect(modifiedForm?.responseMode).toEqual(FormResponseMode.Email)
        expect(modifiedForm?.status).not.toBeNull()
        expect(modifiedForm?.status).toEqual(FormStatus.Public)

        // Check that first form logic has been updated but second is unchanges
        expect(modifiedForm?.form_logics).toBeDefined()
        expect(modifiedForm?.form_logics).toHaveLength(2)
        expect(modifiedForm?.form_logics?.[0].logicType).toEqual(
          LogicType.PreventSubmit,
        )
        expect(modifiedForm?.form_logics?.[1].logicType).toEqual(
          LogicType.ShowFields,
        )
      })

      it('should return null if formId is invalid', async () => {
        // arrange
        const invalidFormId = new ObjectId().toHexString()

        // act
        const modifiedForm = await Form.updateFormLogic(
          invalidFormId,
          logicId1,
          mockUpdatedFormLogic,
        )

        // assert
        // should return null
        expect(modifiedForm).toBeNull()
      })

      it('should return unmodified form if logicId is invalid', async () => {
        // arrange
        const invalidLogicId = new ObjectId().toHexString()
        const mockExistingFormLogicSingle = {
          form_logics: [
            {
              _id: invalidLogicId,
              logicType: LogicType.ShowFields,
            } as ILogicSchema,
          ],
        }

        const formParams = merge({}, MOCK_EMAIL_FORM_PARAMS, {
          admin: populatedAdmin,
          status: FormStatus.Public,
          responseMode: FormResponseMode.Email,
          ...mockExistingFormLogicSingle,
        })
        const form = await Form.create(formParams)

        // act
        const modifiedForm = await Form.updateFormLogic(
          form._id,
          logicId1,
          mockUpdatedFormLogic,
        )

        // assert
        // Form should be returned
        expect(modifiedForm).not.toBeNull()

        // Form should have correct status, responsemode
        expect(modifiedForm?.responseMode).not.toBeNull()
        expect(modifiedForm?.responseMode).toEqual(FormResponseMode.Email)
        expect(modifiedForm?.status).not.toBeNull()
        expect(modifiedForm?.status).toEqual(FormStatus.Public)

        // Check that form logic has not been updated and there are no new form logics introduced
        expect(modifiedForm?.form_logics).toBeDefined()
        expect(modifiedForm?.form_logics).toHaveLength(1)
        expect(modifiedForm?.form_logics?.[0].logicType).toEqual(
          LogicType.ShowFields,
        )
      })
    })

    describe('updateStartPageById', () => {
      it('should update start page and return updated form when successful', async () => {
        // Arrange
        const formParams = merge({}, MOCK_EMAIL_FORM_PARAMS, {
          admin: MOCK_ADMIN_OBJ_ID,
          startPage: {
            title: 'old title',
          },
        })
        const form = (await Form.create(formParams)).toObject<IFormDocument>()
        const prevModifiedDate = form.lastModified
        const updatedStartPage: FormStartPage = {
          paragraph: 'some description paragraph',
          colorTheme: FormColorTheme.Blue,
          logo: {
            state: FormLogoState.Default,
          },
          // This is a huge form.
          estTimeTaken: 10000000,
        }

        // Act
        const actual = await Form.updateStartPageById(
          form._id,
          updatedStartPage,
        )

        // Assert
        // Should have defaults populated but also replace the startPage with the new params
        expect(actual?.toObject()).toEqual({
          ...form,
          lastModified: expect.any(Date),
          startPage: { ...form.startPage, ...updatedStartPage },
        })
        expect((actual?.lastModified ?? 0) > (prevModifiedDate ?? 0)).toBe(true)
      })

      it('should update start page with defaults when optional values are not provided', async () => {
        // Arrange
        const formParams = merge({}, MOCK_EMAIL_FORM_PARAMS, {
          admin: MOCK_ADMIN_OBJ_ID,
        })
        const form = (await Form.create(formParams)).toObject<IFormDocument>()
        const updatedStartPage: FormStartPage = {
          paragraph: 'some description paragraph',
          colorTheme: FormColorTheme.Blue,
          logo: {
            state: FormLogoState.Default,
          },
        }

        // Act
        const actual = await Form.updateStartPageById(
          form._id,
          updatedStartPage,
        )

        // Assert
        // Should have defaults populated but also replace the start page with the new params
        expect(actual?.toObject()).toEqual({
          ...form,
          lastModified: expect.any(Date),
          startPage: {
            ...updatedStartPage,
            // Defaults should be populated and returned
            colorTheme: 'blue',
            logo: {
              state: FormLogoState.Default,
            },
          },
        })
      })

      it('should return null when formId given is not in the database', async () => {
        // Arrange
        await expect(Form.countDocuments()).resolves.toEqual(0)
        const updatedStartPage: FormStartPage = {
          paragraph: 'does not really matter',
          colorTheme: FormColorTheme.Blue,
          logo: {
            state: FormLogoState.Default,
          },
        }

        // Act
        const actual = await Form.updateStartPageById(
          new ObjectId().toHexString(),
          updatedStartPage,
        )

        // Assert
        expect(actual).toEqual(null)
        await expect(Form.countDocuments()).resolves.toEqual(0)
      })
    })
  })

  describe('Methods', () => {
    // TODO(#102): Add tests for other form instance methods.
    let validForm: IFormSchema

    beforeEach(async () => {
      validForm = await Form.create({
        admin: populatedAdmin._id,
        responseMode: FormResponseMode.Email,
        title: 'mock email form',
        emails: [populatedAdmin.email],
      })
    })

    describe('archive', () => {
      it('should successfully set email form status to archived', async () => {
        // Arrange
        const form = await Form.create({
          admin: populatedAdmin._id,
          emails: [populatedAdmin.email],
          responseMode: FormResponseMode.Email,
          title: 'mock email form',
          status: FormStatus.Private,
        })
        expect(form).toBeDefined()

        // Act
        const actual = await form.archive()

        // Assert
        expect(actual.status).toEqual(FormStatus.Archived)
      })

      it('should successfully set encrypt form status to archived', async () => {
        // Arrange
        const form = await Form.create({
          admin: populatedAdmin._id,
          publicKey: 'any public key',
          responseMode: FormResponseMode.Encrypt,
          title: 'mock encrypt form',
          status: FormStatus.Public,
        })
        expect(form).toBeDefined()

        // Act
        const actual = await form.archive()

        // Assert
        expect(actual.status).toEqual(FormStatus.Archived)
      })

      it('should stay archived if original form is already archived', async () => {
        // Arrange
        const form = await Form.create({
          admin: populatedAdmin._id,
          publicKey: 'any public key',
          responseMode: FormResponseMode.Encrypt,
          title: 'mock encrypt form',
          status: FormStatus.Archived,
        })
        expect(form).toBeDefined()

        // Act
        const actual = await form.archive()

        // Assert
        expect(actual.status).toEqual(FormStatus.Archived)
      })

      it('should allow archive if form has valid webhook url', async () => {
        // Arrange
        const form = await Form.create({
          admin: populatedAdmin._id,
          publicKey: 'any public key',
          responseMode: FormResponseMode.Encrypt,
          title: 'mock encrypt form',
          status: FormStatus.Public,
          webhook: {
            url: 'https://www.form.gov.sg',
          },
        })
        expect(form).toBeDefined()

        // Act
        const actual = await form.archive()

        // Assert
        expect(actual.status).toEqual(FormStatus.Archived)
      })

      it('should prevent archive and return validation error if form has invalid webhook url', async () => {
        // Arrange
        const form = await Form.create({
          admin: populatedAdmin._id,
          publicKey: 'any public key',
          responseMode: FormResponseMode.Encrypt,
          title: 'mock encrypt form',
          status: FormStatus.Public,
          webhook: {
            url: 'https://www.form.gov.sg',
          },
        })

        if (form?.webhook?.url) {
          form.webhook.url = 'https://wwwww.form.gov.sg' // Inject invalid webhook url
        }

        expect(form).toBeDefined()
        // Act

        const actual = await form.archive().catch((err) => err)

        // Assert
        expect(actual).toBeInstanceOf(mongoose.Error.ValidationError)
        expect(actual.message).toEqual(
          expect.stringContaining('Error encountered during DNS resolution'),
        )
      })
    })

    describe('getDashboardView', () => {
      it('should return dashboard view of email mode form', async () => {
        // Arrange
        const form = await Form.create({
          admin: populatedAdmin._id,
          emails: [populatedAdmin.email],
          responseMode: FormResponseMode.Email,
          title: 'mock email form',
          status: FormStatus.Private,
        })
        expect(form).toBeDefined()
        // Add additional user.
        const diffPreload = await dbHandler.insertFormCollectionReqs({
          userId: new ObjectId(),
          mailName: 'another',
          mailDomain: MOCK_ADMIN_DOMAIN,
        })
        const diffPopulatedAdmin = merge(diffPreload.user, {
          agency: diffPreload.agency,
        }) as IPopulatedUser

        // Act
        const actual = form.getDashboardView(diffPopulatedAdmin)

        // Assert
        expect(actual).toEqual({
          _id: form._id,
          title: form.title,
          status: form.status,
          lastModified: form.lastModified,
          responseMode: form.responseMode,
          admin: diffPopulatedAdmin,
        })
      })

      it('should return dashboard view of encrypt mode form', async () => {
        // Arrange
        const form = await Form.create({
          admin: populatedAdmin._id,
          responseMode: FormResponseMode.Encrypt,
          publicKey: 'some public key',
          title: 'mock email form',
          status: FormStatus.Private,
        })
        expect(form).toBeDefined()
        // Add additional user.
        const diffPreload = await dbHandler.insertFormCollectionReqs({
          userId: new ObjectId(),
          mailName: 'another-thing',
          mailDomain: MOCK_ADMIN_DOMAIN,
        })
        const diffPopulatedAdmin = merge(diffPreload.user, {
          agency: diffPreload.agency,
        }) as IPopulatedUser

        // Act
        const actual = form.getDashboardView(diffPopulatedAdmin)

        // Assert
        expect(actual).toEqual({
          _id: form._id,
          title: form.title,
          status: form.status,
          lastModified: form.lastModified,
          responseMode: form.responseMode,
          admin: diffPopulatedAdmin,
        })
      })
    })

    describe('transferOwner', () => {
      it('should successfully transfer form ownership', async () => {
        // Arrange
        const newUser = await dbHandler.insertUser({
          agencyId: populatedAdmin.agency._id,
          mailName: 'newUser',
          mailDomain: MOCK_ADMIN_DOMAIN,
        })

        // Act
        const actual = await validForm.transferOwner(populatedAdmin, newUser)

        // Assert
        expect(actual).toBeDefined()
        // New admin should be new user.
        expect(actual.admin).toEqual(newUser._id)
        // Previous user should now be in permissionList with editor
        // permissions.
        expect(actual.toObject().permissionList).toEqual([
          { email: populatedAdmin.email, write: true, _id: expect.anything() },
        ])
      })
    })

    describe('getPublicView', () => {
      it('should correctly return public view of unpopulated email mode form', async () => {
        // Arrange
        const emailForm = await Form.create({
          admin: populatedAdmin._id,
          responseMode: FormResponseMode.Email,
          title: 'mock email form',
          emails: [populatedAdmin.email],
        })

        // Act
        const actual = emailForm.getPublicView()

        // Assert
        expect(actual).toEqual(pick(emailForm, EMAIL_PUBLIC_FORM_FIELDS))
        // Admin should be plain admin id since form is not populated.
        expect(actual.admin).toBeInstanceOf(ObjectId)
      })

      it('should correctly return public view of populated email mode form', async () => {
        // Arrange
        const emailForm = await Form.create({
          admin: populatedAdmin._id,
          responseMode: FormResponseMode.Email,
          title: 'mock email form',
          emails: [populatedAdmin.email],
        })
        const populatedEmailForm = await Form.getFullFormById(emailForm._id)
        expect(populatedEmailForm).not.toBeNull()

        // Act
        const actual = populatedEmailForm?.getPublicView()

        // Assert
        const expectedPublicAgencyView = populatedAdmin.agency.getPublicView()

        expect(JSON.stringify(actual)).toEqual(
          JSON.stringify({
            ...pick(populatedEmailForm, STORAGE_PUBLIC_FORM_FIELDS),
            // Admin should only contain public view of agency since agency is populated.
            admin: {
              agency: expectedPublicAgencyView,
            },
          }),
        )
      })

      it('should correctly return public view of unpopulated encrypt mode form', async () => {
        // Arrange
        const encryptForm = await Form.create({
          admin: populatedAdmin._id,
          responseMode: FormResponseMode.Encrypt,
          title: 'mock encrypt form',
          publicKey: 'mock public key',
        })

        // Act
        const actual = encryptForm.getPublicView()

        // Assert
        expect(actual).toEqual(pick(encryptForm, STORAGE_PUBLIC_FORM_FIELDS))
        // Admin should be plain admin id since form is not populated.
        expect(actual.admin).toBeInstanceOf(ObjectId)
      })

      it('should correctly return public view of populated encrypt mode form', async () => {
        // Arrange
        const encryptForm = await Form.create({
          admin: populatedAdmin._id,
          responseMode: FormResponseMode.Encrypt,
          title: 'mock encrypt form electric boogaloo',
          publicKey: 'some public key again',
        })
        const populatedEncryptForm = await Form.getFullFormById(encryptForm._id)
        expect(populatedEncryptForm).not.toBeNull()

        // Act
        const actual = populatedEncryptForm?.getPublicView()

        // Assert
        const expectedPublicAgencyView = populatedAdmin.agency.getPublicView()

        expect(JSON.stringify(actual)).toEqual(
          JSON.stringify({
            ...pick(populatedEncryptForm, STORAGE_PUBLIC_FORM_FIELDS),
            // Admin should only contain public view of agency since agency is populated.
            admin: {
              agency: expectedPublicAgencyView,
            },
          }),
        )
      })
    })

    describe('updateFormFieldById', () => {
      let form: IFormSchema

      beforeEach(async () => {
        form = await Form.create({
          admin: populatedAdmin._id,
          responseMode: FormResponseMode.Email,
          title: 'mock email form',
          emails: [populatedAdmin.email],
          form_fields: [
            generateDefaultField(BasicField.Checkbox),
            generateDefaultField(BasicField.HomeNo, {
              title: 'some mock title',
            }),
            generateDefaultField(BasicField.Email),
          ],
        })
      })

      it('should return updated form when successfully updating form field', async () => {
        // Arrange
        const originalFormFields = (
          form.form_fields as Types.DocumentArray<IFieldSchema>
        ).toObject()

        const newField = {
          ...originalFormFields[1],
          title: 'another mock title',
        }

        // Act
        const actual = await form.updateFormFieldById(newField._id, newField)

        // Assert
        expect(actual).not.toBeNull()
        // Current fields should not be touched
        expect(
          (actual?.form_fields as Types.DocumentArray<IFieldSchema>).toObject(),
        ).toEqual([originalFormFields[0], newField, originalFormFields[2]])
      })

      it('should return null if fieldId does not correspond to any field in the form', async () => {
        // Arrange
        const invalidFieldId = new ObjectId().toHexString()
        const someNewField = {
          description: 'this does not matter',
        } as FormFieldDto

        // Act
        const actual = await form.updateFormFieldById(
          invalidFieldId,
          someNewField,
        )

        // Assert
        expect(actual).toBeNull()
      })

      it('should return validation error if field type of new field does not match the field to update', async () => {
        // Arrange
        const originalFormFields = (
          form.form_fields as Types.DocumentArray<IFieldSchema>
        ).toObject()

        const newField: FormFieldDto = {
          ...originalFormFields[1],
          // Updating field type from HomeNo to Mobile.
          fieldType: BasicField.Mobile,
          title: 'another mock title',
        }

        // Act
        const actual = await form
          .updateFormFieldById(newField._id, newField)
          .catch((err) => err)

        // Assert
        expect(actual).toBeInstanceOf(mongoose.Error.ValidationError)
        expect(actual.message).toEqual(
          expect.stringContaining('Changing form field type is not allowed'),
        )
      })

      it('should return validation error if model validation fails whilst updating field', async () => {
        // Arrange
        const originalFormFields = (
          form.form_fields as Types.DocumentArray<IFieldSchema>
        ).toObject()

        const newField: FormFieldDto = {
          ...originalFormFields[2],
          title: 'another mock title',
          // Invalid value for email field.
          isVerifiable: 'some string, but this should be boolean',
        }

        // Act
        const actual = await form
          .updateFormFieldById(newField._id, newField)
          .catch((err) => err)

        // Assert
        expect(actual).toBeInstanceOf(mongoose.Error.ValidationError)
      })
    })

    describe('getDuplicateParams', () => {
      it('should duplicate all required fields', () => {
        // Arrange
        const MOCK_ALL_OVERRIDE_PARAMS = {
          admin: 'duplicated admin',
          title: 'duplicated title',
          responseMode: FormResponseMode.Email,
          emails: ['duplicated email'],
          submissionLimit: null,
        }
        const MOCK_ALL_FORM_PARAMS = {
          title: 'Test Form',
          admin: MOCK_ADMIN_OBJ_ID,
          authType: FormAuthType.SP,
          isSubmitterIdCollectionEnabled: true,
          isSingleSubmission: true,
          inactiveMessage: 'inactive_test',
          responseMode: FormResponseMode.Encrypt,
          submissionLimit: 1000,
        }
        const sourceForm = new Form(MOCK_ALL_FORM_PARAMS)

        // Act
        const duplicatedForm = sourceForm.getDuplicateParams(
          MOCK_ALL_OVERRIDE_PARAMS,
        )

        // Assert
        expect(duplicatedForm.title).toEqual(MOCK_ALL_OVERRIDE_PARAMS.title)
        expect(duplicatedForm.admin).toEqual(MOCK_ALL_OVERRIDE_PARAMS.admin)
        expect(duplicatedForm.responseMode).toEqual(
          MOCK_ALL_OVERRIDE_PARAMS.responseMode,
        )
        expect(duplicatedForm.emails).toEqual(MOCK_ALL_OVERRIDE_PARAMS.emails)
        expect(duplicatedForm.submissionLimit).toEqual(
          MOCK_ALL_OVERRIDE_PARAMS.submissionLimit,
        )
        expect(duplicatedForm.authType).toEqual(MOCK_ALL_FORM_PARAMS.authType)
        expect(duplicatedForm.isSubmitterIdCollectionEnabled).toEqual(
          MOCK_ALL_FORM_PARAMS.isSubmitterIdCollectionEnabled,
        )
        expect(duplicatedForm.inactiveMessage).toEqual(
          MOCK_ALL_FORM_PARAMS.inactiveMessage,
        )
        expect(duplicatedForm.isSingleSubmission).toEqual(
          MOCK_ALL_FORM_PARAMS.isSingleSubmission,
        )
      })

      it('should not duplicate unwanted fields', () => {
        const whitelistedSubmitterIdsParam: WhitelistedSubmitterIdsWithReferenceOid =
          {
            isWhitelistEnabled: true,
            encryptedWhitelistedSubmitterIds: 'some object id',
          }
        const MOCK_ALL_FORM_PARAMS = {
          whitelistedSubmitterIds: whitelistedSubmitterIdsParam,
        }
        const MOCK_ALL_OVERRIDE_PARAMS = {
          admin: 'duplicated admin',
          title: 'duplicated title',
          responseMode: FormResponseMode.Encrypt,
        }

        const sourceForm = new Form(MOCK_ALL_FORM_PARAMS)
        const duplicatedForm = sourceForm.getDuplicateParams(
          MOCK_ALL_OVERRIDE_PARAMS,
        )

        expect(duplicatedForm).not.toHaveProperty('whitelistedSubmitterIds')
      })
    })

    describe('insertFormField', () => {
      it('should return updated document with inserted form field', async () => {
        // Arrange
        const newField = generateDefaultField(BasicField.Checkbox)
        expect(validForm.form_fields).toBeEmpty()

        // Act
        const actual = await validForm.insertFormField(newField)

        // Assert
        const expectedField = {
          ...omit(newField, 'getQuestion'),
          _id: new ObjectId(newField._id),
        }
        // @ts-ignore
        expect(actual?.form_fields.toObject()).toEqual([expectedField])
      })

      it('should return updated document with inserted form field with positional argument', async () => {
        // Arrange
        const shouldBeSecondField = generateDefaultField(BasicField.Checkbox)
        const shouldBeFirstField = generateDefaultField(BasicField.Statement)
        const expectedSecondField = {
          ...omit(shouldBeSecondField, 'getQuestion'),
          _id: new ObjectId(shouldBeSecondField._id),
        }
        const expectedFirstField = {
          ...omit(shouldBeFirstField, 'getQuestion'),
          _id: new ObjectId(shouldBeFirstField._id),
        }
        const formWithField = await Form.create({
          admin: populatedAdmin._id,
          responseMode: FormResponseMode.Email,
          title: 'mock email form',
          emails: [populatedAdmin.email],
          form_fields: [shouldBeSecondField],
        })
        // @ts-ignore
        expect(formWithField.form_fields.toObject()).toEqual([
          expectedSecondField,
        ])

        // Act
        // Inserting new field but at the beginning.
        const actual = await formWithField.insertFormField(
          shouldBeFirstField,
          0,
        )

        // Assert
        // @ts-ignore
        expect(actual?.form_fields.toObject()).toEqual([
          // Should be expected order even though first field was inserted later.
          expectedFirstField,
          expectedSecondField,
        ])
      })

      it('should return validation error if model validation fails whilst creating field', async () => {
        // Arrange
        const newField = {
          ...generateDefaultField(BasicField.Email),
          // Invalid value for email field.
          // @ts-ignore
          isVerifiable: 'some string, but this should be boolean',
        } as FormField

        // Act
        const actual = await validForm
          .insertFormField(newField)
          .catch((err) => err)

        // Assert
        expect(actual).toBeInstanceOf(mongoose.Error.ValidationError)
      })
    })

    describe('duplicateFormFieldByIdAndIndex', () => {
      it('should return updated document with duplicated form field', async () => {
        // Arrange
        const fieldToDuplicate = generateDefaultField(BasicField.Checkbox)

        validForm.form_fields = [fieldToDuplicate]
        const fieldId = fieldToDuplicate._id

        // Act
        const actual = await validForm.duplicateFormFieldByIdAndIndex(
          fieldId,
          1,
        )
        // @ts-ignore
        const actualDuplicatedField = omit(actual?.form_fields.toObject()[1], [
          '_id',
          'globalId',
        ]) // do not compare _id and globalId

        // Assert
        const expectedOriginalField = {
          ...omit(fieldToDuplicate, ['getQuestion']),
          _id: new ObjectId(fieldToDuplicate._id),
        }
        const expectedDuplicatedField = omit(fieldToDuplicate, [
          '_id',
          'globalId',
          'getQuestion',
        ])

        // @ts-ignore
        expect(actual?.form_fields.toObject()[0]).toEqual(expectedOriginalField)
        expect(actualDuplicatedField).toEqual(expectedDuplicatedField)
      })

      it('should duplicate form field at the target index', async () => {
        // Arrange
        const fieldToDuplicate = generateDefaultField(BasicField.Checkbox)
        const dummyField = generateDefaultField(BasicField.Mobile)

        validForm.form_fields = [fieldToDuplicate, dummyField]
        const fieldId = fieldToDuplicate._id

        // Act
        const actual = await validForm.duplicateFormFieldByIdAndIndex(
          fieldId,
          1,
        )
        // actual duplicated field should be at index 1
        // @ts-ignore
        const actualDuplicatedField = omit(actual?.form_fields.toObject()[1], [
          '_id',
          'globalId',
        ]) // do not compare _id and globalId

        // Assert
        const expectedOriginalField = {
          ...omit(fieldToDuplicate, ['getQuestion']),
          _id: new ObjectId(fieldToDuplicate._id),
        }
        const expectedDuplicatedField = omit(fieldToDuplicate, [
          '_id',
          'globalId',
          'getQuestion',
        ])

        // @ts-ignore
        expect(actual?.form_fields.toObject()[0]).toEqual(expectedOriginalField)
        expect(actualDuplicatedField).toEqual(expectedDuplicatedField)
        // ensure nothing has been deleted from splice
        // @ts-ignore
        expect(actual?.form_fields.length).toEqual(3)
      })

      it('should return null if given fieldId is invalid', async () => {
        const updatedForm = await validForm.duplicateFormFieldByIdAndIndex(
          new ObjectId().toHexString(),
          0,
        )

        // Assert
        expect(updatedForm).toBeNull()
      })
    })

    describe('reorderFormFieldById', () => {
      let form: IFormSchema
      const FIELD_ID_TO_REORDER = new ObjectId().toHexString()

      beforeEach(async () => {
        form = await Form.create({
          admin: populatedAdmin._id,
          responseMode: FormResponseMode.Email,
          title: 'mock email form',
          emails: [populatedAdmin.email],
          form_fields: [
            generateDefaultField(BasicField.Checkbox),
            generateDefaultField(BasicField.HomeNo, {
              title: 'some mock title',
              _id: FIELD_ID_TO_REORDER,
            }),
            generateDefaultField(BasicField.Email),
          ],
        })
      })

      it('should return updated form with reordered fields successfully', async () => {
        // Act
        const originalFields =
          cloneDeep(
            (form.form_fields as Types.DocumentArray<IFieldSchema>).toObject(),
          ) ?? []
        const updatedForm = await form.reorderFormFieldById(
          FIELD_ID_TO_REORDER,
          0,
        )

        // Assert
        expect(updatedForm).not.toBeNull()
        expect(
          (
            updatedForm?.form_fields as Types.DocumentArray<IFieldSchema>
          ).toObject(),
        ).toEqual([
          // Should be rearranged to the 0th index position, and the previously
          // 0th index field should be pushed to 1st index.
          originalFields[1],
          originalFields[0],
          originalFields[2],
        ])
      })

      it('should return updated form with reordered field at end of fields array when newPosition > form_fields.length', async () => {
        // Act
        const originalFields =
          cloneDeep(
            (form.form_fields as Types.DocumentArray<IFieldSchema>).toObject(),
          ) ?? []
        const updatedForm = await form.reorderFormFieldById(
          FIELD_ID_TO_REORDER,
          // new position is vastly over array length.
          originalFields.length + 200,
        )

        // Assert
        expect(updatedForm).not.toBeNull()
        expect(
          (
            updatedForm?.form_fields as Types.DocumentArray<IFieldSchema>
          ).toObject(),
        ).toEqual([
          originalFields[0],
          originalFields[2],
          // Field to reorder (index 1) should now be at the end.
          originalFields[1],
        ])
      })

      it('should return null if given fieldId is invalid', async () => {
        const updatedForm = await form.reorderFormFieldById(
          new ObjectId().toHexString(),
          3,
        )

        // Assert
        expect(updatedForm).toBeNull()
      })
    })

    describe('updateFormCollaborators', () => {
      it('should return the form with an updated list of collaborators', async () => {
        // Arrange
        const newCollaborators = [
          {
            email: `fakeuser@${MOCK_ADMIN_DOMAIN}`,
            write: false,
          },
        ]

        // Act
        const actual = await validForm.updateFormCollaborators(newCollaborators)

        // Assert
        const actualPermissionsWithoutId = map(
          actual.permissionList,
          (collaborator) => pick(collaborator, ['email', 'write']),
        )
        expect(actualPermissionsWithoutId).toEqual(newCollaborators)
      })

      it('should return an error if validation fails', async () => {
        // Arrange
        const newCollaborators = [
          {
            email: 'string that is not an email',
            write: false,
          },
        ]

        // Act
        const actual = validForm.updateFormCollaborators(newCollaborators)

        // Assert
        await expect(actual).rejects.toBeInstanceOf(
          mongoose.Error.ValidationError,
        )
      })
    })
  })
})
