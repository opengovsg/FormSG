import { ObjectID } from 'bson'
import { cloneDeep, times } from 'lodash'
import mongoose from 'mongoose'

import getFormModel from 'src/app/models/form.server.model'
import getSubmissionModel from 'src/app/models/submission.server.model'
import {
  DatabaseError,
  MalformedParametersError,
} from 'src/app/modules/core/core.errors'
import * as SubmissionService from 'src/app/modules/submission/submission.service'
import { ProcessedFieldResponse } from 'src/app/modules/submission/submission.types'
import { createQueryWithDateParam } from 'src/app/utils/date'
import { FIELDS_TO_REJECT } from 'src/app/utils/field-validation/config'
import * as LogicUtil from 'src/shared/util/logic'
import {
  AttachmentSize,
  BasicField,
  FieldResponse,
  IEmailFormSchema,
  IEmailSubmissionSchema,
  IEncryptedFormSchema,
  IEncryptedSubmissionSchema,
  IFieldSchema,
  IPreventSubmitLogicSchema,
  ISingleAnswerResponse,
  LogicType,
  PossibleField,
  ResponseMode,
  SubmissionType,
} from 'src/types'

import dbHandler from 'tests/unit/backend/helpers/jest-db'

const Form = getFormModel(mongoose)
const Submission = getSubmissionModel(mongoose)

const MOCK_ADMIN_ID = new ObjectID()
const MOCK_FORM_PARAMS = {
  title: 'Test Form',
  admin: MOCK_ADMIN_ID,
}
const MOCK_ENCRYPTED_FORM_PARAMS = {
  ...MOCK_FORM_PARAMS,
  publicKey: 'mockPublicKey',
  responseMode: ResponseMode.Encrypt,
}
const MOCK_EMAIL_FORM_PARAMS = {
  ...MOCK_FORM_PARAMS,
  emails: ['test@example.com'],
  responseMode: ResponseMode.Email,
}

// Declare here so the array is static.
const FIELD_TYPES = Object.values(BasicField)
const TYPE_TO_INDEX_MAP = (() => {
  const map: { [field: string]: number } = {}
  FIELD_TYPES.forEach((type, index) => {
    map[type] = index
  })
  return map
})()

describe('submission.service', () => {
  let defaultEmailForm: IEmailFormSchema
  let defaultEmailResponses: FieldResponse[]
  let defaultEncryptForm: IEncryptedFormSchema
  let defaultEncryptResponses: FieldResponse[]

  beforeAll(async () => {
    await dbHandler.connect()
    await dbHandler.insertFormCollectionReqs({ userId: MOCK_ADMIN_ID })

    const defaultFormFields = generateDefaultFields()

    defaultEmailForm = (await createAndReturnFormWithFields(
      defaultFormFields,
      ResponseMode.Email,
    )) as IEmailFormSchema

    defaultEncryptForm = (await createAndReturnFormWithFields(
      defaultFormFields,
      ResponseMode.Encrypt,
    )) as IEncryptedFormSchema

    // Process default responses
    defaultEmailResponses = defaultEmailForm.form_fields!.map((field) => {
      return {
        _id: String(field._id),
        fieldType: field.fieldType,
        question: field.getQuestion(),
        answer: '',
      }
    })

    defaultEncryptResponses = defaultEncryptForm.form_fields!.map((field) => {
      return {
        _id: String(field._id),
        fieldType: field.fieldType,
        question: field.getQuestion(),
        answer: '',
      }
    })
  })
  afterAll(async () => await dbHandler.closeDatabase())

  describe('getProcessedResponses', () => {
    it('should return list of parsed responses for encrypted form submission successfully', async () => {
      // Arrange
      // Only mobile and email fields are parsed, since the other fields are
      // e2e encrypted from the browser.
      const mobileFieldIndex = TYPE_TO_INDEX_MAP[BasicField.Mobile]
      const emailFieldIndex = TYPE_TO_INDEX_MAP[BasicField.Email]

      // Add answers to both mobile and email fields
      const updatedResponses = cloneDeep(defaultEncryptResponses)
      const newEmailResponse: ISingleAnswerResponse = {
        ...updatedResponses[emailFieldIndex],
        answer: 'test@example.com',
      }
      const newMobileResponse: ISingleAnswerResponse = {
        ...updatedResponses[mobileFieldIndex],
        answer: '+6587654321',
      }
      updatedResponses[mobileFieldIndex] = newMobileResponse
      updatedResponses[emailFieldIndex] = newEmailResponse

      // Act
      const actual = SubmissionService.getProcessedResponses(
        defaultEncryptForm,
        updatedResponses,
      )

      // Assert
      const expectedParsed: ProcessedFieldResponse[] = [
        { ...newEmailResponse, isVisible: true },
        { ...newMobileResponse, isVisible: true },
      ]
      // Should only have email and mobile fields for encrypted forms.
      expect(actual).toEqual(expectedParsed)
    })

    it('should return list of parsed responses for email form submission successfully', async () => {
      // Arrange
      // Add answer to subset of field types
      const shortTextFieldIndex = TYPE_TO_INDEX_MAP[BasicField.ShortText]
      const decimalFieldIndex = TYPE_TO_INDEX_MAP[BasicField.Decimal]

      // Add answers to both selected fields.
      const updatedResponses = cloneDeep(defaultEmailResponses)
      const newShortTextResponse: ISingleAnswerResponse = {
        ...updatedResponses[shortTextFieldIndex],
        answer: 'the quick brown fox jumps over the lazy dog',
      }
      const newDecimalResponse: ISingleAnswerResponse = {
        ...updatedResponses[decimalFieldIndex],
        answer: '3.142',
      }
      updatedResponses[shortTextFieldIndex] = newShortTextResponse
      updatedResponses[decimalFieldIndex] = newDecimalResponse

      // Act
      const actual = SubmissionService.getProcessedResponses(
        defaultEmailForm,
        updatedResponses,
      )

      // Assert
      // Expect metadata to be injected to all responses (except fields to
      // reject).
      const expectedParsed: ProcessedFieldResponse[] = []
      updatedResponses.forEach((response, index) => {
        if (FIELDS_TO_REJECT.includes(response.fieldType)) {
          return
        }
        const expectedProcessed: ProcessedFieldResponse = {
          ...response,
          isVisible: true,
        }

        if (defaultEmailForm.form_fields![index].isVerifiable) {
          expectedProcessed.isUserVerified = true
        }
        expectedParsed.push(expectedProcessed)
      })

      expect(actual).toEqual(expectedParsed)
    })

    it('should throw error when email form has more fields than responses', async () => {
      // Arrange
      const extraFieldForm = cloneDeep(defaultEmailForm)
      const secondMobileField = cloneDeep(
        extraFieldForm.form_fields![TYPE_TO_INDEX_MAP[BasicField.Mobile]],
      )
      secondMobileField._id = new ObjectID()
      extraFieldForm.form_fields!.push(secondMobileField)

      // Act + Assert
      expect(() =>
        SubmissionService.getProcessedResponses(
          extraFieldForm,
          defaultEmailResponses,
        ),
      ).toThrowError('Some form fields are missing')
    })

    it('should throw error when encrypt form has more fields than responses', async () => {
      // Arrange
      const extraFieldForm = cloneDeep(defaultEncryptForm)
      const secondMobileField = cloneDeep(
        extraFieldForm.form_fields![TYPE_TO_INDEX_MAP[BasicField.Mobile]],
      )
      secondMobileField._id = new ObjectID()
      extraFieldForm.form_fields!.push(secondMobileField)

      // Act + Assert
      expect(() =>
        SubmissionService.getProcessedResponses(
          extraFieldForm,
          defaultEncryptResponses,
        ),
      ).toThrowError('Some form fields are missing')
    })

    it('should throw error when any responses are not valid for encrypted form submission', async () => {
      // Arrange
      // Only mobile and email fields are parsed, since the other fields are
      // e2e encrypted from the browser.
      const mobileFieldIndex = TYPE_TO_INDEX_MAP[BasicField.Mobile]

      const requireMobileEncryptForm = cloneDeep(defaultEncryptForm)
      requireMobileEncryptForm.form_fields![mobileFieldIndex].required = true

      // Act + Assert
      expect(() =>
        SubmissionService.getProcessedResponses(
          requireMobileEncryptForm,
          defaultEncryptResponses,
        ),
      ).toThrowError('Invalid answer submitted')
    })

    it('should throw error when any responses are not valid for email form submission', async () => {
      // Arrange
      // Set NRIC field in form as required.
      const nricFieldIndex = TYPE_TO_INDEX_MAP[BasicField.Nric]
      const requireNricEmailForm = cloneDeep(defaultEmailForm)
      requireNricEmailForm.form_fields![nricFieldIndex].required = true

      // Act + Assert
      expect(() =>
        SubmissionService.getProcessedResponses(
          requireNricEmailForm,
          defaultEmailResponses,
        ),
      ).toThrowError('Invalid answer submitted')
    })

    it('should throw error when encrypted form submission is prevented by logic', async () => {
      // Arrange
      // Mock logic util to return non-empty to check if error is thrown
      jest
        .spyOn(LogicUtil, 'getLogicUnitPreventingSubmit')
        .mockReturnValueOnce(({
          preventSubmitMessage: 'mock prevent submit',
          conditions: [],
          logicType: LogicType.PreventSubmit,
          _id: 'some id',
        } as unknown) as IPreventSubmitLogicSchema)

      // Act + Assert
      expect(() =>
        SubmissionService.getProcessedResponses(
          defaultEncryptForm,
          defaultEncryptResponses,
        ),
      ).toThrowError('Submission prevented by form logic')
    })

    it('should throw error when email form submission is prevented by logic', async () => {
      // Arrange
      // Mock logic util to return non-empty to check if error is thrown.
      const mockReturnLogicUnit = ({
        preventSubmitMessage: 'mock prevent submit',
        conditions: [],
        logicType: LogicType.PreventSubmit,
        _id: 'some id',
      } as unknown) as IPreventSubmitLogicSchema

      jest
        .spyOn(LogicUtil, 'getLogicUnitPreventingSubmit')
        .mockReturnValueOnce(mockReturnLogicUnit)

      // Act + Assert
      expect(() =>
        SubmissionService.getProcessedResponses(
          defaultEmailForm,
          defaultEmailResponses,
        ),
      ).toThrowError('Submission prevented by form logic')
    })
  })

  describe('getFormSubmissionsCount', () => {
    const countSpy = jest.spyOn(Submission, 'countDocuments')
    beforeEach(async () => {
      await dbHandler.clearCollection(Submission.collection.name)
    })
    afterEach(() => jest.clearAllMocks())

    it('should return correct all form counts when not providing date range', async () => {
      // Arrange
      // Insert 4 submissions
      const expectedSubmissionCount = 4
      const subPromises = times(expectedSubmissionCount, () =>
        Submission.create({
          submissionType: SubmissionType.Encrypt,
          form: defaultEncryptForm._id,
          encryptedContent: 'some random encrypted content',
          version: 1,
          responseHash: 'hash',
          responseSalt: 'salt',
        }),
      )
      await Promise.all(subPromises)

      // Act
      const actualResult = await SubmissionService.getFormSubmissionsCount(
        defaultEncryptForm._id,
      )

      // Assert
      expect(actualResult.isOk()).toEqual(true)
      expect(actualResult._unsafeUnwrap()).toEqual(expectedSubmissionCount)
    })

    it('should return correct form counts in range when date range is provided', async () => {
      // Arrange
      const expectedSubmissionCount = 4
      // Insert submissions created now.
      const subPromisesNow = times(2, () =>
        Submission.create<IEncryptedSubmissionSchema>({
          submissionType: SubmissionType.Encrypt,
          form: defaultEncryptForm._id,
          version: 1,
          encryptedContent: 'some random encrypted content',
        }),
      )
      // Insert submissions created in 1 Jan 2019.
      const subPromises2019 = times(expectedSubmissionCount, () =>
        Submission.create<IEmailSubmissionSchema>({
          form: defaultEmailForm._id,
          submissionType: SubmissionType.Email,
          responseHash: 'hash',
          responseSalt: 'salt',
          created: new Date('2019-01-01'),
          recipientEmails: [],
        }),
      )

      // Insert one more submission for defaultEmailForm in 2 January 2019.
      const subPromiseDayAfter = Submission.create<IEmailSubmissionSchema>({
        form: defaultEmailForm._id,
        submissionType: SubmissionType.Email,
        responseHash: 'hash',
        responseSalt: 'salt',
        created: new Date('2019-01-02'),
        recipientEmails: [],
      })

      // Execute creation in DB.
      await Promise.all([
        ...subPromises2019,
        ...subPromisesNow,
        subPromiseDayAfter,
      ])

      // Act
      const actualResult = await SubmissionService.getFormSubmissionsCount(
        defaultEmailForm._id,
        { startDate: '2019-01-01', endDate: '2019-01-01' },
      )

      // Assert
      expect(actualResult.isOk()).toEqual(true)
      // Should only return submissions on given day.
      expect(actualResult._unsafeUnwrap()).toEqual(expectedSubmissionCount)
    })

    it('should return 0 form count when no forms are in range', async () => {
      // Arrange
      // Insert submissions created 2019-12-12
      const subPromises = times(2, () =>
        Submission.create<IEncryptedSubmissionSchema>({
          submissionType: SubmissionType.Encrypt,
          form: defaultEncryptForm._id,
          version: 1,
          encryptedContent: 'some random encrypted content',
          created: new Date('2019-12-12'),
        }),
      )

      await Promise.all(subPromises)

      // Act
      const queryDateRange = { startDate: '2020-01-01', endDate: '2020-01-01' }
      const actualResult = await SubmissionService.getFormSubmissionsCount(
        defaultEncryptForm._id,
        queryDateRange,
      )

      // Assert
      expect(countSpy).toHaveBeenCalledWith({
        form: defaultEncryptForm._id,
        ...createQueryWithDateParam(
          queryDateRange.startDate,
          queryDateRange.endDate,
        ),
      })
      expect(actualResult.isOk()).toEqual(true)
      // No submissions expected to be returned..
      expect(actualResult._unsafeUnwrap()).toEqual(0)
    })

    it('should return MalformedParametersError when date range provided is malformed', async () => {
      // Act
      const actualResult = await SubmissionService.getFormSubmissionsCount(
        defaultEncryptForm._id,
        { startDate: 'some malformed start date', endDate: '2020-01-01' },
      )

      // Assert
      expect(countSpy).not.toHaveBeenCalled()
      expect(actualResult.isErr()).toEqual(true)
      expect(actualResult._unsafeUnwrapErr()).toBeInstanceOf(
        MalformedParametersError,
      )
    })

    it('should return DatabaseError when error occurs whilst querying database', async () => {
      // Arrange
      countSpy.mockImplementationOnce(
        () =>
          (({
            exec: () => Promise.reject(new Error('boom')),
          } as unknown) as mongoose.Query<any>),
      )

      // Act
      const actualResult = await SubmissionService.getFormSubmissionsCount(
        defaultEmailForm._id,
      )

      // Assert
      expect(countSpy).toHaveBeenCalledWith({
        form: defaultEmailForm._id,
      })
      expect(actualResult.isErr()).toEqual(true)
      expect(actualResult._unsafeUnwrapErr()).toBeInstanceOf(DatabaseError)
    })
  })
})

const createAndReturnFormWithFields = async (
  formFieldParamsList: Partial<PossibleField>[],
  formType: ResponseMode = ResponseMode.Email,
) => {
  let baseParams

  switch (formType) {
    case ResponseMode.Email:
      baseParams = MOCK_EMAIL_FORM_PARAMS
      break
    case ResponseMode.Encrypt:
      baseParams = MOCK_ENCRYPTED_FORM_PARAMS
  }

  const processedParamList = formFieldParamsList.map((params) => {
    // Insert required params if they do not exist.
    if (params.fieldType === 'attachment') {
      params = { attachmentSize: AttachmentSize.ThreeMb, ...params }
    }
    if (params.fieldType === 'image') {
      params = {
        url: 'http://example.com',
        fileMd5Hash: 'some hash',
        name: 'test image name',
        size: 'some size',
        ...params,
      }
    }

    return params
  })

  const formParam = {
    ...baseParams,
    form_fields: processedParamList as IFieldSchema[],
  }
  const form = await Form.create(formParam)

  return form
}

const generateDefaultFields = () => {
  // Get all field types
  const formFields: Partial<PossibleField>[] = FIELD_TYPES.map((fieldType) => {
    const fieldTitle = `test ${fieldType} field title`
    if (fieldType === BasicField.Table) {
      return {
        title: fieldTitle,
        minimumRows: 1,
        columns: [
          {
            title: 'Test Column Title 1',
            required: false,
            columnType: BasicField.ShortText,
          },
          {
            title: 'Test Column Title 2',
            required: false,
            columnType: BasicField.Dropdown,
          },
        ],
        fieldType,
      }
    }

    return {
      fieldType,
      title: fieldTitle,
      required: false,
    }
  })

  return formFields
}
