import { Box, Divider, Stack } from '@chakra-ui/react'

import { BxsChevronDown } from '~assets/icons/BxsChevronDown'

import { useUser } from '~features/user/queries'

import { useAdminFormWorkflow } from '../../hooks/useAdminFormWorkflow'

import { HeaderBlock } from './HeaderBlock'
import { NewStepBlock } from './NewStepBlock'
import { WorkflowBlockFactory } from './WorkflowBlockFactory'
import { WorkflowCompletionMessageBlock } from './WorkflowCompletionMessageBlock'

export const WorkflowContent = (): JSX.Element | null => {
  const { formWorkflow, isLoading } = useAdminFormWorkflow()
  // TODO: (MRF-email-notif) Remove isTest and useUser when email notifications is out of beta
  const isTest = process.env.NODE_ENV === 'test'
  const { user } = useUser()

  if (isLoading) return null

  return (
    <Stack color="secondary.500" spacing="1rem">
      <HeaderBlock />
      <Stack spacing="0" divider={<WorkflowStepBlockDivider />}>
        {formWorkflow?.map((step, i) => (
          <WorkflowBlockFactory key={i} stepNumber={i} step={step} />
        ))}
        <NewStepBlock />
      </Stack>
      {/*TODO: (MRF-email-notif) Remove flag check when email notifications is out of beta */}
      {isTest || user?.betaFlags?.mrfEmailNotifications ? (
        <WorkflowCompletionMessageBlock />
      ) : null}
    </Stack>
  )
}

const WorkflowStepBlockDivider = () => (
  <Box alignSelf="center" justifyContent="center" border="none">
    <Divider
      orientation="vertical"
      h="1rem"
      borderLeftWidth="2px"
      marginLeft="7px"
      borderColor="secondary.200"
    />
    <BxsChevronDown />
    <Divider
      orientation="vertical"
      h="1rem"
      borderLeftWidth="2px"
      marginLeft="7px"
      borderColor="secondary.200"
    />
  </Box>
)
