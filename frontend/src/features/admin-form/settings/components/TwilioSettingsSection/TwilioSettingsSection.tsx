import { ListItem, Stack, Text, UnorderedList } from '@chakra-ui/react'
import { useFeatureValue } from '@growthbook/growthbook-react'
import { Infobox } from '@opengovsg/design-system-react'

import { featureFlags } from '~shared/constants'

import { TwilioDetailsInputs } from './TwilioDetailsInputs'

export const TwilioSettingsSection = (): JSX.Element => {
  const isAddingTwilioDisabled = useFeatureValue(
    featureFlags.addingTwilioDisabled,
    false,
  )

  const verbTense = isAddingTwilioDisabled ? 'has been' : 'will be'

  return (
    <>
      <Infobox mb="1rem" variant="warning">
        <Stack spacing={0}>
          <Text>
            To comply with <strong>SNDGO Circular NO-1-2024</strong>, FormSG
            will start using gov.sg secured channel to send SMSes to form
            respondents from <strong>1 July 2024</strong>.
          </Text>
          <UnorderedList spacing="0.5rem" mt="1rem">
            <ListItem>
              There is no longer a limit of 10,000 SMSes per form admin. Given
              this change, the capability of adding new Twilio credentials{' '}
              {verbTense} disabled from 30 April.
            </ListItem>

            <ListItem>
              Existing Twilio credentials will automatically be removed and all
              SMSes will be sent out via gov.sg from 30 June.
            </ListItem>
          </UnorderedList>
        </Stack>
      </Infobox>
      <TwilioDetailsInputs />
    </>
  )
}
