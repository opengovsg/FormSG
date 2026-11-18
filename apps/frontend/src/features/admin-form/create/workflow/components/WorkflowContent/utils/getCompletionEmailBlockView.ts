import { FormResponseMode, FormSettings } from 'formsg-shared/types/form'

export const COMPLETION_EMAIL_CARD_MIN_STEPS = 2

export enum CompletionEmailBlockView {
  None = 'none',
  SettingsMessage = 'settings-message',
  Card = 'card',
}

export interface GetCompletionEmailBlockViewInput {
  settings: FormSettings | undefined
  isSettingsError: boolean
  workflowStepCount: number
}

export const getCompletionEmailBlockView = ({
  settings,
  isSettingsError,
  workflowStepCount,
}: GetCompletionEmailBlockViewInput): CompletionEmailBlockView => {
  if (workflowStepCount < COMPLETION_EMAIL_CARD_MIN_STEPS) {
    return CompletionEmailBlockView.None
  }
  if (settings) {
    return settings.responseMode === FormResponseMode.Multirespondent
      ? CompletionEmailBlockView.Card
      : CompletionEmailBlockView.None
  }
  return isSettingsError
    ? CompletionEmailBlockView.SettingsMessage
    : CompletionEmailBlockView.Card
}
