import { BiBell, BiStopCircle, BiUndo, BiUserPlus } from 'react-icons/bi'
import { Flex } from '@chakra-ui/react'

import Button from '~components/Button'
import Tooltip from '~components/Tooltip'

export interface WorkflowActionDescriptor {
  ownerId?: string
  id: 'remind' | 'addAssignee' | 'sendBack' | 'void'
  label: string
  tooltip: string
  disabled: boolean
  loading: boolean
  onClick: () => void
}
const icons = {
  remind: BiBell,
  addAssignee: BiUserPlus,
  sendBack: BiUndo,
  void: BiStopCircle,
}
export const WorkflowActionButtons = ({
  actions,
}: {
  actions: WorkflowActionDescriptor[]
}): JSX.Element => (
  <Flex gap="0.5rem" wrap="wrap">
    {actions.map((action) => {
      const Icon = icons[action.id]
      return (
        <Tooltip key={action.id} label={action.tooltip} shouldWrapChildren>
          <Button
            size="sm"
            variant="outline"
            colorScheme={action.id === 'void' ? 'danger' : 'secondary'}
            leftIcon={<Icon fontSize="1.25rem" />}
            isDisabled={action.disabled}
            isLoading={action.loading}
            onClick={action.onClick}
            data-workflow-action={action.id}
            data-workflow-owner-id={action.ownerId}
          >
            {action.label}
          </Button>
        </Tooltip>
      )
    })}
  </Flex>
)
