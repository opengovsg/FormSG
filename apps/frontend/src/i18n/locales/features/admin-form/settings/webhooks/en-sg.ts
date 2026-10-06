export const enSG = {
  title: 'Webhooks',
  legacy: {
    label: 'Use legacy webhooks',
    description:
      'Legacy webhooks only work with forms that have at most one workflow step.',
    saved: 'Webhook format updated',
  },
  legacyStorageNotice:
    'This form uses legacy webhooks. To use the latest webhooks, [duplicate this form]({guideUrl}) to the latest version of FormSG. If your system can only read legacy webhooks, no change is needed.',
  legacyWorkflowUnsupported:
    'Legacy webhooks only work with forms that have at most one workflow step. Turn off "Use legacy webhooks" or reduce the workflow to one step.',
  workflowUnsupported:
    'Forms with two or more steps only support Plumber webhooks, which must be connected through [Plumber]({plumberUrl}). Reduce your workflow to one step to enter a webhook URL here.',
  remove: 'Remove webhook',
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
  plumberConnected: {
    title: 'This form is connected to Plumber',
    body: 'A Plumber webhook is set for this form, so response data is sent to Plumber. Manage the connection in <plumberLink>Plumber</plumberLink>.',
  },
}
