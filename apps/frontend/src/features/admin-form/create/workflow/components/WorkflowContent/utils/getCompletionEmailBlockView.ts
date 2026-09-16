import { FormResponseMode, FormSettings } from 'formsg-shared/types/form'

export enum CompletionEmailBlockView {
  None = 'none',
  SettingsMessage = 'settings-message',
  Card = 'card',
}

export interface GetCompletionEmailBlockViewInput {
  settings: FormSettings | undefined
  isSettingsError: boolean
}

export const getCompletionEmailBlockView = ({
  settings,
  isSettingsError,
}: GetCompletionEmailBlockViewInput): CompletionEmailBlockView => {
  if (settings) {
    return settings.responseMode === FormResponseMode.Multirespondent
      ? CompletionEmailBlockView.Card
      : CompletionEmailBlockView.None
  }
  return isSettingsError
    ? CompletionEmailBlockView.SettingsMessage
    : CompletionEmailBlockView.Card
}
