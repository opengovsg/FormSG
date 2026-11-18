import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Box, Container, UseDisclosureReturn } from '@chakra-ui/react'

import { FormStatus } from 'formsg-shared/types/form/form'

import { ProgressIndicator } from '~components/ProgressIndicator/ProgressIndicator'

import { useMutateFormSettings } from '../mutations'

import { FormOriginOnOpenModal } from './FormOriginOnOpenModal'
import { SecretKeyFormModal } from './SecretKeyFormModal'

export interface SecretKeyActivationModalProps extends Pick<
  UseDisclosureReturn,
  'onClose' | 'isOpen'
> {
  publicKey: string
  /** Ask the origin question before the secret key (step 1 of 2). */
  askFormOrigin?: boolean
}

const OpenFormProgress = ({ currActiveIdx }: { currActiveIdx: number }) => (
  <Box px="1.5rem" pb="1rem">
    <Container maxW="42.5rem">
      <ProgressIndicator
        numIndicators={2}
        currActiveIdx={currActiveIdx}
        onClick={undefined}
      />
    </Container>
  </Box>
)

export const SecretKeyActivationModal = ({
  onClose,
  isOpen,
  publicKey,
  askFormOrigin = false,
}: SecretKeyActivationModalProps): JSX.Element => {
  const { t } = useTranslation()
  const { modalTitle, submitButton } = t(
    'features.adminForm.settings.secretKeyModal.activation',
    { returnObjects: true },
  )
  const { mutateFormStatus, mutateFormOrigins } = useMutateFormSettings()
  // Once answered, askFormOrigin turns false (the form now has an origin),
  // but the key step should still read as step 2 of 2 in this flow.
  const [hasAnsweredOrigin, setHasAnsweredOrigin] = useState(false)

  const handleClose = () => {
    setHasAnsweredOrigin(false)
    onClose()
  }

  const onSubmit = () => {
    return mutateFormStatus.mutate(FormStatus.Public, {
      onSuccess: handleClose,
    })
  }

  if (askFormOrigin && !hasAnsweredOrigin) {
    return (
      <FormOriginOnOpenModal
        isOpen={isOpen}
        onClose={handleClose}
        isLoading={mutateFormOrigins.isLoading}
        header={<OpenFormProgress currActiveIdx={0} />}
        onSubmit={(formOrigin) =>
          mutateFormOrigins.mutate(formOrigin, {
            onSuccess: () => setHasAnsweredOrigin(true),
          })
        }
      />
    )
  }

  return (
    <SecretKeyFormModal
      isLoading={mutateFormStatus.isLoading}
      onClose={handleClose}
      isOpen={isOpen}
      publicKey={publicKey}
      modalActionText={modalTitle}
      submitButtonText={submitButton}
      onSubmit={onSubmit}
      hasAck
      header={
        hasAnsweredOrigin ? <OpenFormProgress currActiveIdx={1} /> : undefined
      }
      // Replaces the question modal: the frame appears at once, so the
      // settings page doesn't show through, and the content slides in like
      // the next step when creating a form.
      slideIn={hasAnsweredOrigin}
    />
  )
}
