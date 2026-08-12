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
  error: {
    title: "Couldn't load webhook settings",
    body: "Something went wrong while loading this form's settings. This does not affect your form or its responses. Please try again.",
    button: {
      label: 'Try again',
      loadingText: 'Trying again…',
    },
  },
}
