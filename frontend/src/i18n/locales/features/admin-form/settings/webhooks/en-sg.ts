export const enSG = {
  title: 'Webhooks',
  input: {
    label: 'Endpoint URL',
    description:
      'FormSG will POST encrypted form responses in real-time to the HTTPS endpoint specified here. Ensure that your external system can support the classification and sensitivity.',
    placeholder: 'https://your-webhook.com/url',
    validationError: 'Please enter a valid URL (starting with https://)',
  },
  retry: {
    label: 'Enable retries',
    description: `Your system must meet certain requirements before retries can be safely enabled. [Learn more]({url})`,
  },
  unsupportedMessage: {
    title: 'Webhooks are only available in storage mode',
    description:
      'Webhooks are useful for agencies who wish to have form response data sent directly to existing IT systems. This feature is only available in storage mode.',
    learnMore: 'Read more about webhooks',
  },
}
