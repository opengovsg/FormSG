/**
 * Auto-assign is one-way (plan §4.3, §4.5): picking a Yes/No field as the
 * approval field adds it to `edit`. Nothing ever removes an id from `edit` —
 * not on switch, clear, or toggle-off. Callers that need "no field selected"
 * behaviour simply don't call this; there is no corresponding remove helper.
 */
export const addApprovalFieldToEdit = (
  edit: string[],
  approvalFieldId: string,
): string[] => Array.from(new Set([...edit, approvalFieldId]))
