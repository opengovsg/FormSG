export enum GuidedSecondaryAction {
  None = 'none',
  Back = 'back',
  Cancel = 'cancel',
}

export interface GuidedSecondaryActionInput {
  isFirstSection: boolean
  canCancel: boolean
}

export const getGuidedSecondaryAction = ({
  isFirstSection,
  canCancel,
}: GuidedSecondaryActionInput): GuidedSecondaryAction => {
  if (!isFirstSection) return GuidedSecondaryAction.Back
  return canCancel ? GuidedSecondaryAction.Cancel : GuidedSecondaryAction.None
}
