import { Stack } from '@chakra-ui/react'

import {
  createOrEditDataSelector,
  isEditingEmailSelector,
  requestSwitchToSelector,
  setToEditingEmailSelector,
  setToInactiveSelector,
  useAdminWorkflowStore,
} from '../../adminWorkflowStore'

import { ActiveEmailCard } from './ActiveEmailCard'
import { EndOfWorkflowDivider } from './EndOfWorkflowDivider'
import { InactiveEmailCard } from './InactiveEmailCard'

export const EndOfWorkflowBlock = (): JSX.Element => {
  const isEditing = useAdminWorkflowStore(isEditingEmailSelector)
  const setToEditingEmail = useAdminWorkflowStore(setToEditingEmailSelector)
  const setToInactive = useAdminWorkflowStore(setToInactiveSelector)
  const stateData = useAdminWorkflowStore(createOrEditDataSelector)
  const requestSwitchTo = useAdminWorkflowStore(requestSwitchToSelector)

  const handleEdit = () => {
    if (stateData) {
      // Another step is being edited; request auto-save and switch to email
      requestSwitchTo('email')
      return
    }
    setToEditingEmail()
  }

  return (
    <Stack spacing="0">
      <EndOfWorkflowDivider />
      {isEditing ? (
        <ActiveEmailCard onDone={setToInactive} />
      ) : (
        <InactiveEmailCard onEdit={handleEdit} />
      )}
    </Stack>
  )
}
