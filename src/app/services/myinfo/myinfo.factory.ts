import { IPersonBasic, IPersonBasicRequest } from '@opengovsg/myinfo-gov-client'
import { pick } from 'lodash'
import { err, errAsync, Result, ResultAsync } from 'neverthrow'

import config from '../../../config/config'
import FeatureManager, {
  FeatureNames,
  RegisteredFeature,
} from '../../../config/feature-manager'
import { IFieldSchema, IMyInfoHashSchema } from '../../../types'
import {
  DatabaseError,
  MissingFeatureError,
} from '../../modules/core/core.errors'

import {
  CircuitBreakerError,
  FetchMyInfoError,
  MyInfoHashError,
} from './myinfo.errors'
import { MyInfoService } from './myinfo.service'
import { IPossiblyPrefilledField } from './myinfo.types'

interface IMyInfoFactory {
  fetchMyInfoPersonData: (
    params: IPersonBasicRequest,
  ) => ResultAsync<
    IPersonBasic,
    CircuitBreakerError | FetchMyInfoError | MissingFeatureError
  >
  prefillMyInfoFields: (
    myInfoData: IPersonBasic,
    currFormFields: IFieldSchema[],
  ) => Result<IPossiblyPrefilledField[], MissingFeatureError>
  saveMyInfoHashes: (
    uinFin: string,
    formId: string,
    prefilledFormFields: IPossiblyPrefilledField[],
  ) => ResultAsync<
    IMyInfoHashSchema | null,
    MyInfoHashError | DatabaseError | MissingFeatureError
  >
}

export const createMyInfoFactory = (
  myInfoFeature: RegisteredFeature<FeatureNames.SpcpMyInfo>,
): IMyInfoFactory => {
  if (!myInfoFeature.isEnabled || !myInfoFeature.props) {
    const error = new MissingFeatureError(FeatureNames.SpcpMyInfo)
    return {
      fetchMyInfoPersonData: () => errAsync(error),
      prefillMyInfoFields: () => err(error),
      saveMyInfoHashes: () => errAsync(error),
    }
  }
  const myInfoConfig = pick(myInfoFeature.props, [
    'myInfoClientMode',
    'myInfoKeyPath',
  ])
  const myInfoService = new MyInfoService({
    myInfoConfig,
    nodeEnv: config.nodeEnv,
    realm: config.app.title,
    singpassEserviceId: myInfoFeature.props.spEsrvcId,
    spCookieMaxAge: myInfoFeature.props.spCookieMaxAge,
  })
  return {
    fetchMyInfoPersonData: myInfoService.fetchMyInfoPersonData,
    prefillMyInfoFields: myInfoService.prefillMyInfoFields,
    saveMyInfoHashes: myInfoService.saveMyInfoHashes,
  }
}

const myInfoFeature = FeatureManager.get(FeatureNames.SpcpMyInfo)
export const MyInfoFactory = createMyInfoFactory(myInfoFeature)
