import { errAsync, okAsync } from 'neverthrow'
import { BasicField, FormMetadata } from 'shared/types'

import { FormFieldSchema, IPopulatedForm } from 'src/types'

import { createFormFieldsUsingTextPrompt } from '../admin-form.assistance.service'
import {
  ModelGetClientFailureError,
  ModelResponseFailureError,
  ModelResponseInvalidSchemaFormatError,
  ModelResponseInvalidSyntaxError,
} from '../admin-form.errors'
import * as AdminFormService from '../admin-form.service'
import * as AiModel from '../ai-model'

const MockedAiModel = jest.mocked(AiModel)

jest.mock('../admin-form.service', () => ({
  ...jest.requireActual('../admin-form.service'),
  createFormFields: jest.fn(),
  updateFormMetadata: jest.fn(),
}))

describe('admin-form.assistance.service', () => {
  beforeEach(() => {
    const mockedUpdateformMetadata =
      AdminFormService.updateFormMetadata as jest.Mock
    mockedUpdateformMetadata.mockReturnValue(okAsync({} as FormMetadata))
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('createFormFieldsUsingTextPrompt', () => {
    const mockForm = {
      id: 'mock-form-id',
      title: 'Mock Form',
      admin: {
        _id: 'mock-admin-id',
        email: 'mock-admin@example.com',
      },
      fields: [],
      form_fields: [],
    } as unknown as IPopulatedForm
    const mockUserPrompt = 'mock user prompt'
    describe('valid model response', () => {
      beforeEach(() => {
        const mockedCreateFormFields =
          AdminFormService.createFormFields as jest.Mock
        mockedCreateFormFields.mockReturnValue(okAsync({} as FormFieldSchema[]))
      })

      it('should successfully invoke createNewFields with correct # of fields when model response is valid', async () => {
        // Arrange
        const VALID_ALL_FIELDS_INCLUDED_RESPONSE =
          '[{"title":"Cat Information","fieldType":"Section","required":false},{"title":"Please provide the name of your cat.","fieldType":"Statement","required":true,"description":"This information is needed to identify your pet."},{"title":"Your Email Address","fieldType":"Email","required":true},{"title":"Your Mobile Number","fieldType":"Mobile","required":true},{"title":"Your Home Phone Number","fieldType":"HomeNo","required":false},{"title":"How many cats do you have?","fieldType":"Number","required":true},{"title":"How much do you spend on cat care monthly?","fieldType":"Decimal","required":true},{"title":"Cat\'s Name (Short)","fieldType":"ShortText","required":true},{"title":"Tell us more about your cat (Long)","fieldType":"LongText","required":false},{"title":"Select your favorite cat breed","fieldType":"Dropdown","required":true,"fieldOptions":["Siamese","Persian","Maine Coon","Bengal","Sphynx"]},{"title":"Country/Region","fieldType":"CountryRegion","required":true},{"title":"Do you agree to share your cat\'s name for our records?","fieldType":"YesNo","required":true},{"title":"Do you want to receive updates about cat care?","fieldType":"Checkbox","required":false,"fieldOptions":["Yes, send me emails","No, thank you"]},{"title":"Select your preferred communication method","fieldType":"Radio","required":true,"fieldOptions":["Email","Phone","SMS"]},{"title":"Upload a picture of your cat","fieldType":"Attachment","required":false},{"title":"Select the date of your cat\'s birthday","fieldType":"Date","required":true},{"title":"Rate your satisfaction with our cat services (1-5)","fieldType":"Rating","required":true},{"title":"Your NRIC Number","fieldType":"Nric","required":true},{"title":"Your Business UEN (if applicable)","fieldType":"Uen","required":false},{"title":"Cat Care Records","fieldType":"Table","required":true,"columns":["Date","Activity","Notes"],"minimumRows":1,"addMoreRows":true}]'

        MockedAiModel.sendUserTextPrompt = jest
          .fn()
          .mockReturnValue(okAsync(VALID_ALL_FIELDS_INCLUDED_RESPONSE))

        // Act
        await createFormFieldsUsingTextPrompt({
          form: mockForm,
          userPrompt: mockUserPrompt,
        })

        // Assert
        expect(AdminFormService.createFormFields).toHaveBeenCalledTimes(1)
        expect(AdminFormService.createFormFields).toHaveBeenCalledWith({
          form: mockForm,
          newFields: expect.arrayContaining([expect.any(Object)]),
          to: 0,
        })
        const calledNewFields = (AdminFormService.createFormFields as jest.Mock)
          .mock.calls[0][0].newFields
        expect(calledNewFields).toHaveLength(20)
      })

      it('should have fieldOptions for radio field type when generated', async () => {
        // Arrange
        const VALID_RADIO_ONLY_RESPONSE =
          '[{"title":"Cat Name","fieldType":"Radio","required":true,"fieldOptions":["Whiskers","Bella","Luna","Oliver","Simba"]}]'

        MockedAiModel.sendUserTextPrompt = jest
          .fn()
          .mockReturnValue(okAsync(VALID_RADIO_ONLY_RESPONSE))

        // Act
        await createFormFieldsUsingTextPrompt({
          form: mockForm,
          userPrompt: mockUserPrompt,
        })

        // Assert
        expect(AdminFormService.createFormFields).toHaveBeenCalledTimes(1)
        expect(AdminFormService.createFormFields).toHaveBeenCalledWith({
          form: mockForm,
          newFields: expect.arrayContaining([expect.any(Object)]),
          to: 0,
        })
        const calledNewFields = (AdminFormService.createFormFields as jest.Mock)
          .mock.calls[0][0].newFields
        expect(calledNewFields).toHaveLength(1)
        expect(calledNewFields[0].fieldType).toEqual(BasicField.Radio)
        expect(calledNewFields[0]).toContainKey('fieldOptions')
      })

      it('should have fieldOptions for checkbox field type when generated', async () => {
        // Arrange
        const VALID_CHECKBOX_ONLY_RESPONSE =
          '[{"title":"Favorite Fruits","fieldType":"Checkbox","required":true,"fieldOptions":["Apple","Banana","Orange","Strawberry","Mango"]}]'

        MockedAiModel.sendUserTextPrompt = jest
          .fn()
          .mockReturnValue(okAsync(VALID_CHECKBOX_ONLY_RESPONSE))

        // Act
        await createFormFieldsUsingTextPrompt({
          form: mockForm,
          userPrompt: mockUserPrompt,
        })

        // Assert
        expect(AdminFormService.createFormFields).toHaveBeenCalledTimes(1)
        expect(AdminFormService.createFormFields).toHaveBeenCalledWith({
          form: mockForm,
          newFields: expect.arrayContaining([expect.any(Object)]),
          to: 0,
        })
        const calledNewFields = (AdminFormService.createFormFields as jest.Mock)
          .mock.calls[0][0].newFields
        expect(calledNewFields).toHaveLength(1)
        expect(calledNewFields[0].fieldType).toEqual(BasicField.Checkbox)
        expect(calledNewFields[0]).toContainKey('fieldOptions')
      })

      it('should have fieldOptions for dropdown field type when generated', async () => {
        // Arrange
        const VALID_DROPDOWN_ONLY_RESPONSE =
          '[{"title":"Favorite Color","fieldType":"Dropdown","required":true,"fieldOptions":["Red","Blue","Green","Yellow","Purple"]}]'

        MockedAiModel.sendUserTextPrompt = jest
          .fn()
          .mockReturnValue(okAsync(VALID_DROPDOWN_ONLY_RESPONSE))

        // Act
        await createFormFieldsUsingTextPrompt({
          form: mockForm,
          userPrompt: mockUserPrompt,
        })

        // Assert
        expect(AdminFormService.createFormFields).toHaveBeenCalledTimes(1)
        expect(AdminFormService.createFormFields).toHaveBeenCalledWith({
          form: mockForm,
          newFields: expect.arrayContaining([expect.any(Object)]),
          to: 0,
        })
        const calledNewFields = (AdminFormService.createFormFields as jest.Mock)
          .mock.calls[0][0].newFields
        expect(calledNewFields).toHaveLength(1)
        expect(calledNewFields[0].fieldType).toEqual(BasicField.Dropdown)
        expect(calledNewFields[0]).toContainKey('fieldOptions')
      })

      it('should have non empty description for statement field type when generated', async () => {
        // Arrange
        const VALID_STATEMENT_RESPONSE =
          '[{"title":"Important Notice","fieldType":"Statement","description":"Please read the following information carefully before proceeding.","required":true}]'

        MockedAiModel.sendUserTextPrompt = jest
          .fn()
          .mockReturnValue(okAsync(VALID_STATEMENT_RESPONSE))

        // Act
        await createFormFieldsUsingTextPrompt({
          form: mockForm,
          userPrompt: mockUserPrompt,
        })

        // Assert
        expect(AdminFormService.createFormFields).toHaveBeenCalledTimes(1)
        expect(AdminFormService.createFormFields).toHaveBeenCalledWith({
          form: mockForm,
          newFields: expect.arrayContaining([expect.any(Object)]),
          to: 0,
        })
        const calledNewFields = (AdminFormService.createFormFields as jest.Mock)
          .mock.calls[0][0].newFields
        expect(calledNewFields).toHaveLength(1)
        expect(calledNewFields[0].fieldType).toEqual(BasicField.Statement)
        expect(calledNewFields[0].description).toBeTruthy()
        expect(calledNewFields[0].description.trim()).not.toBe('')
      })
    })

    describe('model errors', () => {
      it('should return error when model cannot get client', async () => {
        MockedAiModel.sendUserTextPrompt = jest
          .fn()
          .mockReturnValue(errAsync(new ModelGetClientFailureError()))

        const result = await createFormFieldsUsingTextPrompt({
          form: mockForm,
          userPrompt: mockUserPrompt,
        })

        expect(result._unsafeUnwrapErr()).toBeInstanceOf(
          ModelGetClientFailureError,
        )
      })

      it('should return error when model fails to generate responses', async () => {
        MockedAiModel.sendUserTextPrompt = jest
          .fn()
          .mockReturnValue(errAsync(new ModelResponseFailureError()))

        const result = await createFormFieldsUsingTextPrompt({
          form: mockForm,
          userPrompt: mockUserPrompt,
        })

        expect(result._unsafeUnwrapErr()).toBeInstanceOf(
          ModelResponseFailureError,
        )
      })
    })

    describe('invalid model responses', () => {
      it('should return error when invalid format generated by model', async () => {
        const INVALID_FORMAT_RESPONSE =
          '[{"title":"Cat Name","fieldType":"Radio","required":true,"fieldOptions":["Whiskers","Bella","Luna","Oliver","Simba"]]' // missing a closing brace
        MockedAiModel.sendUserTextPrompt = jest
          .fn()
          .mockReturnValue(okAsync(INVALID_FORMAT_RESPONSE))

        const result = await createFormFieldsUsingTextPrompt({
          form: mockForm,
          userPrompt: mockUserPrompt,
        })

        expect(result._unsafeUnwrapErr()).toBeInstanceOf(
          ModelResponseInvalidSyntaxError,
        )
      })

      it('should return error when no form fields ie. empty array generated by model', async () => {
        MockedAiModel.sendUserTextPrompt = jest
          .fn()
          .mockReturnValue(okAsync('[]'))

        const result = await createFormFieldsUsingTextPrompt({
          form: mockForm,
          userPrompt: mockUserPrompt,
        })

        expect(result._unsafeUnwrapErr()).toBeInstanceOf(
          ModelResponseInvalidSchemaFormatError,
        )
      })

      it('should return error when invalid field type generated by model', async () => {
        const INVALID_FIELD_TYPE_RESPONSE =
          '[{"title":"Invalid Field","fieldType":"InvalidType","required":true}]'
        MockedAiModel.sendUserTextPrompt = jest
          .fn()
          .mockReturnValue(okAsync(INVALID_FIELD_TYPE_RESPONSE))

        const result = await createFormFieldsUsingTextPrompt({
          form: mockForm,
          userPrompt: mockUserPrompt,
        })

        expect(result._unsafeUnwrapErr()).toBeInstanceOf(
          ModelResponseInvalidSchemaFormatError,
        )
      })

      it('should return error when Children field type is generated by model', async () => {
        const INVALID_CHILDREN_FIELD_TYPE_RESPONSE =
          '[{"title":"Invalid Children Field","fieldType":"Children","required":true}]'
        MockedAiModel.sendUserTextPrompt = jest
          .fn()
          .mockReturnValue(okAsync(INVALID_CHILDREN_FIELD_TYPE_RESPONSE))

        const result = await createFormFieldsUsingTextPrompt({
          form: mockForm,
          userPrompt: mockUserPrompt,
        })

        expect(result._unsafeUnwrapErr()).toBeInstanceOf(
          ModelResponseInvalidSchemaFormatError,
        )
      })

      it('should return error when Image field type is generated by model', async () => {
        const INVALID_IMAGE_FIELD_TYPE_RESPONSE =
          '[{"title":"Invalid Image Field","fieldType":"Image","required":true}]'
        MockedAiModel.sendUserTextPrompt = jest
          .fn()
          .mockReturnValue(okAsync(INVALID_IMAGE_FIELD_TYPE_RESPONSE))

        const result = await createFormFieldsUsingTextPrompt({
          form: mockForm,
          userPrompt: mockUserPrompt,
        })

        expect(result._unsafeUnwrapErr()).toBeInstanceOf(
          ModelResponseInvalidSchemaFormatError,
        )
      })

      it('should return error when statement field type does not have description', async () => {
        const INVALID_STATEMENT_RESPONSE =
          '[{"title":"Invalid Statement","fieldType":"Statement","required":true}]'
        MockedAiModel.sendUserTextPrompt = jest
          .fn()
          .mockReturnValue(okAsync(INVALID_STATEMENT_RESPONSE))

        const result = await createFormFieldsUsingTextPrompt({
          form: mockForm,
          userPrompt: mockUserPrompt,
        })

        expect(result._unsafeUnwrapErr()).toBeInstanceOf(
          ModelResponseInvalidSchemaFormatError,
        )
      })

      it('should return error when title is empty string', async () => {
        const INVALID_TITLE_RESPONSE =
          '[{"title":"","fieldType":"ShortText","required":true}]'
        MockedAiModel.sendUserTextPrompt = jest
          .fn()
          .mockReturnValue(okAsync(INVALID_TITLE_RESPONSE))

        const result = await createFormFieldsUsingTextPrompt({
          form: mockForm,
          userPrompt: mockUserPrompt,
        })

        expect(result._unsafeUnwrapErr()).toBeInstanceOf(
          ModelResponseInvalidSchemaFormatError,
        )
      })

      it('should return error when title is whitespace only string', async () => {
        const INVALID_TITLE_RESPONSE =
          '[{"title":"   ","fieldType":"ShortText","required":true}]'
        MockedAiModel.sendUserTextPrompt = jest
          .fn()
          .mockReturnValue(okAsync(INVALID_TITLE_RESPONSE))

        const result = await createFormFieldsUsingTextPrompt({
          form: mockForm,
          userPrompt: mockUserPrompt,
        })

        expect(result._unsafeUnwrapErr()).toBeInstanceOf(
          ModelResponseInvalidSchemaFormatError,
        )
      })

      it('should return error when required is missing', async () => {
        const INVALID_REQUIRED_RESPONSE =
          '[{"title":"Missing Required","fieldType":"ShortText"}]'
        MockedAiModel.sendUserTextPrompt = jest
          .fn()
          .mockReturnValue(okAsync(INVALID_REQUIRED_RESPONSE))

        const result = await createFormFieldsUsingTextPrompt({
          form: mockForm,
          userPrompt: mockUserPrompt,
        })

        expect(result._unsafeUnwrapErr()).toBeInstanceOf(
          ModelResponseInvalidSchemaFormatError,
        )
      })

      it('should return error when fieldType is missing', async () => {
        const INVALID_FIELD_TYPE_RESPONSE =
          '[{"title":"Missing Field Type","required":true}]'
        MockedAiModel.sendUserTextPrompt = jest
          .fn()
          .mockReturnValue(okAsync(INVALID_FIELD_TYPE_RESPONSE))

        const result = await createFormFieldsUsingTextPrompt({
          form: mockForm,
          userPrompt: mockUserPrompt,
        })

        expect(result._unsafeUnwrapErr()).toBeInstanceOf(
          ModelResponseInvalidSchemaFormatError,
        )
      })

      it('should return error when checkbox missing fieldOptions', async () => {
        const INVALID_CHECKBOX_RESPONSE =
          '[{"title":"Invalid Checkbox","fieldType":"Checkbox","required":true}]'
        MockedAiModel.sendUserTextPrompt = jest
          .fn()
          .mockReturnValue(okAsync(INVALID_CHECKBOX_RESPONSE))

        const result = await createFormFieldsUsingTextPrompt({
          form: mockForm,
          userPrompt: mockUserPrompt,
        })

        expect(result._unsafeUnwrapErr()).toBeInstanceOf(
          ModelResponseInvalidSchemaFormatError,
        )
      })

      it('should return error when radio missing fieldOptions', async () => {
        const INVALID_RADIO_RESPONSE =
          '[{"title":"Invalid Radio","fieldType":"Radio","required":true}]'
        MockedAiModel.sendUserTextPrompt = jest
          .fn()
          .mockReturnValue(okAsync(INVALID_RADIO_RESPONSE))

        const result = await createFormFieldsUsingTextPrompt({
          form: mockForm,
          userPrompt: mockUserPrompt,
        })

        expect(result._unsafeUnwrapErr()).toBeInstanceOf(
          ModelResponseInvalidSchemaFormatError,
        )
      })

      it('should return error when dropdown missing fieldOptions', async () => {
        const INVALID_DROPDOWN_RESPONSE =
          '[{"title":"Invalid Dropdown","fieldType":"Dropdown","required":true}]'
        MockedAiModel.sendUserTextPrompt = jest
          .fn()
          .mockReturnValue(okAsync(INVALID_DROPDOWN_RESPONSE))

        const result = await createFormFieldsUsingTextPrompt({
          form: mockForm,
          userPrompt: mockUserPrompt,
        })

        expect(result._unsafeUnwrapErr()).toBeInstanceOf(
          ModelResponseInvalidSchemaFormatError,
        )
      })
    })
  })
})
