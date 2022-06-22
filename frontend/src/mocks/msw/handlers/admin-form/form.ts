import cuid from 'cuid'
import { merge } from 'lodash'
import { rest } from 'msw'

import { AgencyId } from '~shared/types/agency'
import {
  AttachmentSize,
  BasicField,
  FieldCreateDto,
  FormFieldDto,
  RatingShape,
  TableFieldDto,
} from '~shared/types/field'
import { FormLogic } from '~shared/types/form'
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
import { StorageModeSubmissionMetadataList } from '~shared/types/submission'
import { UserDto } from '~shared/types/user'
import { insertAt, reorder } from '~shared/utils/immutable-array-fns'

import { getMyInfoFieldCreationMeta } from '~/features/admin-form/create/builder-and-design/utils/fieldCreation'

import {
  CREATE_MYINFO_CONTACT_FIELDS_ORDERED,
  CREATE_MYINFO_MARRIAGE_FIELDS_ORDERED,
  CREATE_MYINFO_PARTICULARS_FIELDS_ORDERED,
  CREATE_MYINFO_PERSONAL_FIELDS_ORDERED,
} from '~features/admin-form/create/builder-and-design/constants'

export const MOCK_MYINFO_IMPLEMENTED_TYPES = [
  ...CREATE_MYINFO_PERSONAL_FIELDS_ORDERED,
  ...CREATE_MYINFO_CONTACT_FIELDS_ORDERED,
  ...CREATE_MYINFO_PARTICULARS_FIELDS_ORDERED,
  ...CREATE_MYINFO_MARRIAGE_FIELDS_ORDERED,
]

export const MOCK_FORM_FIELDS: FormFieldDto[] = [
  {
    title: 'Yes/No',
    description: '',
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
      customVal: null,
      selectedValidation: null,
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

export const MOCK_FORM_FIELDS_WITH_MYINFO = [
  ...MOCK_FORM_FIELDS,
  ...MOCK_MYINFO_IMPLEMENTED_TYPES.map((myInfoAttr, idx) => ({
    _id: idx.toString(),
    globalId: idx.toString(),
    ...getMyInfoFieldCreationMeta(myInfoAttr),
  })),
]

export const createMockForm = (
  props: Partial<AdminFormDto> = {},
): AdminFormViewDto => {
  return {
    form: merge(
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
          'If you think this is a mistake, please contact the agency that gave you the form link!',
        submissionLimit: null,
        form_fields: [],
        form_logics: [],
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
    ) as AdminFormDto,
  }
}

export const createFormBuilderMocks = (
  props: Partial<AdminFormDto> = {},
  delay: number | 'infinite' | 'real' = 500,
) => {
  const { form } = createMockForm(props)

  const getAdminFormResponse = (): ReturnType<typeof rest['get']> => {
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
  props: Partial<StorageModeSubmissionMetadataList> = {},
  delay: number | 'infinite' | 'real' = 0,
) => {
  return rest.get<StorageModeSubmissionMetadataList>(
    '/api/v3/admin/forms/:formId/submissions/metadata',
    (req, res, ctx) => {
      return res(
        ctx.delay(delay),
        ctx.status(200),
        ctx.json<StorageModeSubmissionMetadataList>(
          merge(
            {
              count: 0,
              metadata: [],
            },
            props,
          ),
        ),
      )
    },
  )
}

export const createLogic = (delay?: number) => {
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

export const deleteLogic = (delay?: number) => {
  return rest.delete(
    '/api/v3/admin/forms/:formId/logic/:logicId',
    (_req, res, ctx) => {
      return res(ctx.delay(delay), ctx.status(200))
    },
  )
}
