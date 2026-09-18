import { FormResponseMode, FormSettings } from 'formsg-shared/types/form'

export interface IsCompletionEmailCardReachableInput {
  settings: FormSettings | undefined
  isSettingsError: boolean
}

export const isCompletionEmailCardReachable = ({
  settings,
  isSettingsError,
}: IsCompletionEmailCardReachableInput): boolean => {
  if (settings) {
    return settings.responseMode === FormResponseMode.Multirespondent
  }
  return !isSettingsError
}
