import { FormProvider } from 'react-hook-form'
import { BiRightArrowAlt } from 'react-icons/bi'
import {
  Container,
  FormControl,
  FormErrorMessage,
  Input,
  ModalBody,
  Text,
} from '@chakra-ui/react'

import { BasicField } from '~shared/types'

import { GUIDE_PREVENT_EMAIL_BOUNCE } from '~constants/links'
import { FORM_TITLE_VALIDATION_RULES } from '~utils/formValidation'
import Button from '~components/Button'
import FormLabel from '~components/FormControl/FormLabel'
import { CheckboxField, CheckboxFieldSchema } from '~templates/Field'

import { useAdminUseEmailModeFormView } from '~features/public-form/queries'

import { useCreateFormWizard } from '../CreateFormWizardContext'

import { EmailFormRecipientsInput } from './EmailFormRecipientsInput'

const CHECKBOX_FIELD_SCHEMA: CheckboxFieldSchema = {
  _id: 'reason',
  fieldOptions: [
    'I need to collect Sensitive High data',
    'I need to receive attachments via email',
    'I use the JSON in Email mode responses for automations',
  ],
  othersRadioButton: true,
  ValidationOptions: { customMax: null, customMin: null },
  validateByValue: false,
  fieldType: BasicField.Checkbox,
  title: 'Why are you creating an Email mode form?',
  description: '',
  required: true,
  disabled: false,
}

// TODO: (Kill Email Mode) Remove this route after kill email mode is fully implemented.
export const EmailModeFeedbackAndCreateScreen = (): JSX.Element => {
  const {
    formMethods,

    handleCreateEmailModeForm,
    isLoading,
    isFetching,
  } = useCreateFormWizard()
  const {
    register,
    formState: { errors },
  } = formMethods

  const { data: feedbackForm } = useAdminUseEmailModeFormView()
  if (!feedbackForm) return <></>

  return (
    <ModalBody whiteSpace="pre-wrap">
      <FormProvider {...formMethods}>
        <Container maxW="42.5rem" p={0}>
          <FormControl isRequired isInvalid={!!errors.title} mb="2.25rem">
            <FormLabel useMarkdownForDescription>Form name</FormLabel>

            <Input
              autoFocus
              {...register('title', FORM_TITLE_VALIDATION_RULES)}
            />
            <FormErrorMessage>{errors.title?.message}</FormErrorMessage>
          </FormControl>

          <FormControl isRequired isInvalid={!!errors.emails} mb="2.25rem">
            <FormLabel
              useMarkdownForDescription
              description={`All email addresses below will be notified. Learn more on [how to guard against email bounces](${GUIDE_PREVENT_EMAIL_BOUNCE}).`}
            >
              Notifications for new responses
            </FormLabel>
            <EmailFormRecipientsInput />
          </FormControl>

          <FormControl isRequired isInvalid={!!errors.emails} mb="2.25rem">
            <CheckboxField schema={CHECKBOX_FIELD_SCHEMA} />
          </FormControl>
          <Button
            rightIcon={<BiRightArrowAlt fontSize="1.5rem" />}
            type="submit"
            isLoading={isLoading}
            isDisabled={isFetching}
            onClick={handleCreateEmailModeForm(feedbackForm)}
          >
            <Text lineHeight="1.5rem">Next step</Text>
          </Button>
        </Container>
      </FormProvider>
    </ModalBody>
  )
}
