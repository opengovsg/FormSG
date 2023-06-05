import { FormResponseMode } from 'shared/types'

import { E2eFieldMetadata } from './field'
import { E2eLogic } from './logic'
import { E2eSettingsOptions } from './settings'

export type E2eForm = {
  formFields: E2eFieldMetadata[]
  formLogics: E2eLogic[]
  formSettings: E2eSettingsOptions
}

interface E2eFormResponseModeBase {
  responseMode: FormResponseMode
}

interface E2eFormResponseModeEmail extends E2eFormResponseModeBase {
  responseMode: FormResponseMode.Email
}

interface E2eFormResponseModeEncrypt extends E2eFormResponseModeBase {
  responseMode: FormResponseMode.Encrypt
  secretKey: string
}

export type E2eFormResponseMode =
  | E2eFormResponseModeEmail
  | E2eFormResponseModeEncrypt
