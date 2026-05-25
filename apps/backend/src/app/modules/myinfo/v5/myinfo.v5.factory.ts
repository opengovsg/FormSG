/**
 * Singleton factory for the v5 service. Kept separate from the class file so
 * that the class can be imported and unit-tested without booting the full
 * application config (convict pulls in S3, SES, DB env vars that are
 * unrelated to MyInfo).
 */

import type { JSONWebKeySet } from 'jose'

import config from '../../../config/config'
import { spcpMyInfoConfig } from '../../../config/features/spcp-myinfo.config'
import { retrieveFileContent } from '../../../utils/iac'
import {
  MYINFO_ROUTER_PREFIX,
  MYINFO_V5_REDIRECT_PATH,
} from '../myinfo.constants'

import { MyInfoV5ServiceClass } from './myinfo.v5.service'
import type { MyInfoV5RpKeyset } from './myinfo.v5.types'

function loadJwks(
  content: string | null,
  path: string | null,
): JSONWebKeySet | null {
  if (!content && !path) return null
  const raw = retrieveFileContent({
    preIacFilePath: path ?? '',
    postIacFileContentString: content ?? '',
  })
  if (!raw) return null
  return JSON.parse(raw) as JSONWebKeySet
}

function buildKeyset(): MyInfoV5RpKeyset | null {
  const publicJwks = loadJwks(
    spcpMyInfoConfig.myInfoV5RpJwksPublic,
    spcpMyInfoConfig.myInfoV5RpJwksPublicPath,
  )
  const privateJwks = loadJwks(
    spcpMyInfoConfig.myInfoV5RpJwksSecret,
    spcpMyInfoConfig.myInfoV5RpJwksSecretPath,
  )
  if (!publicJwks || !privateJwks) return null
  return { publicJwks, privateJwks }
}

/**
 * The dispatcher checks `isConfigured` before routing traffic here, so an
 * unconfigured v5 setup is a soft failure (we stay on v3) rather than a
 * process crash.
 */
export const MyInfoV5Service = new MyInfoV5ServiceClass({
  issuer: spcpMyInfoConfig.myInfoV5Issuer,
  clientId: spcpMyInfoConfig.myInfoV5ClientId,
  redirectUri: `${config.app.appUrl}${MYINFO_ROUTER_PREFIX}${MYINFO_V5_REDIRECT_PATH}`,
  rpKeyset: buildKeyset(),
})
