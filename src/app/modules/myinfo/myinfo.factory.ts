import { IPersonBasic, IPersonBasicRequest } from '@opengovsg/myinfo-gov-client'
import { pick } from 'lodash'
import { LeanDocument } from 'mongoose'
import { err, errAsync, Result, ResultAsync } from 'neverthrow'

import config from '../../../config/config'
import FeatureManager, {
  FeatureNames,
  RegisteredFeature,
} from '../../../config/feature-manager'
import { IFieldSchema, IHashes, IMyInfoHashSchema } from '../../../types'
import { DatabaseError, MissingFeatureError } from '../core/core.errors'
import { ProcessedFieldResponse } from '../submission/submission.types'

import {
  MyInfoCircuitBreakerError,
  MyInfoFetchError,
  MyInfoHashDidNotMatchError,
  MyInfoHashingError,
  MyInfoMissingHashError,
} from './myinfo.errors'
import { MyInfoService } from './myinfo.service'
import { IPossiblyPrefilledField } from './myinfo.types'

interface IMyInfoFactory {
  fetchMyInfoPersonData: (
    params: IPersonBasicRequest,
  ) => ResultAsync<
    IPersonBasic,
    MyInfoCircuitBreakerError | MyInfoFetchError | MissingFeatureError
  >
  prefillMyInfoFields: (
    myInfoData: IPersonBasic,
    currFormFields: LeanDocument<IFieldSchema[]>,
  ) => Result<IPossiblyPrefilledField[], MissingFeatureError>
  saveMyInfoHashes: (
    uinFin: string,
    formId: string,
    prefilledFormFields: IPossiblyPrefilledField[],
  ) => ResultAsync<
    IMyInfoHashSchema | null,
    MyInfoHashingError | DatabaseError | MissingFeatureError
  >
  fetchMyInfoHashes: (
    uinFin: string,
    formId: string,
  ) => ResultAsync<
    IHashes,
    DatabaseError | MyInfoMissingHashError | MissingFeatureError
  >
  checkMyInfoHashes: (
    responses: ProcessedFieldResponse[],
    hashes: IHashes,
  ) => ResultAsync<
    Set<string>,
    MyInfoHashingError | MyInfoHashDidNotMatchError | MissingFeatureError
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
      checkMyInfoHashes: () => errAsync(error),
    }
  }
  const myInfoConfig = pick(props, ['myInfoClientMode', 'myInfoKeyPath'])
  return new MyInfoService({
    myInfoConfig,
    nodeEnv: config.nodeEnv,
    realm: config.app.title,
    singpassEserviceId: props.spEsrvcId,
    spCookieMaxAge: props.spCookieMaxAge,
  })
}

const myInfoFeature = FeatureManager.get(FeatureNames.SpcpMyInfo)
export const MyInfoFactory = createMyInfoFactory(myInfoFeature)
