import { useCallback, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { BiEditAlt } from 'react-icons/bi'
import { Flex, FormLabel, Skeleton, useDisclosure } from '@chakra-ui/react'

import Button from '~components/Button'

import { useMutateFormSettings } from '../../mutations'
import { useAdminFormSettings } from '../../queries'

import { CustomiseEmailModal } from './CustomiseEmailModal'

export const RespondentCustomiseEmail = (): JSX.Element => {
  const { t } = useTranslation()
  const { data: settings, isLoading: isLoadingSettings } =
    useAdminFormSettings()

  const hasCaptcha = useMemo(() => settings?.hasCaptcha, [settings]) //TODO: update settings from hasCaptcha to rc

  const { mutateFormCaptcha } = useMutateFormSettings()

  // const handleRespondentCustomiseEmail = useCallback(
  //   (data: string) => {
  //     if (!settings || isLoadingSettings || mutateFormCaptcha.isLoading) return
  //     console.log(data)
  //   },
  //   [isLoadingSettings, mutateFormCaptcha, settings],
  // )

  const handleRespondentCustomiseEmail = ({
    subject,
    senderName,
    emailBody,
  }: {
    subject: string
    senderName: string
    emailBody: string
  }) => {
    console.log(subject)
    console.log(senderName)
    console.log(emailBody)
    // if (!settings || isLoadingSettings || mutateFormCaptcha.isLoading) return
    onClose()
    return
  }

  const { isOpen, onOpen, onClose } = useDisclosure()

  const formMethods = useForm({
    mode: 'onChange',
    defaultValues: {
      // subject: settings.customEmailSubject,
      subject: '',
      senderName: '',
      emailBody: '',
    },
  })

  const {
    formState: { errors },
    control,
    handleSubmit,
  } = formMethods

  return (
    <>
      <Skeleton isLoaded={!isLoadingSettings && !!settings}>
        <CustomiseEmailModal
          isMobile={false}
          isOpen={isOpen}
          onClose={onClose}
          control={control}
          errors={errors}
          onSubmit={handleSubmit((values) =>
            handleRespondentCustomiseEmail(values),
          )}
          responseMode={settings?.responseMode} //TODO: Fix settings that can be undefined
        />
        <Flex
          justifyContent="space-between"
          alignItems="center"
          mb={2}
          mt="2rem"
        >
          <FormLabel>
            {t(
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
