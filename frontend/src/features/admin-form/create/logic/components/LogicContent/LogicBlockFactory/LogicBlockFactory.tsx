import { useMemo } from 'react'
import { useDisclosure } from '@chakra-ui/react'

import { LogicDto } from '~shared/types'

import { editDataSelector, useAdminLogicStore } from '../../../adminLogicStore'
import { DeleteLogicModal } from '../../DeleteLogicModal'
import { ActiveLogicBlock } from '../ActiveLogicBlock/ActiveLogicBlock'
import { InactiveLogicBlock } from '../InactiveLogicBlock'

export interface LogicBlockFactoryProps {
  logic: LogicDto
}

export const LogicBlockFactory = ({
  logic,
}: LogicBlockFactoryProps): JSX.Element => {
  const editState = useAdminLogicStore(editDataSelector)
  const {
    isOpen: isDeleteModalOpen,
    onClose: onDeleteModalClose,
    onOpen: onDeleteModalOpen,
  } = useDisclosure()

  const isActiveState = useMemo(
    () => editState?.logicId === logic._id,
    [editState?.logicId, logic._id],
  )

  return (
    <>
      <DeleteLogicModal
        isOpen={isDeleteModalOpen}
        onClose={onDeleteModalClose}
        logicId={logic._id}
      />
      {isActiveState ? (
        <ActiveLogicBlock
          logic={logic}
          handleOpenDeleteModal={onDeleteModalOpen}
        />
      ) : (
        <InactiveLogicBlock logic={logic} />
      )}
    </>
  )
}
