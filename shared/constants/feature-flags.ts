export const featureFlags = {
  payment: 'payment' as const,
  goLinks: 'goLinks' as const,
  turnstile: 'turnstile' as const,
  validateStripeEmailDomain: 'validateStripeEmailDomain' as const,
  encryptionBoundaryShift: 'encryption-boundary-shift' as const,
  encryptionBoundaryShiftHardValidation:
    'encryption-boundary-shift-hard-validation' as const,
  encryptionBoundaryShiftVirusScanner:
    'encryption-boundary-shift-virus-scanner' as const,
  myinfoSgid: 'myinfo-sgid' as const,
}
