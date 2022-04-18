import { useCallback } from 'react'
import { Stack } from '@chakra-ui/react'

import { useAdminLogicStore } from '../../adminLogicStore'
import { useAdminFormLogic } from '../../hooks/useAdminFormLogic'
import { AdminEditLogicState } from '../../types'

import { HeaderBlock } from './HeaderBlock'
import { InactiveLogicBlock } from './InactiveLogicBlock'
import { NewLogicBlock } from './NewLogicBlock'

export const LogicContent = (): JSX.Element => {
  const isCreatingState = useAdminLogicStore(
    useCallback(
      (state) =>
        state.createOrEditData?.state === AdminEditLogicState.CreatingLogic,
      [],
    ),
  )
  const { formLogics, isLoading } = useAdminFormLogic()

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <Stack color="secondary.500" spacing="1rem">
      <HeaderBlock />
      {formLogics?.map((logic) => (
        <InactiveLogicBlock key={logic._id} logic={logic} />
      ))}
      {isCreatingState ? <NewLogicBlock /> : null}
    </Stack>
  )
}
