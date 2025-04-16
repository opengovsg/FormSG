import { useCallback, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { BiEditAlt, BiPencil } from 'react-icons/bi'
import {
  Flex,
  FormLabel,
  Skeleton,
  Stack,
  Text,
  useDisclosure,
} from '@chakra-ui/react'

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

  //   const handleRespondentCustomiseEmail = useCallback(() => {
  //     if (!settings || isLoadingSettings || mutateFormCaptcha.isLoading) return
  //     const nextHasCaptcha = !settings.hasCaptcha
  //     return mutateFormCaptcha.mutate(nextHasCaptcha)
  //   }, [isLoadingSettings, mutateFormCaptcha, settings])

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
          setCustomEmail={() => {}}
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
            Test
          </Button>
        </Flex>
      </Skeleton>
    </>
  )
}
