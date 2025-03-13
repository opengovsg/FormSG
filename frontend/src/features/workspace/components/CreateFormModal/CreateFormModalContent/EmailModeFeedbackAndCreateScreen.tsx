import { useEffect, useRef } from 'react'
import { FormProvider } from 'react-hook-form'
import { BiRightArrowAlt } from 'react-icons/bi'
import {
  Container,
  FormControl,
  FormErrorMessage,
  Input,
  ModalBody,
  ModalHeader,
  Text,
  useMergeRefs,
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
  fieldOptions: ['I need to collect Sensitive High data'],
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
export const EmailModeFeedbackScreen = ({
  useCreateFormWizardParam = useCreateFormWizard,
  useAdminUseEmailModeFormViewParam = useAdminUseEmailModeFormView,
}: {
  useCreateFormWizardParam?: typeof useCreateFormWizard
  useAdminUseEmailModeFormViewParam?: typeof useAdminUseEmailModeFormView
}): JSX.Element => {
  const { formMethods, submitEmailModeFeedback, isLoading, isFetching } =
    useCreateFormWizardParam()
  const {
    formState: { errors },
  } = formMethods

  const { data: feedbackForm } = useAdminUseEmailModeFormViewParam()
  if (!feedbackForm) return <></>

  return (
    <>
      <ModalHeader color="secondary.700">
        <Container maxW="42.5rem" p={0}>
          Before you get started
          <Text textStyle="body-1" color="secondary.700" mt="1rem">
            We’d love to understand why you chose to create an Email mode form.
            This will help us ensure a smooth transition once we phase out Email
            mode.
          </Text>
        </Container>
      </ModalHeader>

      <ModalBody whiteSpace="pre-wrap">
        <FormProvider {...formMethods}>
          <Container maxW="42.5rem" p={0}>
            <FormControl isRequired isInvalid={!!errors.emails} mb="2.25rem">
              <CheckboxField schema={CHECKBOX_FIELD_SCHEMA} />
            </FormControl>
            <Button
              rightIcon={<BiRightArrowAlt fontSize="1.5rem" />}
              isFullWidth
              type="submit"
              isLoading={isLoading}
              isDisabled={isFetching}
              onClick={submitEmailModeFeedback(feedbackForm)}
            >
              <Text lineHeight="1.5rem">Next: Set up your form</Text>
            </Button>
          </Container>
        </FormProvider>
      </ModalBody>
    </>
  )
}

export const EmailModeCreationScreen = ({
  useCreateFormWizardParam = useCreateFormWizard,
  useAdminUseEmailModeFormViewParam = useAdminUseEmailModeFormView,
}: {
  useCreateFormWizardParam?: typeof useCreateFormWizard
  useAdminUseEmailModeFormViewParam?: typeof useAdminUseEmailModeFormView
}): JSX.Element => {
  const {
    formMethods,

    handleCreateEmailModeForm,
    isLoading,
    isFetching,
  } = useCreateFormWizardParam()
  const {
    register,
    formState: { errors },
  } = formMethods

  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 200)
  }, [])

  const formTitleRegister = register('title', FORM_TITLE_VALIDATION_RULES)
  const mergedRef = useMergeRefs(formTitleRegister.ref, inputRef)

  const { data: feedbackForm } = useAdminUseEmailModeFormViewParam()
  if (!feedbackForm) return <></>

  return (
    <>
      <ModalHeader color="secondary.700">
        <Container maxW="42.5rem" p={0}>
          Set up your form in Email mode
        </Container>
      </ModalHeader>
      <ModalBody whiteSpace="pre-wrap">
        <FormProvider {...formMethods}>
          <Container maxW="42.5rem" p={0}>
            <FormControl isRequired isInvalid={!!errors.title} mb="2.25rem">
              <FormLabel useMarkdownForDescription>Form name</FormLabel>

              <Input {...formTitleRegister} ref={mergedRef} />
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

            <Button
              rightIcon={<BiRightArrowAlt fontSize="1.5rem" />}
              type="submit"
              isLoading={isLoading}
              isDisabled={isFetching}
              isFullWidth
              onClick={handleCreateEmailModeForm()}
              data-dd-action-name="dashboard.create.create_email"
            >
              <Text lineHeight="1.5rem">Create form</Text>
            </Button>
          </Container>
        </FormProvider>
      </ModalBody>
    </>
  )
}
