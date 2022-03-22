import { useMemo } from 'react'
import {
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
} from '@chakra-ui/react'

import { BASICFIELD_TO_DRAWER_META } from '../../constants'
import {
  BuildFieldState,
  stateDataSelector,
  useBuilderAndDesignStore,
} from '../useBuilderAndDesignStore'

import { MobileCreateModalBody } from './MobileCreateModal'
import { MobileEditModalBody } from './MobileEditModal'

export const MobileCreateEditModal = (): JSX.Element => {
  const stateData = useBuilderAndDesignStore(stateDataSelector)

  const modalHeader = useMemo(() => {
    if (stateData.state === BuildFieldState.Inactive) {
      return 'Add an element'
    }
    const label = BASICFIELD_TO_DRAWER_META[stateData.field.fieldType].label
    return `Edit ${label}`
  }, [stateData])

  return (
    <ModalContent>
      <ModalCloseButton />
      <ModalHeader>{modalHeader}</ModalHeader>
      <ModalBody whiteSpace="pre-line">
        {stateData.state === BuildFieldState.Inactive ? (
          <MobileCreateModalBody />
        ) : (
          <MobileEditModalBody />
        )}
      </ModalBody>
    </ModalContent>
  )
}
