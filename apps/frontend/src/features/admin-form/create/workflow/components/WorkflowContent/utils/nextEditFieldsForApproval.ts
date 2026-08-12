/**
 * Works out the step's next `edit` list when its approval field changes.
 *
 * Auto-assign is deliberately one-way. Choosing a Yes/No field as the approval
 * field adds it to `edit` (which the backend requires anyway), but nothing here
 * ever removes an id — not when the field is cleared, not when it is swapped
 * A -> B, not when approval is toggled off. Adding is a convenience and is
 * trivially undone; removing would destroy a field the admin may have chosen by
 * hand, in a part of the form they are not looking at. The leftover stays as a
 * normal removable chip.
 *
 * Returns the existing array unchanged when there is nothing to add, so callers
 * can assign the result unconditionally without churning form state.
 */
export const nextEditFieldsForApproval = ({
  edit,
  approvalFieldId,
  isEnabled,
}: {
  /** The step's current `edit` list. */
  edit: string[]
  /** The newly selected approval field, or '' when cleared. */
  approvalFieldId: string
  /** Whether auto-assign applies at all (the redesign flag). */
  isEnabled: boolean
}): string[] => {
  if (!isEnabled || !approvalFieldId || edit.includes(approvalFieldId)) {
    return edit
  }
  return [...edit, approvalFieldId]
}
