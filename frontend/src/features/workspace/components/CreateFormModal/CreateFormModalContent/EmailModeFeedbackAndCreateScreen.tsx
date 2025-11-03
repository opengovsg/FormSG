import { useEffect, useMemo, useRef } from 'react'
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

// TODO: (Kill Email Mode) Remove this route after kill email mode is fully implemented.
export const EmailModeFeedbackScreen = ({
  useCreateFormWizardParam = useCreateFormWizard,
  useAdminUseEmailModeFormViewParam = useAdminUseEmailModeFormView,
}: {
  useCreateFormWizardParam?: typeof useCreateFormWizard
  useAdminUseEmailModeFormViewParam?: typeof useAdminUseEmailModeFormView
}): JSX.Element => {
  const { t } = useTranslation('translation', {
    keyPrefix: 'features.workspace.modals.forms.create.emailModeFeedback',
  })
  const { formMethods, submitEmailModeFeedback, isLoading, isFetching } =
    useCreateFormWizardParam()
  const {
    formState: { errors },
  } = formMethods

  const checkboxFieldSchema: CheckboxFieldSchema = useMemo(
    () => ({
      _id: 'reason',
      fieldOptions: [t('question.options.sensitiveHigh')],
      othersRadioButton: true,
      ValidationOptions: { customMax: null, customMin: null },
      validateByValue: false,
      fieldType: BasicField.Checkbox,
      title: t('question.title'),
      description: '',
      required: true,
      disabled: false,
    }),
    [t],
  )

  const { data: feedbackForm } = useAdminUseEmailModeFormViewParam()
  if (!feedbackForm) return <></>

  return (
    <>
      <ModalHeader color="secondary.700">
        <Container maxW="42.5rem" p={0}>
          {t('header')}
          <Text textStyle="body-1" color="secondary.700" mt="1rem">
            {t('description')}
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
              <Text lineHeight="1.5rem">{t('next')}</Text>
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
  const { t } = useTranslation('translation', {
    keyPrefix: 'features.workspace.modals.forms.create.emailModeCreation',
  })
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
          {t('header')}
        </Container>
      </ModalHeader>
      <ModalBody whiteSpace="pre-wrap">
        <FormProvider {...formMethods}>
          <Container maxW="42.5rem" p={0}>
            <FormControl isRequired isInvalid={!!errors.title} mb="2.25rem">
              <FormLabel useMarkdownForDescription>
                {t('formName.label')}
              </FormLabel>

              <Input {...formTitleRegister} ref={mergedRef} />
              <FormErrorMessage>{errors.title?.message}</FormErrorMessage>
            </FormControl>

            <FormControl isRequired isInvalid={!!errors.emails} mb="2.25rem">
              <FormLabel
                useMarkdownForDescription
                description={t('notifications.description', {
                  GUIDE_PREVENT_EMAIL_BOUNCE,
                })}
              >
                {t('notifications.label')}
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
              <Text lineHeight="1.5rem">{t('create')}</Text>
            </Button>
          </Container>
        </FormProvider>
      </ModalBody>
    </>
  )
}
