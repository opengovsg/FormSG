import { Joi } from 'celebrate'

import {
  attachErrorI18n,
  buildErrorDto,
  getCelebrateErrorI18n,
} from '../i18n-error'

describe('i18n-error', () => {
  it('retains an explicitly supplied i18n key and fallback text', () => {
    const message = 'Field to modify not found'

    expect(
      buildErrorDto({
        errorMessage: message,
        errorMessageKey: 'features.adminForm.backendErrors.fields.notFound',
      }),
    ).toEqual({
      message,
      messageKey: 'features.adminForm.backendErrors.fields.notFound',
    })
  })

  it('retains explicitly supplied interpolation parameters', () => {
    expect(
      buildErrorDto({
        errorMessage:
          'You have exceeded the file size limit, please upload a file below 250 kB.',
        errorMessageKey:
          'features.adminForm.backendErrors.whitelist.fileTooLarge',
        errorMessageParams: { limitKb: 250 },
      }),
    ).toEqual({
      message:
        'You have exceeded the file size limit, please upload a file below 250 kB.',
      messageKey: 'features.adminForm.backendErrors.whitelist.fileTooLarge',
      messageParams: { limitKb: 250 },
    })
  })

  it('reads i18n metadata attached directly to a Joi validation error', () => {
    const schema = attachErrorI18n(
      Joi.string().uri().message('Please enter a valid URI'),
      'features.adminForm.backendErrors.endPage.invalidUrl',
    )
    const detail = schema.validate('not-a-url').error?.details[0]

    expect(detail && getCelebrateErrorI18n(detail)).toEqual({
      messageKey: 'features.adminForm.backendErrors.endPage.invalidUrl',
    })
  })
})
