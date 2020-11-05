// import { IPersonBasic, IPersonBasicRequest } from '@opengovsg/myinfo-gov-client'
// import { err, errAsync, Result, ResultAsync } from 'neverthrow'

// import {
//   FeatureNames,
//   RegisteredFeature,
// } from '../../../config/feature-manager'
// import { IFieldSchema, IMyInfoHashSchema } from '../../../types'
// import {
//   DatabaseError,
//   MissingFeatureError,
// } from '../../modules/core/core.errors'

// import {
//   CircuitBreakerError,
//   FetchMyInfoError,
//   MyInfoHashError,
// } from './myinfo.errors'
// import { MyInfoService } from './myinfo.service'
// import { IPossiblyPrefilledField } from './myinfo.types'

// interface IMyInfoFactory {
//   fetchMyInfoPersonData: (
//     params: IPersonBasicRequest,
//   ) => ResultAsync<
//     IPersonBasic,
//     CircuitBreakerError | FetchMyInfoError | MissingFeatureError
//   >
//   prefillMyInfoFields: (
//     myInfoData: IPersonBasic,
//     currFormFields: IFieldSchema[],
//   ) => Result<IPossiblyPrefilledField[], MissingFeatureError>
//   saveMyInfoHashes: (
//     uinFin: string,
//     formId: string,
//     prefilledFormFields: IPossiblyPrefilledField[],
//   ) => ResultAsync<
//     IMyInfoHashSchema | null,
//     MyInfoHashError | DatabaseError | MissingFeatureError
//   >
// }

// export const createMyInfoFactory = (
//   myInfoFeature: RegisteredFeature<FeatureNames.SpcpMyInfo>,
// ): IMyInfoFactory => {
//   if (!myInfoFeature.isEnabled || !myInfoFeature.props) {
//     const error = new MissingFeatureError(FeatureNames.SpcpMyInfo)
//     return {
//       fetchMyInfoPersonData: () => errAsync(error),
//       prefillMyInfoFields: () => err(error),
//       saveMyInfoHashes: () => errAsync(error),
//     }
//   }
//   const { myInfoConfig } = myInfoFeature.props
//   const myInfoService = new MyInfoService({
//     myInfoConfig: props.my,
//   })
// }
