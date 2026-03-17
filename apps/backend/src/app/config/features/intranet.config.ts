import convict, { Schema } from 'convict'

import {
  validateIacStringParam,
  validateNonIacStringParam,
} from '../../utils/iac'

export interface IIntranet {
  intranetIpList: string
  intranetIpListPath: string
  ogpIpList: string
  rbiIpList: string
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
  rbiIpList: {
    doc: 'Path to file containing list of RBI IP addresses, separated by newlines',
    format: validateNonIacStringParam,
    default: '',
    env: 'RBI_IP_LIST',
  },
}

export const intranetConfig = convict(intranetSchema)
  .validate({ allowed: 'strict' })
  .getProperties()
