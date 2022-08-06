import { spcpMyInfoConfig } from '../../../config/features/spcp-myinfo.config'

import { CpOidcServiceClass } from './spcp.oidc.service.cp'
import { SpOidcServiceClass } from './spcp.oidc.service.sp'

export const SpOidcService = new SpOidcServiceClass(spcpMyInfoConfig)
export const CpOidcService = new CpOidcServiceClass(spcpMyInfoConfig)
