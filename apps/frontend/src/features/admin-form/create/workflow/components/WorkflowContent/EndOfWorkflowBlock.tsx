import { useState } from 'react'
import { Stack } from '@chakra-ui/react'

import { ActiveEmailCard } from './ActiveEmailCard'
import { EndOfWorkflowDivider } from './EndOfWorkflowDivider'
import { InactiveEmailCard } from './InactiveEmailCard'

export const EndOfWorkflowBlock = (): JSX.Element => {
  const [isEditing, setIsEditing] = useState(false)

  return (
    <Stack spacing="0">
      <EndOfWorkflowDivider />
      {isEditing ? (
        <ActiveEmailCard onDone={() => setIsEditing(false)} />
      ) : (
        <InactiveEmailCard onEdit={() => setIsEditing(true)} />
      )}
    </Stack>
  )
}
