import { IPersonBasic, IPersonBasicRequest } from '@opengovsg/myinfo-gov-client'
import { pick } from 'lodash'
import { err, errAsync, Result, ResultAsync } from 'neverthrow'

import config from '../../../config/config'
import FeatureManager, {
  FeatureNames,
  RegisteredFeature,
} from '../../../config/feature-manager'
import {
  IFieldSchema,
  IMyInfoHashSchema,
  MyInfoAttribute,
} from '../../../types'
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
import { extractRequestedAttributes } from './myinfo.util'

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
  extractRequestedAttributes: (formFields: IFieldSchema[]) => MyInfoAttribute[]
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
      extractRequestedAttributes,
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
    extractRequestedAttributes,
  }
}

const myInfoFeature = FeatureManager.get(FeatureNames.SpcpMyInfo)
export const MyInfoFactory = createMyInfoFactory(myInfoFeature)
