import cuid from 'cuid'
import { merge, mergeWith } from 'lodash'
import { rest } from 'msw'

import { PaymentChannel } from '~shared/types'
import { AgencyId } from '~shared/types/agency'
import {
  AttachmentSize,
  BasicField,
  FieldCreateDto,
  FormFieldDto,
  RatingShape,
  TableFieldDto,
} from '~shared/types/field'
import {
  FormLogic,
  LogicConditionState,
  LogicIfValue,
  LogicType,
} from '~shared/types/form'
import {
  AdminFormDto,
  AdminFormViewDto,
  FormAuthType,
  FormColorTheme,
  FormId,
  FormResponseMode,
  FormStatus,
} from '~shared/types/form/form'
import { FormLogoState } from '~shared/types/form/form_logo'
import { DateString } from '~shared/types/generic'
import { SubmissionMetadataList } from '~shared/types/submission'
import { UserDto } from '~shared/types/user'
import { insertAt, reorder } from '~shared/utils/immutable-array-fns'

import { getMyInfoFieldCreationMeta } from '~/features/admin-form/create/builder-and-design/utils/fieldCreation'

import {
  CREATE_MYINFO_CONTACT_FIELDS_ORDERED,
  CREATE_MYINFO_MARRIAGE_FIELDS_ORDERED,
  CREATE_MYINFO_PARTICULARS_FIELDS_ORDERED,
  CREATE_MYINFO_PERSONAL_FIELDS_ORDERED,
} from '~features/admin-form/create/builder-and-design/constants'
import { augmentWithMyInfoDisplayValue } from '~features/myinfo/utils'

export const MOCK_MYINFO_IMPLEMENTED_TYPES = [
  ...CREATE_MYINFO_PERSONAL_FIELDS_ORDERED,
  ...CREATE_MYINFO_CONTACT_FIELDS_ORDERED,
  ...CREATE_MYINFO_PARTICULARS_FIELDS_ORDERED,
  ...CREATE_MYINFO_MARRIAGE_FIELDS_ORDERED,
]

export const MOCK_FORM_FIELDS: FormFieldDto[] = [
  {
    title: 'Yes/No',
    description: 'This is a\n\nmultiline description\r\nanother line',
    required: true,
    disabled: false,
    fieldType: BasicField.YesNo,
    _id: '5da04eb5e397fc0013f63c7e',
    globalId: 'CnGRpTpnqSrISnk28yLDvKt8MI2HCFJuYbk72ie0l56',
  },
  {
    title: 'Header',
    description: '',
    required: true,
    disabled: false,
    fieldType: BasicField.Section,
    _id: '5da04e8ce397fc0013f63c71',
    globalId: '1rHoFJPl5hOsS3t1zIqhFSKGccxPVk4lg8sVIEAYMoH',
  },
  {
    title: 'Statement',
    description: 'stmt',
    required: true,
    disabled: false,
    fieldType: BasicField.Statement,
    _id: '5da04e8e3738d1001260772b',
    globalId: 'H7RfgU7ZV2MB1RkFxdRsyG8x30VzqOyjCAU5mnzG9vs',
  },
  {
    autoReplyOptions: {
      hasAutoReply: true,
      autoReplySubject: '',
      autoReplySender: '',
      autoReplyMessage: '',
      includeFormSummary: true,
    },
    isVerifiable: true,
    hasAllowedEmailDomains: true,
    allowedEmailDomains: ['@gmail.com'],
    title: 'Email',
    description: '',
    required: true,
    disabled: false,
    fieldType: BasicField.Email,
    _id: '5da0290b4073c800128388b4',
    globalId: 'nhTtR59j90TGAxKCIdSQ7FFFjF5z0d6ifKDIxr2IfgO',
  },
  {
    allowIntlNumbers: false,
    isVerifiable: true,
    title: 'Mobile Number',
    description: '',
    required: true,
    disabled: false,
    fieldType: BasicField.Mobile,
    _id: '5da04ea3e397fc0013f63c78',
    globalId: 'IsZAjzS1J2AJqsUnAnCSQStxoknyIdUEXam6cPlNYuJ',
  },
  {
    allowIntlNumbers: false,
    title: 'Home Number',
    description: '',
    required: true,
    disabled: false,
    fieldType: BasicField.HomeNo,
    _id: '624a7bb87da1c9ace14fa4ee',
    globalId: 'egs1hAtjIKibqc10hjz1s3qZ9PGunwL8vOXsNwIghuD',
  },
  {
    ValidationOptions: {
      selectedValidation: null,
      LengthValidationOptions: {
        selectedLengthValidation: null,
        customVal: null,
      },
      RangeValidationOptions: {
        customMin: null,
        customMax: null,
      },
    },
    title: 'Number',
    description: '',
    required: true,
    disabled: false,
    fieldType: BasicField.Number,
    _id: '5da04ea9e397fc0013f63c7b',
    globalId: 'TUAlegPQaX1L5kzEBtNWNlohV0eUoFsZ7WL2m3IMbFv',
  },
  {
    ValidationOptions: {
      customMax: null,
      customMin: null,
    },
    validateByValue: false,
    title: 'Decimal',
    description: '',
    required: true,
    disabled: false,
    fieldType: BasicField.Decimal,
    _id: '5da04eab3738d10012607734',
    globalId: 'bRvL9Y3syNYSZDUI09lbMM0ET1nAaDoJNXxGEYH5P4S',
  },
  {
    ValidationOptions: {
      customVal: null,
      selectedValidation: null,
    },
    allowPrefill: false,
    title: 'Short Text',
    description: '',
    required: true,
    disabled: false,
    fieldType: BasicField.ShortText,
    _id: '5da04eafe397fc0013f63c7c',
    globalId: 'gi588V2s1fBk7BcWOHoqnFy1by7KIxjw8njXV5NeC3g',
  },
  {
    ValidationOptions: {
      customVal: null,
      selectedValidation: null,
    },
    title: 'Long Text',
    description: '',
    required: true,
    disabled: false,
    fieldType: BasicField.LongText,
    _id: '5da04eb1e397fc0013f63c7d',
    globalId: 'iJpZkr9GasJrAvQHOYAyRiGRGNhDJAzRw6FwTLaQImS',
  },
  {
    fieldOptions: ['Option 1', 'Option 2', 'Option 3'],
    title: 'Dropdown',
    description: '',
    required: true,
    disabled: false,
    fieldType: BasicField.Dropdown,
    _id: '5da04eb23738d10012607737',
    globalId: 'wzV4A56NIxpfdjdB0WJO0vcovDOiY7wjuE8ZH4Pr9at',
  },
  {
    ValidationOptions: {
      customMax: null,
      customMin: null,
    },
    fieldOptions: ['Option 1', 'Option 2', 'Option 3'],
    othersRadioButton: false,
    validateByValue: false,
    title: 'Checkbox',
    description: '',
    required: true,
    disabled: false,
    fieldType: BasicField.Checkbox,
    _id: '5da04eb7e397fc0013f63c80',
    globalId: 'l4gMDfFhA1ITmhUPQCjA05aUAOROUOwlNAjMJMkwmJ7',
  },
  {
    fieldOptions: ['Option 1', 'Option 2', 'Option 3'],
    othersRadioButton: false,
    title: 'Radio',
    description: '',
    required: true,
    disabled: false,
    fieldType: BasicField.Radio,
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
    fieldType: BasicField.Date,
    _id: '5da04ebfe397fc0013f63c83',
    globalId: 'pq8tWED4Jf6FkuWr9VKUqz5Ea6rCASbx73aO6T2LhAN',
  },
  {
    ratingOptions: {
      steps: 5,
      shape: RatingShape.Heart,
    },
    title: 'Rating',
    description: '',
    required: true,
    disabled: false,
    fieldType: BasicField.Rating,
    _id: '5da04ec13738d1001260773a',
    globalId: '1KjTqMp582fiF9oChFxmw6De7B2U1zQGvJ0TLm5rcZu',
  },
  {
    title: 'NRIC',
    description: '',
    required: true,
    disabled: false,
    fieldType: BasicField.Nric,
    _id: '5da04ec43738d1001260773b',
    globalId: '0KHU4aNnFVS5y8CLqkXWf9A0RknGIqzNoVfOUlqNRDl',
  },
  {
    title: 'UEN',
    description: '',
    required: true,
    disabled: false,
    fieldType: BasicField.Uen,
    _id: '624a7c487da1c9ace14fa4ef',
    globalId: 'TKhuZk5X4rFgSbrbnjpJ205J6uhsdu18YwFdMVB7y70',
  },
  {
    addMoreRows: false,
    title: 'Table',
    description: '',
    required: true,
    disabled: false,
    fieldType: BasicField.Table,
    _id: '5da04f833738d1001260777f',
    columns: [
      {
        ValidationOptions: {
          customVal: null,
          selectedValidation: null,
        },
        allowPrefill: false,
        columnType: BasicField.ShortText,
        title: 'Text Field',
        required: true,
        _id: cuid(),
      },
      {
        fieldOptions: ['Option 1', 'Option 2'],
        columnType: BasicField.Dropdown,
        title: 'Db',
        required: true,
        _id: cuid(),
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
    fieldType: BasicField.Attachment,
    _id: '5da04f873738d10012607783',
    attachmentSize: AttachmentSize.OneMb,
    globalId: 'gE8XOqZA6MA3Rl7bQbrSOKpxjfeVSeYSfMZhRSitEn1',
  },
  {
    title: 'Image',
    description: '',
    required: true,
    disabled: false,
    fieldType: BasicField.Image,
    _id: '5daeb4443bc1090012953890',
    url: 'path/to/nowhere',
    fileMd5Hash: 'mockHash==',
    name: 'mock_image1.png',
    size: '0.02 MB',
    globalId: '0dugvqSkQ1CifZdDalxSjJfYfgJBxO29dmtqV1VQggk',
  },
  {
    title: 'Image',
    description: '',
    required: true,
    disabled: false,
    fieldType: BasicField.Image,
    _id: '5daeb44f06d34a001298a484',
    url: 'path/to/nowhere2',
    fileMd5Hash: 'mockHash2==',
    name: 'mock_image2.png',
    size: '0.86 MB',
    globalId: '6M755frgrULuCQxhEoYjR7Ab18RdKItsnHQP2NA8UAK',
  },
]

const DEFAULT_STORAGE_METADATA = [
  [
    {
      number: 39,
      refNo: '62a8a7476f4f3e005bcd5ab7',
      submissionTime: '14th Jun 2022, 11:20:39 pm',
    },
    {
      number: 38,
      refNo: '62a8a7466f4f3e005bcd5aaa',
      submissionTime: '14th Jun 2022, 11:20:38 pm',
    },
    {
      number: 37,
      refNo: '62a8a7456f4f3e005bcd5a9d',
      submissionTime: '14th Jun 2022, 11:20:37 pm',
    },
    {
      number: 36,
      refNo: '62a8a7456f4f3e005bcd5a90',
      submissionTime: '14th Jun 2022, 11:20:37 pm',
    },
    {
      number: 35,
      refNo: '62a8a7446f4f3e005bcd5a83',
      submissionTime: '14th Jun 2022, 11:20:36 pm',
    },
    {
      number: 34,
      refNo: '62a8a7436f4f3e005bcd5a76',
      submissionTime: '14th Jun 2022, 11:20:35 pm',
    },
    {
      number: 33,
      refNo: '62a8a7436f4f3e005bcd5a69',
      submissionTime: '14th Jun 2022, 11:20:35 pm',
    },
    {
      number: 32,
      refNo: '62a8a7426f4f3e005bcd5a5c',
      submissionTime: '14th Jun 2022, 11:20:34 pm',
    },
    {
      number: 31,
      refNo: '62a8a7416f4f3e005bcd5a4f',
      submissionTime: '14th Jun 2022, 11:20:33 pm',
    },
    {
      number: 30,
      refNo: '62a8a7416f4f3e005bcd5a42',
      submissionTime: '14th Jun 2022, 11:20:33 pm',
    },
  ],
  [
    {
      number: 29,
      refNo: '62a8a7406f4f3e005bcd5a35',
      submissionTime: '14th Jun 2022, 11:20:32 pm',
    },
    {
      number: 28,
      refNo: '62a8a73f6f4f3e005bcd5a28',
      submissionTime: '14th Jun 2022, 11:20:31 pm',
    },
    {
      number: 27,
      refNo: '62a8a73e6f4f3e005bcd5a1b',
      submissionTime: '14th Jun 2022, 11:20:30 pm',
    },
    {
      number: 26,
      refNo: '62a8a73e6f4f3e005bcd5a0e',
      submissionTime: '14th Jun 2022, 11:20:30 pm',
    },
    {
      number: 25,
      refNo: '62a8a73d6f4f3e005bcd5a01',
      submissionTime: '14th Jun 2022, 11:20:29 pm',
    },
    {
      number: 24,
      refNo: '62a8a73c6f4f3e005bcd59f4',
      submissionTime: '14th Jun 2022, 11:20:28 pm',
    },
    {
      number: 23,
      refNo: '62a8a73c6f4f3e005bcd59e7',
      submissionTime: '14th Jun 2022, 11:20:28 pm',
    },
    {
      number: 22,
      refNo: '62a8a73b6f4f3e005bcd59da',
      submissionTime: '14th Jun 2022, 11:20:27 pm',
    },
    {
      number: 21,
      refNo: '62a8a73a6f4f3e005bcd59cd',
      submissionTime: '14th Jun 2022, 11:20:26 pm',
    },
    {
      number: 20,
      refNo: '62a8a73a6f4f3e005bcd59c0',
      submissionTime: '14th Jun 2022, 11:20:26 pm',
    },
  ],
  [
    {
      number: 19,
      refNo: '62a8a7396f4f3e005bcd59b3',
      submissionTime: '14th Jun 2022, 11:20:25 pm',
    },
    {
      number: 18,
      refNo: '62a8a7386f4f3e005bcd59a6',
      submissionTime: '14th Jun 2022, 11:20:24 pm',
    },
    {
      number: 17,
      refNo: '62a8a7386f4f3e005bcd5999',
      submissionTime: '14th Jun 2022, 11:20:24 pm',
    },
    {
      number: 16,
      refNo: '62a8a7376f4f3e005bcd598c',
      submissionTime: '14th Jun 2022, 11:20:23 pm',
    },
    {
      number: 15,
      refNo: '62a8a7366f4f3e005bcd597f',
      submissionTime: '14th Jun 2022, 11:20:22 pm',
    },
    {
      number: 14,
      refNo: '62a8a7366f4f3e005bcd5972',
      submissionTime: '14th Jun 2022, 11:20:22 pm',
    },
    {
      number: 13,
      refNo: '62a8a7356f4f3e005bcd5965',
      submissionTime: '14th Jun 2022, 11:20:21 pm',
    },
    {
      number: 12,
      refNo: '62a8a7346f4f3e005bcd5958',
      submissionTime: '14th Jun 2022, 11:20:20 pm',
    },
    {
      number: 11,
      refNo: '62a8a7346f4f3e005bcd594b',
      submissionTime: '14th Jun 2022, 11:20:20 pm',
    },
    {
      number: 10,
      refNo: '62a8a7336f4f3e005bcd593e',
      submissionTime: '14th Jun 2022, 11:20:19 pm',
    },
  ],
  [
    {
      number: 9,
      refNo: '62a8a7326f4f3e005bcd5931',
      submissionTime: '14th Jun 2022, 11:20:18 pm',
    },
    {
      number: 8,
      refNo: '62a8a7316f4f3e005bcd5924',
      submissionTime: '14th Jun 2022, 11:20:17 pm',
    },
    {
      number: 7,
      refNo: '62a8a72d6f4f3e005bcd5917',
      submissionTime: '14th Jun 2022, 11:20:13 pm',
    },
    {
      number: 6,
      refNo: '62a8a7206f4f3e005bcd590a',
      submissionTime: '14th Jun 2022, 11:20:00 pm',
    },
    {
      number: 5,
      refNo: '62a85b195bdb20010a8be1c9',
      submissionTime: '14th Jun 2022, 5:55:37 pm',
    },
    {
      number: 4,
      refNo: '62a859275bdb20010a8be095',
      submissionTime: '14th Jun 2022, 5:47:19 pm',
    },
    {
      number: 3,
      refNo: '62a850965c19bf00ee0cff84',
      submissionTime: '14th Jun 2022, 5:10:46 pm',
    },
    {
      number: 2,
      refNo: '62a82d0351f581005a8b4a62',
      submissionTime: '14th Jun 2022, 2:38:59 pm',
    },
    {
      number: 1,
      refNo: '62a77562c31573005bb95b93',
      submissionTime: '14th Jun 2022, 1:35:30 am',
    },
  ],
  [],
]

export const MOCK_MYINFO_FIELDS = MOCK_MYINFO_IMPLEMENTED_TYPES.map(
  (myInfoAttr, idx) => ({
    _id: idx.toString(),
    globalId: idx.toString(),
    ...getMyInfoFieldCreationMeta(myInfoAttr),
  }),
)

// NOTE: This should be used in public forms, whereas the above should be used in
// admin form preview.
// This is done to ensure that
// 1. Admin form preview previews the myInfo fields correctly (with mock values)
// 2. Public form has correct display of the myInfo fields with prefilled value
export const MOCK_PREFILLED_MYINFO_FIELDS = MOCK_MYINFO_FIELDS.map(
  augmentWithMyInfoDisplayValue,
)

export const MOCK_FORM_FIELDS_WITH_MYINFO = [
  ...MOCK_FORM_FIELDS,
  ...MOCK_MYINFO_FIELDS,
]

export const MOCK_FORM_LOGICS = [
  // Note: this logic is actually invalid since the if field cannot be a show
  // field at the same time. But it's fine just for the purposes of displaying
  // the hidden view.
  {
    show: MOCK_FORM_FIELDS_WITH_MYINFO.map((f) => f._id),
    _id: '620115f74ad4f00012900a8c',
    logicType: LogicType.ShowFields as const,
    conditions: [
      {
        ifValueType: LogicIfValue.SingleSelect,
        field: '5da04eb5e397fc0013f63c7e',
        state: LogicConditionState.Equal,
        value: 'Yes',
      },
    ],
  },
]
// https://github.com/lodash/lodash/issues/1313
// Arrays are merged by index, not overwritten so we need to use mergeWith
// with a customizer to enforce empty arrays.
export const createMockForm = (
  props: Partial<AdminFormDto> = {},
): AdminFormViewDto => {
  return {
    form: mergeWith(
      {
        _id: 'random-id' as FormId,
        isListed: true,
        startPage: {
          colorTheme: FormColorTheme.Blue,
          logo: { state: FormLogoState.Default },
        },
        endPage: {
          title: 'Thank you for filling out the form.',
          buttonText: 'Submit another form',
        },
        webhook: { url: '', isRetryEnabled: false },
        responseMode: FormResponseMode.Email,
        emails: ['test@example.com'],
        hasCaptcha: false,
        authType: FormAuthType.NIL,
        status: FormStatus.Public,
        inactiveMessage:
          'If you require further assistance, please contact the agency that gave you the form link.',
        submissionLimit: null,
        form_fields: [],
        form_logics: [],
        payments_channel: { channel: PaymentChannel.Unconnected },
        payments_field: { enabled: false },
        permissionList: [],
        title: 'Test form title',
        admin: {
          _id: 'fake-admin-id' as UserDto['_id'],
          email: 'admin@example.com',
          agency: {
            emailDomain: ['example.com'],
            _id: 'fake-agency-id' as AgencyId,
            shortName: 'eg',
            fullName: 'Example Agency',
            logo: '/path/to/logo',
            created: '2021-08-31T04:00:28.284Z' as DateString,
            lastModified: '2021-08-31T04:00:28.284Z' as DateString,
          },
          created: '2021-08-31T04:00:28.284Z' as DateString,
          lastAccessed: '2021-09-14T13:36:49.849Z' as DateString,
          updatedAt: '2021-08-31T04:00:28.287Z' as DateString,
        },
        created: '2021-08-31T04:05:18.241Z' as DateString,
        lastModified: '2021-09-14T07:23:56.581Z' as DateString,
      },
      props,
      (objValue, srcValue) => {
        if (Array.isArray(objValue) && srcValue.length === 0) {
          return srcValue
        }
      },
    ) as AdminFormDto,
  }
}

export const createFormBuilderMocks = (
  props: Partial<AdminFormDto> = {},
  delay: number | 'infinite' | 'real' = 0,
) => {
  const { form } = createMockForm(props)

  const getAdminFormResponse = (): ReturnType<(typeof rest)['get']> => {
    return rest.get<AdminFormViewDto>(
      '/api/v3/admin/forms/:formId',
      (req, res, ctx) => {
        return res(
          ctx.delay(delay),
          ctx.status(200),
          ctx.json({ form: { ...form, _id: req.params.formId as FormId } }),
        )
      },
    )
  }

  const createSingleField = () => {
    return rest.post<FieldCreateDto, { formId: string }, FormFieldDto>(
      '/api/v3/admin/forms/:formId/fields',
      (req, res, ctx) => {
        const newField = {
          ...req.body,
          _id: cuid(),
        } as FormFieldDto
        if (req.body.fieldType === BasicField.Table) {
          // eslint-disable-next-line @typescript-eslint/no-extra-semi
          ;(newField as TableFieldDto).columns = req.body.columns.map(
            (col) => ({
              ...col,
              _id: cuid(),
            }),
          )
        }
        const newIndex = parseInt(
          req.url.searchParams.get('to') ?? `${form.form_fields.length}`,
        )
        form.form_fields = insertAt(form.form_fields, newIndex, newField)
        return res(ctx.delay(delay), ctx.status(200), ctx.json(newField))
      },
    )
  }

  const updateSingleField = () => {
    return rest.put<
      FormFieldDto,
      { formId: string; fieldId: string },
      FormFieldDto
    >('/api/v3/admin/forms/:formId/fields/:fieldId', (req, res, ctx) => {
      const index = form.form_fields.findIndex(
        (field) => field._id === req.params.fieldId,
      )
      form.form_fields.splice(index, 1, req.body)
      return res(ctx.delay(delay), ctx.status(200), ctx.json(req.body))
    })
  }

  const reorderField = () => {
    return rest.post<
      Record<string, never>,
      { formId: string; fieldId: string },
      FormFieldDto[]
    >(
      '/api/v3/admin/forms/:formId/fields/:fieldId/reorder',
      (req, res, ctx) => {
        const fromIndex = form.form_fields.findIndex(
          (field) => field._id === req.params.fieldId,
        )
        form.form_fields = reorder(
          form.form_fields,
          fromIndex,
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          parseInt(req.url.searchParams.get('to')!),
        )
        return res(
          ctx.delay(delay),
          ctx.status(200),
          ctx.json(form.form_fields),
        )
      },
    )
  }

  const duplicateField = () => {
    return rest.post<
      Record<string, never>,
      { formId: string; fieldId: string },
      FormFieldDto
    >(
      '/api/v3/admin/forms/:formId/fields/:fieldId/duplicate',
      (req, res, ctx) => {
        const fieldToCopyIndex = form.form_fields.findIndex(
          (field) => field._id === req.params.fieldId,
        )
        const newField = {
          ...form.form_fields[fieldToCopyIndex],
          _id: cuid(),
        }
        form.form_fields.push(newField)
        return res(ctx.delay(delay), ctx.status(200), ctx.json(newField))
      },
    )
  }

  const deleteField = () => {
    return rest.delete<
      Record<string, never>,
      { formId: string; fieldId: string },
      FormFieldDto
    >('/api/v3/admin/forms/:formId/fields/:fieldId', (req, res, ctx) => {
      const fieldToDeleteIndex = form.form_fields.findIndex(
        (field) => field._id === req.params.fieldId,
      )
      form.form_fields.splice(fieldToDeleteIndex, 1)
      return res(ctx.delay(delay), ctx.status(200))
    })
  }

  return [
    getAdminFormResponse(),
    createSingleField(),
    updateSingleField(),
    reorderField(),
    duplicateField(),
    deleteField(),
  ]
}

export const getStorageSubmissionMetadataResponse = (
  props: Partial<SubmissionMetadataList> = {},
  delay: number | 'infinite' | 'real' = 0,
) => {
  return rest.get<SubmissionMetadataList>(
    '/api/v3/admin/forms/:formId/submissions/metadata',
    (req, res, ctx) => {
      const pageNum = parseInt(req.url.searchParams.get('page') ?? '1')
      return res(
        ctx.delay(delay),
        ctx.status(200),
        ctx.json<SubmissionMetadataList>(
          merge(
            {
              count: 39,
              metadata: DEFAULT_STORAGE_METADATA[pageNum - 1],
            },
            props,
          ),
        ),
      )
    },
  )
}

export const createLogic = (delay?: number | 'infinite') => {
  return rest.post<FormLogic>(
    '/api/v3/admin/forms/:formId/logic',
    (req, res, ctx) => {
      const newLogic = {
        ...req.body,
        _id: cuid(),
      }
      return res(ctx.delay(delay), ctx.status(200), ctx.json(newLogic))
    },
  )
}

export const deleteLogic = (delay?: number | 'infinite') => {
  return rest.delete(
    '/api/v3/admin/forms/:formId/logic/:logicId',
    (_req, res, ctx) => {
      return res(ctx.delay(delay), ctx.status(200))
    },
  )
}
