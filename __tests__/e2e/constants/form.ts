import { E2eFieldMetadata } from './field'
import { E2eSettingsOptions } from './settings'

export type E2eForm = {
  formFields: E2eFieldMetadata[]
  formSettings: E2eSettingsOptions
}
