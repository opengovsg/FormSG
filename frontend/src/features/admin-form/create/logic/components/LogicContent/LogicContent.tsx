import { Stack } from '@chakra-ui/react'

import {
  isCreatingStateSelector,
  useAdminLogicStore,
} from '../../adminLogicStore'
import { useAdminFormLogic } from '../../hooks/useAdminFormLogic'

import { HeaderBlock } from './HeaderBlock'
import { InactiveLogicBlock } from './InactiveLogicBlock'
import { NewLogicBlock } from './NewLogicBlock'

export const LogicContent = (): JSX.Element => {
  const isCreatingState = useAdminLogicStore(isCreatingStateSelector)
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
