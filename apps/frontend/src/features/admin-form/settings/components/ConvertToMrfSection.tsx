import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { Flex, Skeleton, Stack, Text } from '@chakra-ui/react'

import {
  FormResponseMode,
  FormStatus,
  StorageFormDto,
} from 'formsg-shared/types/form/form'
import { PaymentChannel } from 'formsg-shared/types/payment'

import Button from '~components/Button'
import Tooltip from '~components/Tooltip'

import {
  useAdminForm,
  useAdminFormCollaborators,
} from '~features/admin-form/common/queries'

import { useMutateConvertEncryptToMrf } from '../mutations'

export const ConvertToMrfSection = (): JSX.Element | null => {
  const { formId } = useParams()
  const { data: form, isLoading: isLoadingForm } = useAdminForm()
  const { isFormAdmin, isLoading: isLoadingCollabs } =
    useAdminFormCollaborators(formId ?? '')

  const convertMutation = useMutateConvertEncryptToMrf()

  const disabledReason = useMemo<string | undefined>(() => {
    if (!form) return undefined
    if (!isFormAdmin) {
      return 'Only the form owner can convert this form.'
    }
    if (form.status !== FormStatus.Private) {
      return 'Close the form before converting.'
    }
    const storageForm = form as StorageFormDto
    if (
      storageForm.payments_channel?.channel !== PaymentChannel.Unconnected ||
      storageForm.payments_field?.enabled
    ) {
      return 'Disconnect payments before converting.'
    }
    return undefined
  }, [form, isFormAdmin])

  if (isLoadingForm || isLoadingCollabs) {
    return <Skeleton h="6rem" />
  }

  // Only show for Storage-mode forms.
  if (!form || form.responseMode !== FormResponseMode.Encrypt) {
    return null
  }

  const button = (
    <Button
      onClick={() => convertMutation.mutate()}
      isLoading={convertMutation.isLoading}
      isDisabled={!!disabledReason}
      colorScheme="primary"
    >
      Convert to Multi-Respondent Form
    </Button>
  )

  return (
    <Stack spacing="1rem">
      <Text textStyle="h4" color="secondary.500">
        Convert to Multi-Respondent Form
      </Text>
      <Text textStyle="body-1" color="secondary.500">
        Convert this Storage-mode form into a Multi-Respondent Form so multiple
        respondents can complete it in sequence. This action cannot be undone.
        Existing responses remain accessible.
      </Text>
      <Flex>
        {disabledReason ? (
          <Tooltip label={disabledReason} placement="top">
            <Flex>{button}</Flex>
          </Tooltip>
        ) : (
          button
        )}
      </Flex>
    </Stack>
  )
}
