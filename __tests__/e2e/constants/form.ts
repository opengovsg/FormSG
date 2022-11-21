import { E2eFieldMetadata } from './field'
import { E2eLogic } from './logic'
import { E2eSettingsOptions } from './settings'

export type E2eForm = {
  formFields: E2eFieldMetadata[]
  formLogics: E2eLogic[]
  formSettings: E2eSettingsOptions
}
