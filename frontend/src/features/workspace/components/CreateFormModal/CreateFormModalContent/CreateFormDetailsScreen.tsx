import { Controller, RegisterOptions } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { BiRightArrowAlt } from 'react-icons/bi'
import {
  Container,
  FormControl,
  ModalBody,
  ModalHeader,
  Skeleton,
  Text,
} from '@chakra-ui/react'

import { FormResponseMode } from '~shared/types/form/form'

import { GUIDE_PREVENT_EMAIL_BOUNCE } from '~constants/links'
import { FORM_TITLE_VALIDATION_RULES } from '~utils/formValidation'
import Button from '~components/Button'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormFieldMessage from '~components/FormControl/FormFieldMessage'
import FormLabel from '~components/FormControl/FormLabel'
import InlineMessage from '~components/InlineMessage'
import Input from '~components/Input'

import { WorkspaceRowsProvider } from '../../WorkspaceFormRow/WorkspaceRowsContext'
import {
  CreateFormWizardInputProps,
  useCreateFormWizard,
} from '../CreateFormWizardContext'

import { EmailFormRecipientsInput } from './EmailFormRecipientsInput'
import { FormResponseOptions } from './FormResponseOptions'

/** The length of form title to start showing warning text */
const FORM_TITLE_LENGTH_WARNING = 65

const getTrackingSubmissionActionName = (
  responseModeValue: FormResponseMode,
) => {
  switch (responseModeValue) {
    case FormResponseMode.Email:
      return 'dashboard.create.create_email'
    case FormResponseMode.Encrypt:
      return 'dashboard.create.create_encrypt'
    case FormResponseMode.Multirespondent:
      return 'dashboard.create.create_multirespondent'

    default: {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _exhaustiveCheck: never = responseModeValue
    }
  }
}

export const CreateFormDetailsScreen = (): JSX.Element => {
  const { t } = useTranslation()
  const {
    formMethods,
    handleEmailFeedbackSubmit,
    handleCreateStorageModeOrMultirespondentForm,
    isLoading,
    isFetching,
    modalHeader,
    isSingpass,
  } = useCreateFormWizard()
  const {
    register,
    control,
    formState: { errors },
    watch,
  } = formMethods

  const titleInputValue = watch('title')
  const responseModeValue = watch('responseMode')
  const handleEmailButtonPress = () => {
    handleEmailFeedbackSubmit()
  }

  return (
    <>
      <ModalHeader color="secondary.700">
        <Container maxW="45rem" p={0}>
          {modalHeader}
        </Container>
      </ModalHeader>
      <ModalBody whiteSpace="pre-wrap">
        <Container maxW="45rem" p={0}>
          <FormControl isRequired isInvalid={!!errors.title} mb="2.25rem">
            <FormLabel useMarkdownForDescription>
              {t('features.workspace.modals.create.details.name.label')}
            </FormLabel>
            <Skeleton isLoaded={!isFetching}>
              <Input
                autoFocus
                {...register(
                  'title',
                  FORM_TITLE_VALIDATION_RULES as RegisterOptions<
                    CreateFormWizardInputProps,
                    'title'
                  >,
                )}
              />
            </Skeleton>
            <FormErrorMessage>{errors.title?.message}</FormErrorMessage>
            {titleInputValue?.length > FORM_TITLE_LENGTH_WARNING ? (
              <FormFieldMessage>
                {t('features.workspace.modals.create.details.name.message')}
              </FormFieldMessage>
            ) : null}
          </FormControl>
          <FormControl isRequired isInvalid={!!errors.responseMode} mb="2.5rem">
            <FormLabel>
              {t('features.workspace.modals.create.details.type.label')}
            </FormLabel>
            <Skeleton isLoaded={!isFetching}>
              <Controller
                name="responseMode"
                control={control}
                render={({ field }) => (
                  <WorkspaceRowsProvider>
                    <FormResponseOptions
                      {...field}
                      isSingpass={isSingpass}
                      handleEmailButtonPress={handleEmailButtonPress}
                    />
                  </WorkspaceRowsProvider>
                )}
                rules={{
                  required: t(
                    'features.workspace.modals.create.errors.responseMode.required',
                  ),
                }}
              />
            </Skeleton>
            <FormErrorMessage>{errors.responseMode?.message}</FormErrorMessage>
            {isSingpass && (
              <InlineMessage mt="2rem">
                {t('features.workspace.modals.create.errors.noSingpassInMrf')}
              </InlineMessage>
            )}
          </FormControl>
          {(responseModeValue === FormResponseMode.Encrypt ||
            responseModeValue === FormResponseMode.Email) && (
            <FormControl
              isRequired={responseModeValue === FormResponseMode.Email}
              isInvalid={!!errors.emails}
              mb="2.25rem"
            >
              <FormLabel
                isRequired={responseModeValue === FormResponseMode.Email}
                useMarkdownForDescription
                description={t(
                  'features.workspace.modals.create.details.notifications.description',
                  { GUIDE_PREVENT_EMAIL_BOUNCE },
                )}
              >
                {t(
                  'features.workspace.modals.create.details.notifications.label',
                )}
              </FormLabel>
              <EmailFormRecipientsInput />
            </FormControl>
          )}
          <Button
            rightIcon={<BiRightArrowAlt fontSize="1.5rem" />}
            type="submit"
            isLoading={isLoading}
            isDisabled={isFetching}
            onClick={handleCreateStorageModeOrMultirespondentForm}
            isFullWidth
            data-dd-action-name={getTrackingSubmissionActionName(
              responseModeValue,
            )}
          >
            <Text lineHeight="1.5rem">
              {t('features.workspace.modals.create.details.create')}
            </Text>
          </Button>
        </Container>
      </ModalBody>
    </>
  )
}
