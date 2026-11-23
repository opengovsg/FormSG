import {
  EmailSourceFieldKind,
  EmailSources,
  emailSourcesToValues,
  emailValue,
  fieldValue,
  NEW_EMAIL_VALUE_PREFIX,
  valuesToEmailSources,
} from './emailSource'

const fieldKinds = new Map<string, EmailSourceFieldKind>([
  ['email-field', 'emailField'],
  ['dropdown-field', 'dropdownField'],
])

const NONE: EmailSources = { emails: [], emailFields: [], dropdownFields: [] }

describe('emailSourcesToValues', () => {
  it('lists typed emails as they are, and fields by their prefixed id', () => {
    expect(
      emailSourcesToValues({
        emails: ['jane@agency.gov.sg'],
        emailFields: ['email-field'],
        dropdownFields: ['dropdown-field'],
      }),
    ).toEqual([
      emailValue('jane@agency.gov.sg'),
      fieldValue('email-field'),
      fieldValue('dropdown-field'),
    ])
  })
})

describe('valuesToEmailSources', () => {
  it('splits a pasted list into one email each', () => {
    expect(
      valuesToEmailSources({
        previous: { ...NONE, emails: ['jane@agency.gov.sg'] },
        next: [
          emailValue('jane@agency.gov.sg'),
          `${NEW_EMAIL_VALUE_PREFIX}bob@agency.gov.sg,jane@agency.gov.sg,`,
        ],
        fieldKinds,
      }),
    ).toEqual({ ...NONE, emails: ['jane@agency.gov.sg', 'bob@agency.gov.sg'] })
  })

  it('keeps a typed email that looks like a field value', () => {
    expect(
      valuesToEmailSources({
        previous: NONE,
        next: [`${NEW_EMAIL_VALUE_PREFIX}field:x@agency.gov.sg`],
        fieldKinds,
      }),
    ).toEqual({ ...NONE, emails: ['field:x@agency.gov.sg'] })
  })

  it('keeps every source when one is added', () => {
    expect(
      valuesToEmailSources({
        previous: { ...NONE, emails: ['jane@agency.gov.sg'] },
        next: [
          emailValue('jane@agency.gov.sg'),
          fieldValue('dropdown-field'),
          fieldValue('email-field'),
        ],
        fieldKinds,
      }),
    ).toEqual({
      emails: ['jane@agency.gov.sg'],
      emailFields: ['email-field'],
      dropdownFields: ['dropdown-field'],
    })
  })

  it('keeps a deleted field under the kind it was saved as', () => {
    expect(
      valuesToEmailSources({
        previous: { ...NONE, emailFields: ['deleted'] },
        next: [fieldValue('deleted'), fieldValue('dropdown-field')],
        fieldKinds,
      }),
    ).toEqual({
      ...NONE,
      emailFields: ['deleted'],
      dropdownFields: ['dropdown-field'],
    })
  })
})
