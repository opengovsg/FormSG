export type StepFieldList = { edit: string[] }

export type VerifiedEntry<T> = {
  /** MRF step number the identity was collected at; unsuffixed keys are Step 1. */
  stepNumber?: number
  field: T
}

/**
 * Places each step's verified identities right after the last field that step
 * introduced, so an identity reads next to the answers of its own respondent.
 * A field belongs to the first step whose edit list holds it; reused fields stay
 * put. A step that introduced no field follows the previous step's block.
 * Without a login after Step 1 the identities stay at the end, unchanged.
 */
export const placeVerifiedFieldsByStep = <T extends { _id: string }>({
  fields,
  verified,
  workflow,
}: {
  fields: T[]
  verified: VerifiedEntry<T>[]
  workflow: StepFieldList[]
}): T[] => {
  const hasLaterStepLogin = verified.some(
    ({ stepNumber }) => stepNumber !== undefined && stepNumber > 1,
  )
  if (!hasLaterStepLogin) return [...fields, ...verified.map((v) => v.field)]

  const ownerStepByFieldId = new Map<string, number>()
  workflow.forEach((step, stepIndex) => {
    step.edit.forEach((fieldId) => {
      if (!ownerStepByFieldId.has(fieldId)) {
        ownerStepByFieldId.set(fieldId, stepIndex)
      }
    })
  })

  const lastFieldIndexByStep = new Map<number, number>()
  fields.forEach((field, index) => {
    const owner = ownerStepByFieldId.get(field._id)
    if (owner !== undefined) lastFieldIndexByStep.set(owner, index)
  })

  const entries = verified
    .map(({ stepNumber, field }) => ({
      stepIndex: Math.max((stepNumber ?? 1) - 1, 0),
      field,
    }))
    .sort((a, b) => a.stepIndex - b.stepIndex)

  // Anchor per step, walking up so an empty step reuses the previous anchor.
  const lastIndex = fields.length - 1
  const anchorByStep = new Map<number, number>()
  const maxStepIndex = entries.reduce((max, e) => Math.max(max, e.stepIndex), 0)
  for (let step = 0; step <= maxStepIndex; step++) {
    anchorByStep.set(
      step,
      step >= workflow.length
        ? lastIndex
        : (lastFieldIndexByStep.get(step) ??
            (step > 0 ? anchorByStep.get(step - 1) : undefined) ??
            lastIndex),
    )
  }

  const identitiesAfterIndex = new Map<number, T[]>()
  entries.forEach(({ stepIndex, field }) => {
    const anchor = anchorByStep.get(stepIndex) ?? lastIndex
    identitiesAfterIndex.set(anchor, [
      ...(identitiesAfterIndex.get(anchor) ?? []),
      field,
    ])
  })

  return [
    ...(identitiesAfterIndex.get(-1) ?? []),
    ...fields.flatMap((field, index) => [
      field,
      ...(identitiesAfterIndex.get(index) ?? []),
    ]),
  ]
}
