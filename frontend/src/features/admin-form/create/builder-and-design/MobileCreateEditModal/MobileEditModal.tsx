import { useMemo } from 'react'

import { FieldCreateDto } from '~shared/types/field'

import { MemoFieldDrawerContent } from '../BuilderAndDesignDrawer/EditFieldDrawer/EditFieldDrawer'
import {
  BuildFieldState,
  stateDataSelector,
  useBuilderAndDesignStore,
} from '../useBuilderAndDesignStore'

export const MobileEditModalBody = (): JSX.Element | null => {
  const stateData = useBuilderAndDesignStore(stateDataSelector)

  const fieldToEdit: FieldCreateDto | undefined = useMemo(() => {
    if (
      stateData.state === BuildFieldState.EditingField ||
      stateData.state === BuildFieldState.CreatingField
    ) {
      return stateData.field
    }
  }, [stateData])

  if (!fieldToEdit) return null

  return <MemoFieldDrawerContent field={fieldToEdit} />
}
