import { generateDefaultField } from '__tests__/unit/backend/helpers/generate-form-data'
import { ObjectId } from 'bson'
import { omit } from 'lodash'
import moment from 'moment-timezone'
import { ok } from 'neverthrow'
import { CLIENT_CHECKBOX_OTHERS_INPUT_VALUE } from 'shared/constants/form'
import {
  AddressAttributes,
  AddressResponseV3,
  AttachmentResponseV3,
  BasicField,
  CheckboxResponseV3,
  ChildBirthRecordsResponseV3,
  EmailResponseV3,
  FieldResponsesV3,
  FormFieldDto,
  FormWorkflowStepConditional,
  FormWorkflowStepDto,
  LongTextResponseV3,
  NumberResponseV3,
  ShortTextResponseV3,
  SignatureFieldResponseV3,
  SubmissionType,
  TableResponseV3,
  WorkflowStatus,
  WorkflowType,
} from 'shared/types'

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

import * as fieldValidation from '../../../../utils/field-validation'
import { ValidateFieldErrorV3 } from '../../submission.errors'
import {
  createMultirespondentSubmissionDto,
  createPublicMultirespondentSubmissionDto,
  getQuestionTitleAnswerString,
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
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ValidateFieldErrorV3)
      expect(result._unsafeUnwrapErr().message).toBe(
        'Children field type is not supported for MRF submisisons',
      )
    })

    it('should invoke validateFieldV3 with isVisible true when non-hidden and supported field type is submitted', () => {
      // Arrange
      const validateFieldV3Mock = jest
        .spyOn(fieldValidation, 'validateFieldV3')
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
      expect(validateFieldV3Mock).toHaveBeenCalledWith({
        formId: mockFormId,
        formField: mockFormFields[0],
        response: mockResponses.field1,
        isVisible: true,
      })

      expect(validateFieldV3Mock).toHaveBeenCalledOnce()
    })

    it('should invoke validateFieldV3 with isVisible false when hidden and supported field type is submitted', () => {
      // Arrange
      const validateFieldV3Mock = jest
        .spyOn(fieldValidation, 'validateFieldV3')
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
      expect(validateFieldV3Mock).toHaveBeenCalledWith({
        formId: mockFormId,
        formField: mockFormFields[0],
        response: mockResponses.field1,
        isVisible: false,
      })

      expect(validateFieldV3Mock).toHaveBeenCalledWith({
        formId: mockFormId,
        formField: mockFormFields[1],
        response: mockResponses.field2,
        isVisible: true,
      })

      expect(validateFieldV3Mock).toHaveBeenCalledTimes(2)
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
      const responses: FieldResponsesV3 = {
        '1': {
          fieldType: BasicField.ShortText,
          answer: 'Test answer',
        } as ShortTextResponseV3,
        '2': { fieldType: BasicField.Number, answer: '42' } as NumberResponseV3,
        '3': {
          fieldType: BasicField.Email,
          answer: { value: 'test@example.com' },
        } as EmailResponseV3,
      }

      const result = getQuestionTitleAnswerString({ formFields, responses })

      expect(result).toEqual([
        { question: 'Short Text', answer: 'Test answer' },
        { question: 'Number', answer: '42' },
        { question: 'Email', answer: 'test@example.com' },
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
      const responses: FieldResponsesV3 = {
        '1': {
          fieldType: BasicField.Attachment,
          answer: { answer: 'file.pdf' },
        } as AttachmentResponseV3,
      }

      const result = getQuestionTitleAnswerString({ formFields, responses })

      expect(result).toEqual([
        { question: '[Attachment] File Upload', answer: 'file.pdf' },
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
      const responses: FieldResponsesV3 = {
        '1': {
          fieldType: BasicField.Table,
          answer: [
            { col1: 'Alice', col2: '30' },
            { col1: 'Bob', col2: '25' },
          ],
        } as TableResponseV3,
        '2': {
          fieldType: BasicField.Table,
          answer: [
            { col3: 'Swimming', col4: '5' },
            { col3: 'Reading', col4: '10' },
          ],
        } as TableResponseV3,
      }

      const result = getQuestionTitleAnswerString({ formFields, responses })

      expect(result).toEqual([
        {
          question: '[Table] Table of Name and Age (Name; Age)',
          answer: 'Alice; 30',
        },
        {
          question: '[Table] Table of Name and Age (Name; Age)',
          answer: 'Bob; 25',
        },
        {
          question: '[Table] Table of Hobbies (Hobby; Years)',
          answer: 'Swimming; 5',
        },
        {
          question: '[Table] Table of Hobbies (Hobby; Years)',
          answer: 'Reading; 10',
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
      const responses: FieldResponsesV3 = {
        '1': {
          fieldType: BasicField.Checkbox,
          answer: {
            value: ['Option 1', 'Option 2', CLIENT_CHECKBOX_OTHERS_INPUT_VALUE],
            othersInput: 'Custom Option',
          },
        } as CheckboxResponseV3,
      }

      const result = getQuestionTitleAnswerString({ formFields, responses })

      expect(result).toEqual([
        { question: 'Checkbox', answer: 'Option 1,Option 2,Custom Option' },
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
      const responses: FieldResponsesV3 = {
        '1': {
          fieldType: BasicField.Address,
          answer: {
            addressSubFields: {
              postalCode: '650161',
              blockNumber: '161',
              streetName: 'BUKIT BATOK STREET 11',
              buildingName: '',
              levelNumber: '1',
              unitNumber: '1',
            } as AddressAttributes,
          },
        } as AddressResponseV3,
      }

      const result = getQuestionTitleAnswerString({ formFields, responses })

      expect(result).toEqual([
        {
          question: 'Address',
          answer: '161, BUKIT BATOK STREET 11, #1-1, SINGAPORE 650161',
        },
      ])
    })

    it('should handle signature fields correctly', () => {
      const formFields: FormFieldSchema[] = [
        {
          _id: '1',
          title: 'Signature',
          fieldType: BasicField.Signature,
        } as ISignatureFieldSchema,
      ]

      const responses: FieldResponsesV3 = {
        '1': {
          fieldType: BasicField.Signature,
          answer: {
            type: 'draw',
            value: [[[10, 20, 0.5]], [[40, 40, 0.5]]],
          } as SignatureFieldResponseV3,
        },
      }

      const result = getQuestionTitleAnswerString({ formFields, responses })

      expect(result).toEqual([
        {
          question: '[signature] Signature',
          answer: 'Signature captured',
        },
      ])
    })

    it('should handle Ndi fields correctly', () => {
      const formFields: FormFieldSchema[] = []
      const responses: FieldResponsesV3 = {
        'SingPass Validated NRIC (Step 1)': {
          fieldType: BasicField.Nric,
          answer: 'S1234567A',
        },
      }

      const result = getQuestionTitleAnswerString({ formFields, responses })

      expect(result).toEqual([
        {
          question: 'SingPass Validated NRIC (Step 1)',
          answer: 'S1234567A',
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
            answer: 'Option A',
          },
          [mockShortTextFieldId]: {
            fieldType: BasicField.ShortText,
            answer: 'Some text response',
          },
        } as FieldResponsesV3

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
            answer: 'Option B',
          },
          [mockShortTextFieldId]: {
            fieldType: BasicField.ShortText,
            answer: 'Some text response',
          },
        } as FieldResponsesV3

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

    const result = getQuestionTitleAnswerString({ formFields, responses })

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

    const undefinedResult = getQuestionTitleAnswerString({
      formFields,
      responses: undefined as unknown as FieldResponsesV3,
    })
    expect(undefinedResult).toEqual([])

    const nullResult = getQuestionTitleAnswerString({
      formFields,
      responses: null as unknown as FieldResponsesV3,
    })
    expect(nullResult).toEqual([])
  })
})
