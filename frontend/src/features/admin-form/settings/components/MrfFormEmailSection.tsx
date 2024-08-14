import { Box } from '@chakra-ui/react'

import { FormStatus, MultirespondentFormSettings } from '~shared/types/form'

import { MultiSelect } from '~components/Dropdown'
import FormLabel from '~components/FormControl/FormLabel'
import { TagInput } from '~components/TagInput'

import { EmailNotificationsHeader } from './EmailNotificationsHeader'

interface MrfFormEmailSectionProps {
  settings: MultirespondentFormSettings
}

export const MrfFormEmailSection = ({
  settings,
}: MrfFormEmailSectionProps): JSX.Element => {
  const isFormPublic = settings.status === FormStatus.Public

  return (
    <>
      <EmailNotificationsHeader
        isFormPublic={isFormPublic}
        isPaymentsEnabled={false}
        isFormResponseModeEmail={false}
      />
      <Box>
        <FormLabel>Notify respondents in your workflow</FormLabel>
        <Box my="0.75rem">
          <MultiSelect
            name=""
            items={['email1@gmail.com', 'email2@gmail.com']}
            values={[]}
            onChange={() => {
              console.log('example')
            }}
            placeholder="Select respondents from your form"
            isSelectedItemFullWidth
          />
        </Box>
      </Box>
      <Box my="2rem">
        <FormLabel
          tooltipVariant="info"
          tooltipPlacement="top"
          tooltipText="Include the form admin's email to inform them when a new submission's workflow is completed"
        >
          Notify other parties
        </FormLabel>
        <TagInput />
        <FormLabel.Description color="secondary.400" mt="0.5rem">
          Separate multiple email addresses with a comma
        </FormLabel.Description>
      </Box>
    </>
  )
}
