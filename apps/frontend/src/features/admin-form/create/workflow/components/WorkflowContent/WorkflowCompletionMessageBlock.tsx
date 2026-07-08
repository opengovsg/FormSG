import { useTranslation } from 'react-i18next'
import { Link as ReactLink } from 'react-router-dom'
import { Link, Text } from '@chakra-ui/react'

import InlineMessage from '~components/InlineMessage'

import { useIsWorkflowBuilderRedesign } from '../../hooks/useIsWorkflowBuilderRedesign'

export const WorkflowCompletionMessageBlock = (): JSX.Element => {
  const { t } = useTranslation()
  const isRedesign = useIsWorkflowBuilderRedesign()
  const { prefix, prefixRedesign, link, suffix } = t(
    'features.adminForm.sidebar.workflow.approvals.complete',
    { returnObjects: true },
  )
  return (
    <InlineMessage variant="info">
      <Text>
        {isRedesign ? prefixRedesign : prefix}{' '}
        <Link as={ReactLink} to={'settings/email-notifications'}>
          {link}
        </Link>
        {' ' + suffix}
      </Text>
    </InlineMessage>
  )
}
