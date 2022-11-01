import { Box, Divider, Flex, Stack, Text } from '@chakra-ui/react'

import { useWorkspaceContext } from '~features/workspace/WorkspaceContext'
import { CONTAINER_MAXW } from '~features/workspace/WorkspacePage'

import { WorkspaceFormRow } from './WorkspaceFormRow'
import { WorkspaceFormRowsFilterNoneSvg } from './WorkspaceFormRowsFilterNoneSvg'
import { WorkspaceFormRowSkeleton } from './WorkspaceFormRowSkeleton'
import { WorkspaceRowsProvider } from './WorkspaceRowsContext'

const WorkspaceFormRowsSkeleton = () => {
  return (
    <Stack maxW={CONTAINER_MAXW} m="auto" spacing={0} divider={<Divider />}>
      <WorkspaceFormRowSkeleton />
      <WorkspaceFormRowSkeleton />
      <WorkspaceFormRowSkeleton />
      <WorkspaceFormRowSkeleton />
    </Stack>
  )
}

const WorkspaceFormRowsFilterNone = () => (
  <Box mt="2rem">
    <Stack w="100%" spacing="1rem">
      <Text textStyle="h2" align="center" color="primary.500">
        No forms found
      </Text>
      <Text align="center">Try removing your filters </Text>
      <Flex justifyContent="center">
        <WorkspaceFormRowsFilterNoneSvg />
      </Flex>
    </Stack>
  </Box>
)

export const WorkspaceFormRows = (): JSX.Element => {
  const { isLoading, displayedForms, displayedFormsCount } =
    useWorkspaceContext()

  if (isLoading) {
    return <WorkspaceFormRowsSkeleton />
  }

  if (displayedFormsCount === 0) {
    return <WorkspaceFormRowsFilterNone />
  }

  return (
    <WorkspaceRowsProvider>
      <Stack maxW={CONTAINER_MAXW} m="auto" spacing={0} divider={<Divider />}>
        {displayedForms.map((meta) => (
          <WorkspaceFormRow px="2rem" key={meta._id} formMeta={meta} />
        ))}
      </Stack>
    </WorkspaceRowsProvider>
  )
}
