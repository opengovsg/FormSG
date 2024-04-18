import { ListItem, Text, UnorderedList } from '@chakra-ui/react'

import InlineMessage from '~components/InlineMessage'

import { TwilioDetailsInputs } from './TwilioDetailsInputs'

export const TwilioSettingsSection = (): JSX.Element => {
  return (
    <>
      <InlineMessage mb="1rem" variant="warning">
        <Text>
          To comply with <strong>SNDGO Circular NO-1-2024</strong>, FormSG will
          start using Postman to send SMSes to form respondents from{' '}
          <strong>1 July 2024</strong>.
          <UnorderedList spacing="0.5rem" mt="1rem">
            <ListItem>
              We have removed the 10,000 SMSes per admin limit. Given this
              change, the capability of adding new Twilio credentials will be
              disabled from 30 April.
            </ListItem>

            <ListItem>
              Existing Twilio credentials will be auto-removed and all SMSes
              will be sent out via Postman from 30 June.
            </ListItem>
          </UnorderedList>
        </Text>
      </InlineMessage>
      <TwilioDetailsInputs />
    </>
  )
}
