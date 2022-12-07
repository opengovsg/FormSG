/**
 * TODO(#4279): Remove this function
 * Filter to prevent empty or non-actionable feedback
 * from being sent.
 */
export const isUsableFeedback = (feedback: string): boolean => {
  const trimmed = feedback.trim()
  return (
    trimmed.length > 5 &&
    !['na', 'nil', 'nothing', 'none'].includes(trimmed.toLowerCase())
  )
}
