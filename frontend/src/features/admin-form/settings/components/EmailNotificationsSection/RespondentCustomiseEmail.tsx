import { useCallback, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { BiEditAlt } from 'react-icons/bi'
import { Flex, Skeleton, Stack, useDisclosure } from '@chakra-ui/react'

import { FormResponseMode } from '~shared/types'

import Button from '~components/Button'
import FormLabel from '~components/FormControl/FormLabel'

import { useMutateFormSettings } from '../../mutations'
import { useAdminFormSettings } from '../../queries'

import { CustomiseEmailModal } from './CustomiseEmailModal'

export const RespondentCustomiseEmail = (): JSX.Element => {
  const { t } = useTranslation()
  const { data: settings, isLoading: isLoadingSettings } =
    useAdminFormSettings()

  const isMrf = settings?.responseMode == FormResponseMode.Multirespondent

  const { mutateFormRespondentCopyCustomEmail, mutateFormNextStepCustomEmail } =
    useMutateFormSettings()

  const handleCustomiseEmail = ({
    subject,
    senderName,
    emailBody,
  }: {
    subject: string | undefined
    senderName: string | undefined
    emailBody: string | undefined
  }) => {
    if (
      !settings ||
      isLoadingSettings ||
      mutateFormRespondentCopyCustomEmail.isLoading ||
      mutateFormNextStepCustomEmail.isLoading || //TODO: make these independent
      !subject ||
      !senderName ||
      !emailBody //TODO: resolve undefined errors
    )
      return
    return isMrf
      ? mutateFormNextStepCustomEmail.mutate(
          {
            nextStepCustomEmailSubject: subject,
            nextStepCustomEmailSenderName: senderName,
            nextStepCustomEmailBody: emailBody,
          },
          {
            onSuccess: () => {
              // Call onClose after the mutation is successful
              onClose()
            },
          },
        )
      : mutateFormRespondentCopyCustomEmail.mutate(
          {
            respondentCopyCustomEmailSubject: subject,
            respondentCopyCustomEmailSenderName: senderName,
            respondentCopyCustomEmailBody: emailBody,
          },
          {
            onSuccess: () => {
              // Call onClose after the mutation is successful
              onClose()
            },
          },
        )
  }

  const { isOpen, onOpen, onClose } = useDisclosure()

  const formMethods = useForm({
    mode: 'onChange',
    defaultValues: isMrf
      ? {
          subject: settings?.nextStepCustomEmailSubject,
          senderName: settings?.nextStepCustomEmailSenderName,
          emailBody: settings?.nextStepCustomEmailBody,
        }
      : {
          subject: settings?.respondentCopyCustomEmailSubject,
          senderName: settings?.respondentCopyCustomEmailSenderName,
          emailBody: settings?.respondentCopyCustomEmailBody,
        },
  })

  const {
    formState: { errors },
    control,
    handleSubmit,
  } = formMethods

  const responseMode = settings?.responseMode

  const CUSTOMISE_LABEL_DESCRIPTION = isMrf
    ? t(
        'features.adminForm.settings.emailNotifications.section.mrf.respondents.customiseEmailLabel',
      )
    : undefined
  return (
    <>
      <Skeleton isLoaded={!isLoadingSettings && !!settings}>
        <CustomiseEmailModal
          isMobile={false}
          isOpen={isOpen}
          onClose={onClose}
          control={control}
          errors={errors}
          onSubmit={handleSubmit((values) => handleCustomiseEmail(values))}
          responseMode={responseMode}
        />
        <Flex justifyContent="space-between" alignItems="center" mb={2}>
          <FormLabel isRequired description={CUSTOMISE_LABEL_DESCRIPTION}>
            {responseMode == FormResponseMode.Multirespondent
              ? t(
                  'features.adminForm.settings.emailNotifications.section.mrf.respondents.customiseEmailLabel',
                )
              : t(
                  'features.adminForm.settings.emailNotifications.section.regular.customiseEmailLabel',
                )}
          </FormLabel>
          <Button
            onClick={onOpen}
            isLoading={false}
            isDisabled={false}
            variant={'outline'}
            gap="0.5rem"
          >
            <BiEditAlt />
            Edit
          </Button>
        </Flex>
      </Skeleton>
    </>
  )
}
