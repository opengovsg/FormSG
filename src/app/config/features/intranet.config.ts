import convict, { Schema } from 'convict'

import {
  validateIacStringParam,
  validateNonIacStringParam,
} from '../../utils/iac'

export interface IIntranet {
  intranetIpList: string
  intranetIpListPath: string
  ogpIpList: string
  proxyIpList: string
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
  ogpIpList: {
    doc: 'Path to file containing list of OGP IP addresses, separated by newlines',
    format: validateNonIacStringParam,
    default: '',
    env: 'OGP_IP_LIST',
  },
  proxyIpList: {
    doc: 'Path to file containing list of Proxy IP addresses, separated by newlines',
    format: validateNonIacStringParam,
    default: '',
    env: 'PROXY_IP_LIST',
  },
}

export const intranetConfig = convict(intranetSchema)
  .validate({ allowed: 'strict' })
  .getProperties()
