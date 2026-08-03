import { generateDefaultField } from '__tests__/unit/backend/helpers/generate-form-data'
import { ObjectId } from 'bson'
import { CLIENT_CHECKBOX_OTHERS_INPUT_VALUE } from 'formsg-shared/constants/form'
import {
  BasicField,
  ChildBirthRecordsResponseV3,
  FieldResponsesV3,
  FormFieldDto,
  FormWorkflowStepConditional,
  FormWorkflowStepDto,
  LongTextResponseV3,
  ShortTextResponseV3,
  SignatureVectorArray,
  SubmissionType,
  WorkflowStatus,
  WorkflowType,
} from 'formsg-shared/types'
import { omit } from 'lodash'
import moment from 'moment-timezone'
import { ok } from 'neverthrow'

import { convertToSignaturePngDataUri } from 'src/app/utils/convert-vector-array-to-png'
import {
  FormFieldSchema,
  IAddressCompoundFieldSchema,
  IAttachmentFieldSchema,
  ICheckboxFieldSchema,
  IEmailFieldSchema,
  INumberFieldSchema,
  IPopulatedForm,
  IShortTextFieldSchema,
  ISignatureFieldSchema,
  ITableFieldSchema,
  MultirespondentSubmissionData,
} from 'src/types'
import { ParsedClearFormFieldResponsesV4 } from 'src/types/api'

import * as fieldValidation from '../../../../utils/field-validation'
import { ValidateFieldErrorV4 } from '../../submission.errors'
import {
  buildMrfResponseJson,
  createMultirespondentSubmissionDto,
  createPublicMultirespondentSubmissionDto,
  extractRespondentCopyEmailDatas,
  getMrfVersion,
  getQuestionAnswerPairsForMultipleFields,
  MrfVersion,
  retrieveWorkflowStepEmailAddresses,
  validateMrfFieldResponses,
} from '../multirespondent-submission.utils'

describe('multirespondent-submission.utils', () => {
  const WORKFLOW_STEP_1: FormWorkflowStepDto = {
    _id: 'step_1_id',
    workflow_type: WorkflowType.Static,
    emails: ['example@example.com'],
    edit: [],
  }

  describe('extractRespondentCopyEmailDatas', () => {
    it('should return email data for only current step email fields with auto reply enabled and has answer', () => {
      // Arrange
      const inactiveEmailField = new ObjectId().toHexString()
      const activeEmailField = new ObjectId().toHexString()
      const activeEmailFieldNoAnswer = new ObjectId().toHexString()
      const activeEmailFieldNoAutoReply = new ObjectId().toHexString()
      const shortTextFieldId = new ObjectId().toHexString()
      const autoReplyOptionDefaults = {
        autoReplySubject: 'Test Subject',
        autoReplySender: 'Test Sender',
        autoReplyMessage: 'Test Body',
        includeFormSummary: true,
        hasAutoReply: true,
      }
      const formFields = [
        generateDefaultField(BasicField.Email, {
          _id: inactiveEmailField,
          autoReplyOptions: autoReplyOptionDefaults,
        }),
        generateDefaultField(BasicField.Email, {
          _id: activeEmailField,
          autoReplyOptions: autoReplyOptionDefaults,
        }),
        generateDefaultField(BasicField.Email, {
          _id: activeEmailFieldNoAnswer,
          autoReplyOptions: autoReplyOptionDefaults,
        }),
        generateDefaultField(BasicField.ShortText, {
          _id: shortTextFieldId,
          autoReplyOptions: autoReplyOptionDefaults,
        }),
        generateDefaultField(BasicField.Email, {
          _id: activeEmailFieldNoAutoReply,
          autoReplyOptions: {
            ...autoReplyOptionDefaults,
            hasAutoReply: false,
          },
        }),
      ]

      // Act
      const result = extractRespondentCopyEmailDatas({
        responses: {
          [inactiveEmailField]: {
            fieldType: BasicField.Email,
            answer: {
              value: 'notexpectedsinceinactive@email.com',
            },
          },
          [activeEmailField]: {
            fieldType: BasicField.Email,
            answer: {
              value: 'expected@email.com',
            },
          },
          [shortTextFieldId]: {
            fieldType: BasicField.ShortText,
            answer: 'short text answer',
          },
          [activeEmailFieldNoAutoReply]: {
            fieldType: BasicField.Email,
            answer: { value: 'notexpectedsincenoautoReply@email.com' },
          },
        },
        formFields,
        currentStepActiveFields: [
          activeEmailField,
          shortTextFieldId,
          activeEmailFieldNoAnswer,
          activeEmailFieldNoAutoReply,
        ],
      })

      // Assert
      expect(result).toEqual([
        {
          email: 'expected@email.com',
          subject: 'Test Subject',
          sender: 'Test Sender',
          body: 'Test Body',
          includeFormSummary: true,
        },
      ])
    })
  })

  describe('createPublicMultirespondentSubmissionDto', () => {
    const getAllTypesFormFieldsWithDropdownOptionsToRecipientsMap = () => {
      return Object.values(BasicField).map((fieldType) => {
        if (fieldType === BasicField.Dropdown) {
          return generateDefaultField(BasicField.Dropdown, {
            optionsToRecipientsMap: {
              'Option 1': ['recipient1@example.com', 'recipient2@example.com'],
              'Option 2': ['recipient3@example.com'],
            },
          })
        }
        return generateDefaultField(fieldType)
      })
    }

    it('should create a public multirespondent submission DTO sucessfully with workflow and form fields stripped', () => {
      // Arrange
      const formFields =
        getAllTypesFormFieldsWithDropdownOptionsToRecipientsMap()
      const dropdownField = formFields.find(
        (field) => field.fieldType === BasicField.Dropdown,
      )
      const emailField = formFields.find(
        (field) => field.fieldType === BasicField.Email,
      )
      const yesNoField = formFields.find(
        (field) => field.fieldType === BasicField.YesNo,
      )
      const shortTextField = formFields.find(
        (field) => field.fieldType === BasicField.ShortText,
      )
      const workflow = [
        {
          _id: new ObjectId(),
          workflow_type: WorkflowType.Static,
          emails: [], // Step 1 does not have emails, since anyone with form link is the step
          edit: [],
        },
        {
          _id: new ObjectId(),
          workflow_type: WorkflowType.Static,
          emails: ['test@open.gov.sg', 'test2@open.gov.sg'],
          edit: [emailField?.id],
          step_name: 'Static step where emails should be stripped',
        },
        {
          _id: new ObjectId(),
          workflow_type: WorkflowType.Dynamic,
          field: emailField?._id,
          edit: [dropdownField?._id],
        },
        {
          _id: new ObjectId(),
          workflow_type: WorkflowType.Conditional,
          conditional_field: dropdownField?._id,
          edit: [yesNoField?._id, shortTextField?._id],
          approval_field: yesNoField?._id,
        } as FormWorkflowStepConditional,
      ]
      const submittedSteps = [
        {
          isApproval: false,
          submittedAt: '2024-01-01T00:00:00.000Z',
        },
        {
          isApproval: false,
          submittedAt: '2024-01-02T00:00:00.000Z',
        },
      ]
      const createdDate = new Date()
      const submissionData = {
        submissionType: SubmissionType.Multirespondent,
        _id: new ObjectId(),
        created: createdDate,
        submissionPublicKey: 'some public key',
        encryptedSubmissionSecretKey: 'some encrypted secret key',
        encryptedContent: 'some encrypted content',
        workflow,
        workflowStep: 1,
        form_fields: formFields,
        form_logics: [],
        attachmentMetadata: {},
        version: 3,
        mrfVersion: 3,
        submittedSteps,
      } as unknown as MultirespondentSubmissionData
      const attachmentPresignedUrls = {
        someSubmissionId: 'some presigned url',
      }

      // Act
      const actual = createPublicMultirespondentSubmissionDto(
        submissionData,
        attachmentPresignedUrls,
      )

      // Assert
      expect(actual).toEqual({
        refNo: submissionData._id,
        submissionTime: moment(submissionData.created)
          .tz('Asia/Singapore')
          .format('ddd, D MMM YYYY, hh:mm:ss A'),
        submissionPublicKey: submissionData.submissionPublicKey,
        encryptedContent: submissionData.encryptedContent,
        encryptedSubmissionSecretKey:
          submissionData.encryptedSubmissionSecretKey,
        attachmentMetadata: attachmentPresignedUrls,
        submissionType: SubmissionType.Multirespondent,
        workflow: submissionData.workflow.map((step) =>
          step.workflow_type === WorkflowType.Static
            ? omit(step, 'emails')
            : step,
        ),
        form_fields: submissionData.form_fields.map((field) =>
          field.fieldType === BasicField.Dropdown
            ? omit(field, 'optionsToRecipientsMap')
            : field,
        ),
        form_logics: submissionData.form_logics,
        version: submissionData.version,
        workflowStep: submissionData.workflowStep,
        mrfVersion: submissionData.mrfVersion,
        mrfMeta: {
          workflowCurrentStepNumber: submittedSteps.length,
          workflowNumTotalSteps: 4,
          workflowStatus: WorkflowStatus.PENDING,
          lastSubmittedAt:
            submittedSteps[submittedSteps.length - 1].submittedAt,
          hasNextStepRecipientEmails: false,
        },
      })

      const dropdownFf = actual.form_fields.find(
        (field) => field.fieldType === BasicField.Dropdown,
      )
      expect(dropdownFf).toBeDefined()
      expect(dropdownFf).not.toContainKey('optionsToRecipientsMap')

      const staticWorkflowStep = actual.workflow.find(
        (step) => step.workflow_type === WorkflowType.Static,
      )
      expect(staticWorkflowStep).toBeDefined()
      expect(staticWorkflowStep).not.toContainKey('emails')
    })

    it('should never expose encryptedStepToken in the public DTO', () => {
      // Arrange
      const submissionData = {
        submissionType: SubmissionType.Multirespondent,
        _id: new ObjectId(),
        created: new Date(),
        submissionPublicKey: 'some public key',
        encryptedSubmissionSecretKey: 'some encrypted secret key',
        encryptedContent: 'some encrypted content',
        encryptedStepToken: 'some encrypted step token',
        workflow: [],
        workflowStep: 1,
        form_fields: [],
        form_logics: [],
        attachmentMetadata: {},
        version: 3,
        mrfVersion: 3,
      } as unknown as MultirespondentSubmissionData

      // Act
      const actual = createPublicMultirespondentSubmissionDto(
        submissionData,
        {},
      )

      // Assert
      expect(actual.encryptedStepToken).toBeUndefined()
      expect(JSON.stringify(actual)).not.toContain('encryptedStepToken')
    })
  })

  describe('createMultirespondentSubmissionDto', () => {
    it('should create an encrypted submission DTO sucessfully', () => {
      // Arrange
      const submittedSteps = [
        {
          isApproval: false,
          submittedAt: '2024-01-01T00:00:00.000Z',
        },
      ]
      const createdDate = new Date()
      const submissionData = {
        submissionType: SubmissionType.Multirespondent,
        _id: new ObjectId(),
        created: createdDate,
        submissionPublicKey: 'some public key',
        encryptedSubmissionSecretKey: 'some encrypted secret key',
        encryptedContent: 'some encrypted content',
        workflow: [WORKFLOW_STEP_1],
        workflowStep: 0,
        form_fields: [],
        form_logics: [],
        attachmentMetadata: {},
        version: 3,
        mrfVersion: 3,
        submittedSteps,
      } as unknown as MultirespondentSubmissionData
      const attachmentPresignedUrls = {
        someSubmissionId: 'some presigned url',
      }

      // Act
      const actual = createMultirespondentSubmissionDto(
        submissionData,
        attachmentPresignedUrls,
      )

      // Assert
      expect(actual).toEqual({
        refNo: submissionData._id,
        submissionTime: moment(submissionData.created)
          .tz('Asia/Singapore')
          .format('ddd, D MMM YYYY, hh:mm:ss A'),
        submissionPublicKey: submissionData.submissionPublicKey,
        encryptedContent: submissionData.encryptedContent,
        encryptedSubmissionSecretKey:
          submissionData.encryptedSubmissionSecretKey,
        attachmentMetadata: attachmentPresignedUrls,
        submissionType: SubmissionType.Multirespondent,
        workflow: submissionData.workflow,
        form_fields: submissionData.form_fields,
        form_logics: submissionData.form_logics,
        version: submissionData.version,
        workflowStep: submissionData.workflowStep,
        mrfVersion: submissionData.mrfVersion,
        mrfMeta: {
          workflowCurrentStepNumber: 1,
          workflowNumTotalSteps: 1,
          workflowStatus: WorkflowStatus.COMPLETED,
          lastSubmittedAt:
            submittedSteps[submittedSteps.length - 1].submittedAt,
          hasNextStepRecipientEmails: false,
        },
      })
    })
  })

  describe('validateMrfFieldResponses', () => {
    afterEach(() => {
      jest.restoreAllMocks()
    })

    it('should return error when children field is submitted', () => {
      // Arrange
      const mockFormId = 'mockFormId'
      const field1Id = 'field1'
      const mockVisibleFieldIds = new Set([field1Id])
      const mockFormFields = [
        generateDefaultField(BasicField.ShortText, {
          _id: field1Id,
        }),
      ]
      const mockResponses = {
        [field1Id]: {
          fieldType: BasicField.Children,
          answer: {
            child: [],
            childFields: [],
          },
        } as ChildBirthRecordsResponseV3,
      }

      // Act
      const result = validateMrfFieldResponses({
        formId: mockFormId,
        visibleFieldIds: mockVisibleFieldIds,
        formFields: mockFormFields as FormFieldDto[],
        responses: mockResponses,
      })

      // Assert
      expect(result.isErr()).toBe(true)
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ValidateFieldErrorV4)
      expect(result._unsafeUnwrapErr().message).toBe(
        'Children field type is not supported for MRF submisisons',
      )
    })

    it('should invoke validateFieldV4 with isVisible true when non-hidden and supported field type is submitted', () => {
      // Arrange
      const validateFieldV4Mock = jest
        .spyOn(fieldValidation, 'validateFieldV4')
        .mockReturnValue(ok(true))
      const mockFormId = 'mockFormId'
      const field1Id = 'field1'
      const mockVisibleFieldIds = new Set([field1Id])
      const mockFormFields = [
        generateDefaultField(BasicField.ShortText, { _id: field1Id }),
      ]
      const mockResponses = {
        [field1Id]: {
          fieldType: BasicField.ShortText,
          answer: 'Some text',
        } as ShortTextResponseV3,
      }

      // Act
      validateMrfFieldResponses({
        formId: mockFormId,
        visibleFieldIds: mockVisibleFieldIds,
        formFields: mockFormFields as FormFieldDto[],
        responses: mockResponses,
      })

      // Assert
      expect(validateFieldV4Mock).toHaveBeenCalledWith({
        formId: mockFormId,
        formField: mockFormFields[0],
        response: mockResponses.field1,
        isVisible: true,
      })

      expect(validateFieldV4Mock).toHaveBeenCalledOnce()
    })

    it('should invoke validateFieldV4 with isVisible false when hidden and supported field type is submitted', () => {
      // Arrange
      const validateFieldV4Mock = jest
        .spyOn(fieldValidation, 'validateFieldV4')
        .mockReturnValue(ok(true))
      const mockFormId = 'mockFormId'
      const field1Id = 'field1'
      const field2Id = 'field2'
      const mockVisibleFieldIds = new Set([field2Id])
      const mockFormFields = [
        generateDefaultField(BasicField.ShortText, { _id: field1Id }),
        generateDefaultField(BasicField.LongText, { _id: field2Id }),
      ]
      const mockResponses = {
        [field1Id]: {
          fieldType: BasicField.ShortText,
          answer: 'Some text',
        } as ShortTextResponseV3,
        [field2Id]: {
          fieldType: BasicField.LongText,
          answer: 'Some long text',
        } as LongTextResponseV3,
      }

      // Act
      validateMrfFieldResponses({
        formId: mockFormId,
        visibleFieldIds: mockVisibleFieldIds,
        formFields: mockFormFields as FormFieldDto[],
        responses: mockResponses,
      })

      // Assert
      expect(validateFieldV4Mock).toHaveBeenCalledWith({
        formId: mockFormId,
        formField: mockFormFields[0],
        response: mockResponses.field1,
        isVisible: false,
      })

      expect(validateFieldV4Mock).toHaveBeenCalledWith({
        formId: mockFormId,
        formField: mockFormFields[1],
        response: mockResponses.field2,
        isVisible: true,
      })

      expect(validateFieldV4Mock).toHaveBeenCalledTimes(2)
    })

    it('should thread previousResponses through to validateFieldV4 as prevResponse', () => {
      // Regression test: the V4 migration dropped previousResponses, causing
      // carried-forward verifiable fields (verified in an earlier MRF step,
      // whose OTP signature has since expired) to be re-authenticated and
      // rejected. Threading prevResponse lets checkIsResponseChangedV4 skip
      // fields the current respondent did not change.
      const validateFieldV4Mock = jest
        .spyOn(fieldValidation, 'validateFieldV4')
        .mockReturnValue(ok(true))
      const mockFormId = 'mockFormId'
      const emailFieldId = 'emailField'
      const mockVisibleFieldIds = new Set([emailFieldId])
      const mockFormFields = [
        generateDefaultField(BasicField.Email, { _id: emailFieldId }),
      ]
      const carriedForwardAnswer = {
        value: 'alice@example.com',
        signature: 'stale-but-unchanged-signature',
      }
      const mockResponses = {
        [emailFieldId]: {
          fieldType: BasicField.Email,
          question: 'Email',
          answer: carriedForwardAnswer,
          provenance: {},
        },
      } as unknown as ParsedClearFormFieldResponsesV4
      const mockPreviousResponses = {
        [emailFieldId]: {
          fieldType: BasicField.Email,
          question: 'Email',
          answer: carriedForwardAnswer,
          provenance: {},
        },
      } as unknown as ParsedClearFormFieldResponsesV4

      // Act
      validateMrfFieldResponses({
        formId: mockFormId,
        visibleFieldIds: mockVisibleFieldIds,
        formFields: mockFormFields as FormFieldDto[],
        responses: mockResponses,
        previousResponses: mockPreviousResponses,
      })

      // Assert
      expect(validateFieldV4Mock).toHaveBeenCalledWith({
        formId: mockFormId,
        formField: mockFormFields[0],
        response: mockResponses[emailFieldId],
        prevResponse: mockPreviousResponses[emailFieldId],
        isVisible: true,
      })
    })
  })

  describe('getQuestionTitleAnswerString', () => {
    it('should extract question-answer pairs for basic field types', () => {
      const formFields: FormFieldSchema[] = [
        {
          _id: '1',
          title: 'Short Text',
          fieldType: BasicField.ShortText,
        } as IShortTextFieldSchema,
        {
          _id: '2',
          title: 'Number',
          fieldType: BasicField.Number,
        } as INumberFieldSchema,
        {
          _id: '3',
          title: 'Email',
          fieldType: BasicField.Email,
        } as IEmailFieldSchema,
      ]
      const responses = {
        '1': {
          fieldType: BasicField.ShortText,
          answer: { value: 'Test answer' },
          question: 'Short Text',
          provenance: {},
        },
        '2': {
          fieldType: BasicField.Number,
          answer: { value: '42' },
          question: 'Number',
          provenance: {},
        },
        '3': {
          fieldType: BasicField.Email,
          answer: { value: 'test@example.com' },
          question: 'Email',
          provenance: {},
        },
      } as any

      const result = getQuestionAnswerPairsForMultipleFields({
        formFields,
        responses,
      })

      expect(result).toEqual([
        {
          question: 'Short Text',
          answer: 'Test answer',
          fieldType: BasicField.ShortText,
        },
        { question: 'Number', answer: '42', fieldType: BasicField.Number },
        {
          question: 'Email',
          answer: 'test@example.com',
          fieldType: BasicField.Email,
        },
      ])
    })

    it('should handle attachment fields correctly', () => {
      const formFields: FormFieldSchema[] = [
        {
          _id: '1',
          title: 'File Upload',
          fieldType: BasicField.Attachment,
        } as IAttachmentFieldSchema,
      ]
      const responses = {
        '1': {
          fieldType: BasicField.Attachment,
          answer: { value: 'file.pdf', hasBeenScanned: true },
          question: 'File Upload',
          provenance: {},
        },
      } as any

      const result = getQuestionAnswerPairsForMultipleFields({
        formFields,
        responses,
      })

      expect(result).toEqual([
        {
          question: '[Attachment] File Upload',
          answer: 'file.pdf',
          fieldType: BasicField.Attachment,
        },
      ])
    })

    it('should handle table fields correctly', () => {
      const formFields: FormFieldSchema[] = [
        {
          _id: '1',
          title: 'Table of Name and Age',
          fieldType: BasicField.Table,
          columns: [
            { _id: 'col1', title: 'Name' },
            { _id: 'col2', title: 'Age' },
          ],
        } as ITableFieldSchema,
        {
          _id: '2',
          title: 'Table of Hobbies',
          fieldType: BasicField.Table,
          columns: [
            { _id: 'col3', title: 'Hobby' },
            { _id: 'col4', title: 'Years' },
          ],
        } as ITableFieldSchema,
      ]
      const responses = {
        '1': {
          fieldType: BasicField.Table,
          answer: {
            row0: { rowNum: 0, value: { col1: 'Alice', col2: '30' } },
            row1: { rowNum: 1, value: { col1: 'Bob', col2: '25' } },
          },
          question: 'Table of Name and Age',
          provenance: {},
        },
        '2': {
          fieldType: BasicField.Table,
          answer: {
            row0: { rowNum: 0, value: { col3: 'Swimming', col4: '5' } },
            row1: { rowNum: 1, value: { col3: 'Reading', col4: '10' } },
          },
          question: 'Table of Hobbies',
          provenance: {},
        },
      } as any

      const result = getQuestionAnswerPairsForMultipleFields({
        formFields,
        responses,
      })

      expect(result).toEqual([
        {
          question: '[Table] Table of Name and Age (Name; Age)',
          answer: 'Alice; 30',
          fieldType: BasicField.Table,
        },
        {
          question: '[Table] Table of Name and Age (Name; Age)',
          answer: 'Bob; 25',
          fieldType: BasicField.Table,
        },
        {
          question: '[Table] Table of Hobbies (Hobby; Years)',
          answer: 'Swimming; 5',
          fieldType: BasicField.Table,
        },
        {
          question: '[Table] Table of Hobbies (Hobby; Years)',
          answer: 'Reading; 10',
          fieldType: BasicField.Table,
        },
      ])
    })

    it('should handle checkbox fields correctly', () => {
      const formFields: FormFieldSchema[] = [
        {
          _id: '1',
          title: 'Checkbox',
          fieldType: BasicField.Checkbox,
        } as ICheckboxFieldSchema,
      ]
      const responses = {
        '1': {
          fieldType: BasicField.Checkbox,
          answer: {
            value: ['Option 1', 'Option 2', CLIENT_CHECKBOX_OTHERS_INPUT_VALUE],
            othersInput: 'Custom Option',
          },
          question: 'Checkbox',
          provenance: {},
        },
      } as any

      const result = getQuestionAnswerPairsForMultipleFields({
        formFields,
        responses,
      })

      expect(result).toEqual([
        {
          question: 'Checkbox',
          answer: 'Option 1, Option 2, Custom Option',
          fieldType: BasicField.Checkbox,
        },
      ])
    })

    it('should handle address fields correctly', () => {
      const formFields: FormFieldSchema[] = [
        {
          _id: '1',
          title: 'Address',
          fieldType: BasicField.Address,
        } as IAddressCompoundFieldSchema,
      ]
      const responses = {
        '1': {
          fieldType: BasicField.Address,
          answer: {
            postalCode: { value: '650161' },
            blockNumber: { value: '161' },
            streetName: { value: 'BUKIT BATOK STREET 11' },
            buildingName: { value: '' },
            levelNumber: { value: '1' },
            unitNumber: { value: '1' },
          },
          question: 'Address',
          provenance: {},
        },
      } as any

      const result = getQuestionAnswerPairsForMultipleFields({
        formFields,
        responses,
      })

      expect(result).toEqual([
        {
          question: 'Address',
          answer: '161, BUKIT BATOK STREET 11, #1-1, SINGAPORE 650161',
          fieldType: BasicField.Address,
        },
      ])
    })

    it('should handle signature fields correctly when includeSignatureDataPngUri is true', () => {
      const formFields: FormFieldSchema[] = [
        {
          _id: '1',
          title: 'Signature',
          fieldType: BasicField.Signature,
        } as ISignatureFieldSchema,
      ]

      const MOCK_SIGNATURE_VALUE: SignatureVectorArray = [
        [[10, 20, 0.5]],
        [[40, 40, 0.5]],
      ]

      const responses = {
        '1': {
          fieldType: BasicField.Signature,
          answer: {
            type: 'draw',
            value: MOCK_SIGNATURE_VALUE,
          },
          question: 'Signature',
          provenance: {},
        },
      } as any

      const result = getQuestionAnswerPairsForMultipleFields({
        formFields,
        responses,
        includeSignatureDataPngDataUri: true,
      })

      const expectedSignatureDataPngDataUri =
        convertToSignaturePngDataUri(MOCK_SIGNATURE_VALUE)

      expect(result).toEqual([
        {
          question: '[signature] Signature',
          answer: 'Signature captured',
          fieldType: BasicField.Signature,
          signatureDataPngDataUri: expectedSignatureDataPngDataUri,
        },
      ])
    })

    it('should handle signature fields correctly when includeSignatureDataPngUri is false', () => {
      const formFields: FormFieldSchema[] = [
        {
          _id: '1',
          title: 'Signature',
          fieldType: BasicField.Signature,
        } as ISignatureFieldSchema,
      ]

      const responses = {
        '1': {
          fieldType: BasicField.Signature,
          answer: {
            type: 'draw',
            value: [[[10, 20, 0.5]], [[40, 40, 0.5]]],
          },
          question: 'Signature',
          provenance: {},
        },
      } as any

      const result = getQuestionAnswerPairsForMultipleFields({
        formFields,
        responses,
      })

      expect(result).toEqual([
        {
          question: '[signature] Signature',
          answer: 'Signature captured',
          fieldType: BasicField.Signature,
          signatureDataPngDataUri: undefined,
        },
      ])
    })

    it('should handle Ndi fields correctly', () => {
      const formFields: FormFieldSchema[] = []
      const responses = {
        'SingPass Validated NRIC': {
          fieldType: BasicField.Nric,
          answer: { value: 'S1234567A' },
          question: 'SingPass Validated NRIC',
          provenance: {},
        },
      } as any

      const result = getQuestionAnswerPairsForMultipleFields({
        formFields,
        responses,
      })

      expect(result).toEqual([
        {
          question: 'SingPass Validated NRIC',
          answer: 'S1234567A',
          fieldType: BasicField.Nric,
        },
      ])
    })
  })

  describe('retrieveWorkflowStepEmailAddresses', () => {
    describe('conditional workflow type', () => {
      it('should return correct emails for response for conditional routing workflow step', () => {
        // Arrange
        const mockConditionalFieldId = 'conditionalField'
        const mockShortTextFieldId = 'shortTextField'
        const mockForm = {
          form_fields: [
            generateDefaultField(BasicField.Dropdown, {
              _id: mockConditionalFieldId,
              fieldOptions: ['Option A', 'Option B'],
              optionsToRecipientsMap: {
                'Option A': ['test1@example.com'],
                'Option B': ['test2@example.com', 'test3@example.com'],
              },
            }),
            generateDefaultField(BasicField.ShortText, {
              _id: mockShortTextFieldId,
            }),
          ],
        } as IPopulatedForm

        // Test Option A
        const mockResponsesA = {
          [mockConditionalFieldId]: {
            fieldType: BasicField.Dropdown,
            answer: { value: 'Option A' },
            question: 'Dropdown',
            provenance: {},
          },
          [mockShortTextFieldId]: {
            fieldType: BasicField.ShortText,
            answer: { value: 'Some text response' },
            question: 'Short Text',
            provenance: {},
          },
        } as any

        const mockWorkflowStep = {
          workflow_type: WorkflowType.Conditional,
          conditional_field: mockConditionalFieldId,
        } as FormWorkflowStepDto

        // Act & Assert for Option A
        const resultA = retrieveWorkflowStepEmailAddresses(
          mockForm,
          mockWorkflowStep,
          mockResponsesA,
        )
        expect(resultA._unsafeUnwrap()).toEqual(['test1@example.com'])

        // Test Option B
        const mockResponsesB = {
          [mockConditionalFieldId]: {
            fieldType: BasicField.Dropdown,
            answer: { value: 'Option B' },
            question: 'Dropdown',
            provenance: {},
          },
          [mockShortTextFieldId]: {
            fieldType: BasicField.ShortText,
            answer: { value: 'Some text response' },
            question: 'Short Text',
            provenance: {},
          },
        } as any

        // Act & Assert for Option B
        const resultB = retrieveWorkflowStepEmailAddresses(
          mockForm,
          mockWorkflowStep,
          mockResponsesB,
        )
        expect(resultB._unsafeUnwrap()).toEqual([
          'test2@example.com',
          'test3@example.com',
        ])
      })

      it('should return empty array if response for field id not found', () => {
        // Arrange
        const mockConditionalFieldId = 'conditionalField'
        const mockForm = {
          form_fields: [
            generateDefaultField(BasicField.Dropdown, {
              _id: mockConditionalFieldId,
              fieldOptions: ['Option A', 'Option B'],
              optionsToRecipientsMap: {
                'Option A': ['test1@example.com'],
                'Option B': ['test2@example.com'],
              },
            }),
          ],
        } as IPopulatedForm
        const mockResponses = {} as FieldResponsesV3
        const mockWorkflowStep = {
          workflow_type: WorkflowType.Conditional,
          conditional_field: mockConditionalFieldId,
        } as FormWorkflowStepDto

        // Act
        const result = retrieveWorkflowStepEmailAddresses(
          mockForm,
          mockWorkflowStep,
          mockResponses,
        )

        // Assert
        expect(result._unsafeUnwrap()).toEqual([])
      })

      it('should return empty array if response is not a dropdown field', () => {
        // Arrange
        const mockConditionalFieldId = 'conditionalField'
        const mockForm = {
          form_fields: [
            generateDefaultField(BasicField.ShortText, {
              _id: mockConditionalFieldId,
            }),
          ],
        } as IPopulatedForm
        const mockResponses = {
          [mockConditionalFieldId]: {
            fieldType: BasicField.ShortText,
            answer: 'Some text',
          },
        } as FieldResponsesV3
        const mockWorkflowStep = {
          workflow_type: WorkflowType.Conditional,
          conditional_field: mockConditionalFieldId,
        } as FormWorkflowStepDto

        // Act
        const result = retrieveWorkflowStepEmailAddresses(
          mockForm,
          mockWorkflowStep,
          mockResponses,
        )

        // Assert
        expect(result._unsafeUnwrap()).toEqual([])
      })

      it('should return empty array if no optionsToRecipientsMap is found for the conditional field', () => {
        // Arrange
        const mockConditionalFieldId = 'conditionalField'
        const mockForm = {
          form_fields: [
            generateDefaultField(BasicField.Dropdown, {
              _id: mockConditionalFieldId,
              fieldOptions: ['Option A', 'Option B'],
            }),
          ],
        } as IPopulatedForm
        const mockResponses = {
          [mockConditionalFieldId]: {
            fieldType: BasicField.Dropdown,
            answer: 'Option A',
          },
        } as FieldResponsesV3
        const mockWorkflowStep = {
          workflow_type: WorkflowType.Conditional,
          conditional_field: mockConditionalFieldId,
        } as FormWorkflowStepDto

        // Act
        const result = retrieveWorkflowStepEmailAddresses(
          mockForm,
          mockWorkflowStep,
          mockResponses,
        )

        // Assert
        expect(result._unsafeUnwrap()).toEqual([])
      })
    })

    it('should return an empty array if the optionsToRecipientsMap does not contain an email mapping for the option selected', () => {
      // Arrange
      const mockConditionalFieldId = 'conditionalField'
      const mockForm = {
        form_fields: [
          generateDefaultField(BasicField.Dropdown, {
            _id: mockConditionalFieldId,
            fieldOptions: ['Option A', 'Option B'],
            optionsToRecipientsMap: {
              'Option A': ['test1@example.com'],
              'Option B': ['test2@example.com'],
            },
          }),
        ],
      } as IPopulatedForm
      const mockResponses = {
        [mockConditionalFieldId]: {
          fieldType: BasicField.Dropdown,
          answer: 'Option C', // Option not in mapping
        },
      } as FieldResponsesV3
      const mockWorkflowStep = {
        workflow_type: WorkflowType.Conditional,
        conditional_field: mockConditionalFieldId,
      } as FormWorkflowStepDto

      // Act
      const result = retrieveWorkflowStepEmailAddresses(
        mockForm,
        mockWorkflowStep,
        mockResponses,
      )

      // Assert
      expect(result._unsafeUnwrap()).toEqual([])
    })
  })

  it('should return an empty array when formFields is not iterable', () => {
    const formFields = null as unknown as FormFieldSchema[]
    const responses: FieldResponsesV3 = {
      '1': {
        fieldType: BasicField.ShortText,
        answer: 'Test answer',
      } as ShortTextResponseV3,
    }

    const result = getQuestionAnswerPairsForMultipleFields({
      formFields,
      responses,
    })

    expect(result).toEqual([])
  })

  it('should return an empty array when responses is undefined or null', () => {
    const formFields: FormFieldSchema[] = [
      {
        _id: '1',
        title: 'Short Text',
        fieldType: BasicField.ShortText,
      } as IShortTextFieldSchema,
    ]

    const undefinedResult = getQuestionAnswerPairsForMultipleFields({
      formFields,
      responses: undefined as unknown as FieldResponsesV3,
    })
    expect(undefinedResult).toEqual([])

    const nullResult = getQuestionAnswerPairsForMultipleFields({
      formFields,
      responses: null as unknown as FieldResponsesV3,
    })
    expect(nullResult).toEqual([])
  })

  describe('buildMrfResponseJson', () => {
    const BASE_ARGS = { responseId: 'abc123', timestamp: '1 Jan 2025' }

    it('should prepend Response ID and Timestamp as first two entries', () => {
      const result = JSON.parse(
        buildMrfResponseJson({ ...BASE_ARGS, formFields: [], responses: {} }),
      )
      expect(result[0]).toEqual({ question: 'Response ID', answer: 'abc123' })
      expect(result[1]).toEqual({ question: 'Timestamp', answer: '1 Jan 2025' })
    })

    it('should include question and answer for a basic field', () => {
      const fieldId = '1'
      const result = JSON.parse(
        buildMrfResponseJson({
          ...BASE_ARGS,
          formFields: [
            {
              _id: fieldId,
              title: 'Name',
              fieldType: BasicField.ShortText,
            } as IShortTextFieldSchema,
          ],
          responses: {
            [fieldId]: {
              fieldType: BasicField.ShortText,
              answer: { value: 'Alice' },
              question: 'Name',
              provenance: {},
            },
          } as any,
        }),
      )
      expect(result[2]).toEqual({ question: 'Name', answer: 'Alice' })
    })

    it('should output address sub-fields as separate flat entries', () => {
      const fieldId = '1'
      const result = JSON.parse(
        buildMrfResponseJson({
          ...BASE_ARGS,
          formFields: [
            {
              _id: fieldId,
              title: 'Home Address',
              fieldType: BasicField.Address,
            } as IAddressCompoundFieldSchema,
          ],
          responses: {
            [fieldId]: {
              fieldType: BasicField.Address,
              answer: {
                blockNumber: { value: '161' },
                streetName: { value: 'BUKIT BATOK STREET 11' },
                buildingName: { value: '' },
                levelNumber: { value: '01' },
                unitNumber: { value: '02' },
                postalCode: { value: '650161' },
              },
              question: 'Home Address',
              provenance: {},
            },
          } as any,
        }),
      )
      expect(result[2]).toEqual({
        question: 'Home Address - blockNumber',
        answer: '161',
      })
      expect(result[3]).toEqual({
        question: 'Home Address - streetName',
        answer: 'BUKIT BATOK STREET 11',
      })
      expect(result[4]).toEqual({
        question: 'Home Address - buildingName',
        answer: '',
      })
      expect(result[5]).toEqual({
        question: 'Home Address - levelNumber',
        answer: '01',
      })
      expect(result[6]).toEqual({
        question: 'Home Address - unitNumber',
        answer: '02',
      })
      expect(result[7]).toEqual({
        question: 'Home Address - postalCode',
        answer: '650161',
      })
    })

    it('should not add [Verified] prefix to email field questions', () => {
      const fieldId = '1'
      const result = JSON.parse(
        buildMrfResponseJson({
          ...BASE_ARGS,
          formFields: [
            {
              _id: fieldId,
              title: 'Email',
              fieldType: BasicField.Email,
            } as IEmailFieldSchema,
          ],
          responses: {
            [fieldId]: {
              fieldType: BasicField.Email,
              answer: { value: 'alice@example.com', signature: 'sig' },
              question: 'Email',
              provenance: {},
            },
          } as any,
        }),
      )
      expect(result[2]).toEqual({
        question: 'Email',
        answer: 'alice@example.com',
      })
    })

    it('should output empty string for fields with no response', () => {
      const result = JSON.parse(
        buildMrfResponseJson({
          ...BASE_ARGS,
          formFields: [
            {
              _id: '1',
              title: 'Unanswered',
              fieldType: BasicField.ShortText,
            } as IShortTextFieldSchema,
          ],
          responses: {},
        }),
      )
      expect(result[2]).toEqual({ question: 'Unanswered', answer: '' })
    })

    it('should exclude non-response fields (Section, Statement, Image)', () => {
      const result = JSON.parse(
        buildMrfResponseJson({
          ...BASE_ARGS,
          formFields: [
            {
              _id: '1',
              title: 'Section Header',
              fieldType: BasicField.Section,
            } as FormFieldSchema,
            {
              _id: '2',
              title: 'Statement',
              fieldType: BasicField.Statement,
            } as FormFieldSchema,
            {
              _id: '3',
              title: 'Image',
              fieldType: BasicField.Image,
            } as FormFieldSchema,
            {
              _id: '4',
              title: 'Name',
              fieldType: BasicField.ShortText,
            } as IShortTextFieldSchema,
          ],
          responses: {
            '4': {
              fieldType: BasicField.ShortText,
              answer: { value: 'Alice' },
              question: 'Name',
              provenance: {},
            },
          } as any,
        }),
      )
      expect(result).toHaveLength(3) // Response ID + Timestamp + Name
      expect(result[2]).toEqual({ question: 'Name', answer: 'Alice' })
    })

    it('should not include fieldType in output entries', () => {
      const fieldId = '1'
      const result = JSON.parse(
        buildMrfResponseJson({
          ...BASE_ARGS,
          formFields: [
            {
              _id: fieldId,
              title: 'Name',
              fieldType: BasicField.ShortText,
            } as IShortTextFieldSchema,
          ],
          responses: {
            [fieldId]: {
              fieldType: BasicField.ShortText,
              answer: { value: 'Alice' },
              question: 'Name',
              provenance: {},
            },
          } as any,
        }),
      )
      expect(result[2]).not.toHaveProperty('fieldType')
    })
  })

  describe('getMrfVersion', () => {
    type WebhookType = 'zapier' | 'plumber' | 'generic' | undefined

    it.each<{
      name: string
      webhookType: WebhookType
      isStepWriteTokenEnabled: boolean
      expected: MrfVersion
    }>([
      {
        name: 'no webhook, write-guard off => V4',
        webhookType: undefined,
        isStepWriteTokenEnabled: false,
        expected: 2,
      },
      {
        name: 'no webhook, write-guard on => V4',
        webhookType: undefined,
        isStepWriteTokenEnabled: true,
        expected: 2,
      },
      {
        name: 'plumber, write-guard on => V4',
        webhookType: 'plumber',
        isStepWriteTokenEnabled: true,
        expected: 2,
      },
      {
        name: 'plumber, write-guard off => V3',
        webhookType: 'plumber',
        isStepWriteTokenEnabled: false,
        expected: 1,
      },
      {
        name: 'generic, write-guard off => V4',
        webhookType: 'generic',
        isStepWriteTokenEnabled: false,
        expected: 2,
      },
      {
        name: 'generic, write-guard on => V4',
        webhookType: 'generic',
        isStepWriteTokenEnabled: true,
        expected: 2,
      },
      {
        name: 'zapier is treated as generic, write-guard off => V4',
        webhookType: 'zapier',
        isStepWriteTokenEnabled: false,
        expected: 2,
      },
      {
        name: 'zapier is treated as generic, write-guard on => V4',
        webhookType: 'zapier',
        isStepWriteTokenEnabled: true,
        expected: 2,
      },
    ])('$name', ({ webhookType, isStepWriteTokenEnabled, expected }) => {
      expect(getMrfVersion({ webhookType, isStepWriteTokenEnabled })).toBe(
        expected,
      )
    })
  })
})
