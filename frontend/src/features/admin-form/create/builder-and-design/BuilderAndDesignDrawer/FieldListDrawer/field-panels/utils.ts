import { BasicField, MyInfoAttribute } from '~shared/types'

import { BuilderSidebarFieldMeta } from '~features/admin-form/create/constants'

const checkSearchValueMatchesFieldMeta = (
  searchValue: string,
  fieldMeta: BuilderSidebarFieldMeta,
): boolean => {
  const lowerCaseSearchValue = searchValue.toLowerCase()
  return !!(
    fieldMeta.label.toLowerCase().includes(lowerCaseSearchValue) ||
    fieldMeta.searchAliases?.some((searchAlias) =>
      searchAlias.toLowerCase().includes(lowerCaseSearchValue),
    )
  )
}

/**
 * Filter field types by search value.
 * @param searchValue - The search value to filter fields by
 * @param orderedFields - The ordered fields to filter
 * @param fieldsMeta - The fields meta to filter by
 * @returns The filtered fields and their original indices based on the ordered fields.
 * which follow the shape { fieldType: T; originalIndex: number representing the index of the field in the orderedFields array }[]
 * NOTE: The originalIndex is necessary for the draggable component to maintain the order of the fields when dropped into the BuilderAndDesignTab.
 */
export const filterFieldsBySearchValue = <
  T extends BasicField | MyInfoAttribute,
>(
  searchValue: string,
  orderedFields: T[],
  fieldsMeta: {
    [key in T]: BuilderSidebarFieldMeta
  },
): { fieldType: T; originalIndex: number }[] => {
  return orderedFields
    .map((fieldType, originalIndex) => ({
      fieldType,
      originalIndex,
    }))
    .filter(({ fieldType }) => {
      const fieldMeta = fieldsMeta[fieldType]
      return checkSearchValueMatchesFieldMeta(searchValue, fieldMeta)
    })
}
