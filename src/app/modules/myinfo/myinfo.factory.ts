import {
  IPerson,
  IPersonResponse,
  MyInfoAttributeString,
} from '@opengovsg/myinfo-gov-client'
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
import { IMyInfoRedirectURLArgs, IPossiblyPrefilledField } from './myinfo.types'

interface IMyInfoFactory {
  createRedirectURL: (
    params: IMyInfoRedirectURLArgs,
  ) => Result<string, MissingFeatureError>
  fetchMyInfoPersonData: (
    authCode: string,
    requestedAttributes: MyInfoAttributeString[],
  ) => ResultAsync<
    IPersonResponse,
    MyInfoCircuitBreakerError | MyInfoFetchError | MissingFeatureError
  >
  prefillMyInfoFields: (
    myInfoData: IPerson,
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
      createRedirectURL: () => err(error),
    }
  }
  return new MyInfoService({
    myInfoConfig: props,
    nodeEnv: config.nodeEnv,
    singpassEserviceId: props.spEsrvcId,
    spCookieMaxAge: props.spCookieMaxAge,
    appUrl: config.app.appUrl,
  })
}

const myInfoFeature = FeatureManager.get(FeatureNames.SpcpMyInfo)
export const MyInfoFactory = createMyInfoFactory(myInfoFeature)
