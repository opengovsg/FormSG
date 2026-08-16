import {
  buildAdminFormErrorDto,
  getAdminFormErrorI18n,
} from '../admin-form.i18n'

describe('admin-form.i18n', () => {
  it('adds the matching i18n key while retaining fallback text', () => {
    const message = 'Field to modify not found'

    expect(buildAdminFormErrorDto(message)).toEqual({
      message,
      messageKey: 'features.adminForm.backendErrors.fields.notFound',
    })
  })

  it('extracts the whitelist file-size interpolation parameter', () => {
    expect(
      buildAdminFormErrorDto(
        'You have exceeded the file size limit, please upload a file below 250 kB.',
      ),
    ).toEqual({
      message:
        'You have exceeded the file size limit, please upload a file below 250 kB.',
      messageKey: 'features.adminForm.backendErrors.whitelist.fileTooLarge',
      messageParams: { limitKb: 250 },
    })
  })

  it('does not add a key to messages outside the catalogued admin errors', () => {
    expect(getAdminFormErrorI18n('Uncatalogued error')).toEqual({})
  })
})
