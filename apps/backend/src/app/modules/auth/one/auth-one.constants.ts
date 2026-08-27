export const ONE_CODE_VERIFIER_COOKIE_NAME = 'oneCodeVerifier'
export const ONE_STATE_COOKIE_NAME = 'oneState'
export const ONE_NONCE_COOKIE_NAME = 'oneNonce'

// RATIONALE: rollout gate — one.gov.sg already verifies the user is a public
// officer (sub IS the verified gov email, ADR-0002), so this whitelist only
// controls rollout, not authentication.
// TODO: replace with the real one.gov.sg-onboarded agency domain(s) before
// enabling this login flow. This placeholder matches no real email domain, so
// the flow fails closed until it's replaced. Kept lowercase because emails are
// lowercased before the whitelist check.
export const ONE_USER_DOMAIN_WHITELIST = ['replace-me-one-domain']
