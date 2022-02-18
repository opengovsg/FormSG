import { addDays } from 'date-fns'
import { merge } from 'lodash'
import { rest } from 'msw'
import { PartialDeep } from 'type-fest'

import { FormId, PublicFormViewDto } from '~shared/types/form/form'

import {
  FetchNewTransactionResponse,
  JsonDate,
} from '~features/verifiable-fields'

import mockFormLogo from '../assets/mockFormLogo.png'

import { MOCK_ENVS } from './env'

const BASE_FORM = {
  admin: {
    agency: {
      shortName: 'govtech',
      fullName: 'Government Technology Agency',
      emailDomain: ['tech.gov.sg', 'data.gov.sg', 'form.sg', 'open.gov.sg'],
      logo: 'path/to/logo',
    },
  },
  authType: 'NIL',
  endPage: {
    title: 'Thank you for filling out the form.',
    buttonText: 'Submit another form',
  },
  form_fields: [
    {
      title: 'Yes/No',
      description: '',
      required: true,
      disabled: false,
      fieldType: 'yes_no',
      _id: '5da04eb5e397fc0013f63c7e',
      globalId: 'CnGRpTpnqSrISnk28yLDvKt8MI2HCFJuYbk72ie0l56',
    },
    {
      title: 'Header 2',
      description: 'This is a new section',
      required: true,
      disabled: false,
      fieldType: 'section',
      _id: '5da04e8ce397fc0013f63c71',
      globalId: '1rHoFJPl5hOsS3t1zIqhFSKGccxPVk4lg8sVIEAYMoH',
    },
    {
      title: 'Statement',
      description: 'stmt',
      required: true,
      disabled: false,
      fieldType: 'statement',
      _id: '5da04e8e3738d1001260772b',
      globalId: 'H7RfgU7ZV2MB1RkFxdRsyG8x30VzqOyjCAU5mnzG9vs',
    },
    {
      autoReplyOptions: {
        hasAutoReply: true,
        autoReplySubject: 'my subject',
        autoReplySender: 'my name',
        autoReplyMessage: 'my email',
        includeFormSummary: true,
      },
      isVerifiable: false,
      hasAllowedEmailDomains: false,
      allowedEmailDomains: [],
      title: 'Email',
      description: '',
      required: true,
      disabled: false,
      fieldType: 'email',
      _id: '5da0290b4073c800128388b4',
      globalId: 'nhTtR59j90TGAxKCIdSQ7FFFjF5z0d6ifKDIxr2IfgO',
    },
    {
      allowIntlNumbers: false,
      isVerifiable: false,
      title: 'Mobile Number',
      description: '',
      required: true,
      disabled: false,
      fieldType: 'mobile',
      _id: '5da04ea3e397fc0013f63c78',
      globalId: 'IsZAjzS1J2AJqsUnAnCSQStxoknyIdUEXam6cPlNYuJ',
    },
    {
      allowIntlNumbers: true,
      isVerifiable: true,
      title: 'Verifiable Mobile Number',
      description: '',
      required: true,
      disabled: false,
      fieldType: 'mobile',
      _id: '5da04ea3e397fc0013f63c11',
      globalId: 'IsZAjzS1J2AJqsUnAnCSQStxoknyIdUEXam6cPlNYuY',
    },
    {
      ValidationOptions: {
        _id: '6148614ee2fb650012928dd9',
        customVal: null,
        selectedValidation: null,
        customMin: null,
        customMax: null,
        id: '6148614ee2fb650012928dd9',
      },
      title: 'Number',
      description: '',
      required: true,
      disabled: false,
      fieldType: 'number',
      _id: '5da04ea9e397fc0013f63c7b',
      globalId: 'TUAlegPQaX1L5kzEBtNWNlohV0eUoFsZ7WL2m3IMbFv',
    },
    {
      ValidationOptions: { customMax: null, customMin: null },
      validateByValue: false,
      title: 'Decimal',
      description: '',
      required: true,
      disabled: false,
      fieldType: 'decimal',
      _id: '5da04eab3738d10012607734',
      globalId: 'bRvL9Y3syNYSZDUI09lbMM0ET1nAaDoJNXxGEYH5P4S',
    },
    {
      ValidationOptions: {
        _id: '6148614ee2fb650012928ddb',
        customVal: null,
        selectedValidation: null,
        customMin: null,
        customMax: null,
        id: '6148614ee2fb650012928ddb',
      },
      allowPrefill: false,
      title: 'Short Text',
      description: '',
      required: true,
      disabled: false,
      fieldType: 'textfield',
      _id: '5da04eafe397fc0013f63c7c',
      globalId: 'gi588V2s1fBk7BcWOHoqnFy1by7KIxjw8njXV5NeC3g',
    },
    {
      ValidationOptions: {
        _id: '6148614ee2fb650012928ddd',
        customVal: null,
        selectedValidation: null,
        customMin: null,
        customMax: null,
        id: '6148614ee2fb650012928ddd',
      },
      title: 'Long Text',
      description: '',
      required: true,
      disabled: false,
      fieldType: 'textarea',
      _id: '5da04eb1e397fc0013f63c7d',
      globalId: 'iJpZkr9GasJrAvQHOYAyRiGRGNhDJAzRw6FwTLaQImS',
    },
    {
      fieldOptions: ['Option 1'],
      title: 'Dropdown',
      description: '',
      required: true,
      disabled: false,
      fieldType: 'dropdown',
      _id: '5da04eb23738d10012607737',
      globalId: 'wzV4A56NIxpfdjdB0WJO0vcovDOiY7wjuE8ZH4Pr9at',
    },
    {
      title: 'Header 3',
      description: 'This is a new section',
      required: true,
      disabled: false,
      fieldType: 'section',
      _id: '61486153e2fb650012928def',
      globalId: 'd3WY7YkgO0vfri8Zkse4GINRmoNhAygjDaa0D4ZJnzL',
    },
    {
      ValidationOptions: { customMax: null, customMin: null },
      fieldOptions: ['Option 1'],
      othersRadioButton: false,
      validateByValue: false,
      title: 'Checkbox',
      description: '',
      required: true,
      disabled: false,
      fieldType: 'checkbox',
      _id: '5da04eb7e397fc0013f63c80',
      globalId: 'l4gMDfFhA1ITmhUPQCjA05aUAOROUOwlNAjMJMkwmJ7',
    },
    {
      fieldOptions: ['Option 1'],
      othersRadioButton: false,
      title: 'Radio',
      description: '',
      required: true,
      disabled: false,
      fieldType: 'radiobutton',
      _id: '5da04eb93738d10012607738',
      globalId: 'pJc2jhdmSk0auIes9O4Y1Wwq3xLVab1e3D3VrMWuJVt',
    },
    {
      dateValidation: {
        customMinDate: null,
        customMaxDate: null,
        selectedDateValidation: null,
      },
      title: 'Date',
      description: '',
      required: true,
      disabled: false,
      fieldType: 'date',
      _id: '5da04ebfe397fc0013f63c83',
      globalId: 'pq8tWED4Jf6FkuWr9VKUqz5Ea6rCASbx73aO6T2LhAN',
    },
    {
      ratingOptions: { steps: 5, shape: 'Heart' },
      title: 'Rating',
      description: '',
      required: true,
      disabled: false,
      fieldType: 'rating',
      _id: '5da04ec13738d1001260773a',
      globalId: '1KjTqMp582fiF9oChFxmw6De7B2U1zQGvJ0TLm5rcZu',
    },
    {
      title: 'NRIC',
      description: '',
      required: true,
      disabled: false,
      fieldType: 'nric',
      _id: '5da04ec43738d1001260773b',
      globalId: '0KHU4aNnFVS5y8CLqkXWf9A0RknGIqzNoVfOUlqNRDl',
    },
    {
      addMoreRows: false,
      title: 'Table',
      description: '',
      required: true,
      disabled: false,
      fieldType: 'table',
      _id: '5da04f833738d1001260777f',
      columns: [
        {
          ValidationOptions: {
            _id: '6148614ee2fb650012928ddf',
            customMax: null,
            customMin: null,
            customVal: null,
            selectedValidation: null,
            id: '6148614ee2fb650012928ddf',
          },
          allowPrefill: false,
          columnType: 'textfield',
          _id: '5da04f833738d10012607781',
          title: 'Text Field',
          required: true,
        },
        {
          fieldOptions: ['Option 1', 'Option 2'],
          columnType: 'dropdown',
          _id: '5dadaeb719eccb0012364550',
          title: 'Db',
          required: true,
        },
      ],
      minimumRows: 2,
      globalId: 'E7udA19YGZOZuiFhlDSm5FwmogBiz9DaUulRFe9ygGD',
    },
    {
      title: 'Attachment',
      description: '',
      required: false,
      disabled: false,
      fieldType: 'attachment',
      _id: '5da04f873738d10012607783',
      attachmentSize: '1',
      globalId: 'gE8XOqZA6MA3Rl7bQbrSOKpxjfeVSeYSfMZhRSitEn1',
    },
  ],
  form_logics: [
    {
      show: [
        '5da0290b4073c800128388b4',
        '5da04ea3e397fc0013f63c78',
        '5da04ea9e397fc0013f63c7b',
        '5da04eab3738d10012607734',
        '5da04eafe397fc0013f63c7c',
        '5da04eb1e397fc0013f63c7d',
        '5da04eb23738d10012607737',
        '5da04eb7e397fc0013f63c80',
        '5da04eb93738d10012607738',
        '5da04ebfe397fc0013f63c83',
        '5da04ec13738d1001260773a',
        '5da04ec43738d1001260773b',
        '5da04f833738d1001260777f',
        '5da04f873738d10012607783',
      ],
      logicType: 'showFields',
      _id: '5fe1bab172689300133ce336',
      conditions: [
        {
          ifValueType: 'single-select',
          _id: '56870',
          field: '5da04eb5e397fc0013f63c7e',
          state: 'is equals to',
          value: 'Yes',
        },
      ],
    },
  ],
  hasCaptcha: true,
  startPage: {
    colorTheme: 'blue',
    logo: { state: 'NONE' },
    estTimeTaken: 300,
  },
  status: 'PUBLIC',
  title: 'Mock form title',
  responseMode: 'email',
}

export const getPublicFormResponse = ({
  delay,
  overrides,
}: {
  delay?: number | 'infinite'
  overrides?: PartialDeep<PublicFormViewDto>
} = {}) => {
  return rest.get<PublicFormViewDto>(
    '/api/v3/forms/:formId',
    (req, res, ctx) => {
      const formId = req.params.formId ?? '61540ece3d4a6e50ac0cc6ff'

      const response = merge(
        {
          form: {
            _id: formId as FormId,
            ...BASE_FORM,
          },
        },
        overrides,
      ) as PublicFormViewDto
      return res(ctx.delay(delay), ctx.json(response))
    },
  )
}

export const getCustomLogoResponse = () => {
  return rest.get(
    `/${MOCK_ENVS.logoBucketUrl}/:fileId`,
    async (_, res, ctx) => {
      const image = await fetch(mockFormLogo).then((res) => res.arrayBuffer())
      return res(
        ctx.set('Content-Length', image.byteLength.toString()),
        ctx.set('Content-Type', 'image/png'),
        ctx.body(image),
      )
    },
  )
}

export const postVfnTransactionResponse = ({
  delay,
  overrides,
}: {
  delay?: number | 'infinite'
  overrides?: PartialDeep<FetchNewTransactionResponse>
} = {}) => {
  return rest.post<FetchNewTransactionResponse>(
    `/api/v3/forms/:formId/fieldverifications`,
    (_req, res, ctx) => {
      return res(
        ctx.delay(delay),
        ctx.json<FetchNewTransactionResponse>(
          merge(
            {
              transactionId: 'mock-transaction-id',
              expireAt: addDays(new Date(), 100).toISOString() as JsonDate,
            },
            overrides,
          ),
        ),
      )
    },
  )
}

export const postGenerateVfnOtpResponse = ({
  delay,
}: {
  delay?: number | 'infinite'
} = {}) => {
  return rest.post(
    `/api/v3/forms/:formId/fieldverifications/:transactionId/fields/:fieldId/otp/generate`,
    (_req, res, ctx) => {
      return res(ctx.delay(delay), ctx.status(200))
    },
  )
}

export const postVerifyVfnOtpResponse = ({
  delay,
}: {
  delay?: number | 'infinite'
} = {}) => {
  return rest.post(
    `/api/v3/forms/:formId/fieldverifications/:transactionId/fields/:fieldId/otp/verify`,
    (_req, res, ctx) => {
      return res(ctx.delay(delay), ctx.json('mock-signature-hehe'))
    },
  )
}

export const publicFormHandlers = [
  getPublicFormResponse(),
  getCustomLogoResponse(),
  postVfnTransactionResponse(),
  postGenerateVfnOtpResponse(),
  postVerifyVfnOtpResponse(),
]
