export const enSG = {
  title: 'Webhooks',
  input: {
    label: 'Endpoint URL',
    description:
      'FormSG will POST the entire encrypted form response in real-time to the HTTPS endpoint specified. Ensure that the external system can support the classification and sensitivity.',
  },
  retry: {
    label: 'Enable retries',
    description: `Your system must meet certain requirements before retries can be safely enabled. [Learn more]({url})`,
  },
}
