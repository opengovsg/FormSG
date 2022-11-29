import { MyInfoMode } from '@opengovsg/myinfo-gov-client'
import convict, { Schema } from 'convict'
import { url } from 'convict-format-with-validator'

const HOUR_IN_MILLIS = 1000 * 60 * 60
const DAY_IN_MILLIS = 24 * HOUR_IN_MILLIS

type ISpcpConfig = {
  isSPMaintenance: string
  isCPMaintenance: string
  myInfoBannerContent: string
  spCookieMaxAge: number
  spCookieMaxAgePreserved: number
  spcpCookieDomain: string
  cpCookieMaxAge: number
  spIdpId: string
  cpIdpId: string
  spPartnerEntityId: string
  cpPartnerEntityId: string
  spIdpLoginUrl: string
  cpIdpLoginUrl: string
  spIdpEndpoint: string
  cpIdpEndpoint: string
  spEsrvcId: string
  cpEsrvcId: string
  spFormSgKeyPath: string
  cpFormSgKeyPath: string
  spFormSgCertPath: string
  cpFormSgCertPath: string
  spIdpCertPath: string
  cpIdpCertPath: string
  spOidcNdiDiscoveryEndpoint: string
  spOidcNdiJwksEndpoint: string
  spOidcRpClientId: string
  spOidcRpRedirectUrl: string
  spOidcRpJwksPublicPath: string
  spOidcRpJwksSecretPath: string
  cpOidcNdiDiscoveryEndpoint: string
  cpOidcNdiJwksEndpoint: string
  cpOidcRpClientId: string
  cpOidcRpRedirectUrl: string
  cpOidcRpJwksPublicPath: string
  cpOidcRpJwksSecretPath: string
}

type IMyInfoConfig = {
  myInfoClientMode: MyInfoMode
  myInfoKeyPath: string
  myInfoCertPath: string
  myInfoClientId: string
  myInfoClientSecret: string
  myInfoJwtSecret: string
}

// Config of MyInfo is coupled to that of Singpass
// due to MyInfo's sharing of spCookieMaxAge. Therefore
// export both together.
export type ISpcpMyInfo = ISpcpConfig & IMyInfoConfig

convict.addFormat(url)

const spcpMyInfoSchema: Schema<ISpcpMyInfo> = {
  isSPMaintenance: {
    doc: 'If set, displays a banner message on SingPass forms. Overrides IS_CP_MAINTENANCE',
    format: '*',
    default: null,
    env: 'IS_SP_MAINTENANCE',
  },
  isCPMaintenance: {
    doc: 'If set, displays a banner message on CorpPass forms',
    format: '*',
    default: null,
    env: 'IS_CP_MAINTENANCE',
  },
  myInfoBannerContent: {
    doc: 'If set, displays a banner message on MyInfo forms',
    format: '*',
    default: null,
    env: 'MYINFO_BANNER_CONTENT',
  },
  spCookieMaxAge: {
    doc: 'Max SingPass cookie age with remember me unchecked',
    format: 'int',
    default: 3 * HOUR_IN_MILLIS,
    env: 'SP_COOKIE_MAX_AGE',
  },
  spCookieMaxAgePreserved: {
    doc: 'Max SingPass cookie age with remember me checked',
    format: 'int',
    default: 30 * DAY_IN_MILLIS,
    env: 'SPCP_COOKIE_MAX_AGE_PRESERVED',
  },
  spcpCookieDomain: {
    doc: 'Domain name set on cookie that holds the SPCP jwt',
    format: String,
    default: '',
    env: 'SPCP_COOKIE_DOMAIN',
  },
  cpCookieMaxAge: {
    doc: 'Max CorpPass cookie age',
    format: 'int',
    default: 6 * HOUR_IN_MILLIS,
    env: 'CP_COOKIE_MAX_AGE',
  },
  spIdpId: {
    doc: 'Partner ID of National Digital Identity Office for SingPass authentication',
    format: 'url',
    default: null,
    env: 'SINGPASS_IDP_ID',
  },
  cpIdpId: {
    doc: 'Partner ID of National Digital Identity Office for CorpPass authentication',
    format: 'url',
    default: null,
    env: 'CORPPASS_IDP_ID',
  },
  spPartnerEntityId: {
    doc: 'Partner ID registered with National Digital Identity Office for SingPass authentication',
    format: 'url',
    default: null,
    env: 'SINGPASS_PARTNER_ENTITY_ID',
  },
  cpPartnerEntityId: {
    doc: 'Partner ID registered with National Digital Identity Office for CorpPass authentication',
    format: 'url',
    default: null,
    env: 'CORPPASS_PARTNER_ENTITY_ID',
  },
  spIdpLoginUrl: {
    doc: 'URL of SingPass Login Page',
    format: 'url',
    default: null,
    env: 'SINGPASS_IDP_LOGIN_URL',
  },
  cpIdpLoginUrl: {
    doc: 'URL of CorpPass Login Page',
    format: 'url',
    default: null,
    env: 'CORPPASS_IDP_LOGIN_URL',
  },
  spIdpEndpoint: {
    doc: 'URL to retrieve NRIC of SingPass-validated user from',
    format: 'url',
    default: null,
    env: 'SINGPASS_IDP_ENDPOINT',
  },
  cpIdpEndpoint: {
    doc: 'URL to retrieve UEN of CorpPass-validated user from',
    format: 'url',
    default: null,
    env: 'CORPPASS_IDP_ENDPOINT',
  },
  spEsrvcId: {
    doc: 'e-service ID registered with National Digital Identity office for SingPass authentication',
    format: String,
    default: null,
    env: 'SINGPASS_ESRVC_ID',
  },
  cpEsrvcId: {
    doc: 'e-service ID registered with National Digital Identity office for CorpPass authentication',
    format: String,
    default: null,
    env: 'CORPPASS_ESRVC_ID',
  },
  spFormSgKeyPath: {
    doc: 'Path to X.509 key used for SingPass related communication with National Digital Identity office',
    format: String,
    default: null,
    env: 'SP_FORMSG_KEY_PATH',
  },
  cpFormSgKeyPath: {
    doc: 'Path to X.509 key used for CorpPass related communication with National Digital Identity office',
    format: String,
    default: null,
    env: 'CP_FORMSG_KEY_PATH',
  },
  spFormSgCertPath: {
    doc: 'Path to X.509 cert used for SingPass related communication with National Digital Identity office',
    format: String,
    default: null,
    env: 'SP_FORMSG_CERT_PATH',
  },
  cpFormSgCertPath: {
    doc: 'Path to X.509 cert used for CorpPass related communication with National Digital Identity office',
    format: String,
    default: null,
    env: 'CP_FORMSG_CERT_PATH',
  },
  spIdpCertPath: {
    doc: 'Path to National Digital Identity offices X.509 cert used for SingPass related communication',
    format: String,
    default: null,
    env: 'SP_IDP_CERT_PATH',
  },
  cpIdpCertPath: {
    doc: 'Path to National Digital Identity offices X.509 cert used for CorpPass related communication',
    format: String,
    default: null,
    env: 'CP_IDP_CERT_PATH',
  },
  myInfoClientMode: {
    doc: 'Configures MyInfoGovClient. Set this to either `stg` or `prod` to fetch MyInfo data from the corresponding endpoints.',
    format: Object.values(MyInfoMode),
    default: MyInfoMode.Production,
    env: 'MYINFO_CLIENT_CONFIG',
  },
  myInfoKeyPath: {
    doc: 'Filepath to MyInfo private key, which is used to decrypt data and sign requests when communicating with MyInfo.',
    format: String,
    default: null,
    env: 'MYINFO_FORMSG_KEY_PATH',
  },
  myInfoCertPath: {
    doc: "Path to MyInfo's public certificate, which is used to verify their signature.",
    format: String,
    default: null,
    env: 'MYINFO_CERT_PATH',
  },
  myInfoClientId: {
    doc: 'OAuth2 client ID registered with MyInfo.',
    format: String,
    default: null,
    env: 'MYINFO_CLIENT_ID',
  },
  myInfoClientSecret: {
    doc: 'OAuth2 client secret registered with MyInfo.',
    format: String,
    default: null,
    env: 'MYINFO_CLIENT_SECRET',
  },
  myInfoJwtSecret: {
    doc: 'Secret for signing MyInfo JWT.',
    format: String,
    default: null,
    env: 'MYINFO_JWT_SECRET',
  },
  spOidcNdiDiscoveryEndpoint: {
    doc: "NDI's Singpass OIDC Discovery Endpoint",
    format: String,
    default: null,
    env: 'SP_OIDC_NDI_DISCOVERY_ENDPOINT',
  },
  spOidcNdiJwksEndpoint: {
    doc: "NDI's Singpass OIDC JWKS Endpoint",
    format: String,
    default: null,
    env: 'SP_OIDC_NDI_JWKS_ENDPOINT',
  },
  spOidcRpClientId: {
    doc: "The Relying Party's Singpass Client ID as registered with NDI",
    format: String,
    default: null,
    env: 'SP_OIDC_RP_CLIENT_ID',
  },
  spOidcRpRedirectUrl: {
    doc: "The Relying Party's Singpass Redirect URL",
    format: String,
    default: null,
    env: 'SP_OIDC_RP_REDIRECT_URL',
  },
  spOidcRpJwksPublicPath: {
    doc: "Path to the Relying Party's Public Json Web Key Set used for Singpass-related communication with NDI.  This will be hosted at /singpass/.well-known/jwks.json endpoint.",
    format: String,
    default: null,
    env: 'SP_OIDC_RP_JWKS_PUBLIC_PATH',
  },
  spOidcRpJwksSecretPath: {
    doc: "Path to the Relying Party's Secret Json Web Key Set used for Singpass-related communication with NDI",
    format: String,
    default: null,
    env: 'SP_OIDC_RP_JWKS_SECRET_PATH',
  },
  cpOidcNdiDiscoveryEndpoint: {
    doc: "NDI's Corppass OIDC Discovery Endpoint",
    format: String,
    default: null,
    env: 'CP_OIDC_NDI_DISCOVERY_ENDPOINT',
  },
  cpOidcNdiJwksEndpoint: {
    doc: "NDI's Corppass OIDC JWKS Endpoint",
    format: String,
    default: null,
    env: 'CP_OIDC_NDI_JWKS_ENDPOINT',
  },
  cpOidcRpClientId: {
    doc: "The Relying Party's Corppass Client ID as registered with NDI",
    format: String,
    default: null,
    env: 'CP_OIDC_RP_CLIENT_ID',
  },
  cpOidcRpRedirectUrl: {
    doc: "The Relying Party's Corppass Redirect URL",
    format: String,
    default: null,
    env: 'CP_OIDC_RP_REDIRECT_URL',
  },
  cpOidcRpJwksPublicPath: {
    doc: "Path to the Relying Party's Public Json Web Key Set used for Corppass-related communication with NDI.  This will be hosted at api/v3/corppass/.well-known/jwks.json endpoint.",
    format: String,
    default: null,
    env: 'CP_OIDC_RP_JWKS_PUBLIC_PATH',
  },
  cpOidcRpJwksSecretPath: {
    doc: "Path to the Relying Party's Secret Json Web Key Set used for Cingpass-related communication with NDI",
    format: String,
    default: null,
    env: 'CP_OIDC_RP_JWKS_SECRET_PATH',
  },
}

export const spcpMyInfoConfig = convict(spcpMyInfoSchema)
  .validate({ allowed: 'strict' })
  .getProperties()
