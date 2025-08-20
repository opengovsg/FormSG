export const featureFlags = {
  payment: 'payment' as const,
  goLinks: 'goLinks' as const,
  turnstile: 'turnstile' as const,
  validateStripeEmailDomain: 'validateStripeEmailDomain' as const,
  /**
   * @deprecated since 2024-Aug-02
   * On growthbook, kept permenently ON for all ENV
   * */
  myinfoSgid: 'myinfo-sgid' as const,
  chartsMaxResponseCount: 'charts-max-response-count' as const,
  addingTwilioDisabled: 'adding-twilio-disabled' as const,
  postmanSms: 'postmanSms' as const,
  mfb: 'magic-form-builder' as const,
  mfbVision: 'magic-form-builder-vision' as const,
  guardduty: 'guardduty' as const,
  respondentCopy: 'respondent-copy' as const,
  statusTracker: 'status-tracker' as const,
  designDrawerFormTitle: 'design-drawer-form-title' as const,
  signatureField: 'signature-field' as const,
  ogpSuiteSso: 'ogp-suite-sso' as const,
  enableIntranetSgidLogin: 'enable-intranet-sgid-login' as const,
  enableMrfWebhooks: 'enable-mrf-webhooks' as const,
}
