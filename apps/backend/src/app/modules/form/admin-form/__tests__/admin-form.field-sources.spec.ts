import type { RequestHandler } from 'express'
import { BasicField } from 'formsg-shared/types'
import { createMocks } from 'node-mocks-http'

import {
  handleCreateFormField,
  handleUpdateFormField,
} from '../admin-form.controller'

const fieldId = '6aba594556cd468621fcb1cc'
const ordinaryField = {
  fieldType: BasicField.Nric,
  title: 'NRIC / FIN',
  description: '',
  required: true,
  disabled: false,
}

const validate = (
  handler: RequestHandler,
  method: 'POST' | 'PUT',
  body: Record<string, unknown>,
) => {
  const { req, res } = createMocks({ method, params: { fieldId }, body })
  return new Promise<unknown>((resolve) => handler(req, res, resolve))
}

// Exercise the actual request validator so adding schemas cannot enable authoring.
describe.each([
  ['create', 'POST' as const, handleCreateFormField[0], {}],
  ['update', 'PUT' as const, handleUpdateFormField[0], { _id: fieldId }],
])(
  'Identity source authoring stays disabled on %s',
  (_, method, handler, extraBody) => {
    it.each([
      [BasicField.Nric, undefined, undefined, false],
      [BasicField.ShortText, { attr: 'name' }, undefined, false],
      [BasicField.Nric, { attr: 'uinfin' }, undefined, true],
      [BasicField.Uen, undefined, { attr: 'uen' }, true],
      [BasicField.ShortText, undefined, { attr: 'uid' }, true],
    ])(
      'validates %s with MyInfo %j and Corppass %j',
      async (fieldType, myInfo, corppass, rejected) => {
        const error = await validate(handler as RequestHandler, method, {
          ...ordinaryField,
          ...extraBody,
          fieldType,
          myInfo,
          corppass,
        })
        expect(Boolean(error)).toBe(rejected)
      },
    )
  },
)
