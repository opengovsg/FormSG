export const featureFlags = {
  payment: 'payment' as const,
  turnstile: 'turnstile' as const,
  validateStripeEmailDomain: 'validateStripeEmailDomain' as const,
  chartsMaxResponseCount: 'charts-max-response-count' as const,
  postmanSms: 'postmanSms' as const,
  enableIntranetSgidLogin: 'enable-intranet-sgid-login' as const,
  mrfWebhooksV4: 'mrf-webhooks-v4' as const,
  enableMrfWebhooks: 'enable-mrf-webhooks' as const,
  spcpOidcStateNonce: 'spcp-oidc-state-nonce' as const,
  adminEmailPdf: 'admin-email-pdf' as const,
  ogpAwareness: 'ogp-awareness' as const,
  wogadLogin: 'wogad-login' as const,
  mrfResponseLimit: 'mrf-response-limit' as const,
  ddSampleRateAdmin: 'dd-sample-rate-admin' as const,
  ddSampleRatePublic: 'dd-sample-rate-public' as const,
  standardisedEmailTemplate: 'standardised-email-template' as const,
  mrfCutover: 'mrf-cutover' as const,
  enablePaperTrackingSetUpPage: 'enable-paper-tracking-set-up-page' as const,
  sidebarNavLabels: 'enable-sidebar-nav-labels' as const,
  formIdJson: 'formid-json' as const,
  mrfPayments: 'mrf-payments' as const,
  workflowActions: 'workflow-actions' as const,
  workflowActionsSendBack: 'workflow-actions-send-back' as const,
  mrfChildren: 'mrf-children' as const,
  isNricFieldEnabled: 'is-nric-field-enabled' as const,
  mrfStepLogin: 'mrf-singpass-all-steps' as const,
  mrfStepLoginKillSwitch: 'mrf-step-login-kill-switch' as const,
  delightfulDashboard: 'delightful-dashboard' as const,
  escapeHatch: 'mrf-cutover-escape-hatch' as const,
  disableBouncedSubmissionSms: 'disable-bounced-submission-sms' as const,
  keepV4AttachmentPrefix: 'keep-v4-attachment-prefix' as const,
}

export enum AdminEmailPdfFeatureValue {
  OFF = 'OFF',
  SIGNATURES_ONLY = 'SIGNATURES_ONLY',
  ON = 'ON',
}

export enum WogadLoginFeatureValue {
  OFF = 'OFF',
  ALL = 'ALL', // all users on public ip, rbi and intranet ip
  INTRANET_AND_RBI_ONLY = 'INTRANET_AND_RBI_ONLY',
}
