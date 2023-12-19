import { Text } from '@chakra-ui/react'

import { FormResponseMode } from '~shared/types'

import { GUIDE_TWILIO } from '~constants/links'
import Link from '~components/Link'

import { useAdminFormSettings } from '../../queries'

import { WorkflowDetailsInput } from './WorkflowDetailsInput'

export const WorkflowSettingsSection = (): JSX.Element => {
  const { data: settings, isLoading } = useAdminFormSettings()
  return settings?.responseMode === FormResponseMode.Multirespondent ? (
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
  )
}
