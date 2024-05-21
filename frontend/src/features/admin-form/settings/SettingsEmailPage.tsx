import { Wrap } from '@chakra-ui/react'

import { GUIDE_PREVENT_EMAIL_BOUNCE } from '~constants/links'
import FormLabel from '~components/FormControl/FormLabel'
import Input from '~components/Input'

import { CategoryHeader } from './components/CategoryHeader'

export const SettingsEmailPage = (): JSX.Element => {
  return (
    <>
      <Wrap
        shouldWrapChildren
        justify="space-between"
        align="center"
        mb="2.5rem"
      >
        <CategoryHeader mb={0} mr="2rem">
          Email notifications
        </CategoryHeader>
      </Wrap>
      <FormLabel
        isRequired={false}
        useMarkdownForDescription
        description={`FormSG securely stores responses in an encrypted format and does not retain any associated emails. Learn more on [how to guard against email bounces](${GUIDE_PREVENT_EMAIL_BOUNCE}).`}
      >
        Send an email copy of new responses
      </FormLabel>
      <Input placeholder="me@example.com" />
      <FormLabel.Description color="neutral.500" mt="0.5rem">
        Separate multiple email addresses with a comma
      </FormLabel.Description>
    </>
  )
}
