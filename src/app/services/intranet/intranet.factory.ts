import { err, ok, Result } from 'neverthrow'

import FeatureManager, {
  FeatureNames,
  RegisteredFeature,
} from '../../../config/feature-manager'
import { MissingFeatureError } from '../../modules/core/core.errors'

import { IntranetService } from './intranet.service'

interface IIntranetFactory {
  isIntranetIp: (ip: string) => Result<boolean, MissingFeatureError>
}

export const createIntranetFactory = ({
  isEnabled,
  props,
}: RegisteredFeature<FeatureNames.Intranet>): IIntranetFactory => {
  if (isEnabled && props?.intranetIpListPath) {
    const intranetService = new IntranetService(props)
    return {
      isIntranetIp: (ip: string) => ok(intranetService.isIntranetIp(ip)),
    }
  }

  const error = new MissingFeatureError(FeatureNames.Intranet)
  return {
    isIntranetIp: () => err(error),
  }
}

const intranetFeature = FeatureManager.get(FeatureNames.Intranet)
export const IntranetFactory = createIntranetFactory(intranetFeature)
