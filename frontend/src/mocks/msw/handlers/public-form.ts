import { merge } from 'lodash'
import { rest } from 'msw'
import { PartialDeep } from 'type-fest'

import { PublicFormDto, PublicFormViewDto } from '~shared/types/form/form'

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
  form_fields: [],
  form_logics: [],
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
  delay?: number
  overrides?: PartialDeep<PublicFormDto>
} = {}) => {
  return rest.get<PublicFormViewDto>(
    '/api/v3/forms/:formId',
    (req, res, ctx) => {
      const formId = req.params.formId ?? '61540ece3d4a6e50ac0cc6ff'

      const response: PublicFormViewDto = {
        form: merge({ _id: formId }, BASE_FORM, overrides) as PublicFormDto,
      }
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

export const publicFormHandlers = [
  getPublicFormResponse(),
  getCustomLogoResponse(),
]
