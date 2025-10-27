import { Share } from '.'

export const enSG: Share = {
  modal: {
    header: 'Share form',
  },
  tabs: {
    link: 'Link',
    template: 'Template',
    embed: 'Embed',
  },
  formActivation: {
    message:
      'This form is currently closed to new responses. Activate your form in <settingsLink>Settings</settingsLink> to allow new responses or to share it as a template.',
  },
  formLink: {
    label: 'Form link',
    copyAriaLabel: 'Copy respondent form link',
    openAriaLabel: 'Open link in new tab',
  },
  template: {
    label: 'Share template',
    copyAriaLabel: 'Copy link to use this form as a template',
  },
  embed: {
    label: 'Embed HTML',
    copyAriaLabel: 'Copy HTML code for embedding this form',
    fallbackText: 'If the form below is not loaded, you can also fill it in at',
    here: 'here',
    poweredBy: 'Powered by',
  },
  goLink: {
    label: 'Go link',
    description:
      'Create an official short link and share it over the Internet.',
    claim: 'Claim',
    claimAriaLabel: 'Claim Go link',
    copyAriaLabel: 'Copy respondent form link',
    success: {
      text: 'You have successfully claimed this link. This link will appear in your <goAccountLink>Go account</goAccountLink>',
    },
    errors: {
      validation:
        'Short links should only consist of lowercase letters, numbers and hyphens.',
      alreadyExists: 'Short link is already in use.',
      unexpected:
        'Something went wrong. Try refreshing this page. If this issue persists, contact support@form.gov.sg.',
    },
  },
}
