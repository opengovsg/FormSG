import { Controller } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { BiRightArrowAlt } from 'react-icons/bi'
import {
  Box,
  Container,
  FormControl,
  ModalBody,
  ModalHeader,
  Skeleton,
  Text,
} from '@chakra-ui/react'

import { FormResponseMode } from 'formsg-shared/types/form/form'

import { GUIDE_PREVENT_EMAIL_BOUNCE } from '~constants/links'
import Button from '~components/Button'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import InlineMessage from '~components/InlineMessage'

import DataClassificationInfoBox from '~features/admin-form/settings/components/DataClassificationInfoBox'

import { useCreateFormWizard } from '../CreateFormWizardContext'

import { EmailFormRecipientsInput } from './EmailFormRecipientsInput'
import { EscapeHatchLink } from './EscapeHatchLink'
import { FormResponseOptions } from './FormResponseOptions'
import { FormTitleInput } from './FormTitleInput'

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
    handleProceedFromDetails,
    isLoading,
    isFetching,
    modalHeader,
    hasMyInfoChildren,
    isMrfCutoverEnabled,
    isPaperTrackingSetUpPageEnabled,
    goToStorageModeDetails,
  } = useCreateFormWizard()
  const {
    control,
    formState: { errors },
    watch,
  } = formMethods

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
          <FormTitleInput />
          {isMrfCutoverEnabled ? (
            <Box my="2.5rem">
              <EscapeHatchLink onClick={goToStorageModeDetails} />
            </Box>
          ) : (
            <FormControl
              isRequired
              isInvalid={!!errors.responseMode}
              mb="2.5rem"
            >
              <FormLabel
                description={t(
                  'features.workspace.modals.forms.create.details.type.description',
                )}
              >
                {t('features.workspace.modals.forms.create.details.type.label')}
              </FormLabel>
              <Skeleton isLoaded={!isFetching}>
                <Controller
                  name="responseMode"
                  control={control}
                  render={({ field }) => (
                    <FormResponseOptions
                      {...field}
                      hasMyInfoChildren={hasMyInfoChildren}
                      handleEmailButtonPress={handleEmailButtonPress}
                    />
                  )}
                  rules={{
                    required: t(
                      'features.workspace.modals.forms.create.errors.responseMode.required',
                    ),
                  }}
                />
              </Skeleton>
              <FormErrorMessage>
                {errors.responseMode?.message}
              </FormErrorMessage>
              {hasMyInfoChildren && (
                <InlineMessage mt="2rem">
                  {t(
                    'features.workspace.modals.forms.create.errors.noMyInfoChildrenInMrf',
                  )}
                </InlineMessage>
              )}
            </FormControl>
          )}
          {!isMrfCutoverEnabled &&
            (responseModeValue === FormResponseMode.Encrypt ||
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
                    'features.workspace.modals.forms.create.details.notifications.description',
                    { GUIDE_PREVENT_EMAIL_BOUNCE },
                  )}
                >
                  {t(
                    'features.workspace.modals.forms.create.details.notifications.label',
                  )}
                </FormLabel>
                <EmailFormRecipientsInput />
              </FormControl>
            )}
          {!isMrfCutoverEnabled && <DataClassificationInfoBox />}
          <Button
            rightIcon={<BiRightArrowAlt fontSize="1.5rem" />}
            type="submit"
            isLoading={isLoading}
            isDisabled={isFetching}
            onClick={handleProceedFromDetails}
            isFullWidth
            data-dd-action-name={getTrackingSubmissionActionName(
              responseModeValue,
            )}
          >
            <Text lineHeight="1.5rem">
              {isPaperTrackingSetUpPageEnabled && isMrfCutoverEnabled
                ? t('features.workspace.modals.forms.create.details.next')
                : t('features.workspace.modals.forms.create.details.create')}
            </Text>
          </Button>
        </Container>
      </ModalBody>
    </>
  )
}
