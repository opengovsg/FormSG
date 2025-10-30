import { PreviewFormBanner } from '.'

export const enSG: PreviewFormBanner = {
  templatePreview: 'Template Preview',
  formPreview: 'Form Preview',
  backToDashboardAriaLabel: 'Click to return to the admin dashboard',
  backToFormSG: 'Back to FormSG',
  useTemplateAriaLabel: 'Click to use this template',
  useTemplate: 'Use this template',
  templateActionsAriaLabel: 'Template preview actions',
  paymentWarning: {
    production: {
      prefix: 'To test your payment form, replicate this form on our ',
      linkText: 'testing platform.',
    },
    nonProduction:
      'You will not be able to make a test payment, or view submitted answers or attachments in Form Preview mode. Open your form to make a test payment or form submission.',
  },
  previewWarning: {
    withoutPayment:
      'You will not be able to view submitted answers or attachments in Form Preview mode. Open your form to test a form submission.',
  },
}
