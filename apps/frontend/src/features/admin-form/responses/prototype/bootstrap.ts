import { http, HttpResponse } from 'msw'
import { setupWorker } from 'msw/browser'

import { BasicField, FormResponseMode, WorkflowType } from 'formsg-shared/types'

import { getEmptyAdminFormFeedback } from '~/mocks/msw/handlers/admin-form/feedback'
import {
  createMockForm,
  MOCK_FORM_FIELDS,
} from '~/mocks/msw/handlers/admin-form/form'
import { getEmptyAdminFormIssue } from '~/mocks/msw/handlers/admin-form/issue'
import { MOCK_USER } from '~/mocks/msw/handlers/user'

import {
  createPrototypeResponses,
  DEMO_ADMIN_EMAIL,
  DEMO_FORM_ID,
} from './model'

export async function startPrototype() {
  const responses = createPrototypeResponses()
  const user = {
    ...MOCK_USER,
    email: DEMO_ADMIN_EMAIL,
    _id: '6a0000000000000000000002',
  }
  const { form } = createMockForm({
    _id: DEMO_FORM_ID as never,
    title: 'Workflow actions demo',
    created: '2026-09-30T01:00:00.000Z' as never,
    lastModified: '2026-09-30T01:00:00.000Z' as never,
    admin: user as never,
    responseMode: FormResponseMode.Multirespondent,
    publicKey: 'prototype-no-key-required',
    form_fields: responses[0].answers.map((a) => ({
      ...MOCK_FORM_FIELDS.find(
        (field) => field.fieldType === BasicField.ShortText,
      )!,
      _id: a.id,
      title: a.label,
      fieldType: BasicField.ShortText,
      required: true,
      disabled: false,
    })) as never,
    workflow: responses[0].steps.map((step) => ({
      _id: step.id,
      step_name: step.name,
      workflow_type: WorkflowType.Static,
      emails: [...step.configuredRecipients],
      edit:
        step.number === 1
          ? responses[0].answers.map((answer) => answer.id)
          : [],
    })) as never,
  })
  const worker = setupWorker(
    http.get('/api/v3/user', () => HttpResponse.json(user)),
    http.get('/api/v3/client/env', () => HttpResponse.json({})),
    http.get('/api/v3/feature-flags/enabled', () => HttpResponse.json([])),
    http.get('/api/v3/admin/workspaces', () => HttpResponse.json([])),
    http.get('/api/v3/admin/forms', () => HttpResponse.json([form])),
    http.get('/api/v3/admin/forms/:formId', () => HttpResponse.json({ form })),
    http.get('/api/v3/admin/forms/:formId/gogov', () =>
      HttpResponse.json({ goLinkSuffix: '' }),
    ),
    http.get('/api/v3/admin/forms/:formId/collaborators', () =>
      HttpResponse.json([]),
    ),
    http.get('/api/v3/admin/forms/:formId/submissions/count', () =>
      HttpResponse.json(responses.length),
    ),
    getEmptyAdminFormFeedback(),
    getEmptyAdminFormIssue(),
    http.all('/api/*', ({ request }) =>
      HttpResponse.json(
        {
          message: `Unavailable in prototype: ${request.method} ${new URL(request.url).pathname}`,
        },
        { status: 403 },
      ),
    ),
  )
  await worker.start({
    quiet: true,
    onUnhandledRequest(request, print) {
      if (new URL(request.url).pathname.startsWith('/api/')) print.error()
    },
  })
  if (location.pathname === '/') history.replaceState(null, '', '/dashboard')
}
