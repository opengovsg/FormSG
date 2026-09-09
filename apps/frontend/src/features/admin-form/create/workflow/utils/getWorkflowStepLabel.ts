export const getWorkflowStepLabel = ({
  stepNumber,
  stepName,
  stepWord,
}: {
  stepNumber: number
  stepName?: string
  stepWord: string
}): string =>
  stepName ||
  `${stepWord.charAt(0).toUpperCase()}${stepWord.slice(1)} ${stepNumber + 1}`
