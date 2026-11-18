/**
 * Orders picked field ids by where the fields sit on the form, so lists read
 * 1, 2, 3 however the admin picked them. Ids no longer on the form go last,
 * so their "field was deleted" warnings still show.
 */
export const sortFieldIdsByFormOrder = (
  fieldIds: string[],
  formFields: { _id: string }[],
): string[] => {
  const position = new Map(formFields.map((f, index) => [f._id, index]))
  const positionOf = (id: string) => position.get(id) ?? formFields.length
  return [...fieldIds].sort((a, b) => positionOf(a) - positionOf(b))
}
