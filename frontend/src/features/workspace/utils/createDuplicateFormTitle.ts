import { AdminDashboardFormMetaDto } from '~shared/types'

/**
 * Determine the form title when duplicating a form. Appends copy number to the end of the title.
 */
export const makeDuplicateFormTitle = (
  originalTitle: string,
  dashboardForms: AdminDashboardFormMetaDto[],
) => {
  const titlePrefix = originalTitle + '_'
  // Only appends number when original form is copied, treats duplicates as originals too
  let copyIndex = 1
  // Only match forms titles with same prefix
  const formsWithTitlePrefix = new Set(
    dashboardForms
      .map((form) => form.title)
      .filter((title) => title.startsWith(titlePrefix)),
  )

  while (formsWithTitlePrefix.has(`${titlePrefix}${copyIndex}`)) {
    copyIndex++
  }
  return `${titlePrefix}${copyIndex}`
}
