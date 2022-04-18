import { useMemo } from 'react'

import { LogicDto } from '~shared/types'

import { editDataSelector, useAdminLogicStore } from '../../../adminLogicStore'
import { ActiveLogicBlock } from '../ActiveLogicBlock/ActiveLogicBlock'
import { InactiveLogicBlock } from '../InactiveLogicBlock'

export interface LogicBlockFactoryProps {
  logic: LogicDto
}

export const LogicBlockFactory = ({
  logic,
}: LogicBlockFactoryProps): JSX.Element => {
  const editState = useAdminLogicStore(editDataSelector)

  const isActiveState = useMemo(
    () => editState?.logicId === logic._id,
    [editState?.logicId, logic._id],
  )

  if (isActiveState) return <ActiveLogicBlock logic={logic} />

  return <InactiveLogicBlock logic={logic} />
}
