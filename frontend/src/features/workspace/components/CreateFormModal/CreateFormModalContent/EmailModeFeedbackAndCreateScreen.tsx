import { useEffect, useRef } from 'react'
import { FormProvider, RegisterOptions } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
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
import { useFormTitleValidationRules } from '~utils/formValidation'
import Button from '~components/Button'
import FormLabel from '~components/FormControl/FormLabel'
import { CheckboxField, CheckboxFieldSchema } from '~templates/Field'

import { useAdminUseEmailModeFormView } from '~features/public-form/queries'

import {
  CreateFormWizardInputProps,
  useCreateFormWizard,
} from '../CreateFormWizardContext'

import { EmailFormRecipientsInput } from './EmailFormRecipientsInput'

const useCheckboxFieldSchema: () => CheckboxFieldSchema = () => {
  const { t } = useTranslation()
  const {
    title,
    fieldOptions: { collectSensitiveHighData },
  } = t(
    'features.workspace.modals.forms.create.emailModeFeedbackCreation.checkboxFieldSchema',
  )
  return {
    _id: 'reason',
    fieldOptions: [collectSensitiveHighData],
    othersRadioButton: true,
    ValidationOptions: { customMax: null, customMin: null },
    validateByValue: false,
    fieldType: BasicField.Checkbox,
    title: title,
    description: '',
    required: true,
    disabled: false,
  }
}

// TODO: (Kill Email Mode) Remove this route after kill email mode is fully implemented.
export const EmailModeFeedbackScreen = ({
  useCreateFormWizardParam = useCreateFormWizard,
  useAdminUseEmailModeFormViewParam = useAdminUseEmailModeFormView,
}: {
  useCreateFormWizardParam?: typeof useCreateFormWizard
  useAdminUseEmailModeFormViewParam?: typeof useAdminUseEmailModeFormView
}): JSX.Element => {
  const { t } = useTranslation()
  const { feedbackScreen: translations } = t(
    'features.workspace.modals.forms.create.emailModeFeedbackCreation',
    { returnObjects: true },
  )
  const checkboxFieldSchema = useCheckboxFieldSchema()
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
          {translations.header}
          <Text textStyle="body-1" color="secondary.700" mt="1rem">
            {translations.description}
          </Text>
        </Container>
      </ModalHeader>

      <ModalBody whiteSpace="pre-wrap">
        <FormProvider {...formMethods}>
          <Container maxW="42.5rem" p={0}>
            <FormControl isRequired isInvalid={!!errors.emails} mb="2.25rem">
              <CheckboxField schema={checkboxFieldSchema} />
            </FormControl>
            <Button
              rightIcon={<BiRightArrowAlt fontSize="1.5rem" />}
              isFullWidth
              type="submit"
              isLoading={isLoading}
              isDisabled={isFetching}
              onClick={submitEmailModeFeedback(feedbackForm)}
            >
              <Text lineHeight="1.5rem">{translations.setupForm}</Text>
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
  const { t } = useTranslation()
  const { header } = t(
    'features.workspace.modals.forms.create.emailModeFeedbackCreation.creationScreen',
    { returnObjects: true },
  )
  const { name, notifications, create } = t(
    'features.workspace.modals.forms.create.details',
    {
      returnObjects: true,
    },
  )
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

  const formTitleValidationRules = useFormTitleValidationRules()

  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 200)
  }, [])

  const formTitleRegister = register(
    'title',
    formTitleValidationRules as RegisterOptions<
      CreateFormWizardInputProps,
      'title'
    >,
  )
  const mergedRef = useMergeRefs(formTitleRegister.ref, inputRef)

  const { data: feedbackForm } = useAdminUseEmailModeFormViewParam()
  if (!feedbackForm) return <></>

  return (
    <>
      <ModalHeader color="secondary.700">
        <Container maxW="42.5rem" p={0}>
          {header}
        </Container>
      </ModalHeader>
      <ModalBody whiteSpace="pre-wrap">
        <FormProvider {...formMethods}>
          <Container maxW="42.5rem" p={0}>
            <FormControl isRequired isInvalid={!!errors.title} mb="2.25rem">
              <FormLabel useMarkdownForDescription>{name.label}</FormLabel>

              <Input {...formTitleRegister} ref={mergedRef} />
              <FormErrorMessage>{errors.title?.message}</FormErrorMessage>
            </FormControl>

            <FormControl isRequired isInvalid={!!errors.emails} mb="2.25rem">
              <FormLabel
                useMarkdownForDescription
                description={t(
                  'features.workspace.modals.forms.create.details.notifications.description',
                  { GUIDE_PREVENT_EMAIL_BOUNCE },
                )}
              >
                {notifications.label}
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
              <Text lineHeight="1.5rem">{create}</Text>
            </Button>
          </Container>
        </FormProvider>
      </ModalBody>
    </>
  )
}
