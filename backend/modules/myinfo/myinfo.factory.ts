import { LeanDocument } from 'mongoose'
import { err, errAsync, Result, ResultAsync } from 'neverthrow'

import {
  IFieldSchema,
  IHashes,
  IMyInfoHashSchema,
  IPopulatedForm,
} from '../../../types'
import config from '../../config/config'
import FeatureManager, {
  FeatureNames,
  RegisteredFeature,
} from '../../config/feature-manager'
import { DatabaseError, MissingFeatureError } from '../core/core.errors'
import {
  AuthTypeMismatchError,
  FormAuthNoEsrvcIdError,
} from '../form/form.errors'
import { ProcessedFieldResponse } from '../submission/submission.types'

import { MyInfoData } from './myinfo.adapter'
import {
  MyInfoCircuitBreakerError,
  MyInfoCookieAccessError,
  MyInfoCookieStateError,
  MyInfoFetchError,
  MyInfoHashDidNotMatchError,
  MyInfoHashingError,
  MyInfoInvalidAccessTokenError,
  MyInfoMissingAccessTokenError,
  MyInfoMissingHashError,
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
  parseMyInfoRelayState: (
    relayState: string,
  ) => Result<
    MyInfoParsedRelayState,
    MyInfoParseRelayStateError | MissingFeatureError
  >
  prefillAndSaveMyInfoFields: (
    formId: string,
    myInfoData: MyInfoData,
    currFormFields: LeanDocument<IFieldSchema[]>,
  ) => ResultAsync<
    IPossiblyPrefilledField[],
    MyInfoHashingError | DatabaseError
  >
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

  getMyInfoDataForForm: (
    form: IPopulatedForm,
    cookies: Record<string, unknown>,
  ) => ResultAsync<
    MyInfoData,
    | MyInfoMissingAccessTokenError
    | MyInfoCookieStateError
    | FormAuthNoEsrvcIdError
    | AuthTypeMismatchError
    | MyInfoCircuitBreakerError
    | MyInfoFetchError
    | MissingFeatureError
    | MyInfoCookieAccessError
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
      prefillAndSaveMyInfoFields: () => errAsync(error),
      saveMyInfoHashes: () => errAsync(error),
      fetchMyInfoHashes: () => errAsync(error),
      checkMyInfoHashes: () => errAsync(error),
      createRedirectURL: () => err(error),
      parseMyInfoRelayState: () => err(error),
      extractUinFin: () => err(error),
      getMyInfoDataForForm: () => errAsync(error),
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
