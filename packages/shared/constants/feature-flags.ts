export const featureFlags = {
  turnstile: 'turnstile' as const,
  chartsMaxResponseCount: 'charts-max-response-count' as const,
  mrfWebhooksV4: 'mrf-webhooks-v4' as const,
  enableMrfWebhooks: 'enable-mrf-webhooks' as const,
  adminEmailPdf: 'admin-email-pdf' as const,
  ogpAwareness: 'ogp-awareness' as const,
  ddSampleRateAdmin: 'dd-sample-rate-admin' as const,
  ddSampleRatePublic: 'dd-sample-rate-public' as const,
  standardisedEmailTemplate: 'standardised-email-template' as const,
  mrfCutover: 'mrf-cutover' as const,
  enablePaperTrackingSetUpPage: 'enable-paper-tracking-set-up-page' as const,
  formIdJson: 'formid-json' as const,
  mrfPayments: 'mrf-payments' as const,
  workflowActions: 'workflow-actions' as const,
  workflowActionsSendBack: 'workflow-actions-send-back' as const,
  workflowActionsSendBackMisc: 'workflow-actions-send-back-misc' as const,
  workflowEmailSourceInput: 'workflow-email-source-input' as const,
  mrfChildren: 'mrf-children' as const,
  storageChildren: 'storage-children' as const,
  isNricFieldEnabled: 'is-nric-field-enabled' as const,
  mrfStepLogin: 'mrf-singpass-all-steps' as const,
  mrfStepLoginKillSwitch: 'mrf-step-login-kill-switch' as const,
  delightfulDashboard: 'delightful-dashboard' as const,
  escapeHatch: 'mrf-cutover-escape-hatch' as const,
  disableBouncedSubmissionSms: 'disable-bounced-submission-sms' as const,
  keepV4ResponseFormat: 'keep-v4-response-format' as const,
  paymentInfoFormat: 'payment-info-format' as const,
  paymentEmailLookup: 'payment-email-lookup' as const,
  settingsIntegrations: 'settings-integrations' as const,
  settingsIntegrationsJson: 'settings-integrations-json' as const,
  attachmentsMultiUploadAndOneZip:
    'attachments-multi-upload-and-one-zip' as const,
}

export enum AdminEmailPdfFeatureValue {
  OFF = 'OFF',
  SIGNATURES_ONLY = 'SIGNATURES_ONLY',
  ON = 'ON',
}

export enum WorkflowActionsSendBackMiscValue {
  OFF = 'OFF',
  FIX_STEP = 'FIX_STEP',
  CLEAR_ANSWERS = 'CLEAR_ANSWERS',
  BOTH = 'BOTH',
}

export const sendBackMiscAllowsFixStep = (value: unknown): boolean =>
  value === WorkflowActionsSendBackMiscValue.FIX_STEP ||
  value === WorkflowActionsSendBackMiscValue.BOTH

export const sendBackMiscAllowsClearAnswers = (value: unknown): boolean =>
  value === WorkflowActionsSendBackMiscValue.CLEAR_ANSWERS ||
  value === WorkflowActionsSendBackMiscValue.BOTH
