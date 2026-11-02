import { http, HttpResponse } from 'msw'

import { PUBLIC_PAYMENTS_GUIDE_LINK } from 'formsg-shared/constants'
import { SmsCountsDto } from 'formsg-shared/types/form'

import { getAdminForms } from './admin-form/form'
import { getAdminFormStripeValidate } from './admin-form/settings'
import { getUser } from './user'
import { getWorkspaces } from './workspace'

/**
 * App-wide endpoints answered for every story. A story's own handlers take
 * precedence, so these only fill in for endpoints a story leaves unmocked.
 */
export const fallbackHandlers = [
  getUser(),
  getAdminForms.empty(),
  getWorkspaces({ mockWorkspaces: [] }),
  getAdminFormStripeValidate(),
  http.get('/api/v3/admin/forms/guide/payments', () =>
    HttpResponse.json(PUBLIC_PAYMENTS_GUIDE_LINK),
  ),
  http.get('/api/v3/admin/forms/:formId/gogov', () =>
    HttpResponse.json({ message: 'Not found' }, { status: 404 }),
  ),
  http.get<{ formId: string }, never, SmsCountsDto>(
    '/api/v3/admin/forms/:formId/verified-sms/count',
    () => HttpResponse.json({ quota: 10000, smsCounts: 0 }),
  ),
  ...['is-intranet-check', 'is-ogp-check', 'is-rbi-check'].map((check) =>
    http.get(`/api/v3/intranet/${check}`, () => HttpResponse.json(false)),
  ),
]
