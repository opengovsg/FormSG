import { Skeleton, Stack, Text } from '@chakra-ui/react'

import { usePrototypeStore } from './context'
import { getOverviewStep } from './model'

export const WorkflowStatusOverview = ({
  responseId,
}: {
  responseId: string
}) => {
  const { responses } = usePrototypeStore()
  const response = responses.find((item) => item.id === responseId)
  const step = response ? getOverviewStep(response) : undefined
  return (
    <Stack
      spacing={{ base: 0, md: '0.5rem' }}
      direction={{ base: 'column', md: 'row' }}
    >
      <Text as="span" textStyle="subhead-1" whiteSpace="nowrap">
        Workflow status:
      </Text>
      <Skeleton isLoaded={!!response}>
        {response && (
          <Text as="span">
            {
              {
                pending: 'Pending',
                stopped: 'Stopped',
                completed: 'Completed',
                rejected: 'Rejected',
              }[response.status]
            }
            {step && ` at Step ${step.number} · ${step.name}`}
          </Text>
        )}
      </Skeleton>
    </Stack>
  )
}
