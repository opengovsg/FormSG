
export enum GuidedSecondaryAction {
  None = 'none',
  Back = 'back',
  Cancel = 'cancel',
}

export interface GuidedSecondaryActionInput {
  sectionIndex: number
  isFirstStep: boolean
}

export const getGuidedSecondaryAction = ({
  sectionIndex,
  isFirstStep,
}: GuidedSecondaryActionInput): GuidedSecondaryAction => {
  if (sectionIndex > 0) return GuidedSecondaryAction.Back
  return isFirstStep ? GuidedSecondaryAction.None : GuidedSecondaryAction.Cancel
}
