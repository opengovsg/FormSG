import { err } from 'neverthrow'

import FeatureManager, {
  FeatureNames,
  RegisteredFeature,
} from '../../../config/feature-manager'
import { MissingFeatureError } from '../../modules/core/core.errors'

import { IntranetService } from './intranet.service'

interface IIntranetFactory {
  isIntranetIp: IntranetService['isIntranetIp']
}

export const createIntranetFactory = ({
  isEnabled,
  props,
}: RegisteredFeature<FeatureNames.Intranet>): IIntranetFactory => {
  if (isEnabled && props?.intranetIpListPath) {
    return new IntranetService(props)
  }

  const error = new MissingFeatureError(FeatureNames.Intranet)
  return {
    isIntranetIp: () => err(error),
  }
}

const intranetFeature = FeatureManager.get(FeatureNames.Intranet)
export const IntranetFactory = createIntranetFactory(intranetFeature)
