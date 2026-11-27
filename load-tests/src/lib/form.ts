import { check } from 'k6'
import { RefinedResponse, ResponseType } from 'k6/http'

import { apiGet, apiGetBatch, apiPostMultipart } from './client'

export interface PublicField {
  _id: string
  fieldType: string
  title: string
  fieldOptions?: string[]
}

interface FieldResponse {
  _id: string
  fieldType: string
  question: string
  answer?: string
  answerArray?: string[]
}

const STORAGE_SUBMISSION_VERSION = 2.1

function parse<T>(res: RefinedResponse<ResponseType>): T | undefined {
  if (typeof res.body !== 'string') {
    return undefined
  }
  try {
    return JSON.parse(res.body) as T
  } catch (e) {
    return undefined
  }
}

function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)]
}

export function openFormPage(formId: string): PublicField[] | undefined {
  const htmlRes = apiGet('/:formId', `/${formId}`)
  check(htmlRes, { 'form page html loaded': (r) => r.status === 200 })

  const [envRes, flagsRes, formRes] = apiGetBatch([
    { name: '/api/v3/client/env', path: '/api/v3/client/env' },
    {
      name: '/api/v3/feature-flags/enabled',
      path: '/api/v3/feature-flags/enabled',
    },
    { name: '/api/v3/forms/:formId', path: `/api/v3/forms/${formId}` },
  ])
  check(envRes, { 'client env loaded': (r) => r.status === 200 })
  check(flagsRes, { 'feature flags loaded': (r) => r.status === 200 })

  const fields = parse<{ form?: { form_fields?: PublicField[] } }>(formRes)
    ?.form?.form_fields
  if (
    !check(formRes, {
      'form loaded with fields': (r) =>
        r.status === 200 && !!fields && fields.length > 0,
    }) ||
    !fields
  ) {
    return undefined
  }
  return fields
}

function answer(field: PublicField): FieldResponse | undefined {
  const base = {
    _id: field._id,
    fieldType: field.fieldType,
    question: field.title,
  }
  const options = field.fieldOptions ?? []
  switch (field.fieldType) {
    case 'textfield':
    case 'textarea':
      return { ...base, answer: 'Load test answer' }
    case 'number':
      return { ...base, answer: '42' }
    case 'yes_no':
      return { ...base, answer: 'Yes' }
    case 'radiobutton':
    case 'dropdown':
      return options.length > 0 ? { ...base, answer: pick(options) } : undefined
    case 'checkbox':
      return options.length > 0
        ? { ...base, answerArray: [pick(options)] }
        : undefined
    default:
      return undefined
  }
}

export function submitStorage(formId: string, fields: PublicField[]): void {
  const responses = fields.map(answer)
  if (
    !check(responses, {
      'fixture fields are all answerable': (all) =>
        all.every((r) => r !== undefined),
    })
  ) {
    return
  }

  const res = apiPostMultipart(
    '/api/v3/forms/:formId/submissions/storage',
    `/api/v3/forms/${formId}/submissions/storage?captchaResponse=null&captchaType=`,
    {
      body: JSON.stringify({
        responses,
        responseMetadata: {
          responseTimeMs: 30000,
          numVisibleFields: fields.length,
        },
        version: STORAGE_SUBMISSION_VERSION,
      }),
    },
  )
  check(res, {
    'submission accepted': (r) =>
      r.status === 200 &&
      typeof r.body === 'string' &&
      r.body.indexOf('"submissionId"') !== -1,
  })
}
