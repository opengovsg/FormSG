import { DefaultRequestBody, MockedRequest, rest, RestHandler } from 'msw'

import {
  FormAuthType,
  FormResponseMode,
  FormSettings,
  FormStatus,
} from '~shared/types/form/form'

export const BASE_MOCK_FORM_SETTINGS: FormSettings = {
  responseMode: FormResponseMode.Email,
  authType: FormAuthType.NIL,
  hasCaptcha: true,
  inactiveMessage:
    'If you think this is a mistake, please contact the agency that gave you the form link.',
  status: FormStatus.Public,
  submissionLimit: null,
  title: 'This is a test form',
  webhook: { url: '', isRetryEnabled: false },
  emails: ['test@example.com'],
}

// Function to return specific form settings.
export const getExpectedSettings = (
  settingsToReturn: FormSettings,
  delay = 0,
): RestHandler<MockedRequest<DefaultRequestBody>> => {
  return rest.get('/api/v3/admin/forms/:formId/settings', (_req, res, ctx) => {
    return res(ctx.delay(delay), ctx.status(200), ctx.json(settingsToReturn))
  })
}

export const testSettingsHandlers = [
  getExpectedSettings(BASE_MOCK_FORM_SETTINGS),
]

// Mock delay for mocked handlers in development.
export const settingsHandlers = [
  getExpectedSettings(BASE_MOCK_FORM_SETTINGS, undefined),
]
