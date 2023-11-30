import { IPopulatedForm, IPopulatedMultirespondentForm } from '../form'

export type MultirespondentFormLoadedDto = {
  featureFlags: string[]
  formDef: IPopulatedForm
  encryptedFormDef: IPopulatedMultirespondentForm
}
