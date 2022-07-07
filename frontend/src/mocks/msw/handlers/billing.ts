import { rest } from 'msw'

import { BillingInfoDto, FormAuthType, FormId } from '~shared/types'

const generateBillingMeta = (): BillingInfoDto => {
  return {
    loginStats: [
      {
        adminEmail: 'admin4@mock.gov.sg',
        formName: 'form1',
        formId: 'form1id' as FormId,
        authType: FormAuthType.SP,
        total: 5,
      },
      {
        adminEmail: 'admin3@mock.gov.sg',
        formName: 'form2',
        formId: 'form2id' as FormId,
        authType: FormAuthType.MyInfo,
        total: 2,
      },
      {
        adminEmail: 'admin1@mock.gov.sg',
        formName: 'form3',
        formId: 'form3id' as FormId,
        authType: FormAuthType.CP,
        total: 1,
      },
      {
        adminEmail: 'admin5@mock.gov.sg',
        formName: 'form4',
        formId: 'form4id' as FormId,
        authType: FormAuthType.SGID,
        total: 7,
      },
      {
        adminEmail: 'admin2@mock.gov.sg',
        formName:
          'form5 which is a form with a very long form name which requires multiple lines for testing purposes',
        formId: 'form5id' as FormId,
        authType: FormAuthType.NIL,
        total: 3,
      },
      {
        adminEmail: 'admin7@mock.gov.sg',
        formName: 'form6',
        formId: 'form6id' as FormId,
        authType: FormAuthType.SP,
        total: 5,
      },
      {
        adminEmail: 'admin3@mock.gov.sg',
        formName: 'form7',
        formId: 'form7id' as FormId,
        authType: FormAuthType.CP,
        total: 2,
      },
      {
        adminEmail: 'admin1@mock.gov.sg',
        formName: 'form8',
        formId: 'form8id' as FormId,
        authType: FormAuthType.SP,
        total: 3,
      },
      {
        adminEmail: 'admin7@mock.gov.sg',
        formName: 'form9',
        formId: 'form9id' as FormId,
        authType: FormAuthType.SGID,
        total: 14,
      },
      {
        adminEmail: 'admin5@mock.gov.sg',
        formName: 'form10',
        formId: 'form10id' as FormId,
        authType: FormAuthType.NIL,
        total: 9,
      },
      {
        adminEmail: 'admin8@mock.gov.sg',
        formName: 'form11',
        formId: 'form11id' as FormId,
        authType: FormAuthType.SP,
        total: 5,
      },
      {
        adminEmail: 'admin2@mock.gov.sg',
        formName: 'form12',
        formId: 'form12id' as FormId,
        authType: FormAuthType.CP,
        total: 12,
      },
      {
        adminEmail: 'admin2@mock.gov.sg',
        formName: 'form13',
        formId: 'form13id' as FormId,
        authType: FormAuthType.MyInfo,
        total: 8,
      },
    ],
  }
}

export const getBillingInfo = ({
  delay = 0,
}: {
  delay?: number | 'infinite'
} = {}) => {
  return rest.get<BillingInfoDto>('/api/v3/billings', (_req, res, ctx) => {
    return res(
      ctx.delay(delay),
      ctx.status(200),
      ctx.json(generateBillingMeta()),
    )
  })
}

export const getEmptyBillingInfo = () => {
  return rest.get<BillingInfoDto>('/api/v3/billings', (_req, res, ctx) => {
    return res(
      ctx.delay(0),
      ctx.status(200),
      ctx.json<BillingInfoDto>({
        loginStats: [],
      }),
    )
  })
}
