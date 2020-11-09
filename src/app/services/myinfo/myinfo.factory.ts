import { IPersonBasic, IPersonBasicRequest } from '@opengovsg/myinfo-gov-client'
import { pick } from 'lodash'
import { err, errAsync, Result, ResultAsync } from 'neverthrow'

import config from '../../../config/config'
import FeatureManager, {
  FeatureNames,
  RegisteredFeature,
} from '../../../config/feature-manager'
import { IFieldSchema, IHashes, IMyInfoHashSchema } from '../../../types'
import {
  DatabaseError,
  MissingFeatureError,
} from '../../modules/core/core.errors'
import { ProcessedFieldResponse } from '../../modules/submission/submission.types'

import {
  CircuitBreakerError,
  FetchMyInfoError,
  HashDidNotMatchError,
  HashingError,
  MissingHashError,
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
    HashingError | DatabaseError | MissingFeatureError
  >
  fetchMyInfoHashes: (
    uinFin: string,
    formId: string,
  ) => ResultAsync<
    IHashes,
    DatabaseError | MissingHashError | MissingFeatureError
  >
  doMyInfoHashesMatch: (
    responses: ProcessedFieldResponse[],
    hashes: IHashes,
  ) => ResultAsync<
    IHashes,
    HashingError | HashDidNotMatchError | MissingFeatureError
  >
}

export const createMyInfoFactory = ({
  isEnabled,
  props,
}: RegisteredFeature<FeatureNames.SpcpMyInfo>): IMyInfoFactory => {
  if (!isEnabled || !props) {
    const error = new MissingFeatureError(FeatureNames.SpcpMyInfo)
    return {
      fetchMyInfoPersonData: () => errAsync(error),
      prefillMyInfoFields: () => err(error),
      saveMyInfoHashes: () => errAsync(error),
      fetchMyInfoHashes: () => errAsync(error),
      doMyInfoHashesMatch: () => errAsync(error),
    }
  }
  const myInfoConfig = pick(props, ['myInfoClientMode', 'myInfoKeyPath'])
  const myInfoService = new MyInfoService({
    myInfoConfig,
    nodeEnv: config.nodeEnv,
    realm: config.app.title,
    singpassEserviceId: props.spEsrvcId,
    spCookieMaxAge: props.spCookieMaxAge,
  })
  return {
    fetchMyInfoPersonData: myInfoService.fetchMyInfoPersonData,
    prefillMyInfoFields: myInfoService.prefillMyInfoFields,
    saveMyInfoHashes: myInfoService.saveMyInfoHashes,
    fetchMyInfoHashes: myInfoService.fetchMyInfoHashes,
    doMyInfoHashesMatch: myInfoService.doMyInfoHashesMatch,
  }
}

const myInfoFeature = FeatureManager.get(FeatureNames.SpcpMyInfo)
export const MyInfoFactory = createMyInfoFactory(myInfoFeature)
