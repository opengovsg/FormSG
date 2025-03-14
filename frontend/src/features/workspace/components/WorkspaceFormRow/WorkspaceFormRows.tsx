import { useTranslation } from 'react-i18next'
import { Box, Divider, Flex, Stack, Text } from '@chakra-ui/react'

import { useWorkspaceContext } from '~features/workspace/WorkspaceContext'

import { WorkspaceFormRow } from './WorkspaceFormRow'
import { WorkspaceFormRowsFilterNoneSvg } from './WorkspaceFormRowsFilterNoneSvg'
import { WorkspaceFormRowSkeleton } from './WorkspaceFormRowSkeleton'
import { WorkspaceRowsProvider } from './WorkspaceRowsContext'

const WorkspaceFormRowsSkeleton = () => {
  return (
    <Stack m="auto" spacing={0} divider={<Divider />}>
      <WorkspaceFormRowSkeleton />
      <WorkspaceFormRowSkeleton />
      <WorkspaceFormRowSkeleton />
      <WorkspaceFormRowSkeleton />
    </Stack>
  )
}

const WorkspaceFormRowsFilterNone = (): JSX.Element => {
  const { t } = useTranslation()
  const { title, subText } = t('features.workspace.search.noneFound', {
    returnObjects: true,
  })
  return (
    <Box mt="2rem">
      <Stack w="100%" spacing="1rem">
        <Text textStyle="h2" align="center" color="primary.500">
          {title}
        </Text>
        <Flex justify="center" align="center">
          <Text align="center">{subText}</Text>
        </Flex>
        <Flex justifyContent="center">
          <WorkspaceFormRowsFilterNoneSvg />
        </Flex>
      </Stack>
    </Box>
  )
}

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
      <Stack m="auto" spacing={0} divider={<Divider />}>
        {displayedForms.map((meta) => (
          <WorkspaceFormRow
            px={{ base: '2rem', md: '4rem' }}
            key={meta._id}
            formMeta={meta}
          />
        ))}
      </Stack>
    </WorkspaceRowsProvider>
  )
}
