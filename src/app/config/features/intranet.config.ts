import convict, { Schema } from 'convict'

export interface IIntranet {
  intranetIpList: string
}

const intranetSchema: Schema<IIntranet> = {
  intranetIpList: {
    doc: 'Path to file containing list of intranet IP addresses, separated by newlines',
    format: String,
    default: '',
    env: 'INTRANET_IP_LIST',
  },
}

export const intranetConfig = convict(intranetSchema)
  .validate({ allowed: 'strict' })
  .getProperties()
