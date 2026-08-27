export const ONE_CODE_VERIFIER_COOKIE_NAME = 'oneCodeVerifier'
export const ONE_STATE_COOKIE_NAME = 'oneState'
export const ONE_NONCE_COOKIE_NAME = 'oneNonce'

// RATIONALE: rollout gate — one.gov.sg already verifies the user is a public
// officer (sub IS the verified gov email, ADR-0002), so this whitelist only
// controls rollout, not authentication.
export const ONE_USER_DOMAIN_WHITELIST = ['open.gov.sg']
