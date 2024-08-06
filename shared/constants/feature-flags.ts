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
}
