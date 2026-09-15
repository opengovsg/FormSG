/**
 * The step's next `edit` list when its approval field changes.
 *
 * One-way by design: choosing an approval field adds it to `edit` (which the
 * backend requires anyway), but nothing here ever removes an id — not on clear,
 * not on an A -> B swap, not on toggle-off. Removing would delete a field the
 * admin may have added by hand, in a part of the form they aren't looking at.
 * Returns `edit` unchanged when there is nothing to add.
 */
export const nextEditFieldsForApproval = ({
  edit,
  approvalFieldId,
  isEnabled,
}: {
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
