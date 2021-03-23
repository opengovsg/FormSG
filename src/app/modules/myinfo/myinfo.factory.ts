import { LeanDocument } from 'mongoose'
import { err, errAsync, Result, ResultAsync } from 'neverthrow'

import config from '../../../config/config'
import FeatureManager, {
  FeatureNames,
  RegisteredFeature,
} from '../../../config/feature-manager'
import {
  IFieldSchema,
  IHashes,
  IMyInfoHashSchema,
  IPopulatedForm,
  MyInfoAttribute,
} from '../../../types'
import { DatabaseError, MissingFeatureError } from '../core/core.errors'
import { ProcessedFieldResponse } from '../submission/submission.types'

import { MyInfoData } from './myinfo.adapter'
import {
  MyInfoAuthTypeError,
  MyInfoCircuitBreakerError,
  MyInfoCookieStateError,
  MyInfoFetchError,
  MyInfoHashDidNotMatchError,
  MyInfoHashingError,
  MyInfoInvalidAccessTokenError,
  MyInfoMissingAccessTokenError,
  MyInfoMissingHashError,
  MyInfoNoESrvcIdError,
  MyInfoParseRelayStateError,
} from './myinfo.errors'
import { MyInfoService } from './myinfo.service'
import {
  IMyInfoRedirectURLArgs,
  IPossiblyPrefilledField,
  MyInfoParsedRelayState,
} from './myinfo.types'

interface IMyInfoFactory {
  createRedirectURL: (
    params: IMyInfoRedirectURLArgs,
  ) => Result<string, MissingFeatureError>
  retrieveAccessToken: (
    authCode: string,
  ) => ResultAsync<string, MyInfoCircuitBreakerError | MyInfoFetchError>
  fetchMyInfoPersonData: (
    accessToken: string,
    requestedAttributes: MyInfoAttribute[],
    singpassEserviceId: string,
  ) => ResultAsync<
    MyInfoData,
    MyInfoCircuitBreakerError | MyInfoFetchError | MissingFeatureError
  >
  parseMyInfoRelayState: (
    relayState: string,
  ) => Result<
    MyInfoParsedRelayState,
    MyInfoParseRelayStateError | MissingFeatureError
  >
  prefillMyInfoFields: (
    myInfoData: MyInfoData,
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
  extractUinFin: (
    accessToken: string,
  ) => Result<string, MyInfoInvalidAccessTokenError | MissingFeatureError>

  extractMyInfoData: (
    form: IPopulatedForm,
    cookies: Record<string, unknown>,
  ) => ResultAsync<
    MyInfoData,
    | MyInfoMissingAccessTokenError
    | MyInfoCookieStateError
    | MyInfoNoESrvcIdError
    | MyInfoAuthTypeError
    | MyInfoCircuitBreakerError
    | MyInfoFetchError
    | MissingFeatureError
  >
}

export const createMyInfoFactory = ({
  isEnabled,
  props,
}: RegisteredFeature<FeatureNames.SpcpMyInfo>): IMyInfoFactory => {
  if (!isEnabled || !props) {
    const error = new MissingFeatureError(FeatureNames.SpcpMyInfo)
    return {
      retrieveAccessToken: () => errAsync(error),
      fetchMyInfoPersonData: () => errAsync(error),
      prefillMyInfoFields: () => err(error),
      saveMyInfoHashes: () => errAsync(error),
      fetchMyInfoHashes: () => errAsync(error),
      checkMyInfoHashes: () => errAsync(error),
      createRedirectURL: () => err(error),
      parseMyInfoRelayState: () => err(error),
      extractUinFin: () => err(error),
      extractMyInfoData: () => errAsync(error),
    }
  }
  return new MyInfoService({
    spcpMyInfoConfig: props,
    nodeEnv: config.nodeEnv,
    appUrl: config.app.appUrl,
  })
}

const myInfoFeature = FeatureManager.get(FeatureNames.SpcpMyInfo)
export const MyInfoFactory = createMyInfoFactory(myInfoFeature)
