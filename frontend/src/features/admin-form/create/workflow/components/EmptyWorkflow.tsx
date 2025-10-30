import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation('translation', {
    keyPrefix: 'features.adminForm.sidebar.workflow.emptyWorkflow',
  })
  const setToCreating = useAdminWorkflowStore(setToCreatingSelector)

  return (
    <Flex
      textAlign="center"
      flexDir="column"
      align="center"
      color="secondary.500"
      pt={{ base: '0.5rem', md: '2.75rem' }}
    >
      <Text textStyle="h2" as="h2">
        {t('title')}
      </Text>
      <Text textStyle="body-1" mt="1rem">
        {t('description')}{' '}
        <Link isExternal href={GUIDE_FORM_MRF}>
          {t('learnMore')}
        </Link>
      </Text>
      <Button
        my="2.5rem"
        leftIcon={<BiPlus fontSize="1.5rem" />}
        onClick={setToCreating}
      >
        {t('createButton')}
      </Button>
      <WorkflowSvgr maxW="292px" />
    </Flex>
  )
}
