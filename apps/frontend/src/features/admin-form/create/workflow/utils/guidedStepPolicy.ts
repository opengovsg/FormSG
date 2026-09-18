export enum GuidedSecondaryAction {
  None = 'none',
  Back = 'back',
  Cancel = 'cancel',
}

export interface GuidedSecondaryActionInput {
  sectionIndex: number
  canCancel: boolean
}

export const getGuidedSecondaryAction = ({
  sectionIndex,
  canCancel,
}: GuidedSecondaryActionInput): GuidedSecondaryAction => {
  if (sectionIndex > 0) return GuidedSecondaryAction.Back
  return canCancel ? GuidedSecondaryAction.Cancel : GuidedSecondaryAction.None
}
