import { FeatureNames, RegisterableFeature } from './types'

export const intranetFeature: RegisterableFeature<FeatureNames.Intranet> = {
  name: FeatureNames.Intranet,
  schema: {
    intranetIpListPath: {
      doc: 'Path to list of intranet IP addresses',
      format: String,
      default: null,
      env: 'INTRANET_IP_LIST_PATH',
    },
  },
}
