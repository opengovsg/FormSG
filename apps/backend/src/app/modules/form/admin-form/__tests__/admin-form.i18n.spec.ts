import { Joi } from 'celebrate'

import {
  adminFormErrorKey,
  attachAdminFormErrorI18n,
  buildAdminFormErrorDto,
  getCelebrateErrorI18n,
} from '../admin-form.i18n'

describe('admin-form.i18n', () => {
  it('retains an explicitly supplied i18n key and fallback text', () => {
    const message = 'Field to modify not found'

    expect(
      buildAdminFormErrorDto(message, adminFormErrorKey('fields.notFound')),
    ).toEqual({
      message,
      messageKey: 'features.adminForm.backendErrors.fields.notFound',
    })
  })

  it('retains explicitly supplied interpolation parameters', () => {
    expect(
      buildAdminFormErrorDto(
        'You have exceeded the file size limit, please upload a file below 250 kB.',
        adminFormErrorKey('whitelist.fileTooLarge'),
        { limitKb: 250 },
      ),
    ).toEqual({
      message:
        'You have exceeded the file size limit, please upload a file below 250 kB.',
      messageKey: 'features.adminForm.backendErrors.whitelist.fileTooLarge',
      messageParams: { limitKb: 250 },
    })
  })

  it('reads i18n metadata attached directly to a Joi validation error', () => {
    const schema = attachAdminFormErrorI18n(
      Joi.string().uri().message('Please enter a valid URI'),
      adminFormErrorKey('endPage.invalidUrl'),
    )
    const detail = schema.validate('not-a-url').error?.details[0]

    expect(detail && getCelebrateErrorI18n(detail)).toEqual({
      messageKey: 'features.adminForm.backendErrors.endPage.invalidUrl',
    })
  })
})
