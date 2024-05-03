import { BiPlus } from 'react-icons/bi'
import { Flex, Text } from '@chakra-ui/react'

import { GUIDE_FORM_MRF } from '~constants/links'
import Button from '~components/Button'
import Link from '~components/Link'

import {
  setToCreatingSelector,
  useAdminWorkflowStore,
} from '../adminWorkflowStore'

import { WorkflowSvgr } from './WorkflowSvgr'

export const EmptyWorkflow = (): JSX.Element => {
  const setToCreating = useAdminWorkflowStore(setToCreatingSelector)

  return (
    <Flex
      textAlign="center"
      flexDir="column"
      align="center"
      color="secondary.500"
      pt={{ base: '0.5rem', md: '2.75rem' }}
    >
      <Text textStyle="h4" as="h2">
        Create a workflow to collect responses from multiple respondents in the
        same form submission
      </Text>
      <Text textStyle="body-1" mt="1rem">
        Assign respondents to specific steps, and control which fields they can
        fill.{' '}
        <Link isExternal href={GUIDE_FORM_MRF}>
          Learn how to create a workflow
        </Link>
      </Text>
      <Button
        my="2.5rem"
        leftIcon={<BiPlus fontSize="1.5rem" />}
        onClick={setToCreating}
      >
        Create workflow
      </Button>
      <WorkflowSvgr maxW="292px" />
    </Flex>
  )
}
