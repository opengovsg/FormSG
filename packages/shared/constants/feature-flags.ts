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
  saveDraft: 'save-draft' as const,
  respondentCopy: 'respondent-copy' as const,
  statusTracker: 'status-tracker' as const,
  designDrawerFormTitle: 'design-drawer-form-title' as const,
  adminPrintPdf: 'admin-print-pdf' as const,
  ogpSuiteSso: 'ogp-suite-sso' as const,
  enableIntranetSgidLogin: 'enable-intranet-sgid-login' as const,
  enableMrfWebhooks: 'enable-mrf-webhooks' as const,
  useFormsgEsrvcId: 'use-formsg-esrvcid' as const,
  lambdaPdfGeneration: 'lambda-pdf-generation' as const,
  singpassMrf: 'singpass-mrf' as const,
  enableSaveDraftButtonFloating: 'enable-save-draft-button-floating' as const,
  enableSaveDraftButtonHeader: 'enable-save-draft-button-header' as const,
  adminEmailPdf: 'admin-email-pdf' as const,
  ogpHeader: 'enable-ogp-header' as const,
  ogpAwareness: 'ogp-awareness' as const,
  ogpSpinner: 'ogp-spinner' as const,
  wogadLogin: 'wogad-login' as const,
  mrfResponseLimit: 'mrf-response-limit' as const,
  useTemplateFrame: 'use-template-frame' as const,
  useTemplateTour: 'use-template-tour' as const,
  useTemplateWallScroll: 'use-template-wall-scroll' as const,
  useTemplateWallSubmit: 'use-template-wall-submit' as const,
  ddSampleRateAdmin: 'dd-sample-rate-admin' as const,
  ddSampleRatePublic: 'dd-sample-rate-public' as const,
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
