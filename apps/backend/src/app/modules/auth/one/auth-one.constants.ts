// RATIONALE: registered with the one.gov.sg IdP as this client's fixed
// redirect URI. openid-client does not infer redirect_uri from client
// metadata — it must be passed explicitly on every authorization request and
// must match exactly, or the IdP rejects with invalid_redirect.
export const ONE_LOGIN_CALLBACK_PATH = '/api/v3/auth/one/login/callback'

export const ONE_CODE_VERIFIER_COOKIE_NAME = 'oneCodeVerifier'
export const ONE_STATE_COOKIE_NAME = 'oneState'
export const ONE_NONCE_COOKIE_NAME = 'oneNonce'

// RATIONALE: rollout gate — one.gov.sg already verifies the user is a public
// officer (sub IS the verified gov email, ADR-0002), so this whitelist only
// controls rollout, not authentication.
export const ONE_USER_DOMAIN_WHITELIST = ['open.gov.sg']
