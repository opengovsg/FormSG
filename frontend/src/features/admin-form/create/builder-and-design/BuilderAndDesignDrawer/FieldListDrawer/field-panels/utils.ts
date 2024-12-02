import { BasicField, MyInfoAttribute } from '~shared/types'

import { BuilderSidebarFieldMeta } from '~features/admin-form/create/constants'

const checkSearchValueMatchesFieldMeta = (
  searchValue: string,
  fieldMeta: BuilderSidebarFieldMeta,
) => {
  const lowerCaseSearchValue = searchValue.toLowerCase()
  return (
    fieldMeta.label.toLowerCase().includes(lowerCaseSearchValue) ||
    fieldMeta.searchAliases?.some((searchAlias) =>
      searchAlias.toLowerCase().includes(lowerCaseSearchValue),
    )
  )
}

export const filterFieldsBySearchValue = <
  T extends BasicField | MyInfoAttribute,
>(
  searchValue: string,
  fields: T[],
  fieldsMeta: {
    [key in T]: BuilderSidebarFieldMeta
  },
) => {
  return fields.filter((fieldType) => {
    const fieldMeta = fieldsMeta[fieldType]
    return checkSearchValueMatchesFieldMeta(searchValue, fieldMeta)
  })
}
