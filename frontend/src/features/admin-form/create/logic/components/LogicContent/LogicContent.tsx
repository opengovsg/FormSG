import { Stack } from '@chakra-ui/react'
import { Infobox } from '@opengovsg/design-system-react'

import {
  isCreatingStateSelector,
  useAdminLogicStore,
} from '../../adminLogicStore'
import { useAdminFormLogic } from '../../hooks/useAdminFormLogic'

import { HeaderBlock } from './HeaderBlock'
import { LogicBlockFactory } from './LogicBlockFactory'
import { NewLogicBlock } from './NewLogicBlock'

export const LogicContent = (): JSX.Element | null => {
  const isCreatingState = useAdminLogicStore(isCreatingStateSelector)
  const { formLogics, isLoading, hasError } = useAdminFormLogic()

  if (isLoading) return null

  return (
    <Stack color="brand.secondary.500" spacing="1rem">
      {hasError ? (
        <Infobox variant="error">
          There are errors in your form's logic, please fix them before sharing
          your form
        </Infobox>
      ) : null}
      <HeaderBlock />
      {formLogics?.map((logic) => (
        <LogicBlockFactory key={logic._id} logic={logic} />
      ))}
      {isCreatingState ? <NewLogicBlock /> : null}
    </Stack>
  )
}
