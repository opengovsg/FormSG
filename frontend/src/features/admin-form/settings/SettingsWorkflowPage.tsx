import { Link, Text, Wrap } from '@chakra-ui/react'

import { FormResponseMode } from '~shared/types'

import { GUIDE_TWILIO } from '~constants/links'

import { CategoryHeader } from './components/CategoryHeader'
import { WorkflowDetailsInput } from './components/WorkflowSettingsSection/WorkflowDetailsInput'
import { WorkflowUnsupportedMsg } from './components/WorkflowSettingsSection/WorkflowUnsupportedMsg'
import { useAdminFormSettings } from './queries'

export const SettingsWorkflowPage = (): JSX.Element => {
  const { data: settings, isLoading } = useAdminFormSettings()

  // Workflow is only supported in multirespondent mode; show message if form response mode is not multirespondent
  if (
    !isLoading &&
    settings?.responseMode !== FormResponseMode.Multirespondent
  ) {
    return <WorkflowUnsupportedMsg />
  }
  return (
    <>
      <Wrap
        shouldWrapChildren
        justify="space-between"
        align="center"
        mb="2.5rem"
      >
        <CategoryHeader mb={0} mr="2rem">
          Workflow
        </CategoryHeader>
      </Wrap>
      {settings?.responseMode === FormResponseMode.Multirespondent ? (
        <>
          <Text mb="2.5rem">
            Create a workflow to collect responses from multiple respondents. We
            currently support up to three respondents.&nbsp;
            <Link href={GUIDE_TWILIO} isExternal>
              Learn more about setting up a workflow
            </Link>
          </Text>

          <WorkflowDetailsInput settings={settings} />
        </>
      ) : (
        <></>
      )}
    </>
  )
}
