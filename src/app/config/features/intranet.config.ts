import convict, { Schema } from 'convict'

import {
  validateIacStringParam,
  validateNonIacStringParam,
} from '../../utils/iac'

export interface IIntranet {
  intranetIpList: string
  intranetIpListPath: string
}

const intranetSchema: Schema<IIntranet> = {
  intranetIpList: {
    doc: 'Path to file containing list of intranet IP addresses, separated by newlines',
    format: validateIacStringParam,
    default: '',
    env: 'INTRANET_IP_LIST',
  },
  intranetIpListPath: {
    doc: 'Path to file containing list of intranet IP addresses, separated by newlines',
    format: validateNonIacStringParam,
    default: '',
    env: 'INTRANET_IP_LIST_PATH',
  },
}

export const intranetConfig = convict(intranetSchema)
  .validate({ allowed: 'strict' })
  .getProperties()
