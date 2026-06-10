import { generateDefaultField } from '__tests__/unit/backend/helpers/generate-form-data'
import type { FieldResponsesV4 } from '@opengovsg/formsg-sdk'
import { ObjectId } from 'bson'
import { CLIENT_CHECKBOX_OTHERS_INPUT_VALUE } from 'formsg-shared/constants/form'
import {
  BasicField,
  FormFieldDto,
  FormWorkflowStepConditional,
  FormWorkflowStepDto,
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
  createMultirespondentSubmissionDto,
  createPublicMultirespondentSubmissionDto,
  extractRespondentCopyEmailDatas,
  getQuestionAnswerPairsForMultipleFields,
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
            question: '',
            answer: { value: 'notexpectedsinceinactive@email.com' },
            provenance: {},
          },
          [activeEmailField]: {
            fieldType: BasicField.Email,
            question: '',
            answer: { value: 'expected@email.com' },
            provenance: {},
          },
          [shortTextFieldId]: {
            fieldType: BasicField.ShortText,
            question: '',
            answer: { value: 'short text answer' },
            provenance: {},
          },
          [activeEmailFieldNoAutoReply]: {
            fieldType: BasicField.Email,
            question: '',
            answer: { value: 'notexpectedsincenoautoReply@email.com' },
            provenance: {},
          },
        } as FieldResponsesV4,
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
      const mockResponses: ParsedClearFormFieldResponsesV4 = {
        [field1Id]: {
          fieldType: BasicField.Children,
          question: '',
          answer: {},
          provenance: {},
        } as unknown as ParsedClearFormFieldResponsesV4[string],
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
      const mockResponses: ParsedClearFormFieldResponsesV4 = {
        [field1Id]: {
          fieldType: BasicField.ShortText,
          question: '',
          answer: { value: 'Some text' },
          provenance: {},
        } as unknown as ParsedClearFormFieldResponsesV4[string],
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
      const mockResponses: ParsedClearFormFieldResponsesV4 = {
        [field1Id]: {
          fieldType: BasicField.ShortText,
          question: '',
          answer: { value: 'Some text' },
          provenance: {},
        } as unknown as ParsedClearFormFieldResponsesV4[string],
        [field2Id]: {
          fieldType: BasicField.LongText,
          question: '',
          answer: { value: 'Some long text' },
          provenance: {},
        } as unknown as ParsedClearFormFieldResponsesV4[string],
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
      const responses: FieldResponsesV4 = {
        '1': {
          fieldType: BasicField.ShortText,
          question: 'Short Text',
          answer: { value: 'Test answer' },
          provenance: {},
        },
        '2': {
          fieldType: BasicField.Number,
          question: 'Number',
          answer: { value: '42' },
          provenance: {},
        },
        '3': {
          fieldType: BasicField.Email,
          question: 'Email',
          answer: { value: 'test@example.com' },
          provenance: {},
        },
      }

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
      const responses: FieldResponsesV4 = {
        '1': {
          fieldType: BasicField.Attachment,
          question: 'File Upload',
          answer: { value: 'file.pdf', hasBeenScanned: false },
          provenance: {},
        },
      }

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
      const responses: FieldResponsesV4 = {
        '1': {
          fieldType: BasicField.Table,
          question: 'Table of Name and Age',
          answer: {
            row0: { rowNum: 0, value: { col1: 'Alice', col2: '30' } },
            row1: { rowNum: 1, value: { col1: 'Bob', col2: '25' } },
          },
          provenance: {},
        },
        '2': {
          fieldType: BasicField.Table,
          question: 'Table of Hobbies',
          answer: {
            row0: { rowNum: 0, value: { col3: 'Swimming', col4: '5' } },
            row1: { rowNum: 1, value: { col3: 'Reading', col4: '10' } },
          },
          provenance: {},
        },
      }

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
      const responses: FieldResponsesV4 = {
        '1': {
          fieldType: BasicField.Checkbox,
          question: 'Checkbox',
          answer: {
            value: ['Option 1', 'Option 2', CLIENT_CHECKBOX_OTHERS_INPUT_VALUE],
            othersInput: 'Custom Option',
          },
          provenance: {},
        },
      }

      const result = getQuestionAnswerPairsForMultipleFields({
        formFields,
        responses,
      })

      expect(result).toEqual([
        {
          question: 'Checkbox',
          answer: 'Option 1,Option 2,Custom Option',
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
      const responses: FieldResponsesV4 = {
        '1': {
          fieldType: BasicField.Address,
          question: 'Address',
          answer: {
            postalCode: { value: '650161' },
            blockNumber: { value: '161' },
            streetName: { value: 'BUKIT BATOK STREET 11' },
            buildingName: { value: '' },
            levelNumber: { value: '1' },
            unitNumber: { value: '1' },
          },
          provenance: {},
        },
      }

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

      const responses: FieldResponsesV4 = {
        '1': {
          fieldType: BasicField.Signature,
          question: 'Signature',
          answer: { type: 'draw', value: MOCK_SIGNATURE_VALUE },
          provenance: {},
        },
      }

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

      const responses: FieldResponsesV4 = {
        '1': {
          fieldType: BasicField.Signature,
          question: 'Signature',
          answer: { type: 'draw', value: [[[10, 20, 0.5]], [[40, 40, 0.5]]] },
          provenance: {},
        },
      }

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
      const responses: FieldResponsesV4 = {
        'SingPass Validated NRIC': {
          fieldType: BasicField.Nric,
          question: 'SingPass Validated NRIC',
          answer: { value: 'S1234567A' },
          provenance: {},
        },
      }

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
        const mockResponsesA: FieldResponsesV4 = {
          [mockConditionalFieldId]: {
            fieldType: BasicField.Dropdown,
            question: '',
            answer: { value: 'Option A' },
            provenance: {},
          },
          [mockShortTextFieldId]: {
            fieldType: BasicField.ShortText,
            question: '',
            answer: { value: 'Some text response' },
            provenance: {},
          },
        }

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
        const mockResponsesB: FieldResponsesV4 = {
          [mockConditionalFieldId]: {
            fieldType: BasicField.Dropdown,
            question: '',
            answer: { value: 'Option B' },
            provenance: {},
          },
          [mockShortTextFieldId]: {
            fieldType: BasicField.ShortText,
            question: '',
            answer: { value: 'Some text response' },
            provenance: {},
          },
        }

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
        const mockResponses: FieldResponsesV4 = {}
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
        const mockResponses: FieldResponsesV4 = {
          [mockConditionalFieldId]: {
            fieldType: BasicField.ShortText,
            question: '',
            answer: { value: 'Some text' },
            provenance: {},
          },
        }
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
        const mockResponses: FieldResponsesV4 = {
          [mockConditionalFieldId]: {
            fieldType: BasicField.Dropdown,
            question: '',
            answer: { value: 'Option A' },
            provenance: {},
          },
        }
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
      const mockResponses: FieldResponsesV4 = {
        [mockConditionalFieldId]: {
          fieldType: BasicField.Dropdown,
          question: '',
          answer: { value: 'Option C' }, // Option not in mapping
          provenance: {},
        },
      }
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
    const responses: FieldResponsesV4 = {
      '1': {
        fieldType: BasicField.ShortText,
        question: 'Short Text',
        answer: { value: 'Test answer' },
        provenance: {},
      },
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
      responses: undefined as unknown as FieldResponsesV4,
    })
    expect(undefinedResult).toEqual([])

    const nullResult = getQuestionAnswerPairsForMultipleFields({
      formFields,
      responses: null as unknown as FieldResponsesV4,
    })
    expect(nullResult).toEqual([])
  })
})
