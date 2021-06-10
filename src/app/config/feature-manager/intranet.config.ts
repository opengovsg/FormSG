import convict, { Schema } from 'convict'

export interface IIntranet {
  intranetIpListPath: string
}

const intranetSchema: Schema<IIntranet> = {
  intranetIpListPath: {
    doc: 'Path to file containing list of intranet IP addresses, separated by newlines',
    format: String,
    default: null,
    env: 'INTRANET_IP_LIST_PATH',
  },
}

export const intranetConfig = convict(intranetSchema)
  .validate({ allowed: 'strict' })
  .getProperties()
